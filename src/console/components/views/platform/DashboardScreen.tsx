import { Bell, RefreshCw, Shield, Store } from 'lucide-react';
import { StatCard } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformDashboardScreen({ state, unreadCount }: Pick<PlatformScreenProps, 'state' | 'unreadCount'>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Restaurants" value={String(state.restaurants.length)} hint="All tenants" icon={Store} />
      <StatCard label="Active" value={String(state.restaurants.filter((restaurant) => restaurant.status === 'active').length)} hint="Available" icon={Shield} />
      <StatCard label="Pending Requests" value={String(state.restaurants.reduce((sum, restaurant) => sum + restaurant.changeRequests.filter((request) => request.status === 'pending').length, 0))} hint="Needs action" icon={RefreshCw} />
      <StatCard label="Unread" value={String(unreadCount)} hint="Notifications" icon={Bell} />
    </div>
  );
}
