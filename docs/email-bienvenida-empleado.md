# Email de bienvenida — Portal ENERPRO

Plantilla para que **coordinación** avise al empleado de que ya tiene acceso.  
El portal envía **automáticamente** un segundo correo (Supabase Auth) con el enlace para crear la contraseña. Este mensaje es complementario: explica qué es el portal y qué debe hacer.

---

## Cuándo enviarlo

1. Justo después de dar de alta al empleado (alta unitaria o import Excel).
2. O el día anterior al lanzamiento del portal a toda la plantilla.

**No incluyas contraseñas** en este email: el empleado las crea él mismo con el enlace del correo automático.

---

## Asunto (copiar)

```
Tu acceso al Portal del Empleado ENERPRO
```

**Catalán:**

```
El teu accés al Portal de l'Empleat ENERPRO
```

---

## Cuerpo — texto plano (Outlook, Gmail, Teams)

Sustituye `[NOMBRE]`, `[URL_PORTAL]` y `[COORDINADOR]`:

```
Hola [NOMBRE],

Ya tienes acceso al Portal del Empleado de ENERPRO.

En los próximos minutos recibirás otro correo con un enlace para establecer tu contraseña. Si no lo ves, revisa la carpeta de spam.

Con el portal podrás:
• Consultar nóminas, cuadrantes y documentos
• Ver tus turnos y solicitar vacaciones
• Enviar solicitudes a coordinación

Acceso: [URL_PORTAL]
Usuario: tu email corporativo (@enerpro.com)

Desde el móvil puedes añadir el portal a la pantalla de inicio: Compartir → Añadir a pantalla de inicio.

Si tienes algún problema, contacta con [COORDINADOR].

Un saludo,
Coordinación ENERPRO
```

---

## Cuerpo — HTML (opcional)

Pega en Gmail (modo HTML) o en tu cliente de correo:

```html
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#374151;font-size:15px;line-height:1.6">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827">
    Portal del Empleado <span style="color:#f5b800">ENERPRO</span>
  </p>
  <p>Hola <strong>[NOMBRE]</strong>,</p>
  <p>Ya tienes acceso al portal ENERPRO.</p>
  <p>En los próximos minutos recibirás <strong>otro correo</strong> con un enlace para <strong>establecer tu contraseña</strong>. Revisa también spam si no lo ves.</p>
  <p style="margin:20px 0">
    <a href="[URL_PORTAL]" style="background:#f5b800;color:#000;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;display:inline-block">
      Abrir portal ENERPRO
    </a>
  </p>
  <p style="font-size:14px;color:#6b7280">
    <strong>Usuario:</strong> tu email corporativo<br>
    <strong>URL:</strong> <a href="[URL_PORTAL]" style="color:#6b7280">[URL_PORTAL]</a>
  </p>
  <ul style="font-size:14px;padding-left:20px">
    <li>Documentos y nóminas</li>
    <li>Turnos y cuadrantes</li>
    <li>Vacaciones y solicitudes</li>
  </ul>
  <p style="font-size:13px;color:#9ca3af;margin-top:24px">
    ENERPRO — Coordinación<br>
    Dudas: [COORDINADOR]
  </p>
</div>
```

---

## Valores de ejemplo

| Campo | Ejemplo |
|-------|---------|
| `[NOMBRE]` | Carlos Martínez |
| `[URL_PORTAL]` | `https://enerpro.vercel.app` |
| `[COORDINADOR]` | Laura Sánchez · laura.sanchez@enerpro.com |

---

## Email automático del sistema (no editar aquí)

Al crear el empleado, el portal dispara el correo de **restablecer contraseña** (plantilla Supabase). Configuración: ver [`supabase/email-templates.md`](../supabase/email-templates.md).

| Momento | Quién envía | Contenido |
|---------|-------------|-----------|
| Alta en portal | Sistema (Supabase) | Enlace para crear contraseña |
| Este documento | Coordinación (manual) | Bienvenida y explicación del portal |
| Olvidó contraseña | Sistema (Supabase) | Nuevo enlace de recuperación |

---

## Checklist coordinador

- [ ] Empleado dado de alta (unitario o Excel)
- [ ] Email corporativo correcto en la ficha
- [ ] Empleado recibió correo automático de contraseña (o usar «Recuperar contraseña»)
- [ ] (Opcional) Enviada esta plantilla de bienvenida
- [ ] (Opcional) Documentos iniciales subidos (nómina, cuadrante)
