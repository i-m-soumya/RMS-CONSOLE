import { formatClock } from '../../../mockData';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantTablesScreen({ restaurant, onOpenTable }: Pick<RestaurantScreenProps, 'restaurant' | 'onOpenTable'>) {
  return (
    <Card>
      <CardHeader title="Tables & Sessions" subtitle="Mobile-first board grouped by floor." />
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {restaurant.tables.map((table) => {
          const session = restaurant.sessions.find((entry) => entry.id === table.activeSessionId);
          return (
            <div key={table.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Table {table.tableNumber}</div>
                  <div className="text-xs text-slate-500">{table.floor}</div>
                </div>
                <Pill tone={table.status}>{table.status}</Pill>
              </div>
              <div className="mt-2 text-xs text-slate-600">Capacity {table.capacity}</div>
              {session ? <div className="mt-2 text-xs text-slate-500">Opened {formatClock(session.openedAt)}</div> : null}
              {table.status === 'idle' ? <Button variant="primary" className="mt-4 w-full" onClick={() => onOpenTable(table.id)}>Open Table</Button> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
