import type {ColumnDef} from '@tanstack/react-table'
import {
  useBulkLeaveReasons,
  useCreateLeaveReasons,
  useDeleteLeaveReasonsById,
  useGetLeaveReasons,
  useUpdateLeaveReasonsById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {cn} from '@/lib/utils'
import {CrudPage} from '@/components/CrudPage'
import {DataTableColumnHeader} from '@/components/DataTable'
import {FormField} from '@/components/FormDialog'
import type {LeaveReasonVm} from '@/types/api'

interface FormValues {
  code: string
  name: string
  symbol: string
  color: string
  isPaid: boolean
  salaryRatio: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  symbol: '',
  color: '#facc15',
  isPaid: true,
  salaryRatio: '1',
  displayOrder: '0',
}

const DEFAULT_COLORS = [
  '#facc15', '#fb923c', '#c084fc', '#38bdf8', '#2dd4bf', '#f87171', '#94a3b8', '#16a34a', '#a855f7', '#ec4899',
]

export function LeaveReasonsPage() {
  const queryResult = useGetLeaveReasons()
  const createLeaveReason = useCreateLeaveReasons()
  const updateLeaveReason = useUpdateLeaveReasonsById()
  const deleteLeaveReason = useDeleteLeaveReasonsById()
  const bulkDeleteLeaveReasons = useBulkLeaveReasons()

  const columns: ColumnDef<LeaveReasonVm>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ký hiệu" />,
      cell: ({ row }) => (
        <span className="font-bold text-lg" style={{ color: row.original.color || undefined }}>
          {row.original.symbol ?? '—'}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên lý do" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'color',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Màu" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="size-6 rounded border"
            style={{ backgroundColor: row.original.color || '#facc15' }}
          />
          <span className="text-sm font-mono text-muted-foreground">{row.original.color}</span>
        </div>
      ),
      size: 130,
    },
    {
      accessorKey: 'isPaid',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tính lương" />,
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            row.original.isPaid
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          {row.original.isPaid ? 'Có' : 'Không'}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'salaryRatio',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tỷ lệ %" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-right">
          {Math.round((row.original.salaryRatio ?? 0) * 100)}%
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
      cell: ({ row }) => <span className="text-sm">{row.original.displayOrder}</span>,
      size: 80,
    },
  ]

  return (
    <CrudPage<LeaveReasonVm, FormValues>
      title="Danh mục lý do nghỉ"
      description="Quản lý các loại nghỉ phép, ốm, thai sản, công tác..."
      icon="category"
      queryKey={['/api/leave-reasons']}
      queryResult={queryResult}
      toItems={(raw) => unwrapApiResponse<LeaveReasonVm[]>(raw)}
      getRowId={(row) => row.id}
      mutations={{
        create: createLeaveReason,
        update: updateLeaveReason,
        remove: deleteLeaveReason,
        bulkRemove: bulkDeleteLeaveReasons,
      }}
      messages={{
        createSuccess: 'Thêm lý do nghỉ thành công!',
        updateSuccess: 'Cập nhật lý do nghỉ thành công!',
        deleteSuccess: 'Xóa lý do nghỉ thành công!',
        bulkDeleteLoading: 'Đang xóa nhiều lý do...',
        bulkDeleteSuccess: 'Đã xóa các lý do đã chọn!',
      }}
      form={{
        getEmpty: () => ({ ...EMPTY_FORM }),
        toFormValues: (lr) => ({
          code: lr.code,
          name: lr.name,
          symbol: lr.symbol ?? '',
          color: lr.color ?? '#facc15',
          isPaid: lr.isPaid,
          salaryRatio: String(lr.salaryRatio ?? 1),
          displayOrder: String(lr.displayOrder),
        }),
        validate: (form) => {
          const errors: Partial<Record<keyof FormValues, string>> = {}
          if (!form.code.trim()) errors.code = 'Mã lý do không được để trống.'
          if (!form.name.trim()) errors.name = 'Tên lý do không được để trống.'
          if (!form.symbol.trim()) errors.symbol = 'Ký hiệu không được để trống.'
          const ratio = Number(form.salaryRatio)
          if (Number.isNaN(ratio) || ratio < 0 || ratio > 1)
            errors.salaryRatio = 'Tỷ lệ hưởng lương phải từ 0 đến 1.'
          if (Number(form.displayOrder) < 0) errors.displayOrder = 'Độ ưu tiên không được âm.'
          return errors
        },
        fields: [
          { name: 'code', label: 'Mã', required: true, placeholder: 'VD: PHEP' },
          { name: 'displayOrder', label: 'Thứ tự', type: 'number', min: 0 },
          { name: 'name', label: 'Tên lý do', required: true, placeholder: 'Tên đầy đủ...' },
          {
            name: 'symbol',
            label: 'Ký hiệu',
            required: true,
            placeholder: 'P, Ô, TS...',
            maxLength: 10,
          },
          {
            name: 'color',
            label: 'Màu sắc',
            customRender: ({ form, setField }) => (
              <FormField label="Màu sắc">
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField('color', c)}
                      className={cn(
                        'size-8 rounded-lg border-2 transition-all',
                        form.color === c
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:border-slate-300',
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </FormField>
            ),
          },
          {
            name: 'isPaid',
            label: 'Tính lương',
            type: 'select',
            options: [
              { value: 'true', label: 'Có (tính lương)' },
              { value: 'false', label: 'Không (không lương)' },
            ],
            transformValue: (v) => v === 'true',
          },
          {
            name: 'salaryRatio',
            label: 'Tỷ lệ hưởng lương',
            type: 'number',
            min: 0,
            max: 1,
            step: 0.05,
            placeholder: '1.0',
          },
        ],
        dialogTitle: (editing) => (editing ? 'Chỉnh sửa lý do nghỉ' : 'Thêm lý do nghỉ mới'),
        dialogDescription: 'Nhập thông tin loại nghỉ. Các trường có dấu (*) là bắt buộc.',
      }}
      getCreatePayload={(form) => ({
        code: form.code,
        name: form.name,
        symbol: form.symbol,
        color: form.color,
        isPaid: form.isPaid,
        salaryRatio: Number(form.salaryRatio),
        displayOrder: Number(form.displayOrder) || 0,
      })}
      getUpdatePayload={(_lr, form) => ({
        code: form.code,
        name: form.name,
        symbol: form.symbol,
        color: form.color,
        isPaid: form.isPaid,
        salaryRatio: Number(form.salaryRatio),
        displayOrder: Number(form.displayOrder) || 0,
      })}
      table={{
        columns,
        searchKey: 'tên, mã, ký hiệu',
      }}
      deleteDescription={(lr) => (
        <>
          Bạn có chắc chắn muốn xóa{' '}
          <span className="font-semibold text-foreground">{lr.name}</span>?
        </>
      )}
    />
  )
}


