import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  cors,
  esc,
  esCoordinador,
  fmtFecha,
  json,
  portalButton,
  sendResendEmail,
  userClient,
  wrapHtml,
} from "../_shared/email.ts";

type Extra = {
  tipo?: string;
  comentario?: string;
  desde?: string;
  hasta?: string;
};

const VAC_TIPOS: Record<string, string> = {
  vacaciones: "Vacaciones",
  permiso: "Permiso",
  asuntos_propios: "Asuntos propios",
  baja_medica: "Baja médica",
};

function comentarioBlock(comentario?: string) {
  if (!comentario?.trim()) return "";
  return `<p style="margin:16px 0;padding:12px 14px;background:#f9fafb;border-left:3px solid #f5b800;border-radius:4px;font-size:14px;color:#4b5563"><strong>Comentario:</strong> ${esc(comentario.trim())}</p>`;
}

function buildMessage(tipo: string, nombre: string, extra: Extra) {
  const who = esc(nombre) || "empleado/a";
  const portal = portalButton();

  if (tipo === "solicitud_aprobada") {
    return {
      subject: "Tu solicitud ha sido aprobada — ENERPRO",
      html: wrapHtml(
        `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
        <p style="margin:0 0 16px">Tu solicitud de <strong>${esc(extra.tipo || "gestión")}</strong> ha sido <strong style="color:#16a34a">aprobada</strong>.</p>
        ${comentarioBlock(extra.comentario)}
        <p style="margin:0 0 8px">Puedes consultar el detalle en el portal.</p>${portal}`,
      ),
    };
  }

  if (tipo === "solicitud_rechazada") {
    return {
      subject: "Actualización de tu solicitud — ENERPRO",
      html: wrapHtml(
        `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
        <p style="margin:0 0 16px">Tu solicitud de <strong>${esc(extra.tipo || "gestión")}</strong> ha sido <strong style="color:#dc2626">rechazada</strong>.</p>
        ${comentarioBlock(extra.comentario)}
        <p style="margin:0 0 8px">Entra al portal para ver el estado o contactar con coordinación.</p>${portal}`,
      ),
    };
  }

  if (tipo === "vacacion_aprobada") {
    const label = VAC_TIPOS[extra.tipo || ""] || extra.tipo || "Ausencia";
    const rango = extra.desde && extra.hasta
      ? ` del <strong>${esc(fmtFecha(extra.desde))}</strong> al <strong>${esc(fmtFecha(extra.hasta))}</strong>`
      : "";
    return {
      subject: `${label} aprobado/a — ENERPRO`,
      html: wrapHtml(
        `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
        <p style="margin:0 0 16px">Tu solicitud de <strong>${esc(label)}</strong>${rango} ha sido <strong style="color:#16a34a">aprobada</strong>.</p>
        ${comentarioBlock(extra.comentario)}
        <p style="margin:0 0 8px">Ya puedes verlo reflejado en tu calendario del portal.</p>${portal}`,
      ),
    };
  }

  if (tipo === "vacacion_rechazada") {
    const label = VAC_TIPOS[extra.tipo || ""] || extra.tipo || "Ausencia";
    const rango = extra.desde && extra.hasta
      ? ` (${esc(fmtFecha(extra.desde))} – ${esc(fmtFecha(extra.hasta))})`
      : "";
    return {
      subject: `Actualización de ${label.toLowerCase()} — ENERPRO`,
      html: wrapHtml(
        `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
        <p style="margin:0 0 16px">Tu solicitud de <strong>${esc(label)}</strong>${rango} ha sido <strong style="color:#dc2626">rechazada</strong>.</p>
        ${comentarioBlock(extra.comentario)}
        <p style="margin:0 0 8px">Entra al portal para revisar el detalle o enviar una nueva solicitud.</p>${portal}`,
      ),
    };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No autorizado" }, 401);

    const supabaseUser = userClient(authHeader);
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user?.email) return json({ error: "No autorizado" }, 401);

    if (!(await esCoordinador(supabaseUser, userData.user.email))) {
      return json({ error: "Solo coordinadores" }, 403);
    }

    const body = await req.json();
    const tipo = String(body.tipo || "").trim();
    const empleadoId = String(body.empleado_id || "").trim();
    const extra = (body.extra || {}) as Extra;

    if (!tipo || !empleadoId) {
      return json({ error: "tipo y empleado_id requeridos" }, 400);
    }

    const { data: emp, error: empErr } = await supabaseUser
      .from("empleados")
      .select("nombre, email, activo")
      .eq("id", empleadoId)
      .maybeSingle();

    if (empErr || !emp?.email) {
      return json({ error: "Empleado no encontrado" }, 404);
    }
    if (!emp.activo) {
      return json({ ok: true, skipped: "empleado_inactivo" });
    }

    const built = buildMessage(tipo, emp.nombre || "", extra);
    if (!built) return json({ error: "Tipo de notificación no soportado" }, 400);

    await sendResendEmail(emp.email, built.subject, built.html);

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
