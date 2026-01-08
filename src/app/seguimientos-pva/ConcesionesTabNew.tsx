'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
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

  // Definir columnas de la tabla usando TanStack Table
  const columns = useMemo<ColumnDef<Concesion>[]>(() => [
    {
      accessorKey: 'objetoTitulo',
      header: 'Objeto del Título',
      cell: ({ row }) => (
        <div
          className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          {row.getValue('objetoTitulo')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 180,
      minSize: 120,
      maxSize: 350,
    },
    {
      accessorKey: 'titularNombre',
      header: 'Titular',
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          {row.getValue('titularNombre')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 150,
      minSize: 100,
      maxSize: 250,
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {row.getValue('tipo')}
          </span>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 120,
      minSize: 90,
      maxSize: 150,
    },
    {
      accessorKey: 'puerto',
      header: 'Puerto',
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          {row.getValue('puerto')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 100,
      minSize: 80,
      maxSize: 150,
    },
    {
      id: 'vigencia',
      header: 'Vigencia',
      accessorFn: (row) => `${row.fechaInicio} - ${row.fechaFin}`,
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          <div className="font-medium">{row.original.fechaInicio}</div>
          <div className="text-xs text-gray-500">{row.original.fechaFin}</div>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 130,
      minSize: 100,
      maxSize: 180,
    },
    {
      id: 'actividades',
      header: 'Actividades',
      cell: ({ row }) => {
        const concesion = row.original
        return (
          <div onClick={(e) => e.stopPropagation()}>
            {!concesion.actividades || concesion.actividades.length === 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenCreateActividad(concesion)}
                className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Crear actividad
              </Button>
            ) : (
              <div
                onClick={() => handleOpenViewActividades(concesion)}
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
          </div>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      size: 150,
      minSize: 130,
      maxSize: 200,
    },
    {
      id: 'contacto',
      header: 'Contacto',
      accessorFn: (row) => row.contactoNombre,
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          <div className="font-medium">{row.original.contactoNombre}</div>
          <div className="text-xs text-gray-500">{row.original.contactoTelefono}</div>
          <div className="text-xs text-gray-500">{row.original.contactoEmail}</div>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 160,
      minSize: 120,
      maxSize: 250,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onCopy(row.original)
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
              handleDeleteClick(row.original.id)
            }}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            title="Eliminar concesión"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      size: 110,
    },
  ], [onEdit, onCopy])

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
                <Select value={formData.titularId} onValueChange={(value) => onSelectChange('titularId', value)}>
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

              {/* Tipo */}
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => onSelectChange('tipo', value)}>
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

              {/* Puerto */}
              <div className="grid gap-2">
                <Label htmlFor="puerto">Puerto</Label>
                <Input
                  id="puerto"
                  name="puerto"
                  value={formData.puerto}
                  onChange={onInputChange}
                  placeholder="Ej: TOR"
                />
              </div>

              {/* Vigencia */}
              <div className="grid gap-2">
                <Label>Vigencia</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Fecha Inicio */}
                  <div className="grid gap-2">
                    <Label htmlFor="fechaInicio" className="text-xs text-gray-600">Fecha de inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !fechaInicioDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaInicioDate ? (
                            format(fechaInicioDate, 'dd/MM/yyyy', { locale: es })
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

                  {/* Fecha Fin */}
                  <div className="grid gap-2">
                    <Label htmlFor="fechaFin" className="text-xs text-gray-600">Fecha de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !fechaFinDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaFinDate ? (
                            format(fechaFinDate, 'dd/MM/yyyy', { locale: es })
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
              </div>

              {/* Datos de Contacto */}
              <div className="grid gap-2">
                <Label className="font-semibold">Datos de Contacto</Label>
                <div className="grid gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid gap-2">
                    <Label htmlFor="contactoNombre">Nombre</Label>
                    <Input
                      id="contactoNombre"
                      name="contactoNombre"
                      value={formData.contactoNombre}
                      onChange={onInputChange}
                      placeholder="Nombre de contacto"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactoTelefono">Teléfono</Label>
                    <Input
                      id="contactoTelefono"
                      name="contactoTelefono"
                      type="tel"
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

      {/* Tabla con DataTable */}
      <DataTable
        columns={columns}
        data={concesiones}
        enableSorting={true}
        enableFiltering={true}
        enableResizing={true}
        enableColumnPinning={false}
      />

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
