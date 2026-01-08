'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import CreateActividadConcesionDialog from './CreateActividadConcesionDialog'
import ActividadesConcesionDialog from './ActividadesConcesionDialog'

interface Titular {
  id: string
  nombre: string
  customFields?: Record<string, string>
  createdAt?: Date
  isNew?: boolean
}

interface ConcesionActividad {
  id: string
  nombre: string
  pvaAsociado: string
  pvaAsociadoNombre?: string
  createdAt?: Date
}

interface Concesion {
  id: string
  objetoTitulo: string
  titularId: string
  titularNombre: string
  tipo: 'Concesión' | 'Autorización' | 'Licencia' | 'Obra'
  puerto: string
  fechaInicio: string
  fechaFin: string
  contactoNombre: string
  contactoTelefono: string
  contactoEmail: string
  actividades?: ConcesionActividad[]
  createdAt?: Date
  isNew?: boolean
}

interface Template {
  id: string
  name: string
}

interface ConcesionesTabProps {
  concesiones: Concesion[]
  titulares: Titular[]
  templates: Template[]
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  onSubmit: () => void
  onDelete: (concesionId: string) => void
  onEdit: (concesion: Concesion) => void
  onCopy: (concesion: Concesion) => void
  onAddActividad: (concesionId: string, nombre: string, pvaAsociado: string) => void
  isLoading: boolean
  selectedConcesion: Concesion | null
  formData: {
    objetoTitulo: string
    titularId: string
    tipo: string
    puerto: string
    fechaInicio: string
    fechaFin: string
    contactoNombre: string
    contactoTelefono: string
    contactoEmail: string
  }
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (name: string, value: string) => void
  onDateChange: (name: string, date: Date | undefined) => void
}

export default function ConcesionesTab({
  concesiones,
  titulares,
  templates,
  isDialogOpen,
  setIsDialogOpen,
  onSubmit,
  onDelete,
  onEdit,
  onCopy,
  onAddActividad,
  isLoading,
  selectedConcesion,
  formData,
  onInputChange,
  onSelectChange,
  onDateChange
}: ConcesionesTabProps) {
  const [fechaInicioDate, setFechaInicioDate] = useState<Date>()
  const [fechaFinDate, setFechaFinDate] = useState<Date>()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [concesionToDelete, setConcesionToDelete] = useState<string | null>(null)
  const [isCreateActividadDialogOpen, setIsCreateActividadDialogOpen] = useState(false)
  const [isViewActividadesDialogOpen, setIsViewActividadesDialogOpen] = useState(false)
  const [selectedConcesionForActividades, setSelectedConcesionForActividades] = useState<Concesion | null>(null)

  // Sincronizar fechas cuando cambia el diálogo o formData
  useEffect(() => {
    if (isDialogOpen) {
      if (formData.fechaInicio) {
        try {
          const parsedDate = parse(formData.fechaInicio, 'dd/MM/yyyy', new Date())
          if (!isNaN(parsedDate.getTime())) {
            setFechaInicioDate(parsedDate)
          }
        } catch (error) {
          console.error('Error parsing fechaInicio:', error)
        }
      } else {
        setFechaInicioDate(undefined)
      }

      if (formData.fechaFin) {
        try {
          const parsedDate = parse(formData.fechaFin, 'dd/MM/yyyy', new Date())
          if (!isNaN(parsedDate.getTime())) {
            setFechaFinDate(parsedDate)
          }
        } catch (error) {
          console.error('Error parsing fechaFin:', error)
        }
      } else {
        setFechaFinDate(undefined)
      }
    }
  }, [isDialogOpen, formData.fechaInicio, formData.fechaFin])

  const handleFechaInicioChange = (date: Date | undefined) => {
    setFechaInicioDate(date)
    onDateChange('fechaInicio', date)
  }

  const handleFechaFinChange = (date: Date | undefined) => {
    setFechaFinDate(date)
    onDateChange('fechaFin', date)
  }

  const handleDeleteClick = (concesionId: string) => {
    setConcesionToDelete(concesionId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (concesionToDelete) {
      onDelete(concesionToDelete)
      setIsDeleteDialogOpen(false)
      setConcesionToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setConcesionToDelete(null)
  }

  const handleOpenCreateActividad = (concesion: Concesion) => {
    setSelectedConcesionForActividades(concesion)
    setIsCreateActividadDialogOpen(true)
  }

  const handleOpenViewActividades = (concesion: Concesion) => {
    setSelectedConcesionForActividades(concesion)
    setIsViewActividadesDialogOpen(true)
  }

  const handleSubmitActividad = (nombre: string, pvaAsociado: string) => {
    if (selectedConcesionForActividades) {
      onAddActividad(selectedConcesionForActividades.id, nombre, pvaAsociado)
      setIsCreateActividadDialogOpen(false)
    }
  }

  const handleAddActividadFromView = () => {
    setIsViewActividadesDialogOpen(false)
    setIsCreateActividadDialogOpen(true)
  }

  const tiposConcesion = ['Concesión', 'Autorización', 'Licencia', 'Obra']

  return (
    <div className="space-y-4">
      {/* Botón Nueva Concesión */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva concesión
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{selectedConcesion ? 'Editar Concesión' : 'Nueva Concesión'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Objeto del Título */}
              <div className="grid gap-2">
                <Label htmlFor="objetoTitulo">Objeto del Título</Label>
                <Input
                  id="objetoTitulo"
                  name="objetoTitulo"
                  value={formData.objetoTitulo}
                  onChange={onInputChange}
                  placeholder="Ingresa el objeto del título"
                />
              </div>

              {/* Titular */}
              <div className="grid gap-2">
                <Label htmlFor="titularId">Titular</Label>
                <Select
                  value={formData.titularId}
                  onValueChange={(value) => onSelectChange('titularId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un titular" />
                  </SelectTrigger>
                  <SelectContent>
                    {titulares.map((titular) => (
                      <SelectItem key={titular.id} value={titular.id}>
                        {titular.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo y Puerto en la misma fila */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => onSelectChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposConcesion.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="puerto">Puerto</Label>
                  <Input
                    id="puerto"
                    name="puerto"
                    value={formData.puerto}
                    onChange={onInputChange}
                    placeholder="Ingresa el puerto"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !fechaInicioDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaInicioDate ? (
                          format(fechaInicioDate, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaInicioDate}
                        onSelect={handleFechaInicioChange}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !fechaFinDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaFinDate ? (
                          format(fechaFinDate, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaFinDate}
                        onSelect={handleFechaFinChange}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Sección Persona de Contacto */}
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold mb-4 text-gray-700">Persona de Contacto</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contactoNombre">Nombre</Label>
                    <Input
                      id="contactoNombre"
                      name="contactoNombre"
                      value={formData.contactoNombre}
                      onChange={onInputChange}
                      placeholder="Nombre de la persona de contacto"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactoTelefono">Teléfono</Label>
                    <Input
                      id="contactoTelefono"
                      name="contactoTelefono"
                      value={formData.contactoTelefono}
                      onChange={onInputChange}
                      placeholder="Teléfono de contacto"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactoEmail">Email</Label>
                    <Input
                      id="contactoEmail"
                      name="contactoEmail"
                      type="email"
                      value={formData.contactoEmail}
                      onChange={onInputChange}
                      placeholder="Email de contacto"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="submit"
                onClick={onSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla Concesiones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objeto del Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titular
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puerto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {concesiones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">No hay concesiones registradas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                concesiones.map((concesion) => (
                  <tr 
                    key={concesion.id} 
                    className={`hover:bg-gray-50 transition-colors duration-300 ${
                      concesion.isNew ? 'animate-highlight' : ''
                    }`}
                  >
                    <td 
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {concesion.objetoTitulo}
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      {concesion.titularNombre}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {concesion.tipo}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      {concesion.puerto}
                    </td>
                    <td 
                      className="px-6 py-4 text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      <div>
                        <div className="font-medium">{concesion.fechaInicio}</div>
                        <div className="text-xs text-gray-500">{concesion.fechaFin}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {!concesion.actividades || concesion.actividades.length === 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCreateActividad(concesion)
                          }}
                          className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Crear actividad
                        </Button>
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenViewActividades(concesion)
                          }}
                          className="cursor-pointer border rounded-lg p-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-sm">{concesion.actividades[0].nombre}</div>
                          <div className="text-xs text-gray-500">{concesion.actividades[0].pvaAsociadoNombre || 'PVA'}</div>
                          {concesion.actividades.length > 1 && (
                            <div className="text-xs text-blue-600 mt-1">
                              +{concesion.actividades.length - 1} más
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td 
                      className="px-6 py-4 text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEdit(concesion)}
                    >
                      <div>
                        <div className="font-medium">{concesion.contactoNombre}</div>
                        <div className="text-xs text-gray-500">{concesion.contactoTelefono}</div>
                        <div className="text-xs text-gray-500">{concesion.contactoEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCopy(concesion)
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Copiar concesión"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(concesion.id)
                          }}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Eliminar concesión"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diálogo para crear actividad */}
      <CreateActividadConcesionDialog
        isOpen={isCreateActividadDialogOpen}
        onClose={() => setIsCreateActividadDialogOpen(false)}
        onSubmit={handleSubmitActividad}
        templates={templates}
        isLoading={isLoading}
      />

      {/* Diálogo para ver todas las actividades */}
      <ActividadesConcesionDialog
        isOpen={isViewActividadesDialogOpen}
        onClose={() => setIsViewActividadesDialogOpen(false)}
        actividades={selectedConcesionForActividades?.actividades || []}
        concesionTitulo={selectedConcesionForActividades?.objetoTitulo || ''}
        onAddActividad={handleAddActividadFromView}
      />

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La concesión será eliminada permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
