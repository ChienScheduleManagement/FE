import {useState} from 'react'
import type {ColumnDef} from '@tanstack/react-table'
import {
  useBulkCategories,
  useCreateCategories,
  useDeleteCategoriesById,
  useGetCategories,
  useUpdateCategoriesById
} from '@/api/generated'
import {unwrapApiResponse} from '@/lib/apiHandler'
import {CATEGORY_TYPE, CATEGORY_TYPES, type CategoryType} from '@/constants/task'
import {CrudPage} from '@/components/CrudPage'
import {DataTableColumnHeader} from '@/components/DataTable'
import type {CategoryVm} from '@/types/api'

interface FormValues {
  type: CategoryType
  code: string
  name: string
  displayOrder: string
}

const EMPTY_FORM: FormValues = { type: CATEGORY_TYPE.DOC_TYPE, code: '', name: '', displayOrder: '0' }

export function CategoriesPage() {
  const [type, setType] = useState<CategoryType>(CATEGORY_TYPE.DOC_TYPE)

  const queryResult = useGetCategories({ type })
  const createCategory = useCreateCategories()
  const updateCategory = useUpdateCategoriesById()
  const deleteCategory = useDeleteCategoriesById()
  const bulkDeleteCategories = useBulkCategories()

  const columns: ColumnDef<CategoryVm>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.code}</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên danh mục" />,
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
  ]

  return (
    <CrudPage<CategoryVm, FormValues>
      title="Quản lý danh mục"
      pageTitle="Quản lý danh mục"
      description="Loại văn bản, lĩnh vực công tác dùng chung cho hệ thống"
      icon="category"
      queryKey={['/api/categories']}
      queryResult={queryResult}
      toItems={(raw) => unwrapApiResponse<CategoryVm[]>(raw)}
      getRowId={(row) => row.id}
      mutations={{
        create: createCategory,
        update: updateCategory,
        remove: deleteCategory,
        bulkRemove: bulkDeleteCategories,
      }}
      messages={{
        createSuccess: 'Thêm danh mục thành công!',
        updateSuccess: 'Cập nhật danh mục thành công!',
        deleteSuccess: 'Xóa danh mục thành công!',
        bulkDeleteLoading: 'Đang xóa nhiều danh mục...',
        bulkDeleteSuccess: 'Đã xóa các danh mục đã chọn!',
      }}
      tabs={CATEGORY_TYPES.map((t) => ({ value: String(t.value), label: t.label }))}
      activeTab={String(type)}
      onTabChange={(v) => setType(Number(v) as CategoryType)}
      form={{
        getEmpty: () => ({ ...EMPTY_FORM, type }),
        toFormValues: (cat) => ({
          type: cat.type as CategoryType,
          code: cat.code,
          name: cat.name,
          displayOrder: String(cat.displayOrder),
        }),
        validate: (form) => {
          const errors: Partial<Record<keyof FormValues, string>> = {}
          if (!form.code.trim()) errors.code = 'Mã danh mục không được để trống.'
          if (!form.name.trim()) errors.name = 'Tên danh mục không được để trống.'
          if (Number(form.displayOrder) < 0) errors.displayOrder = 'Độ ưu tiên không được âm.'
          return errors
        },
        fields: [
          {
            name: 'type',
            label: 'Loại danh mục',
            type: 'select',
            options: CATEGORY_TYPES.map((t) => ({ value: String(t.value), label: t.label })),
            transformValue: (v) => Number(v) as CategoryType,
          },
          { name: 'displayOrder', label: 'Thứ tự hiển thị', type: 'number', min: 0 },
          { name: 'code', label: 'Mã danh mục', required: true, placeholder: 'VD: THONG_BAO' },
          { name: 'name', label: 'Tên danh mục', required: true, placeholder: 'Tên hiển thị...' },
        ],
        dialogTitle: (editing) => (editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'),
        dialogDescription: 'Nhập thông tin danh mục. Các trường có dấu (*) là bắt buộc.',
      }}
      getCreatePayload={(form) => ({
        type: form.type,
        code: form.code,
        name: form.name,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      getUpdatePayload={(_cat, form) => ({
        type: form.type,
        code: form.code,
        name: form.name,
        displayOrder: Number(form.displayOrder) || 0,
      })}
      table={{
        columns,
        searchKey: 'tên danh mục',
      }}
      deleteDescription={(cat) => (
        <>
          Bạn có chắc chắn muốn xóa danh mục{' '}
          <span className="font-semibold text-foreground">{cat.name}</span>?
        </>
      )}
    />
  )
}


