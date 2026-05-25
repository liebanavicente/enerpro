# Checklist de Supabase

Esta guia resume los puntos que conviene revisar antes de usar el portal con datos reales.

## Autenticacion

- Confirmar que solo usuarios aprobados pueden acceder al portal.
- Verificar el flujo de recuperacion de contrasena.
- Revisar si el alta de empleados debe hacerse desde una Edge Function en lugar de desde el navegador.
- Evitar que el rol administrativo dependa solo de comprobaciones en JavaScript.

## Base de datos

- Activar Row Level Security en todas las tablas con datos de empleados.
- Comprobar que cada empleado solo puede leer sus propios documentos, turnos, vacaciones y solicitudes.
- Comprobar que solo coordinacion puede leer o modificar datos globales.
- Probar politicas con usuarios reales de ejemplo, no solo desde el panel de Supabase.

## Storage

- Proteger el bucket `documentos` con politicas RLS.
- Confirmar que un empleado no puede descargar documentos de otro empleado.
- Usar URLs firmadas con duracion limitada para documentos privados.
- Revisar permisos de borrado y subida por rol.

## Edge Functions

- Mantener en Edge Functions las operaciones que requieran privilegios elevados.
- Validar en servidor el usuario autenticado y su rol antes de ejecutar acciones administrativas.
- No confiar en campos enviados por el navegador para decidir permisos.

## Datos sensibles

- No usar datos reales hasta cerrar RLS, Storage y flujos de administracion.
- Evitar exponer DNI, nominas o contratos en entornos publicos de prueba.
- Documentar quien puede acceder al panel de Supabase y al proyecto de Vercel.

