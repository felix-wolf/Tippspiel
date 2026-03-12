import React from "react";

import next from "../../assets/icons/plus.svg";

type TableColumnBase = {
  id: string;
  header: React.ReactNode;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
};

export type TableColumn<T extends object> =
  | (TableColumnBase & {
    accessor: (item: T) => React.ReactNode;
    render?: never;
  })
  | (TableColumnBase & {
    render: (item: T) => React.ReactNode;
    accessor?: never;
  });

export interface TableListProps<T extends object> {
  caption?: string;
  captionElement?: React.ReactNode;
  items: T[];
  columns: TableColumn<T>[];
  getRowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  maxHeight?: number;
}

function getAlignmentClass(align: TableColumnBase["align"]) {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
}

function renderCell<T extends object>(column: TableColumn<T>, item: T) {
  if ("render" in column && column.render) {
    return column.render(item);
  }
  return column.accessor(item);
}

export default function TableList<T extends object>({
  caption,
  captionElement,
  columns,
  getRowKey,
  items,
  maxHeight,
  onRowClick,
}: TableListProps<T>) {
  const isClickable = onRowClick !== undefined;

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, item: T) {
    if (!onRowClick) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(item);
    }
  }

  return (
    <div
      className={[
        "text-left text-gray-800 overflow-x-auto",
        maxHeight !== undefined ? "max-h-110 overflow-y-auto" : "h-full",
      ].join(" ")}
    >
      {captionElement}
      <table className="w-full">
        {!captionElement && <caption className="text-start">{caption}</caption>}
        <thead>
          <tr className="border-b border-white/60">
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={[
                  "py-2 px-3",
                  getAlignmentClass(column.align),
                  column.headerClassName ?? "",
                ].join(" ").trim()}
              >
                {column.header}
              </th>
            ))}
            {isClickable && <th scope="col" className="sr-only">Aktion</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={getRowKey(item)}
              className={[
                "transition",
                isClickable ? "cursor-pointer hover:bg-white/50 focus-visible:bg-white/50" : "",
              ].join(" ").trim()}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(event) => handleRowKeyDown(event, item)}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={[
                    "py-2 px-3",
                    getAlignmentClass(column.align),
                    column.cellClassName ?? "",
                  ].join(" ").trim()}
                >
                  {renderCell(column, item)}
                </td>
              ))}
              {isClickable && (
                <td className="py-2 px-3 text-right">
                  <img className="w20 h20" src={next} alt="" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
