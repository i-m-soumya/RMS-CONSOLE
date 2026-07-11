import { formatClock } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformChangeRequestsScreen({ state, onApproveRequest, onRejectRequest }: Pick<PlatformScreenProps, 'state' | 'onApproveRequest' | 'onRejectRequest'>) {
  return (
    <Card>
      <CardHeader title="Change Requests" subtitle="Pending approvals across restaurants." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Restaurant", "Type", "Payload", "Status", "Raised", "Actions"]}
          rows={state.restaurants.flatMap((restaurant) =>
            restaurant.changeRequests.map((request) => [
              <span key={`${request.id}-name`} className="font-medium text-slate-900">{restaurant.name}</span>,
              <Pill key={`${request.id}-type`} tone="pending">{request.type}</Pill>,
              <span key={`${request.id}-payload`}>{request.payload}</span>,
              <Pill key={`${request.id}-status`} tone={request.status}>{request.status}</Pill>,
              <span key={`${request.id}-raised`}>{formatClock(request.raisedAt)}</span>,
              <div key={`${request.id}-actions`} className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => onApproveRequest(restaurant.slug, request.id)}>Approve</Button>
                <Button variant="secondary" onClick={() => onRejectRequest(restaurant.slug, request.id)}>Reject</Button>
              </div>,
            ]),
          )}
        />
      </div>
    </Card>
  );
}
