import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from '@tanstack/react-router'

import { NotFoundPage } from '@/ui/pages/common/NotFoundPage'
import { useAuthStore } from '@/store/auth.store'
import { RoutePending } from '@/components/RoutePending'

const AppLayout = lazyRouteComponent(
  () => import('@/ui/layouts/AppLayout'),
  'AppLayout',
)
const LoginPage = lazyRouteComponent(
  () => import('@/ui/pages/common/LoginPage'),
  'LoginPage',
)
const ForbiddenPage = lazyRouteComponent(
  () => import('@/ui/pages/common/ForbiddenPage'),
  'ForbiddenPage',
)
const DashboardPage = lazyRouteComponent(
  () => import('@/ui/pages/dashboard/DashboardPage'),
  'DashboardPage',
)
const DocumentsPage = lazyRouteComponent(
  () => import('@/ui/pages/documents/DocumentsPage'),
  'DocumentsPage',
)
const DocumentDetailPage = lazyRouteComponent(
  () => import('@/ui/pages/documents/DocumentDetailPage'),
  'DocumentDetailPage',
)
const TasksPage = lazyRouteComponent(
  () => import('@/ui/pages/tasks/TasksPage'),
  'TasksPage',
)
const TaskDetailPage = lazyRouteComponent(
  () => import('@/ui/pages/tasks/TaskDetailPage'),
  'TaskDetailPage',
)
const DepartmentsPage = lazyRouteComponent(
  () => import('@/ui/pages/admin/departments/DepartmentsPage'),
  'DepartmentsPage',
)
const CategoriesPage = lazyRouteComponent(
  () => import('@/ui/pages/admin/categories/CategoriesPage'),
  'CategoriesPage',
)
const DocSourcesPage = lazyRouteComponent(
  () => import('@/ui/pages/admin/doc-sources/DocSourcesPage'),
  'DocSourcesPage',
)
const ChangePasswordPage = lazyRouteComponent(
  () => import('@/ui/pages/settings/ChangePasswordPage'),
  'ChangePasswordPage',
)

// ================= ROOT =================
const rootRoute = createRootRoute({
  component: Outlet,
  pendingComponent: RoutePending,
  notFoundComponent: NotFoundPage,
})

// ================= "/" (REDIRECT) =================
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token
    if (!token) {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/dashboard' })
  },
})

// ================= APP LAYOUT (chỉ cần đăng nhập) =================
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const documentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/documents',
  component: DocumentsPage,
})

const documentDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/documents/$id',
  component: DocumentDetailPage,
})

interface TasksSearch {
  create?: boolean
  documentId?: string
  docNumber?: string
  tab?: string
}

const tasksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tasks',
  validateSearch: (search: Record<string, unknown>): TasksSearch => ({
    create: search.create === true || search.create === 'true' ? true : undefined,
    documentId: typeof search.documentId === 'string' ? search.documentId : undefined,
    docNumber: typeof search.docNumber === 'string' ? search.docNumber : undefined,
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: TasksPage,
})

const taskDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tasks/$id',
  component: TaskDetailPage,
})

const departmentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/departments',
  component: DepartmentsPage,
})

const categoriesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/categories',
  component: CategoriesPage,
})

const docSourcesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/doc-sources',
  component: DocSourcesPage,
})

const changePasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/change-password',
  component: ChangePasswordPage,
})

// ================= BACKWARD COMPAT (redirect cũ) =================
const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/home',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/admin/dashboard',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})

// ================= PUBLIC =================
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token
    if (token) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/403',
  component: ForbiddenPage,
})

// ================= TREE =================
export const routeTree = rootRoute.addChildren([
  indexRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    documentsRoute,
    documentDetailRoute,
    tasksRoute,
    taskDetailRoute,
    departmentsRoute,
    categoriesRoute,
    docSourcesRoute,
    changePasswordRoute,
    homeRoute,
    adminDashboardRoute,
  ]),
  loginRoute,
  forbiddenRoute,
])

// ================= ROUTER =================
export const router = createRouter({
  routeTree,
  defaultPendingComponent: RoutePending,
  defaultPendingMs: 120,
  defaultPendingMinMs: 220,
})

// ================= TYPE =================
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
