'use client'

import { useState, useMemo } from 'react'
import { Plus, Calendar as CalendarIcon, ClipboardCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { es } from 'date-fns/locale'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './seguimientos-table.css'

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
  estado?: 'programada' | 'favorable' | 'desfavorable' | string
  status?: string
  resultado?: string
  isNew?: boolean
  createdAt?: string
  etapaActual?: string
}

// Configuración de estados de inspección
const ESTADO_CONFIG = {
  programada: {
    label: 'Programada',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    cardBg: 'bg-purple-50',
  },
  favorable: {
    label: 'Favorable',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    cardBg: 'bg-green-50',
  },
  desfavorable: {
    label: 'Desfavorable',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    cardBg: 'bg-red-50',
  },
} as const

interface SeguimientosPVATabProps {
  seguimientos: SeguimientoPVA[]
  inspecciones: Inspeccion[]
  onAddInspeccion: (seguimientoId: string, actividadId: string, year: number) => void
  onClickInspeccion: (inspeccion: Inspeccion) => void
  onAddContacto: (seguimientoId: string) => void
  onEditContacto: (seguimientoId: string) => void
  isLoading: boolean
  isInspectionDialogOpen: boolean
  setIsInspectionDialogOpen: (open: boolean) => void
  isDatePickerOpen: boolean
  setIsDatePickerOpen: (open: boolean) => void
  selectedDate: Date | undefined
  handleProgramarInspeccion: () => void
  handleRealizarInspeccion: () => void
  handleDateSelect: (date: Date | undefined) => void
  isEditMode?: boolean
  onDialogClose?: () => void
  onDeleteInspeccion?: () => void
}

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030]
const YEARS_PER_CYCLE = 3

// Generar ciclos de 3 años
const generateCycles = () => {
  const cycles: { label: string; years: number[] }[] = []
  for (let i = 0; i < YEARS.length; i += YEARS_PER_CYCLE) {
    const cycleYears = YEARS.slice(i, i + YEARS_PER_CYCLE)
    cycles.push({
      label: cycleYears.join('-'),
      years: cycleYears
    })
  }
  return cycles
}

const CYCLES = generateCycles()

export default function SeguimientosPVATab({
  seguimientos,
  inspecciones,
  onAddInspeccion,
  onClickInspeccion,
  onAddContacto,
  onEditContacto,
  isLoading,
  isInspectionDialogOpen,
  setIsInspectionDialogOpen,
  isDatePickerOpen,
  setIsDatePickerOpen,
  selectedDate,
  handleProgramarInspeccion,
  handleRealizarInspeccion,
  handleDateSelect,
  isEditMode = false,
  onDialogClose,
  onDeleteInspeccion
}: SeguimientosPVATabProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<string>('todos')
  
  // Filtrar años según el ciclo seleccionado
  const filteredYears = useMemo(() => {
    if (selectedCycle === 'todos') {
      return YEARS
    }
    const cycle = CYCLES.find(c => c.label === selectedCycle)
    return cycle ? cycle.years : YEARS
  }, [selectedCycle])
  
  const getInspeccionesForSeguimientoAndYear = (actividadId: string, year: number) => {
    return inspecciones.filter(insp => {
      if (insp.actividadId !== actividadId) return false
      if (!insp.fechaProgramada) return false
      
      try {
        const fecha = new Date(insp.fechaProgramada)
        const fechaYear = fecha.getFullYear()
        return fechaYear === year
      } catch (error) {
        console.error('Error parsing date:', insp.fechaProgramada, error)
        return false
      }
    })
  }

  // Template para la columna de Concesión
  const concesionBodyTemplate = (rowData: SeguimientoPVA) => {
    return (
      <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
        <div className="font-medium text-sm mb-1">{rowData.concesionObjetoTitulo}</div>
        <div className="text-xs text-gray-600">{rowData.concesionTitularNombre}</div>
        <Badge variant="outline" className="mt-2 text-xs">
          {rowData.concesionTipo}
        </Badge>
      </div>
    )
  }

  // Template para la columna de Actividad
  const actividadBodyTemplate = (rowData: SeguimientoPVA) => {
    return (
      <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
        <div className="font-medium text-sm mb-1">{rowData.actividadNombre}</div>
        <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
          {rowData.actividadPVANombre}
        </Badge>
      </div>
    )
  }

  // Template para la columna de Contacto
  const contactoBodyTemplate = (rowData: SeguimientoPVA) => {
    if (!rowData.contactoId) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onAddContacto(rowData.id)
          }}
          className="border-gray-300 text-gray-900 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Añadir contacto
        </Button>
      )
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation()
          onEditContacto(rowData.id)
        }}
        className="border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer hover:bg-gray-50"
      >
        <div className="font-medium text-sm">{rowData.contactoNombre || 'Sin nombre'}</div>
        {rowData.contactoTelefono && (
          <div className="text-xs text-gray-500 mt-1">{rowData.contactoTelefono}</div>
        )}
        {rowData.contactoEmail && (
          <div className="text-xs text-gray-500">{rowData.contactoEmail}</div>
        )}
      </div>
    )
  }

  // Template para las columnas de años
  const yearBodyTemplate = (rowData: SeguimientoPVA, year: number) => {
    const inspeccionesYear = getInspeccionesForSeguimientoAndYear(rowData.actividadId, year)
    
    return (
      <div className="text-center">
        {inspeccionesYear.length > 0 ? (
          <div className="space-y-2">
            {inspeccionesYear.map(insp => {
              // Intentar parsear la fecha desde fechaProgramada (ISO) o usar fechaProgramadaDisplay
              let displayDate = 'Sin fecha'
              if (insp.fechaProgramada) {
                const fecha = new Date(insp.fechaProgramada)
                displayDate = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
              }
              
              // Determinar estado y configuración visual
              const estado = (insp.estado || 'programada') as keyof typeof ESTADO_CONFIG
              const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.programada
              
              return (
                <div 
                  key={insp.id} 
                  onClick={() => onClickInspeccion(insp)}
                  className={`
                    relative p-2 rounded-lg border-2 cursor-pointer
                    transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                    ${config.cardBg} ${config.borderColor}
                    ${insp.isNew ? 'animate-pulse-highlight' : ''}
                  `}
                >
                  {/* Fecha */}
                  <div className="text-sm font-medium text-gray-800 mb-1.5">
                    {displayDate}
                  </div>
                  
                  {/* Chip de estado */}
                  <div className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${config.bgColor} ${config.textColor}
                  `}>
                    {config.label}
                  </div>
                  
                  {/* Chip de etapa actual */}
                  {insp.etapaActual && (
                    <div className="mt-1">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {insp.etapaActual}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddInspeccion(rowData.id, rowData.actividadId, year)}
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
            onClick={() => onAddInspeccion(rowData.id, rowData.actividadId, year)}
            className="border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-500 whitespace-nowrap"
          >
            <Plus className="w-3 h-3 mr-1" />
            Añadir inspección
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Barra de control con selector de ciclo */}
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ciclo:</span>
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar ciclo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los años</SelectItem>
              {CYCLES.map((cycle) => (
                <SelectItem key={cycle.label} value={cycle.label}>
                  {cycle.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 w-full overflow-auto">
        <DataTable 
          key={`datatable-${inspecciones.length}-${inspecciones.map(i => `${i.id}-${i.fechaProgramada}-${i.isNew}`).join(',')}`}
          value={seguimientos} 
          scrollable 
          scrollHeight="100vh"
          className="text-sm"
          emptyMessage="No hay seguimientos registrados"
          loading={isLoading}
        >
          {/* Columnas Fijas (Frozen) */}
          <Column 
            field="concesionObjetoTitulo" 
            header="Concesión" 
            frozen 
            body={concesionBodyTemplate}
            style={{ minWidth: '250px' }}
          />
          <Column 
            field="actividadNombre" 
            header="Actividad" 
            frozen 
            body={actividadBodyTemplate}
            style={{ minWidth: '200px' }}
          />
          <Column 
            header="Persona de contacto" 
            frozen 
            body={contactoBodyTemplate}
            style={{ minWidth: '200px' }}
          />
          
          {/* Columnas de Años (Con scroll horizontal) - Filtradas por ciclo */}
          {filteredYears.map(year => (
            <Column 
              key={year}
              header={String(year)}
              body={(rowData) => yearBodyTemplate(rowData, year)}
              style={{ width: '160px', minWidth: '160px' }}
            />
          ))}
        </DataTable>
      </div>

      {/* Diálogo de Opciones de Inspección */}
      <Dialog open={isInspectionDialogOpen} onOpenChange={(open) => {
        setIsInspectionDialogOpen(open)
        if (!open && onDialogClose) onDialogClose()
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Gestionar Inspección Programada' : 'Nueva Inspección'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Selecciona una opción para esta inspección' 
                : 'Selecciona una opción para gestionar la inspección'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <div
              onClick={handleProgramarInspeccion}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {isEditMode ? 'Reprogramar Inspección' : 'Programar Inspección'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isEditMode ? 'Cambiar la fecha de la inspección' : 'Selecciona una fecha para la inspección'}
                </p>
              </div>
            </div>

            <div
              onClick={handleRealizarInspeccion}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Realizar Inspección</h3>
                <p className="text-sm text-gray-500">Iniciar el proceso de inspección</p>
              </div>
            </div>

            {/* Opción de eliminar - solo en modo edición */}
            {isEditMode && onDeleteInspeccion && (
              <div
                onClick={() => {
                  setIsInspectionDialogOpen(false)
                  setIsDeleteConfirmOpen(true)
                }}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Eliminar Inspección</h3>
                  <p className="text-sm text-gray-500">Eliminar esta inspección programada</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Selección de Fecha */}
      <Dialog open={isDatePickerOpen} onOpenChange={(open) => {
        setIsDatePickerOpen(open)
        if (!open && onDialogClose) onDialogClose()
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Reprogramar Inspección' : 'Programar Inspección'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Selecciona la nueva fecha para la inspección' 
                : 'Selecciona la fecha para realizar la inspección'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              className="rounded-md border"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => {
        setIsDeleteConfirmOpen(open)
        if (!open && onDialogClose) onDialogClose()
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Inspección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta inspección programada? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                if (onDialogClose) onDialogClose()
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (onDeleteInspeccion) {
                  onDeleteInspeccion()
                }
                setIsDeleteConfirmOpen(false)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
