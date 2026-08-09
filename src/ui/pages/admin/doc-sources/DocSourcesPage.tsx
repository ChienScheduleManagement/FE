import type {ColumnDef} from '@tanstack/react-table'
import {
  useBulkDocSources,
  useCreateDocSources,
  useDeleteDocSourcesById,
  useGetDocSources,
  useUpdateDocSourcesById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {DOC_SOURCE_LEVEL, DOC_SOURCE_LEVELS, type DocSourceLevel} from '@/constants/task'
import {CrudPage} from '@/components/CrudPage'
import {DataTableColumnHeader} from '@/components/DataTable'
import type {DocSourceVm} from '@/types/api'

interface FormValues {
  code: string
  name: string
  level: DocSourceLevel
  displayOrder: string
}

const EMPTY_FORM: FormValues = { code: '', name: '', level: DOC_SOURCE_LEVEL.COMMUNE, displayOrder: '0' }

const levelLabel = (level: number) =>
  DOC_SOURCE_LEVELS.find((l) => l.value === level)?.label ?? 'Không xác định'

export function DocSourcesPage() {
  const queryResult = useGetDocSources()
  const createDocSource = useCreateDocSources()
  const updateDocSource = useUpdateDocSourcesById()
  const deleteDocSource = useDeleteDocSourcesById()
  const bulkDeleteDocSources = useBulkDocSources()

  const columns: ColumnDef<DocSourceVm>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 110,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên nguồn ban hành" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'level',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cấp" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {levelLabel(row.original.level)}
        </span>
      ),
      size: 140,
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-sm">{row.original.displayOrder}</span>,
      size: 80,
    },
  ]

  return (
    <CrudPage<DocSourceVm, FormValues>
      title="Quản lý nguồn văn bản"
      description="Các cơ quan ban hành văn bản (tỉnh, huyện, xã...)"
      icon="import_contacts"
      queryKey={['/api/doc-sources']}
      queryResult={queryResult}
      toItems={(raw) => unwrapApiResponse<DocSourceVm[]>(raw)}
      getRowId={(row) => row.id}
      mutations={{
        create: createDocSource,
        update: updateDocSource,
        remove: deleteDocSource,
        bulkRemove: bulkDeleteDocSources,
      }}
      messages={{
        createSuccess: 'Thêm nguồn văn bản thành công!',
        updateSuccess: 'Cập nhật nguồn văn bản thành công!',
        deleteSuccess: 'Xóa nguồn văn bản thành công!',
        bulkDeleteLoading: 'Đang xóa nhiều nguồn...',
        bulkDeleteSuccess: 'Đã xóa các nguồn văn bản đã chọn!',
      }}
      form={{
        getEmpty: () => ({ ...EMPTY_FORM }),
        toFormValues: (s) => ({
          code: s.code,
          name: s.name,
          level: s.level as DocSourceLevel,
          displayOrder: String(s.displayOrder),
        }),
        validate: (form) => {
          const errors: Partial<Record<keyof FormValues, string>> = {}
          if (!form.code.trim()) errors.code = 'Mã nguồn không được để trống.'
          if (!form.name.trim()) errors.name = 'Tên nguồn không được để trống.'
          if (Number(form.displayOrder) < 0) errors.displayOrder = 'Độ ưu tiên không được âm.'
          return errors
        },
        fields: [
          {
            name: 'level',
            label: 'Cấp ban hành',
            type: 'select',
            options: DOC_SOURCE_LEVELS.map((l) => ({ value: String(l.value), label: l.label })),
            transformValue: (v) => Number(v) as DocSourceLevel,
          },
          { name: 'code', label: 'Mã nguồn', required: true, placeholder: 'VD: UBND-HUYEN' },
          { name: 'name', label: 'Tên nguồn', required: true, placeholder: 'Tên cơ quan ban hành...' },
          { name: 'displayOrder', label: 'Thứ tự hiển thị', type: 'number', min: 0 },
        ],
        dialogTitle: (editing) => (editing ? 'Chỉnh sửa nguồn văn bản' : 'Thêm nguồn văn bản mới'),
        dialogDescription: 'Nhập thông tin cơ quan ban hành. Các trường có dấu (*) là bắt buộc.',
      }}
      getCreatePayload={(form) => ({
        code: form.code,
        name: form.name,
        level: form.level,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      getUpdatePayload={(_s, form) => ({
        code: form.code,
        name: form.name,
        level: form.level,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      table={{
        columns,
        searchKey: 'tên nguồn',
      }}
      deleteDescription={(s) => (
        <>
          Bạn có chắc chắn muốn xóa nguồn{' '}
          <span className="font-semibold text-foreground">{s.name}</span>?
        </>
      )}
    />
  )
}


