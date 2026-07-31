import { PackageSearch, Star, Table2, UtensilsCrossed, Wallet } from 'lucide-react';
import { formatCurrency } from '../../../mockData';
import { StatCard } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantDashboardScreen({ role, restaurant, onNavigate }: Pick<RestaurantScreenProps, 'role' | 'restaurant' | 'onNavigate'>) {
  if (role === 'chef') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(restaurant.orders.length)} hint="Kitchen queue" icon={UtensilsCrossed} onClick={() => onNavigate('kitchen')} />
        <StatCard label="Ready" value={String(restaurant.orders.filter((order) => order.status === 'ready').length)} hint="Awaiting serve" icon={Star} onClick={() => onNavigate('kitchen')} />
        <StatCard label="Unavailable" value={String(restaurant.menuItems.filter((item) => !item.isAvailable).length)} hint="Stock flags" icon={PackageSearch} onClick={() => onNavigate('availability')} />
        <StatCard label="Shift Notes" value={String(restaurant.availabilityLog.length)} hint="Availability updates" icon={Table2} onClick={() => onNavigate('shift-history')} />
      </div>
    );
  }

  const lastTileTarget = role === 'admin' ? 'menu' : 'notifications';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Sessions" value={String(restaurant.sessions.filter((session) => session.status === 'active').length)} hint="Active tables" icon={Table2} onClick={() => onNavigate('tables')} />
      <StatCard label="Orders" value={String(restaurant.orders.filter((order) => order.status !== 'served' && order.status !== 'rejected').length)} hint="In progress" icon={PackageSearch} onClick={() => onNavigate('orders')} />
      <StatCard label="Revenue" value={formatCurrency(restaurant.bills.reduce((sum, bill) => sum + bill.total, 0))} hint="Today" icon={Wallet} onClick={() => onNavigate('billing')} />
      <StatCard label="Top Item" value={restaurant.menuItems[0]?.name ?? '—'} hint="Current highlight" icon={Star} onClick={() => onNavigate(lastTileTarget)} />
    </div>
  );
}
