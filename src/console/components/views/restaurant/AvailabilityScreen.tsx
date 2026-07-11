import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantAvailabilityScreen({ restaurant, onToggleItemAvailability }: Pick<RestaurantScreenProps, 'restaurant' | 'onToggleItemAvailability'>) {
  return (
    <Card>
      <CardHeader title="Item Availability" subtitle="Chef and admin can toggle stock state." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Item", "Available", "Action"]}
          rows={restaurant.menuItems.map((item) => [
            <span key={`${item.id}-name`} className="font-medium text-slate-900">{item.name}</span>,
            <Pill key={`${item.id}-available`} tone={item.isAvailable ? 'active' : 'pending'}>{item.isAvailable ? 'yes' : 'no'}</Pill>,
            <Button key={`${item.id}-action`} variant="secondary" onClick={() => onToggleItemAvailability(item.id)}>Toggle</Button>,
          ])}
        />
      </div>
    </Card>
  );
}
