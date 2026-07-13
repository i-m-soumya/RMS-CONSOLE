# Console Auth Implementation Summary

## Overview

The RMS console app has been fully integrated with backend JWT authentication. The system supports role-based access control (RBAC) for platform admins, restaurant admins, waiters, and chefs.

## Key Changes

### Frontend (e:/Projects/OwnProjects/RMS/console)

1. **Environment Configuration** (`.env`)
   - `VITE_API_URL=https://rms-backend-production-e1d3.up.railway.app`
   - Change to `http://localhost:5000` for local development

2. **Auth API Client** (`src/console/authApi.ts`)
   - New module centralizing all backend auth communication
   - Handles JWT storage in localStorage (key: `rms-console-auth-v1`)
   - Methods: `login()`, `refreshToken()`, `validateSession()`, `logout()`
   - Auto-includes JWT in `Authorization: Bearer <token>` header for all requests

3. **Auth Type Updates** (`src/console/types.ts`)
   - `AuthSession` now includes:
     - `token` / `refreshToken` (JWT strings)
     - `email`, `name`, `permissions` (from JWT claims)
     - `restaurantId`, `restaurantSlug` (for non-platform users)
     - `expiresAt` (token expiry timestamp)

4. **Login Screen** (`src/console/components/LoginScreen.tsx`)
   - Shows loading spinner during API call
   - Distinguishes network vs auth errors
   - Passes `isLoading` prop to disable form while pending

5. **Main App** (`src/consoleApp.tsx`)
   - On mount: calls `authApiClient.validateSession()` to restore JWT from storage
   - Shows loading screen while bootstrapping auth
   - `login()` function calls backend `POST /api/auth/console-login`
   - Post-login redirects to dashboard (role-appropriate views render based on role)
   - New `getPermittedViews()` function guards view access by role
   - `guardedView` prevents navigation to disallowed screens

### Backend (e:/Projects/OwnProjects/RMS/backend)

1. **New Unified Console Login Endpoint** (`POST /api/auth/console-login`)
   - File: `src/api/controllers/authController.js` -> `consoleLogin()` export
   - Route: `src/api/routes/auth.js` (port 5000)
   - Tries staff login first, then platform admin
   - Returns JWT token with full claim set including `restaurantSlug` for staff

2. **Enhanced JWT Claims**
   - All users now get: `id`, `name`, `email`, `role`, `permissions`
   - Staff additionally get: `restaurantId`, `restaurantSlug`
   - Updated in both login and refresh endpoints

3. **Strengthened Auth Middleware** (`src/api/middleware/auth.js`)
   - Now async and re-checks account state on every request:
     - Platform admin: verifies `is_active`
     - Staff: verifies not `deleted_at`, `access` = 'active', restaurant `status` = 'active'
   - Old tokens immediately fail after revoking staff or suspending restaurant

4. **Protected Read Endpoints**
   - `GET /api/sessions/:id` - now requires JWT token
   - `GET /api/sessions/:id/orders` - now requires JWT token
   - `GET /api/bills/session/:sessionId` - now requires JWT token
   - `POST /api/sessions` - applies `verifyRestaurantAccess` middleware

## Login Flow Diagram

```
User enters credentials
         ↓
Frontend calls POST /api/auth/console-login
         ↓
Backend tries staff table (with restaurant JOIN for slug)
         ↓ (if staff not found or wrong password)
Backend tries platform_admins table
         ↓ (if platform admin not found or wrong password)
Return 401 "Invalid email or password"
         ↓ (if either found and password matches)
Generate JWT with claims (id, name, email, role, permissions, restaurantId?, restaurantSlug?)
Generate refresh token
Return both tokens + user profile in response
         ↓
Frontend stores tokens in localStorage (key: rms-console-auth-v1)
Frontend hydrates AuthSession state
Frontend redirects to dashboard
```

## JWT Token Structure

**Access Token (15 minutes):**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@burger-co.local",
  "role": "restaurant_admin",
  "restaurantId": "rest-uuid",
  "restaurantSlug": "burger-co",
  "permissions": ["menu:read", "menu:write", ...],
  "iat": 1689100000,
  "exp": 1689100900
}
```

**Refresh Token (7 days):**
- Same structure, used to get new access token without re-entering password

## Testing Checklist

### Backend Verification (via Postman)

Use the updated collection at `e:\Projects\OwnProjects\RMS\backend\postman\RMS.postman_collection.json`

1. **Console Login - Platform Admin**
   ```
   POST {{baseUrl}}/api/auth/console-login
   Body: { "email": "platform@example.com", "password": "password123" }
   Expected: token, refreshToken, user with role=platform_admin (no restaurantId/slug)
   ```

2. **Console Login - Restaurant Admin**
   ```
   POST {{baseUrl}}/api/auth/console-login
   Body: { "email": "admin@burger-co.local", "password": "Admin123!" }
   Expected: token, refreshToken, user with role=restaurant_admin, restaurantId, restaurantSlug
   ```

3. **Console Login - Waiter**
   ```
   POST {{baseUrl}}/api/auth/console-login
   Body: { "email": "waiter@burger-co.local", "password": "Waiter123!" }
   Expected: token, refreshToken, user with role=waiter, restaurantId, restaurantSlug
   ```

4. **Console Login - Chef**
   ```
   POST {{baseUrl}}/api/auth/console-login
   Body: { "email": "chef@burger-co.local", "password": "Chef123!" }
   Expected: token, refreshToken, user with role=chef, restaurantId, restaurantSlug
   ```

5. **Refresh Token**
   ```
   POST {{baseUrl}}/api/auth/refresh
   Body: { "refreshToken": "<refresh_token_from_login>" }
   Expected: new token, refreshToken (same structure as login response)
   ```

6. **Protected Read Endpoint - Without Token**
   ```
   GET {{baseUrl}}/api/sessions/some-session-id
   Expected: 401 "Access token missing or invalid"
   ```

7. **Protected Read Endpoint - With Valid Token**
   ```
   GET {{baseUrl}}/api/sessions/some-session-id
   Auth: Bearer <access_token>
   Expected: 200 session data
   ```

8. **Cross-Restaurant Access Prevention**
   ```
   POST {{baseUrl}}/api/sessions
   Body: { "restaurant_id": "other-restaurant-id", "table_id": "..." }
   Auth: Bearer <token_from_burger-co_staff>
   Expected: 403 "Cannot access other restaurant data"
   ```

### Frontend Verification (UI)

1. **Fresh App Launch**
   - No JWT in localStorage → shows login screen
   - Enter invalid email → "Invalid email or password"
   - Enter valid credentials → shows loading spinner → redirects to dashboard

2. **Role-Based Access**
   - Platform admin login → see platform dashboard + all nav items
   - Restaurant admin login → see restaurant dashboard + admin-level nav
   - Waiter login → see tables/orders/billing nav only
   - Chef login → see kitchen/availability/shift-history nav only

3. **View Guards**
   - Try accessing unauthorized screen (e.g., waiter accessing menu) → redirect to dashboard
   - UI should not show disallowed nav items

4. **Session Persistence**
   - Login → reload page → should restore session (no re-login needed)
   - Clear JWT from localStorage → reload → back to login screen

5. **Environment Configuration**
   - Change `VITE_API_URL` in `.env` → rebuild → should call new backend URL
   - Frontend dev server at `http://localhost:5173`
   - Backend at `http://localhost:5000` (local) or Railway URL (production)

## Credential Reference

All test credentials use password `password123` except as noted:

| Role | Email | Password | Restaurant |
|------|-------|----------|------------|
| Platform Admin | `platform@example.com` | `password123` | N/A |
| Restaurant Admin | `admin@burger-co.local` | `Admin123!` | burger-co |
| Waiter | `waiter@burger-co.local` | `Waiter123!` | burger-co |
| Chef | `chef@burger-co.local` | `Chef123!` | burger-co |

(These are example credentials. Verify actual credentials in your database.)

## Common Issues & Troubleshooting

**Q: Frontend shows "Loading..." forever**
- Backend API URL is wrong (check `.env` VITE_API_URL)
- Backend is not running (should be accessible at the URL in `.env`)
- CORS is not configured on backend

**Q: "Invalid email or password" after correct entry**
- Check database: staff/platform_admins table has the user
- Check password hash: use bcrypt to verify
- Check soft delete flags: `staff.deleted_at` should be NULL, `staff.access` should be 'active'

**Q: Token works once but fails on next request**
- Backend now re-validates on each request
- Check if staff was just revoked or deleted: `staff.access = 'revoked'` or `deleted_at IS NOT NULL`
- Check if restaurant was suspended: `restaurants.status = 'suspended'`

**Q: Can access restaurant data from other restaurant**
- Restaurant isolation is enforced server-side via `verifyRestaurantAccess` middleware
- Frontend JWT should have correct `restaurantSlug`; verify backend is setting it correctly

## Migration Notes

- Old localStorage key: `rms-console-v2` (with mock users)
- New localStorage key: `rms-console-auth-v1` (JWT only)
- App state is no longer persisted; data is fetched from backend on each load (future work)
- Mock restaurant data is still seeded in frontend (demo-only; should be fetched from backend API)

## Next Steps

1. Deploy backend with new auth endpoints
2. Test with Postman collection
3. Test console app in browser at `http://localhost:5173`
4. Monitor console/network tabs for JWT claims and authorization errors
5. Once stable: implement backend endpoints for restaurant/staff/menu data fetching
6. Consider: token refresh interceptor for auto-refresh on 401 responses
