export type AccessMode = 'platform' | 'restaurant';
export type Role = 'platform' | 'admin' | 'waiter' | 'chef';
export type RestaurantStatus = 'active' | 'suspended';
export type TableStatus = 'idle' | 'active' | 'bill_requested';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'rejected';
export type BillStatus = 'draft' | 'issued' | 'paid';
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';
export type ChangeRequestType = 'slug_change' | 'table_count_increase' | 'table_count_decrease' | 'qr_regeneration';

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  access: AccessMode;
  restaurantSlug?: string;
  lockedUntil?: string | null;
  failedAttempts: number;
  lastLoginAt?: string;
}

export interface NotificationItem {
  id: string;
  scope: AccessMode;
  restaurantSlug?: string;
  message: string;
  unread: boolean;
  createdAt: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  floor: string;
  status: TableStatus;
  activeSessionId?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  itemCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  primaryCategoryId: string;
  categoryIds: string[];
  mrp: number;
  sellingPrice: number;
  dietaryType: 'veg' | 'non-veg' | 'vegan' | 'contains-egg';
  itemType: 'regular' | 'scheduled';
  schedule?: { from: string; until: string };
  spiceLevel?: 'mild' | 'medium' | 'hot';
  isAvailable: boolean;
  showRatings: boolean;
  pairings: string[];
  addonIds: string[];
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  linkedItemIds: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'waiter' | 'chef';
  status: 'active' | 'revoked';
  lastLoginAt?: string;
  sessionStatus: 'online' | 'offline' | 'revoked';
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  qty: number;
  notes?: string;
  status: 'confirmed' | 'preparing' | 'ready' | 'served' | 'rejected';
}

export interface OrderRecord {
  id: string;
  sessionId: string;
  tableId: string;
  tableNumber: string;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  items: OrderItem[];
  waiterName?: string;
}

export interface SessionRecord {
  id: string;
  tableId: string;
  tableNumber: string;
  openedAt: string;
  status: 'active' | 'closed';
  waiterName: string;
  customerTokenValid: boolean;
}

export interface BillRecord {
  id: string;
  sessionId: string;
  invoiceNumber: string;
  status: BillStatus;
  subtotal: number;
  tax: number;
  total: number;
  paidAt?: string;
}

export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  payload: string;
  restaurantSlug: string;
  raisedAt: string;
  actionedAt?: string;
  reason?: string;
}

export interface ContactQuery {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  message: string;
  status: 'open' | 'resolved' | 'spam';
}

export interface RegistrationLead {
  id: string;
  restaurantName: string;
  city: string;
  converted: boolean;
  createdAt: string;
}

export interface OperatingDay {
  day: string;
  isWeeklyOff: boolean;
  shifts: { open: string; close: string }[];
}

export interface AvailabilityLogEntry {
  id: string;
  itemName: string;
  changedBy: string;
  isAvailable: boolean;
  reason: 'manual' | 'chef_rejection';
  changedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  onboardedAt: string;
  tableCount: number;
  city: string;
  timezone: string;
  welcomeMessage: string;
  logoUrl: string;
  contactPhone: string;
  contactEmail: string;
  adminEmail: string;
  floors: { id: string; name: string }[];
  tables: RestaurantTable[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  addons: Addon[];
  staff: StaffMember[];
  sessions: SessionRecord[];
  orders: OrderRecord[];
  bills: BillRecord[];
  changeRequests: ChangeRequest[];
  operatingHours: OperatingDay[];
  availabilityLog: AvailabilityLogEntry[];
  gstRegistered: boolean;
  gstin: string;
  legalName: string;
  registeredAddress: string;
  slab: '5%' | '12%' | '18%';
  sacCode: string;
}

export interface AppState {
  restaurants: Restaurant[];
  users: ConsoleUser[];
  notifications: NotificationItem[];
  contactQueries: ContactQuery[];
  registrations: RegistrationLead[];
}

export interface AuthSession {
  userId: string;
  access: AccessMode;
  role: Role;
  restaurantSlug?: string;
  email: string;
  name: string;
  token: string;
  refreshToken: string;
  permissions: string[];
  restaurantId?: string;
  expiresAt: number;
}

export interface StoredState {
  auth: AuthSession | null;
  data: AppState;
}

export type ViewId =
  | 'dashboard'
  | 'restaurants'
  | 'change-requests'
  | 'qr-codes'
  | 'contacts'
  | 'registrations'
  | 'analytics'
  | 'settings'
  | 'tables'
  | 'orders'
  | 'billing'
  | 'menu'
  | 'staff'
  | 'reports'
  | 'notifications'
  | 'kitchen'
  | 'availability'
  | 'shift-history';
