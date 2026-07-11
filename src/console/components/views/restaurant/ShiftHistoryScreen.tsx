import { formatClock } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantShiftHistoryScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  const completed = restaurant.orders.filter((order) => ['ready', 'served', 'rejected'].includes(order.status));

  return (
    <Card>
      <CardHeader title="Shift History" subtitle="Completed/rejected orders in current shift." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Table", "Order", "Status", "Time"]}
          rows={completed.map((order) => [
            <span key={`${order.id}-table`} className="font-medium text-slate-900">Table {order.tableNumber}</span>,
            <span key={`${order.id}-id`}>{order.id.slice(-6)}</span>,
            <Pill key={`${order.id}-status`} tone={order.status}>{order.status}</Pill>,
            <span key={`${order.id}-time`}>{formatClock(order.createdAt)}</span>,
          ])}
        />
      </div>
    </Card>
  );
}
