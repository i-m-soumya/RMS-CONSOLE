# Console — Admin Portal
## Build Prompt & Functional/API Specification
> Product: Digital Menu Card System — Admin Portal ("Console")
> Users: Business User (Platform Admin), Restaurant Admin, Waiter, Chef
> Source of truth: Business Handbook v1.0 (June 2026)
> Stack: React.js (frontend) · Node.js/Express (backend) · MySQL 8.0 · Socket.io (real-time)

---

## 0. How To Use This Document

This is a build prompt for an AI coding agent or a development team. It defines:
- What "Console" is and who uses it
- The full feature set per role (nothing deferred to "later" unless explicitly marked V2 in the handbook)
- The UI/UX direction
- Every API endpoint required, grouped by module, with purpose, auth, request, and response shape

Treat every "V1 Limitation" in the handbook as a hard boundary — do not build V2-only features (multi-outlet, payment gateway, coupons, split bill, addon groups, combos, reservations, OTP login, WhatsApp/SMS). Build the schema-ready stubs as inert fields only, never as active UI/API surface.

---

## 1. What Is Console

Console is the single web application used by everyone **except the dining customer**. It replaces what the handbook calls the "Admin App" and the "Platform Dashboard" — Console is both, gated by role.

| Role | Entry URL | Scope |
|---|---|---|
| Business User (Platform Admin) | `xyz.com/console/platform` | Entire SaaS platform, all restaurants |
| Restaurant Admin | `xyz.com/console/{restaurant-slug}` | One restaurant, full operational + config access |
| Waiter | `xyz.com/console/{restaurant-slug}` | One restaurant, floor operations |
| Chef | `xyz.com/console/{restaurant-slug}` | One restaurant, kitchen operations |

Restaurant-scoped roles (Admin, Waiter, Chef) share **one login screen and one app shell**; the sidebar and available screens change based on `role` returned at login. Business User has a fully separate login screen and shell (different data domain — never mixes with restaurant staff, per handbook §3).

---

## 2. UI/UX Direction

**Reference aesthetic: Jira / Linear-style enterprise tooling.** Not a marketing site, not a flashy consumer app. This is a tool people use for 8+ hours a day — optimize for density, scan-ability, and speed, not decoration.

### Design Principles
- **Neutral base palette**: whites/greys (#F7F8FA background, #FFFFFF surface, #DFE1E6 borders), one primary accent color (blue, e.g. #0052CC) used sparingly for primary actions and active states, semantic colors only for status (green=success/ready, amber=pending/warning, red=rejected/error, grey=inactive/closed).
- **Left sidebar navigation**, collapsible, icon + label. Top bar shows restaurant name/slug (or "Platform"), current user, notification bell, logout.
- **Dense data tables** as the default pattern for lists (staff, menu items, orders, bills, restaurants) — sortable columns, inline row actions, pagination, filter bar above the table. No card-grid layouts for data lists.
- **Status as colored pill/badge**, not icons alone.
- **Modals/drawers** for create/edit forms (side drawer preferred over full-page navigation for CRUD, keeps user in context).
- **Kitchen Display (Chef) and Table Overview (Waiter)** are the two exceptions to the table-first rule — these are real-time operational boards and should use a card/kanban-style layout since they map to physical tables/orders and need at-a-glance status.
- **Typography**: system font stack or Inter, 13–14px base body size, clear heading hierarchy, no decorative fonts.
- **No gradients, no drop shadows beyond subtle elevation on modals/dropdowns, no illustrations.** Icons from a single consistent icon set (e.g. Lucide/Feather), used functionally not decoratively.
- **Real-time indicators**: a small live-connection dot, toast notifications for socket events (new order, bill requested, item out of stock), never blocking modals for non-critical real-time events.
- **Empty states**: simple, one line of text + one primary action, no illustrations.
- **Forms**: label above field, inline validation, clear required-field marking, disabled submit until valid.
- **Accessibility**: sufficient contrast, keyboard navigable tables and modals, focus states visible.

### Navigation Structure (Restaurant-scoped shell: Admin / Waiter / Chef)
Sidebar sections shown are filtered by role per the permission matrix in §3.

```
Dashboard
Tables & Sessions        (Waiter, Admin)
Kitchen Display           (Chef)
Orders                     (Waiter, Admin, Chef — scoped views)
Bills & Payments          (Waiter, Admin)
Menu                       (Admin)
  ├─ Categories
  ├─ Items
  ├─ Addons
  └─ Availability Log
Staff                       (Admin)
Reports                    (Admin)
Settings                   (Admin)
  ├─ Restaurant Profile
  ├─ GST Configuration
  ├─ Operating Hours
  └─ Change Requests
Notifications               (all)
```

### Navigation Structure (Platform shell: Business User)
```
Dashboard
Restaurants
  ├─ All Restaurants
  ├─ Onboard New Restaurant
  └─ Suspended Restaurants
Change Requests
QR Codes
Contact Queries
Registrations (SaaS leads)
Analytics
Settings
```

---

## 3. Roles & Permission Matrix

| Capability | Business User | Restaurant Admin | Waiter | Chef |
|---|:---:|:---:|:---:|:---:|
| Onboard restaurant | ✓ | — | — | — |
| Suspend/reactivate restaurant | ✓ | — | — | — |
| Generate/regenerate QR codes | ✓ | — | — | — |
| Approve/reject change requests | ✓ | — | — | — |
| View platform analytics, contact queries, registrations | ✓ | — | — | — |
| Manage menu (categories, items, addons, pairings) | — | ✓ | — | — |
| Manage staff (create/revoke Waiter, Chef) | — | ✓ | — | — |
| View sales reports | — | ✓ | — | — |
| Set operating hours | — | ✓ | — | — |
| Update GSTIN / GST config | — | ✓ | — | — |
| Raise change request | — | ✓ | — | — |
| Open table session | — | ✓ | ✓ | — |
| Confirm/reject customer orders | — | ✓ | ✓ | — |
| Place direct order | — | ✓ | ✓ | — |
| Generate/amend bill, record payment | — | ✓ | ✓ | — |
| Reset session | — | ✓ | ✓ | — |
| Toggle item availability | — | ✓ | ✓ | ✓ |
| View kitchen queue | — | — | — | ✓ |
| Mark order preparing/ready | — | — | — | ✓ |
| Reject order/item (out of stock) | — | — | — | ✓ |
| View staff activity log (own actions) | — | ✓ | via reports | via shift history |

---

## 4. Feature Specification by Role

### 4.1 Business User (Platform Admin)

**Auth & Security**
- Separate login table/domain from restaurant staff (never mixed)
- Account lockout after 5 consecutive failed attempts
- V1 has a single role `super` (no per-account access levels; `operator` role UI is not built in V1 — do not expose it)

**Restaurant Management**
- List all restaurants: name, slug, status (active/suspended), table count, onboarded date — filterable/searchable table
- Onboard new restaurant — multi-step form matching the exact onboarding checklist:
  1. Basic details (name, slug, address, city, state, pincode, timezone)
  2. Branding (logo upload/URL, welcome message)
  3. Contact details (primary phone/email, optional manager phone / reservations email)
  4. GST configuration (toggle GST-registered; if yes: GSTIN with live regex validation, legal name, registered address, GST slab dropdown 5/12/18%, SAC code defaulting to 996331)
  5. Floors & tables (add floor/zone, add tables with table number + seating capacity)
  6. QR generation (auto-generate one QR per table, downloadable as a batch ZIP or individual PNG/SVG)
  7. Admin credentials (create Restaurant Admin account, email + temp password, "send credentials" action)
- Edit any restaurant's details at any time (reuses the onboarding form, pre-filled)
- Suspend restaurant (confirmation modal — must clearly state consequence: staff logins blocked, customer app shows "Restaurant Unavailable", no new sessions/orders, no data deleted)
- Reactivate restaurant
- Regenerate QR codes for specific tables (only via approved change request — see below)

**Change Requests**
- Queue/list of pending change requests across all restaurants: type (`slug_change`, `table_count_increase`, `table_count_decrease`, `qr_regeneration`), restaurant, raised date, status
- Approve → applies the change (updates slug/table count/QR), records `actioned_at`, notifies Restaurant Admin
- Reject → requires a rejection reason, notifies Restaurant Admin
- Enforce: only one pending request per type per restaurant at a time (surfaced as a disabled state, not a silent block)

**SaaS Analytics Dashboard**
- Website views (by day/week/month, by page, by referrer/city/device) — read-only charts
- Contact query inbox: list, mark resolved, flag as spam
- Registrations (leads) list: `converted` flag, conversion rate metric, link registration → onboarded restaurant
- Platform-wide orders & revenue (raw aggregation query in V1, not pre-computed — acceptable to show a loading state on this widget)
- Active vs suspended restaurant counts
- Churn signal list: restaurants with zero orders in the last 30 days

**Explicitly out of scope for Business User** (per handbook): placing orders, viewing a restaurant's live operational data (orders/sessions/live tables) — Console must not expose these screens to this role even via URL manipulation (enforce server-side, not just hidden nav).

---

### 4.2 Restaurant Admin

**Auth**
- Single-device session enforced — new login shows the previous device a 30-second "logged out on another device" warning before forced logout
- Lockout after 5 failed attempts

**Dashboard**
- Today's snapshot: active sessions count, orders in progress, revenue today, top item today
- Quick links into Tables, Kitchen (view-only), Reports

**Menu Management**
- Categories: CRUD, drag-to-reorder (`display_order`), cannot delete a category that is any active item's primary category (block with explanation, not silent failure)
- Items: full CRUD
  - Name, description, photo upload, MRP (mandatory), Selling Price (optional — auto-computes and displays discount % / amount)
  - Multiple categories per item + one primary category selector
  - Dietary type (mandatory: veg/non-veg/vegan/contains-egg) and spice level (optional) as icon-pickers
  - Item type: `regular` or `scheduled` (scheduled shows a from/until time picker; UI must warn that midnight-spanning windows are unsupported)
  - Manual availability toggle (in-stock/out-of-stock) with reason field
  - Item pairings picker (search + add other items; shown bidirectionally, no need to set both directions)
  - Ratings visibility toggle (`show_ratings`) per item
- Addons: CRUD at restaurant level (not per-item), link/unlink to multiple items via a multi-select, price ≥ 0 validation, duplicate-name prevention
- Availability Log: read-only table of every availability change — who, when, reason (manual/chef_rejection)

**Staff Management**
- List staff (Waiter, Chef only — Admin cannot create other Admins)
- Create staff: name, email, role, auto-generates temp password, "resend credentials" action
- Revoke access: immediate — kills active session, confirmation modal
- View last login / current session status per staff member

**Reports**
- Revenue by day/week/month (chart + table, exportable to CSV)
- Top selling items
- Order history (filterable by date range, status, table)
- Table turnover data
- Customer visit frequency (registered customers only)

**Operating Hours**
- Per day of week: open/close time, support for a second split shift on the same day
- Mark specific days as weekly off
- Validation: no overlapping shifts on the same day (validated on save with a clear inline error)
- Timezone shown explicitly (restaurant's configured timezone, default Asia/Kolkata)

**GST Settings**
- Toggle GST-registered on/off
- GSTIN input with live regex validation (format `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`), legal business name, registered address, GST slab (5/12/18%), SAC code
- Self-service — no Platform Admin approval needed; effective immediately for future bills; historical bills unaffected (must be communicated in UI copy)

**Change Requests**
- Raise a request: slug change, table count increase/decrease, QR regeneration — form varies by type
- Track own requests: pending/approved/rejected with reason
- UI must warn, before submission of a slug change, that all existing printed QR codes will break immediately on approval

**Tables/Waiter/Kitchen access**: Restaurant Admin inherits all Waiter capabilities (see 4.3) and can view (read-only) the Kitchen Display.

---

### 4.3 Waiter

**Auth**: single-device session enforced, same as Admin.

**Table Overview** (kanban/card board, not a data table)
- Grid of tables grouped by floor/zone, each card shows: table number, status (idle/active/bill_requested), seating capacity, elapsed time if active
- "Open Table" action on idle tables → creates session
- Tapping an active table opens the Session Detail drawer

**Session Detail (drawer)**
- Live order feed for this session (all statuses)
- "Enter Direct Order" — item search, quantity, notes, addon selection → sent straight to kitchen, attributed to the waiter
- "Reset Session" — confirmation modal explaining all customer tokens will be invalidated and table freed; data preserved
- "Generate Bill" entry point (see Billing)

**Order Confirmation Queue**
- List/feed of `pending` customer-placed orders across all tables, oldest first
- Per order: table, items, quantities, notes, timestamp
- Accept → status becomes `confirmed`, sent to kitchen
- Reject → requires optional reason, customer notified immediately

**Billing**
- Generate Bill screen for a session: shows orders grouped by status
  - Confirmed/preparing/ready/served orders included by default
  - Pending orders shown separately with an explicit include/exclude toggle per order
  - Rejected orders always excluded, not shown
  - Per excluded order: optional reason field
- Bill preview: line items, addon breakdown, subtotal, CGST/SGST (if GST-registered) or plain total, invoice number preview
- Confirm → generates immutable invoice number (sequential per restaurant per financial year), snapshots restaurant/legal details onto the bill, closes session, frees table
- Payment Recording: separate step — select Cash/UPI/Card, mark paid, timestamp recorded (this is the revenue-recognition moment)
- Bill Amendment: available only if not yet marked paid — opens a new versioned bill, preserves original with `is_active = false`; UI must clearly block amendment on paid bills with an explanatory disabled state, not a silent hide

**Notifications** (Waiter-relevant): new order, bill requested, order ready (to serve), item out of stock, staff kicked/revoked (own account).

---

### 4.4 Chef

**Auth**: single-device session enforced, same as Admin/Waiter.

**Kitchen Display** (real-time kanban board — the primary Chef screen)
- Columns: Confirmed (incoming) → Preparing → Ready
- Cards grouped/labeled by table number, showing items, quantities, and customer notes prominently (notes must never be truncated — kitchen errors happen here)
- Drag or button action to move order forward (Confirmed → Preparing → Ready)
- Per-item reject action (partial rejection): rejecting an item sets that item's status to `rejected`, auto-marks the menu item `is_available = false`, broadcasts to all active customer sessions, notifies waiter — remaining items in the order continue normally
- Whole-order reject also available
- Visual distinction for orders waiting longest (age-based highlighting)

**Item Availability**
- Quick toggle for any menu item (in stock / out of stock) — Chef can do this outside of order rejection too, e.g. proactively
- Every toggle recorded in the availability log with reason (`manual` or `chef_rejection`)

**Shift History**
- Read-only list of all orders completed (served/rejected) during the current shift/day, for end-of-shift review

---

## 5. Cross-Cutting Features (All Roles)

- **Notifications center**: bell icon with unread count, dropdown list, mark-as-read, real-time push via Socket.io with DB-backed persistence and reconnect catch-up (`last_seen_at` based fetch)
- **Session/token security enforcement surfaced in UI**: expired/kicked sessions redirect to login with a clear reason message ("logged in on another device", "session expired", "access revoked", "restaurant suspended")
- **Audit visibility**: Restaurant Admin can see the staff activity log (read-only, filterable by staff member/action type/date) — supports the append-only `staff_activity_log`

---

## 6. API Reference

Conventions used below:
- All restaurant-scoped endpoints are prefixed `/api/console/{role}/...` and require a JWT with `restaurant_id` + `role` claims validated by middleware against the URL's restaurant scope.
- Platform endpoints are prefixed `/api/console/platform/...` and require a Platform Admin JWT from the separate credential store.
- All list endpoints support `?page=&limit=&sort=&order=` and return `{ data: [...], pagination: { page, limit, total, totalPages } }`.
- All mutating endpoints return `{ success: boolean, data?, error? }`.
- All timestamps are ISO 8601 UTC on the wire; the client converts to restaurant timezone for display.
- Soft delete: `DELETE` endpoints set `deleted_at`, they do not hard-delete.

### 6.1 Authentication

| Method & Path | Purpose | Auth | Request Body | Response |
|---|---|---|---|---|
| `POST /api/console/auth/login` | Restaurant-scoped staff login (Admin/Waiter/Chef) | none | `{ email, password, restaurant_slug }` | `{ token, role, staff_id, name, restaurant_id }` — kicks any existing session for this staff member |
| `POST /api/console/auth/logout` | Log out current session | staff JWT | `{}` | `{ success: true }` |
| `POST /api/console/platform/auth/login` | Platform Admin login | none | `{ email, password }` | `{ token, admin_id }` |
| `POST /api/console/auth/refresh` | Refresh access token | refresh token (cookie) | `{}` | `{ token }` |
| `GET /api/console/auth/me` | Get current session identity (for app boot) | staff or platform JWT | — | `{ role, name, restaurant_id?, permissions[] }` |

### 6.2 Platform Admin — Restaurants

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/platform/restaurants` | List all restaurants, filterable by status/search | platform | query: `status, search, page, limit` | `{ data: [{id, name, slug, status, table_count, onboarded_at}], pagination }` |
| `GET /api/console/platform/restaurants/:id` | Get full restaurant detail | platform | — | full restaurant object incl. GST config, contacts, floors/tables |
| `POST /api/console/platform/restaurants` | Onboard new restaurant | platform | `{ name, slug, address, city, state, pincode, timezone, logo_url, welcome_message, contacts: {phone, email, manager_phone?, reservations_email?}, gst: {registered, gstin?, legal_name?, registered_address?, slab?, sac_code?}, floors: [{name, tables: [{table_number, seating_capacity}]}] }` | `{ restaurant_id, slug, admin_credentials: {email, temp_password} }` |
| `PUT /api/console/platform/restaurants/:id` | Edit restaurant details (not slug/table count — those go through change requests) | platform | same shape as onboarding, minus slug/tables | updated restaurant object |
| `POST /api/console/platform/restaurants/:id/suspend` | Suspend restaurant | platform | `{ reason? }` | `{ success: true, status: "suspended" }` — invalidates all active staff sessions and customer tokens for this restaurant |
| `POST /api/console/platform/restaurants/:id/reactivate` | Reactivate restaurant | platform | `{}` | `{ success: true, status: "active" }` |
| `POST /api/console/platform/restaurants/:id/qr` | Generate/regenerate QR codes for given tables | platform | `{ table_ids: [] }` | `{ qr_codes: [{table_id, qr_code_url}] }` |
| `POST /api/console/platform/restaurants/:id/admin-credentials/resend` | Resend Restaurant Admin credentials | platform | `{}` | `{ success: true }` |

### 6.3 Platform Admin — Change Requests

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/platform/change-requests` | List change requests, filter by status/type/restaurant | platform | query: `status, type, restaurant_id` | `{ data: [{id, restaurant_id, type, payload, status, raised_at}], pagination }` |
| `GET /api/console/platform/change-requests/:id` | Get change request detail | platform | — | full request object |
| `POST /api/console/platform/change-requests/:id/approve` | Approve and apply the change | platform | `{ note? }` | `{ success: true, actioned_at }` — applies slug/table/QR change, notifies Restaurant Admin |
| `POST /api/console/platform/change-requests/:id/reject` | Reject the change request | platform | `{ reason }` (required) | `{ success: true }` — notifies Restaurant Admin |

### 6.4 Platform Admin — Analytics & Leads

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/platform/analytics/website-views` | Website view metrics | platform | query: `from, to, granularity` | `{ series: [{date, views}], by_page: [...], by_referrer: [...] }` |
| `GET /api/console/platform/analytics/orders-revenue` | Platform-wide orders & revenue | platform | query: `from, to` | `{ total_orders, total_revenue, by_restaurant: [...] }` |
| `GET /api/console/platform/analytics/churn-signals` | Restaurants with zero orders in last 30 days | platform | — | `{ data: [{restaurant_id, name, last_order_at}] }` |
| `GET /api/console/platform/contact-queries` | List contact form submissions | platform | query: `status, page, limit` | `{ data: [{id, name, email, phone, restaurant_name, message, status}], pagination }` |
| `POST /api/console/platform/contact-queries/:id/resolve` | Mark contact query resolved | platform | `{}` | `{ success: true }` |
| `POST /api/console/platform/contact-queries/:id/flag-spam` | Flag as spam | platform | `{}` | `{ success: true }` |
| `GET /api/console/platform/registrations` | List SaaS registrations/leads | platform | query: `converted, page, limit` | `{ data: [{id, restaurant_name, city, converted, created_at}], pagination }` |

### 6.5 Restaurant Admin — Menu: Categories

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/menu/categories` | List categories | admin | — | `{ data: [{id, name, display_order, item_count}] }` |
| `POST /api/console/admin/menu/categories` | Create category | admin | `{ name, display_order }` | created category |
| `PUT /api/console/admin/menu/categories/:id` | Edit category | admin | `{ name?, display_order? }` | updated category |
| `DELETE /api/console/admin/menu/categories/:id` | Soft-delete category | admin | — | `{ success: true }` or `409 { error: "primary_category_of_active_items" }` |

### 6.6 Restaurant Admin — Menu: Items

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/menu/items` | List items, filter by category/availability/type | admin | query: `category_id, available, item_type, search` | `{ data: [items with computed price/discount], pagination }` |
| `GET /api/console/admin/menu/items/:id` | Get item detail | admin | — | full item incl. pairings, addons linked |
| `POST /api/console/admin/menu/items` | Create item | admin | `{ name, description, photo_url, mrp, selling_price?, category_ids[], primary_category_id, dietary_type, spice_level?, item_type, schedule?: {from, until}, addon_ids[]?, pairing_item_ids[]? }` | created item incl. computed `discount_amount`, `discount_percentage` |
| `PUT /api/console/admin/menu/items/:id` | Edit item | admin | same shape, partial | updated item |
| `DELETE /api/console/admin/menu/items/:id` | Soft-delete item | admin | — | `{ success: true }` |
| `PUT /api/console/admin/menu/items/:id/availability` | Toggle availability (also used by Waiter/Chef, role-scoped separately) | admin/waiter/chef | `{ is_available, reason? }` | `{ success: true, is_available }` — writes `menu_item_availability_log` and broadcasts `item:out_of_stock` / `item:back_in_stock` |
| `GET /api/console/admin/menu/items/availability-log` | Availability change history | admin | query: `item_id?, from, to` | `{ data: [{item_id, changed_by, is_available, reason, changed_at}] }` |

### 6.7 Restaurant Admin — Menu: Addons

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/menu/addons` | List addons | admin | — | `{ data: [{id, name, price, linked_item_count}] }` |
| `POST /api/console/admin/menu/addons` | Create addon | admin | `{ name, price }` (price ≥ 0, name unique per restaurant) | created addon |
| `PUT /api/console/admin/menu/addons/:id` | Edit addon | admin | `{ name?, price? }` | updated addon |
| `DELETE /api/console/admin/menu/addons/:id` | Soft-delete addon | admin | — | `{ success: true }` |
| `PUT /api/console/admin/menu/addons/:id/items` | Link/unlink addon to items | admin | `{ item_ids: [] }` | `{ success: true, linked_items: [] }` |

### 6.8 Restaurant Admin — Staff

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/staff` | List staff (Waiter/Chef) | admin | query: `role, access, search` | `{ data: [{id, name, email, role, access, last_login_at, session_status}] }` |
| `POST /api/console/admin/staff` | Create staff account | admin | `{ name, email, role }` (role: waiter\|chef) | `{ staff_id, temp_password }` |
| `PUT /api/console/admin/staff/:id` | Edit staff details | admin | `{ name? }` | updated staff |
| `POST /api/console/admin/staff/:id/revoke` | Revoke access, kill active session | admin | `{}` | `{ success: true }` |
| `POST /api/console/admin/staff/:id/restore` | Restore access | admin | `{}` | `{ success: true }` |
| `POST /api/console/admin/staff/:id/resend-credentials` | Resend temp password | admin | `{}` | `{ success: true }` |

### 6.9 Restaurant Admin — Reports

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/reports/revenue` | Revenue by day/week/month | admin | query: `from, to, granularity` | `{ series: [{period, revenue, order_count}] }` |
| `GET /api/console/admin/reports/top-items` | Top selling items | admin | query: `from, to, limit` | `{ data: [{item_id, name, qty_sold, revenue}] }` |
| `GET /api/console/admin/reports/orders` | Order history | admin | query: `from, to, status, table_id, page, limit` | `{ data: [orders], pagination }` |
| `GET /api/console/admin/reports/table-turnover` | Table turnover data | admin | query: `from, to` | `{ data: [{table_id, sessions_count, avg_duration_minutes}] }` |
| `GET /api/console/admin/reports/customer-frequency` | Registered customer visit frequency | admin | query: `from, to` | `{ data: [{customer_id, visits, total_spend}] }` |
| `GET /api/console/admin/reports/staff-activity-log` | Staff audit trail | admin | query: `staff_id?, action_type?, from, to, page, limit` | `{ data: [{staff_id, action_type, detail, created_at}], pagination }` |

### 6.10 Restaurant Admin — Operating Hours & Settings

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/settings/operating-hours` | Get weekly schedule | admin | — | `{ data: [{day, shifts: [{open, close}], is_weekly_off}] }` |
| `PUT /api/console/admin/settings/operating-hours` | Update weekly schedule | admin | `{ schedule: [...] }` | `{ success: true }` or `409 { error: "shift_overlap", day }` |
| `GET /api/console/admin/settings/profile` | Get restaurant profile (name, address, branding, contacts) | admin | — | restaurant profile object |
| `PUT /api/console/admin/settings/profile` | Update editable profile fields (not slug) | admin | `{ logo_url?, welcome_message?, contacts? }` | updated profile |
| `GET /api/console/admin/settings/gst` | Get GST configuration | admin | — | `{ registered, gstin, legal_name, registered_address, slab, sac_code }` |
| `PUT /api/console/admin/settings/gst` | Update GST configuration | admin | `{ registered, gstin?, legal_name?, registered_address?, slab?, sac_code? }` | updated config or `422 { error: "invalid_gstin_format" }` |

### 6.11 Restaurant Admin — Change Requests (raise & track)

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/admin/change-requests` | List own change requests | admin | query: `status` | `{ data: [...] }` |
| `POST /api/console/admin/change-requests` | Raise a change request | admin | `{ type: "slug_change"\|"table_count_increase"\|"table_count_decrease"\|"qr_regeneration", payload: {...} }` | created request, `409 { error: "pending_request_exists" }` if one already pending for that type |

### 6.12 Waiter/Admin — Tables & Sessions

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/waiter/tables` | Table overview with live session status | waiter/admin | — | `{ data: [{table_id, table_number, floor, seating_capacity, status, session_id?, opened_at?}] }` |
| `POST /api/console/waiter/tables/:table_id/open` | Open a table (create session) | waiter/admin | `{}` | `{ session_id, status: "active" }`, `409 { error: "session_already_active" }`; records `opened_outside_hours` flag when applicable |
| `GET /api/console/waiter/sessions/:id` | Get session detail (orders, members) | waiter/admin | — | `{ session, orders: [...], member_count }` |
| `POST /api/console/waiter/sessions/:id/reset` | Manually reset/close session | waiter/admin | `{}` | `{ success: true }` — invalidates all customer tokens, frees table |
| `POST /api/console/waiter/sessions/:id/direct-order` | Place a direct order on behalf of the table | waiter/admin | `{ items: [{menu_item_id, quantity, notes?, addon_ids?[]}] }` | created order, status `confirmed`, logged as `direct_order_placed` |

### 6.13 Waiter/Admin — Order Confirmation

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/waiter/orders/pending` | List pending customer orders (confirmation queue) | waiter/admin | — | `{ data: [{order_id, table, items, notes, placed_at}] }` |
| `POST /api/console/waiter/orders/:id/confirm` | Confirm a pending order | waiter/admin | `{}` | `{ success: true, status: "confirmed" }` — order goes to kitchen |
| `POST /api/console/waiter/orders/:id/reject` | Reject a pending order | waiter/admin | `{ reason? }` | `{ success: true, status: "rejected" }` — customer notified |

### 6.14 Waiter/Admin — Billing & Payments

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/waiter/sessions/:id/bill-preview` | Get billable orders grouped by status | waiter/admin | — | `{ included_by_default: [...], pending_orders: [...], rejected_excluded: [...], computed_subtotal }` |
| `POST /api/console/waiter/sessions/:id/bill` | Generate the bill | waiter/admin | `{ excluded_order_ids?: [{order_id, reason?}], included_pending_order_ids?: [] }` | `{ bill_id, invoice_number, subtotal, cgst?, sgst?, total_amount }` — closes session, frees table |
| `GET /api/console/waiter/bills/:id` | Get bill detail | waiter/admin | — | full bill incl. line items, addons, GST breakdown |
| `POST /api/console/waiter/bills/:id/payment` | Record payment | waiter/admin | `{ payment_method: "cash"\|"upi"\|"card" }` | `{ success: true, payment_status: "paid", paid_at }` |
| `POST /api/console/waiter/bills/:id/amend` | Amend a bill (only if unpaid) | waiter/admin | `{ excluded_order_ids?, included_pending_order_ids? }` | new bill version, `409 { error: "bill_already_paid" }` if paid |

### 6.15 Chef — Kitchen Operations

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/chef/kitchen-queue` | Live kitchen queue (confirmed/preparing/ready) | chef | — | `{ data: [{order_id, table, items: [{item_id, name, qty, notes, status}], created_at}] }` |
| `POST /api/console/chef/orders/:id/preparing` | Mark order preparing | chef | `{}` | `{ success: true, status: "preparing" }` |
| `POST /api/console/chef/orders/:id/ready` | Mark order ready | chef | `{}` | `{ success: true, status: "ready" }` — waiter notified |
| `POST /api/console/chef/orders/:id/reject` | Reject entire order | chef | `{ reason? }` | `{ success: true, status: "rejected" }` |
| `POST /api/console/chef/order-items/:id/reject` | Reject a single item (partial rejection) | chef | `{ reason? }` | `{ success: true }` — item status `rejected`, menu item auto-marked unavailable, socket broadcast, waiter+customer notified |
| `GET /api/console/chef/shift-history` | Orders completed this shift | chef | query: `date` | `{ data: [{order_id, table, status, completed_at}] }` |

### 6.16 Shared — Notifications

| Method & Path | Purpose | Auth | Request | Response |
|---|---|---|---|---|
| `GET /api/console/notifications` | List notifications for current user, with reconnect catch-up | any console role | query: `since?` (last_seen_at) | `{ data: [{id, type, payload, status, created_at}] }` |
| `POST /api/console/notifications/:id/read` | Mark one as read | any console role | `{}` | `{ success: true }` |
| `POST /api/console/notifications/read-all` | Mark all as read | any console role | `{}` | `{ success: true }` |

### 6.17 Real-Time Events (Socket.io — not REST, listed for completeness)

| Event | Emitted On | Received By | Payload |
|---|---|---|---|
| `order:new` | Customer places order | Waiter | `{order_id, table_id, items}` |
| `order:confirmed` | Waiter confirms | Customer, Chef | `{order_id, status}` |
| `order:rejected` | Waiter/Chef rejects | Customer | `{order_id, reason?}` |
| `order:preparing` | Chef marks preparing | Customer | `{order_id}` |
| `order:ready` | Chef marks ready | Customer, Waiter | `{order_id, table_id}` |
| `order_item:rejected` | Chef rejects item | Customer, Waiter | `{order_id, item_id}` |
| `bill:requested` | Customer requests bill | Waiter | `{session_id, table_id}` |
| `item:out_of_stock` / `item:back_in_stock` | Any role toggles availability | All active customer sessions in restaurant, Restaurant Admin | `{item_id, is_available}` |
| `session:reset` | Waiter/Admin resets session | Customer(s) in that session | `{session_id}` |
| `staff:kicked` | New login on another device | The kicked staff device | `{message, seconds_remaining: 30}` |
| `staff:revoked` | Admin revokes access | The revoked staff device | `{message}` |
| `change_request:approved` / `change_request:rejected` | Platform Admin actions a request | Restaurant Admin | `{request_id, status, reason?}` |

---

## 7. Non-Functional Requirements

- **Multi-tenancy**: every restaurant-scoped API validates `restaurant_id` from the JWT against the resource's `restaurant_id` before any query executes. Never trust a `restaurant_id` passed in the request body/params alone.
- **Soft delete everywhere** except the explicitly append-only tables (`staff_activity_log`, `menu_item_availability_log`, `bill_line_items`, `bill_line_item_addons`) — all list/read endpoints filter `deleted_at IS NULL` by default.
- **Snapshotting**: bill generation, order placement, and rating submission must copy pricing/legal data at transaction time — never join back to live `menu_items`/`restaurants` rows for historical display.
- **Invoice numbering**: use a row-level lock (`SELECT ... FOR UPDATE`) on the sequence table to guarantee no gaps/duplicates under concurrent bill generation.
- **Rate limiting**: apply per-session order placement limits at the customer-facing API (not Console, but Console's kitchen/queue views must handle bursts gracefully).
- **Session kill switch**: closing a session or revoking staff access must take effect on the very next request regardless of outstanding JWT expiry — validate live status server-side, don't rely on token expiry alone.
- **Error responses**: consistent shape `{ success: false, error: { code, message } }` with HTTP status matching the error class (400 validation, 401 auth, 403 permission, 404 not found, 409 conflict, 422 domain validation like invalid GSTIN).
- **Pagination default**: `limit=25`, `max limit=100` on all list endpoints.

---

## 8. What NOT To Build in V1 (explicitly excluded)

Per handbook §20/§21 — do not build UI or active API surface for: multi-outlet/Brand Admin, payment gateway integration, coupons/discounts, split bill, addon groups, combo items, table reservations, OTP login, WhatsApp/SMS notification channels, platform-wide pre-aggregated revenue dashboard, multi-device staff login, Platform Admin `operator` role, date-range/day-pattern menu scheduling, inventory management, CRM/loyalty points. Where the schema has nullable/stubbed columns for these (e.g. `brand_id`, `addon_group_id`), leave them untouched by Console — do not surface them anywhere in the UI.

---

*This document is the build prompt for Console. Cross-reference against the Business Handbook v1.0 for any ambiguity — the handbook is authoritative for business logic, this document is authoritative for how that logic surfaces in the admin portal.*