# Edge Function: `notificar-email`

Envía un correo al empleado cuando coordinación **aprueba o rechaza** una solicitud o vacación.

## Tipos soportados

| `tipo` | Cuándo |
|--------|--------|
| `solicitud_aprobada` | Admin aprueba solicitud |
| `solicitud_rechazada` | Admin rechaza solicitud |
| `vacacion_aprobada` | Admin aprueba vacaciones/permiso |
| `vacacion_rechazada` | Admin rechaza vacaciones/permiso |

## Secrets

Mismos que `enviar-acceso-empleado`:

| Secret | Ejemplo |
|--------|---------|
| `RESEND_API_KEY` | `re_...` |
| `FROM_EMAIL` | `ENERPRO Portal <portal@enerpro.com>` |
| `SITE_URL` | `https://enerpro.vercel.app` |

## Desplegar

```bash
supabase link --project-ref rmiaxqbmmnbnxbmlnuny
supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="ENERPRO Portal <portal@enerpro.com>" SITE_URL=https://enerpro.vercel.app
supabase functions deploy notificar-email
supabase functions deploy enviar-acceso-empleado
```

La app invoca esta función en segundo plano; si falla, la acción en pantalla sigue completándose con normalidad.
