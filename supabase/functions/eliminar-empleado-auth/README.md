# Edge Function: `eliminar-empleado-auth`

Elimina la cuenta **Supabase Auth** de un empleado (solo coordinadores). La app la invoca tras borrar la ficha y datos relacionados en BD.

## Desplegar (opcional)

Sin desplegar, el borrado en el portal elimina la ficha y datos; la cuenta Auth puede quedar huérfana (no podrá entrar al portal si no hay fila en `empleados`).

```bash
supabase functions deploy eliminar-empleado-auth
```

Usa los mismos secrets que el resto de funciones (`SUPABASE_SERVICE_ROLE_KEY` lo inyecta Supabase).
