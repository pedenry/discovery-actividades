'use client'

import { useState, useEffect } from 'react'
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

interface ContactoSeguimiento {
  id?: string
  nombre: string
  telefono: string
  email: string
}

interface ContactoSeguimientoDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (nombre: string, telefono: string, email: string) => void
  contacto?: ContactoSeguimiento | null
  isLoading: boolean
}

export default function ContactoSeguimientoDialog({
  isOpen,
  onClose,
  onSubmit,
  contacto,
  isLoading
}: ContactoSeguimientoDialogProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (contacto) {
      setNombre(contacto.nombre || '')
      setTelefono(contacto.telefono || '')
      setEmail(contacto.email || '')
    } else {
      setNombre('')
      setTelefono('')
      setEmail('')
    }
  }, [contacto, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    
    onSubmit(nombre, telefono, email)
    
    // Limpiar formulario
    setNombre('')
    setTelefono('')
    setEmail('')
  }

  const handleClose = () => {
    setNombre('')
    setTelefono('')
    setEmail('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contacto ? 'Editar persona de contacto' : 'Añadir persona de contacto'}
          </DialogTitle>
          <DialogDescription>
            {contacto 
              ? 'Modifica los datos de la persona de contacto de este seguimiento.'
              : 'Completa los datos de la persona de contacto para este seguimiento.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Juan García"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="Ej: 612345678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: juan.garcia@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !nombre.trim()}>
              {contacto ? 'Actualizar' : 'Añadir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
