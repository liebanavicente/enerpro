-- Normaliza solicitudes.tipo de texto libre a snake_case
-- para alinear con el formato de vacaciones.tipo

UPDATE public.solicitudes SET tipo = 'vacaciones'       WHERE tipo = 'Solicitud de vacaciones';
UPDATE public.solicitudes SET tipo = 'permiso'           WHERE tipo = 'Solicitud de permiso';
UPDATE public.solicitudes SET tipo = 'cambio_turno'      WHERE tipo = 'Cambio de turno';
UPDATE public.solicitudes SET tipo = 'baja_medica'       WHERE tipo = 'Baja médica';
UPDATE public.solicitudes SET tipo = 'consulta_general'  WHERE tipo = 'Consulta general';

ALTER TABLE public.solicitudes
  ADD CONSTRAINT solicitudes_tipo_check
  CHECK (tipo IN ('vacaciones', 'permiso', 'cambio_turno', 'baja_medica', 'consulta_general'));
