import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Label } from "@radix-ui/react-label"
import { BrickWall } from "lucide-react"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}


export function BasisInfoCard<TData, TValue>({columns, data}: DataTableProps<TData, TValue>){
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-950">
      <div className="flex items-center space-x-2">
        <BrickWall />
        <Label className="text-xl font-semibold">Basis Indicator Information</Label>
      </div>
      <DataTable
      columns={columns}
      data={data} name={""} isInfo={true}  />
    </div>
  )
}
