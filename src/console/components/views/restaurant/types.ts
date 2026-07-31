import type { Restaurant, Role, ViewId } from '../../../types';

export interface RestaurantScreenProps {
  role: Role;
  restaurant: Restaurant;
  onOpenTable: (tableId: string) => void;
  onConfirmOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onMarkBillPaid: (billId: string) => void;
  onToggleItemAvailability: (itemId: string) => void;
  onNavigate: (view: ViewId) => void;
}
