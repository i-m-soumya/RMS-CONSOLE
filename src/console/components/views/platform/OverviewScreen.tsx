import { Bell, Star, Store } from 'lucide-react';
import { Card, CardHeader, StatCard } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformOverviewScreen({ state }: Pick<PlatformScreenProps, 'state'>) {
  return (
    <Card>
      <CardHeader title="Overview" subtitle="Simple read-only summary panel." />
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Leads" value={String(state.registrations.length)} icon={Star} />
        <StatCard label="Contact Queries" value={String(state.contactQueries.length)} icon={Bell} />
        <StatCard label="Active Restaurants" value={String(state.restaurants.filter((restaurant) => restaurant.status === 'active').length)} icon={Store} />
      </div>
    </Card>
  );
}
