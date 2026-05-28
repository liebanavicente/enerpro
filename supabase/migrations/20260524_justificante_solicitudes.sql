-- Justificante opcional en solicitudes (buzón)
-- Ejecutar en Supabase → SQL Editor (además de 20260523_justificante_baja.sql)

ALTER TABLE public.solicitudes
  ADD COLUMN IF NOT EXISTS justificante_url text;

CREATE OR REPLACE FUNCTION public.actualizar_justificante_solicitud(p_solicitud_id uuid, p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp uuid;
BEGIN
  v_emp := public.current_empleado_id();
  IF v_emp IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.solicitudes
    WHERE id = p_solicitud_id
      AND empleado_id = v_emp
      AND estado IN ('pendiente', 'aprobada')
  ) THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no se puede actualizar';
  END IF;

  UPDATE public.solicitudes
  SET justificante_url = NULLIF(trim(p_url), '')
  WHERE id = p_solicitud_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_justificante_solicitud(uuid, text) TO authenticated;
