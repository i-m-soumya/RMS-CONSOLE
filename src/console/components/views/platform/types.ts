import type { AppState } from '../../../types';

export interface PlatformScreenProps {
  state: AppState;
  unreadCount: number;
  onOpenRestaurant: (slug: string) => void;
  onToggleRestaurantStatus: (slug: string) => void;
  onApproveRequest: (restaurantSlug: string, requestId: string) => void;
  onRejectRequest: (restaurantSlug: string, requestId: string) => void;
}
