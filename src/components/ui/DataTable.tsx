import React from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  widthClass?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Nenhum registro encontrado.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-white)]">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-[var(--atai-info)] text-[13px] font-semibold leading-[1.45] text-[var(--atai-navy)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-4 font-semibold ${col.widthClass ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[14px] text-[var(--atai-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t border-[var(--atai-line)]/60 text-[13.5px] leading-[1.45] text-[var(--atai-navy)] ${
                  onRowClick
                    ? "cursor-pointer hover:bg-[#fcfaf5] transition-colors"
                    : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-4 align-middle ${col.widthClass ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
