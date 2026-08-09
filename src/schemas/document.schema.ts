import { z } from 'zod'

export const documentFormSchema = z.object({
  docNumber: z.string().min(1, 'Số văn bản không được để trống.'),
  title: z.string().min(1, 'Trích yếu không được để trống.'),
  sourceId: z.string().optional(),
  docTypeId: z.string().optional(),
  issueDate: z.string().optional(),
  signer: z.string().optional(),
  filePath: z.string().optional(),
})

export type DocumentFormValues = z.infer<typeof documentFormSchema>
