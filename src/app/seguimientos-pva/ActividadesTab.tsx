'use client'

import { Plus, Trash2 } from 'lucide-react'
import EditarTitularDialog from './EditarTitularDialog'
import EditarActividadDialog from './EditarActividadDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DialogTrigger,
} from '@/components/ui/dialog'

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

interface ActividadesTabProps {
  actividades: Actividad[]
  titulares: Titular[]
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  formData: {
    nombre: string
    titularId: string
    pvaAsociado: string
    zona: string
    puerto: string
    inicioContrato: string
    finContrato: string
  }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: () => void
  handleCloseDialog: () => void
  isLoading: boolean
  templates: Array<{id: string, name: string}>
  handleSelectChange: (name: string, value: string) => void
  onEditActividad: (actividad: Actividad) => void
  onEditTitular: (titularId: string) => void
  selectedActividad: Actividad | null
  isTitularDialogOpen: boolean
  setIsTitularDialogOpen: (open: boolean) => void
  titularFormData: { nombre: string }
  handleTitularInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleTitularSubmit: (customFields?: Record<string, string>) => void
  handleCloseTitularDialog: () => void
  selectedTitular: Titular | null
  onDeleteActividad: (actividadId: string) => void
}

export default function ActividadesTab({
  actividades,
  titulares,
  isDialogOpen,
  setIsDialogOpen,
  formData,
  handleInputChange,
  handleSubmit,
  handleCloseDialog,
  isLoading,
  templates,
  handleSelectChange,
  onEditActividad,
  onEditTitular,
  selectedActividad,
  isTitularDialogOpen,
  setIsTitularDialogOpen,
  titularFormData,
  handleTitularInputChange,
  handleTitularSubmit,
  handleCloseTitularDialog,
  selectedTitular,
  onDeleteActividad
}: ActividadesTabProps) {
  return (
    <div className="space-y-4">
      {/* Botón Nueva Actividad */}
      <div className="flex justify-end">
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva actividad
        </Button>
      </div>

      {/* Diálogo de Actividad */}
      <EditarActividadDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        selectedActividad={selectedActividad}
        formData={formData}
        titulares={titulares}
        templates={templates}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Tabla Actividades */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actividad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titular
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                PVA Asociado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puerto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vigencia del contrato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localización
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
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
                  className={`hover:bg-gray-50 transition-colors duration-300 ${
                    actividad.isNew ? 'animate-highlight' : ''
                  }`}
                >
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    onClick={() => onEditActividad(actividad)}
                  >
                    {actividad.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTitular(actividad.titularId)
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-blue-700">{actividad.titularNombre}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer w-48"
                    onClick={() => onEditActividad(actividad)}
                  >
                    <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50 whitespace-normal break-words rounded-xl px-3 py-1.5">
                      {actividad.pvaAsociado}
                    </Badge>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    onClick={() => onEditActividad(actividad)}
                  >
                    {actividad.puerto}
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    onClick={() => onEditActividad(actividad)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Inicio: {actividad.inicioContrato}</span>
                      <span className="text-xs text-gray-500">Fin: {actividad.finContrato}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    onClick={() => onEditActividad(actividad)}
                  >
                    {actividad.localizacion || actividad.zona}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteActividad(actividad.id)
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
    </div>
  )
}
