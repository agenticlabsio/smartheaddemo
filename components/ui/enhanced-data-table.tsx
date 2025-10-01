"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  Search,
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileDown,
  Eye,
  EyeOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  placeholder?: string
  filterableColumns?: {
    id: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableExport?: boolean
  exportFileName?: string
  className?: string
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey = "title",
  placeholder = "Search...",
  filterableColumns = [],
  onRowClick,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableExport = false,
  exportFileName = "data",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Enhanced columns with selection checkbox if enabled
  const enhancedColumns = React.useMemo(() => {
    if (enableRowSelection) {
      return [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="translate-y-[2px]"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="translate-y-[2px]"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...columns,
      ]
    }
    return columns
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      const searchableValue = String(row.getValue(searchKey) ?? "").toLowerCase()
      return searchableValue.includes(searchValue)
    },
  })

  // Export functionality
  const exportData = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const exportRows = selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows
    
    const csvContent = [
      // Headers
      table.getVisibleFlatColumns()
        .filter(col => col.id !== 'select' && col.id !== 'actions')
        .map(col => `"${col.columnDef.header as string || col.id}"`)
        .join(','),
      // Data rows
      ...exportRows.map(row =>
        table.getVisibleFlatColumns()
          .filter(col => col.id !== 'select' && col.id !== 'actions')
          .map(col => {
            const value = row.getValue(col.id)
            return `"${String(value ?? '').replace(/"/g, '""')}"`
          })
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${exportFileName}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [table, exportFileName, searchKey])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Global Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Column Filters */}
          {filterableColumns.map((column) => (
            <Popover key={column.id}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-dashed">
                  <Filter className="mr-2 h-4 w-4" />
                  {column.title}
                  {columnFilters.find(f => f.id === column.id) && (
                    <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2">
                  <Label className="text-sm font-medium">{column.title}</Label>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    {column.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${column.id}-${option.value}`}
                          checked={
                            (Array.isArray(columnFilters.find(f => f.id === column.id)?.value) &&
                            (columnFilters.find(f => f.id === column.id)?.value as string[])?.includes(option.value)) ?? false
                          }
                          onCheckedChange={(checked) => {
                            const currentFilter = columnFilters.find(f => f.id === column.id)
                            const currentValues = Array.isArray(currentFilter?.value) ? currentFilter.value as string[] : []
                            
                            if (checked) {
                              setColumnFilters(prev => [
                                ...prev.filter(f => f.id !== column.id),
                                { id: column.id, value: [...currentValues, option.value] }
                              ])
                            } else {
                              const newValues = currentValues.filter((v: string) => v !== option.value)
                              if (newValues.length === 0) {
                                setColumnFilters(prev => prev.filter(f => f.id !== column.id))
                              } else {
                                setColumnFilters(prev => [
                                  ...prev.filter(f => f.id !== column.id),
                                  { id: column.id, value: newValues }
                                ])
                              }
                            }
                          }}
                        />
                        <Label htmlFor={`${column.id}-${option.value}`} className="text-sm">
                          {option.icon && <option.icon className="mr-2 h-4 w-4 inline" />}
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}

          {/* Clear Filters */}
          {(columnFilters.length > 0 || globalFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setColumnFilters([])
                setGlobalFilter("")
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Export */}
          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="h-8"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    "transition-colors"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {enableRowSelection && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ArrowUp className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ArrowUp className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ArrowDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ArrowDown className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sortable header component
export function SortableHeader({ title, column }: { title: string; column: any }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-2 lg:px-3"
    >
      {title}
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}