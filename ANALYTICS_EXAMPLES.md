# 📊 Ejemplos de Implementación de Analytics

## Ejemplo 1: Tracking en ActividadesTab

```tsx
// En src/app/seguimientos-pva/ActividadesTab.tsx
import { trackActivityCreated, trackActivityUpdated, trackUserInteraction } from '@/lib/analytics'

// Agregar tracking al crear actividad
const handleSubmitWithAnalytics = () => {
  handleSubmit() // Tu función existente
  trackActivityCreated('pva') // Trackea el evento
}

// Agregar tracking al editar actividad
const handleEditWithAnalytics = (actividad: Actividad) => {
  onEditActividad(actividad)
  trackActivityUpdated('pva')
}

// Agregar tracking al eliminar actividad
const handleDeleteWithAnalytics = (actividadId: string) => {
  onDeleteActividad(actividadId)
  trackUserInteraction('delete', 'actividad', actividadId)
}

// Agregar tracking al abrir diálogo
<Button 
  onClick={() => {
    setIsDialogOpen(true)
    trackUserInteraction('open', 'dialog', 'nueva_actividad')
  }}
>
  <Plus className="mr-2 h-4 w-4" /> Nueva Actividad
</Button>
```

## Ejemplo 2: Tracking en Formularios

```tsx
// En cualquier formulario de tu app
import { trackEvent, trackError } from '@/lib/analytics'

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    // Tu lógica existente
    await saveData(formData)
    
    // Trackea el éxito
    trackEvent('form_submitted', {
      form_name: 'actividad',
      success: true
    })
  } catch (error) {
    // Trackea el error
    trackError('Form submission failed', 'FORM_ERROR')
    
    trackEvent('form_submitted', {
      form_name: 'actividad',
      success: false,
      error_message: error.message
    })
  }
}
```

## Ejemplo 3: Tracking de Búsqueda

```tsx
// En cualquier componente con búsqueda
import { trackSearch } from '@/lib/analytics'

const handleSearch = (searchTerm: string) => {
  const results = filterActividades(searchTerm)
  
  trackSearch(searchTerm, results.length)
  
  setSearchResults(results)
}
```

## Ejemplo 4: Tracking de Filtros

```tsx
// En componentes con filtros
import { trackFilterUsed } from '@/lib/analytics'

const handleFilterChange = (filterType: string, value: string) => {
  setFilter(value)
  trackFilterUsed(filterType, value)
}

// Ejemplo de uso:
<Select
  value={estadoFilter}
  onValueChange={(value) => handleFilterChange('estado', value)}
>
  <SelectItem value="todos">Todos</SelectItem>
  <SelectItem value="activo">Activo</SelectItem>
  <SelectItem value="inactivo">Inactivo</SelectItem>
</Select>
```

## Ejemplo 5: Tracking de Subida de Evidencias

```tsx
// En src/components/EvidenceUploader.tsx
import { trackEvidenceUploaded } from '@/lib/analytics'

const handleUpload = async (file: File) => {
  try {
    await uploadToStorage(file)
    
    trackEvidenceUploaded(file.type, file.size)
    
    toast({
      title: "Evidencia subida",
      description: "El archivo se ha subido correctamente"
    })
  } catch (error) {
    trackError('Evidence upload failed', 'UPLOAD_ERROR')
  }
}
```

## Ejemplo 6: Tracking de Navegación

```tsx
// En cualquier componente de navegación
import { trackUserInteraction } from '@/lib/analytics'

<Link 
  href="/calendar"
  onClick={() => trackUserInteraction('navigate', 'menu', 'calendar')}
>
  Calendario
</Link>
```

## Ejemplo 7: Tracking de Exportaciones

```tsx
// En componentes con exportación de datos
import { trackEvent } from '@/lib/analytics'

const handleExport = (format: 'pdf' | 'excel') => {
  exportData(format)
  
  trackEvent('export_data', {
    format: format,
    data_type: 'actividades',
    record_count: actividades.length
  })
}
```

## Ejemplo 8: Tracking de Propiedades de Usuario

```tsx
// En tu componente de autenticación o perfil
import { setAnalyticsUserId, setUserAnalyticsProperties } from '@/lib/analytics'

const handleLogin = async (user: User) => {
  // Tu lógica de login existente
  await loginUser(user)
  
  // Establece el ID de usuario
  setAnalyticsUserId(user.id)
  
  // Establece propiedades personalizadas
  setUserAnalyticsProperties({
    user_role: user.role,
    company: user.company,
    subscription_type: user.subscriptionType
  })
}
```

## Ejemplo 9: Tracking en useEffect para Vistas

```tsx
// Track cuando se carga una vista específica
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

const ActividadDetail = ({ actividadId }) => {
  useEffect(() => {
    trackEvent('view_actividad_detail', {
      actividad_id: actividadId
    })
  }, [actividadId])
  
  return <div>...</div>
}
```

## Ejemplo 10: Tracking de Interacciones con Tabs

```tsx
// En src/app/seguimientos-pva/page.tsx
import { trackUserInteraction } from '@/lib/analytics'

<Tabs 
  defaultValue="actividades"
  onValueChange={(value) => {
    trackUserInteraction('switch', 'tab', value)
  }}
>
  <TabsList>
    <TabsTrigger value="actividades">Actividades</TabsTrigger>
    <TabsTrigger value="titulares">Titulares</TabsTrigger>
  </TabsList>
</Tabs>
```

## Eventos Personalizados para tu App

### Para Actividades PVA

```tsx
// Creación de actividad
trackEvent('pva_activity_created', {
  titular: formData.titularNombre,
  zona: formData.zona,
  puerto: formData.puerto,
  pva_asociado: formData.pvaAsociado
})

// Edición de actividad
trackEvent('pva_activity_updated', {
  actividad_id: actividad.id,
  changes_made: ['zona', 'localizacion']
})

// Eliminación de actividad
trackEvent('pva_activity_deleted', {
  actividad_id: actividadId,
  titular: actividad.titularNombre
})
```

### Para Titulares

```tsx
// Creación de titular
trackEvent('titular_created', {
  nombre: titularFormData.nombre,
  has_custom_fields: !!customFields
})

// Edición de titular
trackEvent('titular_updated', {
  titular_id: titularId,
  updated_fields: Object.keys(changes)
})
```

### Para Calendario

```tsx
// Vista de calendario
trackEvent('calendar_view_changed', {
  view_type: 'month', // o 'week', 'day'
  date: selectedDate.toISOString()
})

// Crear evento desde calendario
trackEvent('event_created_from_calendar', {
  date: selectedDate.toISOString(),
  event_type: 'actividad'
})
```

## 🎯 Mejores Prácticas Implementadas

1. ✅ **No bloquear UI** - Todas las llamadas son asíncronas
2. ✅ **Nombres consistentes** - Usar snake_case
3. ✅ **Parámetros relevantes** - Solo datos que aportan valor
4. ✅ **Error handling** - Trackear errores para debugging
5. ✅ **No datos sensibles** - No incluir información personal

## 🚀 Próximos Pasos

1. Implementa estos ejemplos en tus componentes existentes
2. Verifica los eventos en Firebase Console (Analytics → DebugView)
3. Crea dashboards personalizados en Firebase Analytics
4. Configura eventos de conversión para métricas clave
