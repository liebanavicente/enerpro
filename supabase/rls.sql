-- ENERPRO — Row Level Security (RLS) completo
-- Ejecutar en Supabase → SQL Editor (una sola vez, como postgres/service role).
-- Replica la lógica del portal: empleado ve/edita lo suyo; rol `coordinador` gestiona todo.

-- ─── Columna rol (migración re-ejecutable) ─────────────────

ALTER TABLE public.empleados
  ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'empleado';

UPDATE public.empleados
SET rol = 'coordinador'
WHERE rol = 'empleado'
  AND (
    cargo = 'Coordinador'
    OR lower(email) LIKE '%admin%'
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'empleados_rol_check'
  ) THEN
    ALTER TABLE public.empleados
      ADD CONSTRAINT empleados_rol_check CHECK (rol IN ('empleado', 'coordinador'));
  END IF;
END $$;

-- ─── Helpers ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_empleado_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id
  FROM empleados e
  WHERE lower(e.email) = lower(auth.jwt() ->> 'email')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_coordinador()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM empleados e
    WHERE lower(e.email) = lower(auth.jwt() ->> 'email')
      AND e.activo = true
      AND e.rol = 'coordinador'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_empleado_activo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM empleados e
    WHERE e.id = public.current_empleado_id()
      AND e.activo = true
  );
$$;

-- Autoregistro seguro (anon): evita SELECT abierto en solicitudes_registro
CREATE OR REPLACE FUNCTION public.crear_solicitud_registro(
  p_nombre text,
  p_email text,
  p_dni text,
  p_cargo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(trim(p_nombre), '') = ''
     OR coalesce(trim(p_email), '') = ''
     OR coalesce(trim(p_dni), '') = '' THEN
    RAISE EXCEPTION 'missing_fields' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM solicitudes_registro sr
    WHERE lower(sr.email) = lower(trim(p_email))
      AND sr.estado = 'aprobada'
  ) THEN
    RAISE EXCEPTION 'duplicate_approved' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM solicitudes_registro sr
    WHERE lower(sr.email) = lower(trim(p_email))
      AND sr.estado = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'duplicate_pending' USING ERRCODE = '23505';
  END IF;

  INSERT INTO solicitudes_registro (nombre, email, dni, cargo, estado)
  VALUES (
    trim(p_nombre),
    lower(trim(p_email)),
    upper(trim(p_dni)),
    coalesce(nullif(trim(p_cargo), ''), 'Vigilante de seguridad'),
    'pendiente'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_solicitud_registro(text, text, text, text) TO anon, authenticated;

-- Tabla autoregistro (si aún no existe)
CREATE TABLE IF NOT EXISTS public.solicitudes_registro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  dni text NOT NULL,
  cargo text NOT NULL DEFAULT 'Vigilante de seguridad',
  estado text NOT NULL DEFAULT 'pendiente',
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS solicitudes_registro_email_idx ON public.solicitudes_registro (lower(email));
CREATE INDEX IF NOT EXISTS solicitudes_registro_estado_idx ON public.solicitudes_registro (estado);

-- ─── Activar RLS ───────────────────────────────────────────

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_registro ENABLE ROW LEVEL SECURITY;

-- ─── Limpiar políticas anteriores (re-ejecutable) ──────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'empleados', 'documentos', 'solicitudes', 'vacaciones', 'turnos', 'solicitudes_registro'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- storage.objects (bucket documentos)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'enerpro_doc_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- ─── EMPLEADOS ─────────────────────────────────────────────

CREATE POLICY empleados_select ON public.empleados
  FOR SELECT TO authenticated
  USING (id = public.current_empleado_id() OR public.is_coordinador());

CREATE POLICY empleados_insert_coord ON public.empleados
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinador());

CREATE POLICY empleados_update_coord ON public.empleados
  FOR UPDATE TO authenticated
  USING (public.is_coordinador())
  WITH CHECK (public.is_coordinador());

CREATE POLICY empleados_update_own ON public.empleados
  FOR UPDATE TO authenticated
  USING (id = public.current_empleado_id())
  WITH CHECK (id = public.current_empleado_id());

CREATE POLICY empleados_delete_coord ON public.empleados
  FOR DELETE TO authenticated
  USING (public.is_coordinador());

-- ─── DOCUMENTOS ────────────────────────────────────────────

CREATE POLICY documentos_select ON public.documentos
  FOR SELECT TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY documentos_insert ON public.documentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY documentos_update ON public.documentos
  FOR UPDATE TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  )
  WITH CHECK (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY documentos_delete ON public.documentos
  FOR DELETE TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

-- ─── SOLICITUDES ───────────────────────────────────────────

CREATE POLICY solicitudes_select ON public.solicitudes
  FOR SELECT TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY solicitudes_insert_own ON public.solicitudes
  FOR INSERT TO authenticated
  WITH CHECK (
    empleado_id = public.current_empleado_id()
    AND public.is_empleado_activo()
    AND coalesce(estado, 'pendiente') = 'pendiente'
  );

CREATE POLICY solicitudes_update_coord ON public.solicitudes
  FOR UPDATE TO authenticated
  USING (public.is_coordinador())
  WITH CHECK (public.is_coordinador());

CREATE POLICY solicitudes_update_cancel ON public.solicitudes
  FOR UPDATE TO authenticated
  USING (
    empleado_id = public.current_empleado_id()
    AND public.is_empleado_activo()
    AND estado = 'pendiente'
  )
  WITH CHECK (
    empleado_id = public.current_empleado_id()
    AND estado = 'cancelada'
  );

CREATE POLICY solicitudes_delete_coord ON public.solicitudes
  FOR DELETE TO authenticated
  USING (public.is_coordinador());

-- ─── VACACIONES ────────────────────────────────────────────

CREATE POLICY vacaciones_select ON public.vacaciones
  FOR SELECT TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY vacaciones_insert_own ON public.vacaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    empleado_id = public.current_empleado_id()
    AND public.is_empleado_activo()
    AND coalesce(estado, 'pendiente') = 'pendiente'
  );

CREATE POLICY vacaciones_update_coord ON public.vacaciones
  FOR UPDATE TO authenticated
  USING (public.is_coordinador())
  WITH CHECK (public.is_coordinador());

CREATE POLICY vacaciones_update_cancel ON public.vacaciones
  FOR UPDATE TO authenticated
  USING (
    empleado_id = public.current_empleado_id()
    AND public.is_empleado_activo()
    AND estado = 'pendiente'
  )
  WITH CHECK (
    empleado_id = public.current_empleado_id()
    AND estado = 'cancelada'
  );

CREATE POLICY vacaciones_delete_coord ON public.vacaciones
  FOR DELETE TO authenticated
  USING (public.is_coordinador());

-- ─── TURNOS ────────────────────────────────────────────────

CREATE POLICY turnos_select ON public.turnos
  FOR SELECT TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY turnos_insert ON public.turnos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

CREATE POLICY turnos_update_coord ON public.turnos
  FOR UPDATE TO authenticated
  USING (public.is_coordinador())
  WITH CHECK (public.is_coordinador());

CREATE POLICY turnos_delete ON public.turnos
  FOR DELETE TO authenticated
  USING (
    public.is_coordinador()
    OR (empleado_id = public.current_empleado_id() AND public.is_empleado_activo())
  );

-- ─── SOLICITUDES REGISTRO (solo coordinador; alta vía RPC anon) ─

CREATE POLICY registro_select_coord ON public.solicitudes_registro
  FOR SELECT TO authenticated
  USING (public.is_coordinador());

CREATE POLICY registro_update_coord ON public.solicitudes_registro
  FOR UPDATE TO authenticated
  USING (public.is_coordinador())
  WITH CHECK (public.is_coordinador());

CREATE POLICY registro_delete_coord ON public.solicitudes_registro
  FOR DELETE TO authenticated
  USING (public.is_coordinador());

-- ─── STORAGE bucket «documentos» ─────────────────────────────
-- Rutas: {empleado_id}/{timestamp}_archivo.pdf

CREATE POLICY enerpro_doc_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      public.is_coordinador()
      OR (storage.foldername(name))[1] = public.current_empleado_id()::text
    )
  );

CREATE POLICY enerpro_doc_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND (
      public.is_coordinador()
      OR (storage.foldername(name))[1] = public.current_empleado_id()::text
    )
  );

CREATE POLICY enerpro_doc_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      public.is_coordinador()
      OR (storage.foldername(name))[1] = public.current_empleado_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'documentos'
    AND (
      public.is_coordinador()
      OR (storage.foldername(name))[1] = public.current_empleado_id()::text
    )
  );

CREATE POLICY enerpro_doc_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (
      public.is_coordinador()
      OR (storage.foldername(name))[1] = public.current_empleado_id()::text
    )
  );

-- ─── Trigger: solo coordinadores pueden cambiar rol ─────────

CREATE OR REPLACE FUNCTION public.empleados_protect_rol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rol IS DISTINCT FROM OLD.rol AND NOT public.is_coordinador() THEN
    RAISE EXCEPTION 'solo_coordinador_puede_cambiar_rol' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS empleados_protect_rol_trg ON public.empleados;
CREATE TRIGGER empleados_protect_rol_trg
  BEFORE UPDATE ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.empleados_protect_rol();
