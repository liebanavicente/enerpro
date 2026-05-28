import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  cors,
  deleteAuthUserByEmail,
  esCoordinador,
  json,
  userClient,
} from "../_shared/email.ts";

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
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return json({ error: "Email inválido" }, 400);
    }

    if (email === userData.user.email.toLowerCase()) {
      return json({ error: "No puedes eliminar tu propia cuenta" }, 400);
    }

    const admin = adminClient();
    const authDeleted = await deleteAuthUserByEmail(admin, email);

    return json({ ok: true, auth_deleted: authDeleted });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
