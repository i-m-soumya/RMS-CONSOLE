import { formatClock } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantOrdersScreen({ restaurant, onConfirmOrder, onRejectOrder }: Pick<RestaurantScreenProps, 'restaurant' | 'onConfirmOrder' | 'onRejectOrder'>) {
  return (
    <Card>
      <CardHeader title="Orders" subtitle="Pending queue with confirm/reject actions." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Table", "Items", "Notes", "Status", "Created", "Actions"]}
          rows={restaurant.orders.map((order) => [
            <span key={`${order.id}-table`} className="font-medium text-slate-900">Table {order.tableNumber}</span>,
            <span key={`${order.id}-items`}>{order.items.map((item) => `${item.qty}x ${item.name}`).join(', ')}</span>,
            <span key={`${order.id}-notes`}>{order.notes ?? '—'}</span>,
            <Pill key={`${order.id}-status`} tone={order.status}>{order.status}</Pill>,
            <span key={`${order.id}-time`}>{formatClock(order.createdAt)}</span>,
            <div key={`${order.id}-actions`} className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onConfirmOrder(order.id)}>Confirm</Button>
              <Button variant="secondary" onClick={() => onRejectOrder(order.id)}>Reject</Button>
            </div>,
          ])}
        />
      </div>
    </Card>
  );
}
