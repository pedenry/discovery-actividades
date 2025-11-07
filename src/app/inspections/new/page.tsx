'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, doc, getDoc, getDocs, setDoc, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Save, Plus } from 'lucide-react'

interface TemplateItem {
  id: string
  name: string
  type: string
  description?: string
  compliance: 'compliant' | 'nonCompliant' | 'n/a'
}

interface Template {
  id: string
  name: string
  description: string
  type: string
}

interface Evidence {
  id: string
  installation: string
  documentaryEvidenceObserved: string
  document: string // URL for PDF upload
  photo: string // URL for photo upload
  reference: string
  issuer: string
  presentationOrStartDate: string // dd/mm/yyyy format
  expirationDate: string // dd/mm/yyyy format
  observations: string
  itemId: string // Reference to the template item
}

export default function NewInspectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [showEvidenceForm, setShowEvidenceForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [evidenceFormData, setEvidenceFormData] = useState({
    installation: '',
    documentaryEvidenceObserved: '',
    document: '',
    photo: '',
    reference: '',
    issuer: '',
    presentationOrStartDate: '',
    expirationDate: '',
    observations: ''
  })
  const [formData, setFormData] = useState({
    // General Data
    adminTitleCode: '',
    legalName: '',
    tradeName: '',
    titleObject: '',
    adminTitleType: '',
    titleStartDate: '',
    titleEndDate: '',
    responsibleName: '',
    // Follow-up Data
    contactPerson: '',
    address: '',
    phone: '',
    email: '',
    followedBy: '',
    followUpDate: '',
    sector: '',
    headcount: 0,
    templateId: '',
    performedBy: '',
  })

  // Extract URL parameters
  const templateId = searchParams.get('templateId')
  const concesionId = searchParams.get('concesionId')
  const concesionName = searchParams.get('concesionName')
  const concesionCode = searchParams.get('concesionCode')
  const inspectionId = searchParams.get('inspectionId')
  const mode = searchParams.get('mode') // 'edit' or null (create mode)
  const isEditMode = mode === 'edit' && inspectionId

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateItemCompliance = (itemId: string, compliance: 'compliant' | 'nonCompliant' | 'n/a') => {
    setTemplateItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, compliance } : item
    ))
  }

  const addNewItem = () => {
    const newItem: TemplateItem = {
      id: `custom-${Date.now()}`,
      name: '',
      type: 'requirement',
      description: '',
      compliance: 'n/a'
    }
    setTemplateItems(prev => [...prev, newItem])
  }

  const updateItemName = (itemId: string, name: string) => {
    setTemplateItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, name } : item
    ))
  }

  const updateEvidenceFormData = (field: string, value: string) => {
    setEvidenceFormData(prev => ({ ...prev, [field]: value }))
  }

  const addEvidence = () => {
    if (!selectedItemId) return
    
    const newEvidence: Evidence = {
      id: `evidence-${Date.now()}`,
      ...evidenceFormData,
      itemId: selectedItemId
    }
    
    setEvidences(prev => [...prev, newEvidence])
    setEvidenceFormData({
      installation: '',
      documentaryEvidenceObserved: '',
      document: '',
      photo: '',
      reference: '',
      issuer: '',
      presentationOrStartDate: '',
      expirationDate: '',
      observations: ''
    })
    setShowEvidenceForm(false)
  }

  const saveInspection = async () => {
    if ((!templateId || !concesionId || !selectedTemplate) && !isEditMode) {
      console.error('Missing required data for saving inspection')
      return
    }

    setSaving(true)
    
    try {
      let currentInspectionId = inspectionId

      if (isEditMode && inspectionId) {
        // Update existing inspection
        const inspectionData = {
          updatedAt: new Date().toISOString(),
          formData: formData
        }

        await setDoc(doc(db, 'inspections', inspectionId), inspectionData, { merge: true })
        console.log('Inspection updated with ID:', inspectionId)
      } else {
        // Create new inspection
        const inspectionData = {
          templateId: templateId,
          templateName: selectedTemplate?.name || 'Unknown Template',
          concesionId: concesionId,
          concesionName: concesionName,
          concesionCode: concesionCode,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          formData: formData
        }

        const inspectionRef = await addDoc(collection(db, 'inspections'), inspectionData)
        currentInspectionId = inspectionRef.id
        console.log('Inspection created with ID:', currentInspectionId)
      }

      // Save each inspection item as a subcollection
      if (currentInspectionId) {
        for (const item of templateItems) {
          const itemData = {
            name: item.name,
            type: item.type,
            description: item.description || '',
            compliance: item.compliance,
            templateItemId: item.id,
            createdAt: new Date().toISOString()
          }

          const itemRef = await addDoc(collection(db, 'inspections', currentInspectionId, 'items'), itemData)
          const itemId = itemRef.id
          
          console.log('Item saved with ID:', itemId)

          // Save evidences for this item as a subcollection
          const itemEvidences = evidences.filter(evidence => evidence.itemId === item.id)
          
          for (const evidence of itemEvidences) {
            const evidenceData = {
              installation: evidence.installation,
              documentaryEvidenceObserved: evidence.documentaryEvidenceObserved,
              document: evidence.document,
              photo: evidence.photo,
              reference: evidence.reference,
              issuer: evidence.issuer,
              presentationOrStartDate: evidence.presentationOrStartDate,
              expirationDate: evidence.expirationDate,
              observations: evidence.observations,
              createdAt: new Date().toISOString()
            }

            await addDoc(collection(db, 'inspections', currentInspectionId, 'items', itemId, 'evidences'), evidenceData)
            console.log('Evidence saved for item:', itemId)
          }
        }
      }

      console.log('Inspection saved successfully!')
      
      // Navigate back to inspections list or show success message
      router.push('/concesiones')
      
    } catch (error) {
      console.error('Error saving inspection:', error)
      alert('Error al guardar la inspección. Por favor, inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Function to load existing inspection data
  const loadInspectionData = async (inspectionId: string) => {
    try {
      const inspectionDoc = await getDoc(doc(db, 'inspections', inspectionId))
      if (inspectionDoc.exists()) {
        const inspectionData = inspectionDoc.data()
        
        // Load form data
        if (inspectionData.formData) {
          setFormData(inspectionData.formData)
        }
        
        // Load inspection items
        const itemsSnapshot = await getDocs(collection(db, 'inspections', inspectionId, 'items'))
        const items: TemplateItem[] = []
        
        for (const itemDoc of itemsSnapshot.docs) {
          const itemData = itemDoc.data()
          items.push({
            id: itemData.templateItemId || itemDoc.id,
            name: itemData.name,
            type: itemData.type,
            description: itemData.description,
            compliance: itemData.compliance
          })
          
          // Load evidences for this item
          const evidencesSnapshot = await getDocs(collection(db, 'inspections', inspectionId, 'items', itemDoc.id, 'evidences'))
          evidencesSnapshot.forEach((evidenceDoc) => {
            const evidenceData = evidenceDoc.data()
            setEvidences(prev => [...prev, {
              id: evidenceDoc.id,
              ...evidenceData,
              itemId: itemData.templateItemId || itemDoc.id
            } as Evidence])
          })
        }
        
        setTemplateItems(items)
        
        // Load template info if available
        if (inspectionData.templateId) {
          const templateDoc = await getDoc(doc(db, 'templates', inspectionData.templateId))
          if (templateDoc.exists()) {
            setSelectedTemplate({ id: templateDoc.id, ...templateDoc.data() } as Template)
          }
        }
        
        return inspectionData
      }
    } catch (error) {
      console.error('Error loading inspection data:', error)
    }
    return null
  }

  // Load template and its items when component mounts
  useEffect(() => {
    const loadTemplateData = async () => {
      if (isEditMode && inspectionId) {
        // Load existing inspection data
        await loadInspectionData(inspectionId)
        setLoading(false)
        return
      }
      
      if (!templateId) {
        setLoading(false)
        return
      }

      try {
        console.log('Loading template with ID:', templateId)
        console.log('Template ID type:', typeof templateId)
        
        // Load template info
        const templateDoc = await getDoc(doc(db, 'templates', templateId))
        let items: TemplateItem[] = []
        
        if (templateDoc.exists()) {
          const templateData = templateDoc.data()
          setSelectedTemplate({ id: templateDoc.id, ...templateData } as Template)
          console.log('Template loaded successfully:', templateData)
          console.log('Template data keys:', Object.keys(templateData))
          
          // Check if items are stored as a field in the template document
          if (templateData.items) {
            console.log('Items field found:', templateData.items)
            console.log('Items type:', typeof templateData.items, 'Is array:', Array.isArray(templateData.items))
            
            if (Array.isArray(templateData.items)) {
              items = templateData.items.map((item: any, index: number) => ({
                id: item.id || `item-${index}`,
                name: item.name || item.title || `Item ${index + 1}`,
                type: item.type || 'requirement',
                description: item.description || '',
                compliance: 'n/a'
              }))
            } else {
              console.log('Items is not an array, trying to convert:', templateData.items)
              // Handle case where items might be an object
              if (typeof templateData.items === 'object') {
                items = Object.entries(templateData.items).map(([key, value]: [string, any], index) => ({
                  id: key,
                  name: value.name || value.title || `Item ${index + 1}`,
                  type: value.type || 'requirement',
                  description: value.description || '',
                  compliance: 'n/a'
                }))
              }
            }
          }
          
          // If no items found in template document, try subcollection
          if (items.length === 0) {
            console.log('No items in template document, trying subcollection...')
            const itemsSnapshot = await getDocs(collection(db, 'templates', templateId, 'items'))
            console.log('Subcollection query result size:', itemsSnapshot.size)
            
            itemsSnapshot.forEach((doc) => {
              console.log('Subcollection item found:', doc.id, doc.data())
              items.push({
                id: doc.id,
                name: doc.data().name || doc.data().title || doc.id,
                type: doc.data().type || 'requirement',
                description: doc.data().description || '',
                compliance: 'n/a'
              } as TemplateItem)
            })
          }
        } else {
          console.log('Template document does not exist in Firestore')
        }

        console.log('Final items array:', items)
        console.log('Final items count:', items.length)
        setTemplateItems(items)

        // Pre-fill form data with concession info
        if (concesionName && concesionCode) {
          setFormData(prev => ({
            ...prev,
            legalName: concesionName,
            tradeName: concesionName,
            adminTitleCode: concesionCode,
            templateId: templateId
          }))
        }
      } catch (error) {
        console.error('Error loading template data:', error)
        // Set empty array on error
        setTemplateItems([])
      } finally {
        setLoading(false)
      }
    }

    loadTemplateData()
  }, [templateId, concesionName, concesionCode, isEditMode, inspectionId])

  const renderConcessionCard = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Datos de la Concesión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Data Column */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Datos de Contacto</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Razón Social</label>
                <p className="text-sm text-gray-900">{formData.legalName || concesionName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre Comercial</label>
                <p className="text-sm text-gray-900">{formData.tradeName || concesionName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Código Título</label>
                <p className="text-sm text-gray-900">{formData.adminTitleCode || concesionCode || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-sm text-gray-900">{formData.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{formData.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Follow-up Data Column */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Datos de Seguimiento</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Persona de Contacto</label>
                <p className="text-sm text-gray-900">{formData.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Responsable</label>
                <p className="text-sm text-gray-900">{formData.responsibleName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Seguido por</label>
                <p className="text-sm text-gray-900">{formData.followedBy || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Seguimiento</label>
                <p className="text-sm text-gray-900">{formData.followUpDate || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Realizado por</label>
                <p className="text-sm text-gray-900">{formData.performedBy || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Editar Inspección' : 'Nueva Inspección'}
        </h1>
      </div>

      {/* Concession Data Card */}
      {renderConcessionCard()}

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Template Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedTemplate ? selectedTemplate.name : 'Items de la Plantilla'}
            </h2>
            <Button onClick={addNewItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Item
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando items de la plantilla...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templateItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedItemId === item.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div className="mb-2">
                    {item.id.startsWith('custom-') ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateItemName(item.id, e.target.value)}
                        placeholder="Nombre del item"
                        className="font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-semibold">{item.name}</h3>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={item.compliance === 'compliant' ? 'default' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateItemCompliance(item.id, 'compliant')
                      }}
                    >
                      Conforme
                    </Button>
                    <Button
                      variant={item.compliance === 'nonCompliant' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateItemCompliance(item.id, 'nonCompliant')
                      }}
                    >
                      No Conforme
                    </Button>
                    <Button
                      variant={item.compliance === 'n/a' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateItemCompliance(item.id, 'n/a')
                      }}
                    >
                      N/A
                    </Button>
                  </div>
                </div>
              ))}
              {templateItems.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay items en la plantilla</p>
                  <Button onClick={addNewItem} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Primer Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Evidence */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Evidencias</h2>
            {selectedItemId && (
              <Button 
                onClick={() => setShowEvidenceForm(true)} 
                variant="outline" 
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Evidencia
              </Button>
            )}
          </div>
          
          {!selectedItemId ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Selecciona un item para ver sus evidencias</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evidences
                .filter(evidence => evidence.itemId === selectedItemId)
                .map((evidence) => (
                  <div key={evidence.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{evidence.installation}</h4>
                    <p className="text-sm text-gray-600 mb-2">{evidence.documentaryEvidenceObserved}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div><strong>Referencia:</strong> {evidence.reference}</div>
                      <div><strong>Emisor:</strong> {evidence.issuer}</div>
                      <div><strong>Fecha inicio:</strong> {evidence.presentationOrStartDate}</div>
                      <div><strong>Fecha caducidad:</strong> {evidence.expirationDate}</div>
                    </div>
                    {evidence.observations && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Observaciones:</strong> {evidence.observations}
                      </p>
                    )}
                  </div>
                ))}
              
              {evidences.filter(evidence => evidence.itemId === selectedItemId).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay evidencias para este item</p>
                  <Button onClick={() => setShowEvidenceForm(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Primera Evidencia
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={saveInspection}
          disabled={saving || templateItems.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : (isEditMode ? 'Actualizar Inspección' : 'Guardar Inspección')}
        </Button>
      </div>

      {/* Evidence Form Modal */}
      {showEvidenceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Añadir Evidencia</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowEvidenceForm(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instalación *</label>
                  <Input
                    value={evidenceFormData.installation}
                    onChange={(e) => updateEvidenceFormData('installation', e.target.value)}
                    placeholder="Nombre de la instalación"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Referencia</label>
                  <Input
                    value={evidenceFormData.reference}
                    onChange={(e) => updateEvidenceFormData('reference', e.target.value)}
                    placeholder="Referencia del documento"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Evidencia Documental Observada *</label>
                <Input
                  value={evidenceFormData.documentaryEvidenceObserved}
                  onChange={(e) => updateEvidenceFormData('documentaryEvidenceObserved', e.target.value)}
                  placeholder="Descripción de la evidencia observada"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Emisor</label>
                  <Input
                    value={evidenceFormData.issuer}
                    onChange={(e) => updateEvidenceFormData('issuer', e.target.value)}
                    placeholder="Entidad emisora"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Presentación/Inicio</label>
                  <Input
                    type="date"
                    value={evidenceFormData.presentationOrStartDate}
                    onChange={(e) => updateEvidenceFormData('presentationOrStartDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Caducidad</label>
                  <Input
                    type="date"
                    value={evidenceFormData.expirationDate}
                    onChange={(e) => updateEvidenceFormData('expirationDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Documento (PDF)</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      // TODO: Handle file upload
                      console.log('PDF file selected:', e.target.files?.[0])
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Foto</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    // TODO: Handle file upload
                    console.log('Image file selected:', e.target.files?.[0])
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Observaciones</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={evidenceFormData.observations}
                  onChange={(e) => updateEvidenceFormData('observations', e.target.value)}
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEvidenceForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={addEvidence}
                disabled={!evidenceFormData.installation || !evidenceFormData.documentaryEvidenceObserved}
              >
                Añadir Evidencia
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
