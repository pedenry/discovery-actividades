'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, Plus, X, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase-firestore'

interface Inspection {
  id: string
  number: string
  date: string
  inspector: string
  status: 'completed' | 'pending' | 'issues'
  description: string
}

interface Template {
  id: string
  name: string
  description: string
  type: string
}

interface Concesion {
  id: string
  code: string
  administrativeTitle: string
  socialReason: string
  commercialName: string
  titleObject: string
  titleType: string
  administrativeData: string
  startDate: string
  endDate: string
  responsibleName: string
  phone: string
  email: string
  contracts: string[]
  inspections?: Inspection[]
}

interface FieldConfig {
  key: Exclude<keyof Concesion, 'inspections'>
  label: string
  defaultVisible: boolean
}

const availableFields: FieldConfig[] = [
  { key: 'code', label: 'Código', defaultVisible: true },
  { key: 'socialReason', label: 'Nom', defaultVisible: true },
  { key: 'commercialName', label: 'Nombre comercial', defaultVisible: true },
  { key: 'phone', label: 'Teléfon', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'administrativeTitle', label: 'Título administrativo', defaultVisible: false },
  { key: 'titleObject', label: 'Objeto del título', defaultVisible: false },
  { key: 'titleType', label: 'Tipo de título', defaultVisible: false },
  { key: 'responsibleName', label: 'Responsable', defaultVisible: false },
  { key: 'startDate', label: 'Fecha inicio', defaultVisible: false },
  { key: 'endDate', label: 'Fecha fin', defaultVisible: false }
]

export default function ConcesionesPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewSidebarOpen, setViewSidebarOpen] = useState(false)
  const [viewSidebarVisible, setViewSidebarVisible] = useState(false)
  const [selectedConcesion, setSelectedConcesion] = useState<Concesion | null>(null)
  const [concesiones, setConcesiones] = useState<Concesion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [visibleFields, setVisibleFields] = useState<Set<Exclude<keyof Concesion, 'inspections'>>>(
    new Set(availableFields.filter(field => field.defaultVisible).map(field => field.key))
  )
  const [fieldSelectorOpen, setFieldSelectorOpen] = useState(false)
  const [inspectionsSidebarOpen, setInspectionsSidebarOpen] = useState(false)
  const [inspectionsSidebarVisible, setInspectionsSidebarVisible] = useState(false)
  const [selectedConcesionForInspections, setSelectedConcesionForInspections] = useState<Concesion | null>(null)
  const [expandedInspections, setExpandedInspections] = useState<Set<string>>(new Set())
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedConcesionForNewInspection, setSelectedConcesionForNewInspection] = useState<Concesion | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [inspectionsData, setInspectionsData] = useState<{[concesionId: string]: Inspection[]}>({})

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    administrativeTitle: '',
    socialReason: '',
    commercialName: '',
    titleObject: '',
    titleType: '',
    administrativeData: '',
    startDate: '',
    endDate: '',
    responsibleName: '',
    phone: '',
    email: ''
  })

  // Load concesiones from Firebase
  useEffect(() => {
    loadConcesiones()
  }, [])

  // Close field selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (fieldSelectorOpen && !target.closest('.field-selector')) {
        setFieldSelectorOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [fieldSelectorOpen])

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const querySnapshot = await getDocs(collection(db, 'templates'))
      const templatesData: Template[] = []
      querySnapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data()
        } as Template)
      })
      
      // Si no hay templates en Firestore, usar datos de prueba
      if (templatesData.length === 0) {
        const defaultTemplates: Template[] = [
          {
            id: 'rutinaria',
            name: 'Inspección Rutinaria',
            description: 'Inspección estándar de cumplimiento normativo',
            type: 'rutinaria'
          },
          {
            id: 'seguimiento',
            name: 'Inspección de Seguimiento',
            description: 'Para verificar corrección de incidencias previas',
            type: 'seguimiento'
          },
          {
            id: 'especial',
            name: 'Inspección Especial',
            description: 'Inspección extraordinaria por denuncia o incidente',
            type: 'especial'
          }
        ]
        setTemplates(defaultTemplates)
      } else {
        setTemplates(templatesData)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      // En caso de error, usar templates por defecto
      const defaultTemplates: Template[] = [
        {
          id: 'rutinaria',
          name: 'Inspección Rutinaria',
          description: 'Inspección estándar de cumplimiento normativo',
          type: 'rutinaria'
        },
        {
          id: 'seguimiento',
          name: 'Inspección de Seguimiento',
          description: 'Para verificar corrección de incidencias previas',
          type: 'seguimiento'
        },
        {
          id: 'especial',
          name: 'Inspección Especial',
          description: 'Inspección extraordinaria por denuncia o incidente',
          type: 'especial'
        }
      ]
      setTemplates(defaultTemplates)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const loadInspections = async (concesionId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inspections'))
      const inspections: Inspection[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.concesionId === concesionId) {
          inspections.push({
            id: doc.id,
            number: doc.id.substring(0, 8), // Use first 8 chars of ID as number
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-ES') : 'N/A',
            inspector: data.formData?.performedBy || 'N/A',
            status: data.status === 'draft' ? 'pending' : (data.status as 'completed' | 'pending' | 'issues'),
            description: `${data.templateName || 'Inspección'} - ${data.concesionName || ''}`
          })
        }
      })
      
      setInspectionsData(prev => ({
        ...prev,
        [concesionId]: inspections
      }))
      
      return inspections
    } catch (error) {
      console.error('Error loading inspections:', error)
      return []
    }
  }

  const loadConcesiones = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'concesiones'))
      const concesionesData: Concesion[] = []
      querySnapshot.forEach((doc) => {
        concesionesData.push({
          id: doc.id,
          ...doc.data()
        } as Concesion)
      })
      
      // Si no hay datos, agregar datos de prueba
      if (concesionesData.length === 0) {
        const testData: Concesion[] = [
          {
            id: '1',
            code: 'COD001',
            administrativeTitle: 'Título Admin 1',
            socialReason: 'Empresa Test 1',
            commercialName: 'Test Commercial 1',
            titleObject: 'Objeto de prueba 1',
            titleType: 'Tipo A',
            administrativeData: 'Datos administrativos 1',
            startDate: '2024-01-01',
            endDate: '2025-12-31',
            responsibleName: 'Juan Pérez',
            phone: '123456789',
            email: 'test1@example.com',
            contracts: ['Contrato A', 'Contrato B'],
            inspections: [
              {
                id: 'insp1',
                number: '#001',
                date: '15/10/2024',
                inspector: 'Juan Martínez',
                status: 'completed',
                description: 'Inspección rutinaria de cumplimiento normativo. Todo en orden.'
              },
              {
                id: 'insp2',
                number: '#002',
                date: '20/11/2024',
                inspector: 'María García',
                status: 'pending',
                description: 'Inspección de seguimiento por incidencias menores detectadas.'
              }
            ]
          },
          {
            id: '2',
            code: 'COD002',
            administrativeTitle: 'Título Admin 2',
            socialReason: 'Empresa Test 2',
            commercialName: 'Test Commercial 2',
            titleObject: 'Objeto de prueba 2',
            titleType: 'Tipo B',
            administrativeData: 'Datos administrativos 2',
            startDate: '2024-02-01',
            endDate: '2025-11-30',
            responsibleName: 'María García',
            phone: '987654321',
            email: 'test2@example.com',
            contracts: ['Contrato C'],
            inspections: [
              {
                id: 'insp3',
                number: '#003',
                date: '05/09/2024',
                inspector: 'Carlos López',
                status: 'issues',
                description: 'Se detectaron incidencias menores en la documentación. Requiere seguimiento.'
              }
            ]
          }
        ]
        setConcesiones(testData)
      } else {
        setConcesiones(concesionesData)
      }
    } catch (error) {
      console.error('Error loading concesiones:', error)
      // En caso de error, usar datos de prueba
      const testData: Concesion[] = [
        {
          id: '1',
          code: 'COD001',
          administrativeTitle: 'Título Admin 1',
          socialReason: 'Empresa Test 1',
          commercialName: 'Test Commercial 1',
          titleObject: 'Objeto de prueba 1',
          titleType: 'Tipo A',
          administrativeData: 'Datos administrativos 1',
          startDate: '2024-01-01',
          endDate: '2025-12-31',
          responsibleName: 'Juan Pérez',
          phone: '123456789',
          email: 'test1@example.com',
          contracts: ['Contrato A', 'Contrato B'],
          inspections: [
            {
              id: 'insp1',
              number: '#001',
              date: '15/10/2024',
              inspector: 'Juan Martínez',
              status: 'completed',
              description: 'Inspección rutinaria de cumplimiento normativo. Todo en orden.'
            }
          ]
        }
      ]
      setConcesiones(testData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addDoc(collection(db, 'concesiones'), {
        ...formData,
        contracts: [], // Initialize with empty contracts array
        createdAt: new Date()
      })

      // Reset form
      setFormData({
        code: '',
        administrativeTitle: '',
        socialReason: '',
        commercialName: '',
        titleObject: '',
        titleType: '',
        administrativeData: '',
        startDate: '',
        endDate: '',
        responsibleName: '',
        phone: '',
        email: ''
      })

      setSidebarOpen(false)
      loadConcesiones() // Reload data
    } catch (error) {
      console.error('Error saving concesion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (concesion: Concesion) => {
    setSelectedConcesion(concesion)
    setViewSidebarVisible(true)
    setTimeout(() => setViewSidebarOpen(true), 10)
  }

  const handleCloseSidebar = () => {
    setViewSidebarOpen(false)
    setTimeout(() => setViewSidebarVisible(false), 300)
  }

  const handleInspectionsClick = (concesion: Concesion) => {
    setSelectedConcesionForInspections(concesion)
    setInspectionsSidebarVisible(true)
    setTimeout(() => setInspectionsSidebarOpen(true), 10)
  }

  const toggleInspectionsExpansion = async (concesionId: string) => {
    const newExpanded = new Set(expandedInspections)
    if (newExpanded.has(concesionId)) {
      newExpanded.delete(concesionId)
    } else {
      newExpanded.add(concesionId)
      // Load inspections for this concession if not already loaded
      if (!inspectionsData[concesionId]) {
        await loadInspections(concesionId)
      }
    }
    setExpandedInspections(newExpanded)
  }

  const handleCloseInspectionsSidebar = () => {
    setInspectionsSidebarOpen(false)
    setTimeout(() => setInspectionsSidebarVisible(false), 300)
  }

  const toggleFieldVisibility = (fieldKey: Exclude<keyof Concesion, 'inspections'>) => {
    const newVisibleFields = new Set(visibleFields)
    if (newVisibleFields.has(fieldKey)) {
      newVisibleFields.delete(fieldKey)
    } else {
      newVisibleFields.add(fieldKey)
    }
    setVisibleFields(newVisibleFields)
  }

  const getVisibleFields = () => {
    return availableFields.filter(field => visibleFields.has(field.key))
  }

  const renderFieldValue = (concesion: Concesion, fieldKey: Exclude<keyof Concesion, 'inspections'>) => {
    const value = concesion[fieldKey]
    
    switch (fieldKey) {
      case 'socialReason':
        return (
          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {value || 'N/A'}
          </div>
        )
      case 'startDate':
      case 'endDate':
        return value ? new Date(value as string).toLocaleDateString() : 'N/A'
      default:
        return value || 'N/A'
    }
  }

  const getStatusBadgeColor = (status: Inspection['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 border-green-200 bg-green-50'
      case 'pending':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50'
      case 'issues':
        return 'text-red-600 border-red-200 bg-red-50'
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  const getStatusText = (status: Inspection['status']) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'pending':
        return 'Pendiente'
      case 'issues':
        return 'Incidencias'
      default:
        return 'Desconocido'
    }
  }

  const renderInspectionsRow = (concesion: Concesion) => {
    const inspections = inspectionsData[concesion.id] || []
    const visibleFieldsCount = getVisibleFields().length + 1 // +1 para la columna de inspecciones

    return (
      <tr key={`${concesion.id}-inspections`} className="bg-gray-50">
        <td colSpan={visibleFieldsCount} className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Inspecciones de {concesion.commercialName}
              </h4>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={async (e) => {
                  e.stopPropagation()
                  setSelectedConcesionForNewInspection(concesion)
                  setInspectionModalOpen(true)
                  await loadTemplates()
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir inspección
              </Button>
            </div>
            {inspections.length > 0 ? (
              inspections.map((inspection) => (
                <div 
                  key={inspection.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/inspections/new?inspectionId=${inspection.id}&mode=edit`)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">
                      Inspección {inspection.number}
                    </h5>
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeColor(inspection.status)}
                    >
                      {getStatusText(inspection.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Fecha:</span> {inspection.date}
                    </div>
                    <div>
                      <span className="font-medium">Inspector:</span> {inspection.inspector}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{inspection.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 italic">No hay inspecciones registradas</p>
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const filteredConcesiones = concesiones.filter(concesion =>
    concesion.commercialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concesion.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concesion.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Concesiones</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Robla Davis</span>
          <span className="text-sm text-gray-400">Admin</span>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          <div className="relative field-selector">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFieldSelectorOpen(!fieldSelectorOpen)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Columnas
            </Button>
            
            {fieldSelectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Seleccionar columnas</h3>
                  <p className="text-xs text-gray-500 mt-1">Elige qué campos mostrar en la tabla</p>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto">
                  {availableFields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                      <input
                        type="checkbox"
                        checked={visibleFields.has(field.key)}
                        onChange={() => toggleFieldVisibility(field.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva concesión
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inspecciones
              </th>
              {getVisibleFields().map((field) => (
                <th key={field.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredConcesiones.map((concesion) => (
              <>
                <tr 
                  key={concesion.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(concesion)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleInspectionsExpansion(concesion.id)
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {expandedInspections.has(concesion.id) ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Inspecciones
                        </>
                      )}
                    </Button>
                  </td>
                  {getVisibleFields().map((field) => (
                    <td key={field.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderFieldValue(concesion, field.key)}
                    </td>
                  ))}
                </tr>
                {expandedInspections.has(concesion.id) && renderInspectionsRow(concesion)}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar Form */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Nueva Concesión</h2>
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CODI TÍTOL</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Código del título"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ADMINISTRATIU</label>
                  <Input
                    value={formData.administrativeTitle}
                    onChange={(e) => setFormData({...formData, administrativeTitle: e.target.value})}
                    placeholder="Título administrativo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">RAÓ SOCIAL</label>
                  <Input
                    value={formData.socialReason}
                    onChange={(e) => setFormData({...formData, socialReason: e.target.value})}
                    placeholder="Razón social"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">NOM COMERCIAL</label>
                  <Input
                    value={formData.commercialName}
                    onChange={(e) => setFormData({...formData, commercialName: e.target.value})}
                    placeholder="Nombre comercial"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">OBJECTE TÍTOL</label>
                  <Textarea
                    value={formData.titleObject}
                    onChange={(e) => setFormData({...formData, titleObject: e.target.value})}
                    placeholder="Objeto del título"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">TIPUS TÍTOL</label>
                  <Input
                    value={formData.titleType}
                    onChange={(e) => setFormData({...formData, titleType: e.target.value})}
                    placeholder="Tipo de título"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ADMINISTRATIU</label>
                  <Textarea
                    value={formData.administrativeData}
                    onChange={(e) => setFormData({...formData, administrativeData: e.target.value})}
                    placeholder="Datos administrativos"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">DATA INICI TÍTOL</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">DATA FI TÍTOL</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">NOM RESPONSABLE</label>
                  <Input
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({...formData, responsibleName: e.target.value})}
                    placeholder="Nombre del responsable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">TELÉFON</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Teléfono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">EMAIL</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Email"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar Concesión'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Sidebar */}
      {viewSidebarVisible && selectedConcesion && (
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          viewSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Detalles de Concesión</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseSidebar}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">CÓDIGO</label>
                <p className="text-sm text-gray-900">{selectedConcesion.code || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">TÍTULO ADMINISTRATIVO</label>
                <p className="text-sm text-gray-900">{selectedConcesion.administrativeTitle || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">RAZÓN SOCIAL</label>
                <p className="text-sm text-gray-900">{selectedConcesion.socialReason || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">NOMBRE COMERCIAL</label>
                <p className="text-sm text-gray-900">{selectedConcesion.commercialName || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">OBJETO DEL TÍTULO</label>
                <p className="text-sm text-gray-900">{selectedConcesion.titleObject || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">TIPO DE TÍTULO</label>
                <p className="text-sm text-gray-900">{selectedConcesion.titleType || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">DATOS ADMINISTRATIVOS</label>
                <p className="text-sm text-gray-900">{selectedConcesion.administrativeData || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">FECHA INICIO</label>
                  <p className="text-sm text-gray-900">
                    {selectedConcesion.startDate ? new Date(selectedConcesion.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">FECHA FIN</label>
                  <p className="text-sm text-gray-900">
                    {selectedConcesion.endDate ? new Date(selectedConcesion.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">RESPONSABLE</label>
                <p className="text-sm text-gray-900">{selectedConcesion.responsibleName || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">TELÉFONO</label>
                <p className="text-sm text-gray-900">{selectedConcesion.phone || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">EMAIL</label>
                <p className="text-sm text-gray-900">{selectedConcesion.email || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">CONTRATOS</label>
                <div className="flex flex-wrap gap-2">
                  {selectedConcesion.contracts && selectedConcesion.contracts.length > 0 ? (
                    selectedConcesion.contracts.map((contract, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs text-blue-600 border-blue-200"
                      >
                        {contract}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sin contratos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspections Sidebar */}
      {inspectionsSidebarVisible && selectedConcesionForInspections && (
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          inspectionsSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Inspecciones</h2>
                <p className="text-sm text-gray-500">{selectedConcesionForInspections.commercialName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseInspectionsSidebar}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Datos de ejemplo de inspecciones */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Inspección #001</h3>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Completada
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Fecha: 15/10/2024</p>
                  <p className="text-sm text-gray-600 mb-2">Inspector: Juan Martínez</p>
                  <p className="text-sm text-gray-700">Inspección rutinaria de cumplimiento normativo. Todo en orden.</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Inspección #002</h3>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      Pendiente
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Fecha programada: 20/11/2024</p>
                  <p className="text-sm text-gray-600 mb-2">Inspector: María García</p>
                  <p className="text-sm text-gray-700">Inspección de seguimiento por incidencias menores detectadas.</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Inspección #003</h3>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Incidencias
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Fecha: 05/09/2024</p>
                  <p className="text-sm text-gray-600 mb-2">Inspector: Carlos López</p>
                  <p className="text-sm text-gray-700">Se detectaron incidencias menores en la documentación. Requiere seguimiento.</p>
                </div>

                {/* Botón para nueva inspección */}
                <div className="pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Inspección
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Template Modal */}
      {inspectionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setInspectionModalOpen(false)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-xl">
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Nueva Inspección</h2>
                <Button variant="ghost" size="sm" onClick={() => setInspectionModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona una plantilla para la inspección de{' '}
                    <span className="font-medium">{selectedConcesionForNewInspection?.commercialName}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Plantilla de inspección</label>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Cargando plantillas...</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <label key={template.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="template"
                            value={template.id}
                            checked={selectedTemplate === template.id}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            <div className="text-xs text-gray-500">{template.description}</div>
                          </div>
                        </label>
                      ))}
                      {templates.length === 0 && !loadingTemplates && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No hay plantillas disponibles</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setInspectionModalOpen(false)
                    setSelectedTemplate('')
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedTemplate}
                  onClick={() => {
                    if (selectedTemplate && selectedConcesionForNewInspection) {
                      // Navigate to inspections page with template and concession data
                      const queryParams = new URLSearchParams({
                        templateId: selectedTemplate,
                        concesionId: selectedConcesionForNewInspection.id,
                        concesionName: selectedConcesionForNewInspection.commercialName || '',
                        concesionCode: selectedConcesionForNewInspection.code || ''
                      })
                      router.push(`/inspections/new?${queryParams.toString()}`)
                      setInspectionModalOpen(false)
                      setSelectedTemplate('')
                      setSelectedConcesionForNewInspection(null)
                    }
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
