import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from '@tanstack/react-router'

import { NotFoundPage } from '@/ui/pages/common/NotFoundPage'
import { hasAnyRole } from '@/utils/jwt'
import { useAuthStore } from '@/store/auth.store'
import { RoutePending } from '@/components/RoutePending'

const LoginPage = lazyRouteComponent(
  () => import('@/ui/pages/common/LoginPage'),
  'LoginPage',
)
const ForbiddenPage = lazyRouteComponent(
  () => import('@/ui/pages/common/ForbiddenPage'),
  'ForbiddenPage',
)
const HomePage = lazyRouteComponent(() => import('@/ui/pages/home/HomePage'), 'HomePage')
const AdminDashboardPage = lazyRouteComponent(
  () => import('@/ui/pages/admin/dashboard/AdminDashboardPage'),
  'AdminDashboardPage',
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

    // chưa login
    if (!token) {
      throw redirect({ to: '/login' })
    }

    // Admin đi tới admin dashboard
    if (hasAnyRole(token, ['Admin'])) {
      throw redirect({ to: '/admin/dashboard' })
    }

    // Mọi role khác đi tới home
    throw redirect({ to: '/home' })
  },
})

// ================= USER =================
const userLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'user-layout',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token

    if (!token) {
      throw redirect({ to: '/login' })
    }

    if (hasAnyRole(token, ['Admin'])) {
      throw redirect({ to: '/admin/dashboard' })
    }
  },
  component: Outlet,
})

const homeRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/home',
  component: HomePage,
})

// ================= ADMIN =================
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token

    if (!token) {
      throw redirect({ to: '/login' })
    }

    if (!hasAnyRole(token, ['Admin'])) {
      throw redirect({ to: '/403' })
    }
  },
  component: Outlet,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'dashboard',
  component: AdminDashboardPage,
})

// ================= PUBLIC =================
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const token = useAuthStore.getState().user?.token
    if (token) {
      if (hasAnyRole(token, ['Admin'])) throw redirect({ to: '/admin/dashboard' })
      throw redirect({ to: '/home' })
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
  userLayoutRoute.addChildren([homeRoute]),
  adminLayoutRoute.addChildren([adminDashboardRoute]),
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
