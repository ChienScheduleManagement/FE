# ScheduleManagement FE — Kiến trúc tổng quan

## Tech Stack
- **Framework**: React 19.2.8 + TypeScript 5.9.3
- **Build Tool**: Vite 8.0.5
- **Routing**: TanStack Router 1.170.18 (route tree thủ công, role guard trong `beforeLoad`)
- **Data Fetching**: TanStack Query 5.101.4 + Axios 1.18.1, mã API sinh bằng Orval 8.5.3
- **State Management**: Zustand 5.0.14 (auth store + localStorage)
- **Styling**: Tailwind CSS 3.4.17 + Shadcn UI (Radix primitives)
- **Forms**: React Hook Form 7.83.0 + Zod 4.4.3
- **Lint/Format**: Biome 1.9.4
- **Package Manager**: pnpm

## Project Structure

```
src/
├── api/                          # API layer
│   ├── client.ts                 # Axios instance (baseURL, interceptors, token refresh, apiOrvalClient)
│   ├── generated.ts              # Sinh bởi orval — KHÔNG sửa tay
│   ├── zod.ts                    # Zod schemas sinh bởi orval — KHÔNG sửa tay
│   ├── model/                    # Types sinh bởi orval — KHÔNG sửa tay
│   └── utils.ts                  # API helpers (toast, unwrap, dedupe...)
├── app/                          # App root
│   ├── App.tsx                   # Root component
│   ├── providers.tsx             # QueryClient, TokenRefresher, Toaster
│   ├── router.tsx                # RouterProvider
│   └── routes.tsx                # Route tree + guards (main, admin, /403)
├── auth/                         # Auth logic
│   ├── authApi.ts                # login / refreshAccessToken / logout
│   └── token.ts                  # extractAccessToken
├── components/                   # Components dùng chung
│   ├── auth/TokenRefresher.tsx   # Refresh token chủ động trước khi hết hạn 1 phút
│   └── ui/                       # Shadcn UI components
├── hooks/                        # Custom hooks (useLogout...)
├── lib/                          # Tiện ích (apiHandler, utils)
├── store/                        # Zustand stores (auth.store)
├── ui/pages/                     # Pages theo module (common, home, admin/...)
└── utils/                        # Tiện ích thuần (jwt role parsing...)
```

## Quy ước chính

- **Sinh mã API**: BE phục vụ spec tại `http://localhost:5117/openapi/v1.json` → `pnpm gen:api`. File trong `src/api/model`, `src/api/generated.ts`, `src/api/zod.ts` là generated, không sửa tay.
- **Auth flow**: login → `setUser` (zustand + localStorage `schedule_user`) → `TokenRefresher` refresh chủ động trước khi hết hạn 1 phút; axios interceptor tự refresh khi gặp 401 và retry một lần.
- **Role guard**: các route layout check token + role trong `beforeLoad` (`hasAnyRole` với claim role của JWT). Admin → `/admin/*`, user thường → `/home`, thiếu quyền → `/403`.
- **Kiểu mẫu**: fetch data bằng hook sinh từ orval (`useGetXxx`), unwrap qua `unwrapApiResponse`, toast bằng `toastSmartPromise`; form dùng react-hook-form + zod.
