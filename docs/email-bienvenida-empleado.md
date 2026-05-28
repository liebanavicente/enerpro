# Email de bienvenida — Portal ENERPRO

**Se envía solo, de forma automática**, cada vez que coordinación da de alta a un empleado (alta unitaria o importación Excel). No hace falta enviar nada a mano.

Un solo correo incluye:
- Bienvenida al portal
- Enlace para **establecer la contraseña**
- Resumen de qué puede hacer el empleado
- Consejo PWA (añadir a pantalla de inicio)

---

## Cuándo se dispara

| Acción del coordinador | ¿Email automático? |
|------------------------|-------------------|
| Empleados → + Añadir | Sí, 1 email por empleado |
| Más → Importar Excel | Sí, 1 email por fila importada |

El import masivo puede ser decenas o cientos de filas: el portal los envía uno a uno en segundo plano durante la importación.

---

## Cómo funciona técnicamente

1. El portal crea la cuenta (Auth + ficha empleado).
2. Llama a `enviarEmailAccesoEmpleado()` por cada alta.
3. **Si Resend está desplegado** → Edge Function `enviar-acceso-empleado` con plantilla ENERPRO completa.
4. **Si no** (fase actual) → Supabase Auth `resetPasswordForEmail` con la plantilla **Reset password** del panel.

Configuración de plantillas: [`supabase/email-templates.md`](../supabase/email-templates.md).

---

## Asunto del correo automático

```
Tu acceso al Portal del Empleado ENERPRO
```

---

## Contenido (referencia)

Texto equivalente al que recibe el empleado:

```
Hola [NOMBRE],

Ya tienes acceso al Portal del Empleado ENERPRO.

Pulsa el enlace del correo para establecer tu contraseña y entrar.
Tu usuario de acceso es tu email corporativo.

Con el portal podrás:
• Consultar nóminas, cuadrantes y documentos
• Ver tus turnos y solicitar vacaciones
• Enviar solicitudes a coordinación

Portal: https://enerpro.vercel.app
Móvil: Compartir → Añadir a pantalla de inicio.
```

La implementación HTML está en:
- `supabase/functions/_shared/email.ts` → `buildAccesoBienvenidaHtml()`
- Plantilla Supabase Reset password (copiar desde `supabase/email-templates.md`)

---

## Checklist coordinador (sin envío manual)

- [ ] Empleado dado de alta (unitario o Excel)
- [ ] Email corporativo correcto en la ficha
- [ ] Plantilla **Reset password** actualizada en Supabase (Opción A) o Resend desplegado (Opción B)
- [ ] Tras import masivo, revisar resumen: «X emails de acceso enviados»
- [ ] (Opcional) Documentos iniciales subidos (nómina, cuadrante)

Si un empleado no recibe el correo: spam, email mal escrito, o usar **¿Has olvidado tu contraseña?** en el login.
