import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function siteUrl() {
  return Deno.env.get("SITE_URL") || "https://enerpro.vercel.app";
}

export function wrapHtml(bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border-top:4px solid #f5b800;overflow:hidden">
        <tr><td style="padding:28px 32px 8px">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280">Portal del Empleado</div>
          <div style="font-size:26px;font-weight:800;color:#111827;margin-top:4px">ENER<span style="color:#f5b800">PRO</span></div>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;color:#374151;font-size:15px;line-height:1.65">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
          ENERPRO — Portal del Empleado · Mensaje automático
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function portalButton(label = "Entrar al portal ENERPRO") {
  const url = esc(siteUrl());
  return `<p style="margin:28px 0;text-align:center">
    <a href="${url}" style="background:#f5b800;color:#000;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">${esc(label)}</a>
  </p>`;
}

export function userClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function deleteAuthUserByEmail(
  admin: ReturnType<typeof adminClient>,
  email: string,
) {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) {
      const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
      if (delErr) throw delErr;
      return true;
    }
    if (data.users.length < 200) break;
  }
  return false;
}

export async function esCoordinador(
  supabaseUser: SupabaseClient,
  email: string,
) {
  const { data } = await supabaseUser
    .from("empleados")
    .select("rol, cargo, activo")
    .eq("email", email)
    .maybeSingle();
  if (!data || !data.activo) return false;
  if (data.rol === "coordinador") return true;
  if (!data.rol && data.cargo === "Coordinador") return true;
  return false;
}

export function buildAccesoBienvenidaHtml(nombre: string, actionLink: string) {
  const who = esc(nombre) || "empleado/a";
  const link = esc(actionLink);
  const url = esc(siteUrl());
  return `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
<p style="margin:0 0 16px">Ya tienes acceso al <strong>Portal del Empleado ENERPRO</strong>.</p>
<p style="margin:0 0 16px">Pulsa el botón para <strong>establecer tu contraseña</strong> y entrar. Tu usuario de acceso es tu <strong>email corporativo</strong>.</p>
<p style="margin:28px 0;text-align:center">
  <a href="${link}" style="background:#f5b800;color:#000;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">Establecer contraseña y entrar</a>
</p>
<p style="margin:0 0 10px;font-size:14px"><strong>Con el portal podrás:</strong></p>
<ul style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.75;color:#374151">
  <li>Consultar nóminas, cuadrantes y documentos</li>
  <li>Ver tus turnos y solicitar vacaciones</li>
  <li>Enviar solicitudes a coordinación</li>
</ul>
<p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.55">
  Portal: <a href="${url}" style="color:#6b7280">${url}</a><br>
  En el móvil: <em>Compartir → Añadir a pantalla de inicio</em>.
</p>
<p style="margin:0;font-size:13px;color:#6b7280">Si no esperabas este correo, puedes ignorarlo. El enlace caduca en 24 horas.</p>`;
}

export async function sendResendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY no configurada");

  const fromEmail = Deno.env.get("FROM_EMAIL") || "ENERPRO Portal <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error("Resend: " + detail);
  }
}

export function fmtFecha(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
