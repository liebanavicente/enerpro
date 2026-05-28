# Supabase — RLS ENERPRO

## Aplicar políticas

1. Abre [Supabase Dashboard](https://supabase.com/dashboard) → proyecto **rmiaxqbmmnbnxbmlnuny** → **SQL Editor**.
2. Pega y ejecuta el contenido de [`rls.sql`](./rls.sql).
3. Comprueba que el bucket de Storage se llama **`documentos`** (Settings → Storage).

## Qué cubre

| Recurso | Empleado activo | Coordinador / email `*admin*` |
|--------|------------------|----------------------------------|
| `empleados` | Lee y actualiza su fila | CRUD completo |
| `documentos` | Sus documentos (subir cuadrante, firmar, borrar propio) | Todos |
| `solicitudes` | Crear, ver, cancelar propias | Ver y gestionar todas |
| `vacaciones` | Crear, ver, cancelar propias | Ver y gestionar todas |
| `turnos` | Ver, importar/borrar los suyos (cuadrante) | CRUD completo |
| `solicitudes_registro` | — (usa RPC anon) | Ver, aprobar, rechazar |
| Storage `documentos/` | Carpeta `{su_uuid}/` | Todas las carpetas |

## Autoregistro (`registro.html`)

Tras aplicar RLS, el alta pública usa la función `crear_solicitud_registro` (expuesta a `anon`), no insert directo en la tabla.

## Verificación rápida

- **Carlos** (empleado): ve solo sus docs, turnos, solicitudes y vacaciones.
- **Coordinador**: ve dashboard, todos los empleados y documentos admin.
- **Autoregistro**: enviar solicitud en `/registro.html` sin login.
- **Firma cuadrante**: empleado puede marcar `firmado` en su documento.

Si algo falla con «permission denied», revisa que el usuario exista en `empleados` con el mismo email que Auth y `activo = true`.
