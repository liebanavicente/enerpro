# Correos de acceso — Portal ENERPRO

Cuando se aprueba un registro o se recupera la contraseña, la app llama a **Supabase Auth** (`resetPasswordForEmail`).  
El remitente puede decir «ENERPRO» (si lo configuraste), pero **el texto del cuerpo** sale de las plantillas de Auth en Supabase — por eso aparece «Supabase» y confunde a los empleados.

Hay dos formas de solucionarlo:

---

## Opción A — Rápida (solo panel Supabase, ~5 min)

No requiere desplegar código. Personaliza las plantillas de Auth.

### 1. URL del sitio

**Authentication → URL Configuration**

| Campo | Valor |
|-------|--------|
| **Site URL** | `https://enerpro.vercel.app` (o tu dominio) |
| **Redirect URLs** | Añade `https://enerpro.vercel.app/**` |

### 2. Remitente (opcional pero recomendado)

**Project Settings → Authentication → SMTP Settings**

Activa SMTP propio (p. ej. el de tu dominio `@enerpro.com`) o usa el de Supabase con:

- **Sender name:** `ENERPRO Portal del Empleado`
- **Sender email:** `portal@enerpro.com` (o el que tengáis verificado)

### 3. Plantilla «Reset password» (la más importante)

**Authentication → Email Templates → Reset password**

Esta plantilla se usa al **aprobar un registro** y al **«Olvidé mi contraseña»**.

**Asunto:**

```
Establece tu contraseña — Portal ENERPRO
```

**Cuerpo (HTML):**

```html
<h2 style="font-family:Inter,Arial,sans-serif;color:#111827;margin:0 0 12px">
  Portal del Empleado <span style="color:#f5b800">ENERPRO</span>
</h2>
<p style="font-family:Inter,Arial,sans-serif;color:#374151;font-size:15px;line-height:1.6">
  Hola,<br><br>
  Tu acceso al portal ENERPRO ya está activo. Pulsa el botón para <strong>establecer tu contraseña</strong> y entrar por primera vez (o restablecerla si la olvidaste).
</p>
<p style="margin:28px 0">
  <a href="{{ .ConfirmationURL }}"
     style="background:#f5b800;color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-family:Inter,Arial,sans-serif;display:inline-block">
    Entrar al portal ENERPRO
  </a>
</p>
<p style="font-family:Inter,Arial,sans-serif;color:#6b7280;font-size:13px;line-height:1.5">
  Si no solicitaste este acceso, ignora este correo.<br>
  El enlace caduca en 24 horas.
</p>
<p style="font-family:Inter,Arial,sans-serif;color:#9ca3af;font-size:12px;margin-top:24px">
  ENERPRO — Portal del Empleado<br>
  Este mensaje es automático; no respondas a este correo.
</p>
```

### 4. Plantilla «Confirm signup» (si confirmación por email está activa)

**Authentication → Email Templates → Confirm signup**

**Asunto:** `Confirma tu acceso — Portal ENERPRO`

Usa el mismo estilo; sustituye el párrafo por «Confirma tu correo para activar tu cuenta en el portal ENERPRO» y el mismo botón con `{{ .ConfirmationURL }}`.

### 5. Probar

1. Aprueba una solicitud de registro de prueba desde Administración.
2. O usa «¿Olvidaste tu contraseña?» en el login.
3. Comprueba que el asunto y el cuerpo mencionan **ENERPRO**, no Supabase.

---

## Opción B — Email 100 % personalizado (Edge Function + Resend)

Si quieres control total (logo, dominio `@enerpro.com`, sin plantillas de Supabase):

1. Cuenta en [Resend](https://resend.com) y dominio verificado.
2. Despliega la función `enviar-acceso-empleado` (ver [`functions/enviar-acceso-empleado/README.md`](./functions/enviar-acceso-empleado/README.md)).
3. Secrets en Supabase: `RESEND_API_KEY`, `FROM_EMAIL`, `SITE_URL`.

La app intentará primero la Edge Function; si no está desplegada, usará la plantilla de Supabase (Opción A).

---

## Qué ve el empleado según el flujo

| Acción | Email que se envía |
|--------|---------------------|
| Solicitud en `/registro.html` | Ninguno (solo queda pendiente para el admin) |
| Admin aprueba registro | Reset password (Opción A o B) |
| «Olvidé mi contraseña» | Reset password (misma plantilla) |
| Admin añade empleado manualmente | Confirm signup (si está activada) o ninguno |
