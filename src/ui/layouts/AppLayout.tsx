import { useState } from 'react'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/useLogout'
import { useTheme } from '@/hooks/useTheme'
import { useDataWarming } from '@/hooks/useDataWarming'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { APP_NAME } from '@/constants/ui'
import { USER_ROLE } from '@/constants/task'

interface NavItem {
  label: string
  to: string
  icon: string
  activePrefixes?: string[]
}

const NAV_PROGRESS: NavItem[] = [
  { label: 'Tổng quan', to: '/dashboard', icon: 'dashboard' },
  { label: 'Nhiệm vụ', to: '/tasks', icon: 'task_alt', activePrefixes: ['/tasks'] },
  { label: 'Văn bản', to: '/documents', icon: 'description', activePrefixes: ['/documents'] },
  { label: 'Nguồn văn bản', to: '/admin/doc-sources', icon: 'import_contacts' },
  { label: 'Danh mục', to: '/admin/categories', icon: 'category' },
]

const NAV_HR: NavItem[] = [
  { label: 'Chấm công', to: '/attendance', icon: 'event_available' },
  { label: 'Danh sách nhân viên', to: '/admin/employees', icon: 'badge' },
  { label: 'Tính lương', to: '/salary', icon: 'payments' },
  { label: 'Mức lương cơ sở', to: '/admin/base-salaries', icon: 'attach_money' },
  { label: 'Báo cáo', to: '/reports', icon: 'bar_chart' },
  { label: 'Phòng ban', to: '/admin/departments', icon: 'account_balance' },
  { label: 'Chức vụ', to: '/admin/positions', icon: 'workspace_premium' },
  { label: 'Lịch nghỉ', to: '/admin/day-offs', icon: 'event_busy' },
  { label: 'Danh mục lý do nghỉ', to: '/admin/leave-reasons', icon: 'clinical_notes' },
]

const SIDEBAR_STORAGE_KEY = 'schedule_sidebar_collapsed'

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()
  const isActive =
    item.to === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/home'
      : (item.activePrefixes ?? [item.to]).some((p) => pathname.startsWith(p))

  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
      )}
    >
      <span className="material-symbols-outlined shrink-0 text-[22px] transition-transform duration-150 group-hover:scale-110">
        {item.icon}
      </span>
      {!collapsed && item.label}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={16} className="font-semibold">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={cn('flex items-center gap-3 px-2', collapsed && 'justify-center px-0')}
      >
         <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25 overflow-hidden">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
        </div>
        {!collapsed ? (
          <div className="leading-tight">
            <span className="block text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
              {APP_NAME}
            </span>
            <span className="block text-xs text-muted-foreground">Quản lý nhiệm vụ & nhân sự</span>
          </div>
        ) : null}
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {!collapsed ? (
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Quản lý tiến độ
          </p>
        ) : null}
        {NAV_PROGRESS.map((item) => (
          <NavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}

        {!collapsed ? (
          <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Quản lý nhân sự
          </p>
        ) : null}
        {NAV_HR.map((item) => (
          <NavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t pt-3">
        <NavLink
          item={{ label: 'Đổi mật khẩu', to: '/settings/change-password', icon: 'key' }}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {!collapsed ? (
        <p className="px-2 pb-1 text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} Đàm Minh Chiến
        </p>
      ) : null}
    </div>
  )
}

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { theme, toggleTheme } = useTheme()
  useDataWarming()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1',
  )

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, prev ? '0' : '1')
      return !prev
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:block dark:border-slate-800 dark:bg-slate-950',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 h-full w-full cursor-default bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl dark:bg-slate-950">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-white/80 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
                  className="hidden size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-slate-100 active:scale-95 lg:flex dark:border-slate-800 dark:hover:bg-slate-800"
                  onClick={toggleCollapsed}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined transition-transform duration-300',
                      collapsed && '-rotate-180',
                    )}
                  >
                    menu_open
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-semibold">
                {collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                  className="group flex size-9 items-center justify-center rounded-lg text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  onClick={toggleTheme}
                >
                  <span
                    key={theme}
                    className="material-symbols-outlined animate-in fade-in-0 rotate-in-45 duration-500 text-xl transition-transform group-hover:rotate-45"
                  >
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-semibold">
                {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.fullName ?? 'Người dùng'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === USER_ROLE.ADMIN ? 'Quản trị viên' : 'Cán bộ'}
                </p>
              </div>
            </div>

            <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
