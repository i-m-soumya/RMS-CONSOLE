import { formatCurrency } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantMenuScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  return (
    <Card>
      <CardHeader title="Menu" subtitle="Categories, items, and availability in one view." />
      <div className="space-y-4 p-4 sm:p-5">
        <DataTable
          columns={["Category", "Display Order", "Item Count"]}
          rows={restaurant.menuCategories.map((category) => [
            <span key={`${category.id}-name`} className="font-medium text-slate-900">{category.name}</span>,
            <span key={`${category.id}-order`}>{category.displayOrder}</span>,
            <span key={`${category.id}-count`}>{category.itemCount}</span>,
          ])}
        />
        <DataTable
          columns={["Item", "Type", "Dietary", "Selling Price", "Availability"]}
          rows={restaurant.menuItems.map((item) => [
            <span key={`${item.id}-name`} className="font-medium text-slate-900">{item.name}</span>,
            <Pill key={`${item.id}-type`} tone="slate">{item.itemType}</Pill>,
            <Pill key={`${item.id}-diet`} tone="slate">{item.dietaryType}</Pill>,
            <span key={`${item.id}-price`}>{formatCurrency(item.sellingPrice)}</span>,
            <Pill key={`${item.id}-available`} tone={item.isAvailable ? 'active' : 'pending'}>{item.isAvailable ? 'in stock' : 'out of stock'}</Pill>,
          ])}
        />
      </div>
    </Card>
  );
}
