import type {ColumnDef} from '@tanstack/react-table'
import {
  useBulkDepartments,
  useCreateDepartments,
  useDeleteDepartmentsById,
  useGetDepartments,
  useUpdateDepartmentsById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {cn} from '@/lib/utils'
import {CrudPage} from '@/components/CrudPage'
import {DataTableColumnHeader} from '@/components/DataTable'
import type {DepartmentVm} from '@/types/api'

interface FormValues {
  code: string
  name: string
  shortName: string
  leaderName: string
  phoneNumber: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = {
  code: '',
  name: '',
  shortName: '',
  leaderName: '',
  phoneNumber: '',
  displayOrder: '0',
}

export function DepartmentsPage() {
  const queryResult = useGetDepartments()
  const createDepartment = useCreateDepartments()
  const updateDepartment = useUpdateDepartmentsById()
  const deleteDepartment = useDeleteDepartmentsById()
  const bulkDeleteDepartments = useBulkDepartments()

  const columns: ColumnDef<DepartmentVm>[] = [
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên phòng ban" />,
      cell: ({ row }) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'shortName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên viết tắt" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.shortName ?? '—'}</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'leaderName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lãnh đạo" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.leaderName ?? '—'}</span>
      ),
      size: 160,
    },
    {
      accessorKey: 'phoneNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Điện thoại" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phoneNumber ?? '—'}</span>
      ),
      size: 130,
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
          {row.original.isActive ? 'Hoạt động' : 'Ngừng'}
        </span>
      ),
      size: 100,
    },
  ]

  return (
    <CrudPage<DepartmentVm, FormValues>
      title="Quản lý phòng ban"
      description="Danh sách các đơn vị trực thuộc UBND xã"
      icon="account_balance"
      queryKey={['/api/departments']}
      queryResult={queryResult}
      toItems={(raw) => unwrapApiResponse<DepartmentVm[]>(raw)}
      getRowId={(row) => row.id}
      mutations={{
        create: createDepartment,
        update: updateDepartment,
        remove: deleteDepartment,
        bulkRemove: bulkDeleteDepartments,
      }}
      messages={{
        createSuccess: 'Thêm phòng ban thành công!',
        updateSuccess: 'Cập nhật phòng ban thành công!',
        deleteSuccess: 'Xóa phòng ban thành công!',
        bulkDeleteLoading: 'Đang xóa nhiều phòng ban...',
        bulkDeleteSuccess: 'Đã xóa các phòng ban đã chọn!',
      }}
      form={{
        getEmpty: () => ({ ...EMPTY_FORM }),
        toFormValues: (d) => ({
          code: d.code,
          name: d.name,
          shortName: d.shortName ?? '',
          leaderName: d.leaderName ?? '',
          phoneNumber: d.phoneNumber ?? '',
          displayOrder: String(d.displayOrder),
        }),
        validate: (form) => {
          const errors: Partial<Record<keyof FormValues, string>> = {}
          if (!form.code.trim()) errors.code = 'Mã phòng ban không được để trống.'
          if (!form.name.trim()) errors.name = 'Tên phòng ban không được để trống.'
          if (Number(form.displayOrder) < 0) errors.displayOrder = 'Độ ưu tiên không được âm.'
          return errors
        },
        fields: [
          { name: 'code', label: 'Mã phòng ban', required: true, placeholder: 'VD: VP-UBND' },
          { name: 'displayOrder', label: 'Thứ tự hiển thị', type: 'number', min: 0 },
          { name: 'name', label: 'Tên phòng ban', required: true, placeholder: 'Tên đầy đủ của đơn vị...' },
          { name: 'shortName', label: 'Tên viết tắt' },
          { name: 'leaderName', label: 'Lãnh đạo đơn vị' },
          { name: 'phoneNumber', label: 'Số điện thoại' },
        ],
        dialogTitle: (editing) => (editing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'),
        dialogDescription: 'Nhập thông tin đơn vị. Các trường có dấu (*) là bắt buộc.',
      }}
      getCreatePayload={(form) => ({
        code: form.code,
        name: form.name,
        shortName: form.shortName || null,
        leaderName: form.leaderName || null,
        phoneNumber: form.phoneNumber || null,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      getUpdatePayload={(_d, form) => ({
        code: form.code,
        name: form.name,
        shortName: form.shortName || null,
        leaderName: form.leaderName || null,
        phoneNumber: form.phoneNumber || null,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      table={{
        columns,
        searchKey: 'tên phòng ban',
      }}
      deleteDescription={(d) => (
        <>
          Bạn có chắc chắn muốn xóa phòng ban{' '}
          <span className="font-semibold text-foreground">{d.name}</span>?
        </>
      )}
    />
  )
}


