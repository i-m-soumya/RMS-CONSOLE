import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authApiClient,
  type FloorInput,
  type OnboardBasicDetailsPayload,
  type PlatformRestaurantListItem,
  type TableQrArtifact,
} from '../../../authApi';
import { formatClock } from '../../../mockData';
import { ModalShell } from '../../ModalShell';
import { DataTable } from '../../DataTable';
import { Button, Card, CardHeader, Field, Input, Pill, Select } from '../../ui';
import type { PlatformScreenProps } from './types';

export function PlatformRestaurantsScreen({ state, onOpenRestaurant, onToggleRestaurantStatus }: Pick<PlatformScreenProps, 'state' | 'onOpenRestaurant' | 'onToggleRestaurantStatus'>) {
  const [restaurants, setRestaurants] = useState<PlatformRestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [cityFilter, setCityFilter] = useState('');

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 5 | 6 | 7>(1);
  const [busyAction, setBusyAction] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardSuccess, setOnboardSuccess] = useState('');

  const [basicDetails, setBasicDetails] = useState<OnboardBasicDetailsPayload>({
    name: '',
    slug: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    timezone: 'Asia/Kolkata',
    contactEmail: '',
  });

  const [draftRestaurant, setDraftRestaurant] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [floors, setFloors] = useState<FloorInput[]>([
    { name: 'Ground Floor', tables: [{ tableNumber: '1', capacity: 4 }] },
  ]);
  const [qrItems, setQrItems] = useState<TableQrArtifact[]>([]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminResult, setAdminResult] = useState('');

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
      })),
    [state.restaurants],
  );

  const sourceRows = restaurants.length > 0 ? restaurants : fallbackRows;

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
    setOnboardStep(1);
    setBusyAction(false);
    setOnboardError('');
    setOnboardSuccess('');
    setDraftRestaurant(null);
    setFloors([{ name: 'Ground Floor', tables: [{ tableNumber: '1', capacity: 4 }] }]);
    setQrItems([]);
    setAdminName('');
    setAdminEmail('');
    setAdminResult('');
    setBasicDetails({
      name: '',
      slug: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      timezone: 'Asia/Kolkata',
      contactEmail: '',
    });
  }

  function openOnboarding() {
    resetOnboarding();
    setOnboardOpen(true);
  }

  function closeOnboarding() {
    setOnboardOpen(false);
  }

  async function submitBasicDetails(event: React.FormEvent) {
    event.preventDefault();
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');

    try {
      const created = await authApiClient.createRestaurantBasicDetails({
        ...basicDetails,
        slug: slugify(basicDetails.slug || basicDetails.name),
      });
      setDraftRestaurant(created);
      setOnboardStep(5);
      setOnboardSuccess('Step 1 completed. Basic details saved.');
      await loadRestaurants();
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to save basic details.');
    } finally {
      setBusyAction(false);
    }
  }

  function addFloor() {
    setFloors((previous) => [...previous, { name: `Floor ${previous.length + 1}`, tables: [{ tableNumber: '1', capacity: 4 }] }]);
  }

  function removeFloor(index: number) {
    setFloors((previous) => previous.filter((_, floorIndex) => floorIndex !== index));
  }

  function updateFloorName(index: number, name: string) {
    setFloors((previous) => previous.map((floor, floorIndex) => (floorIndex === index ? { ...floor, name } : floor)));
  }

  function addTable(floorIndex: number) {
    setFloors((previous) =>
      previous.map((floor, idx) =>
        idx === floorIndex
          ? {
              ...floor,
              tables: [...floor.tables, { tableNumber: String(floor.tables.length + 1), capacity: 4 }],
            }
          : floor,
      ),
    );
  }

  function removeTable(floorIndex: number, tableIndex: number) {
    setFloors((previous) =>
      previous.map((floor, idx) =>
        idx === floorIndex
          ? {
              ...floor,
              tables: floor.tables.filter((_, innerIndex) => innerIndex !== tableIndex),
            }
          : floor,
      ),
    );
  }

  function updateTable(floorIndex: number, tableIndex: number, key: 'tableNumber' | 'capacity', value: string) {
    setFloors((previous) =>
      previous.map((floor, idx) => {
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
    );
  }

  async function submitFloorsAndTables() {
    if (!draftRestaurant) return;
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');

    try {
      await authApiClient.saveFloorsAndTables(draftRestaurant.id, floors);
      setOnboardStep(6);
      setOnboardSuccess('Step 5 completed. Floors and tables saved.');
      await loadRestaurants();
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to save floors and tables.');
    } finally {
      setBusyAction(false);
    }
  }

  async function generateQRCodes() {
    if (!draftRestaurant) return;
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');

    try {
      const items = await authApiClient.generateRestaurantQRCodes(draftRestaurant.id);
      setQrItems(items);
      setOnboardSuccess('Step 6 completed. QR codes generated for all tables.');
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to generate QR codes.');
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

  async function downloadQrBatch() {
    if (!draftRestaurant) return;
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');

    try {
      const zipResult = await authApiClient.downloadRestaurantQrBatchZip(draftRestaurant.id);
      const objectUrl = window.URL.createObjectURL(zipResult.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = zipResult.filename;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
      setOnboardSuccess('ZIP download is ready for all table QR codes.');
      setOnboardStep(7);
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to download QR batch zip.');
    } finally {
      setBusyAction(false);
    }
  }

  async function createAdminCredentials(event: React.FormEvent) {
    event.preventDefault();
    if (!draftRestaurant) return;
    setBusyAction(true);
    setOnboardError('');
    setOnboardSuccess('');
    setAdminResult('');

    try {
      const response = await authApiClient.createRestaurantAdminCredentials(draftRestaurant.id, {
        name: adminName,
        email: adminEmail,
      });
      setAdminResult(`Temp password: ${response.tempPassword}`);
      setOnboardSuccess(response.emailDelivery.sent ? 'Step 7 completed. Admin account created and email sent.' : 'Admin created, but email delivery needs retry.');
      await loadRestaurants();
    } catch (apiError) {
      setOnboardError(apiError instanceof Error ? apiError.message : 'Failed to create admin credentials.');
    } finally {
      setBusyAction(false);
    }
  }

  const stepLabel = onboardStep === 1 ? 'Step 1 · Basic Details' : onboardStep === 5 ? 'Step 5 · Floors & Tables' : onboardStep === 6 ? 'Step 6 · QR Generation' : 'Step 7 · Admin Credentials';

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
          columns={["Name", "Slug", "Status", "Tables", "Onboarded", "Actions"]}
          rows={sourceRows.map((restaurant) => [
            <span key={`${restaurant.id}-name`} className="font-medium text-slate-900">{restaurant.name}</span>,
            <code key={`${restaurant.id}-slug`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{restaurant.slug}</code>,
            <Pill key={`${restaurant.id}-status`} tone={restaurant.status}>{restaurant.status}</Pill>,
            <span key={`${restaurant.id}-tables`}>{restaurant.tableCount}</span>,
            <span key={`${restaurant.id}-date`}>{formatClock(restaurant.onboardedAt)}</span>,
            <div key={`${restaurant.id}-actions`} className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onOpenRestaurant(restaurant.slug)}>Open</Button>
              <Button variant={restaurant.status === 'active' ? 'danger' : 'primary'} onClick={() => onToggleRestaurantStatus(restaurant.slug)}>
                {restaurant.status === 'active' ? 'Suspend' : 'Reactivate'}
              </Button>
            </div>,
          ])}
        />
      </div>

      {onboardOpen ? (
        <ModalShell title="Onboard Restaurant" subtitle={stepLabel} onClose={closeOnboarding}>
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {[1, 5, 6, 7].map((step) => (
              <span
                key={step}
                className={`rounded-full border px-3 py-1 ${onboardStep === step ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                Step {step}
              </span>
            ))}
          </div>

          {onboardError ? <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{onboardError}</div> : null}
          {onboardSuccess ? <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{onboardSuccess}</div> : null}

          {onboardStep === 1 ? (
            <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={submitBasicDetails}>
              <Field label="Restaurant Name"><Input value={basicDetails.name} onChange={(event) => setBasicDetails((previous) => ({ ...previous, name: event.target.value, slug: previous.slug || slugify(event.target.value) }))} required /></Field>
              <Field label="Slug"><Input value={basicDetails.slug} onChange={(event) => setBasicDetails((previous) => ({ ...previous, slug: slugify(event.target.value) }))} required /></Field>
              <Field label="Address" ><Input value={basicDetails.address} onChange={(event) => setBasicDetails((previous) => ({ ...previous, address: event.target.value }))} required /></Field>
              <Field label="City"><Input value={basicDetails.city} onChange={(event) => setBasicDetails((previous) => ({ ...previous, city: event.target.value }))} required /></Field>
              <Field label="State"><Input value={basicDetails.state} onChange={(event) => setBasicDetails((previous) => ({ ...previous, state: event.target.value }))} required /></Field>
              <Field label="Pincode"><Input value={basicDetails.pincode} onChange={(event) => setBasicDetails((previous) => ({ ...previous, pincode: event.target.value }))} required /></Field>
              <Field label="Timezone"><Input value={basicDetails.timezone} onChange={(event) => setBasicDetails((previous) => ({ ...previous, timezone: event.target.value }))} required /></Field>
              <Field label="Contact Email"><Input type="email" value={basicDetails.contactEmail || ''} onChange={(event) => setBasicDetails((previous) => ({ ...previous, contactEmail: event.target.value }))} /></Field>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeOnboarding}>Cancel</Button>
                <Button type="submit" disabled={busyAction}>{busyAction ? 'Saving...' : 'Save & Continue'}</Button>
              </div>
            </form>
          ) : null}

          {onboardStep === 5 ? (
            <div className="space-y-3">
              {floors.map((floor, floorIndex) => (
                <div key={floorIndex} className="rounded-2xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Input value={floor.name} onChange={(event) => updateFloorName(floorIndex, event.target.value)} placeholder="Floor or Zone name" />
                    <Button type="button" variant="ghost" onClick={() => removeFloor(floorIndex)} disabled={floors.length === 1}>Remove Floor</Button>
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

              <div className="flex flex-wrap justify-between gap-2">
                <Button type="button" variant="secondary" onClick={addFloor}>Add Floor / Zone</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOnboardStep(1)}>Back</Button>
                  <Button type="button" onClick={submitFloorsAndTables} disabled={busyAction || !draftRestaurant}>{busyAction ? 'Saving...' : 'Save & Continue'}</Button>
                </div>
              </div>
            </div>
          ) : null}

          {onboardStep === 6 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={generateQRCodes} disabled={busyAction || !draftRestaurant}>{busyAction ? 'Generating...' : 'Generate QRs'}</Button>
                <Button type="button" variant="secondary" onClick={downloadQrBatch} disabled={busyAction || !draftRestaurant}>Download Batch</Button>
                <Button type="button" variant="ghost" onClick={() => setOnboardStep(5)}>Back</Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {qrItems.map((item) => (
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

              <div className="flex justify-end">
                <Button type="button" onClick={() => setOnboardStep(7)} disabled={qrItems.length === 0}>Continue to Admin Credentials</Button>
              </div>
            </div>
          ) : null}

          {onboardStep === 7 ? (
            <form className="space-y-3" onSubmit={createAdminCredentials}>
              <Field label="Admin Name"><Input value={adminName} onChange={(event) => setAdminName(event.target.value)} required /></Field>
              <Field label="Admin Email"><Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required /></Field>
              {adminResult ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{adminResult}</div> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOnboardStep(6)}>Back</Button>
                <Button type="submit" disabled={busyAction || !draftRestaurant}>{busyAction ? 'Creating...' : 'Create Admin & Send Email'}</Button>
              </div>
            </form>
          ) : null}
        </ModalShell>
      ) : null}
    </Card>
  );
}
