import { useEffect, useMemo, useState } from 'react';
import {
  authApiClient,
  type AdminMenuCategory,
  type AdminMenuItem,
  type AdminMenuItemPayload,
} from '../../../authApi';
import type { RestaurantScreenProps } from './types';
import { formatCurrency } from '../../../mockData';
import { DataTable } from '../../DataTable';
import { ModalShell } from '../../ModalShell';
import { Button, Card, CardHeader, Field, Input, Pill, Select, Textarea } from '../../ui';

const DIETARY_OPTIONS = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non Veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'contains_egg', label: 'Contains Egg' },
] as const;

const ITEM_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'combo', label: 'Combo' },
  { value: 'addon_only', label: 'Add-on Only' },
] as const;

const SPICE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'hot', label: 'Hot' },
  { value: 'extra_hot', label: 'Extra Hot' },
] as const;

type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
};

type ItemFormState = {
  id?: string;
  name: string;
  description: string;
  category_ids: string[];
  primary_category_id: string;
  mrp: string;
  price: string;
  image_url: string;
  item_type: AdminMenuItemPayload['item_type'];
  dietary_type: AdminMenuItemPayload['dietary_type'];
  spice_level: NonNullable<AdminMenuItemPayload['spice_level']>;
  is_available: boolean;
};

const defaultCategoryForm: CategoryFormState = {
  name: '',
  description: '',
  image_url: '',
};

const defaultItemForm: ItemFormState = {
  name: '',
  description: '',
  category_ids: [],
  primary_category_id: '',
  mrp: '0',
  price: '0',
  image_url: '',
  item_type: 'regular',
  dietary_type: 'veg',
  spice_level: 'none',
  is_available: true,
};

function dietaryTone(type: string) {
  if (type === 'veg') return 'active';
  if (type === 'non_veg') return 'danger';
  if (type === 'vegan') return 'pending';
  return 'slate';
}

function dietaryDotClass(type: string) {
  if (type === 'veg') return 'bg-emerald-600';
  if (type === 'non_veg') return 'bg-rose-700';
  if (type === 'vegan') return 'bg-lime-600';
  return 'bg-amber-700';
}

function toItemFormState(item: AdminMenuItem): ItemFormState {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    category_ids: item.categories.map((category) => category.id),
    primary_category_id: item.categories.find((category) => category.is_primary_category)?.id || item.categories[0]?.id || '',
    mrp: String(item.mrp),
    price: String(item.price),
    image_url: item.image_url || '',
    item_type: item.item_type,
    dietary_type: item.dietary_type,
    spice_level: item.spice_level || 'none',
    is_available: item.is_available,
  };
}

export function RestaurantMenuScreen({ restaurant: _restaurant }: Pick<RestaurantScreenProps, 'restaurant'>) {
  const [categories, setCategories] = useState<AdminMenuCategory[]>([]);
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  const discountPreview = useMemo(() => {
    const mrp = Number(itemForm.mrp || 0);
    const price = Number(itemForm.price || 0);
    if (mrp <= 0 || price > mrp) return 0;
    return Number((((mrp - price) / mrp) * 100).toFixed(2));
  }, [itemForm.mrp, itemForm.price]);

  async function loadCategories() {
    const data = await authApiClient.listAdminMenuCategories();
    setCategories(data.sort((a, b) => a.display_order - b.display_order));
  }

  async function loadItems() {
    const response = await authApiClient.listAdminMenuItems({
      search: debouncedSearch || undefined,
      category_id: categoryFilter || undefined,
      dietary_type: (dietaryFilter || undefined) as AdminMenuItemPayload['dietary_type'] | undefined,
      is_available: (availabilityFilter || undefined) as 'true' | 'false' | undefined,
      page,
      limit: meta.limit,
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
    setItems(response.data);
    setMeta(response.meta);
  }

  useEffect(() => {
    setIsLoading(true);
    setError('');
    Promise.all([loadCategories(), loadItems()])
      .catch((apiError) => {
        setError(apiError instanceof Error ? apiError.message : 'Failed to load menu data');
      })
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, categoryFilter, dietaryFilter, availabilityFilter, page]);

  function openCreateCategoryModal() {
    setCategoryForm(defaultCategoryForm);
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: AdminMenuCategory) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setCategoryModalOpen(true);
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (categoryForm.id) {
        await authApiClient.updateAdminMenuCategory(categoryForm.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          image_url: categoryForm.image_url.trim() || null,
        });
      } else {
        await authApiClient.createAdminMenuCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          image_url: categoryForm.image_url.trim() || undefined,
        });
      }
      await loadCategories();
      setCategoryModalOpen(false);
      setSuccess('Category saved.');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCategory(category: AdminMenuCategory) {
    if (category.item_count > 0) return;
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApiClient.deleteAdminMenuCategory(category.id);
      await loadCategories();
      setSuccess('Category deleted.');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to delete category');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCategoryDragStart(categoryId: string) {
    setDraggingCategoryId(categoryId);
  }

  async function handleCategoryDrop(targetCategoryId: string) {
    if (!draggingCategoryId || draggingCategoryId === targetCategoryId) {
      setDraggingCategoryId(null);
      return;
    }

    const previous = [...categories];
    const current = [...categories];
    const fromIndex = current.findIndex((entry) => entry.id === draggingCategoryId);
    const toIndex = current.findIndex((entry) => entry.id === targetCategoryId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggingCategoryId(null);
      return;
    }

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setCategories(current);
    setDraggingCategoryId(null);

    try {
      await authApiClient.reorderAdminMenuCategories(current.map((entry) => entry.id));
      await loadCategories();
      setSuccess('Category order updated.');
    } catch (apiError) {
      setCategories(previous);
      setError(apiError instanceof Error ? apiError.message : 'Failed to reorder categories');
    }
  }

  function openCreateItemModal() {
    setItemForm(defaultItemForm);
    setItemModalOpen(true);
  }

  function openEditItemModal(item: AdminMenuItem) {
    setItemForm(toItemFormState(item));
    setItemModalOpen(true);
  }

  function toggleCategorySelection(categoryId: string) {
    setItemForm((previous) => {
      const selected = previous.category_ids.includes(categoryId)
        ? previous.category_ids.filter((id) => id !== categoryId)
        : [...previous.category_ids, categoryId];

      const nextPrimary = selected.includes(previous.primary_category_id)
        ? previous.primary_category_id
        : selected[0] || '';

      return {
        ...previous,
        category_ids: selected,
        primary_category_id: nextPrimary,
      };
    });
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError('');
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read image file'));
        reader.readAsDataURL(file);
      });

      const result = await authApiClient.uploadAdminMenuItemPhoto(imageDataUrl);
      setItemForm((previous) => ({ ...previous, image_url: result.image_url }));
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const mrp = Number(itemForm.mrp || 0);
      const price = Number(itemForm.price || 0);
      if (itemForm.category_ids.length === 0) {
        throw new Error('Select at least one category');
      }
      if (price > mrp) {
        throw new Error('Price must be less than or equal to MRP');
      }

      const payload: AdminMenuItemPayload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || null,
        category_ids: itemForm.category_ids,
        primary_category_id: itemForm.primary_category_id || itemForm.category_ids[0],
        mrp,
        price,
        image_url: itemForm.image_url.trim() || null,
        item_type: itemForm.item_type,
        dietary_type: itemForm.dietary_type,
        spice_level: itemForm.spice_level,
        is_available: itemForm.is_available,
      };

      if (itemForm.id) {
        await authApiClient.updateAdminMenuItem(itemForm.id, payload);
      } else {
        await authApiClient.createAdminMenuItem(payload);
      }

      await Promise.all([loadItems(), loadCategories()]);
      setItemModalOpen(false);
      setSuccess('Menu item saved.');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to save menu item');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem(item: AdminMenuItem) {
    if (!window.confirm(`Delete item "${item.name}"?`)) return;
    setIsSaving(true);
    setError('');
    try {
      await authApiClient.deleteAdminMenuItem(item.id);
      await Promise.all([loadItems(), loadCategories()]);
      setSuccess('Menu item deleted.');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to delete menu item');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAvailability(item: AdminMenuItem) {
    setError('');
    try {
      await authApiClient.setAdminMenuItemAvailability(item.id, !item.is_available);
      await loadItems();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to update availability');
    }
  }

  function renderPriceCell(item: AdminMenuItem) {
    if (Number(item.mrp) > Number(item.price)) {
      return (
        <div>
          <div className="text-xs text-slate-400 line-through">{formatCurrency(Number(item.mrp))}</div>
          <div className="font-medium text-slate-900">{formatCurrency(Number(item.price))}</div>
          <div className="text-xs text-emerald-700">{item.discount_percentage}% off</div>
        </div>
      );
    }
    return <span className="font-medium text-slate-900">{formatCurrency(Number(item.price))}</span>;
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

      <Card>
        <CardHeader
          title="Menu Categories"
          subtitle="Drag to reorder categories."
          action={<Button onClick={openCreateCategoryModal}>Add Category</Button>}
        />
        <div className="space-y-2 p-4 sm:p-5">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={() => handleCategoryDragStart(category.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                void handleCategoryDrop(category.id);
              }}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{category.name}</div>
                <div className="text-xs text-slate-500">{category.item_count} item(s)</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => openEditCategoryModal(category)}>Edit</Button>
                <Button
                  variant="danger"
                  disabled={category.item_count > 0 || isSaving}
                  title={category.item_count > 0 ? 'Cannot delete a category with mapped items' : 'Delete category'}
                  onClick={() => {
                    void deleteCategory(category);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {categories.length === 0 ? <div className="text-sm text-slate-500">No categories found.</div> : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Menu Items"
          subtitle="Filter and manage item details and availability."
          action={<Button onClick={openCreateItemModal}>Add Item</Button>}
        />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <Input placeholder="Search name or description" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={categoryFilter} onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
            <Select value={dietaryFilter} onChange={(event) => {
              setDietaryFilter(event.target.value);
              setPage(1);
            }}>
              <option value="">All dietary types</option>
              {DIETARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
            <Select value={availabilityFilter} onChange={(event) => {
              setAvailabilityFilter(event.target.value);
              setPage(1);
            }}>
              <option value="">All availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </Select>
          </div>

          <DataTable
            columns={['Item', 'Categories', 'Price', 'Dietary', 'Spice', 'Availability', 'Actions']}
            rows={items.map((item) => [
              <div key={`${item.id}-name`} className="flex items-start gap-2">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" /> : <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-100" />}
                <div>
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.item_type}</div>
                </div>
              </div>,
              <div key={`${item.id}-categories`} className="flex flex-wrap gap-1">
                {item.categories.map((category) => (
                  <Pill key={`${item.id}-${category.id}`} tone={category.is_primary_category ? 'active' : 'slate'}>{category.name}</Pill>
                ))}
              </div>,
              <div key={`${item.id}-price`}>{renderPriceCell(item)}</div>,
              <div key={`${item.id}-diet`} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${dietaryDotClass(item.dietary_type)}`} />
                <Pill tone={dietaryTone(item.dietary_type)}>{item.dietary_type}</Pill>
              </div>,
              <span key={`${item.id}-spice`} className="text-sm text-slate-600">{item.spice_level || '—'}</span>,
              <div key={`${item.id}-availability`} className="flex items-center gap-2">
                <Pill tone={item.is_available ? 'active' : 'pending'}>{item.is_available ? 'Available' : 'Unavailable'}</Pill>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void toggleAvailability(item);
                  }}
                >
                  Toggle
                </Button>
              </div>,
              <div key={`${item.id}-actions`} className="flex gap-2">
                <Button variant="secondary" onClick={() => openEditItemModal(item)}>Edit</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    void deleteItem(item);
                  }}
                >
                  Delete
                </Button>
              </div>,
            ])}
          />

          {!isLoading && items.length === 0 ? <div className="text-sm text-slate-500">No menu items found for current filters.</div> : null}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages} • {meta.total} total</div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={meta.page <= 1}
                onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((previous) => Math.min(previous + 1, meta.totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {categoryModalOpen ? (
        <ModalShell
          title={categoryForm.id ? 'Edit Category' : 'Add Category'}
          subtitle="Update category name, description, and image URL."
          onClose={() => setCategoryModalOpen(false)}
        >
          <form className="space-y-3" onSubmit={(event) => {
            void saveCategory(event);
          }}>
            <Field label="Name"><Input value={categoryForm.name} onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))} required /></Field>
            <Field label="Description"><Textarea rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
            <Field label="Image URL"><Input value={categoryForm.image_url} onChange={(event) => setCategoryForm((previous) => ({ ...previous, image_url: event.target.value }))} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Category'}</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {itemModalOpen ? (
        <ModalShell
          title={itemForm.id ? 'Edit Menu Item' : 'Add Menu Item'}
          subtitle="Create or update item pricing, categories, and availability."
          onClose={() => setItemModalOpen(false)}
        >
          <form className="space-y-3" onSubmit={(event) => {
            void saveItem(event);
          }}>
            <Field label="Name"><Input value={itemForm.name} onChange={(event) => setItemForm((previous) => ({ ...previous, name: event.target.value }))} required /></Field>
            <Field label="Description"><Textarea rows={3} value={itemForm.description} onChange={(event) => setItemForm((previous) => ({ ...previous, description: event.target.value }))} /></Field>
            <Field label="Photo Upload">
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={(event) => {
                  void handlePhotoUpload(event);
                }} disabled={isUploadingImage} />
                {isUploadingImage ? <span className="text-xs text-slate-500">Uploading...</span> : null}
              </div>
              {itemForm.image_url ? <img src={itemForm.image_url} alt="Preview" className="mt-2 h-20 w-20 rounded-lg border border-slate-200 object-cover" /> : null}
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="MRP"><Input type="number" min="0" step="0.01" value={itemForm.mrp} onChange={(event) => setItemForm((previous) => ({ ...previous, mrp: event.target.value }))} required /></Field>
              <Field label="Price"><Input type="number" min="0" step="0.01" value={itemForm.price} onChange={(event) => setItemForm((previous) => ({ ...previous, price: event.target.value }))} required /></Field>
            </div>
            <div className="text-xs text-slate-500">Discount preview: {discountPreview}%</div>

            <Field label="Categories">
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <label key={category.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={itemForm.category_ids.includes(category.id)}
                      onChange={() => toggleCategorySelection(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Primary Category">
              <Select
                value={itemForm.primary_category_id}
                onChange={(event) => setItemForm((previous) => ({ ...previous, primary_category_id: event.target.value }))}
                disabled={itemForm.category_ids.length === 0}
              >
                <option value="">Select primary category</option>
                {categories
                  .filter((category) => itemForm.category_ids.includes(category.id))
                  .map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Dietary Type">
                <Select value={itemForm.dietary_type} onChange={(event) => setItemForm((previous) => ({ ...previous, dietary_type: event.target.value as ItemFormState['dietary_type'] }))}>
                  {DIETARY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Spice Level">
                <Select value={itemForm.spice_level} onChange={(event) => setItemForm((previous) => ({ ...previous, spice_level: event.target.value as ItemFormState['spice_level'] }))}>
                  {SPICE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Item Type">
                <Select value={itemForm.item_type} onChange={(event) => setItemForm((previous) => ({ ...previous, item_type: event.target.value as ItemFormState['item_type'] }))}>
                  {ITEM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Available">
                <Select value={itemForm.is_available ? 'true' : 'false'} onChange={(event) => setItemForm((previous) => ({ ...previous, is_available: event.target.value === 'true' }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setItemModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving || isUploadingImage}>{isSaving ? 'Saving...' : 'Save Item'}</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
