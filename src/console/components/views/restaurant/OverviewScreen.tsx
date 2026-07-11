import { Card, CardHeader } from '../../ui';

export function RestaurantOverviewScreen() {
  return (
    <Card>
      <CardHeader title="Overview" subtitle="Role-based view enabled for this workspace." />
      <div className="p-4 text-sm text-slate-600">This section is intentionally compact on mobile and expands on larger breakpoints.</div>
    </Card>
  );
}
