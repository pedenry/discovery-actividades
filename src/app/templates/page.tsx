'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, FileText, Save, X, AlertTriangle, Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { db } from '@/lib/firebase-firestore'
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore'

interface TemplateItem {
  id: string
  name: string
  type: 'requisito' | 'solicitud'
  order: number
}

interface Template {
  id: string
  name: string
  items: Record<string, TemplateItem>
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    items: {}
  })
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'requisito' | 'solicitud'>('requisito')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'name' | 'type' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; templateId: string; templateName: string }>({
    isOpen: false,
    templateId: '',
    templateName: ''
  })

  // Load templates from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'templates'), (snapshot) => {
      const templatesData: Template[] = []
      snapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data()
        } as Template)
      })
      setTemplates(templatesData)
      
      // Set first template as selected if none is selected
      if (!selectedTemplate && templatesData.length > 0) {
        setSelectedTemplate(templatesData[0])
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedTemplate])

  // Save and cancel editing when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingItem && !(event.target as Element)?.closest('td')) {
        // Guardar cambios antes de cancelar si es edición de nombre
        if (editingField === 'name') {
          saveEdit()
        } else {
          cancelEditing()
        }
      }
    }

    if (editingItem) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingItem, editingField, editValue])

  const handleCreateNewTemplate = () => {
    setIsCreatingNew(true)
    setNewTemplate({ name: '', items: {} })
    setSelectedTemplate(null)
    // Activar edición del nombre automáticamente
    setTimeout(() => {
      startEditing('template-name', 'name', '')
    }, 100)
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.name.trim()) {
      setSaveStatus('⚠️ Debes dar un nombre a la plantilla')
      setTimeout(() => setSaveStatus(null), 3000)
      // Activar edición del nombre si está vacío
      startEditing('template-name', 'name', '')
      return
    }

    try {
      const templateToSave = {
        name: newTemplate.name,
        items: newTemplate.items || {}
      }
      
      const docRef = await addDoc(collection(db, 'templates'), templateToSave)
      
      // The template will be automatically added to the list via the onSnapshot listener
      setIsCreatingNew(false)
      setNewTemplate({ name: '', items: {} })
      
      setSaveStatus('Plantilla guardada ✓')
      setTimeout(() => setSaveStatus(null), 2000)
      
      // Select the newly created template
      const newTemplate_: Template = {
        id: docRef.id,
        ...templateToSave
      }
      setSelectedTemplate(newTemplate_)
    } catch (error) {
      console.error('Error saving template:', error)
      setSaveStatus('Error al guardar ❌')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleCancelCreate = () => {
    setIsCreatingNew(false)
    setNewTemplate({ name: '', items: {} })
    setSelectedTemplate(templates[0] || null)
  }

  const handleDeleteTemplate = (templateId: string) => {
    const templateToDelete = templates.find(t => t.id === templateId)
    if (templateToDelete) {
      setDeleteConfirmation({
        isOpen: true,
        templateId: templateId,
        templateName: templateToDelete.name
      })
    }
  }

  const confirmDeleteTemplate = async () => {
    try {
      await deleteDoc(doc(db, 'templates', deleteConfirmation.templateId))
      
      // If the deleted template was selected, clear selection
      // The onSnapshot listener will automatically update the templates list
      if (selectedTemplate?.id === deleteConfirmation.templateId) {
        setSelectedTemplate(null)
      }
      
      // Close confirmation dialog
      setDeleteConfirmation({ isOpen: false, templateId: '', templateName: '' })
    } catch (error) {
      console.error('Error deleting template:', error)
      // You could add a toast notification here
    }
  }

  const cancelDeleteTemplate = () => {
    setDeleteConfirmation({ isOpen: false, templateId: '', templateName: '' })
  }

  // Functions for managing items
  const handleAddItem = async () => {
    if (newItemName.trim()) {
      if (isCreatingNew) {
        // Adding to new template
        const currentItems = newTemplate.items || {}
        const itemId = `item${Object.keys(currentItems).length + 1}`
        const newItem: TemplateItem = {
          id: itemId,
          name: newItemName,
          type: newItemType,
          order: Object.keys(currentItems).length + 1
        }
        setNewTemplate({
          ...newTemplate,
          items: {
            ...currentItems,
            [itemId]: newItem
          }
        })
      } else if (selectedTemplate) {
        // Adding to existing template
        const currentItems = selectedTemplate.items || {}
        const itemId = `item${Date.now()}` // Use timestamp for unique ID
        const newItem: TemplateItem = {
          id: itemId,
          name: newItemName,
          type: newItemType,
          order: Object.keys(currentItems).length + 1
        }
        
        const updatedItems = {
          ...currentItems,
          [itemId]: newItem
        }
        
        try {
          await updateDoc(doc(db, 'templates', selectedTemplate.id), {
            items: updatedItems
          })
          
          setSelectedTemplate({
            ...selectedTemplate,
            items: updatedItems
          })
          
          setSaveStatus('Elemento agregado ✓')
          setTimeout(() => setSaveStatus(null), 2000)
        } catch (error) {
          console.error('Error adding item:', error)
          setSaveStatus('Error al agregar ❌')
          setTimeout(() => setSaveStatus(null), 2000)
        }
      }
      
      setNewItemName('')
      setNewItemType('requisito')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (isCreatingNew) {
      // Removing from new template
      const currentItems = newTemplate.items || {}
      const updatedItems = { ...currentItems }
      delete updatedItems[itemId]
      
      // Reorder remaining items
      const itemsArray = Object.values(updatedItems).sort((a, b) => a.order - b.order)
      const reorderedItems: Record<string, TemplateItem> = {}
      itemsArray.forEach((item, index) => {
        reorderedItems[item.id] = { ...item, order: index + 1 }
      })
      
      setNewTemplate({
        ...newTemplate,
        items: reorderedItems
      })
    } else if (selectedTemplate) {
      // Removing from existing template
      const currentItems = selectedTemplate.items || {}
      const updatedItems = { ...currentItems }
      delete updatedItems[itemId]
      
      // Reorder remaining items
      const itemsArray = Object.values(updatedItems).sort((a, b) => a.order - b.order)
      const reorderedItems: Record<string, TemplateItem> = {}
      itemsArray.forEach((item, index) => {
        reorderedItems[item.id] = { ...item, order: index + 1 }
      })
      
      try {
        await updateDoc(doc(db, 'templates', selectedTemplate.id), {
          items: reorderedItems
        })
        
        setSelectedTemplate({
          ...selectedTemplate,
          items: reorderedItems
        })
        
        setSaveStatus('Elemento eliminado ✓')
        setTimeout(() => setSaveStatus(null), 2000)
      } catch (error) {
        console.error('Error removing item:', error)
        setSaveStatus('Error al eliminar ❌')
        setTimeout(() => setSaveStatus(null), 2000)
      }
    }
  }

  const getOrderedItems = () => {
    const currentItems = newTemplate.items || {}
    return Object.values(currentItems).sort((a, b) => a.order - b.order)
  }

  const handleReorderItems = async (draggedId: string, targetId: string, position: 'before' | 'after') => {
    const itemsArray = getCurrentTemplateItems()
    
    const draggedIndex = itemsArray.findIndex(item => item.id === draggedId)
    const targetIndex = itemsArray.findIndex(item => item.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return
    
    // Create a copy of the array
    const newItemsArray = [...itemsArray]
    
    // Remove the dragged item
    const [draggedItemObj] = newItemsArray.splice(draggedIndex, 1)
    
    // Calculate the correct insert position
    let insertIndex = targetIndex
    if (draggedIndex < targetIndex) {
      insertIndex = position === 'before' ? targetIndex - 1 : targetIndex
    } else {
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1
    }
    
    // Insert the dragged item at the new position
    newItemsArray.splice(insertIndex, 0, draggedItemObj)
    
    // Update order numbers
    const reorderedItems: Record<string, TemplateItem> = {}
    newItemsArray.forEach((item, index) => {
      reorderedItems[item.id] = { ...item, order: index + 1 }
    })
    
    if (isCreatingNew) {
      setNewTemplate({
        ...newTemplate,
        items: reorderedItems
      })
    } else if (selectedTemplate) {
      try {
        await updateDoc(doc(db, 'templates', selectedTemplate.id), {
          items: reorderedItems
        })
        
        setSelectedTemplate({
          ...selectedTemplate,
          items: reorderedItems
        })
        
        setSaveStatus('Orden actualizado ✓')
        setTimeout(() => setSaveStatus(null), 2000)
      } catch (error) {
        console.error('Error reordering items:', error)
        setSaveStatus('Error al reordenar ❌')
        setTimeout(() => setSaveStatus(null), 2000)
      }
    }
  }

  // Functions for inline editing
  const startEditing = (itemId: string, field: 'name' | 'type', currentValue: string) => {
    setEditingItem(itemId)
    setEditingField(field)
    setEditValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditingField(null)
    setEditValue('')
  }

  const saveEdit = () => {
    if (editingItem && editingField) {
      const currentItems = newTemplate.items || {}
      const updatedItems = { ...currentItems }
      
      if (updatedItems[editingItem]) {
        let shouldUpdate = false
        
        if (editingField === 'name' && editValue.trim()) {
          updatedItems[editingItem] = { ...updatedItems[editingItem], name: editValue.trim() }
          shouldUpdate = true
        } else if (editingField === 'type' && (editValue === 'requisito' || editValue === 'solicitud')) {
          updatedItems[editingItem] = { ...updatedItems[editingItem], type: editValue as 'requisito' | 'solicitud' }
          shouldUpdate = true
        }
        
        if (shouldUpdate) {
          setNewTemplate({
            ...newTemplate,
            items: updatedItems
          })
          setSaveStatus('Cambios guardados ✓')
          setTimeout(() => setSaveStatus(null), 2000)
          console.log('Cambios guardados en el frontend:', updatedItems[editingItem])
        }
      }
    }
    cancelEditing()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Función específica para guardar cambios de tipo inmediatamente
  const saveTypeChange = (newType: string) => {
    console.log('saveTypeChange llamada con:', newType, 'editingItem:', editingItem, 'editingField:', editingField)
    
    if (editingItem && editingField === 'type' && (newType === 'requisito' || newType === 'solicitud')) {
      const currentItems = newTemplate.items || {}
      const updatedItems = { ...currentItems }
      
      if (updatedItems[editingItem]) {
        const oldType = updatedItems[editingItem].type
        updatedItems[editingItem] = { ...updatedItems[editingItem], type: newType as 'requisito' | 'solicitud' }
        
        console.log('Cambiando tipo de', oldType, 'a', newType, 'para item:', editingItem)
        
        setNewTemplate({
          ...newTemplate,
          items: updatedItems
        })
        
        setSaveStatus(`Tipo cambiado a ${newType} ✓`)
        setTimeout(() => setSaveStatus(null), 2000)
        console.log('Tipo cambiado y guardado:', newType, updatedItems[editingItem])
        
        // Delay para asegurar que el estado se actualice antes de cancelar
        setTimeout(() => cancelEditing(), 100)
      }
    } else {
      console.log('Condiciones no cumplidas para saveTypeChange')
    }
  }

  // Funciones para editar plantillas existentes
  const saveExistingTemplateEdit = async () => {
    if (editingItem && editingField && selectedTemplate) {
      const currentItems = selectedTemplate.items || {}
      const updatedItems = { ...currentItems }
      
      if (updatedItems[editingItem]) {
        let shouldUpdate = false
        
        if (editingField === 'name' && editValue.trim()) {
          updatedItems[editingItem] = { ...updatedItems[editingItem], name: editValue.trim() }
          shouldUpdate = true
        } else if (editingField === 'type' && (editValue === 'requisito' || editValue === 'solicitud')) {
          updatedItems[editingItem] = { ...updatedItems[editingItem], type: editValue as 'requisito' | 'solicitud' }
          shouldUpdate = true
        }
        
        if (shouldUpdate) {
          const updatedTemplate = {
            ...selectedTemplate,
            items: updatedItems
          }
          
          // Actualizar en Firebase
          try {
            await updateDoc(doc(db, 'templates', selectedTemplate.id), {
              items: updatedItems
            })
            
            // Actualizar el estado local
            setSelectedTemplate(updatedTemplate)
            setSaveStatus('Cambios guardados en Firebase ✓')
            setTimeout(() => setSaveStatus(null), 2000)
            console.log('Plantilla existente actualizada:', updatedTemplate)
          } catch (error) {
            console.error('Error actualizando plantilla:', error)
            setSaveStatus('Error al guardar ❌')
            setTimeout(() => setSaveStatus(null), 2000)
          }
        }
      }
    }
    cancelEditing()
  }

  const saveExistingTypeChange = async (newType: string) => {
    if (editingItem && editingField === 'type' && selectedTemplate && (newType === 'requisito' || newType === 'solicitud')) {
      const currentItems = selectedTemplate.items || {}
      const updatedItems = { ...currentItems }
      
      if (updatedItems[editingItem]) {
        updatedItems[editingItem] = { ...updatedItems[editingItem], type: newType as 'requisito' | 'solicitud' }
        
        const updatedTemplate = {
          ...selectedTemplate,
          items: updatedItems
        }
        
        try {
          await updateDoc(doc(db, 'templates', selectedTemplate.id), {
            items: updatedItems
          })
          
          setSelectedTemplate(updatedTemplate)
          setSaveStatus(`Tipo actualizado en Firebase ✓`)
          setTimeout(() => setSaveStatus(null), 2000)
          setTimeout(() => cancelEditing(), 100)
        } catch (error) {
          console.error('Error actualizando tipo:', error)
          setSaveStatus('Error al guardar ❌')
          setTimeout(() => setSaveStatus(null), 2000)
        }
      }
    }
  }

  // Función para obtener la plantilla actual (nueva o existente)
  const getCurrentTemplate = (): Template | Partial<Template> | null => {
    if (isCreatingNew) {
      return newTemplate
    }
    return selectedTemplate
  }

  const getCurrentTemplateItems = () => {
    const template = getCurrentTemplate()
    if (!template || !template.items) return []
    return Object.values(template.items).sort((a, b) => a.order - b.order)
  }

  const isEditingExistingTemplate = () => {
    return !isCreatingNew && selectedTemplate
  }

  // Función unificada para guardar cambios
  const saveCurrentTemplate = async () => {
    if (isCreatingNew) {
      return handleSaveTemplate()
    } else if (selectedTemplate) {
      // Para plantillas existentes, ya se guardan automáticamente
      return Promise.resolve()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Templates List */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Plantillas Disponibles</h2>
          <div className="space-y-3 overflow-y-auto max-h-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Cargando plantillas...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay plantillas disponibles</p>
                <p className="text-sm">Crea tu primera plantilla</p>
              </div>
            ) : (
              templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                  selectedTemplate?.id === template.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedTemplate?.id === template.id
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    )}>
                      <FileText className={cn(
                        "w-5 h-5",
                        selectedTemplate?.id === template.id
                          ? "text-blue-600"
                          : "text-gray-600"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">
                        {Object.keys(template.items || {}).length} elementos
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent template selection
                        handleDeleteTemplate(template.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
          
          {/* New Template Button */}
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={handleCreateNewTemplate}
              className="w-full"
              variant="outline"
            >
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {/* Right Panel - Unified Template Editor */}
        <div className="bg-white rounded-lg border p-6">
          {(isCreatingNew || selectedTemplate) ? (
            <div className="space-y-6">
              {/* Header with editable template name */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingItem === 'template-name' && editingField === 'name' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (isCreatingNew) {
                            setNewTemplate({ ...newTemplate, name: editValue.trim() })
                          } else if (selectedTemplate) {
                            // Update existing template name in Firebase
                            updateDoc(doc(db, 'templates', selectedTemplate.id), {
                              name: editValue.trim()
                            }).then(() => {
                              setSelectedTemplate({ ...selectedTemplate, name: editValue.trim() })
                              setSaveStatus('Nombre actualizado ✓')
                              setTimeout(() => setSaveStatus(null), 2000)
                            })
                          }
                          cancelEditing()
                        } else if (e.key === 'Escape') {
                          cancelEditing()
                        }
                      }}
                      onBlur={() => {
                        if (isCreatingNew) {
                          setNewTemplate({ ...newTemplate, name: editValue.trim() })
                        } else if (selectedTemplate) {
                          updateDoc(doc(db, 'templates', selectedTemplate.id), {
                            name: editValue.trim()
                          }).then(() => {
                            setSelectedTemplate({ ...selectedTemplate, name: editValue.trim() })
                            setSaveStatus('Nombre actualizado ✓')
                            setTimeout(() => setSaveStatus(null), 2000)
                          })
                        }
                        cancelEditing()
                      }}
                      autoFocus
                      className="text-xl font-semibold bg-transparent border-none p-0 h-auto focus:ring-0 focus:border-none"
                    />
                  ) : (
                    <h2 
                      className="text-xl font-semibold cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      onClick={() => {
                        const currentName = getCurrentTemplate()?.name || ''
                        startEditing('template-name', 'name', currentName)
                      }}
                    >
                      {getCurrentTemplate()?.name || 'Nueva Plantilla'}
                    </h2>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {saveStatus && (
                    <span className={`text-sm font-medium animate-fade-in ${
                      saveStatus.includes('⚠️') ? 'text-yellow-600' :
                      saveStatus.includes('❌') ? 'text-red-600' :
                      'text-green-600'
                    }`}>
                      {saveStatus}
                    </span>
                  )}
                  {isCreatingNew && (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTemplate} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button onClick={handleCancelCreate} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                  <span className="text-sm text-gray-500">
                    {getCurrentTemplateItems().length} elementos
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {getCurrentTemplateItems().length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Elemento</TableHead>
                        <TableHead className="w-24">Tipo</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentTemplateItems().map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "group",
                            editingItem ? "cursor-default" : "cursor-move",
                            draggedItem === item.id && "opacity-50",
                            dragOverItem === item.id && "bg-blue-50"
                          )}
                          draggable={!editingItem}
                          onDragStart={(e: React.DragEvent) => {
                            e.dataTransfer.setData('text/plain', item.id)
                            setDraggedItem(item.id)
                          }}
                          onDragEnd={() => {
                            setDraggedItem(null)
                            setDragOverItem(null)
                          }}
                          onDragOver={(e: React.DragEvent) => {
                            e.preventDefault()
                            if (draggedItem && draggedItem !== item.id) {
                              setDragOverItem(item.id)
                            }
                          }}
                          onDrop={(e: React.DragEvent) => {
                            e.preventDefault()
                            const draggedId = e.dataTransfer.getData('text/plain')
                            if (draggedId !== item.id) {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              const mouseY = e.clientY
                              const itemCenter = rect.top + rect.height / 2
                              const position = mouseY < itemCenter ? 'before' : 'after'
                              handleReorderItems(draggedId, item.id, position)
                            }
                            setDraggedItem(null)
                            setDragOverItem(null)
                          }}
                        >
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                          </TableCell>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => startEditing(item.id, 'name', item.name)}
                          >
                            {editingItem === item.id && editingField === 'name' ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    isEditingExistingTemplate() ? saveExistingTemplateEdit() : saveEdit()
                                  } else if (e.key === 'Escape') {
                                    cancelEditing()
                                  }
                                }}
                                onBlur={() => isEditingExistingTemplate() ? saveExistingTemplateEdit() : saveEdit()}
                                autoFocus
                                className="h-8 text-sm"
                              />
                            ) : (
                              item.name
                            )}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => startEditing(item.id, 'type', item.type)}
                          >
                            {editingItem === item.id && editingField === 'type' ? (
                              <Select 
                                value={editValue} 
                                onValueChange={(value) => {
                                  setEditValue(value)
                                  isEditingExistingTemplate() ? saveExistingTypeChange(value) : saveTypeChange(value)
                                }}
                              >
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="requisito">Requisito</SelectItem>
                                  <SelectItem value="solicitud">Solicitud</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={item.type === 'requisito' ? 'destructive' : 'default'}>
                                {item.type === 'requisito' ? 'Requisito' : 'Solicitud'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay elementos en esta plantilla</p>
                  <p className="text-sm mt-2">Agrega el primer elemento usando el formulario de abajo</p>
                </div>
              )}

              {/* Add Item Form */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Select value={newItemType} onValueChange={(value: 'requisito' | 'solicitud') => setNewItemType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requisito">Requisito</SelectItem>
                      <SelectItem value="solicitud">Solicitud</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Agregar nuevo elemento..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddItem} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecciona una plantilla para editarla</p>
                <p className="text-sm mt-2">o crea una nueva plantilla</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Plantilla</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                ¿Estás seguro de que quieres eliminar la plantilla{' '}
                <span className="font-semibold">"{deleteConfirmation.templateName}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Todos los elementos de esta plantilla se perderán permanentemente.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteTemplate}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTemplate}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
