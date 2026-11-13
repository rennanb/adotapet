-- ---------------------------------------------------------------------------
-- 010 - Tabela de denúncias
-- Registra o que visitantes denunciam em fichas de animais e perfis de ONG.
-- A gravação é aberta (o visitante não tem conta), a leitura é restrita.
-- Rode no SQL Editor do Supabase.
-- ---------------------------------------------------------------------------

create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('animal', 'ong')),
  animal_slug text,
  ong_slug text,
  nome_exibido text not null,
  motivo text not null,
  descricao text not null,
  nome_denunciante text,
  contato text,
  pagina text,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_analise', 'resolvida', 'arquivada')),
  criado_em timestamptz not null default now()
);

create index if not exists denuncias_status_idx on public.denuncias (status, criado_em desc);
create index if not exists denuncias_ong_idx on public.denuncias (ong_slug);

alter table public.denuncias enable row level security;

-- Qualquer visitante pode registrar uma denúncia.
drop policy if exists "denuncia pode ser registrada" on public.denuncias;
create policy "denuncia pode ser registrada"
  on public.denuncias
  for insert
  to anon, authenticated
  with check (
    length(trim(descricao)) >= 20
    and length(trim(nome_exibido)) > 0
    and length(trim(motivo)) > 0
  );

-- Nenhuma policy de select: só o painel do Supabase (service role) lê os registros.

comment on table public.denuncias is
  'Denúncias enviadas pelo botão público das fichas e dos perfis de ONG.';
