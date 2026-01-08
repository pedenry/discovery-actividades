'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Column,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnResizeMode,
} from '@tanstack/react-table'
import { useState, CSSProperties } from 'react'
import { ArrowUpDown, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import './data-table.css'

// Estilos para columnas fijas (pinned) - Siguiendo el patrón de TanStack Table
const getCommonPinningStyles = <TData,>(column: Column<TData>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-5px 0 5px -2px rgba(0, 0, 0, 0.15) inset'
      : isFirstRightPinnedColumn
        ? '5px 0 5px -2px rgba(0, 0, 0, 0.15) inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? 'white' : undefined,
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableSorting?: boolean
  enableFiltering?: boolean
  enableResizing?: boolean
  enableColumnPinning?: boolean
  initialColumnPinning?: ColumnPinningState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableSorting = true,
  enableFiltering = true,
  enableResizing = true,
  enableColumnPinning = true,
  initialColumnPinning,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState({})
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    initialColumnPinning || {
      left: [],
      right: [],
    }
  )
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    columnResizeMode,
    enableColumnResizing: enableResizing,
    enableColumnPinning: enableColumnPinning,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      columnPinning,
    },
  })

  // Calcular el total de anchos de columna
  const totalSize = table.getHeaderGroups()[0]?.headers.reduce((sum, header) => sum + header.getSize(), 0) || 0
  
  // Verificar si hay columnas pinned
  const hasPinnedColumns = (columnPinning.left?.length ?? 0) > 0 || (columnPinning.right?.length ?? 0) > 0

  return (
    <div className={hasPinnedColumns ? "table-with-pinned-columns" : "w-full"}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className={hasPinnedColumns ? "table-scroll-container" : "overflow-x-auto"}>
          <table 
            style={{ 
              tableLayout: hasPinnedColumns ? 'auto' : 'fixed', 
              width: hasPinnedColumns ? 'auto' : '100%',
              borderCollapse: 'separate', 
              borderSpacing: 0 
            }}
          >
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const widthPercentage = totalSize > 0 ? (header.getSize() / totalSize) * 100 : 0
                  const baseStyles = hasPinnedColumns 
                    ? getCommonPinningStyles(header.column)
                    : { width: `${widthPercentage}%` }
                  
                  return (
                    <th
                      key={header.id}
                      style={{
                        ...baseStyles,
                        backgroundColor: header.column.getIsPinned() ? 'rgb(249 250 251)' : undefined,
                      }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden"
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          
                          {/* Sorting Button */}
                          {enableSorting && header.column.getCanSort() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={header.column.getToggleSortingHandler()}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {/* Filter Popover */}
                          {enableFiltering && header.column.getCanFilter() && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    header.column.getFilterValue() ? 'text-blue-600' : ''
                                  }`}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64" align="start">
                                <FilterContent column={header.column} />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                      
                      {/* Resize Handle */}
                      {enableResizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none ${
                            header.column.getIsResizing()
                              ? 'bg-blue-500 opacity-100'
                              : 'bg-gray-300 opacity-0 hover:opacity-100'
                          }`}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const widthPercentage = totalSize > 0 ? (cell.column.getSize() / totalSize) * 100 : 0
                    const baseStyles = hasPinnedColumns 
                      ? getCommonPinningStyles(cell.column)
                      : { width: `${widthPercentage}%` }
                    
                    return (
                      <td
                        key={cell.id}
                        style={baseStyles}
                        className="px-6 py-4 text-sm text-gray-900 overflow-hidden"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-400"
                >
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para el contenido del filtro
function FilterContent({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue()
  const sortedUniqueValues = Array.from(column.getFacetedUniqueValues().keys()).sort()

  // Si hay muchos valores únicos, usar input de texto
  if (sortedUniqueValues.length > 10) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Filtrar</p>
        <Input
          type="text"
          value={(columnFilterValue ?? '') as string}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => column.setFilterValue(e.target.value)}
          placeholder="Buscar..."
          className="h-8"
        />
        {columnFilterValue && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => column.setFilterValue(undefined)}
            className="w-full"
          >
            Limpiar filtro
          </Button>
        )}
      </div>
    )
  }

  // Si hay pocos valores, mostrar checkboxes
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Seleccionar valores</p>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {sortedUniqueValues.map((value: any) => {
          const stringValue = String(value)
          const isSelected = columnFilterValue
            ? Array.isArray(columnFilterValue)
              ? columnFilterValue.includes(value)
              : columnFilterValue === value
            : false

          return (
            <div key={stringValue} className="flex items-center space-x-2">
              <Checkbox
                id={stringValue}
                checked={isSelected}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    const currentValue = columnFilterValue as any[]
                    column.setFilterValue(
                      currentValue ? [...currentValue, value] : [value]
                    )
                  } else {
                    const currentValue = columnFilterValue as any[]
                    column.setFilterValue(
                      currentValue?.filter((v) => v !== value)
                    )
                  }
                }}
              />
              <label
                htmlFor={stringValue}
                className="text-sm font-normal cursor-pointer"
              >
                {stringValue || '(vacío)'}
              </label>
            </div>
          )
        })}
      </div>
      {columnFilterValue && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => column.setFilterValue(undefined)}
          className="w-full mt-2"
        >
          Limpiar filtro
        </Button>
      )}
    </div>
  )
}
