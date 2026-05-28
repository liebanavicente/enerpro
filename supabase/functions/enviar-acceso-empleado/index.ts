import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  buildAccesoBienvenidaHtml,
  cors,
  esCoordinador,
  json,
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

    const html = wrapHtml(buildAccesoBienvenidaHtml(nombre, link));

    await sendResendEmail(email, "Tu acceso al Portal del Empleado ENERPRO", html);

    return json({ ok: true, use_fallback: false });
  } catch (e) {
    console.error(e);
    const msg = String(e);
    const useFallback = msg.includes("RESEND_API_KEY");
    return json({ error: msg, use_fallback: useFallback }, useFallback ? 503 : 500);
  }
});
