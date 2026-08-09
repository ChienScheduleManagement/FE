import { z } from 'zod'

export const loginFormSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống.'),
  password: z.string().min(1, 'Mật khẩu không được để trống.'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const changePasswordFormSchema = z
  .object({
    oldPassword: z.string().min(1, 'Nhập mật khẩu hiện tại.'),
    newPassword: z
      .string()
      .min(1, 'Nhập mật khẩu mới.')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu mới.'),
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  })

export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>
