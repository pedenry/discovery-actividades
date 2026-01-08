'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Concesión
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actividad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Persona de contacto
              </th>
              {YEARS.map(year => (
                <th key={year} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {seguimientos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium">No hay seguimientos registrados</p>
                    <p className="text-xs text-gray-400 mt-1">Los seguimientos se crean automáticamente al crear actividades en concesiones</p>
                  </div>
                </td>
              </tr>
            ) : (
              seguimientos.map((seguimiento) => (
                <tr 
                  key={seguimiento.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    seguimiento.isNew ? 'animate-pulse bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 bg-white">
                    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="font-medium text-sm mb-1">{seguimiento.concesionObjetoTitulo}</div>
                      <div className="text-xs text-gray-600">{seguimiento.concesionTitularNombre}</div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {seguimiento.concesionTipo}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="font-medium text-sm mb-1">{seguimiento.actividadNombre}</div>
                      <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {seguimiento.actividadPVANombre}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
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
                  </td>
                  {YEARS.map(year => {
                    const inspeccionesYear = getInspeccionesForSeguimientoAndYear(seguimiento.actividadId, year)
                    return (
                      <td key={year} className="px-6 py-4 text-center">
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
                            className="border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-500"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Añadir inspección
                          </Button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
