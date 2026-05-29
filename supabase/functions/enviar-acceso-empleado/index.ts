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
      return json({ ok: false, error: "No autorizado" });
    }

    const supabaseUser = userClient(authHeader);
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user?.email) {
      return json({ ok: false, error: "No autorizado: " + (userErr?.message || "sin usuario") });
    }

    if (!(await esCoordinador(supabaseUser, userData.user.email))) {
      return json({ ok: false, error: "Sin permisos: rol=" + userData.user.email });
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nombre = String(body.nombre || "").trim();
    const createUser = body.create_user === true;

    if (!email || !email.includes("@")) {
      return json({ error: "Email inválido" }, 400);
    }

    const admin = adminClient();
    let alreadyExisted = false;

    // Crear usuario Auth si se solicita (sin email de confirmación automático)
    if (createUser) {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,      // confirma sin enviar email de Supabase
        user_metadata: { nombre },
      });

      if (createErr) {
        const msg = createErr.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("already exists")) {
          alreadyExisted = true;
        } else {
          throw createErr;
        }
      }
    }

    // Generar link de recuperación (establece contraseña)
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

    return json({ ok: true, already_existed: alreadyExisted, user_created: true });
  } catch (e) {
    console.error(e);
    // user_created:true means auth account exists — caller can use resetPasswordForEmail as fallback
    return json({ ok: false, user_created: true, error: String(e) });
  }
});
