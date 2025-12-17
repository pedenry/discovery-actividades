# 🚀 Firebase Analytics - Quick Start

## ⚡ Pasos Rápidos para Empezar

### 1️⃣ Obtén tu Measurement ID

1. Ve a [Firebase Console](https://console.firebase.google.com/project/discovery-actividades)
2. Click en **⚙️ Project Settings**
3. Copia el **Measurement ID** (formato: `G-XXXXXXXXXX`)

### 2️⃣ Agrégalo a tu `.env.local`

Abre tu archivo `.env.local` y agrega esta línea:

```bash
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TU-ID-AQUI
```

**⚠️ IMPORTANTE:** Reemplaza `G-TU-ID-AQUI` con tu Measurement ID real.

### 3️⃣ Reinicia el servidor

```bash
npm run dev
```

### 4️⃣ Verifica que funciona

Abre tu navegador en `http://localhost:3000` y:

1. **Abre la consola del navegador** (F12)
2. Deberías ver: `📊 Firebase Analytics initialized`
3. Navega por tu app
4. Deberías ver: `📊 Event tracked: page_view`

### 5️⃣ Verifica en Firebase Console

1. Ve a [Firebase Console → Analytics → Events](https://console.firebase.google.com/project/discovery-actividades/analytics/app/web/events)
2. Habilita **DebugView** (opcional pero recomendado):
   - Instala [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
   - Activa la extensión
   - Ve a Analytics → DebugView en Firebase Console

## ✅ ¿Qué está configurado?

- ✅ Analytics inicializado automáticamente
- ✅ Tracking automático de páginas
- ✅ Funciones de utilidad listas para usar
- ✅ Hook personalizado `useAnalytics`
- ✅ Componente `AnalyticsProvider` integrado

## 📝 Uso Básico

### Tracking automático
Ya está funcionando. Cada vez que navegues a una nueva página, se registrará automáticamente.

### Tracking manual de eventos

```tsx
import { trackEvent } from '@/lib/analytics'

// En cualquier parte de tu código
trackEvent('button_clicked', {
  button_name: 'export',
  page: 'activities'
})
```

## 🔍 Troubleshooting Rápido

### ❌ No veo eventos en Firebase Console

**Solución:**
1. Verifica que agregaste el `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` a `.env.local`
2. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)
3. Espera 24-48 horas para datos en reportes (usa DebugView para tiempo real)

### ❌ Error en consola: "Analytics not supported"

**Solución:**
- Esto es normal en modo desarrollo local sin HTTPS
- Los eventos aún se registran
- En producción (con HTTPS) no verás este mensaje

### ❌ No veo el mensaje "Analytics initialized"

**Solución:**
1. Verifica que el `measurementId` esté en `.env.local`
2. Asegúrate de que estás en el cliente (navegador), no en SSR
3. Revisa la consola del navegador por errores

## 📚 Más Información

- Ver `ANALYTICS_SETUP.md` para documentación completa
- Ver `ANALYTICS_EXAMPLES.md` para ejemplos de código
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)

## 🎯 Eventos Recomendados para Implementar

Los más importantes para tu app:

```tsx
import { 
  trackActivityCreated,
  trackEvidenceUploaded,
  trackSearch,
  trackFilterUsed 
} from '@/lib/analytics'

// Al crear actividad
trackActivityCreated('pva')

// Al subir evidencia
trackEvidenceUploaded('image/jpeg', fileSize)

// Al buscar
trackSearch('término de búsqueda', resultados.length)

// Al usar filtros
trackFilterUsed('estado', 'activo')
```

---

**¿Problemas?** Revisa `ANALYTICS_SETUP.md` para troubleshooting detallado.
