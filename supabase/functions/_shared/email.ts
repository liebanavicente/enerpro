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
