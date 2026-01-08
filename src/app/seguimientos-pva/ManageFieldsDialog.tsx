'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Edit2, Trash2, Check, AlertCircle } from 'lucide-react'
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
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ManageFieldsDialogProps {
  isOpen: boolean
  onClose: () => void
  existingFields: string[]
  onSave: (fields: string[]) => void
}

export default function ManageFieldsDialog({
  isOpen,
  onClose,
  existingFields,
  onSave
}: ManageFieldsDialogProps) {
  const [fields, setFields] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFields([...existingFields])
      setEditingIndex(null)
      setEditValue('')
      setIsAddingNew(false)
      setNewFieldName('')
      setError('')
    }
  }, [isOpen, existingFields])

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(fields[index])
    setError('')
  }

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      setError('El nombre del campo no puede estar vacío')
      return
    }

    if (fields.some((f, i) => i !== editingIndex && f.toLowerCase() === editValue.trim().toLowerCase())) {
      setError('Ya existe un campo con este nombre')
      return
    }

    const updatedFields = [...fields]
    updatedFields[editingIndex!] = editValue.trim()
    setFields(updatedFields)
    setEditingIndex(null)
    setEditValue('')
    setError('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
    setError('')
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
    setError('')
  }

  const handleAddNewField = () => {
    if (!newFieldName.trim()) {
      setError('El nombre del campo no puede estar vacío')
      return
    }

    if (fields.some(f => f.toLowerCase() === newFieldName.trim().toLowerCase())) {
      setError('Ya existe un campo con este nombre')
      return
    }

    setFields([...fields, newFieldName.trim()])
    setNewFieldName('')
    setIsAddingNew(false)
    setError('')
  }

  const handleCancelAdd = () => {
    setIsAddingNew(false)
    setNewFieldName('')
    setError('')
  }

  const handleSave = () => {
    onSave(fields)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Gestionar Datos</DialogTitle>
          <DialogDescription>
            Gestiona los campos personalizados de los titulares. Los cambios se aplicarán a todos los titulares.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* List of Fields */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Campos personalizados</Label>
            
            {fields.length === 0 && !isAddingNew && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No hay campos personalizados definidos</p>
                <p className="text-xs text-gray-400 mt-1">Añade el primer campo para empezar</p>
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {editingIndex === index ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit()
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {field}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(index)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Field */}
            {isAddingNew ? (
              <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                <Label htmlFor="new-field" className="text-sm mb-2 block">
                  Nombre del nuevo campo
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-field"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewField()
                      } else if (e.key === 'Escape') {
                        handleCancelAdd()
                      }
                    }}
                    placeholder="Ej: Email, Teléfono, Zona..."
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewField}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Añadir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAdd}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="w-full border-dashed border-2 hover:border-blue-400 hover:bg-blue-50"
                disabled={editingIndex !== null}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir campo personalizado
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={editingIndex !== null || isAddingNew}
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
