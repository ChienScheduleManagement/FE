import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalItems?: number;
}

export function DataTablePagination<TData>({
  table,
  totalItems,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = totalItems ?? table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-slate-100 dark:border-slate-800/50 w-full bg-slate-50/30 dark:bg-transparent transition-all">
      <div className="flex items-center justify-center w-full lg:w-auto">
        <div className="text-[14px] sm:text-[13px] text-slate-500 font-bold bg-white dark:bg-slate-800/40 px-4 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm whitespace-nowrap flex items-center gap-2">
          <span>
            Hiển thị{" "}
            <span className="text-primary font-black">
              {start}-{end}
            </span>
            /<span className="text-slate-700 dark:text-slate-200">{total}</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span>
            Trang{" "}
            <span className="text-slate-700 dark:text-slate-200 font-black">
              {table.getState().pagination.pageIndex + 1}
            </span>
            /{Math.max(table.getPageCount(), 1)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 w-[60px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[14px] font-black outline-none focus:ring-2 focus:ring-primary/20 px-1 cursor-pointer shadow-sm transition-all"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option
                key={pageSize}
                value={pageSize}
                className="dark:bg-slate-900"
              >
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-primary hover:text-white transition-all disabled:opacity-20 shadow-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="material-symbols-outlined text-[18px]">
              first_page
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-primary hover:text-white transition-all disabled:opacity-20 shadow-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-primary hover:text-white transition-all disabled:opacity-20 shadow-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-primary hover:text-white transition-all disabled:opacity-20 shadow-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="material-symbols-outlined text-[18px]">
              last_page
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
