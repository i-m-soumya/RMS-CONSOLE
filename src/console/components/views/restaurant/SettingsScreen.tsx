import { Card, CardHeader, Pill } from '../../ui';
import type { RestaurantScreenProps } from './types';

export function RestaurantSettingsScreen({ restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Restaurant Profile" subtitle="Current tenant profile details." />
        <div className="space-y-2 p-4 sm:p-5 text-sm text-slate-700">
          <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{restaurant.name}</span></div>
          <div><span className="text-slate-500">Slug:</span> <span className="font-medium text-slate-900">{restaurant.slug}</span></div>
          <div><span className="text-slate-500">City:</span> <span className="font-medium text-slate-900">{restaurant.city}</span></div>
          <div><span className="text-slate-500">Timezone:</span> <span className="font-medium text-slate-900">{restaurant.timezone}</span></div>
          <div><span className="text-slate-500">Contact:</span> <span className="font-medium text-slate-900">{restaurant.contactEmail}</span></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="GST & Hours" subtitle="Tax and operating-hour settings." />
        <div className="space-y-3 p-4 sm:p-5 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>GST Registered</span>
            <Pill tone={restaurant.gstRegistered ? 'active' : 'pending'}>{restaurant.gstRegistered ? 'yes' : 'no'}</Pill>
          </div>
          <div><span className="text-slate-500">GSTIN:</span> <span className="font-medium text-slate-900">{restaurant.gstin}</span></div>
          <div><span className="text-slate-500">Slab:</span> <span className="font-medium text-slate-900">{restaurant.slab}</span></div>
          <div className="pt-1">
            <p className="mb-2 text-slate-500">Operating Days</p>
            <div className="flex flex-wrap gap-2">
              {restaurant.operatingHours.map((day) => (
                <span key={day.day} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  {day.day.slice(0, 3)} {day.isWeeklyOff ? '(Off)' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
