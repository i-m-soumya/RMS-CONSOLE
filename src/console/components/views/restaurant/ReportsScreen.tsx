import { formatCurrency } from '../../../mockData';
import { Card, CardHeader } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantReportsScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  const totalRevenue = restaurant.bills.reduce((sum, bill) => sum + bill.total, 0);
  const totalOrders = restaurant.orders.length;
  const topItems = restaurant.menuItems.slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Revenue" subtitle="High-level revenue snapshot." />
        <div className="space-y-2 p-4 sm:p-5 text-sm text-slate-700">
          <div className="flex items-center justify-between"><span>Total Revenue</span><span className="font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span></div>
          <div className="flex items-center justify-between"><span>Total Orders</span><span className="font-semibold text-slate-900">{totalOrders}</span></div>
          <div className="flex items-center justify-between"><span>Active Sessions</span><span className="font-semibold text-slate-900">{restaurant.sessions.filter((s) => s.status === 'active').length}</span></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Top Items" subtitle="Quick view of menu highlights." />
        <div className="space-y-2 p-4 sm:p-5">
          {topItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{item.name}</span>
              <span className="text-slate-600">{formatCurrency(item.sellingPrice)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
