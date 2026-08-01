import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Tạo cột checkbox chọn dòng cho DataTable.
 * Sử dụng: import { selectColumn } from '@/components/DataTable/selectColumn' rồi thêm vào đầu mảng columns.
 */
export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn dòng"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
