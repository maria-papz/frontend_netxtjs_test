import { Header } from "@tanstack/react-table";
import { TableRowData } from "@/types/dashboard"; // Import directly from dashboard.ts

/**
 * Component for resizing table columns
 */
interface ColumnResizerProps<TData> {
  header: Header<TData, unknown>;
}

export const ColumnResizer = <TData extends TableRowData>({
  header,
}: ColumnResizerProps<TData>) => {
  if (header.column.getCanResize() === false) return null;

  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className="absolute top-0 right-0 cursor-col-resize w-px h-full bg-gray-300 hover:bg-gray-400 hover:w-1"
      style={{
        userSelect: "none",
        touchAction: "none",
      }}
    />
  );
};
