import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authApiClient,
  type FloorInput,
  type OnboardBasicDetailsPayload,
  type PlatformRestaurantListItem,
  type TableQrArtifact,
  type UpdateRestaurantBasicDetailsPayload,
} from '../../../authApi';
import { formatClock } from '../../../mockData';
import { ModalShell } from '../../ModalShell';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Field, Input, Pill, Select } from '../../ui';
import type { PlatformScreenProps } from './types';

type OnboardingFormState = {
  basic: OnboardBasicDetailsPayload;
  floors: FloorInput[];
  adminName: string;
  adminEmail: string;
};

function defaultOnboardingForm(): OnboardingFormState {
  return {
    basic: {
      name: '',
      slug: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      timezone: 'Asia/Kolkata',
      contactEmail: '',
    },
    floors: [{ name: 'Ground Floor', tables: [{ tableNumber: '1', capacity: 4 }] }],
    adminName: '',
    adminEmail: '',
  };
}

export function PlatformRestaurantsScreen({ state, onOpenRestaurant, onToggleRestaurantStatus }: Pick<PlatformScreenProps, 'state' | 'onOpenRestaurant' | 'onToggleRestaurantStatus'>) {
  const [restaurants, setRestaurants] = useState<PlatformRestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [cityFilter, setCityFilter] = useState('');

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState<OnboardingFormState>(() => defaultOnboardingForm());
  const [busyAction, setBusyAction] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');
  const [onboardAdminResult, setOnboardAdminResult] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRestaurant, setDetailsRestaurant] = useState<PlatformRestaurantListItem | null>(null);
  const [detailsOriginal, setDetailsOriginal] = useState<OnboardBasicDetailsPayload | null>(null);
  const [detailsForm, setDetailsForm] = useState<OnboardBasicDetailsPayload | null>(null);
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [detailsQrItems, setDetailsQrItems] = useState<TableQrArtifact[]>([]);

  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'active' | 'suspended'>>({});
  const [statusBusySlug, setStatusBusySlug] = useState('');

  const fallbackRows = useMemo(
    () =>
      state.restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        tableCount: restaurant.tableCount,
        onboardedAt: restaurant.onboardedAt,
        city: restaurant.city,
        timezone: restaurant.timezone,
        state: '',
        pincode: '',
        address: '',
      })),
    [state.restaurants],
  );

  const sourceRows = restaurants.length > 0 ? restaurants : fallbackRows;

  const rowsWithStatus = useMemo(
    () =>
      sourceRows.map((row) => ({
        ...row,
        status: statusOverrides[row.slug] ?? row.status,
      })),
    [sourceRows, statusOverrides],
  );

  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await authApiClient.listPlatformRestaurants({
        q: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        city: cityFilter.trim() || undefined,
        page: 1,
        pageSize: 100,
      });
      setRestaurants(data);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to load restaurants.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, cityFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRestaurants();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [loadRestaurants]);

  function slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function resetOnboarding() {
    setOnboardForm(defaultOnboardingForm());
    setBusyAction(false);
    setOnboardError('');
    setOnboardSuccess('');
    setOnboardAdminResult('');
  }

  function openOnboarding() {
    resetOnboarding();
    setOnboardOpen(true);
  }

  function closeOnboarding() {
    setOnboardOpen(false);
  }

  function addFloor() {
    setOnboardForm((previous) => ({
      ...previous,
      floors: [...previous.floors, { name: `Floor ${previous.floors.length + 1}`, tables: [{ tableNumber: '1', capacity: 4 }] }],
    }));
  }

  function removeFloor(index: number) {
    setOnboardForm((previous) => ({
      ...previous,
      floors: previous.floors.filter((_, floorIndex) => floorIndex !== index),
    }));
  }

  function updateFloorName(index: number, name: string) {
    setOnboardForm((previous) => ({
      ...previous,
      floors: previous.floors.map((floor, floorIndex) => (floorIndex === index ? { ...floor, name } : floor)),
    }));
  }

  function addTable(floorIndex: number) {
    setOnboardForm((previous) => ({
      ...previous,
      floors: previous.floors.map((floor, idx) =>
        idx === floorIndex
          ? {
              ...floor,
              tables: [...floor.tables, { tableNumber: String(floor.tables.length + 1), capacity: 4 }],
            }
          : floor,
      ),
    }));
  }

  function removeTable(floorIndex: number, tableIndex: number) {
    setOnboardForm((previous) => ({
      ...previous,
      floors: previous.floors.map((floor, idx) =>
        idx === floorIndex
          ? {
              ...floor,
              tables: floor.tables.filter((_, innerIndex) => innerIndex !== tableIndex),
            }
          : floor,
      ),
    }));
  }

  function updateTable(floorIndex: number, tableIndex: number, key: 'tableNumber' | 'capacity', value: string) {
    setOnboardForm((previous) => ({
      ...previous,
      floors: previous.floors.map((floor, idx) => {
        if (idx !== floorIndex) return floor;
        return {
          ...floor,
          tables: floor.tables.map((table, innerIndex) => {
            if (innerIndex !== tableIndex) return table;
            if (key === 'capacity') {
              return { ...table, capacity: Number(value) || 1 };
            }
            return { ...table, tableNumber: value };
          }),
        };
      }),
    }));
  }

  async function submitOnboarding(event: React.FormEvent) {
    event.preventDefault();
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');
    setOnboardAdminResult('');

    try {
      const normalizedSlug = slugify(onboardForm.basic.slug || onboardForm.basic.name);
      const created = await authApiClient.createRestaurantBasicDetails({
        ...onboardForm.basic,
        slug: normalizedSlug,
      });

      await authApiClient.saveFloorsAndTables(created.id, onboardForm.floors);

      const adminResponse = await authApiClient.createRestaurantAdminCredentials(created.id, {
        name: onboardForm.adminName,
        email: onboardForm.adminEmail,
      });

      setOnboardAdminResult(`Temp password: ${adminResponse.tempPassword}`);
      setOnboardSuccess(
        adminResponse.emailDelivery.sent
          ? 'Restaurant created. Floors, tables, and admin credentials are complete.'
          : 'Restaurant and admin created, but admin credential email delivery needs retry.',
      );
      await loadRestaurants();
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to onboard restaurant.');
    } finally {
      setBusyAction(false);
    }
  }

  function downloadQr(item: TableQrArtifact) {
    const anchor = document.createElement('a');
    anchor.href = item.qrDataUrl;
    anchor.download = item.filename;
    anchor.click();
  }

  function openRestaurantDetails(restaurant: PlatformRestaurantListItem) {
    const localRestaurant = state.restaurants.find((entry) => entry.slug === restaurant.slug);
    const original: OnboardBasicDetailsPayload = {
      name: restaurant.name,
      slug: restaurant.slug,
      address: restaurant.address || localRestaurant?.registeredAddress || '',
      city: restaurant.city || localRestaurant?.city || '',
      state: restaurant.state || '',
      pincode: restaurant.pincode || '',
      timezone: restaurant.timezone || localRestaurant?.timezone || 'Asia/Kolkata',
      contactEmail: localRestaurant?.contactEmail || '',
    };

    setDetailsRestaurant({ ...restaurant, status: statusOverrides[restaurant.slug] ?? restaurant.status });
    setDetailsOriginal(original);
    setDetailsForm(original);
    setDetailsEditMode(false);
    setDetailsQrItems([]);
    setDetailsError('');
    setDetailsSuccess('');
    setDetailsOpen(true);
    onOpenRestaurant(restaurant.id);
  }

  function closeRestaurantDetails() {
    setDetailsOpen(false);
  }

  async function saveRestaurantDetails(event: React.FormEvent) {
    event.preventDefault();
    if (!detailsRestaurant || !detailsForm || !detailsOriginal) return;

    const payload: UpdateRestaurantBasicDetailsPayload = {};
    const normalizedDraft: OnboardBasicDetailsPayload = {
      ...detailsForm,
      slug: slugify(detailsForm.slug || detailsForm.name),
      contactEmail: detailsForm.contactEmail?.trim() || undefined,
    };

    const fields: Array<keyof OnboardBasicDetailsPayload> = ['name', 'slug', 'address', 'city', 'state', 'pincode', 'timezone', 'contactEmail'];
    fields.forEach((field) => {
      const nextValue = (normalizedDraft[field] || '').trim();
      const previousValue = (detailsOriginal[field] || '').trim();
      if (nextValue !== previousValue && nextValue.length > 0) {
        payload[field] = nextValue;
      }
    });

    if (Object.keys(payload).length === 0) {
      setDetailsSuccess('No changes to save.');
      setDetailsEditMode(false);
      return;
    }

    setDetailsBusy(true);
    setDetailsError('');
    setDetailsSuccess('');

    try {
      await authApiClient.updateRestaurantBasicDetails(detailsRestaurant.id, payload);

      const updatedRow: PlatformRestaurantListItem = {
        ...detailsRestaurant,
        name: payload.name || detailsRestaurant.name,
        slug: payload.slug || detailsRestaurant.slug,
        address: payload.address || detailsRestaurant.address,
        city: payload.city || detailsRestaurant.city,
        state: payload.state || detailsRestaurant.state,
        pincode: payload.pincode || detailsRestaurant.pincode,
        timezone: payload.timezone || detailsRestaurant.timezone,
      };

      setRestaurants((previous) => previous.map((restaurant) => (restaurant.id === updatedRow.id ? updatedRow : restaurant)));
      setDetailsRestaurant(updatedRow);
      const merged = {
        ...normalizedDraft,
        ...payload,
      };
      setDetailsOriginal(merged);
      setDetailsForm(merged);
      setDetailsSuccess('Restaurant details updated successfully.');
      setDetailsEditMode(false);
      await loadRestaurants();
    } catch (apiError) {
      setDetailsError(apiError instanceof Error ? apiError.message : 'Failed to update restaurant details.');
    } finally {
      setDetailsBusy(false);
    }
  }

  async function loadRestaurantQrs() {
    if (!detailsRestaurant) return;
    setDetailsBusy(true);
    setDetailsError('');
    setDetailsSuccess('');

    try {
      const items = await authApiClient.getRestaurantQrBatch(detailsRestaurant.id);
      setDetailsQrItems(items);
      setDetailsSuccess(items.length > 0 ? 'Table QR codes loaded.' : 'No table QR codes are available for this restaurant yet.');
    } catch (apiError) {
      setDetailsError(apiError instanceof Error ? apiError.message : 'Failed to load QR codes.');
    } finally {
      setDetailsBusy(false);
    }
  }

  async function downloadQrBatch() {
    if (!detailsRestaurant) return;
    setDetailsBusy(true);
    setDetailsError('');
    setDetailsSuccess('');

    try {
      const zipResult = await authApiClient.downloadRestaurantQrBatchZip(detailsRestaurant.id);
      const objectUrl = window.URL.createObjectURL(zipResult.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = zipResult.filename;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
      setDetailsSuccess('ZIP download is ready for all table QR codes.');
    } catch (apiError) {
      setDetailsError(apiError instanceof Error ? apiError.message : 'Failed to download QR batch zip.');
    } finally {
      setDetailsBusy(false);
    }
  }

  async function handleToggleRestaurantStatus(restaurant: PlatformRestaurantListItem) {
    const nextStatus = (statusOverrides[restaurant.slug] ?? restaurant.status) === 'active' ? 'suspended' : 'active';

    setStatusBusySlug(restaurant.slug);
    setStatusOverrides((previous) => ({ ...previous, [restaurant.slug]: nextStatus }));

    try {
      onToggleRestaurantStatus(restaurant.slug);
      setRestaurants((previous) => previous.map((row) => (row.slug === restaurant.slug ? { ...row, status: nextStatus } : row)));
    } finally {
      setStatusBusySlug('');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Restaurants"
        subtitle="All tenants with status, table count, and onboarding controls."
        action={<Button onClick={openOnboarding}>Onboard Restaurant</Button>}
      />
      <div className="p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Search">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or slug" />
          </Field>
          <Field label="Status">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'suspended')}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
          <Field label="City">
            <Input value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} placeholder="Filter by city" />
          </Field>
        </div>

        {isLoading ? <div className="mb-3 text-sm text-slate-600">Loading restaurants...</div> : null}
        {error ? <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <DataTable
          columns={['Name', 'Slug', 'Status', 'Tables', 'Onboarded', 'Actions']}
          rows={rowsWithStatus.map((restaurant) => [
            <span key={`${restaurant.id}-name`} className="font-medium text-slate-900">{restaurant.name}</span>,
            <code key={`${restaurant.id}-slug`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{restaurant.slug}</code>,
            <Pill key={`${restaurant.id}-status`} tone={restaurant.status}>{restaurant.status}</Pill>,
            <span key={`${restaurant.id}-tables`}>{restaurant.tableCount}</span>,
            <span key={`${restaurant.id}-date`}>{formatClock(restaurant.onboardedAt)}</span>,
            <div key={`${restaurant.id}-actions`} className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => openRestaurantDetails(restaurant)}>Open</Button>
              <Button
                variant={restaurant.status === 'active' ? 'danger' : 'primary'}
                onClick={() => void handleToggleRestaurantStatus(restaurant)}
                disabled={statusBusySlug === restaurant.slug}
              >
                {statusBusySlug === restaurant.slug ? 'Updating...' : restaurant.status === 'active' ? 'Suspend' : 'Reactivate'}
              </Button>
            </div>,
          ])}
        />
      </div>

      {onboardOpen ? (
        <ModalShell title="Onboard Restaurant" subtitle="Single-page onboarding: basic details, floors/tables, and admin credentials." onClose={closeOnboarding}>
          {onboardError ? <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{onboardError}</div> : null}
          {onboardSuccess ? <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{onboardSuccess}</div> : null}
          {onboardAdminResult ? <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{onboardAdminResult}</div> : null}

          <form className="space-y-4" onSubmit={submitOnboarding}>
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Basic Details</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Restaurant Name"><Input value={onboardForm.basic.name} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, name: event.target.value, slug: previous.basic.slug || slugify(event.target.value) } }))} required /></Field>
                <Field label="Slug"><Input value={onboardForm.basic.slug} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, slug: slugify(event.target.value) } }))} required /></Field>
                <Field label="Address"><Input value={onboardForm.basic.address} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, address: event.target.value } }))} required /></Field>
                <Field label="City"><Input value={onboardForm.basic.city} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, city: event.target.value } }))} required /></Field>
                <Field label="State"><Input value={onboardForm.basic.state} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, state: event.target.value } }))} required /></Field>
                <Field label="Pincode"><Input value={onboardForm.basic.pincode} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, pincode: event.target.value } }))} required /></Field>
                <Field label="Timezone"><Input value={onboardForm.basic.timezone} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, timezone: event.target.value } }))} required /></Field>
                <Field label="Contact Email"><Input type="email" value={onboardForm.basic.contactEmail || ''} onChange={(event) => setOnboardForm((previous) => ({ ...previous, basic: { ...previous.basic, contactEmail: event.target.value } }))} /></Field>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Floors and Tables</div>
                <Button type="button" variant="secondary" onClick={addFloor}>Add Floor / Zone</Button>
              </div>

              <div className="space-y-3">
                {onboardForm.floors.map((floor, floorIndex) => (
                  <div key={floorIndex} className="rounded-2xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Input value={floor.name} onChange={(event) => updateFloorName(floorIndex, event.target.value)} placeholder="Floor or Zone name" />
                      <Button type="button" variant="ghost" onClick={() => removeFloor(floorIndex)} disabled={onboardForm.floors.length === 1}>Remove Floor</Button>
                    </div>
                    <div className="space-y-2">
                      {floor.tables.map((table, tableIndex) => (
                        <div key={tableIndex} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_130px_auto]">
                          <Input value={table.tableNumber} onChange={(event) => updateTable(floorIndex, tableIndex, 'tableNumber', event.target.value)} placeholder="Table number" />
                          <Input type="number" min={1} value={String(table.capacity)} onChange={(event) => updateTable(floorIndex, tableIndex, 'capacity', event.target.value)} placeholder="Capacity" />
                          <Button type="button" variant="ghost" onClick={() => removeTable(floorIndex, tableIndex)} disabled={floor.tables.length === 1}>Remove</Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button type="button" variant="secondary" onClick={() => addTable(floorIndex)}>Add Table</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Admin Credentials</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Admin Name"><Input value={onboardForm.adminName} onChange={(event) => setOnboardForm((previous) => ({ ...previous, adminName: event.target.value }))} required /></Field>
                <Field label="Admin Email"><Input type="email" value={onboardForm.adminEmail} onChange={(event) => setOnboardForm((previous) => ({ ...previous, adminEmail: event.target.value }))} required /></Field>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeOnboarding}>Close</Button>
              <Button type="submit" disabled={busyAction}>{busyAction ? 'Saving...' : 'Create Restaurant'}</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {detailsOpen && detailsRestaurant && detailsForm ? (
        <ModalShell title={detailsRestaurant.name} subtitle="Restaurant details, edits, and QR downloads." onClose={closeRestaurantDetails}>
          {detailsError ? <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{detailsError}</div> : null}
          {detailsSuccess ? <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{detailsSuccess}</div> : null}

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Slug</div>
              <div className="mt-1 font-medium text-slate-900">{detailsRestaurant.slug}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</div>
              <div className="mt-1"><Pill tone={detailsRestaurant.status}>{detailsRestaurant.status}</Pill></div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Tables</div>
              <div className="mt-1 font-medium text-slate-900">{detailsRestaurant.tableCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Onboarded</div>
              <div className="mt-1 font-medium text-slate-900">{formatClock(detailsRestaurant.onboardedAt)}</div>
            </div>
          </div>

          <form className="space-y-3" onSubmit={saveRestaurantDetails}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Basic Details</div>
              {!detailsEditMode ? (
                <Button type="button" variant="secondary" onClick={() => setDetailsEditMode(true)}>Edit</Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => {
                  setDetailsForm(detailsOriginal);
                  setDetailsEditMode(false);
                }}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Restaurant Name"><Input value={detailsForm.name} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, name: event.target.value } : previous)} required /></Field>
              <Field label="Slug"><Input value={detailsForm.slug} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, slug: slugify(event.target.value) } : previous)} required /></Field>
              <Field label="Address"><Input value={detailsForm.address} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, address: event.target.value } : previous)} required /></Field>
              <Field label="City"><Input value={detailsForm.city} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, city: event.target.value } : previous)} required /></Field>
              <Field label="State"><Input value={detailsForm.state} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, state: event.target.value } : previous)} required /></Field>
              <Field label="Pincode"><Input value={detailsForm.pincode} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, pincode: event.target.value } : previous)} required /></Field>
              <Field label="Timezone"><Input value={detailsForm.timezone} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, timezone: event.target.value } : previous)} required /></Field>
              <Field label="Contact Email"><Input type="email" value={detailsForm.contactEmail || ''} disabled={!detailsEditMode} onChange={(event) => setDetailsForm((previous) => previous ? { ...previous, contactEmail: event.target.value } : previous)} /></Field>
            </div>

            {detailsEditMode ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={detailsBusy}>{detailsBusy ? 'Saving...' : 'Save Details'}</Button>
              </div>
            ) : null}
          </form>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Table QR Codes</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => void loadRestaurantQrs()} disabled={detailsBusy}>{detailsBusy ? 'Loading...' : 'Load QRs'}</Button>
                <Button type="button" onClick={() => void downloadQrBatch()} disabled={detailsBusy}>{detailsBusy ? 'Preparing...' : 'Download All (ZIP)'}</Button>
              </div>
            </div>

            {detailsQrItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {detailsQrItems.map((item) => (
                  <div key={item.tableId} className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-sm font-medium text-slate-900">Table {item.tableNumber}</div>
                    <div className="text-xs text-slate-500">{item.floor}</div>
                    <img className="mt-2 h-36 w-36 rounded-lg border border-slate-200" src={item.qrDataUrl} alt={`QR for table ${item.tableNumber}`} />
                    <div className="mt-2">
                      <Button type="button" variant="secondary" onClick={() => downloadQr(item)}>Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">Load QRs to preview and download individual table codes.</div>
            )}
          </div>
        </ModalShell>
      ) : null}
    </Card>
  );
}
