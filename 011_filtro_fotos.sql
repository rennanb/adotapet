-- ---------------------------------------------------------------------------
-- 011 - Cada ONG escolhe o filtro das fotos
-- 0 = sem filtro, 10 = suave (padrão), 30 = médio
-- Rode no SQL Editor do Supabase.
-- ---------------------------------------------------------------------------
alter table public.ongs
  add column if not exists filtro_fotos smallint not null default 10
  check (filtro_fotos between 0 and 100);

comment on column public.ongs.filtro_fotos is
  'Intensidade do filtro âmbar aplicado nas fotos dos animais (0 a 100).';
