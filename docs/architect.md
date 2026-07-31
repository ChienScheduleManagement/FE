# LandManagement FE — Kiến trúc tổng quan

## Tech Stack
- **Framework**: React 19.2.8 + TypeScript 5.9.3
- **Build Tool**: Vite 8.1.5
- **Routing**: TanStack Router 1.170.18 (file-based route tree)
- **Data Fetching**: TanStack Query 5.101.4 + Axios 1.18.1
- **State Management**: Zustand 5.0.14
- **Styling**: Tailwind CSS 3.4.17 + Shadcn UI (Radix primitives)
- **Forms**: React Hook Form 7.55.0 + Zod 3.24.1
- **Icons**: Lucide React 1.27.0
- **Lint/Format**: Biome 1.9.4
- **Package Manager**: pnpm

## Project Structure

```
src/
├── api/                          # API layer
│   ├── client.ts                 # Axios instance (base URL, interceptors, token refresh)
│   ├── model/                    # Response/request types
│   └── utils.ts                  # API helpers
│
├── app/                          # App root
│   ├── App.tsx                   # Root component
│   ├── providers.tsx             # Context providers (QueryClient, Router, Auth...)
│   ├── router.tsx                # TanStack Router definition
│   └── routes.tsx                # Route tree definition
│
├── auth/                         # Authentication
│   ├── authApi.ts                # Auth API calls (login, register, refresh, logout)
│   └── token.ts                  # Token management (get/set/clear)
│
├── components/                   # Shared components
│   └── ui/                       # Shadcn UI primitives
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx
│       └── label.tsx
│
├── config/                       # App configuration
│   └── env.ts                    # Environment variables
│
├── constants/                    # App-wide constants
│   └── ui.ts                     # UI constants (pagination, breakpoints...)
│
├── hooks/                        # Custom React hooks
│   └── useLogout.ts
│
├── lib/                          # Third-party library wrappers
│   └── utils.ts                  # Tailwind class merge (cn utility)
│
├── store/                        # Zustand stores
│   └── auth.store.ts             # Auth state (user, token, login/logout actions)
│
├── types/                        # Global TypeScript types
│   └── api.ts                    # API response types (Pagination, ApiResponse...)
│
├── ui/                           # Feature pages
│   └── pages/
│       └── common/
│           ├── LoginPage.tsx
│           └── NotFoundPage.tsx
│
├── utils/                        # Pure utility functions
│   └── jwt.ts                    # JWT decode helpers
│
├── styles/                       # Global styles
│   └── index.css                 # Tailwind directives + global CSS
│
├── main.tsx                      # App entry point
└── vite-env.d.ts
```

## Data Flow

```
User Interaction
  → React Component (page)
    → TanStack Query useQuery/useMutation
      → Axios instance (interceptors: attach token, refresh on 401)
        → BE API (/api/v1/...)
    → Zustand store (if needed)
  → Re-render UI
```

## Routing

TanStack Router với route tree:
```
/login              → LoginPage (public)
/                   → AppLayout (authenticated)
  /dashboard        → DashboardPage
  /land-parcels     → LandParcelListPage
  /land-parcels/:id → LandParcelDetailPage
  /users            → UserListPage
*                   → NotFoundPage
```

- **Guards**: Auth route guard kiểm tra token trước khi render
- **Lazy loading**: Mỗi route page là dynamic import

## State Management

| Scope | Tool | Notes |
|-------|------|-------|
| Server state | TanStack Query | Cache, refetch, optimistic update |
| Auth state | Zustand | Token, user profile, login/logout |
| UI state | React useState | Form, modal, drawer |
| URL state | TanStack Router | Search params, path params |

## API Client

- Base URL từ env `VITE_API_URL`
- Auto-attach Bearer token từ auth store
- Auto refresh token khi 401 (queue pending requests)
- Timeout 30s
- Response interceptor parse `ApiResponse<T>` wrapper

## Naming Conventions

- **Files**: PascalCase cho components, camelCase cho utils/hooks (`LoginPage.tsx`, `useLogout.ts`)
- **Folders**: camelCase
- **Exports**: default export cho pages/route components, named export cho utils/hooks
- **CSS classes**: Tailwind utility-first, Shadcn variants

## Build & Deploy

- **Build**: `pnpm build` → `tsc -b` (type check) → `vite build` (output `dist/`)
- **Dev**: `pnpm dev` → Vite dev server proxy `/api/` → BE
- **Docker**: Node build → Nginx serve static + reverse proxy `/api/` → BE
