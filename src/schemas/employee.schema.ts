import { z } from 'zod'

export const salaryHistoryFormSchema = z
  .object({
    salaryCoefficient: z.string().refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n > 0
    }, 'Hệ số lương phải lớn hơn 0'),
    allowance: z.string().refine((v) => {
      const n = Number(v)
      return !Number.isNaN(n) && n >= 0
    }, 'Phụ cấp không được âm'),
    effectiveFrom: z.string().min(1, 'Vui lòng nhập Từ ngày'),
    effectiveTo: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.effectiveTo) return true
      return data.effectiveTo >= data.effectiveFrom
    },
    { message: 'Đến ngày phải lớn hơn hoặc bằng Từ ngày', path: ['effectiveTo'] },
  )

export type SalaryHistoryFormValues = z.infer<typeof salaryHistoryFormSchema>

export const employmentHistoryFormSchema = z
  .object({
    departmentId: z.string().min(1, 'Vui lòng chọn đơn vị'),
    positionId: z.string().optional(),
    effectiveFrom: z.string().min(1, 'Vui lòng nhập Từ ngày'),
    effectiveTo: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.effectiveTo) return true
      return data.effectiveTo >= data.effectiveFrom
    },
    { message: 'Đến ngày phải lớn hơn hoặc bằng Từ ngày', path: ['effectiveTo'] },
  )

export type EmploymentHistoryFormValues = z.infer<typeof employmentHistoryFormSchema>
