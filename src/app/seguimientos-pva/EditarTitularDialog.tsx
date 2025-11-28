'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
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

interface Titular {
  id: string
  nombre: string
  customFields?: Record<string, string>
  createdAt?: Date
  isNew?: boolean
}

interface EditarTitularDialogProps {
  isOpen: boolean
  onClose: () => void
  titulares: Titular[]
  selectedTitular: Titular | null
  formData: { nombre: string }
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (customFields?: Record<string, string>) => void
  isLoading: boolean
}

export default function EditarTitularDialog({
  isOpen,
  onClose,
  titulares,
  selectedTitular,
  formData,
  onInputChange,
  onSubmit,
  isLoading
}: EditarTitularDialogProps) {
  const [customFields, setCustomFields] = useState<Array<{name: string, value: string}>>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [isAddingField, setIsAddingField] = useState(false)

  const handleAddField = () => {
    if (newFieldName.trim()) {
      setCustomFields([...customFields, { name: newFieldName.trim(), value: '' }])
      setNewFieldName('')
      setIsAddingField(false)
    }
  }

  const handleFieldValueChange = (index: number, value: string) => {
    const updated = [...customFields]
    updated[index].value = value
    setCustomFields(updated)
  }

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const handleSubmitWithCustomFields = () => {
    const customFieldsObj = customFields.reduce((acc, field) => {
      acc[field.name] = field.value
      return acc
    }, {} as Record<string, string>)
    
    onSubmit(customFieldsObj)
    setCustomFields([])
  }

  useEffect(() => {
    if (selectedTitular && isOpen) {
      const allFieldNames = Array.from(
        new Set(
          titulares.flatMap(titular => 
            titular.customFields ? Object.keys(titular.customFields) : []
          )
        )
      )
      
      const fields = allFieldNames.map(fieldName => ({
        name: fieldName,
        value: selectedTitular.customFields?.[fieldName] || ''
      }))
      
      setCustomFields(fields)
    } else if (!isOpen) {
      setCustomFields([])
      setNewFieldName('')
      setIsAddingField(false)
    }
  }, [selectedTitular, isOpen, titulares])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Editar Titular</DialogTitle>
          <DialogDescription>
            Modifica los datos del titular
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="titular-nombre">Nombre del Titular</Label>
            <Input
              id="titular-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={onInputChange}
              placeholder="Ingresa el nombre del titular"
            />
          </div>

          {/* Campos personalizados existentes */}
          {customFields.map((field, index) => (
            <div key={index} className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`field-${index}`}>{field.name}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveField(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id={`field-${index}`}
                value={field.value}
                onChange={(e) => handleFieldValueChange(index, e.target.value)}
                placeholder={`Ingresa ${field.name}`}
              />
            </div>
          ))}

          {/* Botón para agregar nuevo campo */}
          {!isAddingField ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingField(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar campo personalizado
            </Button>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="new-field-name">Nombre del nuevo campo</Label>
              <div className="flex gap-2">
                <Input
                  id="new-field-name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Ej: Teléfono, Email, etc."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddField()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddField}>
                  Agregar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingField(false)
                    setNewFieldName('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
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
            onClick={handleSubmitWithCustomFields}
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
