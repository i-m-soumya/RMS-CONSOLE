import type { AppState, ViewId } from '../../types';
import { PlatformAnalyticsScreen } from './platform/AnalyticsScreen';
import { PlatformChangeRequestsScreen } from './platform/ChangeRequestsScreen';
import { PlatformDashboardScreen } from './platform/DashboardScreen';
import { PlatformOverviewScreen } from './platform/OverviewScreen';
import { PlatformRestaurantsScreen } from './platform/RestaurantsScreen';

interface PlatformViewsProps {
  view: ViewId;
  state: AppState;
  unreadCount: number;
  onOpenRestaurant: (slug: string) => void;
  onToggleRestaurantStatus: (slug: string) => void;
  onApproveRequest: (restaurantSlug: string, requestId: string) => void;
  onRejectRequest: (restaurantSlug: string, requestId: string) => void;
}

export function PlatformViews(props: PlatformViewsProps) {
  if (props.view === 'dashboard') {
    return <PlatformDashboardScreen state={props.state} unreadCount={props.unreadCount} />;
  }

  if (props.view === 'restaurants') {
    return (
      <PlatformRestaurantsScreen
        state={props.state}
        onOpenRestaurant={props.onOpenRestaurant}
        onToggleRestaurantStatus={props.onToggleRestaurantStatus}
      />
    );
  }

  if (props.view === 'change-requests') {
    return (
      <PlatformChangeRequestsScreen
        state={props.state}
        onApproveRequest={props.onApproveRequest}
        onRejectRequest={props.onRejectRequest}
      />
    );
  }

  if (props.view === 'analytics') {
    return <PlatformAnalyticsScreen state={props.state} />;
  }

  return <PlatformOverviewScreen state={props.state} />;
}
