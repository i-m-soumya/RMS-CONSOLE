import { formatCurrency } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantBillingScreen({ restaurant, onMarkBillPaid }: Pick<RestaurantScreenProps, 'restaurant' | 'onMarkBillPaid'>) {
  return (
    <Card>
      <CardHeader title="Bills & Payments" subtitle="Issue bills and record payments." />
      <div className="p-4 sm:p-5">
        <DataTable
          columns={["Invoice", "Subtotal", "Tax", "Total", "Status", "Actions"]}
          rows={restaurant.bills.map((bill) => [
            <span key={`${bill.id}-invoice`} className="font-medium text-slate-900">{bill.invoiceNumber}</span>,
            <span key={`${bill.id}-subtotal`}>{formatCurrency(bill.subtotal)}</span>,
            <span key={`${bill.id}-tax`}>{formatCurrency(bill.tax)}</span>,
            <span key={`${bill.id}-total`}>{formatCurrency(bill.total)}</span>,
            <Pill key={`${bill.id}-status`} tone={bill.status}>{bill.status}</Pill>,
            <Button key={`${bill.id}-paid`} variant="primary" disabled={bill.status === 'paid'} onClick={() => onMarkBillPaid(bill.id)}>Mark Paid</Button>,
          ])}
        />
      </div>
    </Card>
  );
}
