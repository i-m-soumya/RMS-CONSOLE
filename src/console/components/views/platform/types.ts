import type { AppState, ViewId } from '../../../types';

export interface PlatformScreenProps {
  state: AppState;
  unreadCount: number;
  onOpenRestaurant: (restaurantId: string) => void;
  onToggleRestaurantStatus: (slug: string) => void;
  onApproveRequest: (restaurantSlug: string, requestId: string) => void;
  onRejectRequest: (restaurantSlug: string, requestId: string) => void;
  onNavigate: (view: ViewId) => void;
  onOpenNotifications: () => void;
}
