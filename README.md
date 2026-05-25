# ENERPRO - Portal del Empleado

Portal web para gestionar la relacion diaria entre empleados y coordinacion: documentos, cuadrantes, turnos, vacaciones, solicitudes y tareas administrativas.

La aplicacion esta publicada como sitio estatico y utiliza Supabase para autenticacion, base de datos, almacenamiento y funciones auxiliares.

## Funcionalidades principales

- Acceso privado para empleados mediante Supabase Auth.
- Area personal con documentos, cuadrantes, turnos y vacaciones.
- Solicitudes de vacaciones, permisos, bajas y cambios de turno.
- Panel de administracion para coordinacion.
- Gestion de empleados, documentos, turnos y solicitudes.
- Subida individual y masiva de documentos.
- Importacion de empleados desde Excel.
- Exportaciones en formato XLSX e iCalendar.
- Interfaz bilingue en castellano y catalan.
- Instalacion como PWA mediante `manifest.json` y `sw.js`.

## Estructura del proyecto

```text
.
├── index.html          # Aplicacion principal y estructura de vistas
├── registro.html       # Formulario publico de solicitud de acceso
├── presentacion.html   # Pagina de presentacion del proyecto
├── css/styles.css      # Estilos complementarios
├── js/app.js           # Logica principal de la aplicacion
├── js/i18n.js          # Textos de interfaz en castellano y catalan
├── manifest.json       # Configuracion PWA
├── sw.js               # Service worker para cache del shell estatico
├── vercel.json         # Cabeceras especificas del despliegue en Vercel
├── icons/              # Iconos PWA
└── enerprologo.jpg     # Logotipo
```

## Stack

- HTML, CSS y JavaScript sin framework.
- Supabase Auth, Database, Storage, Realtime y Edge Functions.
- Vercel para despliegue estatico.
- Librerias externas cargadas desde CDN:
  - Supabase JS
  - JSZip
  - SheetJS / XLSX
  - Google Fonts

## Despliegue

El proyecto esta preparado para servirse como sitio estatico. En Vercel, la raiz del repositorio funciona como directorio publico.

Archivos relevantes:

- `vercel.json` ajusta la cache de `sw.js` y `manifest.json`.
- `sw.js` cachea el shell principal para mejorar la experiencia PWA.
- `manifest.json` define nombre, colores, iconos y modo standalone.

## Supabase

El frontend contiene la URL publica del proyecto y la anon key de Supabase. Esto es normal en aplicaciones cliente con Supabase, pero la seguridad debe apoyarse siempre en:

- Row Level Security habilitado en todas las tablas con datos privados.
- Politicas que limiten cada empleado a sus propios datos.
- Politicas administrativas basadas en rol o claims, no solo en comprobaciones del frontend.
- Storage protegido por politicas equivalentes a las de base de datos.
- Acciones sensibles delegadas a Edge Functions cuando requieran privilegios elevados.

Ver tambien [`docs/supabase-checklist.md`](docs/supabase-checklist.md).

## Desarrollo local

Al ser una aplicacion estatica, puede abrirse directamente o servirse con cualquier servidor local sencillo.

Ejemplo:

```bash
npx serve .
```

## Notas de mantenimiento

- No subir archivos locales del sistema como `.DS_Store`.
- Mantener sincronizadas las claves de traduccion ES/CA cuando se anadan pantallas.
- Revisar el service worker al cambiar rutas o archivos criticos.
- Evitar guardar datos sensibles de prueba que puedan confundirse con datos reales.
