'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/firebase-firestore'
import { collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import TitularesTab from './TitularesTab'
import ActividadesTab from './ActividadesTab'
import InspeccionesTab from './InspeccionesTab'

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

export default function SeguimientosPVAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('titulares')
  const [hasShownToast, setHasShownToast] = useState(false)
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
  const [titulares, setTitulares] = useState<Titular[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
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
  const [selectedSeguimiento, setSelectedSeguimiento] = useState<string | null>(null)
  const [isTitularDialogOpen, setIsTitularDialogOpen] = useState(false)
  const [isActividadDialogOpen, setIsActividadDialogOpen] = useState(false)
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedActividadForInspeccion, setSelectedActividadForInspeccion] = useState<string | null>(null)
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

  // Cargar seguimientos, titulares, actividades, templates e inspecciones desde Firebase
  useEffect(() => {
    loadSeguimientos()
    loadTitulares()
    loadActividades()
    loadTemplates()
    loadInspecciones()
  }, [])

  // Detectar si viene de guardar una inspección
  useEffect(() => {
    const tab = searchParams.get('tab')
    const newInspectionId = searchParams.get('newInspection')
    
    if (tab === 'inspecciones') {
      setActiveTab('inspecciones')
    }
    
    if (newInspectionId && !hasShownToast) {
      setHasShownToast(true)
      toast({
        title: "Inspección guardada",
        description: "La inspección se ha guardado correctamente.",
      })
      
      // Quitar el flag isNew después de 3 segundos
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'inspections', newInspectionId), {
            isNew: false
          })
          // Recargar inspecciones
          await loadInspecciones()
        } catch (error) {
          console.error('Error updating inspection:', error)
        }
      }, 3000)
      
      // Limpiar URL
      router.replace('/seguimientos-pva?tab=inspecciones')
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

  const loadInspecciones = async () => {
    try {
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

  const handleOpenInspectionDialog = (seguimientoId: string) => {
    setSelectedSeguimiento(seguimientoId)
    setIsInspectionDialogOpen(true)
  }

  const handleOpenInspectionDialogForActividad = (actividadId: string) => {
    setSelectedActividadForInspeccion(actividadId)
    setIsInspectionDialogOpen(true)
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

    // Buscar el template por nombre del PVA
    const template = templates.find(t => t.name === actividad.pvaAsociado)
    
    if (!template) {
      toast({
        title: "Error",
        description: "No se encontró la plantilla del PVA asociado.",
        variant: "destructive"
      })
      return
    }

    // Cerrar diálogos
    setIsInspectionDialogOpen(false)
    setSelectedSeguimiento(null)
    setSelectedActividadForInspeccion(null)

    // Navegar a la página de nueva inspección con parámetros
    const params = new URLSearchParams({
      templateId: template.id,
      concesionName: actividad.titularNombre,
      actividadId: actividad.id,
      actividadNombre: actividad.nombre
    })
    
    router.push(`/inspections/new?${params.toString()}`)
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return

    try {
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: es })
      
      // Si es desde la pestaña de inspecciones (actividades)
      if (selectedActividadForInspeccion) {
        const actividad = actividades.find(a => a.id === selectedActividadForInspeccion)
        
        if (!actividad) {
          toast({
            title: "Error",
            description: "No se encontró la actividad.",
            variant: "destructive"
          })
          return
        }

        // Crear inspección en la colección 'inspections'
        const inspeccionData = {
          actividadId: actividad.id,
          actividadNombre: actividad.nombre,
          titularId: actividad.titularId,
          titularNombre: actividad.titularNombre,
          fechaProgramada: formattedDate,
          estado: 'programada',
          createdAt: Timestamp.now()
        }

        await addDoc(collection(db, 'inspections'), inspeccionData)

        // Recargar inspecciones para actualizar la UI
        await loadInspecciones()

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
    <div className="p-6">
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="titulares">Titulares</TabsTrigger>
              <TabsTrigger value="actividades">Actividades</TabsTrigger>
              <TabsTrigger value="inspecciones">Inspecciones</TabsTrigger>
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

      {activeTab === 'inspecciones' && (
        <InspeccionesTab
          actividades={actividades}
          titulares={titulares}
          templates={templates}
          inspecciones={inspecciones}
          onEditTitular={handleEditTitularFromActividad}
          onEditActividad={handleEditActividadFromInspecciones}
          onAddInspeccion={handleOpenInspectionDialogForActividad}
          isTitularDialogOpen={isTitularDialogOpen}
          setIsTitularDialogOpen={setIsTitularDialogOpen}
          titularFormData={titularFormData}
          handleTitularInputChange={handleTitularInputChange}
          handleTitularSubmit={handleTitularSubmit}
          handleCloseTitularDialog={handleCloseTitularDialog}
          selectedTitular={selectedTitular}
          isActividadDialogOpen={isActividadDialogOpen}
          setIsActividadDialogOpen={setIsActividadDialogOpen}
          actividadFormData={actividadFormData}
          handleActividadInputChange={handleActividadInputChange}
          handleActividadSelectChange={handleActividadSelectChange}
          handleActividadSubmit={handleActividadSubmit}
          handleCloseActividadDialog={handleCloseActividadDialog}
          selectedActividad={selectedActividad}
          isInspectionDialogOpen={isInspectionDialogOpen}
          setIsInspectionDialogOpen={setIsInspectionDialogOpen}
          isDatePickerOpen={isDatePickerOpen}
          setIsDatePickerOpen={setIsDatePickerOpen}
          selectedDate={selectedDate}
          handleProgramarInspeccion={handleProgramarInspeccion}
          handleRealizarInspeccion={handleRealizarInspeccion}
          handleDateSelect={handleDateSelect}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
