import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlAcceso(nombre: string, link: string) {
  const who = esc(nombre) || "empleado/a";
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
        <tr><td style="padding:8px 32px 24px;color:#374151;font-size:15px;line-height:1.65">
          <p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
          <p style="margin:0 0 16px">Tu acceso al portal ENERPRO ya está activo. Pulsa el botón para <strong>establecer tu contraseña</strong> y entrar.</p>
          <p style="margin:28px 0;text-align:center">
            <a href="${link}" style="background:#f5b800;color:#000;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">Entrar al portal ENERPRO</a>
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280">Si no esperabas este correo, puedes ignorarlo. El enlace caduca en 24 horas.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
          ENERPRO — Portal del Empleado · Mensaje automático
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function esCoordinador(
  supabaseUser: ReturnType<typeof createClient>,
  email: string,
) {
  if (email.toLowerCase().includes("admin")) return true;
  const { data } = await supabaseUser
    .from("empleados")
    .select("cargo")
    .eq("email", email)
    .maybeSingle();
  return data?.cargo === "Coordinador";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No autorizado", use_fallback: true }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user?.email) {
      return json({ error: "No autorizado", use_fallback: true }, 401);
    }

    if (!(await esCoordinador(supabaseUser, userData.user.email))) {
      return json({ error: "Solo coordinadores", use_fallback: true }, 403);
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nombre = String(body.nombre || "").trim();
    if (!email || !email.includes("@")) {
      return json({ error: "Email inválido", use_fallback: true }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({ error: "RESEND_API_KEY no configurada", use_fallback: true }, 503);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://enerpro.vercel.app";
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: siteUrl },
    });
    if (linkErr) throw linkErr;

    const link = linkData.properties?.action_link;
    if (!link) throw new Error("No se pudo generar el enlace de acceso");

    const fromEmail = Deno.env.get("FROM_EMAIL") || "ENERPRO Portal <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Tu acceso al Portal del Empleado ENERPRO",
        html: htmlAcceso(nombre, link),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error("Resend: " + detail);
    }

    return json({ ok: true, use_fallback: false });
  } catch (e) {
    console.error(e);
    return json({ error: String(e), use_fallback: true }, 500);
  }
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
