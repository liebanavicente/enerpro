import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  cors,
  esc,
  esCoordinador,
  json,
  portalButton,
  sendResendEmail,
  siteUrl,
  userClient,
  wrapHtml,
} from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No autorizado", use_fallback: true }, 401);
    }

    const supabaseUser = userClient(authHeader);
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

    const admin = adminClient();
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: siteUrl() },
    });
    if (linkErr) throw linkErr;

    const link = linkData.properties?.action_link;
    if (!link) throw new Error("No se pudo generar el enlace de acceso");

    const who = esc(nombre) || "empleado/a";
    const html = wrapHtml(
      `<p style="margin:0 0 16px">Hola <strong>${who}</strong>,</p>
      <p style="margin:0 0 16px">Tu acceso al portal ENERPRO ya está activo. Pulsa el botón para <strong>establecer tu contraseña</strong> y entrar.</p>
      <p style="margin:28px 0;text-align:center">
        <a href="${esc(link)}" style="background:#f5b800;color:#000;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">Entrar al portal ENERPRO</a>
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280">Si no esperabas este correo, puedes ignorarlo. El enlace caduca en 24 horas.</p>`,
    );

    await sendResendEmail(email, "Tu acceso al Portal del Empleado ENERPRO", html);

    return json({ ok: true, use_fallback: false });
  } catch (e) {
    console.error(e);
    const msg = String(e);
    const useFallback = msg.includes("RESEND_API_KEY");
    return json({ error: msg, use_fallback: useFallback }, useFallback ? 503 : 500);
  }
});
