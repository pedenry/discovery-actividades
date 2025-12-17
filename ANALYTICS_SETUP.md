# 📊 Configuración de Firebase Analytics

## ✅ Pasos Completados

1. ✅ Actualizado `firebase.ts` con inicialización de Analytics
2. ✅ Creado archivo de utilidades `lib/analytics.ts`
3. ✅ Creado hook personalizado `hooks/useAnalytics.ts`
4. ✅ Agregado `measurementId` a `.env.local.example`

## 🔧 Paso 1: Obtener tu Measurement ID

1. Ve a la [Consola de Firebase](https://console.firebase.google.com)
2. Selecciona tu proyecto `discovery-actividades`
3. Ve a **Project Settings** (⚙️ icono de engranaje)
4. Baja hasta la sección **Your apps**
5. Selecciona tu aplicación web
6. Busca el campo **Measurement ID** (debería ser algo como `G-XXXXXXXXXX`)

## 🔑 Paso 2: Agregar Measurement ID a tu `.env.local`

Agrega esta línea a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Reemplaza `G-XXXXXXXXXX` con tu Measurement ID real.

## 🚀 Paso 3: Implementar Analytics en tu App

### Opción A: Tracking Automático de Páginas (Recomendado)

Agrega el hook en tu layout principal (`src/app/layout.tsx`):

```tsx
'use client'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function RootLayout({ children }) {
  useAnalytics() // Esto rastreará automáticamente todas las páginas
  
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

### Opción B: Tracking Manual de Eventos

Usa las funciones de utilidad donde necesites:

```tsx
import { 
  trackEvent, 
  trackActivityCreated,
  trackEvidenceUploaded,
  trackUserInteraction 
} from '@/lib/analytics'

// Ejemplo 1: Al crear una actividad
const handleCreateActivity = async (data) => {
  await saveActivity(data)
  trackActivityCreated(data.type)
}

// Ejemplo 2: Al subir evidencia
const handleUploadEvidence = async (file) => {
  await uploadFile(file)
  trackEvidenceUploaded(file.type, file.size)
}

// Ejemplo 3: Interacciones de usuario
const handleButtonClick = () => {
  trackUserInteraction('click', 'button', 'export_report')
}

// Ejemplo 4: Evento personalizado
trackEvent('custom_event', {
  parameter1: 'value1',
  parameter2: 'value2'
})
```

## 📈 Funciones Disponibles

### Tracking de Eventos

- `trackEvent(eventName, params)` - Evento personalizado
- `trackPageView(path, title)` - Vista de página
- `trackActivityCreated(type)` - Creación de actividad
- `trackActivityUpdated(type)` - Actualización de actividad
- `trackEvidenceUploaded(type, size)` - Subida de evidencia
- `trackSearch(term, resultsCount)` - Búsquedas
- `trackFilterUsed(type, value)` - Uso de filtros
- `trackError(message, code)` - Errores
- `trackUserInteraction(action, category, label)` - Interacciones

### Propiedades de Usuario

```tsx
import { setUserAnalyticsProperties, setAnalyticsUserId } from '@/lib/analytics'

// Establecer ID de usuario
setAnalyticsUserId('user123')

// Establecer propiedades personalizadas
setUserAnalyticsProperties({
  user_role: 'admin',
  company: 'Discovery SA',
  department: 'operations'
})
```

## 🧪 Paso 4: Verificar que Funciona

1. **Reinicia tu servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre la consola del navegador** - Deberías ver:
   ```
   📊 Firebase Analytics initialized
   📊 Event tracked: page_view
   ```

3. **Verifica en Firebase Console:**
   - Ve a **Analytics** → **Events** en la consola de Firebase
   - Los eventos deberían aparecer en tiempo real en el **DebugView**
   - Para habilitar DebugView, instala la extensión de Chrome: [Firebase DebugView](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

## 📊 Eventos Recomendados para tu App

Basado en tu aplicación de seguimiento portuario, aquí hay eventos útiles:

```tsx
// Gestión de Actividades
trackActivityCreated('inspeccion')
trackActivityUpdated('mantenimiento')

// Evidencias
trackEvidenceUploaded('image/jpeg', 1024000)

// Búsquedas y Filtros
trackSearch('buque mercante', 5)
trackFilterUsed('tipo_actividad', 'inspeccion')
trackFilterUsed('estado', 'pendiente')

// Navegación
trackUserInteraction('view', 'calendar', 'monthly_view')
trackUserInteraction('click', 'export', 'pdf_report')

// Errores
trackError('Failed to upload evidence', 'UPLOAD_ERROR')
```

## 🎯 Mejores Prácticas

1. **No envíes información sensible** - No incluyas datos personales identificables
2. **Nombres consistentes** - Usa snake_case para eventos y parámetros
3. **Eventos significativos** - Solo trackea eventos que aporten valor analítico
4. **Parámetros limitados** - Máximo 25 parámetros por evento
5. **Testing** - Prueba en DebugView antes de producción

## 🔍 Debugging

Si Analytics no funciona:

1. Verifica que `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` esté en `.env.local`
2. Reinicia el servidor de desarrollo después de agregar variables de entorno
3. Abre la consola del navegador para ver errores
4. Verifica que estés en un navegador compatible (no funciona en SSR)
5. Asegúrate de que Analytics esté habilitado en tu proyecto de Firebase

## 📚 Recursos Adicionales

- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Google Analytics Events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [DebugView](https://firebase.google.com/docs/analytics/debugview)
