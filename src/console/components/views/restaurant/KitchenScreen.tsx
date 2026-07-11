import { humanizeStatus } from '../../../mockData';
import { Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantKitchenScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {(['confirmed', 'preparing', 'ready'] as const).map((status) => (
        <Card key={status}>
          <CardHeader title={humanizeStatus(status)} subtitle="Kitchen queue" />
          <div className="space-y-3 p-4">
            {restaurant.orders.filter((order) => order.status === status || (status === 'confirmed' && order.status === 'pending')).map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">Table {order.tableNumber}</span>
                  <Pill tone={order.status}>{order.status}</Pill>
                </div>
                <div className="mt-2 text-xs text-slate-600">{order.items.map((item) => `${item.qty}x ${item.name}`).join(', ')}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
