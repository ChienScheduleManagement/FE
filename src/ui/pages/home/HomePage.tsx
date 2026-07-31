import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/useLogout'

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <div className="min-h-[60vh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Trang chủ
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Xin chào, {user?.fullName ?? 'Người dùng'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Đăng xuất
          </button>
        </div>

        <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-card p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
            construction
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">
            Trang chủ đang được xây dựng
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Công việc của bạn sẽ được hiển thị tại đây.
          </p>
        </div>
      </div>
    </div>
  )
}
