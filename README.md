# ScheduleManagement Frontend

Hệ thống quản lý nhiệm vụ UBND xã — Frontend (React 19 + TypeScript)

## Tech Stack

- **Framework**: React 19.2.8 + TypeScript 5.9.3
- **Build Tool**: Vite 8.0.5
- **Routing**: TanStack Router 1.170.18
- **Data Fetching**: TanStack Query 5.101.4 + Axios 1.18.1 (Orval 8.5.3 sinh mã API)
- **State Management**: Zustand 5.0.14
- **Styling**: Tailwind CSS 3.4.17 + Shadcn UI
- **Forms**: React Hook Form 7.83.0 + Zod 4.4.3
- **Icons**: Lucide React + Material Symbols
- **Lint/Format**: Biome 1.9.4
- **Package Manager**: pnpm

## Yêu cầu

- [Node.js](https://nodejs.org/) >= 22.12.0
- [pnpm](https://pnpm.io/) >= 10.0.0

## Cài đặt

```bash
pnpm install
```

## Cấu hình môi trường

Sao chép `.env.example` thành `.env` và điều chỉnh:

```bash
VITE_APP_ENV=development
VITE_APP_NAME=ScheduleManagement
VITE_API_URL=http://localhost:5117
```

## Sinh mã API từ OpenAPI spec

Backend phục vụ spec tại `http://localhost:5117/openapi/v1.json`:

```bash
pnpm gen:api
```

Sinh mã sẽ tạo `src/api/generated.ts`, `src/api/zod.ts` và `src/api/model/`. Có thể chỉ định spec khác qua biến `ORVAL_INPUT`.

## Scripts

| Lệnh                | Mô tả                                        |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Chạy dev server (Vite)                       |
| `pnpm build`        | Build production (tsc + vite build)          |
| `pnpm preview`      | Preview bản build                            |
| `pnpm lint`         | Kiểm tra lint bằng Biome                     |
| `pnpm lint:fix`     | Tự sửa lỗi lint                              |
| `pnpm format`       | Format code bằng Biome                       |
| `pnpm typecheck`    | Kiểm tra TypeScript                          |
| `pnpm gen:api`      | Sinh mã API từ OpenAPI spec                  |
