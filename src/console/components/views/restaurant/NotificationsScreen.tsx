import { formatClock } from '../../../mockData';
import { Card, CardHeader, Pill } from '../../ui';

export function RestaurantNotificationsScreen({ notifications }: { notifications: Array<{ id: string; message: string; unread: boolean; createdAt: string }> }) {
  return (
    <Card>
      <CardHeader title="Notifications" subtitle="Recent events for this workspace." />
      <div className="space-y-3 p-4 sm:p-5">
        {notifications.length === 0 ? <div className="text-sm text-slate-600">No notifications yet.</div> : null}
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{notification.message}</div>
              <Pill tone={notification.unread ? 'pending' : 'active'}>{notification.unread ? 'unread' : 'read'}</Pill>
            </div>
            <div className="mt-1 text-xs text-slate-500">{formatClock(notification.createdAt)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
