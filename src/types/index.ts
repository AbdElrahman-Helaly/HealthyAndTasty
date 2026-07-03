export interface Permissions {
  canManageBranches: boolean;
  canManageEmployees: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canSendNotifications: boolean;
  canViewAuditLogs: boolean;
  canManageCountries: boolean;
}

export type PermissionKey = keyof Permissions;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permissions;
}

export interface AuthUser {
  id: string;
  /** userId from the API response */
  userId: string;
  displayName: string;
  employeeCode: string;
  branchId: string;
  roles: string[];
  /** Convenience: first role string, or 'Employee' */
  roleName: string;
}

export interface LoginCredentials {
  employeeCode: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  isActive: boolean;
  branchCount?: number;
  employeeCount?: number;
  productCount?: number;
}

export interface CountryStats {
  branchCount: number;
  activeBranches: number;
  employeeCount: number;
  productCount: number;
  importsThisMonth: number;
}

export interface CountryDetails extends Country {
  stats: CountryStats;
  currency: string;
  timezone: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  parentId: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  nameAr: string;
  parentId: string | null;
  isActive: boolean;
}

export interface UpdateCategoryInput extends CreateCategoryInput {
  id: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  employeeCount?: number;
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface UpdateBranchRequest {
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface BranchEmployee {
  id: string;
  branchId: string;
  employeeCode: string;
  employeeName: string;
  branchName: string;
}

export interface CreateBranchEmployeeRequest {
  branchId: string;
  employeeCode: string;
  password: string;
  displayName: string;
}

export interface ChangeEmployeeRoleRequest {
  roleName: string;
}

export interface EmployeeRole {
  name: string;
}

export interface BranchDetails extends Branch {
  employees: EmployeeSummary[];
  recentImports: ImportRecord[];
  notifications: Notification[];
  activity: ActivityItem[];
}

export interface EmployeeSummary {
  id: string;
  code: string;
  displayName: string;
  role: string;
  isActive: boolean;
  branchId: string;
  branchName: string;
}

/** Shape returned by GET /api/employees (list) */
export interface Employee {
  id: string;
  /** userId field from API */
  userId: string;
  firstName: string;
  lastName: string;
  /** Computed: `${firstName} ${lastName}` */
  displayName: string;
  email: string;
  /** E.164 phone */
  phoneE164: string;
  employeeCode: string;
  /** Branch UUID */
  employeeBranchId: string;
  createdAt: string;
  role: string;
}

/** Shape returned by GET /api/employees/{id} */
export interface EmployeeDetails extends Employee {
  branch: Branch | null;
}

/** Body for PUT /api/employees/{id} */
export interface EmployeeUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneE164: string;
  employeeCode: string;
  employeeBranchId: string;
  password?: string;
}

/** Cursor-based paginated response */
export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

/** Role string returned by GET /api/roles */
export type ApiRole = string;

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  categoryName: string;
  countryCode: string;
  price: number;
  currency: string;
  isActive: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  branchId?: string;
  supplier?: string;
  productId?: string;
  description?: string;
  stockQuantity?: number;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  parentCategoryId?: string;
  branchId?: string;
  isActive?: boolean;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateProductBody {
  branchId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  isActive: boolean;
  categoryId: string;
  supplier?: string;
  productId?: string;
  description?: string;
  stockQuantity?: number;
}

export interface UpdateProductBody {
  branchId: string;
  name: string;
  price: number;
  currency: string;
  isActive: boolean;
  categoryId: string;
  supplier?: string;
  productId?: string;
  description?: string;
  stockQuantity?: number;
}

export interface ImportHistoryRecord {
  id: string;
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  fileName: string;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  uploadedAtUtc: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  targetType: 'all' | 'country' | 'branch';
  targetId?: string;
  targetLabel?: string;
}

export interface SendNotificationInput {
  title: string;
  message: string;
  targetType: 'all' | 'country' | 'branch';
  targetId?: string;
}

export interface DashboardKpis {
  totalCountries: number;
  totalBranches: number;
  activeBranches: number;
  totalEmployees: number;
  activeEmployees: number;
  totalProducts: number;
  importsToday: number;
  importsThisWeek: number;
  importsThisMonth: number;
  failedImports: number;
}

export interface ImportRecord {
  id: string;
  fileName: string;
  branchId: string;
  branchName: string;
  employeeId: string;
  employeeName: string;
  status: 'success' | 'failed' | 'partial';
  productsImported: number;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
}

export interface SearchResultItem {
  id: string;
  type: 'branch' | 'employee' | 'product' | 'category';
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResults {
  branches: SearchResultItem[];
  employees: SearchResultItem[];
  products: SearchResultItem[];
  categories: SearchResultItem[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export interface Banner {
  id: string;
  imageUrl: string;
  categoryId: string;
  productId: string;
  actionType: number;
  isActive: boolean;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface ActionTypeOption {
  value: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  country: string;
  postalCode?: string | null;
  phoneE164?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export interface CreateAddressRequest {
  line1: string;
  city: string;
  region: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  label: string;
  line2?: string | null;
  postalCode?: string | null;
  phoneE164?: string | null;
  setAsDefault?: boolean;
}

export interface UpdateAddressRequest {
  line1: string;
  city: string;
  region: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  label: string;
  line2?: string | null;
  postalCode?: string | null;
  phoneE164?: string | null;
}

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export interface DiscountTypeOption {
  value: number;
  name: string; // "Percentage" | "FixedAmount" | "BuyXGetY" | "Bundle" | "FreeShipping" | "Tiered"
}

export interface DiscountTargetOption {
  value: number;
  name: string; // "AllProducts" | "SpecificProducts" | "SpecificCategories" | "OrderLevel"
}

export interface Discount {
  id: string;
  name: string;
  couponCode: string | null;
  type: DiscountTypeOption;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  target: DiscountTargetOption;
  ruleConfigurationJson: string | null;
  productIds: string[];
  categoryIds: string[];
}

export interface CreateDiscountBody {
  name: string;
  type: number;
  value: number;
  target: number;
  couponCode?: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  perUserLimit: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  ruleConfigurationJson?: string;
  productIds: string[];
  categoryIds: string[];
}

export interface UpdateDiscountBody extends CreateDiscountBody {
  isActive: boolean;
}

