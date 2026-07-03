import { env } from '@/config/env';
import { getSelectedCountryPrefix } from '@/context/CountryContext';
import type {
  Address,
  ApiErrorPayload,
  ApiRole,
  Branch,
  BranchEmployee,
  Category,
  ChangeEmployeeRoleRequest,
  Country,
  CreateAddressRequest,
  CreateBranchEmployeeRequest,
  CreateBranchRequest,
  CreateCategoryInput,
  CursorPagedResponse,
  Employee,
  EmployeeDetails,
  EmployeeRole,
  EmployeeUpdateRequest,
  ImportHistoryRecord,
  LoginCredentials,
  LoginResponse,
  Notification,
  PaginatedResponse,
  Product,
  ProductListParams,
  CreateProductBody,
  UpdateProductBody,
  RefreshTokenResponse,
  SendNotificationInput,
  UpdateAddressRequest,
  UpdateBranchRequest,
  UpdateCategoryInput,
} from '@/types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorPayload,
  ) {
    super(payload.message ?? payload.error ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Auth storage keys — single source of truth
// ---------------------------------------------------------------------------
export const TOKEN_KEY = 'ht_superadmin_token';
const REFRESH_KEY = 'ht_superadmin_refresh_token';
const USER_ID_KEY = 'ht_superadmin_user_id';
const TOKEN_EXP_KEY = 'ht_superadmin_token_exp';
// USER_KEY is owned by AuthContext but read here for userId
const USER_KEY = 'ht_superadmin_user';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  // Strip any accidentally stored "Bearer " prefix — we always add it ourselves
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function getUserId(): string | null {
  // Prefer dedicated key; fall back to parsing the user JSON
  const direct = localStorage.getItem(USER_ID_KEY);
  if (direct) return direct;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as { userId?: string; id?: string };
    return u.userId ?? u.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT's exp claim without any library.
 * Returns the expiry as a Unix timestamp (seconds), or null on failure.
 */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → base64 → decode
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    const obj = JSON.parse(json) as { exp?: number };
    return typeof obj.exp === 'number' ? obj.exp : null;
  } catch {
    return null;
  }
}

/**
 * Persist tokens + expiry after a successful login or refresh.
 */
export function storeTokens(accessToken: string, refreshToken: string, userId?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
  const exp = decodeJwtExp(accessToken);
  if (exp !== null) {
    localStorage.setItem(TOKEN_EXP_KEY, String(exp));
  } else {
    localStorage.removeItem(TOKEN_EXP_KEY);
  }
}

/**
 * Clear all auth-related storage and redirect to login.
 */
export function clearAuthAndRedirect(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

/**
 * Returns true if the stored access token is missing or expires within
 * `thresholdSeconds` seconds (default 60 s).
 */
function isTokenExpiredOrExpiring(thresholdSeconds = 60): boolean {
  const token = getToken();
  if (!token) return true;
  const expStr = localStorage.getItem(TOKEN_EXP_KEY);
  if (!expStr) {
    // No stored exp — try to decode it live
    const exp = decodeJwtExp(token);
    if (exp === null) return false; // Can't tell — assume valid
    return Date.now() / 1000 >= exp - thresholdSeconds;
  }
  const exp = Number(expStr);
  return Date.now() / 1000 >= exp - thresholdSeconds;
}

// ---------------------------------------------------------------------------
// Refresh logic — serialised so concurrent requests don't all refresh at once
// ---------------------------------------------------------------------------
let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const refreshToken = getRefreshToken();
  const userId = getUserId();

  if (!refreshToken || !userId) {
    clearAuthAndRedirect();
    throw new ApiError(401, { message: 'Session expired' });
  }

  const url = `${env.apiBaseUrl}/api/auth/refresh`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, refreshToken }),
  });

  if (!response.ok) {
    clearAuthAndRedirect();
    throw new ApiError(401, { message: 'Session expired — please log in again' });
  }

  const data = (await response.json()) as RefreshTokenResponse;
  storeTokens(data.accessToken, data.refreshToken, userId);
}

async function ensureFreshToken(): Promise<void> {
  if (!isTokenExpiredOrExpiring()) return;

  // Serialise: if a refresh is already in flight, wait for it
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

/**
 * Paths that must NOT get the country prefix injected.
 * Auth and countries endpoints are global — not scoped to a region.
 */
const GLOBAL_PATHS = [
  '/api/auth/',
  '/api/countries',
  '/api/me/',
  '/api/employees',
  '/api/roles',
  '/api/users',
  '/api/branches',
  '/api/notifications',
  '/api/admin/banners',
  '/api/banners/action-types',
  '/api/admin/discounts',
];

function resolveUrl(path: string): string {
  const isGlobal = GLOBAL_PATHS.some((prefix) => path.startsWith(prefix));
  const resolvedPath = isGlobal ? path : `${getSelectedCountryPrefix()}${path}`;
  // env.apiBaseUrl is empty in dev — requests go through Vite proxy (/api → backend)
  return `${env.apiBaseUrl}${resolvedPath}`;
}

// ---------------------------------------------------------------------------
// Central request function — all API calls route through here
// ---------------------------------------------------------------------------

/**
 * @param retrying - internal flag; prevents infinite 401 → refresh → retry loops
 */
export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
  retrying = false,
): Promise<T> {
  // Proactively refresh if the token is about to expire
  if (auth) {
    await ensureFreshToken();
  }

  const url = resolveUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Reactive 401 handling — try refresh once then retry the original request
  if (response.status === 401 && auth && !retrying) {
    try {
      await doRefresh();
    } catch {
      // doRefresh already called clearAuthAndRedirect()
      throw new ApiError(401, { message: 'Session expired' });
    }
    return request<T>(method, path, body, auth, true /* retrying */);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      /* non-JSON body */
    }
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function sanitizeCountry(raw: unknown): Country | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const code = typeof r.code === 'string' ? r.code : typeof r.id === 'string' ? r.id : '';
  const name = typeof r.name === 'string' ? r.name : '';
  if (!code || !name) return null;
  return {
    id: typeof r.id === 'string' ? r.id : code.toLowerCase(),
    code: code.toUpperCase(),
    name,
    nameAr: typeof r.nameAr === 'string' ? r.nameAr : name,
    isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
    branchCount: typeof r.branchCount === 'number' ? r.branchCount : undefined,
    employeeCount: typeof r.employeeCount === 'number' ? r.employeeCount : undefined,
    productCount: typeof r.productCount === 'number' ? r.productCount : undefined,
  };
}

function sanitizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name : '';
  const id = typeof r.id === 'string' ? r.id : '';
  if (!id || !name) return null;
  return {
    id,
    name,
    nameAr: typeof r.nameAr === 'string' ? r.nameAr : name,
    parentId: typeof r.parentId === 'string' ? r.parentId : r.parentId === null ? null : null,
    isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
    productCount: typeof r.productCount === 'number' ? r.productCount : 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

function sanitizeBranch(raw: unknown): Branch | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name : '';
  if (!name) return null;

  // The API may return country as a number (enum) or as a string/object.
  // We normalise both forms into countryId/countryCode/countryName.
  let countryId = '';
  let countryCode = '';
  let countryName = '';

  if (typeof r.country === 'number') {
    const countryMap: Record<number, { id: string; code: string; name: string }> = {
      1: { id: 'eg', code: 'EG', name: 'Egypt' },
      2: { id: 'sa', code: 'SA', name: 'Saudi Arabia' },
      3: { id: 'ae', code: 'AE', name: 'UAE' },
    };
    const info = countryMap[r.country] ?? { id: 'eg', code: 'EG', name: 'Egypt' };
    countryId = info.id;
    countryCode = info.code;
    countryName = info.name;
  } else if (typeof r.country === 'string') {
    countryCode = r.country.toUpperCase();
    countryId = r.country.toLowerCase();
    countryName = r.country;
  } else if (typeof r.countryCode === 'string') {
    countryCode = r.countryCode.toUpperCase();
    countryId = typeof r.countryId === 'string' ? r.countryId : r.countryCode.toLowerCase();
    countryName = typeof r.countryName === 'string' ? r.countryName : r.countryCode;
  }

  return {
    id: typeof r.id === 'string' ? r.id : '',
    code: typeof r.code === 'string' ? r.code : '',
    name: name.trim(),
    countryId,
    countryCode,
    countryName,
    latitude: typeof r.latitude === 'number' ? r.latitude : 0,
    longitude: typeof r.longitude === 'number' ? r.longitude : 0,
    isActive: typeof r.isActive === 'boolean' ? r.isActive : false,
    employeeCount: typeof r.employeeCount === 'number' ? r.employeeCount : undefined,
  };
}

function normalizeCountry(raw: unknown): { id: string; code: string; name: string } {
  if (typeof raw === 'number') {
    const countryMap: Record<number, { id: string; code: string; name: string }> = {
      1: { id: 'eg', code: 'EG', name: 'Egypt' },
      2: { id: 'sa', code: 'SA', name: 'Saudi Arabia' },
      3: { id: 'ae', code: 'AE', name: 'UAE' },
    };
    return countryMap[raw] ?? { id: 'eg', code: 'EG', name: 'Egypt' };
  }

  if (typeof raw === 'string') {
    const code = raw.toUpperCase();
    const countryMap: Record<string, { id: string; code: string; name: string }> = {
      EG: { id: 'eg', code: 'EG', name: 'Egypt' },
      SA: { id: 'sa', code: 'SA', name: 'Saudi Arabia' },
      AE: { id: 'ae', code: 'AE', name: 'UAE' },
    };
    return countryMap[code] ?? { id: code.toLowerCase(), code, name: code };
  }

  return { id: '', code: '', name: '' };
}

function sanitizeBranchEmployee(raw: unknown): BranchEmployee | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id =
    typeof r.id === 'string' && r.id
      ? r.id
      : typeof r.userId === 'string' && r.userId
      ? r.userId
      : '';
  const employeeCode =
    typeof r.employeeCode === 'string' ? r.employeeCode : typeof r.code === 'string' ? r.code : '';
  // Must have at least id or employeeCode to be a valid record
  if (!id && !employeeCode) return null;
  return {
    id: id || employeeCode,
    branchId: typeof r.branchId === 'string' ? r.branchId : '',
    employeeCode,
    displayName:
      typeof r.displayName === 'string'
        ? r.displayName
        : typeof r.name === 'string'
        ? r.name
        : '',
    roleName:
      typeof r.roleName === 'string'
        ? r.roleName
        : typeof r.role === 'string'
        ? r.role
        : 'Employee',
    isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
    createdAt:
      typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
}

function sanitizeEmployeeRole(raw: unknown): EmployeeRole | null {
  if (!raw) return null;
  if (typeof raw === 'string') return { name: raw };
  if (typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name : typeof r.roleName === 'string' ? r.roleName : '';
    if (!name) return null;
    return { name };
  }
  return null;
}

function sanitizeEmployee(raw: unknown): Employee | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'string' ? r.id : '';
  const userId = typeof r.userId === 'string' ? r.userId : id;
  const employeeCode =
    typeof r.employeeCode === 'string'
      ? r.employeeCode
      : typeof r.code === 'string'
      ? r.code
      : '';
  const firstName = typeof r.firstName === 'string' ? r.firstName.trim() : '';
  const lastName = typeof r.lastName === 'string' ? r.lastName.trim() : '';

  // Need at least one identifier
  if (!id && !userId && !employeeCode) return null;

  return {
    id: id || userId || employeeCode,
    userId: userId || id || employeeCode,
    firstName,
    lastName,
    displayName:
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || userId || id,
    email: typeof r.email === 'string' ? r.email : '',
    phoneE164:
      typeof r.phoneE164 === 'string'
        ? r.phoneE164
        : typeof r.phone === 'string'
        ? r.phone
        : '',
    employeeCode,
    employeeBranchId:
      typeof r.employeeBranchId === 'string'
        ? r.employeeBranchId
        : typeof r.branchId === 'string'
        ? r.branchId
        : '',
    createdAt:
      typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    role: typeof r.role === 'string' ? r.role : 'Employee',
  };
}

function sanitizeNotification(raw: unknown): Notification | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === 'string' ? r.title : '';
  const id = typeof r.id === 'string' ? r.id : '';
  if (!id || !title) return null;
  const targetType = r.targetType === 'country' || r.targetType === 'branch' ? r.targetType : 'all';
  return {
    id,
    title,
    message: typeof r.message === 'string' ? r.message : typeof r.body === 'string' ? r.body : '',
    isRead: typeof r.isRead === 'boolean' ? r.isRead : false,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    targetType,
    targetId: typeof r.targetId === 'string' ? r.targetId : undefined,
    targetLabel: typeof r.targetLabel === 'string' ? r.targetLabel : undefined,
  };
}

function sanitizeArray<T>(items: unknown, sanitizer: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizer).filter((item): item is T => item !== null);
}

function getTotalCount(raw: Record<string, unknown>, fallback: number): number {
  return typeof raw.total === 'number'
    ? raw.total
    : typeof raw.totalCount === 'number'
    ? raw.totalCount
    : typeof raw.count === 'number'
    ? raw.count
    : fallback;
}

function sanitizeAddress(raw: unknown): Address | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  const label = typeof r.label === 'string' ? r.label : '';
  const line1 = typeof r.line1 === 'string' ? r.line1 : '';
  const city = typeof r.city === 'string' ? r.city : '';
  const region = typeof r.region === 'string' ? r.region : '';
  const country = normalizeCountry(r.country).code;
  if (!id || !line1 || !city) return null;
  return {
    id,
    label,
    line1,
    line2: typeof r.line2 === 'string' ? r.line2 : r.line2 === null ? null : null,
    city,
    region,
    country,
    postalCode: typeof r.postalCode === 'string' ? r.postalCode : r.postalCode === null ? null : null,
    phoneE164: typeof r.phoneE164 === 'string' ? r.phoneE164 : r.phoneE164 === null ? null : null,
    latitude: typeof r.latitude === 'number' ? r.latitude : r.latitude === null ? null : null,
    longitude: typeof r.longitude === 'number' ? r.longitude : r.longitude === null ? null : null,
    isDefault: typeof r.isDefault === 'boolean' ? r.isDefault : false,
  };
}

function sanitizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  const sku = typeof r.sku === 'string' ? r.sku : '';
  const name = typeof r.name === 'string' ? r.name : '';
  if (!id && !sku) return null;
  return {
    id: id || sku,
    sku,
    name,
    nameAr: typeof r.nameAr === 'string' ? r.nameAr : name,
    categoryId: typeof r.categoryId === 'string' ? r.categoryId : '',
    categoryName: typeof r.categoryName === 'string' ? r.categoryName : '',
    countryCode: typeof r.countryCode === 'string' ? r.countryCode : '',
    price: typeof r.price === 'number' ? r.price : 0,
    currency: typeof r.currency === 'string' ? r.currency : 'EGP',
    isActive: typeof r.isActive === 'boolean' ? r.isActive : true,
    stockStatus:
      r.stockStatus === 'in_stock' || r.stockStatus === 'low_stock' || r.stockStatus === 'out_of_stock'
        ? (r.stockStatus as Product['stockStatus'])
        : 'in_stock',
    branchId: typeof r.branchId === 'string' ? r.branchId : undefined,
    supplier: typeof r.supplier === 'string' ? r.supplier : undefined,
    productId: typeof r.productId === 'string' ? r.productId : undefined,
    description: typeof r.description === 'string' ? r.description : undefined,
    stockQuantity: typeof r.stockQuantity === 'number' ? r.stockQuantity : undefined,
  };
}

function sanitizeProductPage(
  raw: unknown,
  params: { page?: number; pageSize?: number },
): PaginatedResponse<Product> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  if (Array.isArray(raw)) {
    return { items: sanitizeArray(raw, sanitizeProduct), total: raw.length, page, pageSize };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = r.items ?? r.data ?? r.products;
    return {
      items: sanitizeArray(items, sanitizeProduct),
      total: getTotalCount(r, Array.isArray(items) ? items.length : 0),
      page: typeof r.page === 'number' ? r.page : page,
      pageSize: typeof r.pageSize === 'number' ? r.pageSize : pageSize,
    };
  }
  return { items: [], total: 0, page, pageSize };
}

function sanitizeImportHistoryRecord(raw: unknown): ImportHistoryRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  if (!id) return null;
  return {
    id,
    userId: typeof r.userId === 'string' ? r.userId : '',
    userName: typeof r.userName === 'string' ? r.userName : typeof r.userDisplayName === 'string' ? r.userDisplayName : '',
    branchId: typeof r.branchId === 'string' ? r.branchId : '',
    branchName: typeof r.branchName === 'string' ? r.branchName : '',
    fileName: typeof r.fileName === 'string' ? r.fileName : typeof r.file === 'string' ? r.file : '',
    createdCount: typeof r.createdCount === 'number' ? r.createdCount : typeof r.created === 'number' ? r.created : 0,
    updatedCount: typeof r.updatedCount === 'number' ? r.updatedCount : typeof r.updated === 'number' ? r.updated : 0,
    failedCount: typeof r.failedCount === 'number' ? r.failedCount : typeof r.failed === 'number' ? r.failed : 0,
    uploadedAtUtc: typeof r.uploadedAtUtc === 'string' ? r.uploadedAtUtc : typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
}

function sanitizeImportHistoryPage(
  raw: unknown,
  params: { page?: number; pageSize?: number },
): PaginatedResponse<ImportHistoryRecord> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  if (Array.isArray(raw)) {
    return { items: sanitizeArray(raw, sanitizeImportHistoryRecord), total: raw.length, page, pageSize };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const items = r.items ?? r.data ?? r.history;
    return {
      items: sanitizeArray(items, sanitizeImportHistoryRecord),
      total: getTotalCount(r, Array.isArray(items) ? items.length : 0),
      page: typeof r.page === 'number' ? r.page : page,
      pageSize: typeof r.pageSize === 'number' ? r.pageSize : pageSize,
    };
  }
  return { items: [], total: 0, page, pageSize };
}

export const api = {
  auth: {
    /**
     * POST /api/auth/branch-employee/login
     * Throws ApiError on bad credentials — no silent fallback.
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
      const raw = await request<unknown>(
        'POST',
        '/api/auth/branch-employee/login',
        { employeeCode: credentials.employeeCode, password: credentials.password },
        false, // no auth header on login
      );

      if (!raw || typeof raw !== 'object') {
        throw new ApiError(500, { message: 'Invalid login response from server' });
      }

      const r = raw as Record<string, unknown>;

      const accessToken = typeof r.accessToken === 'string' ? r.accessToken : '';
      const refreshToken = typeof r.refreshToken === 'string' ? r.refreshToken : '';
      const userId = typeof r.userId === 'string' ? r.userId : '';
      const branchId = typeof r.branchId === 'string' ? r.branchId : '';
      const employeeCode = typeof r.employeeCode === 'string' ? r.employeeCode : credentials.employeeCode;
      const displayName = typeof r.displayName === 'string' ? r.displayName : employeeCode;
      const roles = Array.isArray(r.roles)
        ? (r.roles as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];

      if (!accessToken) {
        throw new ApiError(500, { message: 'No access token in login response' });
      }

      const user: import('@/types').AuthUser = {
        id: userId,
        userId,
        displayName,
        employeeCode,
        branchId,
        roles,
        roleName: roles[0] ?? 'Employee',
      };

      return { accessToken, refreshToken, user };
    },

    /**
     * POST /api/auth/refresh
     * Used internally by request() — not typically called by consumers directly.
     */
    async refresh(userId: string, refreshToken: string): Promise<RefreshTokenResponse> {
      return request<RefreshTokenResponse>(
        'POST',
        '/api/auth/refresh',
        { userId, refreshToken },
        false,
      );
    },
  },

  countries: {
    async list(): Promise<Country[]> {
      try {
        const raw = await request<unknown>('GET', '/api/countries');
        if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeCountry);
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          const items = r.items ?? r.data ?? r.countries;
          return sanitizeArray(items, sanitizeCountry);
        }
      } catch {
        // 404 or server unavailable — caller will use fallback
      }
      return [];
    },

    async getById(id: string): Promise<Country | null> {
      try {
        const raw = await request<unknown>('GET', `/api/countries/${encodeURIComponent(id)}`);
        return sanitizeCountry(raw);
      } catch {
        return null;
      }
    },
  },

  categories: {
    async list(params: { page?: number; pageSize?: number; search?: string; isActive?: boolean } = {}): Promise<Category[]> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.search) qs.set('search', params.search);
      if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
      const query = qs.toString();
      const raw = await request<unknown>('GET', `/categories${query ? `?${query}` : ''}`);
      if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeCategory);
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        return sanitizeArray(r.items ?? r.data, sanitizeCategory);
      }
      return [];
    },

    async getById(id: string): Promise<Category | null> {
      const raw = await request<unknown>('GET', `/categories/${encodeURIComponent(id)}`);
      return sanitizeCategory(raw);
    },

    async listSubcategories(
      parentId: string,
      params: { page?: number; pageSize?: number; search?: string; isActive?: boolean } = {},
    ): Promise<Category[]> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.search) qs.set('search', params.search);
      if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
      const query = qs.toString();
      const raw = await request<unknown>(
        'GET',
        `/categories/${encodeURIComponent(parentId)}/subcategories${query ? `?${query}` : ''}`,
      );
      if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeCategory);
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        return sanitizeArray(r.items ?? r.data ?? r.subcategories, sanitizeCategory);
      }
      return [];
    },

    async create(input: CreateCategoryInput): Promise<Category> {
      const raw = await request<unknown>('POST', '/categories', input);
      const category = sanitizeCategory(raw);
      if (!category) throw new ApiError(500, { message: 'Invalid category response' });
      return category;
    },

    async update(input: UpdateCategoryInput): Promise<Category> {
      const raw = await request<unknown>('PUT', `/categories/${encodeURIComponent(input.id)}`, input);
      const category = sanitizeCategory(raw);
      if (!category) throw new ApiError(500, { message: 'Invalid category response' });
      return category;
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/categories/${encodeURIComponent(id)}`);
    },
  },

  branches: {
    async list(country?: string): Promise<Branch[]> {
      try {
        const params = new URLSearchParams();
        if (country) params.set('country', country);
        const query = params.toString();
        const raw = await request<unknown>('GET', `/api/branches${query ? `?${query}` : ''}`);
        if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeBranch);
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          return sanitizeArray(r.items ?? r.data ?? r.branches, sanitizeBranch);
        }
      } catch {
        // 502/503 or server unavailable — return empty, caller handles fallback
      }
      return [];
    },

    async getById(id: string): Promise<Branch | null> {
      const raw = await request<unknown>('GET', `/api/branches/${encodeURIComponent(id)}`);
      return sanitizeBranch(raw);
    },

    async create(payload: CreateBranchRequest): Promise<Branch> {
      const raw = await request<unknown>('POST', '/api/branches', payload);
      const branch = sanitizeBranch(raw);
      if (!branch) throw new ApiError(500, { message: 'Invalid branch response from server' });
      return branch;
    },

    async update(id: string, payload: UpdateBranchRequest): Promise<Branch> {
      const raw = await request<unknown>('PUT', `/api/branches/${encodeURIComponent(id)}`, payload);
      const branch = sanitizeBranch(raw);
      if (!branch) throw new ApiError(500, { message: 'Invalid branch response from server' });
      return branch;
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/api/branches/${encodeURIComponent(id)}`);
    },
  },

  branchEmployees: {
    async list(params: {
      page?: number;
      pageSize?: number;
      branchId?: string;
    }): Promise<PaginatedResponse<BranchEmployee>> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.branchId) qs.set('branchId', params.branchId);
      const raw = await request<unknown>('GET', `/api/branches/employees?${qs.toString()}`);
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        const items = Array.isArray(r.items)
          ? r.items
          : Array.isArray(r.data)
          ? r.data
          : Array.isArray(raw)
          ? (raw as unknown[])
          : [];
        return {
          items: sanitizeArray(items, sanitizeBranchEmployee),
          total: typeof r.total === 'number' ? r.total : items.length,
          page: typeof r.page === 'number' ? r.page : params.page ?? 1,
          pageSize: typeof r.pageSize === 'number' ? r.pageSize : params.pageSize ?? 20,
        };
      }
      if (Array.isArray(raw)) {
        return {
          items: sanitizeArray(raw, sanitizeBranchEmployee),
          total: raw.length,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
        };
      }
      return { items: [], total: 0, page: 1, pageSize: 20 };
    },

    async create(payload: CreateBranchEmployeeRequest): Promise<BranchEmployee> {
      const raw = await request<unknown>('POST', '/api/branches/employees', payload);
      const employee = sanitizeBranchEmployee(raw);
      if (!employee) throw new ApiError(500, { message: 'Invalid employee response from server' });
      return employee;
    },

    async changeRole(id: string, payload: ChangeEmployeeRoleRequest): Promise<void> {
      await request<void>('PUT', `/api/branches/employees/${encodeURIComponent(id)}/role`, payload);
    },

    async getRoles(): Promise<EmployeeRole[]> {
      const raw = await request<unknown>('GET', '/api/branches/employees/roles');
      if (Array.isArray(raw)) {
        return sanitizeArray(raw, sanitizeEmployeeRole);
      }
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        return sanitizeArray(r.items ?? r.data ?? r.roles, sanitizeEmployeeRole);
      }
      return [];
    },
  },

  employees: {
    async list(limit = 20, cursor?: string): Promise<CursorPagedResponse<Employee>> {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (cursor) params.set('cursor', cursor);
      const raw = await request<unknown>('GET', `/api/employees?${params.toString()}`);
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        const items = Array.isArray(r.items)
          ? r.items
          : Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.employees)
          ? r.employees
          : [];
        const nextCursor =
          typeof r.nextCursor === 'string'
            ? r.nextCursor
            : typeof r.cursor === 'string'
            ? r.cursor
            : null;
        return {
          items: sanitizeArray(items, sanitizeEmployee),
          nextCursor,
        };
      }
      if (Array.isArray(raw)) {
        return { items: sanitizeArray(raw, sanitizeEmployee), nextCursor: null };
      }
      return { items: [], nextCursor: null };
    },

    async getById(id: string): Promise<EmployeeDetails | null> {
      const raw = await request<unknown>('GET', `/api/employees/${encodeURIComponent(id)}`);
      const base = sanitizeEmployee(raw);
      if (!base) return null;
      // Try to attach branch if branchId is present
      let branch: Branch | null = null;
      if (base.employeeBranchId) {
        try {
          branch = await api.branches.getById(base.employeeBranchId);
        } catch {
          /* branch fetch is non-critical */
        }
      }
      return { ...base, branch };
    },

    async update(id: string, payload: EmployeeUpdateRequest): Promise<Employee> {
      const raw = await request<unknown>('PUT', `/api/employees/${encodeURIComponent(id)}`, payload);
      const employee = sanitizeEmployee(raw);
      if (!employee) throw new ApiError(500, { message: 'Invalid employee response from server' });
      return employee;
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/api/employees/${encodeURIComponent(id)}`);
    },
  },

  roles: {
    async list(): Promise<ApiRole[]> {
      const raw = await request<unknown>('GET', '/api/roles');
      if (Array.isArray(raw)) {
        return raw.filter((r): r is string => typeof r === 'string');
      }
      return [];
    },
  },

  users: {
    async changeRole(userId: string, newRole: string): Promise<void> {
      await request<void>('PUT', `/api/users/${encodeURIComponent(userId)}/role?newRole=${encodeURIComponent(newRole)}`);
    },
  },

  notifications: {
    async list(): Promise<Notification[]> {
      try {
        const raw = await request<unknown>('GET', '/notifications');
        if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeNotification);
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          return sanitizeArray(r.items ?? r.data, sanitizeNotification);
        }
      } catch {
        // 404 or server unavailable — caller will use fallback
      }
      return [];
    },

    async send(input: SendNotificationInput): Promise<Notification> {
      const raw = await request<unknown>('POST', '/notifications', input);
      const notification = sanitizeNotification(raw);
      if (!notification) throw new ApiError(500, { message: 'Invalid notification response' });
      return notification;
    },

    async markAsRead(id: string): Promise<void> {
      await request<void>('PATCH', `/notifications/${encodeURIComponent(id)}/read`);
    },
  },

  addresses: {
    async list(): Promise<Address[]> {
      const raw = await request<unknown>('GET', '/api/me/addresses');
      if (Array.isArray(raw)) return sanitizeArray(raw, sanitizeAddress);
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        return sanitizeArray(r.items ?? r.data ?? r.addresses, sanitizeAddress);
      }
      return [];
    },

    async getById(id: string): Promise<Address | null> {
      const raw = await request<unknown>('GET', `/api/me/addresses/${encodeURIComponent(id)}`);
      return sanitizeAddress(raw);
    },

    async create(payload: CreateAddressRequest): Promise<Address> {
      const raw = await request<unknown>('POST', '/api/me/addresses', payload);
      const address = sanitizeAddress(raw);
      if (!address) throw new ApiError(500, { message: 'Invalid address response from server' });
      return address;
    },

    async update(id: string, payload: UpdateAddressRequest): Promise<Address> {
      const raw = await request<unknown>('PUT', `/api/me/addresses/${encodeURIComponent(id)}`, payload);
      const address = sanitizeAddress(raw);
      if (!address) throw new ApiError(500, { message: 'Invalid address response from server' });
      return address;
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/api/me/addresses/${encodeURIComponent(id)}`);
    },

    async setDefault(id: string): Promise<void> {
      await request<void>('PUT', `/api/me/addresses/${encodeURIComponent(id)}/default`);
    },
  },

  products: {
    async list(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.search) qs.set('search', params.search);
      if (params.categoryId) qs.set('categoryId', params.categoryId);
      if (params.parentCategoryId) qs.set('parentCategoryId', params.parentCategoryId);
      if (params.branchId) qs.set('branchId', params.branchId);
      if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
      if (params.supplier) qs.set('supplier', params.supplier);
      if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
      if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
      const query = qs.toString();
      const raw = await request<unknown>('GET', `/products${query ? `?${query}` : ''}`);
      return sanitizeProductPage(raw, params);
    },

    async listByBranch(branchId: string, params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.search) qs.set('search', params.search);
      const query = qs.toString();
      const raw = await request<unknown>('GET', `/products/branches/${encodeURIComponent(branchId)}${query ? `?${query}` : ''}`);
      return sanitizeProductPage(raw, params);
    },

    async getById(id: string): Promise<Product | null> {
      const raw = await request<unknown>('GET', `/products/${encodeURIComponent(id)}`);
      return sanitizeProduct(raw);
    },

    async create(body: CreateProductBody): Promise<Product> {
      const raw = await request<unknown>('POST', '/products', body);
      const product = sanitizeProduct(raw);
      if (!product) throw new ApiError(500, { message: 'Invalid product response from server' });
      return product;
    },

    async update(id: string, body: UpdateProductBody): Promise<Product> {
      const raw = await request<unknown>('PUT', `/products/${encodeURIComponent(id)}`, body);
      const product = sanitizeProduct(raw);
      if (!product) throw new ApiError(500, { message: 'Invalid product response from server' });
      return product;
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/products/${encodeURIComponent(id)}`);
    },

    async importExcel(file: File): Promise<{ message?: string }> {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const prefix = getSelectedCountryPrefix();
      const url = `${env.apiBaseUrl}${prefix}/products/import-excel`;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      if (!response.ok) {
        let payload: ApiErrorPayload = {};
        try { payload = (await response.json()) as ApiErrorPayload; } catch { /* non-JSON */ }
        throw new ApiError(response.status, payload);
      }
      if (response.status === 204) return {};
      return response.json() as Promise<{ message?: string }>;
    },

    async importHistory(params: {
      page?: number;
      pageSize?: number;
      branchId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {}): Promise<PaginatedResponse<ImportHistoryRecord>> {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.branchId) qs.set('branchId', params.branchId);
      if (params.userId) qs.set('userId', params.userId);
      if (params.startDate) qs.set('startDate', params.startDate);
      if (params.endDate) qs.set('endDate', params.endDate);
      const query = qs.toString();
      const raw = await request<unknown>('GET', `/products/import-history${query ? `?${query}` : ''}`);
      return sanitizeImportHistoryPage(raw, params);
    },
  },

  /**
   * Banners — global endpoint, no country prefix (listed in GLOBAL_PATHS).
   * All methods route through request() so auth is handled identically to
   * every other endpoint in this file.
   */
  banners: {
    async list(): Promise<import('@/types').Banner[]> {
      const raw = await request<unknown>('GET', '/api/admin/banners');
      if (Array.isArray(raw)) return raw as import('@/types').Banner[];
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        const items = r.items ?? r.data ?? r.banners;
        if (Array.isArray(items)) return items as import('@/types').Banner[];
      }
      return [];
    },

    async getById(id: string): Promise<import('@/types').Banner> {
      return request<import('@/types').Banner>('GET', `/api/admin/banners/${encodeURIComponent(id)}`);
    },

    async delete(id: string): Promise<void> {
      await request<void>('DELETE', `/api/admin/banners/${encodeURIComponent(id)}`);
    },

    async toggle(id: string): Promise<{ id: string; isActive: boolean }> {
      return request<{ id: string; isActive: boolean }>(
        'PATCH',
        `/api/admin/banners/${encodeURIComponent(id)}/toggle`,
      );
    },

    async getActionTypes(): Promise<import('@/types').ActionTypeOption[]> {
      const raw = await request<unknown>('GET', '/api/banners/action-types');
      if (Array.isArray(raw)) return raw as import('@/types').ActionTypeOption[];
      return [];
    },
  },
};

