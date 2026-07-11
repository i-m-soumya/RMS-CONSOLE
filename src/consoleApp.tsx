import {
  Bell,
  DatabaseZap,
  LayoutDashboard,
  Link2,
  MessageSquareWarning,
  PackageSearch,
  RefreshCw,
  Settings2,
  Soup,
  Star,
  Store,
  Table2,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppFrame, type NavItem } from './console/components/AppFrame';
import { LoginScreen } from './console/components/LoginScreen';
import { ModalShell } from './console/components/ModalShell';
import { PlatformViews } from './console/components/views/PlatformViews';
import { RestaurantViews } from './console/components/views/RestaurantViews';
import {
  GSTIN_REGEX,
  buildOperatingHours,
  createNotificationBase,
  formatClock,
  loadStoredState,
  makeId,
  roleLabel,
  saveStoredState,
  seedAppState,
} from './console/mockData';
import type {
  AccessMode,
  NotificationItem,
  Restaurant,
  StoredState,
  ViewId,
} from './console/types';
import { Button, Pill } from './console/components/ui';

function useConsoleState() {
  const stored = useMemo(loadStoredState, []);
  const [state, setState] = useState<StoredState>(() => stored ?? { auth: null, data: seedAppState() });

  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  return { state, setState };
}

export default function ConsoleApp() {
  const { state, setState } = useConsoleState();
  const [view, setView] = useState<ViewId>('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const auth = state.auth;
  const currentUser = auth ? state.data.users.find((user) => user.id === auth.userId) ?? null : null;
  const currentRestaurant = auth?.restaurantSlug ? state.data.restaurants.find((restaurant) => restaurant.slug === auth.restaurantSlug) ?? null : null;
  const currentNotifications = state.data.notifications.filter((notification) => notification.scope === auth?.access && (!notification.restaurantSlug || notification.restaurantSlug === auth.restaurantSlug));
  const unreadCount = currentNotifications.filter((notification) => notification.unread).length;

  const restaurantNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tables', label: 'Tables & Sessions', icon: Table2 },
    { id: 'orders', label: 'Orders', icon: PackageSearch },
    { id: 'billing', label: 'Bills & Payments', icon: Wallet },
    { id: 'menu', label: 'Menu', icon: Soup },
    { id: 'staff', label: 'Staff', icon: UserCog },
    { id: 'reports', label: 'Reports', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'kitchen', label: 'Kitchen Display', icon: UtensilsCrossed },
    { id: 'availability', label: 'Availability', icon: Link2 },
    { id: 'shift-history', label: 'Shift History', icon: RefreshCw },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const platformNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'change-requests', label: 'Change Requests', icon: RefreshCw },
    { id: 'qr-codes', label: 'QR Codes', icon: DatabaseZap },
    { id: 'contacts', label: 'Contact Queries', icon: MessageSquareWarning },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  const navItems = useMemo(() => {
    if (!auth) return [];
    if (auth.access === 'platform') return platformNav;

    if (auth.role === 'chef') {
      return restaurantNav.filter((item) => ['dashboard', 'kitchen', 'availability', 'shift-history', 'notifications'].includes(item.id));
    }

    if (auth.role === 'waiter') {
      return restaurantNav.filter((item) => ['dashboard', 'tables', 'orders', 'billing', 'notifications'].includes(item.id));
    }

    return restaurantNav.filter((item) => ['dashboard', 'tables', 'orders', 'billing', 'menu', 'staff', 'reports', 'settings', 'notifications'].includes(item.id));
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    setView('dashboard');
  }, [auth]);

  function setNotificationRead(notificationId: string) {
    setState((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        notifications: previous.data.notifications.map((notification) =>
          notification.id === notificationId ? { ...notification, unread: false } : notification,
        ),
      },
    }));
  }

  function pushNotification(message: string, scope: AccessMode, restaurantSlug?: string) {
    setState((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        notifications: [createNotificationBase(message, scope, restaurantSlug), ...previous.data.notifications],
      },
    }));
  }

  function patchRestaurant(slug: string, updater: (restaurant: Restaurant) => Restaurant) {
    setState((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        restaurants: previous.data.restaurants.map((restaurant) => (restaurant.slug === slug ? updater(restaurant) : restaurant)),
      },
    }));
  }

  function login(event: React.FormEvent) {
    event.preventDefault();
    setLoginError('');

    const user = state.data.users.find(
      (candidate) =>
        candidate.email.toLowerCase() === loginEmail.trim().toLowerCase(),
    );

    if (!user) {
      setLoginError('No account found for this email.');
      return;
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      setLoginError('Account is locked after failed attempts. Try again later.');
      return;
    }

    if (user.password !== loginPassword) {
      setState((previous) => ({
        ...previous,
        data: {
          ...previous.data,
          users: previous.data.users.map((candidate) => {
            if (candidate.id !== user.id) return candidate;
            const failedAttempts = candidate.failedAttempts + 1;
            return {
              ...candidate,
              failedAttempts,
              lockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : candidate.lockedUntil ?? null,
            };
          }),
        },
      }));
      setLoginError('Incorrect password. After five failures the account locks briefly.');
      return;
    }

    setState((previous) => ({
      auth: {
        userId: user.id,
        access: user.access,
        role: user.role,
        restaurantSlug: user.restaurantSlug,
      },
      data: {
        ...previous.data,
        users: previous.data.users.map((candidate) =>
          candidate.id === user.id
            ? { ...candidate, failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() }
            : candidate,
        ),
      },
    }));

    setLoginPassword('');
  }

  function logout() {
    setState((previous) => ({ ...previous, auth: null }));
    setView('dashboard');
    setNotificationsOpen(false);
  }

  function toggleRestaurantStatus(slug: string) {
    patchRestaurant(slug, (restaurant) => ({ ...restaurant, status: restaurant.status === 'active' ? 'suspended' : 'active' }));
    const restaurant = state.data.restaurants.find((entry) => entry.slug === slug);
    if (restaurant) {
      const nextState = restaurant.status === 'active' ? 'suspended' : 'active';
      pushNotification(`${restaurant.name} is now ${nextState}.`, 'platform');
    }
  }

  function approveChangeRequest(restaurantSlug: string, requestId: string) {
    patchRestaurant(restaurantSlug, (restaurant) => ({
      ...restaurant,
      changeRequests: restaurant.changeRequests.map((request) =>
        request.id === requestId ? { ...request, status: 'approved', actionedAt: new Date().toISOString() } : request,
      ),
    }));
    pushNotification('Your change request was approved.', 'restaurant', restaurantSlug);
  }

  function rejectChangeRequest(restaurantSlug: string, requestId: string) {
    const reason = window.prompt('Rejection reason');
    if (!reason) return;

    patchRestaurant(restaurantSlug, (restaurant) => ({
      ...restaurant,
      changeRequests: restaurant.changeRequests.map((request) =>
        request.id === requestId ? { ...request, status: 'rejected', reason, actionedAt: new Date().toISOString() } : request,
      ),
    }));
    pushNotification('Your change request was rejected.', 'restaurant', restaurantSlug);
  }

  function openTable(tableId: string) {
    if (!currentRestaurant || !currentUser) return;

    patchRestaurant(currentRestaurant.slug, (restaurant) => {
      const table = restaurant.tables.find((entry) => entry.id === tableId);
      if (!table) return restaurant;

      const sessionId = `${restaurant.slug}-${tableId}`;
      return {
        ...restaurant,
        tables: restaurant.tables.map((entry) =>
          entry.id === tableId ? { ...entry, status: 'active', activeSessionId: sessionId } : entry,
        ),
        sessions: [
          {
            id: sessionId,
            tableId,
            tableNumber: table.tableNumber,
            openedAt: new Date().toISOString(),
            status: 'active',
            waiterName: currentUser.name,
            customerTokenValid: true,
          },
          ...restaurant.sessions.filter((entry) => entry.tableId !== tableId),
        ],
      };
    });

    pushNotification('Table opened successfully.', 'restaurant', currentRestaurant.slug);
  }

  function confirmOrder(orderId: string) {
    if (!currentRestaurant) return;

    patchRestaurant(currentRestaurant.slug, (restaurant) => ({
      ...restaurant,
      orders: restaurant.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: 'confirmed', items: order.items.map((item) => ({ ...item, status: 'confirmed' })) }
          : order,
      ),
    }));
  }

  function rejectOrder(orderId: string) {
    if (!currentRestaurant) return;

    const reason = window.prompt('Optional rejection reason') ?? undefined;
    patchRestaurant(currentRestaurant.slug, (restaurant) => ({
      ...restaurant,
      orders: restaurant.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: 'rejected', notes: reason ?? order.notes, items: order.items.map((item) => ({ ...item, status: 'rejected' })) }
          : order,
      ),
    }));
  }

  function markBillPaid(billId: string) {
    if (!currentRestaurant) return;

    patchRestaurant(currentRestaurant.slug, (restaurant) => ({
      ...restaurant,
      bills: restaurant.bills.map((bill) =>
        bill.id === billId ? { ...bill, status: 'paid', paidAt: new Date().toISOString() } : bill,
      ),
    }));
  }

  function toggleItemAvailability(itemId: string) {
    if (!currentRestaurant) return;

    patchRestaurant(currentRestaurant.slug, (restaurant) => ({
      ...restaurant,
      menuItems: restaurant.menuItems.map((item) =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item,
      ),
      availabilityLog: [
        {
          id: makeId('log'),
          itemName: restaurant.menuItems.find((item) => item.id === itemId)?.name ?? 'Item',
          changedBy: currentUser?.name ?? 'System',
          isAvailable: !(restaurant.menuItems.find((item) => item.id === itemId)?.isAvailable ?? false),
          reason: 'manual',
          changedAt: new Date().toISOString(),
        },
        ...restaurant.availabilityLog,
      ],
    }));
  }

  if (!auth) {
    return (
      <LoginScreen
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        onSubmit={login}
      />
    );
  }

  const shellTitle = auth.access === 'platform' ? 'Platform' : currentRestaurant?.name ?? 'Restaurant';
  const shellSubtitle = `${roleLabel(auth.role)}${currentRestaurant ? ` · ${currentRestaurant.slug}` : ''}`;

  return (
    <>
      <AppFrame
        title={shellTitle}
        subtitle={shellSubtitle}
        unreadCount={unreadCount}
        navItems={navItems}
        active={view}
        onSelect={setView}
        onLogout={logout}
        onOpenNotifications={() => setNotificationsOpen(true)}
      >
        {auth.access === 'platform' ? (
          <PlatformViews
            view={view}
            state={state.data}
            unreadCount={unreadCount}
            onOpenRestaurant={() => {}}
            onToggleRestaurantStatus={toggleRestaurantStatus}
            onApproveRequest={approveChangeRequest}
            onRejectRequest={rejectChangeRequest}
          />
        ) : currentRestaurant ? (
          <RestaurantViews
            view={view}
            role={auth.role}
            restaurant={currentRestaurant}
            notifications={currentNotifications}
            onOpenTable={openTable}
            onConfirmOrder={confirmOrder}
            onRejectOrder={rejectOrder}
            onMarkBillPaid={markBillPaid}
            onToggleItemAvailability={toggleItemAvailability}
          />
        ) : null}
      </AppFrame>

      {notificationsOpen ? (
        <ModalShell title="Notifications" subtitle="Unread events and recent history." onClose={() => setNotificationsOpen(false)}>
          <div className="space-y-3">
            {currentNotifications.map((notification: NotificationItem) => (
              <button
                key={notification.id}
                onClick={() => setNotificationRead(notification.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${notification.unread ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900">{notification.message}</div>
                  <Pill tone={notification.unread ? 'pending' : 'active'}>{notification.unread ? 'unread' : 'read'}</Pill>
                </div>
                <div className="mt-1 text-xs text-slate-500">{formatClock(notification.createdAt)}</div>
              </button>
            ))}
            {currentNotifications.length === 0 ? <div className="text-sm text-slate-600">No notifications yet.</div> : null}
          </div>
        </ModalShell>
      ) : null}

      {auth.access === 'restaurant' && view === 'settings' && currentRestaurant ? (
        <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-sm backdrop-blur">
          GST format validation is active: {GSTIN_REGEX.test(currentRestaurant.gstin) ? 'valid' : 'invalid'}.
          <Button
            variant="ghost"
            className="ml-2 px-2 py-1 text-xs"
            onClick={() =>
              patchRestaurant(currentRestaurant.slug, (restaurant) => ({
                ...restaurant,
                operatingHours: buildOperatingHours(),
              }))
            }
          >
            Reset Hours
          </Button>
        </div>
      ) : null}
    </>
  );
}
