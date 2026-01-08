'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
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

interface Template {
  id: string
  name: string
}

interface CreateActividadConcesionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (nombre: string, pvaAsociado: string) => void
  templates: Template[]
  isLoading?: boolean
}

export default function CreateActividadConcesionDialog({
  isOpen,
  onClose,
  onSubmit,
  templates,
  isLoading = false
}: CreateActividadConcesionDialogProps) {
  const [nombre, setNombre] = useState('')
  const [pvaAsociado, setPvaAsociado] = useState('')

  const handleSubmit = () => {
    if (!nombre.trim() || !pvaAsociado) {
      return
    }
    onSubmit(nombre, pvaAsociado)
    setNombre('')
    setPvaAsociado('')
  }

  const handleClose = () => {
    setNombre('')
    setPvaAsociado('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Actividad</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre de la Actividad</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa el nombre de la actividad"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pvaAsociado">PVA Asociado</Label>
            <Select value={pvaAsociado} onValueChange={setPvaAsociado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un PVA" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!nombre.trim() || !pvaAsociado || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Creando...' : 'Aceptar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
