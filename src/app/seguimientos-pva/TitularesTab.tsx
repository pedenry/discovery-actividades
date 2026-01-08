'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
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
import ManageFieldsDialog from './ManageFieldsDialog'

interface Titular {
  id: string
  nombre: string
  customFields?: Record<string, string>
  createdAt?: Date
  isNew?: boolean
}

interface TitularesTabProps {
  titulares: Titular[]
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  formData: { nombre: string }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (customFields?: Record<string, string>) => void
  handleCloseDialog: () => void
  isLoading: boolean
  selectedTitular: Titular | null
  onEditTitular: (titular: Titular) => void
  onDeleteTitular: (titularId: string) => void
  onManageFields: (fields: string[]) => Promise<void>
}

export default function TitularesTab({
  titulares,
  isDialogOpen,
  setIsDialogOpen,
  formData,
  handleInputChange,
  handleSubmit,
  handleCloseDialog,
  isLoading,
  selectedTitular,
  onEditTitular,
  onDeleteTitular,
  onManageFields
}: TitularesTabProps) {
  const [customFields, setCustomFields] = useState<Array<{name: string, value: string}>>([])
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false)
  const [managedFieldNames, setManagedFieldNames] = useState<string[]>([])

  const handleFieldValueChange = (index: number, value: string) => {
    const updated = [...customFields]
    updated[index].value = value
    setCustomFields(updated)
  }

  const handleSaveFieldsManagement = async (fields: string[]) => {
    // Llamar a la función del padre para actualizar Firestore
    await onManageFields(fields)
    // Actualizar el estado local
    setManagedFieldNames(fields)
  }

  const handleSubmitWithCustomFields = () => {
    // Agregar campos personalizados al formData antes de guardar
    const customFieldsObj = customFields.reduce((acc, field) => {
      acc[field.name] = field.value
      return acc
    }, {} as Record<string, string>)
    
    // Pasar los custom fields al padre
    handleSubmit(customFieldsObj)
    
    // Limpiar campos personalizados después de guardar
    setCustomFields([])
  }

  // Sincronizar campos gestionados con los existentes
  useEffect(() => {
    const allFieldNames = Array.from(
      new Set(
        titulares.flatMap(titular => 
          titular.customFields ? Object.keys(titular.customFields) : []
        )
      )
    )
    setManagedFieldNames(allFieldNames)
  }, [titulares])

  // Cargar campos personalizados del titular seleccionado al abrir el diálogo
  useEffect(() => {
    if (selectedTitular && isDialogOpen) {
      // Usar los campos gestionados
      const fields = managedFieldNames.map(fieldName => ({
        name: fieldName,
        value: selectedTitular.customFields?.[fieldName] || ''
      }))
      
      setCustomFields(fields)
    } else if (!selectedTitular && isDialogOpen) {
      // Para nuevo titular, crear campos vacíos
      const fields = managedFieldNames.map(fieldName => ({
        name: fieldName,
        value: ''
      }))
      setCustomFields(fields)
    } else if (!isDialogOpen) {
      setCustomFields([])
    }
  }, [selectedTitular, isDialogOpen, managedFieldNames])

  // Usar los campos gestionados como columnas de la tabla
  const allCustomFieldNames = managedFieldNames

  return (
    <div className="space-y-4">
      {/* Botones Nuevo Titular y Gestionar Datos */}
      <div className="flex justify-end gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setIsManageFieldsOpen(true)}
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Gestionar datos
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo titular
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{selectedTitular ? 'Editar Titular' : 'Nuevo Titular'}</DialogTitle>
              <DialogDescription>
                {selectedTitular ? 'Modifica los datos del titular' : 'Completa los datos del titular'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del Titular</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del titular"
                />
              </div>

              {/* Campos personalizados creados */}
              {customFields.map((field, index) => (
                <div key={index} className="grid gap-2">
                  <Label htmlFor={`custom-${index}`}>{field.name}</Label>
                  <Input
                    id={`custom-${index}`}
                    value={field.value}
                    onChange={(e) => handleFieldValueChange(index, e.target.value)}
                    placeholder={`Ingresa ${field.name.toLowerCase()}`}
                  />
                </div>
              ))}

              {managedFieldNames.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                  No hay campos personalizados definidos.
                  <br />
                  Usa el botón "Gestionar datos" para añadir campos.
                </div>
              )}
            </div>
            
            <DialogFooter>
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
      </div>

      {/* Modal para gestionar campos */}
      <ManageFieldsDialog
        isOpen={isManageFieldsOpen}
        onClose={() => setIsManageFieldsOpen(false)}
        existingFields={managedFieldNames}
        onSave={handleSaveFieldsManagement}
      />

      {/* Tabla Titulares */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titular
              </th>
              {allCustomFieldNames.map((fieldName) => (
                <th key={fieldName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {fieldName}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {titulares.length === 0 ? (
              <tr>
                <td colSpan={1 + allCustomFieldNames.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">No hay titulares registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              titulares.map((titular) => (
                <tr 
                  key={titular.id} 
                  className={`hover:bg-gray-50 transition-colors duration-300 ${
                    titular.isNew ? 'animate-highlight' : ''
                  }`}
                >
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onEditTitular(titular)}
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {titular.nombre}
                    </div>
                  </td>
                  {allCustomFieldNames.map((fieldName) => (
                    <td 
                      key={fieldName} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => onEditTitular(titular)}
                    >
                      {titular.customFields?.[fieldName] || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTitular(titular.id)
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
    </div>
  )
}
