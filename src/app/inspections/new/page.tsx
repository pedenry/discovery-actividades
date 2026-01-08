'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Save, Plus, ChevronDown, ChevronRight, Building2, FileText, User, Phone, Mail, MapPin, Calendar, Briefcase } from 'lucide-react'

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

function NewInspectionPageContent() {
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
  const [isConcessionExpanded, setIsConcessionExpanded] = useState(true)
  const [titularData, setTitularData] = useState<any>(null)
  const [concesionData, setConcesionData] = useState<any>(null)
  const [actividadData, setActividadData] = useState<any>(null)
  const [seguimientoData, setSeguimientoData] = useState<any>(null)
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
  const actividadId = searchParams.get('actividadId')
  const actividadNombre = searchParams.get('actividadNombre')
  const inspectionId = searchParams.get('inspectionId')
  const mode = searchParams.get('mode') // 'edit' or null (create mode)
  // Modo edición si viene con inspectionId (ya sea explícito o desde realizar inspección programada)
  const isEditMode = !!inspectionId

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
    if ((!templateId || !actividadId || !selectedTemplate) && !isEditMode) {
      console.error('Missing required data for saving inspection')
      return
    }

    setSaving(true)
    
    try {
      // Check if all items are compliant or N/A (favorable) vs any non-compliant (desfavorable)
      const allFavorable = templateItems.every(item => 
        item.compliance === 'compliant' || item.compliance === 'n/a'
      )
      const resultado = allFavorable ? 'Favorable' : 'No Favorable'
      const estado = allFavorable ? 'favorable' : 'desfavorable'

      let currentInspectionId = inspectionId

      if (isEditMode && inspectionId) {
        // Update existing inspection
        const inspectionData = {
          updatedAt: new Date().toISOString(),
          formData: formData,
          resultado: resultado,
          estado: estado
        }

        await setDoc(doc(db, 'inspections', inspectionId), inspectionData, { merge: true })
        console.log('Inspection updated with ID:', inspectionId)
      } else {
        // Create new inspection (asociada solo a actividad)
        const inspectionData = {
          templateId: templateId,
          templateName: selectedTemplate?.name || 'Unknown Template',
          actividadId: actividadId,
          actividadNombre: actividadNombre,
          titularNombre: concesionName,
          resultado: resultado,
          estado: estado,
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          formData: formData,
          isNew: true
        }

        const inspectionRef = await addDoc(collection(db, 'inspections'), inspectionData)
        currentInspectionId = inspectionRef.id
        console.log('Inspection created with ID:', currentInspectionId)
      }

      // Save each inspection item as a subcollection
      if (currentInspectionId) {
        // En modo edición, primero eliminar items existentes para evitar duplicados
        if (isEditMode) {
          const existingItemsSnapshot = await getDocs(collection(db, 'inspections', currentInspectionId, 'items'))
          for (const itemDoc of existingItemsSnapshot.docs) {
            // Eliminar evidencias del item
            const evidencesSnapshot = await getDocs(collection(db, 'inspections', currentInspectionId, 'items', itemDoc.id, 'evidences'))
            for (const evidenceDoc of evidencesSnapshot.docs) {
              await deleteDoc(doc(db, 'inspections', currentInspectionId, 'items', itemDoc.id, 'evidences', evidenceDoc.id))
            }
            // Eliminar el item
            await deleteDoc(doc(db, 'inspections', currentInspectionId, 'items', itemDoc.id))
          }
          console.log('Deleted existing items before saving new ones')
        }
        
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
      
      // Navigate to Seguimientos PVA with seguimientos tab
      router.push(`/seguimientos-pva?tab=seguimientos&newInspection=${currentInspectionId}`)
      
    } catch (error) {
      console.error('Error saving inspection:', error)
      alert('Error al guardar la inspección. Por favor, inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Function to load related entity data (titular, concesion, actividad)
  const loadRelatedData = async (actId: string | null) => {
    if (!actId) return
    
    try {
      // Load actividad data
      const actividadDoc = await getDoc(doc(db, 'actividades', actId))
      if (actividadDoc.exists()) {
        const actData = actividadDoc.data()
        setActividadData({ id: actividadDoc.id, ...actData })
        
        let titularIdToLoad = actData.titularId
        
        // Load concesion if available
        if (actData.concesionId) {
          const concesionDoc = await getDoc(doc(db, 'concesiones', actData.concesionId))
          if (concesionDoc.exists()) {
            const concData = concesionDoc.data()
            setConcesionData({ id: concesionDoc.id, ...concData })
            
            // Si la concesión tiene titularId, usarlo para cargar el titular
            if (concData.titularId) {
              titularIdToLoad = concData.titularId
            }
          }
        }
        
        // Load titular (desde actividad o desde concesión)
        if (titularIdToLoad) {
          const titularDoc = await getDoc(doc(db, 'titulares', titularIdToLoad))
          if (titularDoc.exists()) {
            setTitularData({ id: titularDoc.id, ...titularDoc.data() })
          }
        }
        
        // Load seguimiento-pva para obtener persona de contacto
        const seguimientosQuery = await getDocs(collection(db, 'seguimientos-pva'))
        // Buscar por actividadId
        const seguimiento = seguimientosQuery.docs.find(doc => {
          const data = doc.data()
          return data.actividadId === actId
        })
        
        if (seguimiento) {
          const segData = seguimiento.data()
          console.log('Seguimiento encontrado:', segData)
          
          // Si tiene contactoId, cargar datos del contacto desde contactos-seguimientos
          if (segData.contactoId) {
            const contactoDoc = await getDoc(doc(db, 'contactos-seguimientos', segData.contactoId))
            if (contactoDoc.exists()) {
              const contactoData = contactoDoc.data()
              console.log('Contacto encontrado:', contactoData)
              setSeguimientoData({ 
                id: seguimiento.id, 
                ...segData,
                contactoNombre: contactoData.nombre,
                contactoTelefono: contactoData.telefono,
                contactoEmail: contactoData.email
              })
            } else {
              setSeguimientoData({ id: seguimiento.id, ...segData })
            }
          } else {
            setSeguimientoData({ id: seguimiento.id, ...segData })
          }
        } else {
          console.log('No se encontró seguimiento para actividadId:', actId)
        }
      }
    } catch (error) {
      console.error('Error loading related data:', error)
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
        
        // Load related entity data
        await loadRelatedData(inspectionData.actividadId || actividadId)
        
        // Load inspection items (if already filled)
        const itemsSnapshot = await getDocs(collection(db, 'inspections', inspectionId, 'items'))
        let items: TemplateItem[] = []
        const seenItemIds = new Set<string>()
        
        console.log('📦 Items in inspection:', itemsSnapshot.size)
        
        for (const itemDoc of itemsSnapshot.docs) {
          const itemData = itemDoc.data()
          const itemId = itemData.templateItemId || itemDoc.id
          
          // Evitar duplicados por templateItemId
          if (seenItemIds.has(itemId)) {
            console.log('⚠️ Skipping duplicate item:', itemId, itemData.name)
            continue
          }
          seenItemIds.add(itemId)
          
          items.push({
            id: itemId,
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
        
        // Get templateId from inspection data or URL params
        const inspTemplateId = inspectionData.templateId || templateId
        console.log('🔍 Template ID to load:', inspTemplateId)
        
        // Load template info
        if (inspTemplateId) {
          const templateDoc = await getDoc(doc(db, 'templates', inspTemplateId))
          console.log('📄 Template exists:', templateDoc.exists())
          
          if (templateDoc.exists()) {
            const templateData = templateDoc.data()
            console.log('📋 Template data keys:', Object.keys(templateData))
            console.log('📋 Template data:', templateData)
            setSelectedTemplate({ id: templateDoc.id, ...templateData } as Template)
            
            // If inspection has no items yet (programada), load from template
            if (items.length === 0) {
              console.log('⚠️ Inspection has no items, loading from template...')
              
              // Check if items are stored as a field in the template document
              if (templateData.items) {
                // Items stored as object/Record (key-value pairs)
                if (typeof templateData.items === 'object' && !Array.isArray(templateData.items)) {
                  console.log('✅ Found items object in template')
                  const itemsObj = templateData.items as Record<string, any>
                  items = Object.entries(itemsObj).map(([key, item]) => ({
                    id: key,
                    name: item.name || item.title || key,
                    type: item.type || 'requirement',
                    description: item.description || '',
                    compliance: 'n/a'
                  }))
                  // Sort by order if available
                  items.sort((a, b) => {
                    const orderA = itemsObj[a.id]?.order ?? 999
                    const orderB = itemsObj[b.id]?.order ?? 999
                    return orderA - orderB
                  })
                } else if (Array.isArray(templateData.items)) {
                  // Items stored as array
                  console.log('✅ Found items array in template:', templateData.items.length, 'items')
                  items = templateData.items.map((item: any, index: number) => ({
                    id: item.id || `item-${index}`,
                    name: item.name || item.title || `Item ${index + 1}`,
                    type: item.type || 'requirement',
                    description: item.description || '',
                    compliance: 'n/a'
                  }))
                }
              }
              
              // If no items in template document, try subcollection
              if (items.length === 0) {
                console.log('🔄 Trying subcollection...')
                const templateItemsSnapshot = await getDocs(collection(db, 'templates', inspTemplateId, 'items'))
                console.log('📦 Subcollection size:', templateItemsSnapshot.size)
                
                templateItemsSnapshot.forEach((doc) => {
                  items.push({
                    id: doc.id,
                    name: doc.data().name || doc.data().title || doc.id,
                    type: doc.data().type || 'requirement',
                    description: doc.data().description || '',
                    compliance: 'n/a'
                  } as TemplateItem)
                })
              }
              
              console.log('📊 Final items count:', items.length)
            }
          }
        } else {
          console.log('❌ No templateId found')
        }
        
        setTemplateItems(items)
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
        // Load related entity data (titular, concesion, actividad)
        await loadRelatedData(actividadId)
        
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
              // Handle case where items might be an object/Record
              if (typeof templateData.items === 'object') {
                const itemsObj = templateData.items as Record<string, any>
                items = Object.entries(itemsObj).map(([key, value]: [string, any]) => ({
                  id: key,
                  name: value.name || value.title || key,
                  type: value.type || 'requirement',
                  description: value.description || '',
                  compliance: 'n/a'
                }))
                // Sort by order if available
                items.sort((a, b) => {
                  const orderA = itemsObj[a.id]?.order ?? 999
                  const orderB = itemsObj[b.id]?.order ?? 999
                  return orderA - orderB
                })
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
    // Helper component for data items
    const DataItem = ({ icon: Icon, label, value, iconColor = "text-gray-400" }: { icon: any, label: string, value: string | undefined, iconColor?: string }) => (
      <div className="flex items-start gap-3 py-2">
        <Icon className={`w-4 h-4 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm text-gray-900 font-medium truncate">{value || 'No disponible'}</p>
        </div>
      </div>
    )

    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm overflow-hidden">
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all"
          onClick={() => setIsConcessionExpanded(!isConcessionExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Información de la Inspección</h2>
              <p className="text-sm text-gray-600">
                {titularData?.nombre || concesionName || 'Titular'} • {actividadData?.nombre || actividadNombre || 'Actividad'}
              </p>
            </div>
          </div>
          <div className={`p-1 rounded-full bg-white shadow-sm transition-transform ${isConcessionExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Expanded Content */}
        {isConcessionExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COLUMNA IZQUIERDA: Datos de la Concesión (con Titular dentro) */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-blue-900">Datos de la Concesión</h3>
                </div>
                <div className="space-y-1 divide-y divide-blue-100">
                  <DataItem 
                    icon={FileText} 
                    label="Objeto del Título" 
                    value={concesionData?.objetoTitulo}
                    iconColor="text-blue-500"
                  />
                  <DataItem 
                    icon={Briefcase} 
                    label="Tipo" 
                    value={concesionData?.tipo}
                    iconColor="text-blue-500"
                  />
                  <DataItem 
                    icon={MapPin} 
                    label="Puerto" 
                    value={concesionData?.puerto}
                    iconColor="text-blue-500"
                  />
                  <DataItem 
                    icon={Calendar} 
                    label="Vigencia" 
                    value={concesionData?.fechaInicio && concesionData?.fechaFin 
                      ? `${concesionData.fechaInicio} - ${concesionData.fechaFin}` 
                      : concesionData?.fechaInicio || concesionData?.fechaFin || 'No disponible'}
                    iconColor="text-blue-500"
                  />
                </div>

                {/* Datos del Titular - Dentro de Concesión */}
                <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-emerald-500 rounded-lg">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-emerald-900">Titular</h4>
                  </div>
                  <div className="space-y-1 divide-y divide-emerald-100">
                    <DataItem 
                      icon={Building2} 
                      label="Nombre" 
                      value={titularData?.nombre || concesionName}
                      iconColor="text-emerald-500"
                    />
                    {/* Campos personalizados del titular */}
                    {titularData?.customFields && Object.entries(titularData.customFields).map(([key, value]) => (
                      <DataItem 
                        key={key}
                        icon={FileText} 
                        label={key} 
                        value={value as string}
                        iconColor="text-emerald-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Actividad + Persona de Contacto */}
              <div className="space-y-6">
                {/* Datos de la Actividad */}
                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-purple-900">Datos de la Actividad</h3>
                  </div>
                  <div className="space-y-1 divide-y divide-purple-100">
                    <DataItem 
                      icon={Briefcase} 
                      label="Nombre" 
                      value={actividadData?.nombre || actividadNombre}
                      iconColor="text-purple-500"
                    />
                    <DataItem 
                      icon={FileText} 
                      label="PVA Asociado" 
                      value={actividadData?.pvaAsociadoNombre || actividadData?.pvaAsociado}
                      iconColor="text-purple-500"
                    />
                  </div>
                </div>

                {/* Persona de Contacto del Seguimiento */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-amber-900">Persona de Contacto</h3>
                  </div>
                  <div className="space-y-1 divide-y divide-amber-100">
                    <DataItem 
                      icon={User} 
                      label="Nombre" 
                      value={seguimientoData?.contactoNombre || 'No asignado'}
                      iconColor="text-amber-500"
                    />
                    <DataItem 
                      icon={Phone} 
                      label="Teléfono" 
                      value={seguimientoData?.contactoTelefono || 'No disponible'}
                      iconColor="text-amber-500"
                    />
                    <DataItem 
                      icon={Mail} 
                      label="Email" 
                      value={seguimientoData?.contactoEmail || 'No disponible'}
                      iconColor="text-amber-500"
                    />
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs with Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => router.push('/seguimientos-pva')}
            className="hover:text-gray-900 transition-colors"
          >
            Seguimientos PVA
          </button>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => router.push('/seguimientos-pva?tab=seguimientos')}
            className="hover:text-gray-900 transition-colors"
          >
            Seguimientos
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">
            {isEditMode ? 'Editar Inspección' : 'Nueva Inspección'}
          </span>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={saveInspection}
          disabled={saving || templateItems.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Inspección'}
        </Button>
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

export default function NewInspectionPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <NewInspectionPageContent />
    </Suspense>
  )
}
