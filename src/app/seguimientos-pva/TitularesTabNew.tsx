'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
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
    await onManageFields(fields)
    setManagedFieldNames(fields)
  }

  const handleSubmitWithCustomFields = () => {
    const customFieldsObj = customFields.reduce((acc, field) => {
      acc[field.name] = field.value
      return acc
    }, {} as Record<string, string>)
    
    handleSubmit(customFieldsObj)
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
      const fields = managedFieldNames.map(fieldName => ({
        name: fieldName,
        value: selectedTitular.customFields?.[fieldName] || ''
      }))
      
      setCustomFields(fields)
    } else if (!selectedTitular && isDialogOpen) {
      const fields = managedFieldNames.map(fieldName => ({
        name: fieldName,
        value: ''
      }))
      setCustomFields(fields)
    } else if (!isDialogOpen) {
      setCustomFields([])
    }
  }, [selectedTitular, isDialogOpen, managedFieldNames])

  // Definir columnas de la tabla usando TanStack Table
  const columns = useMemo<ColumnDef<Titular>[]>(() => {
    const baseColumns: ColumnDef<Titular>[] = [
      {
        accessorKey: 'nombre',
        header: 'Titular',
        cell: ({ row }) => (
          <div
            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={() => onEditTitular(row.original)}
          >
            {row.getValue('nombre')}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 250,
        minSize: 150,
        maxSize: 400,
      },
    ]

    // Agregar columnas dinámicas para custom fields
    const customFieldColumns: ColumnDef<Titular>[] = managedFieldNames.map((fieldName) => ({
      id: fieldName,
      accessorFn: (row) => row.customFields?.[fieldName] || '-',
      header: fieldName,
      cell: ({ row }) => (
        <div
          className="cursor-pointer"
          onClick={() => onEditTitular(row.original)}
        >
          {row.original.customFields?.[fieldName] || '-'}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      size: 200,
      minSize: 100,
      maxSize: 350,
    }))

    // Columna de acciones (fija a la derecha)
    const actionsColumn: ColumnDef<Titular> = {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteTitular(row.original.id)
            }}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      size: 100,
    }

    return [...baseColumns, ...customFieldColumns, actionsColumn]
  }, [managedFieldNames, onEditTitular, onDeleteTitular])

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

      {/* Tabla con DataTable */}
      <DataTable
        columns={columns}
        data={titulares}
        enableSorting={true}
        enableFiltering={true}
        enableResizing={true}
        enableColumnPinning={false}
      />
    </div>
  )
}
