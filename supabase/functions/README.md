# Edge Functions — ENERPRO

Correos transaccionales con marca ENERPRO vía [Resend](https://resend.com).

| Función | Uso |
|---------|-----|
| [`enviar-acceso-empleado`](./enviar-acceso-empleado/) | Bienvenida al aprobar registro (enlace para establecer contraseña) |
| [`notificar-email`](./notificar-email/) | Aviso al empleado al aprobar/rechazar solicitud o vacación |

## Configuración (una vez)

1. Cuenta Resend + dominio verificado (`portal@enerpro.com` o similar).
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
