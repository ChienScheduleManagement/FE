import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { useChangePasswordAuth } from '@/api/generated'
import { unwrapApiResponse } from '@/lib/apiHandler'
import { toastSmartPromise } from '@/api/utils'
import { APP_NAME } from '@/constants/ui'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  })

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const newPassword = watch('newPassword')

  const { mutateAsync: changePassword } = useChangePasswordAuth()

  const onSubmit = handleSubmit(async (values) => {
    await toastSmartPromise(
      changePassword({
        data: {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        },
      }).then(unwrapApiResponse),
      { loading: 'Đang đổi mật khẩu...', success: 'Đổi mật khẩu thành công!' },
    )
    reset()
  })

  return (
    <>
      <Helmet>
        <title>Đổi mật khẩu - {APP_NAME}</title>
      </Helmet>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon="key"
          title="Đổi mật khẩu"
          description="Cập nhật mật khẩu đăng nhập của bạn"
        />

        <div className="max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="old-password">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="old-password"
                  type={showOld ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('oldPassword', {
                    required: 'Nhập mật khẩu hiện tại.',
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  onClick={() => setShowOld(!showOld)}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showOld ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.oldPassword ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.oldPassword.message as string}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('newPassword', {
                    required: 'Nhập mật khẩu mới.',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự.',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.newPassword ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.newPassword.message as string}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Xác nhận mật khẩu mới.',
                  validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp.',
                })}
              />
              {errors.confirmPassword ? (
                <p className="text-xs font-medium text-red-500">
                  {errors.confirmPassword.message as string}
                </p>
              ) : null}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base mr-1">lock_reset</span>
              )}
              {isSubmitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
