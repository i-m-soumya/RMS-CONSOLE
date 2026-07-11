import { formatClock } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformRestaurantsScreen({ state, onOpenRestaurant, onToggleRestaurantStatus }: Pick<PlatformScreenProps, 'state' | 'onOpenRestaurant' | 'onToggleRestaurantStatus'>) {
  return (
    <Card>
      <CardHeader title="Restaurants" subtitle="All tenants with status and table count." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Name", "Slug", "Status", "Tables", "Onboarded", "Actions"]}
          rows={state.restaurants.map((restaurant) => [
            <span key={`${restaurant.id}-name`} className="font-medium text-slate-900">{restaurant.name}</span>,
            <code key={`${restaurant.id}-slug`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{restaurant.slug}</code>,
            <Pill key={`${restaurant.id}-status`} tone={restaurant.status}>{restaurant.status}</Pill>,
            <span key={`${restaurant.id}-tables`}>{restaurant.tableCount}</span>,
            <span key={`${restaurant.id}-date`}>{formatClock(restaurant.onboardedAt)}</span>,
            <div key={`${restaurant.id}-actions`} className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onOpenRestaurant(restaurant.slug)}>Open</Button>
              <Button variant={restaurant.status === 'active' ? 'danger' : 'primary'} onClick={() => onToggleRestaurantStatus(restaurant.slug)}>
                {restaurant.status === 'active' ? 'Suspend' : 'Reactivate'}
              </Button>
            </div>,
          ])}
        />
      </div>
    </Card>
  );
}
