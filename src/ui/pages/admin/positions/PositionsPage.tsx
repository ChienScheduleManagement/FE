import type {ColumnDef} from '@tanstack/react-table'
import {
  useBulkPositions,
  useCreatePositions,
  useDeletePositionsById,
  useGetPositions,
  useUpdatePositionsById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {cn} from '@/lib/utils'
import {CrudPage} from '@/components/CrudPage'
import {DataTableColumnHeader} from '@/components/DataTable'
import type {PositionVm} from '@/types/api'

interface FormValues {
  code: string
  name: string
  displayOrder: string
  isActive: boolean
}

const EMPTY_FORM: FormValues = { code: '', name: '', displayOrder: '0', isActive: true }

export function PositionsPage() {
  const queryResult = useGetPositions()
  const createPosition = useCreatePositions()
  const updatePosition = useUpdatePositionsById()
  const deletePosition = useDeletePositionsById()
  const bulkDeletePositions = useBulkPositions()

  const columns: ColumnDef<PositionVm>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã chức vụ" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 140,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên chức vụ" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-sm">{row.original.displayOrder}</span>,
      size: 80,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            row.original.isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {row.original.isActive ? 'Đang dùng' : 'Tạm dừng'}
        </span>
      ),
      size: 100,
    },
  ]

  return (
    <CrudPage<PositionVm, FormValues>
      title="Chức vụ"
      pageTitle="Chức vụ"
      description="Quản lý danh mục chức vụ của cán bộ, công chức trong xã"
      icon="workspace_premium"
      queryKey={['/api/positions']}
      queryResult={queryResult}
      toItems={(raw) => unwrapApiResponse<PositionVm[]>(raw)}
      getRowId={(row) => row.id}
      mutations={{
        create: createPosition,
        update: updatePosition,
        remove: deletePosition,
        bulkRemove: bulkDeletePositions,
      }}
      messages={{
        createSuccess: 'Thêm chức vụ thành công!',
        updateSuccess: 'Cập nhật chức vụ thành công!',
        deleteSuccess: 'Xóa chức vụ thành công!',
        bulkDeleteLoading: 'Đang xóa nhiều chức vụ...',
        bulkDeleteSuccess: 'Đã xóa các chức vụ đã chọn!',
      }}
      form={{
        getEmpty: () => ({ ...EMPTY_FORM }),
        toFormValues: (p) => ({
          code: p.code,
          name: p.name,
          displayOrder: String(p.displayOrder),
          isActive: p.isActive,
        }),
        validate: (form) => {
          const errors: Partial<Record<keyof FormValues, string>> = {}
          if (!form.code.trim()) errors.code = 'Mã chức vụ không được để trống.'
          if (!form.name.trim()) errors.name = 'Tên chức vụ không được để trống.'
          if (Number(form.displayOrder) < 0) errors.displayOrder = 'Độ ưu tiên không được âm.'
          return errors
        },
        fields: [
          { name: 'code', label: 'Mã chức vụ', required: true, placeholder: 'VD: CT_UBND' },
          { name: 'displayOrder', label: 'Thứ tự', type: 'number', min: 0 },
          { name: 'name', label: 'Tên chức vụ', required: true, placeholder: 'VD: Chủ tịch UBND xã' },
          {
            name: 'isActive',
            label: 'Trạng thái',
            type: 'select',
            options: [
              { value: 'true', label: 'Đang dùng' },
              { value: 'false', label: 'Tạm dừng' },
            ],
            transformValue: (v) => v === 'true',
          },
        ],
        dialogTitle: (editing) => (editing ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'),
        dialogDescription: 'Nhập thông tin chức vụ. Các trường có dấu (*) là bắt buộc.',
      }}
      getCreatePayload={(form) => ({
        code: form.code,
        name: form.name,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      })}
      getUpdatePayload={(_p, form) => ({
        code: form.code,
        name: form.name,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      })}
      table={{
        columns,
        searchKey: 'tên, mã',
      }}
      deleteDescription={(p) => (
        <>
          Bạn có chắc chắn muốn xóa{' '}
          <span className="font-semibold text-foreground">{p.name}</span>?
        </>
      )}
    />
  )
}


