# RMS Console

Multi-tenant restaurant management system console for platform admins, restaurant admins, waiters, and chefs.

## Setup

### Prerequisites

- Node.js 16+
- Backend API running (see VITE_API_URL below)

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Backend API root URL
# For local development: http://localhost:5000
# For production: https://rms-backend-production-e1d3.up.railway.app
VITE_API_URL=https://rms-backend-production-e1d3.up.railway.app
```

The backend API URL is used for all authentication and data API calls. Ensure the backend service is running and accessible at this URL.

## Development

```bash
npm run dev
```

Starts a local Vite dev server with HMR at `http://localhost:5173`.

## Authentication

The console uses JWT-based authentication against the backend API.

### Login Flow

1. User enters email and password on login screen.
2. Frontend calls `POST /api/auth/console-login` with credentials.
3. Backend validates credentials and returns JWT token + user profile.
4. Frontend stores JWT in localStorage and bootstraps app state.
5. Subsequent requests include JWT in `Authorization: Bearer <token>` header.
6. On app reload, frontend validates stored JWT with backend (refresh if needed).

### User Roles

- **Platform Admin**: Full access to all restaurants and platform settings.
- **Restaurant Admin**: Full access to their assigned restaurant.
- **Waiter**: Access to tables, orders, billing, and notifications.
- **Chef**: Access to kitchen display, availability, and shift history.

### JWT Claims

The JWT token includes:
- `id`: User ID (UUID)
- `name`: User name
- `email`: User email
- `role`: One of `platform_admin`, `restaurant_admin`, `waiter`, `chef`
- `permissions`: Array of permission strings (e.g., `['menu:read', 'order:create']`)
- `restaurantId`: Restaurant UUID (for non-platform users only)
- `restaurantSlug`: Restaurant slug (for non-platform users only)

## Build

```bash
npm run build
```

Generates optimized production build in `dist/` directory.

## Deployment

### Netlify

This project must be deployed from the built output, not source files.

- Build command: `npm run build`
- Publish directory: `dist`

Update environment variables in Netlify dashboard:
- `VITE_API_URL`: Set to your production backend URL

## Project Structure

```
src/
  consoleApp.tsx          - Main app entry point with auth and routing
  console/
    authApi.ts            - Backend auth API client and token management
    types.ts              - TypeScript types and interfaces
    mockData.ts           - Demo restaurant/notification data
    components/
      LoginScreen.tsx     - Login form UI
      AppFrame.tsx        - Main navigation shell
      views/
        PlatformViews.tsx - Platform admin screens
        RestaurantViews.tsx - Restaurant user screens
        platform/         - Platform admin screen components
        restaurant/       - Restaurant screen components
```
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
