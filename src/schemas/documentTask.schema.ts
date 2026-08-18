import { z } from 'zod'

export const documentTaskFormSchema = z.object({
  docNumber: z.string().min(1, 'Số văn bản không được để trống.'),
  title: z.string().min(1, 'Trích yếu không được để trống.'),
  sourceId: z.string().optional(),
  docTypeId: z.string().optional(),
  issueDate: z.string().optional(),
  taskContent: z.string().optional(),
  mainDepartmentId: z.string().optional(),
  assigneeName: z.string().optional(),
  dueDate: z.string().optional(),
})

export type DocumentTaskFormValues = z.infer<typeof documentTaskFormSchema>
