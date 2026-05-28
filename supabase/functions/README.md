# Edge Functions — ENERPRO

Correos transaccionales con marca ENERPRO vía [Resend](https://resend.com).

> **Estado:** implementadas en el repositorio, **sin desplegar**. Requieren aprobación del proyecto ENERPRO y un dominio verificado (p. ej. `portal@enerpro.com`). Hasta entonces, usar [plantillas Supabase](../email-templates.md) (Opción A).

| Función | Uso |
|---------|-----|
| [`enviar-acceso-empleado`](./enviar-acceso-empleado/) | Bienvenida al aprobar registro (enlace para establecer contraseña) |
| [`notificar-email`](./notificar-email/) | Aviso al empleado al aprobar/rechazar solicitud o vacación |

## Fase demo (ahora)

- **Acceso / contraseña:** plantillas **Reset password** en Supabase Auth ([guía](../email-templates.md)).
- **Avisos solicitudes y vacaciones:** solo en el portal (badges, toasts). Sin email hasta desplegar `notificar-email`.
- **No hace falta** cuenta Resend ni dominio propio en esta fase.

## Go-live (tras aprobación ENERPRO)

1. Dominio corporativo verificado en Resend (`portal@enerpro.com` o similar).
2. [Supabase CLI](https://supabase.com/docs/guides/cli) instalada.
3. Secrets en el proyecto:

```bash
supabase link --project-ref rmiaxqbmmnbnxbmlnuny
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  FROM_EMAIL="ENERPRO Portal <portal@enerpro.com>" \
  SITE_URL=https://enerpro.vercel.app
```

4. Desplegar:

```bash
supabase functions deploy enviar-acceso-empleado
supabase functions deploy notificar-email
```

## Fallback

- **Acceso:** si `enviar-acceso-empleado` no está desplegada, la app usa `resetPasswordForEmail` (plantilla Supabase — ver [`email-templates.md`](../email-templates.md)).
- **Notificaciones:** si `notificar-email` falla, la aprobación/rechazo en pantalla no se ve afectada (fire-and-forget).

## Seguridad

Ambas funciones exigen JWT de un **Coordinador** (cargo en `empleados` o email con `admin`).
