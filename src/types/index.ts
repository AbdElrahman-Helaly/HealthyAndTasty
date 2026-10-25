// ---------------------------------------------------------------------------
// API envelope — every endpoint returns { success, message, data, errors, statusCode }
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  statusCode: number;
}

/** Paged response shape used by list endpoints */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  status?: number;
  errors?: string[];
}

// ---------------------------------------------------------------------------
// Dashboard Identity — auth
// ---------------------------------------------------------------------------

export interface DashboardLoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface CurrentEmployee {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  roleId: number;
  isActive: boolean;
}

export interface BranchAssignment {
  branchId: string;
  odooBranchId: number;
  name: string;
}

export interface DashboardRole {
  id: number;
  name: string;
  displayName: string;
}

export interface PermissionDto {
  id: number;
  name: string;
  displayName: string;
  module: string;
}

/** Login / refresh / me response — permissions is a list of permission name strings */
export interface DashboardAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: CurrentEmployee;
  assignedBranches: BranchAssignment[];
  role: DashboardRole;
  permissions: string[];
}

/** Normalised user persisted on the frontend */
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  roleId: number;
  isActive: boolean;
  permissions: string[];
  assignedBranches: BranchAssignment[];
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  roleId: number;
  isActive: boolean;
  isProfileCompleted: boolean;
  branchIds: string[];
  branchNames: string[];
  createdAt: string;
}

/** Create response adds temporaryPassword (shown exactly once) */
export interface EmployeeDetail extends Employee {
  temporaryPassword?: string | null;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  roleId: number;
  branchIds: string[];
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
}

export interface AssignBranchesRequest {
  branchIds: string[];
}

export interface AssignRoleRequest {
  roleId: number;
}

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

export interface RoleDto {
  id: number;
  name: string;
  displayName: string;
}

export interface SetRolePermissionsRequest {
  permissionIds: number[];
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ORDER_STATUS = {
  Pending: 1,
  Confirmed: 2,
  FailedToSync: 3,
  Cancelled: 4,
  Completed: 5,
  Preparing: 6,
  ReadyForDelivery: 7,
  OutForDelivery: 8,
  Delivered: 9,
  Rejected: 10,
} as const;

export type OrderStatusNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export const ORDER_STATUS_LABELS: Record<OrderStatusNumber, string> = {
  1: 'Pending',
  2: 'Confirmed',
  3: 'FailedToSync',
  4: 'Cancelled',
  5: 'Completed',
  6: 'Preparing',
  7: 'ReadyForDelivery',
  8: 'OutForDelivery',
  9: 'Delivered',
  10: 'Rejected',
};

export interface DashboardOrderListItem {
  id: number;
  orderNumber: string;
  odooOrderId: number;
  customerName: string;
  customerPhone: string;
  branchId: number;
  branchName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  statusNumber: OrderStatusNumber;
  itemsCount: number;
  createdAt: string;
}

export interface DashboardOrderItem {
  productId: number;
  productName: string;
  image: string;
  unitPrice: number;
  priceAfterDiscount: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  fromStatus: string;
  toStatus: string;
  note: string;
  changedByRole: string;
  createdAt: string;
}

export interface DashboardOrderDetail extends DashboardOrderListItem {
  rating?: number | null;
  ratingComment?: string | null;
  ratedAt?: string | null;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  adminRepliedBy?: string | number | null;
  deliveryEstimate?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
    estimatedDeliveryAt: string;
  } | null;
  deliveryAddress: string;
  addressLatitude: number;
  addressLongitude: number;
  couponCode: string;
  items: DashboardOrderItem[];
  history: OrderStatusHistory[];
  availableStatuses: OrderStatusNumber[];
}

export interface UpdateOrderStatusRequest {
  newStatus: OrderStatusNumber;
  note?: string;
}

export interface LiveOrdersColumn {
  statusNumber: OrderStatusNumber;
  status: string;
  orders: DashboardOrderListItem[];
}

export interface LiveOrdersBoard {
  columns: LiveOrdersColumn[];
}

export interface OrderStatusChangedEvent {
  order: DashboardOrderListItem;
  oldStatusNumber: OrderStatusNumber;
  newStatusNumber: OrderStatusNumber;
}

export interface OrderListParams {
  status?: OrderStatusNumber;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Branches (admin)
// ---------------------------------------------------------------------------

export interface BranchAdmin {
  id: string;
  odooBranchId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateBranchRequest {
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  address: string;
  isActive: boolean;
}

export interface CreateBranchRequest {
  odooBranchId: number;
  name: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  address: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Shipping Rates (admin)
// ---------------------------------------------------------------------------

export interface ShippingRate {
  fee?: number;
  id: string;
  branchId: string;
  branchName: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  baseFee: number;
  pricePerKm: number;
  isActive: boolean;
}

export interface CreateShippingRateRequest {
  branchId: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  baseFee: number;
  pricePerKm: number;
  isActive: boolean;
}

/** PUT body — every field is optional */
export interface UpdateShippingRateRequest {
  branchId?: string;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  baseFee?: number;
  pricePerKm?: number;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Catalog products (for offer product selection)
// ---------------------------------------------------------------------------

export interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  priceAfterDiscount: number;
  discount: number;
  image: string;
  available: boolean;
  categoryId: number;
  categoryName: string;
}

/** GET /api/catalog/products returns a paged list */
export interface CatalogProductPage {
  items: CatalogProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Products Inventory (/api/admin/products?branchId=&page=&pageSize=&search=)
// ---------------------------------------------------------------------------

export interface InventoryProduct {
  id: number;
  name: string;
  image: string;
  sku: string;
  categoryId: number | null;
  categoryName: string;
  price: number;
  priceAfterDiscount: number;
  discount: number;
  stock: number;
  isAvailable: boolean;
  branchId: number | string | null;
  branchName: string;
}

export interface InventoryListParams {
  branchId?: string | number;
  categoryId?: string | number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryPage {
  items: InventoryProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Offers (admin)
// ---------------------------------------------------------------------------

export interface Offer {
  id: number;
  title: string;
  description: string;
  image: string;
  imageName: string;
  discount: number;
  startDate: string;
  endDate: string;
  branchId: number;
  isActive: boolean;
  sortOrder: number;
  productIds: number[];
}

export interface CreateOfferRequest {
  title: string;
  description: string;
  image: string;
  imageName: string;
  discount: number;
  startDate: string;
  endDate: string;
  branchId: number;
  isActive: boolean;
  sortOrder: number;
  productIds: number[];
}

/** PUT body — every field is optional */
export interface UpdateOfferRequest {
  title?: string;
  description?: string;
  image?: string;
  imageName?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  branchId?: number;
  isActive?: boolean;
  sortOrder?: number;
  productIds?: number[];
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export interface StatusCount {
  statusNumber: OrderStatusNumber;
  status: string;
  count: number;
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface BranchRevenue {
  branchId: number;
  branchName: string;
  revenue: number;
  ordersCount: number;
}

export interface DashboardStatistics {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  failedToSyncOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  ordersByStatus: StatusCount[];
  topProducts: ProductPerformance[];
  revenueByBranch: BranchRevenue[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface DailySales {
  date: string;
  ordersCount: number;
  revenue: number;
}

export interface SalesReport {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  daily: DailySales[];
  byBranch: BranchRevenue[];
}

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  device: string | null;
  createdAt: string;
}

export interface AuditLogListParams {
  entity?: string;
  action?: string;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Notifications (admin)
// ---------------------------------------------------------------------------

export type NotificationAudienceType =
  | 'all_users'
  | 'specific_users'
  | 'active_users'
  | 'inactive_users'
  | 'new_users'
  | 'users_with_orders'
  | 'users_without_orders'
  | 'abandoned_cart_users'
  | 'customers_by_location'
  | 'customers_by_category'
  | 'frequent_customers'
  | 'customers_by_last_order';

export interface NotificationListItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  targetUrl: string | null;
  target: string;
  audienceType?: NotificationAudienceType | string | null;
  recipientCount?: number | null;
  deliveredCount?: number | null;
  failedCount?: number | null;
  sentBy: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationAudienceRequest {
  audienceType: NotificationAudienceType;
  includeGuests: boolean;
  userIds?: number[];
  activeWithinDays?: number;
  inactiveForDays?: number;
  registeredWithinDays?: number;
  abandonedCartForHours?: number;
  government?: string;
  city?: string;
  categoryId?: number;
  minOrdersCount?: number;
  lastOrderFrom?: string;
  lastOrderTo?: string;
}

export interface SendNotificationRequest extends NotificationAudienceRequest {
  title: string;
  body: string;
  targetUrl?: string | null;
  image?: File | null;
}

export interface NotificationAudiencePreview {
  totalRecipients: number;
  registeredUsers: number;
  guests: number;
  sample: Array<{
    name?: string | null;
    phone?: string | null;
    userId?: number | null;
    guestId?: string | null;
  }>;
}

export interface NotificationSendResult {
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  audienceType: NotificationAudienceType | string;
}

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------

export interface UserManagement {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  verified: boolean;
  isProfileCompleted: boolean;
  branchNames: string[];
  createdAt: string;
}

export interface UpdateUserRoleRequest {
  userId: number;
  role: string;
}

export interface AssignUserBranchRequest {
  userId: number;
  branchId: string;
}

// ---------------------------------------------------------------------------
// Admin Categories (/api/admin/categories)
// ---------------------------------------------------------------------------

export interface AdminCategory {
  id: number;
  name: string;
  homeDisplay: boolean;
  image: string;
  productsCount: number;
}

// ---------------------------------------------------------------------------
// Search (global)
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  id: string;
  type: 'branch' | 'employee' | 'order';
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResults {
  branches: SearchResultItem[];
  employees: SearchResultItem[];
  orders: SearchResultItem[];
}
