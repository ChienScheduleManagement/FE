import { useForm } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toastSmartPromise } from '@/api/utils'
import { loginAuth } from '@/api/generated'
import type { Result } from '@/api/model'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { useAuthStore } from '@/store/auth.store'
import { APP_NAME } from '@/constants/ui'
import type { LoginRequest } from '@/api/model'
import type { LoginResponse } from '@/types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onChange',
  })
  const [showPassword, setShowPassword] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: async (variables: { data: LoginRequest }) => {
      return toastSmartPromise(
        (async () => loginAuth(variables.data, { skipAuth: true }))(),
        {
          loading: 'Đang xác thực tài khoản...',
          success: 'Đăng nhập thành công!',
        },
      )
    },
    onSuccess: (data: Result) => {
      const loginData = unwrapApiResponse<LoginResponse>(data)
      setUser(loginData)
      navigate({ to: '/', replace: true })
    },
  })

  const onSubmit = (data: LoginRequest) => {
    if (isPending) return
    mutate({ data })
  }

  return (
    <>
      <title>Đăng nhập</title>
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] 2xl:grid-cols-[1.5fr_1fr] bg-white dark:bg-neutral-950 font-sans selection:bg-primary/10 overflow-hidden">
        <div className="hidden lg:flex relative overflow-hidden bg-primary/10 border-r border-slate-100 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-800 opacity-95" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 flex flex-col justify-between h-full p-16 text-white">
            <div>
              <div className="flex items-center gap-3 mb-12">
                <div className="size-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10 overflow-hidden">
                  <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-3xl font-black tracking-tight">
                  {APP_NAME}
                </h1>
              </div>

              <h2 className="text-5xl font-extrabold leading-[1.15] mb-8 tracking-tight">
                Quản lý nhiệm vụ <br />
                <span className="text-white/70 italic font-medium">
                  minh bạch và hiệu quả.
                </span>
              </h2>

              <div className="space-y-8 max-w-md">
                <div className="flex items-start gap-5 group">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined">
                      checklist
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">
                      Giao nhiệm vụ rõ ràng
                    </h4>
                    <p className="text-white/60 leading-relaxed">
                      Phân công, theo dõi tiến độ và hạn hoàn thành cho từng
                      nhiệm vụ của cán bộ, công chức trong đơn vị.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined">
                      monitoring
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">
                      Báo cáo trực quan
                    </h4>
                    <p className="text-white/60 leading-relaxed">
                      Thống kê tổng quan công việc, tỷ lệ hoàn thành theo thời
                      gian thực để điều hành kịp thời.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-white/40 text-sm font-medium">
                © {new Date().getFullYear()} Quản lý nhiệm vụ UBND xã
              </p>
            </div>
          </div>

          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 2xl:px-24 bg-white dark:bg-slate-950">
          <div className="w-full max-w-[400px]">
            <div className="flex lg:hidden items-center gap-3 mb-10">
              <div className="size-10 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {APP_NAME}
              </span>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                Chào mừng trở lại!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Đăng nhập để quản lý công việc của bạn
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1"
                >
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.username ? 'text-red-500' : 'text-slate-400 group-focus-within:text-primary'}`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      alternate_email
                    </span>
                  </div>
                  <input
                    id="username"
                    {...register('username', {
                      required: 'Tên đăng nhập không được để trống.',
                    })}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400/70 ${errors.username ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-primary/10'}`}
                    placeholder="Tên đăng nhập"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <span className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1 pl-1">
                    <span className="material-symbols-outlined text-[14px]">
                      error
                    </span>
                    {errors.username.message as string}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="password"
                    className="text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-1"
                  >
                    Mật khẩu
                  </label>
                </div>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-primary'}`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    {...register('password', {
                      required: 'Mật khẩu không được để trống.',
                    })}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400/70 ${errors.password ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-100 dark:border-slate-800 focus:border-primary/50 focus:ring-primary/10'}`}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <span className="text-xs font-semibold text-red-500 mt-1.5 flex items-center gap-1 pl-1 leading-tight">
                    <span className="material-symbols-outlined text-[14px] flex-shrink-0">
                      error
                    </span>
                    {errors.password.message as string}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || !isValid}
                className={`w-full font-black py-4 px-4 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] mt-4 flex items-center justify-center gap-2
    ${isPending || !isValid
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800'
                    : 'bg-primary hover:bg-blue-600 text-primary-foreground shadow-primary/25 hover:shadow-primary/40'}`}
              >
                {isPending ? (
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                ) : null}
                {isPending ? 'Đang xác thực...' : 'Đăng nhập ngay'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
