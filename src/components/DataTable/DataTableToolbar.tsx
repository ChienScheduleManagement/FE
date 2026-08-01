import type {Table} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey: string
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <Input
            placeholder={searchKey ? `Tìm kiếm qua ${searchKey}...` : "Tìm kiếm nhanh..."}
            value={table.getState().globalFilter ?? ''}
            onChange={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            className="pl-10 h-10 w-full"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className="h-10 px-2 lg:px-3 text-sm text-slate-500 hover:text-red-500"
          >
            Bỏ lọc
            <span className="material-symbols-outlined text-[16px] ml-2">close</span>
          </Button>
        )}
      </div>
    </div>
  )
}
