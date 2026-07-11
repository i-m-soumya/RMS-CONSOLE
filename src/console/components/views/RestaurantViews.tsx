import type { Restaurant, Role, ViewId } from '../../types';
import { RestaurantAvailabilityScreen } from './restaurant/AvailabilityScreen';
import { RestaurantBillingScreen } from './restaurant/BillingScreen';
import { RestaurantDashboardScreen } from './restaurant/DashboardScreen';
import { RestaurantKitchenScreen } from './restaurant/KitchenScreen';
import { RestaurantMenuScreen } from './restaurant/MenuScreen';
import { RestaurantNotificationsScreen } from './restaurant/NotificationsScreen';
import { RestaurantOrdersScreen } from './restaurant/OrdersScreen';
import { RestaurantOverviewScreen } from './restaurant/OverviewScreen';
import { RestaurantReportsScreen } from './restaurant/ReportsScreen';
import { RestaurantSettingsScreen } from './restaurant/SettingsScreen';
import { RestaurantShiftHistoryScreen } from './restaurant/ShiftHistoryScreen';
import { RestaurantStaffScreen } from './restaurant/StaffScreen';
import { RestaurantTablesScreen } from './restaurant/TablesScreen';

interface RestaurantViewsProps {
  view: ViewId;
  role: Role;
  restaurant: Restaurant;
  notifications: Array<{ id: string; message: string; unread: boolean; createdAt: string }>;
  onOpenTable: (tableId: string) => void;
  onConfirmOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onMarkBillPaid: (billId: string) => void;
  onToggleItemAvailability: (itemId: string) => void;
}

export function RestaurantViews(props: RestaurantViewsProps) {
  if (props.view === 'dashboard') {
    return <RestaurantDashboardScreen role={props.role} restaurant={props.restaurant} />;
  }

  if (props.view === 'tables') {
    return <RestaurantTablesScreen restaurant={props.restaurant} onOpenTable={props.onOpenTable} />;
  }

  if (props.view === 'orders') {
    return (
      <RestaurantOrdersScreen
        restaurant={props.restaurant}
        onConfirmOrder={props.onConfirmOrder}
        onRejectOrder={props.onRejectOrder}
      />
    );
  }

  if (props.view === 'billing') {
    return <RestaurantBillingScreen restaurant={props.restaurant} onMarkBillPaid={props.onMarkBillPaid} />;
  }

  if (props.view === 'menu') {
    return <RestaurantMenuScreen restaurant={props.restaurant} />;
  }

  if (props.view === 'staff') {
    return <RestaurantStaffScreen restaurant={props.restaurant} />;
  }

  if (props.view === 'reports') {
    return <RestaurantReportsScreen restaurant={props.restaurant} />;
  }

  if (props.view === 'settings') {
    return <RestaurantSettingsScreen restaurant={props.restaurant} />;
  }

  if (props.view === 'notifications') {
    return <RestaurantNotificationsScreen notifications={props.notifications} />;
  }

  if (props.view === 'kitchen') {
    return <RestaurantKitchenScreen restaurant={props.restaurant} />;
  }

  if (props.view === 'availability') {
    return (
      <RestaurantAvailabilityScreen
        restaurant={props.restaurant}
        onToggleItemAvailability={props.onToggleItemAvailability}
      />
    );
  }

  if (props.view === 'shift-history') {
    return <RestaurantShiftHistoryScreen restaurant={props.restaurant} />;
  }

  return <RestaurantOverviewScreen />;
}
