import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyState?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  emptyState,
}: DataTableProps<T>) {
  if (data.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="py-12 text-center text-sm text-on-surface-variant">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b-2 border-outline-variant/40">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-on-surface-variant',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            // Guard against empty/null ids that would cause duplicate key warnings
            const rawKey = keyExtractor(row);
            const rowKey = rawKey ? rawKey : `row-${index}`;
            return (
              <tr
                key={rowKey}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-outline-variant/20 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-primary-surface/60',
                  !onRowClick && 'hover:bg-surface-container/50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-sm text-on-surface', col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
