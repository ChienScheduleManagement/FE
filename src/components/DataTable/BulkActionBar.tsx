import { Button } from "@/components/ui/button";

export interface BulkAction {
  label: string;
  icon: string;
  onClick: () => void;
  colorClass?: string; // e.g. "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedCount, actions, onClearSelection }: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 mr-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-xs font-black">
          {selectedCount}
        </span>
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">đã chọn</span>
      </div>
      <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="outline"
          className={`h-9 rounded-xl px-4 font-bold gap-1.5 transition-all ${action.colorClass ?? "text-slate-600 border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"}`}
          onClick={action.onClick}
        >
          <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
          {action.label}
        </Button>
      ))}
      <div className="flex-1" />
      <Button
        size="sm"
        variant="ghost"
        className="h-9 rounded-xl px-3 font-bold text-slate-500 hover:text-slate-800 gap-1 transition-all"
        onClick={onClearSelection}
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
        Bỏ chọn
      </Button>
    </div>
  );
}
