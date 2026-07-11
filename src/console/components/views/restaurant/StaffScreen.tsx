import { formatClock } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantStaffScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  return (
    <Card>
      <CardHeader title="Staff" subtitle="Staff access, roles, and session status." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Name", "Email", "Role", "Status", "Session", "Last Login"]}
          rows={restaurant.staff.map((staff) => [
            <span key={`${staff.id}-name`} className="font-medium text-slate-900">{staff.name}</span>,
            <span key={`${staff.id}-email`}>{staff.email}</span>,
            <Pill key={`${staff.id}-role`} tone="slate">{staff.role}</Pill>,
            <Pill key={`${staff.id}-status`} tone={staff.status}>{staff.status}</Pill>,
            <Pill key={`${staff.id}-session`} tone={staff.sessionStatus === 'online' ? 'active' : 'slate'}>{staff.sessionStatus}</Pill>,
            <span key={`${staff.id}-last`}>{staff.lastLoginAt ? formatClock(staff.lastLoginAt) : '—'}</span>,
          ])}
        />
      </div>
    </Card>
  );
}
