'use client'

import { useState } from 'react'
import { Plus, Calendar as CalendarIcon, ClipboardCheck } from 'lucide-react'
import EditarTitularDialog from './EditarTitularDialog'
import EditarActividadDialog from './EditarActividadDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { es } from 'date-fns/locale'

interface Actividad {
  id: string
  nombre: string
  titularId: string
  titularNombre: string
  pvaAsociado: string
  zona: string
  puerto: string
  inicioContrato: string
  finContrato: string
  localizacion?: string
  createdAt?: Date
  isNew?: boolean
}

interface Titular {
  id: string
  nombre: string
  customFields?: Record<string, string>
  createdAt?: Date
  isNew?: boolean
}

interface InspeccionesTabProps {
  actividades: Actividad[]
  titulares: Titular[]
  templates: Array<{id: string, name: string}>
  inspecciones: Array<{
    id: string
    actividadId: string
    fechaProgramada?: string
    estado?: string
    status?: string
    resultado?: string
    isNew?: boolean
    createdAt?: string
  }>
  onEditTitular: (titularId: string) => void
  onEditActividad: (actividad: Actividad) => void
  onAddInspeccion: (actividadId: string) => void
  isTitularDialogOpen: boolean
  setIsTitularDialogOpen: (open: boolean) => void
  titularFormData: { nombre: string }
  handleTitularInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTitularSubmit: (customFields?: Record<string, string>) => void
  handleCloseTitularDialog: () => void
  selectedTitular: Titular | null
  isActividadDialogOpen: boolean
  setIsActividadDialogOpen: (open: boolean) => void
  actividadFormData: {
    nombre: string
    titularId: string
    pvaAsociado: string
    zona: string
    puerto: string
    inicioContrato: string
    finContrato: string
  }
  handleActividadInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleActividadSelectChange: (name: string, value: string) => void
  handleActividadSubmit: () => void
  handleCloseActividadDialog: () => void
  selectedActividad: Actividad | null
  isInspectionDialogOpen: boolean
  setIsInspectionDialogOpen: (open: boolean) => void
  isDatePickerOpen: boolean
  setIsDatePickerOpen: (open: boolean) => void
  selectedDate: Date | undefined
  handleProgramarInspeccion: () => void
  handleRealizarInspeccion: () => void
  handleDateSelect: (date: Date | undefined) => void
  isLoading: boolean
}

export default function InspeccionesTab({
  actividades,
  titulares,
  templates,
  inspecciones,
  onEditTitular,
  onEditActividad,
  onAddInspeccion,
  isTitularDialogOpen,
  setIsTitularDialogOpen,
  titularFormData,
  handleTitularInputChange,
  handleTitularSubmit,
  handleCloseTitularDialog,
  selectedTitular,
  isActividadDialogOpen,
  setIsActividadDialogOpen,
  actividadFormData,
  handleActividadInputChange,
  handleActividadSelectChange,
  handleActividadSubmit,
  handleCloseActividadDialog,
  selectedActividad,
  isInspectionDialogOpen,
  setIsInspectionDialogOpen,
  isDatePickerOpen,
  setIsDatePickerOpen,
  selectedDate,
  handleProgramarInspeccion,
  handleRealizarInspeccion,
  handleDateSelect,
  isLoading
}: InspeccionesTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>('2024')
  const [isAddingYear, setIsAddingYear] = useState(false)
  
  const years = ['2022', '2023', '2024']
  return (
    <div className="space-y-4">
      {/* Dropdown de años */}
      <div className="flex justify-end">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecciona año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => setIsAddingYear(true)}
                className="w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla Inspecciones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titular
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actividad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inspecciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">No hay actividades registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              actividades.map((actividad) => (
                <tr 
                  key={actividad.id} 
                  className="hover:bg-gray-50 transition-colors duration-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      onClick={() => onEditTitular(actividad.titularId)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-blue-700">{actividad.titularNombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      onClick={() => onEditActividad(actividad)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-green-50 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-green-700">{actividad.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      // Check for completed inspection first
                      const inspeccionRealizada = inspecciones.find(i => i.actividadId === actividad.id && i.status === 'completed')
                      if (inspeccionRealizada) {
                        return (
                          <div className="flex flex-col items-end gap-2">
                            <div 
                              onClick={() => window.location.href = `/inspections/${inspeccionRealizada.id}`}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                inspeccionRealizada.isNew 
                                  ? 'animate-pulse bg-blue-100 border-2 border-blue-400' 
                                  : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              <ClipboardCheck className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                Inspección realizada
                              </span>
                            </div>
                            {inspeccionRealizada.resultado && (
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                inspeccionRealizada.resultado === 'Favorable' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {inspeccionRealizada.resultado}
                              </span>
                            )}
                          </div>
                        )
                      }
                      
                      // Check for programmed inspection
                      const inspeccionProgramada = inspecciones.find(i => i.actividadId === actividad.id && i.estado === 'programada')
                      if (inspeccionProgramada) {
                        return (
                          <div 
                            onClick={() => onAddInspeccion(actividad.id)}
                            className="inline-flex flex-col gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                {inspeccionProgramada.fechaProgramada}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 self-end">
                              Programada
                            </span>
                          </div>
                        )
                      }
                      
                      // No inspection yet
                      return (
                        <div 
                          onClick={() => onAddInspeccion(actividad.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">
                            Añadir inspección
                          </span>
                        </div>
                      )
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Diálogo para editar titular desde la card */}
      <EditarTitularDialog
        isOpen={isTitularDialogOpen}
        onClose={handleCloseTitularDialog}
        titulares={titulares}
        selectedTitular={selectedTitular}
        formData={titularFormData}
        onInputChange={handleTitularInputChange}
        onSubmit={handleTitularSubmit}
        isLoading={isLoading}
      />

      {/* Diálogo para editar actividad desde la card */}
      <EditarActividadDialog
        isOpen={isActividadDialogOpen}
        onClose={handleCloseActividadDialog}
        selectedActividad={selectedActividad}
        formData={actividadFormData}
        titulares={titulares}
        templates={templates}
        onInputChange={handleActividadInputChange}
        onSelectChange={handleActividadSelectChange}
        onSubmit={handleActividadSubmit}
        isLoading={isLoading}
      />

      {/* Diálogo de Opciones de Inspección */}
      <Dialog open={isInspectionDialogOpen} onOpenChange={setIsInspectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gestionar Inspección</DialogTitle>
            <DialogDescription>
              Selecciona una opción para gestionar la inspección
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
                <h3 className="font-semibold text-gray-900">Programar Inspección</h3>
                <p className="text-sm text-gray-500">Selecciona una fecha para la inspección</p>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Selección de Fecha */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Programar Inspección</DialogTitle>
            <DialogDescription>
              Selecciona la fecha para realizar la inspección
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
    </div>
  )
}
