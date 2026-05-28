# Edge Function: `enviar-acceso-empleado`

Envía el **email de bienvenida + enlace de contraseña** (marca ENERPRO) cuando coordinación da de alta a un empleado: alta unitaria, import Excel o aprobación legacy. Sustituye el email genérico de Supabase Auth si Resend está configurado.

## Requisitos

- Cuenta [Resend](https://resend.com) con dominio verificado (p. ej. `portal@enerpro.com`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalada

## Secrets

En el dashboard: **Project Settings → Edge Functions → Secrets**

| Secret | Ejemplo |
|--------|---------|
| `RESEND_API_KEY` | `re_...` |
| `FROM_EMAIL` | `ENERPRO Portal <portal@enerpro.com>` |
| `SITE_URL` | `https://enerpro.vercel.app` |

(`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente.)

## Desplegar

```bash
cd /ruta/a/enerpro
supabase link --project-ref rmiaxqbmmnbnxbmlnuny
supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="ENERPRO Portal <portal@enerpro.com>" SITE_URL=https://enerpro.vercel.app
supabase functions deploy enviar-acceso-empleado --no-verify-jwt
```

> `--no-verify-jwt` no es necesario si la función valida el JWT del coordinador (ya lo hace). Puedes omitirlo y dejar la verificación estándar de Supabase.

## Comportamiento en la app

`enviarEmailAccesoEmpleado()` (alta unitaria, import Excel, aprobar registro) invoca esta función. Si falla o no está desplegada, hace **fallback** a `resetPasswordForEmail` (plantilla **Reset password** en Supabase — personalízala en [`email-templates.md`](../../email-templates.md)).
