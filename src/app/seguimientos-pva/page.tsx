'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/firebase-firestore'
import { collection, addDoc, getDocs, getDoc, query, orderBy, where, Timestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import TitularesTab from './TitularesTabNew'
import ActividadesTab from './ActividadesTab'
import InspeccionesTab from './InspeccionesTab'
import ConcesionesTab from './ConcesionesTabNew'
import SeguimientosPVATab from './SeguimientosPVATabPrime'
import ContactoSeguimientoDialog from './ContactoSeguimientoDialog'

interface Titular {
  id: string
  nombre: string
  customFields?: Record<string, string>
  createdAt?: Date
  isNew?: boolean
}

interface Actividad {
  id: string
  nombre: string
  titularId: string
  titularNombre: string
  pvaAsociado: string
  zona: string
  puerto: string
  inicioContrato: string
  finContrato: string
  localizacion?: string
  createdAt?: Date
  isNew?: boolean
}

interface Seguimiento {
  id: string
  titular: string
  zona?: string
  puerto?: string
  actividad?: string
  pvaAplicable?: string
  inicioContrato?: string
  finContrato?: string
  fechaInspeccion?: string
  createdAt?: Date
  isNew?: boolean
  customFields?: Record<string, string>
}

interface ConcesionActividad {
  id: string
  nombre: string
  pvaAsociado: string
  pvaAsociadoNombre?: string
  createdAt?: Date
}

interface Concesion {
  id: string
  objetoTitulo: string
  titularId: string
  titularNombre: string
  tipo: 'Concesión' | 'Autorización' | 'Licencia' | 'Obra'
  puerto: string
  fechaInicio: string
  fechaFin: string
  contactoNombre: string
  contactoTelefono: string
  contactoEmail: string
  actividades?: ConcesionActividad[]
  createdAt?: Date
  isNew?: boolean
}

interface ContactoSeguimiento {
  id: string
  nombre: string
  telefono: string
  email: string
  createdAt?: Date
}

interface SeguimientoPVA {
  id: string
  concesionId: string
  concesionObjetoTitulo: string
  concesionTitularNombre: string
  concesionTipo: string
  actividadId: string
  actividadNombre: string
  actividadPVANombre: string
  contactoId?: string
  contactoNombre?: string
  contactoTelefono?: string
  contactoEmail?: string
  createdAt?: Date
  isNew?: boolean
}

function SeguimientosPVAPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('titulares')
  const [hasShownToast, setHasShownToast] = useState(false)
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [seguimientosPVA, setSeguimientosPVA] = useState<SeguimientoPVA[]>([])
  const [titulares, setTitulares] = useState<Titular[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [concesiones, setConcesiones] = useState<Concesion[]>([])
  const [templates, setTemplates] = useState<Array<{id: string, name: string}>>([])
  const [inspecciones, setInspecciones] = useState<Array<{
    id: string
    actividadId: string
    fechaProgramada?: string
    estado?: string
    status?: string
    resultado?: string
    isNew?: boolean
    createdAt?: string
  }>>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTitular, setSelectedTitular] = useState<Titular | null>(null)
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null)
  const [selectedConcesion, setSelectedConcesion] = useState<Concesion | null>(null)
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<string | null>(null)
  const [isTitularDialogOpen, setIsTitularDialogOpen] = useState(false)
  const [isActividadDialogOpen, setIsActividadDialogOpen] = useState(false)
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false)
  const [isContactoSeguimientoDialogOpen, setIsContactoSeguimientoDialogOpen] = useState(false)
  const [selectedSeguimientoForContacto, setSelectedSeguimientoForContacto] = useState<SeguimientoPVA | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedActividadForInspeccion, setSelectedActividadForInspeccion] = useState<string | null>(null)
  const [selectedInspeccionForEdit, setSelectedInspeccionForEdit] = useState<{
    id: string
    actividadId: string
    fechaProgramada?: string
    estado?: string
  } | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    titular: '',
    zona: '',
    puerto: '',
    actividad: '',
    pvaAplicable: '',
    inicioContrato: '',
    finContrato: ''
  })

  const [titularFormData, setTitularFormData] = useState({
    nombre: ''
  })

  const [actividadFormData, setActividadFormData] = useState({
    nombre: '',
    titularId: '',
    pvaAsociado: '',
    zona: '',
    puerto: '',
    inicioContrato: '',
    finContrato: ''
  })

  const [concesionFormData, setConcesionFormData] = useState({
    objetoTitulo: '',
    titularId: '',
    tipo: '',
    puerto: '',
    fechaInicio: '',
    fechaFin: '',
    contactoNombre: '',
    contactoTelefono: '',
    contactoEmail: ''
  })

  // Cargar seguimientos, titulares, actividades, templates e inspecciones desde Firebase
  useEffect(() => {
    loadSeguimientos()
    loadTitulares()
    loadActividades()
    loadConcesiones()
    loadTemplates()
    loadSeguimientosPVA()
    loadInspecciones()
  }, [])

  // Detectar pestaña activa desde URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    const newInspectionId = searchParams.get('newInspection')
    
    // Establecer pestaña activa según URL
    if (tab && ['titulares', 'concesiones', 'seguimientos'].includes(tab)) {
      setActiveTab(tab)
    }
    
    if (newInspectionId && !hasShownToast) {
      setHasShownToast(true)
      toast({
        title: "Inspección guardada",
        description: "La inspección se ha guardado correctamente.",
      })
      
      // Recargar inspecciones INMEDIATAMENTE para reflejar el nuevo estado
      loadInspecciones()
      
      // Quitar el flag isNew después de 3 segundos
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'inspections', newInspectionId), {
            isNew: false
          })
          // Recargar inspecciones para quitar la animación
          await loadInspecciones()
        } catch (error) {
          console.error('Error updating inspection:', error)
        }
      }, 3000)
      
      // Limpiar URL
      router.replace('/seguimientos-pva?tab=seguimientos')
    }
  }, [searchParams, hasShownToast, toast, router])

  const loadSeguimientos = async () => {
    try {
      const seguimientosRef = collection(db, 'seguimientos-pva')
      const q = query(seguimientosRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Seguimiento[]
      
      setSeguimientos(data)
    } catch (error) {
      console.error('Error loading seguimientos:', error)
    }
  }

  const loadTitulares = async () => {
    try {
      const titularesRef = collection(db, 'titulares')
      const q = query(titularesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Titular[]
      
      setTitulares(data)
    } catch (error) {
      console.error('Error loading titulares:', error)
    }
  }

  const loadActividades = async () => {
    try {
      const actividadesRef = collection(db, 'actividades')
      const q = query(actividadesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Actividad[]
      
      setActividades(data)
    } catch (error) {
      console.error('Error loading actividades:', error)
    }
  }

  const loadConcesiones = async () => {
    try {
      const concesionesRef = collection(db, 'concesiones')
      const q = query(concesionesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const concesionesData = await Promise.all(
        querySnapshot.docs.map(async (concesionDoc) => {
          // Cargar actividades de esta concesión desde la colección separada
          const actividadesRef = collection(db, 'actividades')
          const actividadesQuery = query(
            actividadesRef, 
            where('concesionId', '==', concesionDoc.id)
          )
          const actividadesSnapshot = await getDocs(actividadesQuery)
          
          const actividades = actividadesSnapshot.docs
            .map(actDoc => ({
              id: actDoc.id,
              nombre: actDoc.data().nombre,
              pvaAsociado: actDoc.data().pvaAsociado,
              pvaAsociadoNombre: actDoc.data().pvaAsociadoNombre,
              createdAt: actDoc.data().createdAt?.toDate()
            }))
            .sort((a, b) => {
              if (!a.createdAt || !b.createdAt) return 0
              return b.createdAt.getTime() - a.createdAt.getTime()
            }) as ConcesionActividad[]

          return {
            id: concesionDoc.id,
            ...concesionDoc.data(),
            actividades,
            createdAt: concesionDoc.data().createdAt?.toDate()
          } as Concesion
        })
      )
      
      setConcesiones(concesionesData)
    } catch (error) {
      console.error('Error loading concesiones:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const templatesRef = collection(db, 'templates')
      const querySnapshot = await getDocs(templatesRef)
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().title || 'Sin nombre'
      }))
      
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadSeguimientosPVA = async () => {
    try {
      const seguimientosPVARef = collection(db, 'seguimientos-pva')
      const q = query(seguimientosPVARef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      // Cargar datos completos mediante joins
      const seguimientosData = await Promise.all(
        querySnapshot.docs.map(async (seguimientoDoc) => {
          try {
            const seguimientoData = seguimientoDoc.data()
            
            // Validar que existan los IDs requeridos
            if (!seguimientoData.concesionId || !seguimientoData.actividadId) {
              console.warn(`Seguimiento ${seguimientoDoc.id} tiene IDs inválidos`)
              return null
            }
            
            // Obtener datos de la concesión por ID
            let concesion = null
            try {
              const concesionRef = doc(db, 'concesiones', seguimientoData.concesionId)
              const concesionSnap = await getDoc(concesionRef)
              concesion = concesionSnap.exists() ? concesionSnap.data() : null
            } catch (err) {
              console.warn(`Error cargando concesión ${seguimientoData.concesionId}:`, err)
            }
            
            // Obtener datos de la actividad por ID
            let actividad = null
            try {
              const actividadRef = doc(db, 'actividades', seguimientoData.actividadId)
              const actividadSnap = await getDoc(actividadRef)
              actividad = actividadSnap.exists() ? actividadSnap.data() : null
            } catch (err) {
              console.warn(`Error cargando actividad ${seguimientoData.actividadId}:`, err)
            }
            
            // Obtener datos del contacto si existe
            let contacto = null
            if (seguimientoData.contactoId) {
              try {
                const contactoRef = doc(db, 'contactos-seguimientos', seguimientoData.contactoId)
                const contactoSnap = await getDoc(contactoRef)
                contacto = contactoSnap.exists() ? contactoSnap.data() : null
              } catch (err) {
                console.warn(`Error cargando contacto ${seguimientoData.contactoId}:`, err)
              }
            }
            
            return {
              id: seguimientoDoc.id,
              concesionId: seguimientoData.concesionId || '',
              concesionObjetoTitulo: concesion?.objetoTitulo || '',
              concesionTitularNombre: concesion?.titularNombre || '',
              concesionTipo: concesion?.tipo || '',
              actividadId: seguimientoData.actividadId || '',
              actividadNombre: actividad?.nombre || '',
              actividadPVANombre: actividad?.pvaAsociadoNombre || '',
              contactoId: seguimientoData.contactoId || undefined,
              contactoNombre: contacto?.nombre || undefined,
              contactoTelefono: contacto?.telefono || undefined,
              contactoEmail: contacto?.email || undefined,
              createdAt: seguimientoData.createdAt?.toDate()
            } as SeguimientoPVA
          } catch (err) {
            console.error(`Error procesando seguimiento ${seguimientoDoc.id}:`, err)
            return null
          }
        })
      )
      
      // Filtrar null values
      const validSeguimientos = seguimientosData.filter((s): s is SeguimientoPVA => s !== null)
      
      setSeguimientosPVA(validSeguimientos)
    } catch (error) {
      console.error('Error loading seguimientos PVA:', error)
      setSeguimientosPVA([])
    }
  }

  const loadInspecciones = async () => {
    try {
      console.log('🔄 Cargando inspecciones...')
      const inspeccionesRef = collection(db, 'inspections')
      const q = query(inspeccionesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        actividadId: doc.data().actividadId,
        fechaProgramada: doc.data().fechaProgramada,
        estado: doc.data().estado,
        status: doc.data().status,
        resultado: doc.data().resultado,
        isNew: doc.data().isNew,
        createdAt: doc.data().createdAt
      }))
      
      console.log(`✅ ${data.length} inspecciones cargadas`, data)
      setInspecciones(data)
    } catch (error) {
      console.error('Error loading inspecciones:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTitularInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitularFormData({
      ...titularFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleActividadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActividadFormData({
      ...actividadFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleActividadSelectChange = (name: string, value: string) => {
    setActividadFormData({
      ...actividadFormData,
      [name]: value
    })
  }

  // Crear o actualizar titular
  const handleTitularSubmit = async (customFields?: Record<string, string>) => {
    setIsLoading(true)
    
    try {
      const dataToSave = {
        nombre: titularFormData.nombre,
        ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
        createdAt: selectedTitular ? selectedTitular.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      if (selectedTitular) {
        // Actualizar titular existente
        const titularRef = doc(db, 'titulares', selectedTitular.id)
        await updateDoc(titularRef, dataToSave)

        const updatedTitular: Titular = {
          ...selectedTitular,
          nombre: titularFormData.nombre,
          ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {})
        }

        setTitulares(titulares.map(t => t.id === selectedTitular.id ? updatedTitular : t))

        // Actualizar el nombre del titular en todas las actividades asociadas
        const actividadesActualizadas = actividades.map(actividad => {
          if (actividad.titularId === selectedTitular.id) {
            return {
              ...actividad,
              titularNombre: titularFormData.nombre
            }
          }
          return actividad
        })
        setActividades(actividadesActualizadas)

        // Actualizar también en Firestore todas las actividades asociadas
        const actividadesDelTitular = actividades.filter(a => a.titularId === selectedTitular.id)
        for (const actividad of actividadesDelTitular) {
          const actividadRef = doc(db, 'actividades', actividad.id)
          await updateDoc(actividadRef, {
            titularNombre: titularFormData.nombre
          })
        }

        toast({
          title: "Titular actualizado",
          description: "Los datos del titular se han actualizado correctamente.",
        })
      } else {
        // Crear nuevo titular
        const docRef = await addDoc(collection(db, 'titulares'), dataToSave)

        const newTitular: Titular = {
          id: docRef.id,
          nombre: titularFormData.nombre,
          ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
          createdAt: new Date(),
          isNew: true
        }

        setTitulares([newTitular, ...titulares])

        toast({
          title: "Titular creado",
          description: "El nuevo titular se ha registrado correctamente.",
        })

        // Remover la animación después de 3 segundos
        setTimeout(() => {
          setTitulares(prev => prev.map(t => 
            t.id === docRef.id ? { ...t, isNew: false } : t
          ))
        }, 3000)
      }
      
      // Resetear formulario
      setTitularFormData({ nombre: '' })
      setSelectedTitular(null)
      setIsDialogOpen(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Error saving titular:', error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "No se pudo guardar el titular.",
        variant: "destructive"
      })
    }
  }

  // Abrir diálogo para editar titular
  const handleEditTitular = (titular: Titular) => {
    setSelectedTitular(titular)
    setTitularFormData({ nombre: titular.nombre })
    setIsDialogOpen(true)
  }

  // Cerrar diálogo y resetear
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedTitular(null)
    setSelectedActividad(null)
    setTitularFormData({ nombre: '' })
    setActividadFormData({
      nombre: '',
      titularId: '',
      pvaAsociado: '',
      zona: '',
      puerto: '',
      inicioContrato: '',
      finContrato: ''
    })
  }

  const handleCloseTitularDialog = () => {
    setIsTitularDialogOpen(false)
    setSelectedTitular(null)
    setTitularFormData({ nombre: '' })
  }

  const handleCloseActividadDialog = () => {
    setIsActividadDialogOpen(false)
    setSelectedActividad(null)
    setActividadFormData({
      nombre: '',
      titularId: '',
      pvaAsociado: '',
      zona: '',
      puerto: '',
      inicioContrato: '',
      finContrato: ''
    })
  }

  // Eliminar titular
  const handleDeleteTitular = async (titularId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este titular?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'titulares', titularId))
      setTitulares(titulares.filter(t => t.id !== titularId))
      
      toast({
        title: "Titular eliminado",
        description: "El titular se ha eliminado correctamente.",
      })
    } catch (error) {
      console.error('Error deleting titular:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el titular.",
        variant: "destructive"
      })
    }
  }

  // Gestionar campos personalizados
  const handleManageFields = async (newFieldNames: string[]) => {
    try {
      // Obtener los campos que ya no están en la nueva lista
      const currentFieldNames = Array.from(
        new Set(
          titulares.flatMap(titular => 
            titular.customFields ? Object.keys(titular.customFields) : []
          )
        )
      )
      
      const fieldsToRemove = currentFieldNames.filter(
        fieldName => !newFieldNames.includes(fieldName)
      )

      // Si hay campos para eliminar, actualizar todos los titulares
      if (fieldsToRemove.length > 0) {
        for (const titular of titulares) {
          if (titular.customFields) {
            const updatedCustomFields = { ...titular.customFields }
            
            // Eliminar campos que ya no están en la lista
            fieldsToRemove.forEach(fieldName => {
              delete updatedCustomFields[fieldName]
            })

            // Actualizar en Firestore
            const titularRef = doc(db, 'titulares', titular.id)
            await updateDoc(titularRef, {
              customFields: Object.keys(updatedCustomFields).length > 0 
                ? updatedCustomFields 
                : {},
              updatedAt: Timestamp.now()
            })

            // Actualizar estado local
            setTitulares(prev => prev.map(t => 
              t.id === titular.id 
                ? { ...t, customFields: Object.keys(updatedCustomFields).length > 0 ? updatedCustomFields : {} }
                : t
            ))
          }
        }

        toast({
          title: "Campos actualizados",
          description: `Se han eliminado ${fieldsToRemove.length} campo(s) de todos los titulares.`,
        })
      }
    } catch (error) {
      console.error('Error managing fields:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los campos.",
        variant: "destructive"
      })
    }
  }

  // Eliminar actividad
  const handleDeleteActividad = async (actividadId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'actividades', actividadId))
      setActividades(actividades.filter(a => a.id !== actividadId))
      
      toast({
        title: "Actividad eliminada",
        description: "La actividad se ha eliminado correctamente.",
      })
    } catch (error) {
      console.error('Error deleting actividad:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la actividad.",
        variant: "destructive"
      })
    }
  }

  // Abrir diálogo para editar actividad
  const handleEditActividad = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    setActividadFormData({
      nombre: actividad.nombre,
      titularId: actividad.titularId,
      pvaAsociado: actividad.pvaAsociado,
      zona: actividad.zona,
      puerto: actividad.puerto,
      inicioContrato: actividad.inicioContrato,
      finContrato: actividad.finContrato
    })
    setIsDialogOpen(true)
  }

  // Abrir diálogo de titular desde la card en actividades
  const handleEditTitularFromActividad = (titularId: string) => {
    const titular = titulares.find(t => t.id === titularId)
    if (titular) {
      setSelectedTitular(titular)
      setTitularFormData({ nombre: titular.nombre })
      setIsTitularDialogOpen(true)
    }
  }

  // Abrir diálogo de actividad desde inspecciones
  const handleEditActividadFromInspecciones = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    setActividadFormData({
      nombre: actividad.nombre,
      titularId: actividad.titularId,
      pvaAsociado: actividad.pvaAsociado,
      zona: actividad.zona,
      puerto: actividad.puerto,
      inicioContrato: actividad.inicioContrato,
      finContrato: actividad.finContrato
    })
    setIsActividadDialogOpen(true)
  }

  // Crear o actualizar actividad
  const handleActividadSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Buscar el nombre del titular
      const titular = titulares.find(t => t.id === actividadFormData.titularId)
      
      if (!titular) {
        toast({
          title: "Error",
          description: "Debes seleccionar un titular válido.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      const dataToSave = {
        nombre: actividadFormData.nombre,
        titularId: actividadFormData.titularId,
        titularNombre: titular.nombre,
        pvaAsociado: actividadFormData.pvaAsociado,
        zona: actividadFormData.zona,
        puerto: actividadFormData.puerto,
        inicioContrato: actividadFormData.inicioContrato,
        finContrato: actividadFormData.finContrato,
        localizacion: actividadFormData.zona,
        ...(selectedActividad ? { updatedAt: Timestamp.now() } : { createdAt: Timestamp.now() })
      }

      if (selectedActividad) {
        // Actualizar actividad existente
        const actividadRef = doc(db, 'actividades', selectedActividad.id)
        await updateDoc(actividadRef, dataToSave)

        const updatedActividad: Actividad = {
          ...selectedActividad,
          ...dataToSave,
          createdAt: selectedActividad.createdAt
        }

        setActividades(actividades.map(a => a.id === selectedActividad.id ? updatedActividad : a))

        toast({
          title: "Actividad actualizada",
          description: "Los datos de la actividad se han actualizado correctamente.",
        })
      } else {
        // Crear nueva actividad
        const docRef = await addDoc(collection(db, 'actividades'), dataToSave)

        const newActividad: Actividad = {
          id: docRef.id,
          ...dataToSave,
          createdAt: new Date(),
          isNew: true
        }

        setActividades([newActividad, ...actividades])

        toast({
          title: "Actividad creada",
          description: "La nueva actividad se ha registrado correctamente.",
        })

        // Remover la animación después de 3 segundos
        setTimeout(() => {
          setActividades(prev => prev.map(a => 
            a.id === docRef.id ? { ...a, isNew: false } : a
          ))
        }, 3000)
      }

      // Resetear formulario
      setActividadFormData({
        nombre: '',
        titularId: '',
        pvaAsociado: '',
        zona: '',
        puerto: '',
        inicioContrato: '',
        finContrato: ''
      })
      setSelectedActividad(null)
      setIsDialogOpen(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Error saving actividad:', error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "No se pudo guardar la actividad.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (customFields?: Record<string, string>) => {
    setIsLoading(true)
    
    try {
      const dataToSave = {
        ...formData,
        ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
        createdAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, 'seguimientos-pva'), dataToSave)

      const newSeguimiento: Seguimiento = {
        id: docRef.id,
        ...formData,
        ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
        createdAt: new Date(),
        isNew: true
      }

      setSeguimientos([newSeguimiento, ...seguimientos])
      
      // Resetear formulario
      setFormData({
        titular: '',
        zona: '',
        puerto: '',
        actividad: '',
        pvaAplicable: '',
        inicioContrato: '',
        finContrato: ''
      })
      
      setIsDialogOpen(false)
      setIsLoading(false)

      toast({
        title: "Seguimiento creado",
        description: "El nuevo seguimiento se ha registrado correctamente.",
      })

      // Remover la animación después de 3 segundos
      setTimeout(() => {
        setSeguimientos(prev => prev.map(seg => 
          seg.id === docRef.id ? { ...seg, isNew: false } : seg
        ))
      }, 3000)
    } catch (error) {
      console.error('Error creating seguimiento:', error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "No se pudo crear el seguimiento.",
        variant: "destructive"
      })
    }
  }

  // Funciones para Concesiones
  const handleConcesionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConcesionFormData({
      ...concesionFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleConcesionSelectChange = (name: string, value: string) => {
    setConcesionFormData({
      ...concesionFormData,
      [name]: value
    })
  }

  const handleConcesionDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setConcesionFormData({
        ...concesionFormData,
        [name]: format(date, 'dd/MM/yyyy', { locale: es })
      })
    }
  }

  const handleConcesionSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Obtener el nombre del titular
      const titular = titulares.find(t => t.id === concesionFormData.titularId)
      if (!titular) {
        toast({
          title: "Error",
          description: "No se encontró el titular seleccionado.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      const dataToSave = {
        ...concesionFormData,
        titularNombre: titular.nombre,
        createdAt: selectedConcesion ? selectedConcesion.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      if (selectedConcesion) {
        // Actualizar concesión existente
        const concesionRef = doc(db, 'concesiones', selectedConcesion.id)
        await updateDoc(concesionRef, dataToSave)

        const updatedConcesion: Concesion = {
          ...selectedConcesion,
          ...concesionFormData,
          tipo: concesionFormData.tipo as 'Concesión' | 'Autorización' | 'Licencia' | 'Obra',
          titularNombre: titular.nombre
        }

        setConcesiones(concesiones.map(c => c.id === selectedConcesion.id ? updatedConcesion : c))

        toast({
          title: "Concesión actualizada",
          description: "La concesión se ha actualizado correctamente.",
        })
      } else {
        // Crear nueva concesión
        const docRef = await addDoc(collection(db, 'concesiones'), dataToSave)

        const newConcesion: Concesion = {
          id: docRef.id,
          ...concesionFormData,
          titularNombre: titular.nombre,
          tipo: concesionFormData.tipo as 'Concesión' | 'Autorización' | 'Licencia' | 'Obra',
          createdAt: new Date(),
          isNew: true
        }

        setConcesiones([newConcesion, ...concesiones])

        toast({
          title: "Concesión creada",
          description: "La nueva concesión se ha registrado correctamente.",
        })

        // Remover la animación después de 3 segundos
        setTimeout(() => {
          setConcesiones(prev => prev.map(c => 
            c.id === docRef.id ? { ...c, isNew: false } : c
          ))
        }, 3000)
      }

      setIsDialogOpen(false)
      setSelectedConcesion(null)
      setConcesionFormData({
        objetoTitulo: '',
        titularId: '',
        tipo: '',
        puerto: '',
        fechaInicio: '',
        fechaFin: '',
        contactoNombre: '',
        contactoTelefono: '',
        contactoEmail: ''
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Error saving concesion:', error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "No se pudo guardar la concesión.",
        variant: "destructive"
      })
    }
  }

  const handleEditConcesion = (concesion: Concesion) => {
    setSelectedConcesion(concesion)
    setConcesionFormData({
      objetoTitulo: concesion.objetoTitulo,
      titularId: concesion.titularId,
      tipo: concesion.tipo,
      puerto: concesion.puerto,
      fechaInicio: concesion.fechaInicio,
      fechaFin: concesion.fechaFin,
      contactoNombre: concesion.contactoNombre,
      contactoTelefono: concesion.contactoTelefono,
      contactoEmail: concesion.contactoEmail
    })
    setIsDialogOpen(true)
  }

  const handleCopyConcesion = async (concesion: Concesion) => {
    try {
      // Obtener el nombre del titular
      const titular = titulares.find(t => t.id === concesion.titularId)
      if (!titular) {
        toast({
          title: "Error",
          description: "No se encontró el titular de la concesión.",
          variant: "destructive"
        })
        return
      }

      const dataToSave = {
        objetoTitulo: concesion.objetoTitulo,
        titularId: concesion.titularId,
        titularNombre: titular.nombre,
        tipo: concesion.tipo,
        puerto: concesion.puerto,
        fechaInicio: concesion.fechaInicio,
        fechaFin: concesion.fechaFin,
        contactoNombre: concesion.contactoNombre,
        contactoTelefono: concesion.contactoTelefono,
        contactoEmail: concesion.contactoEmail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, 'concesiones'), dataToSave)

      const newConcesion: Concesion = {
        id: docRef.id,
        ...dataToSave,
        createdAt: new Date(),
        isNew: true
      }

      setConcesiones([newConcesion, ...concesiones])

      toast({
        title: "Concesión copiada",
        description: "Se ha creado una copia de la concesión correctamente.",
      })

      // Remover la animación después de 3 segundos
      setTimeout(() => {
        setConcesiones(prev => prev.map(c => 
          c.id === docRef.id ? { ...c, isNew: false } : c
        ))
      }, 3000)
    } catch (error) {
      console.error('Error copying concesion:', error)
      toast({
        title: "Error",
        description: "No se pudo copiar la concesión.",
        variant: "destructive"
      })
    }
  }

  const handleAddActividadConcesion = async (concesionId: string, nombre: string, pvaAsociado: string) => {
    try {
      // Obtener el nombre del template
      const template = templates.find(t => t.id === pvaAsociado)
      const pvaAsociadoNombre = template?.name || 'PVA'

      // Obtener la concesión actual
      const concesion = concesiones.find(c => c.id === concesionId)
      if (!concesion) {
        toast({
          title: "Error",
          description: "No se encontró la concesión.",
          variant: "destructive"
        })
        return
      }

      // Crear actividad en la colección 'actividades'
      const actividadesRef = collection(db, 'actividades')
      const actividadData = {
        concesionId,
        nombre,
        pvaAsociado,
        pvaAsociadoNombre,
        createdAt: Timestamp.now()
      }
      
      const docRef = await addDoc(actividadesRef, actividadData)

      // Crear objeto de actividad para el estado local
      const newActividad: ConcesionActividad = {
        id: docRef.id,
        nombre,
        pvaAsociado,
        pvaAsociadoNombre,
        createdAt: new Date()
      }

      // Actualizar estado local de concesiones
      setConcesiones(prev => prev.map(c => 
        c.id === concesionId 
          ? { ...c, actividades: [...(c.actividades || []), newActividad] }
          : c
      ))

      // Crear seguimiento PVA en Firestore (solo IDs)
      const seguimientosPVARef = collection(db, 'seguimientos-pva')
      const seguimientoData = {
        concesionId,
        actividadId: docRef.id,
        createdAt: Timestamp.now()
      }
      
      const seguimientoDocRef = await addDoc(seguimientosPVARef, seguimientoData)

      // Crear objeto de seguimiento para el estado local
      const newSeguimiento: SeguimientoPVA = {
        id: seguimientoDocRef.id,
        concesionId,
        concesionObjetoTitulo: concesion.objetoTitulo,
        concesionTitularNombre: concesion.titularNombre,
        concesionTipo: concesion.tipo,
        actividadId: docRef.id,
        actividadNombre: nombre,
        actividadPVANombre: pvaAsociadoNombre,
        contactoNombre: concesion.contactoNombre,
        contactoTelefono: concesion.contactoTelefono,
        contactoEmail: concesion.contactoEmail,
        createdAt: new Date(),
        isNew: true
      }

      // Actualizar estado local de seguimientos PVA
      setSeguimientosPVA(prev => [newSeguimiento, ...prev])

      // Remover animación después de 3 segundos
      setTimeout(() => {
        setSeguimientosPVA(prev => prev.map(s => 
          s.id === seguimientoDocRef.id ? { ...s, isNew: false } : s
        ))
      }, 3000)

      toast({
        title: "Actividad creada",
        description: "La actividad y su seguimiento se han creado correctamente.",
      })
    } catch (error) {
      console.error('Error adding actividad to concesion:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la actividad.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConcesion = async (concesionId: string) => {
    try {
      // Eliminar la concesión
      await deleteDoc(doc(db, 'concesiones', concesionId))
      
      // Eliminar todas las actividades asociadas a esta concesión
      const actividadesRef = collection(db, 'actividades')
      const actividadesQuery = query(actividadesRef, where('concesionId', '==', concesionId))
      const actividadesSnapshot = await getDocs(actividadesQuery)
      
      // Eliminar cada actividad
      const deleteActividadesPromises = actividadesSnapshot.docs.map(actDoc => 
        deleteDoc(doc(db, 'actividades', actDoc.id))
      )
      await Promise.all(deleteActividadesPromises)
      
      // Eliminar todos los seguimientos asociados a esta concesión
      const seguimientosRef = collection(db, 'seguimientos-pva')
      const seguimientosQuery = query(seguimientosRef, where('concesionId', '==', concesionId))
      const seguimientosSnapshot = await getDocs(seguimientosQuery)
      
      // Eliminar cada seguimiento
      const deleteSeguimientosPromises = seguimientosSnapshot.docs.map(segDoc => 
        deleteDoc(doc(db, 'seguimientos-pva', segDoc.id))
      )
      await Promise.all(deleteSeguimientosPromises)
      
      setConcesiones(concesiones.filter(c => c.id !== concesionId))
      setSeguimientosPVA(prev => prev.filter(s => s.concesionId !== concesionId))
      
      toast({
        title: "Concesión eliminada",
        description: "La concesión, sus actividades y seguimientos se han eliminado correctamente.",
      })
    } catch (error) {
      console.error('Error deleting concesion:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la concesión.",
        variant: "destructive"
      })
    }
  }

  const handleOpenInspectionDialog = (seguimientoId: string) => {
    setSelectedSeguimiento(seguimientoId)
    setIsInspectionDialogOpen(true)
  }

  const handleOpenInspectionDialogForActividad = (actividadId: string) => {
    setSelectedActividadForInspeccion(actividadId)
    setIsInspectionDialogOpen(true)
  }

  const handleAddInspeccionFromSeguimiento = (seguimientoId: string, actividadId: string, year: number) => {
    // Buscar el seguimiento para obtener todos los datos necesarios
    const seguimiento = seguimientosPVA.find(s => s.actividadId === actividadId)
    
    if (seguimiento) {
      // Guardar los datos del seguimiento para usarlos al crear la inspección
      setSelectedSeguimiento(seguimiento.id)
    }
    
    // Limpiar inspección seleccionada (es una nueva, no una edición)
    setSelectedInspeccionForEdit(null)
    setSelectedActividadForInspeccion(actividadId)
    setIsInspectionDialogOpen(true)
  }

  // Handler para click en una inspección existente (para reprogramar, realizar o ver)
  const handleClickInspeccion = (inspeccion: {
    id: string
    actividadId: string
    fechaProgramada?: string
    estado?: string
  }) => {
    // Si la inspección ya fue realizada (favorable/desfavorable), ir directamente a ver/editar
    if (inspeccion.estado === 'favorable' || inspeccion.estado === 'desfavorable') {
      const actividad = actividades.find(a => a.id === inspeccion.actividadId)
      const params = new URLSearchParams({
        inspectionId: inspeccion.id,
        mode: 'edit'
      })
      if (actividad) {
        params.set('templateId', actividad.pvaAsociado)
        params.set('actividadId', actividad.id)
        params.set('actividadNombre', actividad.nombre)
        params.set('concesionName', actividad.titularNombre)
      }
      router.push(`/inspections/new?${params.toString()}`)
      return
    }
    
    // Si está programada, abrir diálogo para reprogramar o realizar
    setSelectedInspeccionForEdit(inspeccion)
    setSelectedActividadForInspeccion(inspeccion.actividadId)
    setIsInspectionDialogOpen(true)
  }

  // Handler para eliminar inspección
  const handleDeleteInspeccion = async () => {
    if (!selectedInspeccionForEdit) return
    
    try {
      const inspeccionId = selectedInspeccionForEdit.id
      
      // Eliminar de Firebase
      await deleteDoc(doc(db, 'inspections', inspeccionId))
      
      // Actualizar estado local
      setInspecciones(prev => prev.filter(i => i.id !== inspeccionId))
      
      // Limpiar estado
      setSelectedInspeccionForEdit(null)
      setSelectedActividadForInspeccion(null)
      
      toast({
        title: "Inspección eliminada",
        description: "La inspección se ha eliminado correctamente.",
      })
    } catch (error) {
      console.error('Error deleting inspection:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la inspección.",
        variant: "destructive"
      })
    }
  }

  const handleAddContactoSeguimiento = (seguimientoId: string) => {
    const seguimiento = seguimientosPVA.find(s => s.id === seguimientoId)
    setSelectedSeguimientoForContacto(seguimiento || null)
    setIsContactoSeguimientoDialogOpen(true)
  }

  const handleEditContactoSeguimiento = (seguimientoId: string) => {
    const seguimiento = seguimientosPVA.find(s => s.id === seguimientoId)
    setSelectedSeguimientoForContacto(seguimiento || null)
    setIsContactoSeguimientoDialogOpen(true)
  }

  const handleSubmitContactoSeguimiento = async (nombre: string, telefono: string, email: string) => {
    if (!selectedSeguimientoForContacto) return
    
    try {
      setIsLoading(true)
      
      if (selectedSeguimientoForContacto.contactoId) {
        // Actualizar contacto existente
        const contactoRef = doc(db, 'contactos-seguimientos', selectedSeguimientoForContacto.contactoId)
        await updateDoc(contactoRef, {
          nombre,
          telefono,
          email,
          updatedAt: Timestamp.now()
        })
        
        // Actualizar estado local
        setSeguimientosPVA(prev => prev.map(s => 
          s.id === selectedSeguimientoForContacto.id 
            ? { ...s, contactoNombre: nombre, contactoTelefono: telefono, contactoEmail: email }
            : s
        ))
        
        toast({
          title: "Contacto actualizado",
          description: "Los datos de contacto se han actualizado correctamente.",
        })
      } else {
        // Crear nuevo contacto
        const contactosRef = collection(db, 'contactos-seguimientos')
        const contactoData = {
          nombre,
          telefono,
          email,
          createdAt: Timestamp.now()
        }
        
        const docRef = await addDoc(contactosRef, contactoData)
        
        // Actualizar seguimiento con el ID del contacto
        const seguimientoRef = doc(db, 'seguimientos-pva', selectedSeguimientoForContacto.id)
        await updateDoc(seguimientoRef, {
          contactoId: docRef.id,
          updatedAt: Timestamp.now()
        })
        
        // Actualizar estado local
        setSeguimientosPVA(prev => prev.map(s => 
          s.id === selectedSeguimientoForContacto.id 
            ? { ...s, contactoId: docRef.id, contactoNombre: nombre, contactoTelefono: telefono, contactoEmail: email }
            : s
        ))
        
        toast({
          title: "Contacto añadido",
          description: "La persona de contacto se ha añadido correctamente al seguimiento.",
        })
      }
      
      setIsContactoSeguimientoDialogOpen(false)
      setSelectedSeguimientoForContacto(null)
    } catch (error) {
      console.error('Error saving contacto seguimiento:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el contacto.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgramarInspeccion = () => {
    setIsInspectionDialogOpen(false)
    setIsDatePickerOpen(true)
  }

  const handleRealizarInspeccion = () => {
    if (!selectedActividadForInspeccion) {
      toast({
        title: "Error",
        description: "No se ha seleccionado ninguna actividad.",
        variant: "destructive"
      })
      return
    }

    const actividad = actividades.find(a => a.id === selectedActividadForInspeccion)
    
    if (!actividad) {
      toast({
        title: "Error",
        description: "No se encontró la actividad.",
        variant: "destructive"
      })
      return
    }

    // Buscar el template por ID del PVA (pvaAsociado almacena el ID, no el nombre)
    const template = templates.find(t => t.id === actividad.pvaAsociado)
    
    if (!template) {
      toast({
        title: "Error",
        description: "No se encontró la plantilla del PVA asociado.",
        variant: "destructive"
      })
      return
    }

    // Guardar el ID de la inspección existente antes de cerrar
    const existingInspectionId = selectedInspeccionForEdit?.id

    // Cerrar diálogos
    setIsInspectionDialogOpen(false)
    setSelectedSeguimiento(null)
    setSelectedActividadForInspeccion(null)
    setSelectedInspeccionForEdit(null)

    // Navegar a la página de inspección con parámetros
    const params = new URLSearchParams({
      templateId: template.id,
      concesionName: actividad.titularNombre,
      actividadId: actividad.id,
      actividadNombre: actividad.nombre
    })
    
    // Si hay una inspección existente, pasarla para actualizarla en lugar de crear una nueva
    if (existingInspectionId) {
      params.set('inspectionId', existingInspectionId)
    }
    
    router.push(`/inspections/new?${params.toString()}`)
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return

    try {
      // Guardar en formato ISO para facilitar el parsing
      const isoDate = date.toISOString()
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: es })
      
      // Si es una REPROGRAMACIÓN de inspección existente
      if (selectedInspeccionForEdit) {
        // Guardar el ID antes de resetear el estado
        const inspeccionId = selectedInspeccionForEdit.id
        
        const inspeccionRef = doc(db, 'inspections', inspeccionId)
        await updateDoc(inspeccionRef, {
          fechaProgramada: isoDate,
          fechaProgramadaDisplay: formattedDate,
          isNew: true,
          updatedAt: Timestamp.now()
        })
        
        // Actualizar estado local inmediatamente
        setInspecciones(prev => prev.map(i => 
          i.id === inspeccionId 
            ? { ...i, fechaProgramada: isoDate, isNew: true }
            : i
        ))
        
        // Cerrar y resetear ANTES del toast para que la UI se actualice
        setIsDatePickerOpen(false)
        setSelectedInspeccionForEdit(null)
        setSelectedActividadForInspeccion(null)
        setSelectedDate(undefined)
        
        toast({
          title: "Inspección reprogramada",
          description: `La inspección se ha reprogramado para el ${formattedDate}.`,
        })
        
        // Quitar el flag isNew después de 2 segundos (usando el ID guardado)
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'inspections', inspeccionId), { isNew: false })
            setInspecciones(prev => prev.map(i => 
              i.id === inspeccionId ? { ...i, isNew: false } : i
            ))
          } catch (error) {
            console.error('Error updating isNew:', error)
          }
        }, 2000)
        
        return
      }
      
      // Si es desde la pestaña de inspecciones (actividades) o desde seguimientos
      if (selectedActividadForInspeccion) {
        // Primero intentar obtener datos del seguimiento si está disponible
        const seguimiento = seguimientosPVA.find(s => s.actividadId === selectedActividadForInspeccion)
        
        if (seguimiento) {
          // Buscar la actividad para obtener el templateId (pvaAsociado)
          const actividad = actividades.find(a => a.id === seguimiento.actividadId)
          const templateId = actividad?.pvaAsociado
          
          // Usar datos del seguimiento
          const inspeccionData: any = {
            actividadId: seguimiento.actividadId,
            actividadNombre: seguimiento.actividadNombre,
            titularNombre: seguimiento.concesionTitularNombre,
            templateId: templateId, // Guardar el templateId de la plantilla
            fechaProgramada: isoDate,
            fechaProgramadaDisplay: formattedDate,
            estado: 'programada',
            isNew: true,
            createdAt: Timestamp.now()
          }
          
          const docRef = await addDoc(collection(db, 'inspections'), inspeccionData)
          
          // Actualizar estado local inmediatamente para ver la animación
          const newInspeccion = {
            id: docRef.id,
            actividadId: seguimiento.actividadId,
            fechaProgramada: isoDate,
            estado: 'programada',
            isNew: true,
            createdAt: isoDate
          }
          setInspecciones(prev => [newInspeccion, ...prev])
          
          // Quitar el flag isNew después de 2 segundos
          setTimeout(async () => {
            try {
              await updateDoc(doc(db, 'inspections', docRef.id), { isNew: false })
              setInspecciones(prev => prev.map(i => 
                i.id === docRef.id ? { ...i, isNew: false } : i
              ))
            } catch (error) {
              console.error('Error updating isNew:', error)
            }
          }, 2000)
        } else {
          // Si no hay seguimiento, buscar la actividad
          const actividad = actividades.find(a => a.id === selectedActividadForInspeccion)
          
          if (!actividad) {
            toast({
              title: "Error",
              description: "No se encontró la actividad.",
              variant: "destructive"
            })
            return
          }

          // Crear inspección con datos de la actividad
          const inspeccionData: any = {
            actividadId: actividad.id,
            actividadNombre: actividad.nombre,
            templateId: actividad.pvaAsociado, // Guardar el templateId de la plantilla
            fechaProgramada: isoDate,
            fechaProgramadaDisplay: formattedDate,
            estado: 'programada',
            isNew: true,
            createdAt: Timestamp.now()
          }
          
          // Solo agregar campos si no son undefined (Firebase no permite undefined)
          if (actividad.titularId) {
            inspeccionData.titularId = actividad.titularId
          }
          if (actividad.titularNombre) {
            inspeccionData.titularNombre = actividad.titularNombre
          }

          const docRef = await addDoc(collection(db, 'inspections'), inspeccionData)
          
          // Actualizar estado local inmediatamente para ver la animación
          const newInspeccion = {
            id: docRef.id,
            actividadId: actividad.id,
            fechaProgramada: isoDate,
            estado: 'programada',
            isNew: true,
            createdAt: isoDate
          }
          setInspecciones(prev => [newInspeccion, ...prev])
          
          // Quitar el flag isNew después de 2 segundos
          setTimeout(async () => {
            try {
              await updateDoc(doc(db, 'inspections', docRef.id), { isNew: false })
              setInspecciones(prev => prev.map(i => 
                i.id === docRef.id ? { ...i, isNew: false } : i
              ))
            } catch (error) {
              console.error('Error updating isNew:', error)
            }
          }, 2000)
        }

        console.log('✨ Inspección creada con animación')

        toast({
          title: "Inspección programada",
          description: `La inspección se ha programado para el ${formattedDate}.`,
        })
      } 
      // Si es desde seguimientos (lógica antigua)
      else if (selectedSeguimiento) {
        const seguimientoRef = doc(db, 'seguimientos-pva', selectedSeguimiento)
        
        await updateDoc(seguimientoRef, {
          fechaInspeccion: formattedDate
        })

        // Actualizar el estado local
        setSeguimientos(prev =>
          prev.map(seg =>
            seg.id === selectedSeguimiento
              ? { ...seg, fechaInspeccion: formattedDate }
              : seg
          )
        )

        toast({
          title: "Inspección programada",
          description: `La inspección se ha programado para el ${formattedDate}.`,
        })
      }

      // Cerrar todo y resetear
      setIsDatePickerOpen(false)
      setSelectedSeguimiento(null)
      setSelectedActividadForInspeccion(null)
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Error programming inspection:', error)
      toast({
        title: "Error",
        description: "No se pudo programar la inspección.",
        variant: "destructive"
      })
    }
  }

  const filteredSeguimientos = seguimientos.filter(seg =>
    seg?.titular?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seg?.zona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seg?.actividad?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Seguimientos PVA</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Pedro Pérez</span>
          <span className="text-sm text-gray-400">Supervisor (Apports)</span>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value)
            router.push(`/seguimientos-pva?tab=${value}`, { scroll: false })
          }}>
            <TabsList>
              <TabsTrigger value="titulares">Titulares</TabsTrigger>
              <TabsTrigger value="concesiones">Concesiones</TabsTrigger>
              <TabsTrigger value="seguimientos">Seguimientos</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>

      {/* Render Tab Content */}
      {activeTab === 'titulares' && (
        <TitularesTab
          titulares={titulares}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          formData={titularFormData}
          handleInputChange={handleTitularInputChange}
          handleSubmit={handleTitularSubmit}
          handleCloseDialog={handleCloseDialog}
          isLoading={isLoading}
          selectedTitular={selectedTitular}
          onEditTitular={handleEditTitular}
          onDeleteTitular={handleDeleteTitular}
          onManageFields={handleManageFields}
        />
      )}

      {activeTab === 'actividades' && (
        <ActividadesTab
          actividades={actividades}
          titulares={titulares}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          formData={actividadFormData}
          handleInputChange={handleActividadInputChange}
          handleSubmit={handleActividadSubmit}
          handleCloseDialog={handleCloseDialog}
          isLoading={isLoading}
          templates={templates}
          handleSelectChange={handleActividadSelectChange}
          onEditActividad={handleEditActividad}
          onEditTitular={handleEditTitularFromActividad}
          selectedActividad={selectedActividad}
          isTitularDialogOpen={isTitularDialogOpen}
          setIsTitularDialogOpen={setIsTitularDialogOpen}
          titularFormData={titularFormData}
          handleTitularInputChange={handleTitularInputChange}
          handleTitularSubmit={handleTitularSubmit}
          handleCloseTitularDialog={handleCloseTitularDialog}
          selectedTitular={selectedTitular}
          onDeleteActividad={handleDeleteActividad}
        />
      )}

      {activeTab === 'concesiones' && (
        <ConcesionesTab
          concesiones={concesiones}
          titulares={titulares}
          templates={templates}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          onSubmit={handleConcesionSubmit}
          onDelete={handleDeleteConcesion}
          onEdit={handleEditConcesion}
          onCopy={handleCopyConcesion}
          onAddActividad={handleAddActividadConcesion}
          isLoading={isLoading}
          selectedConcesion={selectedConcesion}
          formData={concesionFormData}
          onInputChange={handleConcesionInputChange}
          onSelectChange={handleConcesionSelectChange}
          onDateChange={handleConcesionDateChange}
        />
      )}

      {activeTab === 'seguimientos' && (
        <SeguimientosPVATab
          seguimientos={seguimientosPVA}
          inspecciones={inspecciones}
          onAddInspeccion={handleAddInspeccionFromSeguimiento}
          onClickInspeccion={handleClickInspeccion}
          onAddContacto={handleAddContactoSeguimiento}
          onEditContacto={handleEditContactoSeguimiento}
          isLoading={isLoading}
          isInspectionDialogOpen={isInspectionDialogOpen}
          setIsInspectionDialogOpen={setIsInspectionDialogOpen}
          isDatePickerOpen={isDatePickerOpen}
          setIsDatePickerOpen={setIsDatePickerOpen}
          selectedDate={selectedDate}
          handleProgramarInspeccion={handleProgramarInspeccion}
          handleRealizarInspeccion={handleRealizarInspeccion}
          handleDateSelect={handleDateSelect}
          isEditMode={selectedInspeccionForEdit !== null}
          onDialogClose={() => {
            setSelectedInspeccionForEdit(null)
            setSelectedActividadForInspeccion(null)
          }}
          onDeleteInspeccion={handleDeleteInspeccion}
        />
      )}

      
      {/* Diálogo para gestionar contacto de seguimiento */}
      <ContactoSeguimientoDialog
        isOpen={isContactoSeguimientoDialogOpen}
        onClose={() => {
          setIsContactoSeguimientoDialogOpen(false)
          setSelectedSeguimientoForContacto(null)
        }}
        onSubmit={handleSubmitContactoSeguimiento}
        contacto={selectedSeguimientoForContacto ? {
          id: selectedSeguimientoForContacto.contactoId,
          nombre: selectedSeguimientoForContacto.contactoNombre || '',
          telefono: selectedSeguimientoForContacto.contactoTelefono || '',
          email: selectedSeguimientoForContacto.contactoEmail || ''
        } : null}
        isLoading={isLoading}
      />
    </div>
  )
}

export default function SeguimientosPVAPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <SeguimientosPVAPageContent />
    </Suspense>
  )
}
