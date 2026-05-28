# Supabase — RLS ENERPRO

## Aplicar políticas

1. Abre [Supabase Dashboard](https://supabase.com/dashboard) → proyecto **rmiaxqbmmnbnxbmlnuny** → **SQL Editor**.
2. Pega y ejecuta el contenido de [`rls.sql`](./rls.sql).
3. Comprueba que el bucket de Storage se llama **`documentos`** (Settings → Storage).

## Qué cubre

| Recurso | Empleado activo | Coordinador (`rol = coordinador`) |
|--------|------------------|----------------------------------|
| `empleados` | Lee y actualiza su fila | CRUD completo |
| `documentos` | Sus documentos (subir cuadrante, firmar, borrar propio) | Todos |
| `solicitudes` | Crear, ver, cancelar propias | Ver y gestionar todas |
| `vacaciones` | Crear, ver, cancelar propias | Ver y gestionar todas |
| `turnos` | Ver, importar/borrar los suyos (cuadrante) | CRUD completo |
| `solicitudes_registro` | — (legacy, autoregistro desactivado) | — |
| Storage `documentos/` | Carpeta `{su_uuid}/` | Todas las carpetas |

## Autoregistro (desactivado)

El formulario público en `/registro.html` ya no acepta solicitudes. El alta la gestiona coordinación desde el panel admin. La tabla `solicitudes_registro` y la RPC `crear_solicitud_registro` pueden quedar en BD por historial; no hay UI en el portal.

## Verificación rápida

- **Carlos** (empleado): ve solo sus docs, turnos, solicitudes y vacaciones.
- **Coordinador**: ve dashboard, todos los empleados y documentos admin.
- **Alta empleados**: coordinador desde Empleados o Importar Excel.
- **Firma cuadrante**: empleado puede marcar `firmado` en su documento.

Si algo falla con «permission denied», revisa que el usuario exista en `empleados` con el mismo email que Auth, `activo = true` y el rol correcto.

### Rol de administración

- Columna `empleados.rol`: `empleado` (defecto) o `coordinador` (acceso al panel admin).
- Tras actualizar `rls.sql`, los coordinadores actuales se migran automáticamente (`cargo = Coordinador` o email con `admin`).
- Editar rol: Admin → Empleados → editar → **Acceso administración**.
- La sección **Datos demo** solo aparece en `localhost` (oculta en producción).

## Correos de acceso (marca ENERPRO)

Los emails de **aprobar registro** y **olvidé contraseña** los envía Supabase Auth. Si el cuerpo dice «Supabase», personaliza las plantillas:

→ **[email-templates.md](./email-templates.md)** (paso a paso + HTML listo para copiar)

**Edge Functions** (Resend + dominio propio) — **código listo, despliegue pendiente de aprobación ENERPRO**:

→ **[functions/README.md](./functions/README.md)** — `enviar-acceso-empleado` + `notificar-email`

Mientras tanto, las plantillas Supabase (Opción A) cubren acceso y recuperación de contraseña.
