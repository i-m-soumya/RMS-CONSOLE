import { useEffect, useState } from 'react';
import { authApiClient, type AdminStaffListItem } from '../../../authApi';
import { DataTable } from '../../DataTable';
import { ModalShell } from '../../ModalShell';
import { Button, Card, CardHeader, Field, Input, Pill, Select } from '../../ui';
import type { RestaurantScreenProps } from './types';

type CreateStaffFormState = {
  name: string;
  email: string;
  phone: string;
  role: 'waiter' | 'chef';
};

const defaultCreateStaffForm: CreateStaffFormState = {
  name: '',
  email: '',
  phone: '',
  role: 'waiter',
};

function formatLastLogin(value: string | null) {
  if (!value) return 'Never logged in';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export function RestaurantStaffScreen({ restaurant: _restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  const [rows, setRows] = useState<AdminStaffListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffFormState>(defaultCreateStaffForm);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  async function loadStaff() {
    setIsLoading(true);
    setError('');
    try {
      const data = await authApiClient.listAdminStaff({
        role: (roleFilter || undefined) as 'waiter' | 'chef' | undefined,
        access: (accessFilter || undefined) as 'active' | 'revoked' | undefined,
        search: debouncedSearch || undefined,
      });
      setRows(data);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, [debouncedSearch, roleFilter, accessFilter]);

  async function submitCreateStaff(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await authApiClient.createAdminStaff({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || null,
        role: createForm.role,
      });
      setSuccess(result.invite_sent ? `Invite sent to ${result.email}.` : `Staff account created for ${result.email}, but email delivery failed.`);
      setCreateForm(defaultCreateStaffForm);
      setCreateModalOpen(false);
      await loadStaff();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to create staff');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAccess(staff: AdminStaffListItem) {
    const nextAccess = staff.access === 'active' ? 'revoked' : 'active';
    if (!window.confirm(`${nextAccess === 'revoked' ? 'Revoke' : 'Reactivate'} ${staff.name}?`)) {
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApiClient.updateAdminStaffAccess(staff.id, nextAccess);
      await loadStaff();
      setSuccess(`Staff access updated to ${nextAccess}.`);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to update staff access');
    } finally {
      setIsSaving(false);
    }
  }

  async function resendCredentials(staff: AdminStaffListItem) {
    if (!window.confirm(`Resend credentials to ${staff.email}?`)) {
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApiClient.resendAdminStaffCredentials(staff.id);
      setSuccess(`Credentials sent to ${staff.email}.`);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to resend credentials');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Staff"
        subtitle="Manage waiter and chef accounts, access, and login presence."
        action={<Button onClick={() => setCreateModalOpen(true)}>Add Staff</Button>}
      />
      <div className="space-y-4 p-4 sm:p-5">
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <Input placeholder="Search name/email/phone" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All roles</option>
            <option value="waiter">Waiter</option>
            <option value="chef">Chef</option>
          </Select>
          <Select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value)}>
            <option value="">All access</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </Select>
          <Button variant="secondary" onClick={() => {
            setSearch('');
            setRoleFilter('');
            setAccessFilter('');
          }}>Reset Filters</Button>
        </div>

        <DataTable
          columns={['Staff', 'Role', 'Access', 'Presence', 'Last Login', 'Security', 'Actions']}
          rows={rows.map((staff) => [
            <div key={`${staff.id}-staff`} className="flex items-center gap-3">
              {staff.profile_photo_url ? (
                <img src={staff.profile_photo_url} alt={staff.name} className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
              ) : (
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                  {initials(staff.name)}
                </div>
              )}
              <div>
                <div className="font-medium text-slate-900">{staff.name}</div>
                <div className="text-xs text-slate-500">{staff.email}</div>
              </div>
            </div>,
            <Pill key={`${staff.id}-role`} tone="slate">{staff.role}</Pill>,
            <Pill key={`${staff.id}-access`} tone={staff.access === 'active' ? 'active' : 'rejected'}>{staff.access}</Pill>,
            <div key={`${staff.id}-presence`} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${staff.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-sm text-slate-700">{staff.is_online ? 'Online' : 'Offline'}</span>
            </div>,
            <span key={`${staff.id}-last-login`} className="text-sm text-slate-600">{formatLastLogin(staff.last_login_at)}</span>,
            <div key={`${staff.id}-security`} className="space-y-1 text-xs text-slate-600">
              <div>Failed attempts: {staff.failed_login_attempts || 0}</div>
              {staff.locked_until ? <div className="text-amber-700">Locked until: {new Date(staff.locked_until).toLocaleString()}</div> : <div>Not locked</div>}
            </div>,
            <div key={`${staff.id}-actions`} className="flex flex-wrap gap-2">
              <Button
                variant={staff.access === 'active' ? 'danger' : 'secondary'}
                onClick={() => {
                  void toggleAccess(staff);
                }}
                disabled={isSaving}
              >
                {staff.access === 'active' ? 'Revoke' : 'Reactivate'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  void resendCredentials(staff);
                }}
                disabled={isSaving}
              >
                Resend Credentials
              </Button>
            </div>,
          ])}
        />

        {!isLoading && rows.length === 0 ? <div className="text-sm text-slate-500">No staff found for current filters.</div> : null}
      </div>

      {createModalOpen ? (
        <ModalShell
          title="Add Staff"
          subtitle="Create waiter or chef account and send invite email."
          onClose={() => setCreateModalOpen(false)}
        >
          <form className="space-y-3" onSubmit={(event) => {
            void submitCreateStaff(event);
          }}>
            <Field label="Name"><Input value={createForm.name} onChange={(event) => setCreateForm((previous) => ({ ...previous, name: event.target.value }))} required /></Field>
            <Field label="Email"><Input type="email" value={createForm.email} onChange={(event) => setCreateForm((previous) => ({ ...previous, email: event.target.value }))} required /></Field>
            <Field label="Phone (optional)"><Input value={createForm.phone} onChange={(event) => setCreateForm((previous) => ({ ...previous, phone: event.target.value }))} /></Field>
            <Field label="Role">
              <Select value={createForm.role} onChange={(event) => setCreateForm((previous) => ({ ...previous, role: event.target.value as 'waiter' | 'chef' }))}>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Staff'}</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </Card>
  );
}
