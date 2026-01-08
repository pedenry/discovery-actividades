'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'

interface SeguimientoPVA {
  id: string
  concesionId: string
  concesionObjetoTitulo: string
  concesionTitularNombre: string
  concesionTipo: string
  actividadId: string
  actividadNombre: string
  actividadPVANombre: string
  contactoId?: string
  contactoNombre?: string
  contactoTelefono?: string
  contactoEmail?: string
  createdAt?: Date
  isNew?: boolean
}

interface Inspeccion {
  id: string
  actividadId: string
  fechaProgramada?: string
  estado?: string
  status?: string
  resultado?: string
  isNew?: boolean
  createdAt?: string
}

interface SeguimientosPVATabProps {
  seguimientos: SeguimientoPVA[]
  inspecciones: Inspeccion[]
  onAddInspeccion: (seguimientoId: string, actividadId: string, year: number) => void
  onAddContacto: (seguimientoId: string) => void
  onEditContacto: (seguimientoId: string) => void
  isLoading: boolean
}

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

export default function SeguimientosPVATab({
  seguimientos,
  inspecciones,
  onAddInspeccion,
  onAddContacto,
  onEditContacto,
  isLoading
}: SeguimientosPVATabProps) {
  
  const getInspeccionesForSeguimientoAndYear = (actividadId: string, year: number) => {
    return inspecciones.filter(insp => {
      if (insp.actividadId !== actividadId) return false
      if (!insp.fechaProgramada) return false
      
      const fechaYear = new Date(insp.fechaProgramada).getFullYear()
      return fechaYear === year
    })
  }

  // Definir columnas de la tabla usando TanStack Table
  const columns = useMemo<ColumnDef<SeguimientoPVA>[]>(() => {
    const fixedColumns: ColumnDef<SeguimientoPVA>[] = [
      {
        id: 'concesionObjetoTitulo',
        accessorKey: 'concesionObjetoTitulo',
        header: 'Concesión',
        cell: ({ row }) => (
          <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="font-medium text-sm mb-1">{row.original.concesionObjetoTitulo}</div>
            <div className="text-xs text-gray-600">{row.original.concesionTitularNombre}</div>
            <Badge variant="outline" className="mt-2 text-xs">
              {row.original.concesionTipo}
            </Badge>
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 250,
      },
      {
        id: 'actividadNombre',
        accessorKey: 'actividadNombre',
        header: 'Actividad',
        cell: ({ row }) => (
          <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="font-medium text-sm mb-1">{row.original.actividadNombre}</div>
            <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
              {row.original.actividadPVANombre}
            </Badge>
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 200,
      },
      {
        id: 'contacto',
        accessorFn: (row) => row.contactoNombre || '',
        header: 'Persona de contacto',
        cell: ({ row }) => {
          const seguimiento = row.original
          return (
            <div>
              {!seguimiento.contactoId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddContacto(seguimiento.id)
                  }}
                  className="border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir contacto
                </Button>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditContacto(seguimiento.id)
                  }}
                  className="border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer hover:bg-gray-50"
                >
                  <div className="font-medium text-sm">{seguimiento.contactoNombre || 'Sin nombre'}</div>
                  {seguimiento.contactoTelefono && (
                    <div className="text-xs text-gray-500 mt-1">{seguimiento.contactoTelefono}</div>
                  )}
                  {seguimiento.contactoEmail && (
                    <div className="text-xs text-gray-500">{seguimiento.contactoEmail}</div>
                  )}
                </div>
              )}
            </div>
          )
        },
        enableSorting: true,
        enableColumnFilter: true,
        size: 200,
      },
    ]

    // Crear columnas dinámicas para cada año
    const yearColumns: ColumnDef<SeguimientoPVA>[] = YEARS.map(year => ({
      id: `year-${year}`,
      header: String(year),
      cell: ({ row }) => {
        const seguimiento = row.original
        const inspeccionesYear = getInspeccionesForSeguimientoAndYear(seguimiento.actividadId, year)
        
        return (
          <div className="text-center">
            {inspeccionesYear.length > 0 ? (
              <div className="space-y-1">
                {inspeccionesYear.map(insp => (
                  <div key={insp.id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {insp.fechaProgramada ? new Date(insp.fechaProgramada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : 'Sin fecha'}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddInspeccion(seguimiento.id, seguimiento.actividadId, year)}
                  className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Añadir
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddInspeccion(seguimiento.id, seguimiento.actividadId, year)}
                className="border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-500 whitespace-nowrap"
              >
                <Plus className="w-3 h-3 mr-1" />
                Añadir inspección
              </Button>
            )}
          </div>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      size: 160,
    }))

    return [...fixedColumns, ...yearColumns]
  }, [inspecciones, onAddInspeccion, onAddContacto, onEditContacto])

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={seguimientos}
        enableSorting={true}
        enableFiltering={true}
        enableResizing={true}
        enableColumnPinning={true}
        initialColumnPinning={{
          left: ['concesionObjetoTitulo', 'actividadNombre', 'contacto'],
          right: [],
        }}
      />
    </div>
  )
}
