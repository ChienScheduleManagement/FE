import { z } from 'zod'

export const taskFormSchema = z.object({
  documentId: z.string().min(1, 'Vui lòng chọn văn bản liên quan.'),
  taskContent: z.string().min(1, 'Nội dung nhiệm vụ không được để trống.'),
  mainDepartmentId: z.string().min(1, 'Vui lòng chọn đơn vị chủ trì.'),
  coDepartmentIds: z.array(z.string()),
  assigneeName: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.number().optional(),
  initialNote: z.string().optional(),
  latestResult: z.string().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
