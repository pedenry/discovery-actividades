'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Save, Plus, ChevronDown, ChevronRight, Building2, FileText, User, Phone, Mail, MapPin, Calendar, Briefcase, FileSearch, Trash2, Link2, Unlink, Check, Upload, MessageSquare } from 'lucide-react'

interface TemplateItem {
  id: string
  name: string
  type: string
  description?: string
  compliance: string
}

interface ComplianceState {
  id: string
  name: string
  value: string
  isDefault: boolean
  isApproved: boolean // true = azul (aprueba), false = rojo (no aprueba)
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
  // Campos de vinculación
  linkedToEvidenceId?: string // ID de la evidencia vinculada
  linkedToInspectionId?: string // ID de la inspección de la evidencia vinculada
  linkedToItemId?: string // ID del item de la evidencia vinculada
}

// Interfaz para evidencias disponibles para vincular (de otras inspecciones)
interface LinkedEvidenceInfo {
  evidenceId: string
  inspectionId: string
  itemId: string
  itemName: string
  evidenceName: string
  actividadName: string
  pvaName: string
  evidenceData: Evidence
}

// Interfaz para las etapas del estado de la inspección
interface InspectionStage {
  id: string
  name: string
  date: string
  file: string
  comments: string
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
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null)
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null)
  const [saving, setSaving] = useState(false)
  // Estados para vinculación de evidencias
  const [showLinkEvidenceModal, setShowLinkEvidenceModal] = useState(false)
  const [availableEvidencesForLink, setAvailableEvidencesForLink] = useState<LinkedEvidenceInfo[]>([])
  const [loadingAvailableEvidences, setLoadingAvailableEvidences] = useState(false)
  const [selectedEvidenceToLink, setSelectedEvidenceToLink] = useState<LinkedEvidenceInfo | null>(null)
  const [linkedEvidence, setLinkedEvidence] = useState<LinkedEvidenceInfo | null>(null)
  const [showLinkedChangeWarning, setShowLinkedChangeWarning] = useState(false)
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
  
  // Estado de la inspección (wizard de etapas)
  const [inspectionStages, setInspectionStages] = useState<InspectionStage[]>([
    { id: 'inspeccion', name: 'Inspección', date: '', file: '', comments: '' },
    { id: 'requerimiento', name: 'Requerimiento', date: '', file: '', comments: '' },
    { id: 'reiteracion', name: 'Reiteración', date: '', file: '', comments: '' }
  ])
  
  // Estados de cumplimiento dinámicos
  const defaultComplianceStates: ComplianceState[] = [
    { id: 'compliant', name: 'Conforme', value: 'compliant', isDefault: true, isApproved: true },
    { id: 'nonCompliant', name: 'No Conforme', value: 'nonCompliant', isDefault: true, isApproved: false },
    { id: 'n/a', name: 'N/A', value: 'n/a', isDefault: true, isApproved: true }
  ]
  const [complianceStates, setComplianceStates] = useState<ComplianceState[]>(defaultComplianceStates)
  const [showAddStateModal, setShowAddStateModal] = useState(false)
  const [newStateName, setNewStateName] = useState('')
  const [newStateApproves, setNewStateApproves] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; stateId: string } | null>(null)
  const [editingState, setEditingState] = useState<ComplianceState | null>(null)
  
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

  const updateItemCompliance = (itemId: string, compliance: string) => {
    setTemplateItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, compliance } : item
    ))
  }

  // Actualizar etapa de inspección
  const updateInspectionStage = (stageId: string, field: 'date' | 'file' | 'comments', value: string) => {
    setInspectionStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, [field]: value } : stage
    ))
  }

  // Verificar si una etapa tiene datos
  const stageHasData = (stage: InspectionStage) => {
    return stage.date !== '' || stage.file !== '' || stage.comments !== ''
  }

  // Cargar estados de cumplimiento personalizados desde Firebase
  const loadCustomComplianceStates = async () => {
    try {
      const statesSnapshot = await getDocs(collection(db, 'compliance-states'))
      const customStates: ComplianceState[] = []
      statesSnapshot.forEach((doc) => {
        const data = doc.data()
        customStates.push({
          id: doc.id,
          name: data.name,
          value: data.value,
          isDefault: false,
          isApproved: data.isApproved ?? true
        })
      })
      setComplianceStates([...defaultComplianceStates, ...customStates])
    } catch (error) {
      console.error('Error loading custom compliance states:', error)
    }
  }

  // Añadir nuevo estado de cumplimiento
  const addComplianceState = async () => {
    if (!newStateName.trim()) return
    
    const value = newStateName.toLowerCase().replace(/\s+/g, '-')
    const newState: Omit<ComplianceState, 'id'> = {
      name: newStateName.trim(),
      value: value,
      isDefault: false,
      isApproved: newStateApproves
    }
    
    try {
      const docRef = await addDoc(collection(db, 'compliance-states'), newState)
      setComplianceStates(prev => [...prev, { ...newState, id: docRef.id }])
      setNewStateName('')
      setNewStateApproves(true)
      setShowAddStateModal(false)
    } catch (error) {
      console.error('Error adding compliance state:', error)
      alert('Error al añadir el estado')
    }
  }

  // Editar estado de cumplimiento personalizado
  const updateComplianceState = async () => {
    if (!editingState || !editingState.name.trim()) return
    
    try {
      await setDoc(doc(db, 'compliance-states', editingState.id), {
        name: editingState.name,
        value: editingState.value,
        isApproved: editingState.isApproved
      })
      setComplianceStates(prev => prev.map(s => 
        s.id === editingState.id ? editingState : s
      ))
      setEditingState(null)
      setContextMenu(null)
    } catch (error) {
      console.error('Error updating compliance state:', error)
      alert('Error al actualizar el estado')
    }
  }

  // Eliminar estado de cumplimiento personalizado
  const deleteComplianceState = async (stateId: string) => {
    const state = complianceStates.find(s => s.id === stateId)
    if (!state || state.isDefault) return
    
    try {
      await deleteDoc(doc(db, 'compliance-states', stateId))
      setComplianceStates(prev => prev.filter(s => s.id !== stateId))
      // Resetear items que tenían este estado a 'n/a'
      setTemplateItems(prev => prev.map(item => 
        item.compliance === state.value ? { ...item, compliance: 'n/a' } : item
      ))
      setContextMenu(null)
    } catch (error) {
      console.error('Error deleting compliance state:', error)
      alert('Error al eliminar el estado')
    }
  }

  // Manejar click derecho en estado
  const handleStateContextMenu = (e: React.MouseEvent, stateId: string) => {
    const state = complianceStates.find(s => s.id === stateId)
    if (!state || state.isDefault) return
    
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, stateId })
  }

  // Cerrar menú contextual al hacer click fuera
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

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

  // Función para verificar si se debe mostrar el aviso de cambio en evidencia vinculada
  const handleSaveEvidence = () => {
    if (!selectedItemId) return
    
    // Si estamos editando una evidencia vinculada, mostrar aviso
    if (editingEvidence && editingEvidence.linkedToEvidenceId) {
      setShowLinkedChangeWarning(true)
      return
    }
    
    addEvidence()
  }

  const addEvidence = async () => {
    if (!selectedItemId) return
    
    if (editingEvidence) {
      // Actualizar evidencia existente
      const updatedEvidence = { ...editingEvidence, ...evidenceFormData }
      setEvidences(prev => prev.map(e => 
        e.id === editingEvidence.id 
          ? updatedEvidence
          : e
      ))
      
      // Si la evidencia está vinculada, actualizar también la evidencia vinculada en Firestore
      if (editingEvidence.linkedToEvidenceId && editingEvidence.linkedToInspectionId && editingEvidence.linkedToItemId) {
        try {
          // Obtener el documento de la evidencia vinculada para actualizarlo
          const linkedItemsSnapshot = await getDocs(collection(db, 'inspections', editingEvidence.linkedToInspectionId, 'items'))
          for (const itemDoc of linkedItemsSnapshot.docs) {
            const evidencesSnapshot = await getDocs(collection(db, 'inspections', editingEvidence.linkedToInspectionId, 'items', itemDoc.id, 'evidences'))
            for (const evidenceDoc of evidencesSnapshot.docs) {
              if (evidenceDoc.id === editingEvidence.linkedToEvidenceId) {
                // Actualizar la evidencia vinculada con los nuevos datos
                await setDoc(doc(db, 'inspections', editingEvidence.linkedToInspectionId, 'items', itemDoc.id, 'evidences', evidenceDoc.id), {
                  ...evidenceDoc.data(),
                  installation: evidenceFormData.installation,
                  documentaryEvidenceObserved: evidenceFormData.documentaryEvidenceObserved,
                  document: evidenceFormData.document,
                  photo: evidenceFormData.photo,
                  reference: evidenceFormData.reference,
                  issuer: evidenceFormData.issuer,
                  presentationOrStartDate: evidenceFormData.presentationOrStartDate,
                  expirationDate: evidenceFormData.expirationDate,
                  observations: evidenceFormData.observations,
                  updatedAt: new Date().toISOString()
                })
                console.log('Linked evidence updated:', evidenceDoc.id)
                break
              }
            }
          }
        } catch (error) {
          console.error('Error updating linked evidence:', error)
        }
      }
      
      setEditingEvidence(null)
    } else {
      // Crear nueva evidencia
      const newEvidenceId = `evidence-${Date.now()}`
      const newEvidence: Evidence = {
        id: newEvidenceId,
        ...evidenceFormData,
        itemId: selectedItemId,
        // Incluir referencia de vinculación si existe
        linkedToEvidenceId: linkedEvidence?.evidenceId,
        linkedToInspectionId: linkedEvidence?.inspectionId,
        linkedToItemId: linkedEvidence?.itemId
      }
      
      // Si hay vinculación, también actualizar la evidencia origen localmente para mostrar el icono
      if (linkedEvidence) {
        // Buscar si la evidencia origen está en el estado local (misma inspección)
        setEvidences(prev => {
          const updated = prev.map(e => {
            // Si es la evidencia origen, actualizarla con la referencia bidireccional
            if (e.id === linkedEvidence.evidenceId || 
                (linkedEvidence.inspectionId === inspectionId && e.itemId === linkedEvidence.itemId)) {
              return {
                ...e,
                linkedToEvidenceId: newEvidenceId,
                linkedToInspectionId: inspectionId || 'current',
                linkedToItemId: selectedItemId
              }
            }
            return e
          })
          return [...updated, newEvidence]
        })
      } else {
        setEvidences(prev => [...prev, newEvidence])
      }
    }
    
    setLinkedEvidence(null)
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

  const openEditEvidence = (evidence: Evidence) => {
    setEvidenceFormData({
      installation: evidence.installation,
      documentaryEvidenceObserved: evidence.documentaryEvidenceObserved,
      document: evidence.document,
      photo: evidence.photo,
      reference: evidence.reference,
      issuer: evidence.issuer,
      presentationOrStartDate: evidence.presentationOrStartDate,
      expirationDate: evidence.expirationDate,
      observations: evidence.observations
    })
    setEditingEvidence(evidence)
    setShowEvidenceForm(true)
  }

  const confirmDeleteEvidence = () => {
    if (!evidenceToDelete) return
    setEvidences(prev => prev.filter(e => e.id !== evidenceToDelete.id))
    setEvidenceToDelete(null)
    // Si estábamos editando esta evidencia, cerrar el modal
    if (editingEvidence?.id === evidenceToDelete.id) {
      setShowEvidenceForm(false)
      setEditingEvidence(null)
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
    }
  }

  // Cargar evidencias disponibles para vincular de la misma concesión
  const loadAvailableEvidencesForLink = async () => {
    if (!concesionData?.id) return
    
    setLoadingAvailableEvidences(true)
    try {
      const evidencesForLink: LinkedEvidenceInfo[] = []
      
      // Obtener todas las actividades de esta concesión
      const actividadesSnapshot = await getDocs(collection(db, 'actividades'))
      const actividadesOfConcesion = actividadesSnapshot.docs.filter(doc => 
        doc.data().concesionId === concesionData.id
      )
      
      for (const actividadDoc of actividadesOfConcesion) {
        const actividadInfo = actividadDoc.data()
        
        // Obtener inspecciones de esta actividad
        const inspectionsSnapshot = await getDocs(collection(db, 'inspections'))
        const inspectionsOfActividad = inspectionsSnapshot.docs.filter(doc => 
          doc.data().actividadId === actividadDoc.id
        )
        
        for (const inspectionDoc of inspectionsOfActividad) {
          const isCurrentInspection = inspectionDoc.id === inspectionId
          
          // Obtener items de esta inspección
          const itemsSnapshot = await getDocs(collection(db, 'inspections', inspectionDoc.id, 'items'))
          
          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data()
            
            // Si es la inspección actual, excluir las evidencias del item seleccionado actualmente
            // Para permitir vincular con evidencias de otros items de la misma inspección
            if (isCurrentInspection && itemData.templateItemId === selectedItemId) continue
            
            // Obtener evidencias de este item
            const evidencesSnapshot = await getDocs(collection(db, 'inspections', inspectionDoc.id, 'items', itemDoc.id, 'evidences'))
            
            for (const evidenceDoc of evidencesSnapshot.docs) {
              const evidenceData = evidenceDoc.data()
              
              // No mostrar evidencias que ya están vinculadas a algo (para evitar cadenas)
              // Y tampoco mostrar evidencias locales no guardadas
              
              evidencesForLink.push({
                evidenceId: evidenceDoc.id,
                inspectionId: inspectionDoc.id,
                itemId: itemDoc.id,
                itemName: itemData.name || 'Sin nombre',
                evidenceName: evidenceData.installation || 'Sin nombre',
                actividadName: actividadInfo.nombre || actividadInfo.name || 'Actividad',
                pvaName: actividadInfo.pvaAsociado || actividadInfo.pva || 'PVA',
                evidenceData: {
                  id: evidenceDoc.id,
                  ...evidenceData,
                  itemId: itemDoc.id
                } as Evidence
              })
            }
          }
        }
      }
      
      setAvailableEvidencesForLink(evidencesForLink)
    } catch (error) {
      console.error('Error loading available evidences for link:', error)
    } finally {
      setLoadingAvailableEvidences(false)
    }
  }

  // Abrir modal de vincular evidencia
  const openLinkEvidenceModal = () => {
    loadAvailableEvidencesForLink()
    setShowLinkEvidenceModal(true)
  }

  // Vincular a la evidencia seleccionada
  const linkToEvidence = (evidenceInfo: LinkedEvidenceInfo) => {
    // Rellenar el formulario con los datos de la evidencia
    setEvidenceFormData({
      installation: evidenceInfo.evidenceData.installation,
      documentaryEvidenceObserved: evidenceInfo.evidenceData.documentaryEvidenceObserved,
      document: evidenceInfo.evidenceData.document,
      photo: evidenceInfo.evidenceData.photo,
      reference: evidenceInfo.evidenceData.reference,
      issuer: evidenceInfo.evidenceData.issuer,
      presentationOrStartDate: evidenceInfo.evidenceData.presentationOrStartDate,
      expirationDate: evidenceInfo.evidenceData.expirationDate,
      observations: evidenceInfo.evidenceData.observations
    })
    setLinkedEvidence(evidenceInfo)
    setSelectedEvidenceToLink(null)
    setShowLinkEvidenceModal(false)
  }

  // Desvincular evidencia
  const unlinkEvidence = () => {
    setLinkedEvidence(null)
  }

  const saveInspection = async () => {
    if ((!templateId || !actividadId || !selectedTemplate) && !isEditMode) {
      console.error('Missing required data for saving inspection')
      return
    }

    setSaving(true)
    
    try {
      // Check if all items have approved states (favorable) vs any non-approved (desfavorable)
      const allFavorable = templateItems.every(item => {
        const state = complianceStates.find(s => s.value === item.compliance)
        return state?.isApproved ?? false
      })
      const resultado = allFavorable ? 'Favorable' : 'No Favorable'
      const estado = allFavorable ? 'favorable' : 'desfavorable'

      let currentInspectionId = inspectionId

      // Determinar la etapa actual basada en las etapas rellenadas
      const getCurrentStage = () => {
        // Verificar de la más avanzada a la menos avanzada
        const reiteracionStage = inspectionStages.find(s => s.id === 'reiteracion')
        const requerimientoStage = inspectionStages.find(s => s.id === 'requerimiento')
        const inspeccionStage = inspectionStages.find(s => s.id === 'inspeccion')
        
        if (reiteracionStage && (reiteracionStage.date || reiteracionStage.file || reiteracionStage.comments)) {
          return 'Reiteración'
        }
        if (requerimientoStage && (requerimientoStage.date || requerimientoStage.file || requerimientoStage.comments)) {
          return 'Requerimiento'
        }
        if (inspeccionStage && (inspeccionStage.date || inspeccionStage.file || inspeccionStage.comments || seguimientoData?.fechaProgramada)) {
          return 'Inspección'
        }
        return null
      }
      
      const currentStage = getCurrentStage()

      if (isEditMode && inspectionId) {
        // Update existing inspection
        const inspectionData = {
          updatedAt: new Date().toISOString(),
          formData: formData,
          resultado: resultado,
          estado: estado,
          etapas: inspectionStages,
          etapaActual: currentStage
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
          isNew: true,
          etapas: inspectionStages,
          etapaActual: currentStage
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
            const evidenceData: any = {
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
            
            // Incluir campos de vinculación si existen
            if (evidence.linkedToEvidenceId) {
              evidenceData.linkedToEvidenceId = evidence.linkedToEvidenceId
              evidenceData.linkedToInspectionId = evidence.linkedToInspectionId
              evidenceData.linkedToItemId = evidence.linkedToItemId
            }

            const savedEvidenceRef = await addDoc(collection(db, 'inspections', currentInspectionId, 'items', itemId, 'evidences'), evidenceData)
            console.log('Evidence saved for item:', itemId, 'with ID:', savedEvidenceRef.id)
            
            // Si esta evidencia tiene vinculación, actualizar la evidencia vinculada con el ID real y el itemId real
            if (evidence.linkedToEvidenceId && evidence.linkedToInspectionId) {
              try {
                const linkedItemsSnapshot = await getDocs(collection(db, 'inspections', evidence.linkedToInspectionId, 'items'))
                for (const linkedItemDoc of linkedItemsSnapshot.docs) {
                  const linkedEvidencesSnapshot = await getDocs(collection(db, 'inspections', evidence.linkedToInspectionId, 'items', linkedItemDoc.id, 'evidences'))
                  for (const linkedEvidenceDoc of linkedEvidencesSnapshot.docs) {
                    if (linkedEvidenceDoc.id === evidence.linkedToEvidenceId) {
                      // Actualizar con el ID real de la nueva evidencia y el itemId real
                      await setDoc(doc(db, 'inspections', evidence.linkedToInspectionId, 'items', linkedItemDoc.id, 'evidences', linkedEvidenceDoc.id), {
                        ...linkedEvidenceDoc.data(),
                        linkedToEvidenceId: savedEvidenceRef.id,
                        linkedToInspectionId: currentInspectionId,
                        linkedToItemId: itemId,
                        updatedAt: new Date().toISOString()
                      })
                      console.log('Bidirectional link updated with real IDs')
                      break
                    }
                  }
                }
              } catch (error) {
                console.error('Error updating bidirectional link:', error)
              }
            }
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
        
        // Load inspection stages if they exist
        if (inspectionData.etapas && Array.isArray(inspectionData.etapas)) {
          setInspectionStages(inspectionData.etapas)
        }
        
        // Load related entity data
        await loadRelatedData(inspectionData.actividadId || actividadId)
        
        // Load inspection items (if already filled)
        const itemsSnapshot = await getDocs(collection(db, 'inspections', inspectionId, 'items'))
        let items: TemplateItem[] = []
        let loadedEvidences: Evidence[] = []
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
            loadedEvidences.push({
              id: evidenceDoc.id,
              ...evidenceData,
              itemId: itemData.templateItemId || itemDoc.id
            } as Evidence)
          })
        }
        
        // Reemplazar evidencias en lugar de acumular
        setEvidences(loadedEvidences)
        
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
      // Cargar estados de cumplimiento personalizados
      await loadCustomComplianceStates()
      
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

            {/* Estado de la Inspección - Wizard Horizontal */}
            <div className="mt-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-slate-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Estado de la Inspección</h3>
              </div>
              
              <div className="space-y-4">
                {inspectionStages.map((stage, index) => {
                  const isFirst = index === 0
                  const isLast = index === inspectionStages.length - 1
                  // Para la primera etapa, considerar también la fecha programada del seguimiento
                  const effectiveDate = stage.date || (isFirst && seguimientoData?.fechaProgramada ? seguimientoData.fechaProgramada : '')
                  const hasData = stage.date !== '' || stage.file !== '' || stage.comments !== '' || (isFirst && seguimientoData?.fechaProgramada)
                  
                  return (
                    <div key={stage.id} className="relative">
                      {/* Línea vertical conectora */}
                      {!isLast && (
                        <div className="absolute left-4 top-8 w-0.5 h-12 bg-slate-200" />
                      )}
                      
                      <div className="flex items-start gap-4">
                        {/* Círculo del wizard */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                            hasData 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}>
                            {hasData ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Nombre de la etapa */}
                        <div className="w-28 flex-shrink-0 pt-1">
                          <h4 className={`font-medium text-sm ${hasData ? 'text-blue-700' : 'text-slate-700'}`}>
                            {stage.name}
                          </h4>
                        </div>
                        
                        {/* Campos en la misma fila */}
                        <div className="flex-1 flex items-center gap-4">
                          {/* Campo de fecha */}
                          <div className="flex items-center gap-2 flex-1">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <Input
                              type="date"
                              value={effectiveDate}
                              onChange={(e) => updateInspectionStage(stage.id, 'date', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Fecha"
                            />
                          </div>
                          
                          {/* Campo de archivo */}
                          <div className="flex items-center gap-2 flex-1">
                            <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <Input
                              type="file"
                              onChange={(e) => {
                                const fileName = e.target.files?.[0]?.name || ''
                                updateInspectionStage(stage.id, 'file', fileName)
                              }}
                              className="h-8 text-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            />
                          </div>
                          
                          {/* Campo de comentarios */}
                          <div className="flex items-center gap-2 flex-1">
                            <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <Input
                              value={stage.comments}
                              onChange={(e) => updateInspectionStage(stage.id, 'comments', e.target.value)}
                              placeholder="Comentarios..."
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                  {/* Chips de evidencias asociadas */}
                  {evidences.filter(e => e.itemId === item.id).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {evidences.filter(e => e.itemId === item.id).map((evidence) => (
                        <span 
                          key={evidence.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                          title={evidence.documentaryEvidenceObserved}
                        >
                          <FileSearch className="w-3 h-3" />
                          {evidence.installation}
                          {evidence.linkedToEvidenceId && (
                            <Link2 className="w-3 h-3 text-blue-500" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}
                  <div className="flex gap-2 flex-wrap items-center">
                    {complianceStates.map((state) => {
                      const isSelected = item.compliance === state.value
                      let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline'
                      if (isSelected) {
                        if (state.value === 'n/a') {
                          variant = 'secondary'
                        } else if (state.isApproved) {
                          variant = 'default'
                        } else {
                          variant = 'destructive'
                        }
                      }
                      return (
                        <Button
                          key={state.id}
                          variant={variant}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateItemCompliance(item.id, state.value)
                          }}
                          onContextMenu={(e) => handleStateContextMenu(e, state.id)}
                          className={!state.isDefault ? 'border-dashed' : ''}
                        >
                          {state.name}
                        </Button>
                      )
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddStateModal(true)
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      title="Añadir nuevo estado"
                    >
                      <Plus className="w-4 h-4" />
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
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileSearch className="w-5 h-5" />
              Evidencias
            </h2>
            {selectedItemId && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowEvidenceForm(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Evidencia
                </Button>
              </div>
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
                  <div 
                    key={evidence.id} 
                    className={`relative group border rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors ${
                      evidence.linkedToEvidenceId 
                        ? 'border-l-4 border-l-blue-500 border-gray-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => openEditEvidence(evidence)}
                  >
                    {/* Botón de eliminar - visible en hover */}
                    <button
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEvidenceToDelete(evidence)
                      }}
                      title="Eliminar evidencia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h4 className="font-semibold mb-2 pr-8 flex items-center gap-2">
                      {evidence.linkedToEvidenceId && (
                        <Link2 className="w-4 h-4 text-blue-500" />
                      )}
                      {evidence.installation}
                    </h4>
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
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {editingEvidence ? 'Editar Evidencia' : 'Añadir Evidencia'}
                </h3>
                {!editingEvidence && !linkedEvidence && (
                  <Button 
                    onClick={openLinkEvidenceModal} 
                    variant="outline" 
                    size="sm"
                    title="Vincular con evidencia existente"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowEvidenceForm(false)
                  setEditingEvidence(null)
                  setLinkedEvidence(null)
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
                }}
              >
                ×
              </Button>
            </div>

            {/* Card de vinculación - solo visible cuando hay evidencia vinculada y no estamos editando */}
            {linkedEvidence && !editingEvidence && (
              <div className="group relative bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    <strong>Vinculado a:</strong> {linkedEvidence.itemName} - {linkedEvidence.evidenceName} ({linkedEvidence.actividadName}, {linkedEvidence.pvaName})
                  </span>
                </div>
                {/* Icono para desvincular - visible en hover */}
                <button
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-blue-200 text-blue-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={unlinkEvidence}
                  title="Desvincular evidencia"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instalación *</label>
                  <Input
                    value={evidenceFormData.installation}
                    onChange={(e) => updateEvidenceFormData('installation', e.target.value)}
                    placeholder="Nombre de la instalación"
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Referencia</label>
                  <Input
                    value={evidenceFormData.reference}
                    onChange={(e) => updateEvidenceFormData('reference', e.target.value)}
                    placeholder="Referencia del documento"
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Evidencia Documental Observada *</label>
                <Input
                  value={evidenceFormData.documentaryEvidenceObserved}
                  onChange={(e) => updateEvidenceFormData('documentaryEvidenceObserved', e.target.value)}
                  placeholder="Descripción de la evidencia observada"
                  disabled={linkedEvidence !== null && !editingEvidence}
                  className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Emisor</label>
                  <Input
                    value={evidenceFormData.issuer}
                    onChange={(e) => updateEvidenceFormData('issuer', e.target.value)}
                    placeholder="Entidad emisora"
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha de Presentación/Inicio</label>
                  <Input
                    type="date"
                    value={evidenceFormData.presentationOrStartDate}
                    onChange={(e) => updateEvidenceFormData('presentationOrStartDate', e.target.value)}
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
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
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Documento (PDF)</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    disabled={linkedEvidence !== null && !editingEvidence}
                    className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
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
                  disabled={linkedEvidence !== null && !editingEvidence}
                  className={linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}
                  onChange={(e) => {
                    // TODO: Handle file upload
                    console.log('Image file selected:', e.target.files?.[0])
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Observaciones</label>
                <textarea
                  className={`w-full p-2 border border-gray-300 rounded-md ${linkedEvidence && !editingEvidence ? 'bg-gray-100' : ''}`}
                  rows={3}
                  value={evidenceFormData.observations}
                  onChange={(e) => updateEvidenceFormData('observations', e.target.value)}
                  placeholder="Observaciones adicionales"
                  disabled={linkedEvidence !== null && !editingEvidence}
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              {/* Botón eliminar - solo visible en modo edición */}
              <div>
                {editingEvidence && (
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setEvidenceToDelete(editingEvidence)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Evidencia
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEvidenceForm(false)
                    setEditingEvidence(null)
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
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEvidence}
                  disabled={!evidenceFormData.installation || !evidenceFormData.documentaryEvidenceObserved}
                >
                  {editingEvidence ? 'Guardar Cambios' : 'Añadir Evidencia'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para añadir nuevo estado de cumplimiento */}
      {showAddStateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Añadir Nuevo Estado</h3>
            <p className="text-sm text-gray-600 mb-4">
              Este estado estará disponible para todos los items de la inspección.
            </p>
            <Input
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              placeholder="Nombre del estado (ej: Pendiente, En revisión...)"
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStateName.trim()) addComplianceState()
                if (e.key === 'Escape') {
                  setShowAddStateModal(false)
                  setNewStateName('')
                  setNewStateApproves(true)
                }
              }}
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={newStateApproves}
                onChange={(e) => setNewStateApproves(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Este estado aprueba el requisito</span>
            </label>
            <p className="text-xs text-gray-500 mb-4">
              {newStateApproves 
                ? '✓ Se mostrará en azul y contará como favorable' 
                : '✗ Se mostrará en rojo y contará como no favorable'}
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddStateModal(false)
                  setNewStateName('')
                  setNewStateApproves(true)
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={addComplianceState}
                disabled={!newStateName.trim()}
              >
                Añadir Estado
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Menú contextual para editar/eliminar estados personalizados */}
      {contextMenu && (
        <div 
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              const state = complianceStates.find(s => s.id === contextMenu.stateId)
              if (state) setEditingState({ ...state })
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar estado
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={() => deleteComplianceState(contextMenu.stateId)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar estado
          </button>
        </div>
      )}

      {/* Modal para editar estado de cumplimiento */}
      {editingState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Editar Estado</h3>
            <Input
              value={editingState.name}
              onChange={(e) => setEditingState({ ...editingState, name: e.target.value })}
              placeholder="Nombre del estado"
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingState.name.trim()) updateComplianceState()
                if (e.key === 'Escape') setEditingState(null)
              }}
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={editingState.isApproved}
                onChange={(e) => setEditingState({ ...editingState, isApproved: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Este estado aprueba el requisito</span>
            </label>
            <p className="text-xs text-gray-500 mb-4">
              {editingState.isApproved 
                ? '✓ Se mostrará en azul y contará como favorable' 
                : '✗ Se mostrará en rojo y contará como no favorable'}
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingState(null)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={updateComplianceState}
                disabled={!editingState.name.trim()}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar evidencia */}
      {evidenceToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2">¿Eliminar esta evidencia?</h3>
            <p className="text-gray-600 mb-4">
              Se eliminará la evidencia <strong>"{evidenceToDelete.installation}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEvidenceToDelete(null)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteEvidence}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar evidencia a vincular */}
      {showLinkEvidenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Vincular con evidencia existente
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowLinkEvidenceModal(false)
                  setSelectedEvidenceToLink(null)
                }}
              >
                ×
              </Button>
            </div>
            
            {loadingAvailableEvidences ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-gray-500">Cargando evidencias...</p>
              </div>
            ) : availableEvidencesForLink.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-gray-500">No hay evidencias disponibles en esta concesión</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {availableEvidencesForLink.map((evidenceInfo) => (
                  <div 
                    key={`${evidenceInfo.inspectionId}-${evidenceInfo.evidenceId}`}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    onClick={() => setSelectedEvidenceToLink(evidenceInfo)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{evidenceInfo.evidenceName}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p><strong>Actividad:</strong> {evidenceInfo.actividadName}</p>
                          <p><strong>PVA:</strong> {evidenceInfo.pvaName}</p>
                          <p><strong>Item:</strong> {evidenceInfo.itemName}</p>
                        </div>
                      </div>
                      <Link2 className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de vista previa de evidencia a vincular */}
      {selectedEvidenceToLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalles de la evidencia</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedEvidenceToLink(null)}
              >
                ×
              </Button>
            </div>
            
            {/* Info de origen */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Actividad:</strong> {selectedEvidenceToLink.actividadName} | 
                <strong> PVA:</strong> {selectedEvidenceToLink.pvaName} | 
                <strong> Item:</strong> {selectedEvidenceToLink.itemName}
              </p>
            </div>

            {/* Datos de la evidencia (solo lectura) */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Instalación</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.installation || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Referencia</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.reference || '-'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Evidencia Documental Observada</label>
                <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.documentaryEvidenceObserved || '-'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Emisor</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.issuer || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Presentación/Inicio</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.presentationOrStartDate || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Caducidad</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.expirationDate || '-'}</p>
                </div>
              </div>
              
              {selectedEvidenceToLink.evidenceData.observations && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Observaciones</label>
                  <p className="text-gray-900">{selectedEvidenceToLink.evidenceData.observations}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => linkToEvidence(selectedEvidenceToLink)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Vincular a esta evidencia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aviso de cambio en evidencia vinculada */}
      {showLinkedChangeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[65]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-amber-600">⚠️ Evidencia vinculada</h3>
            <p className="text-gray-600 mb-4">
              Esta evidencia está vinculada a otra. Los cambios que realices se aplicarán también a la evidencia vinculada.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Vinculada a:</strong> {linkedEvidence?.itemName} - {linkedEvidence?.evidenceName}
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLinkedChangeWarning(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setShowLinkedChangeWarning(false)
                  addEvidence()
                }}
              >
                Guardar en ambas
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
