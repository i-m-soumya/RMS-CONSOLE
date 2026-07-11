import { formatCurrency } from '../../../mockData';
import { Card, CardHeader } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformAnalyticsScreen({ state }: Pick<PlatformScreenProps, 'state'>) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Website Views" subtitle="Read-only traffic metrics." />
        <div className="space-y-3 p-4 sm:p-5">
          {[
            ['Home', 78],
            ['Restaurants', 62],
            ['Console', 41],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs text-slate-600"><span>{label}</span><span>{value}</span></div>
              <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Revenue by Restaurant" subtitle="Platform-wide revenue snapshot." />
        <div className="space-y-3 p-4 sm:p-5">
          {state.restaurants.map((restaurant) => (
            <div key={restaurant.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900">{restaurant.name}</div>
                <div className="text-xs text-slate-500">{restaurant.status}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-slate-900">{formatCurrency(restaurant.bills.reduce((sum, bill) => sum + bill.total, 0))}</div>
                <div className="text-xs text-slate-500">Revenue</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
