-- 007: atributos personalizados por dibujo + borrado suave de proyectos.
-- Idempotente: se puede ejecutar más de una vez.
alter table drawings add column if not exists attributes jsonb default '{}'::jsonb;
alter table projects add column if not exists deleted_at timestamptz;
