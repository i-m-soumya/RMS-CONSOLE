import type {
  AppState,
  NotificationItem,
  OperatingDay,
  Restaurant,
  RestaurantStatus,
  Role,
  StoredState,
  TableStatus,
} from './types';

export const STORAGE_KEY = 'rms-console-v2';
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatClock(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function humanizeStatus(value: string) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

export function buildOperatingHours(): OperatingDay[] {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
    day,
    isWeeklyOff: day === 'Sunday',
    shifts: day === 'Sunday' ? [] : [{ open: '11:00', close: '15:00' }, { open: '18:00', close: '23:00' }],
  }));
}

function buildRestaurant(seed: {
  name: string;
  slug: string;
  status: RestaurantStatus;
  tableCount: number;
  city: string;
  adminEmail: string;
  welcomeMessage: string;
  gstin: string;
}): Restaurant {
  const floors = [
    { id: makeId('floor'), name: 'Ground Floor' },
    { id: makeId('floor'), name: 'Upper Deck' },
  ];

  const tables = Array.from({ length: seed.tableCount }, (_, index) => ({
    id: makeId('table'),
    tableNumber: `${index + 1}`,
    capacity: index % 3 === 0 ? 6 : 4,
    floor: index < seed.tableCount / 2 ? floors[0].name : floors[1].name,
    status: (index === 0 ? 'active' : index === 2 ? 'bill_requested' : 'idle') as TableStatus,
    activeSessionId: index === 0 ? `${seed.slug}-session-1` : undefined,
  }));

  const menuCategories = [
    { id: makeId('cat'), name: 'Starters', displayOrder: 1, itemCount: 2 },
    { id: makeId('cat'), name: 'Mains', displayOrder: 2, itemCount: 2 },
    { id: makeId('cat'), name: 'Drinks', displayOrder: 3, itemCount: 1 },
  ];

  const menuItems = [
    {
      id: makeId('item'),
      name: 'House Salad',
      description: 'Fresh greens, citrus dressing, toasted seeds.',
      primaryCategoryId: menuCategories[0].id,
      categoryIds: [menuCategories[0].id],
      mrp: 180,
      sellingPrice: 160,
      dietaryType: 'vegan' as const,
      itemType: 'regular' as const,
      spiceLevel: 'mild' as const,
      isAvailable: true,
      showRatings: true,
      pairings: [],
      addonIds: [],
    },
    {
      id: makeId('item'),
      name: 'Signature Burger',
      description: 'Beef patty, cheddar, pickles, sesame bun.',
      primaryCategoryId: menuCategories[1].id,
      categoryIds: [menuCategories[1].id],
      mrp: 380,
      sellingPrice: 340,
      dietaryType: 'non-veg' as const,
      itemType: 'regular' as const,
      spiceLevel: 'medium' as const,
      isAvailable: true,
      showRatings: false,
      pairings: [],
      addonIds: [],
    },
  ];

  return {
    id: makeId('restaurant'),
    name: seed.name,
    slug: seed.slug,
    status: seed.status,
    onboardedAt: '2026-05-18T05:30:00Z',
    tableCount: seed.tableCount,
    city: seed.city,
    timezone: 'Asia/Kolkata',
    welcomeMessage: seed.welcomeMessage,
    logoUrl: 'https://dummyimage.com/160x160/0f172a/ffffff.png&text=RMS',
    contactPhone: '+91 98765 43210',
    contactEmail: `hello@${seed.slug}.in`,
    adminEmail: seed.adminEmail,
    floors,
    tables,
    menuCategories,
    menuItems,
    addons: [
      { id: makeId('addon'), name: 'Extra Cheese', price: 40, linkedItemIds: [menuItems[1].id] },
    ],
    staff: [
      { id: makeId('staff'), name: `${seed.name.split(' ')[0]} Admin`, email: seed.adminEmail, role: 'admin', status: 'active', lastLoginAt: '2026-07-11T04:20:00Z', sessionStatus: 'online' },
      { id: makeId('staff'), name: 'Asha Verma', email: `waiter@${seed.slug}.local`, role: 'waiter', status: 'active', lastLoginAt: '2026-07-11T06:15:00Z', sessionStatus: 'offline' },
      { id: makeId('staff'), name: 'Rahul Sen', email: `chef@${seed.slug}.local`, role: 'chef', status: 'active', lastLoginAt: '2026-07-11T06:00:00Z', sessionStatus: 'online' },
    ],
    sessions: [
      { id: `${seed.slug}-session-1`, tableId: tables[0].id, tableNumber: tables[0].tableNumber, openedAt: '2026-07-11T06:10:00Z', status: 'active', waiterName: 'Asha Verma', customerTokenValid: true },
    ],
    orders: [
      {
        id: makeId('order'),
        sessionId: `${seed.slug}-session-1`,
        tableId: tables[0].id,
        tableNumber: tables[0].tableNumber,
        status: 'pending',
        createdAt: '2026-07-11T06:20:00Z',
        notes: 'No onions',
        items: [{ id: makeId('order-item'), menuItemId: menuItems[1].id, name: menuItems[1].name, qty: 2, status: 'confirmed' }],
        waiterName: 'Asha Verma',
      },
    ],
    bills: [
      { id: makeId('bill'), sessionId: `${seed.slug}-session-1`, invoiceNumber: `${seed.slug.toUpperCase()}-FY26-00012`, status: 'issued', subtotal: 700, tax: 126, total: 826 },
    ],
    changeRequests: [
      { id: makeId('cr'), type: 'qr_regeneration', status: 'pending', payload: 'Table 3, Table 4', restaurantSlug: seed.slug, raisedAt: '2026-07-10T08:00:00Z' },
    ],
    operatingHours: buildOperatingHours(),
    availabilityLog: [
      { id: makeId('log'), itemName: 'Iced Tea', changedBy: 'Rahul Sen', isAvailable: false, reason: 'manual', changedAt: '2026-07-11T04:55:00Z' },
    ],
    gstRegistered: true,
    gstin: seed.gstin,
    legalName: seed.name,
    registeredAddress: `${seed.city}, India`,
    slab: '18%',
    sacCode: '996331',
  };
}

export function seedAppState(): AppState {
  const restaurants = [
    buildRestaurant({ name: 'Burger & Co', slug: 'burger-co', status: 'active', tableCount: 12, city: 'Bengaluru', adminEmail: 'admin@burger-co.local', welcomeMessage: 'Welcome to Burger & Co', gstin: '29ABCDE1234F1Z5' }),
    buildRestaurant({ name: 'Pizza Piazza', slug: 'pizza-piazza', status: 'active', tableCount: 10, city: 'Pune', adminEmail: 'admin@pizza-piazza.local', welcomeMessage: 'Fresh slices, fast service', gstin: '27ABCDE1234F1Z8' }),
    buildRestaurant({ name: 'Sushi House', slug: 'sushi-house', status: 'suspended', tableCount: 8, city: 'Mumbai', adminEmail: 'admin@sushi-house.local', welcomeMessage: 'Fine dining, quick flow', gstin: '27ABCDE1234F1Z9' }),
  ];

  return {
    restaurants,
    users: [
      { id: makeId('user'), name: 'Platform Admin', email: 'platform@console.local', password: 'Admin123!', role: 'platform', access: 'platform', failedAttempts: 0 },
      { id: makeId('user'), name: 'Burger Admin', email: 'admin@burger-co.local', password: 'Admin123!', role: 'admin', access: 'restaurant', restaurantSlug: 'burger-co', failedAttempts: 0 },
      { id: makeId('user'), name: 'Burger Waiter', email: 'waiter@burger-co.local', password: 'Waiter123!', role: 'waiter', access: 'restaurant', restaurantSlug: 'burger-co', failedAttempts: 0 },
      { id: makeId('user'), name: 'Burger Chef', email: 'chef@burger-co.local', password: 'Chef123!', role: 'chef', access: 'restaurant', restaurantSlug: 'burger-co', failedAttempts: 0 },
    ],
    notifications: [
      { id: makeId('note'), scope: 'restaurant', restaurantSlug: 'burger-co', message: 'New order from table 1 is pending confirmation.', unread: true, createdAt: '2026-07-11T06:20:00Z' },
      { id: makeId('note'), scope: 'platform', message: 'Sushi House has been suspended from the platform.', unread: true, createdAt: '2026-07-10T10:30:00Z' },
    ],
    contactQueries: [
      { id: makeId('cq'), name: 'Priya', email: 'priya@example.com', phone: '+91 90000 11111', restaurantName: 'Burger & Co', message: 'Need restaurant onboarding support.', status: 'open' },
    ],
    registrations: [
      { id: makeId('reg'), restaurantName: 'Cafe Aria', city: 'Hyderabad', converted: false, createdAt: '2026-07-09T12:10:00Z' },
    ],
  };
}

export function loadStoredState(): StoredState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

export function saveStoredState(state: StoredState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toneClass(status: string) {
  if (status === 'active' || status === 'paid' || status === 'ready' || status === 'confirmed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'suspended' || status === 'rejected' || status === 'revoked') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (status === 'pending' || status === 'bill_requested' || status === 'draft') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export function roleLabel(role: Role) {
  if (role === 'platform') return 'Platform Admin';
  if (role === 'admin') return 'Restaurant Admin';
  if (role === 'waiter') return 'Waiter';
  return 'Chef';
}

export function createNotificationBase(message: string, scope: NotificationItem['scope'], restaurantSlug?: string): NotificationItem {
  return {
    id: makeId('note'),
    message,
    scope,
    restaurantSlug,
    unread: true,
    createdAt: new Date().toISOString(),
  };
}
