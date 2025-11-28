'use client'

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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
}

interface EditarActividadDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedActividad: Actividad | null
  formData: {
    nombre: string
    titularId: string
    pvaAsociado: string
    zona: string
    puerto: string
    inicioContrato: string
    finContrato: string
  }
  titulares: Titular[]
  templates: Array<{id: string, name: string}>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange: (name: string, value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export default function EditarActividadDialog({
  isOpen,
  onClose,
  selectedActividad,
  formData,
  titulares,
  templates,
  onInputChange,
  onSelectChange,
  onSubmit,
  isLoading
}: EditarActividadDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{selectedActividad ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
          <DialogDescription>
            {selectedActividad ? 'Modifica los datos de la actividad' : 'Completa los datos de la actividad'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Línea 1: Nombre de actividad y PVA Asociado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de la Actividad</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={onInputChange}
                placeholder="Ingresa el nombre de la actividad"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pvaAsociado">PVA Asociado</Label>
              <Select
                value={formData.pvaAsociado}
                onValueChange={(value) => onSelectChange('pvaAsociado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Línea 2: Zona y Puerto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zona">Zona</Label>
              <Input
                id="zona"
                name="zona"
                value={formData.zona}
                onChange={onInputChange}
                placeholder="Ingresa la zona"
              />
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
          
          {/* Línea 3: Vigencia del contrato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="inicioContrato">Inicio Contrato</Label>
              <Input
                id="inicioContrato"
                name="inicioContrato"
                value={formData.inicioContrato}
                onChange={onInputChange}
                placeholder="DD/MM/AAAA"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="finContrato">Fin Contrato</Label>
              <Input
                id="finContrato"
                name="finContrato"
                value={formData.finContrato}
                onChange={onInputChange}
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>

          {/* Selector de Titular */}
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
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
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
  )
}
