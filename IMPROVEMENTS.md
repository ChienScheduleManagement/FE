# Cải tiến đề xuất cho ScheduleManagement.FE

## Tổng quan
Project đã có: phantom-ui (loading), dark mode, sidebar responsive, token refresh, motion effects từ commit "Phát hiện chuyển động mượt".

Danh sách dự án chưa triển khai nhưng nên cân nhắc.

---

## 1. Error Boundary (`react-error-boundary`)

**Vấn đề:** Chưa có ErrorBoundary — mất 1 component là cả app bị crash.

**Code hiện tại:**
- `app/routes.tsx` — render `<RouterProvider>` trực tiếp, không bọc ErrorBoundary
- `ui/pages/tasks/TaskDetailPage.tsx:87,116` — empty catch blocks (đã fix showError)

**Triển khai đề xuất:**
```bash
pnpm add react-error-boundary
```

```tsx
// src/components/ErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate } from '@tanstack/react-router'

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-6 text-center">
          <p className="text-red-600">Có lỗi xảy ra: {error.message}</p>
          <button onClick={resetErrorBoundary}>Thử lại</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

```tsx
// app/routes.tsx (bọc toàn bộ app)
rootRoute = new RootRoute({
  component: () => (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  ),
})
```

**Impact:** Cao — ngăn crash toàn app khi 1 component lỗi.

---

## 3. Virtual Scrolling (`react-virtuoso` hoặc `@tanstack/react-virtual`)

**Vấn đề:** Các trang danh sách (AttendancePage, TasksPage, EmployeesPage) render toàn bộ rows → chậm với dataset lớn.

**Code hiện tại:**
- `ui/pages/attendance/AttendancePage.tsx` — table với hàng trăm cột/ngày
- `ui/pages/admin/employees/EmployeesPage.tsx` — table với hàng trăm employees
- `components/DataTable/DataTable.tsx` — Table component dùng `@tanstack/react-table` nhưng không virtual scroll

**Triển khai đề xuất:**
```bash
pnpm add react-virtuoso
# hoặc
pnpm add @tanstack/react-virtual
```

Ví dụ với `react-virtuoso`:
```tsx
import { TableVirtuoso } from 'react-virtuoso'

<TableVirtuoso
  data={employees}
  rowRenderer={({ index, style }) => (
    <tr style={style} key={employees[index].id}>
      <td>{employees[index].name}</td>
      ...
    </tr>
  )}
/>
```

**Impact:** Rất cao cho performance với dataset lớn. Render tối ưu — chỉ render ~20 hàng đang hiển thị.

---

## 8. React Suspense for Data Fetching

**Vấn đề:** Loading state quản lý thủ công (isLoading) ở mỗi page → boilerplate lặp lại.

**Code hiện tại:**
```ts
// Nhiều pages đều có pattern này:
const { data: raw, isLoading, isError, error } = useGetTasks(params)
if (isLoading) return <LoadingState />
if (isError) return <ErrorState />
```

**Triển khai đề xuất (Orval + React Suspense):**
```ts
// orval.config.ts — bật suspense
output: {
  ...
  override: {
    ...
    query: {
      useSuspense: true,
    }
  }
}
```

```tsx
// Page component — gọn hơn nhiều
function TasksPage() {
  const { data: raw } = useGetTasks()  // throws Promise nếu chưa load
  const tasks = unwrapApiResponse<PagedResponse<TaskItemVm>>(raw)

  return <DataTable data={tasks.items} />
}

// Bọc Suspense ở route level
<Route path="/tasks" component={TasksPage} />
<Route path="/tasks" pendingComponent={RoutePending} />
```

**Lợi ích:**
- Loại bỏ 50+ loading state checks
- Suspense fallback tập trung → `RoutePending.tsx` (đã có)
- Error fallback tập trung → ErrorBoundary

**Lưu ý:** Cần migrate dần, một số pages có conditional queries khó apply.

---

## 9. Query Key Factory

**Vấn đề:** Query keys hardcode ở khắp nơi (`(['/api/tasks']`, `['/api/attendance', ...]`), dễ typo, khó maintain.

**Code hiện tại:**
```ts
// TasksPage.tsx
await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })
// AttendancePage.tsx
void queryClient.invalidateQueries({ queryKey: ['/api/attendance', selectedEmp.employeeId, 'history'] })
// DashboardPage.tsx
// phantom-ui loading wrapper
```

**Triển khai đề xu nghỉ:**
```ts
// src/api/queryKeys.ts
export const queryKeys = {
  dashboard: { main: ['dashboard'] },
  tasks: {
    all: ['tasks'] as const,
    detail: (id: string) => [...this.all, id] as const,
    logs: (id: string) => [...this.detail(id), 'logs'] as const,
  },
  attendance: {
    grid: (params) => ['attendance', params] as const,
    history: (empId: number) => ['attendance', empId, 'history'] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (id: string) => [...this.all, id] as const,
  },
  // ... other modules
} as const

// Helper
export function invalidate(queryKey: unknown[]) {
  return queryClient.invalidateQueries({ queryKey })
}
```

**Usage sau refactor:**
```ts
// Thay vì:
await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })

// Dùng:
await invalidate(queryKeys.tasks.all)
```

**Impact:** Medium — giảm typo, dễ refactor/maintain query keys.

---

## 10. Column Def Memoization trên Tables

**Vấn đề:** `columns` array tạo lại trên mỗi render → DataTable re-render, performance loss.

**Code hiện tại:**
```ts
// TasksPage.tsx:55
const columns = [
  { accessorKey: '...', header: '...', ... },
  ...
]

// EmployeesPage.tsx
const columns = [...] // recreated mỗi render

// AttendancePage.tsx
const columns = [...] // heavy render logic
```

**Triển khai đề xu nghĩa:**
```ts
import { useMemo } from 'react'

function TasksPage() {
  const queryClient = useQueryClient()
  
  const columns = useMemo(
    () => createColumns(queryClient),
    [queryClient]
  )

  return <DataTable columns={columns} data={tasks} />
}

// Hoặc dùng React.memo cho column definitions
const taskColumns = memo(createColumns)
```

```ts
// src/ui/pages/tasks/columns.tsx (extract columns ra file riêng)
import { createColumnHelper } from '@tanstack/react-table'

const columnHelper = createColumnHelper<TaskItemVm>()

export const taskColumns = [
  columnHelper.accessor('taskContent', {
    header: 'Nội dung',
    cell: (info) => info.getValue(),
  }),
  // ...
]
```

**Impact:** Medium — cải thiện performance tables, giảm re-render không cần thiết.
