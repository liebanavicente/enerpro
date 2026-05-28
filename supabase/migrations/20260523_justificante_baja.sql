-- Justificante opcional en solicitudes (excepto vacaciones)
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE public.vacaciones
  ADD COLUMN IF NOT EXISTS justificante_url text;

COMMENT ON COLUMN public.vacaciones.justificante_url IS
  'Ruta en bucket documentos ({empleado_id}/justificantes/...) del documento acreditativo';

CREATE OR REPLACE FUNCTION public.actualizar_justificante_vacacion(p_vacacion_id uuid, p_url text)
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
    SELECT 1 FROM public.vacaciones
    WHERE id = p_vacacion_id
      AND empleado_id = v_emp
      AND tipo IN ('baja_medica', 'visita_medica', 'permiso', 'asuntos_propios')
      AND estado IN ('pendiente', 'aprobada')
  ) THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no se puede actualizar';
  END IF;

  UPDATE public.vacaciones
  SET justificante_url = NULLIF(trim(p_url), '')
  WHERE id = p_vacacion_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_justificante_vacacion(uuid, text) TO authenticated;

-- Compatibilidad con despliegues anteriores
CREATE OR REPLACE FUNCTION public.actualizar_justificante_baja(p_vacacion_id uuid, p_url text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.actualizar_justificante_vacacion(p_vacacion_id, p_url);
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_justificante_baja(uuid, text) TO authenticated;
