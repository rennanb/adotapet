-- =====================================================================
-- AdotaPet - schema completo para Supabase
-- Projeto: Sistema Web de Adocao Responsavel (CONTEEX 2026-2)
--
-- COMO USAR
--   1. Abra o projeto no Supabase
--   2. Menu lateral: SQL Editor > New query
--   3. Cole TODO este arquivo e clique em Run
--
-- Este script foi escrito a partir dos campos que existem nas telas do
-- app, entao nomes de coluna e opcoes de status batem com o formulario.
--
-- Pode rodar mais de uma vez: tabelas, indices e politicas sao recriados
-- sem erro. Os dados de demonstracao ficam no final, em bloco separado.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Extensoes
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. Tipos do dominio
-- Os valores espelham as opcoes que aparecem no app:
--   animal:      disponivel | em processo | adotado | indisponivel | rascunho
--   solicitacao: nova | em analise | concluida | recusada | cancelada
-- ---------------------------------------------------------------------
do $$ begin
    create type public.ong_status as enum ('pendente', 'ativa', 'suspensa');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.animal_status as enum
        ('disponivel', 'em_processo', 'adotado', 'indisponivel', 'rascunho');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.solicitacao_status as enum
        ('nova', 'em_analise', 'concluida', 'recusada', 'cancelada');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Funcoes utilitarias
-- ---------------------------------------------------------------------

-- "Amigos de Patas" -> "amigos-de-patas".
-- Feito com translate para nao depender da extensao unaccent.
create or replace function public.slugify(p_texto text)
returns text
language sql
immutable
as $$
    select trim(both '-' from
        regexp_replace(
            translate(
                lower(coalesce(p_texto, '')),
                'áàâãäéèêëíìîïóòôõöúùûüçñ',
                'aaaaaeeeeiiiiooooouuuucn'
            ),
            '[^a-z0-9]+', '-', 'g'
        )
    );
$$;

-- Mantem atualizado_em correto sem depender do front.
create or replace function public.define_atualizado_em()
returns trigger
language plpgsql
as $$
begin
    new.atualizado_em := now();
    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. ONGs
-- Uma linha por organizacao. user_id liga a ONG ao login do Supabase
-- (auth.users). Fica nulo apenas nos dados de demonstracao.
-- Campos conferidos com a tela "Dados da ONG".
-- ---------------------------------------------------------------------
create table if not exists public.ongs (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid unique references auth.users (id) on delete set null,
    slug                text not null unique,
    nome                text not null,
    razao_social        text,
    cnpj                text unique,
    email               text not null unique,
    email_verificado_em timestamptz,
    responsavel_nome    text,
    whatsapp            text,
    site_instagram      text,
    cidade              text,
    uf                  char(2),
    endereco            text,
    sobre               text,
    fundada_em          date,
    logo_url            text,
    capa_url            text,
    status              public.ong_status not null default 'pendente',
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),
    constraint ongs_email_minusculo check (email = lower(email)),
    constraint ongs_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.ongs is
    'Organizacao responsavel pelos animais. Tambem e o usuario do sistema.';
comment on column public.ongs.user_id is
    'Vinculo com auth.users: quem faz login com o e-mail da ONG.';
comment on column public.ongs.slug is
    'Aparece na URL publica: /ong/amigos-de-patas';
comment on column public.ongs.site_instagram is
    'Campo "Site ou Instagram" da tela de dados da ONG.';

-- ---------------------------------------------------------------------
-- 4. Animais
-- O slug e a chave publica que vive dentro do QR Code impresso.
-- Ele e gerado automaticamente e nao deve mudar depois de impresso.
-- ---------------------------------------------------------------------
create table if not exists public.animais (
    id                  uuid primary key default gen_random_uuid(),
    ong_id              uuid not null references public.ongs (id) on delete cascade,
    slug                text unique,
    nome                text not null,
    especie             text not null check (especie in ('cao', 'gato')),
    sexo                text not null check (sexo in ('macho', 'femea')),
    porte               text not null check (porte in ('pequeno', 'medio', 'grande')),
    raca                text,
    idade_meses         smallint check (idade_meses between 0 and 360),
    castrado            boolean not null default false,
    vacinado            boolean not null default false,
    vermifugado         boolean not null default false,
    condicoes_especiais text,
    nota_saude          text,
    temperamento        text[],
    descricao           text,
    cuidados            text,
    cidade              text,
    uf                  char(2),
    foto_url            text,
    foto_enquadramento  text not null default 'rosto'
                        check (foto_enquadramento in ('rosto', 'topo', 'centro')),
    foto_foco_x         smallint not null default 50 check (foto_foco_x between 0 and 100),
    foto_foco_y         smallint not null default 30 check (foto_foco_y between 0 and 100),
    foto_zoom           numeric(3, 2) not null default 1 check (foto_zoom between 1 and 3),
    status              public.animal_status not null default 'disponivel',
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),
    constraint animais_slug_formato
        check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.animais is
    'Animal disponivel para adocao. O slug e a chave usada no QR Code.';
comment on column public.animais.idade_meses is
    'O formulario pede anos e meses; guardamos tudo em meses.';
comment on column public.animais.condicoes_especiais is
    'Campo "Condicoes especiais" da aba Saude: alergia, medicacao continua...';
comment on column public.animais.nota_saude is
    'Etiqueta curta exibida na ficha, por exemplo FIV+ ou FELV+.';
comment on column public.animais.foto_enquadramento is
    'Ponto focal escolhido no cadastro: rosto, topo ou centro.';
comment on column public.animais.cidade is
    'Cidade onde o animal esta, usada no "Esta em ..." da ficha publica.';

-- ---------------------------------------------------------------------
-- 5. Galeria de fotos
-- O formulario aceita varias fotos; a ficha publica mostra 1 / 3.
-- A primeira foto (ordem 0) e a capa e tambem vai para animais.foto_url.
-- ---------------------------------------------------------------------
create table if not exists public.animal_fotos (
    id        uuid primary key default gen_random_uuid(),
    animal_id uuid not null references public.animais (id) on delete cascade,
    url       text not null,
    ordem     smallint not null default 0,
    criado_em timestamptz not null default now(),
    unique (animal_id, ordem)
);

comment on table public.animal_fotos is
    'Fotos da galeria do animal. ordem 0 e a capa.';

-- Gera o slug automaticamente: "Caramelo" -> "caramelo-a1b2".
create or replace function public.gera_slug_animal()
returns trigger
language plpgsql
as $$
declare
    v_base      text;
    v_candidato text;
    v_tentativa int := 0;
begin
    if new.slug is not null and new.slug <> '' then
        return new;
    end if;

    v_base := public.slugify(new.nome);
    if v_base = '' then
        v_base := 'pet';
    end if;

    v_candidato := v_base || '-' || substr(replace(new.id::text, '-', ''), 1, 4);

    while exists (select 1 from public.animais where slug = v_candidato) loop
        v_tentativa := v_tentativa + 1;
        v_candidato := v_base || '-' || substr(replace(new.id::text, '-', ''), 1, 4)
                       || v_tentativa::text;
    end loop;

    new.slug := v_candidato;
    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Solicitacoes de adocao
-- Campos conferidos com o formulario publico (4 passos).
-- ---------------------------------------------------------------------
create table if not exists public.solicitacoes (
    id                  uuid primary key default gen_random_uuid(),
    protocolo           text not null unique,
    ong_id              uuid not null references public.ongs (id) on delete cascade,
    animal_principal_id uuid not null references public.animais (id) on delete restrict,
    nome                text not null,
    email               text not null,
    telefone            text,
    cidade              text,
    uf                  char(2),
    idade               smallint check (idade between 16 and 120),
    pessoas_na_casa     smallint check (pessoas_na_casa between 0 and 50),
    moradia             text check (moradia in ('casa', 'apartamento', 'chacara')),
    pet_sozinho         text check (pet_sozinho in ('ate_4h', '4_a_8h', 'mais_de_8h')),
    tem_criancas        boolean,
    tem_outros_animais  boolean,
    tem_telas           text check (tem_telas in ('todas', 'algumas', 'nao')),
    mensagem            text,
    consentimento_lgpd  boolean not null default false,
    status              public.solicitacao_status not null default 'nova',
    respondido_em       timestamptz,
    ip                  inet,
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),
    constraint solicitacoes_email_minusculo check (email = lower(email)),
    constraint solicitacoes_consentimento check (consentimento_lgpd)
);

comment on table public.solicitacoes is
    'Pedido de adocao enviado pelo formulario publico. Nunca e criado pelo front direto: usa a funcao criar_solicitacao.';
comment on column public.solicitacoes.tem_telas is
    'Pergunta que aparece quando o pet e gato: todas, algumas ou nao.';
comment on column public.solicitacoes.pet_sozinho is
    'Quanto tempo o pet ficaria sozinho por dia.';

-- ---------------------------------------------------------------------
-- 7. Ligacao N:N entre solicitacao e animais
-- Existe porque a pessoa pode pedir mais de um pet no mesmo pedido.
-- ---------------------------------------------------------------------
create table if not exists public.solicitacao_animais (
    solicitacao_id uuid not null references public.solicitacoes (id) on delete cascade,
    animal_id      uuid not null references public.animais (id) on delete restrict,
    primary key (solicitacao_id, animal_id)
);

comment on table public.solicitacao_animais is
    'Animais vinculados a uma mesma solicitacao (relacionamento N:N).';

-- ---------------------------------------------------------------------
-- 8. Indices
-- ---------------------------------------------------------------------
create index if not exists animais_ong_status_idx on public.animais (ong_id, status);
create index if not exists animais_publicos_idx on public.animais (status, criado_em desc);
create index if not exists animal_fotos_animal_idx on public.animal_fotos (animal_id, ordem);
create index if not exists solicitacoes_ong_data_idx on public.solicitacoes (ong_id, criado_em desc);
create index if not exists solicitacoes_animal_idx on public.solicitacoes (animal_principal_id);
create index if not exists solicitacoes_status_idx on public.solicitacoes (status);
create index if not exists solicitacao_animais_animal_idx on public.solicitacao_animais (animal_id);

-- ---------------------------------------------------------------------
-- 9. Gatilhos
-- ---------------------------------------------------------------------
drop trigger if exists ongs_atualizado_em on public.ongs;
create trigger ongs_atualizado_em
    before update on public.ongs
    for each row execute function public.define_atualizado_em();

drop trigger if exists animais_atualizado_em on public.animais;
create trigger animais_atualizado_em
    before update on public.animais
    for each row execute function public.define_atualizado_em();

drop trigger if exists solicitacoes_atualizado_em on public.solicitacoes;
create trigger solicitacoes_atualizado_em
    before update on public.solicitacoes
    for each row execute function public.define_atualizado_em();

drop trigger if exists animais_slug on public.animais;
create trigger animais_slug
    before insert on public.animais
    for each row execute function public.gera_slug_animal();

-- ---------------------------------------------------------------------
-- 10. Integracao com o login do Supabase
-- No primeiro acesso com o e-mail da ONG, o Supabase cria auth.users e o
-- gatilho abaixo cria a ONG em status pendente. Ao confirmar o e-mail,
-- a ONG passa para ativa.
-- ---------------------------------------------------------------------
create or replace function public.criar_ong_no_cadastro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_base text;
    v_slug text;
    v_nome text;
    v_seq  int := 0;
    v_dominio text;
begin
    -- O slug nasce do dominio do e-mail: contato@novaaong.org.br -> novaaong.
    -- Em provedor gratuito (gmail, hotmail...), usa a parte antes do @.
    v_dominio := split_part(split_part(coalesce(new.email, ''), '@', 2), '.', 1);
    if v_dominio in ('gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'live', 'bol', 'uol', 'terra') then
        v_base := public.slugify(split_part(coalesce(new.email, 'ong'), '@', 1));
    else
        v_base := public.slugify(v_dominio);
    end if;
    if v_base = '' then
        v_base := 'ong';
    end if;

    v_slug := v_base;
    while exists (select 1 from public.ongs where slug = v_slug) loop
        v_seq := v_seq + 1;
        v_slug := v_base || '-' || v_seq::text;
    end loop;

    v_nome := coalesce(new.raw_user_meta_data ->> 'nome', initcap(v_base));

    insert into public.ongs (user_id, slug, nome, email, status)
    values (new.id, v_slug, v_nome, lower(new.email), 'pendente')
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.criar_ong_no_cadastro();

create or replace function public.confirma_email_ong()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.email_confirmed_at is not null and old.email_confirmed_at is null then
        update public.ongs
           set email_verificado_em = now(),
               status = 'ativa'
         where user_id = new.id;
    end if;
    return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
    after update on auth.users
    for each row execute function public.confirma_email_ong();

-- ---------------------------------------------------------------------
-- 11. Funcao que o front chama para criar a solicitacao
-- Roda com privilegios do dono (security definer), entao o visitante
-- anonimo grava a solicitacao sem poder ler nada.
-- Regras: consentimento obrigatorio, pet disponivel, extras da mesma
-- ONG e, se for gato, a resposta sobre telas e obrigatoria.
-- ---------------------------------------------------------------------
create sequence if not exists public.protocolo_seq start 1;

-- remove a versao anterior (smallint) para nao ficarem duas funcoes iguais
drop function if exists public.criar_solicitacao(
    text, text[], text, text, text, text, text, smallint, smallint,
    text, text, text, text, boolean
);

create or replace function public.criar_solicitacao(
    p_animal_slug   text,
    p_extras        text[],
    p_nome          text,
    p_email         text,
    p_telefone      text,
    p_cidade        text,
    p_uf            text,
    p_idade         integer,
    p_pessoas_casa  integer,
    p_moradia       text,
    p_pet_sozinho   text,
    p_tem_telas     text,
    p_mensagem      text,
    p_consentimento boolean
)
returns table (protocolo text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_animal    public.animais;
    v_id        uuid;
    v_protocolo text;
begin
    if p_consentimento is not true then
        raise exception 'CONSENTIMENTO_OBRIGATORIO';
    end if;

    select a.* into v_animal
      from public.animais a
     where a.slug = p_animal_slug
       and a.status = 'disponivel';

    if not found then
        raise exception 'ANIMAL_INDISPONIVEL';
    end if;

    -- se o pet e gato, a pergunta sobre telas precisa ser respondida
    if v_animal.especie = 'gato' and p_tem_telas is null then
        raise exception 'TELAS_OBRIGATORIO';
    end if;

    -- os pets extras precisam ser da mesma ONG e estar disponiveis
    if exists (
        select 1
          from unnest(coalesce(p_extras, '{}'::text[])) as s(slug)
          left join public.animais a on a.slug = s.slug
         where a.id is null
            or a.ong_id <> v_animal.ong_id
            or a.status <> 'disponivel'
    ) then
        raise exception 'ANIMAL_EXTRA_INVALIDO';
    end if;

    v_protocolo := 'SOL-' || to_char(now(), 'YYYY') || '-' ||
                   lpad(nextval('public.protocolo_seq')::text, 4, '0');

    insert into public.solicitacoes (
        protocolo, ong_id, animal_principal_id, nome, email, telefone, cidade, uf,
        idade, pessoas_na_casa, moradia, pet_sozinho, tem_telas, mensagem,
        consentimento_lgpd
    ) values (
        v_protocolo, v_animal.ong_id, v_animal.id, p_nome, lower(p_email),
        p_telefone, p_cidade, nullif(upper(p_uf), '')::char(2), p_idade,
        p_pessoas_casa, p_moradia, p_pet_sozinho, p_tem_telas, p_mensagem, true
    ) returning id into v_id;

    insert into public.solicitacao_animais (solicitacao_id, animal_id)
    values (v_id, v_animal.id)
    on conflict do nothing;

    insert into public.solicitacao_animais (solicitacao_id, animal_id)
    select v_id, a.id
      from public.animais a
     where a.slug = any (coalesce(p_extras, '{}'::text[]))
    on conflict do nothing;

    return query select v_protocolo;
end;
$$;

comment on function public.criar_solicitacao is
    'Registra solicitacao de adocao com 1..N animais da mesma ONG em uma unica transacao.';

-- ---------------------------------------------------------------------
-- 12. Row Level Security
-- Visitante le apenas o que e publico; ONG logada mexe so no que e dela;
-- solicitacao entra somente pela funcao acima.
-- ---------------------------------------------------------------------
alter table public.ongs                enable row level security;
alter table public.animais             enable row level security;
alter table public.animal_fotos        enable row level security;
alter table public.solicitacoes        enable row level security;
alter table public.solicitacao_animais enable row level security;

create or replace function public.minha_ong_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select id from public.ongs where user_id = auth.uid();
$$;

-- ONGs
drop policy if exists ongs_leitura_publica on public.ongs;
create policy ongs_leitura_publica on public.ongs
    for select to anon, authenticated
    using (status = 'ativa' or user_id = auth.uid());

drop policy if exists ongs_atualiza_propria on public.ongs;
create policy ongs_atualiza_propria on public.ongs
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Animais
drop policy if exists animais_leitura_publica on public.animais;
create policy animais_leitura_publica on public.animais
    for select to anon, authenticated
    using (status = 'disponivel' or ong_id = public.minha_ong_id());

drop policy if exists animais_da_ong on public.animais;
create policy animais_da_ong on public.animais
    for all to authenticated
    using (ong_id = public.minha_ong_id())
    with check (ong_id = public.minha_ong_id());

-- Fotos da galeria
drop policy if exists animal_fotos_publicas on public.animal_fotos;
create policy animal_fotos_publicas on public.animal_fotos
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.animais a
             where a.id = animal_id
               and (a.status = 'disponivel' or a.ong_id = public.minha_ong_id())
        )
    );

drop policy if exists animal_fotos_da_ong on public.animal_fotos;
create policy animal_fotos_da_ong on public.animal_fotos
    for all to authenticated
    using (
        exists (
            select 1 from public.animais a
             where a.id = animal_id
               and a.ong_id = public.minha_ong_id()
        )
    )
    with check (
        exists (
            select 1 from public.animais a
             where a.id = animal_id
               and a.ong_id = public.minha_ong_id()
        )
    );

-- Solicitacoes (nao existe policy de insert: so a funcao grava)
drop policy if exists solicitacoes_da_ong on public.solicitacoes;
create policy solicitacoes_da_ong on public.solicitacoes
    for select to authenticated
    using (ong_id = public.minha_ong_id());

drop policy if exists solicitacoes_da_ong_atualiza on public.solicitacoes;
create policy solicitacoes_da_ong_atualiza on public.solicitacoes
    for update to authenticated
    using (ong_id = public.minha_ong_id())
    with check (ong_id = public.minha_ong_id());

-- Animais dentro da solicitacao
drop policy if exists solicitacao_animais_da_ong on public.solicitacao_animais;
create policy solicitacao_animais_da_ong on public.solicitacao_animais
    for select to authenticated
    using (
        exists (
            select 1 from public.solicitacoes s
             where s.id = solicitacao_id
               and s.ong_id = public.minha_ong_id()
        )
    );

-- Permissoes de execucao da funcao publica
-- Permissoes de tabela.
-- O RLS decide QUAIS LINHAS cada um enxerga; o GRANT decide quais
-- operacoes sao permitidas. Os dois juntos e que protegem de verdade,
-- e por isso o script nao depende da opcao "expose tables" do painel.
grant usage on schema public to anon, authenticated;

grant select on public.ongs, public.animais, public.animal_fotos to anon;

grant select, insert, update, delete
    on public.ongs, public.animais, public.animal_fotos to authenticated;
grant select, update on public.solicitacoes to authenticated;
grant select on public.solicitacao_animais to authenticated;

-- anon nao recebe nada em solicitacoes: quem grava e a funcao abaixo.

-- Permissoes de execucao da funcao publica
grant execute on function public.criar_solicitacao(
    text, text[], text, text, text, text, text, integer, integer,
    text, text, text, text, boolean
) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 13. Armazenamento das fotos
-- Bucket publico para leitura; envio apenas por ONG autenticada.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists fotos_leitura_publica on storage.objects;
create policy fotos_leitura_publica on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'fotos');

drop policy if exists fotos_envio_ong on storage.objects;
create policy fotos_envio_ong on storage.objects
    for insert to authenticated
    with check (bucket_id = 'fotos' and owner = auth.uid());

drop policy if exists fotos_alteracao_ong on storage.objects;
create policy fotos_alteracao_ong on storage.objects
    for update to authenticated
    using (bucket_id = 'fotos' and owner = auth.uid());

drop policy if exists fotos_remocao_ong on storage.objects;
create policy fotos_remocao_ong on storage.objects
    for delete to authenticated
    using (bucket_id = 'fotos' and owner = auth.uid());

-- ---------------------------------------------------------------------
-- 14. Visao pronta para a pagina publica
-- Entrega pet + ONG em uma consulta so, ja respeitando a RLS.
-- ---------------------------------------------------------------------
create or replace view public.vw_pets_publicos
with (security_invoker = true)
as
select
    a.id,
    a.slug,
    a.nome,
    a.especie,
    a.sexo,
    a.porte,
    a.raca,
    a.idade_meses,
    a.castrado,
    a.vacinado,
    a.vermifugado,
    a.condicoes_especiais,
    a.nota_saude,
    a.temperamento,
    a.descricao,
    a.cuidados,
    a.cidade,
    a.uf,
    a.foto_url,
    a.foto_enquadramento,
    a.foto_foco_x,
    a.foto_foco_y,
    a.foto_zoom,
    o.id       as ong_id,
    o.nome     as ong_nome,
    o.slug     as ong_slug,
    o.cidade   as ong_cidade,
    o.uf       as ong_uf,
    o.whatsapp as ong_whatsapp,
    o.logo_url as ong_logo_url,
    o.capa_url as ong_capa_url
from public.animais a
join public.ongs o on o.id = a.ong_id
where a.status = 'disponivel'
  and o.status = 'ativa';

comment on view public.vw_pets_publicos is
    'Pets visiveis na area publica, com os dados da ONG responsavel.';

-- a visao e lida pelo site publico, entao recebe permissao depois de existir
grant select on public.vw_pets_publicos to anon, authenticated;

commit;

-- =====================================================================
-- 15. DADOS DE DEMONSTRACAO (opcional)
-- Rode este bloco separado, so se quiser o app com conteudo no inicio.
-- A ONG de exemplo nao tem login: serve para o site publico e o QR.
-- =====================================================================
begin;

insert into public.ongs (id, slug, nome, email, email_verificado_em, responsavel_nome,
                         whatsapp, site_instagram, cidade, uf, sobre, fundada_em, status)
values ('11111111-1111-4111-8111-111111111111',
        'amigos-de-patas',
        'Amigos de Patas',
        'contato@amigosdepatas.org.br',
        now(),
        'Patricia Lima',
        '11987654321',
        '@amigosdepatas',
        'Sao Paulo', 'SP',
        'Resgatamos, cuidamos e encontramos familias responsaveis para animais em situacao de vulnerabilidade desde 2018.',
        '2018-03-01',
        'ativa')
on conflict (email) do nothing;

insert into public.animais (id, ong_id, slug, nome, especie, sexo, porte, raca, idade_meses,
                            castrado, vacinado, vermifugado, condicoes_especiais, nota_saude,
                            temperamento, descricao, cuidados, cidade, uf,
                            foto_enquadramento, status)
values
 -- os slugs batem com os links de demonstracao do app (/p/caramelo-a1b2)
 ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111',
  'caramelo-a1b2', 'Caramelo', 'cao', 'macho', 'medio', 'SRD', 24,
  true, true, true, null, null,
  array['Brincalhao', 'Carinhoso', 'Sociavel com criancas'],
  'Encontrado perto de uma escola, chegou timido e virou companheiro alegre e carinhoso.',
  'Racao seca, vermifugacao anual.', 'Sao Paulo', 'SP', 'rosto', 'disponivel'),

 ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
  'mel-c3d4', 'Mel', 'cao', 'femea', 'pequeno', 'Poodle mistura', 8,
  true, true, true, null, null,
  array['Tranquila', 'Docil'],
  'Mel e tranquila, docil e adora ficar perto de pessoas.',
  'Escovacao semanal.', 'Sao Paulo', 'SP', 'topo', 'disponivel'),

 ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111111',
  'tigrao-e5f6', 'Tigrao', 'cao', 'macho', 'grande', 'SRD', 48,
  true, true, true, null, 'FIV+',
  array['Companheiro', 'Calmo'],
  'Tigrao e companheiro, calmo e busca uma familia paciente.',
  'Acompanhamento veterinario anual.', 'Sao Paulo', 'SP', 'rosto', 'disponivel'),

 ('22222222-2222-4222-8222-222222222224', '11111111-1111-4111-8111-111111111111',
  'nina-g7h8', 'Nina', 'cao', 'femea', 'medio', 'SRD', 36,
  true, true, true, null, null,
  array['Calma', 'Carinhosa'],
  'Nina ja encontrou sua familia e virou exemplo de adocao responsavel.',
  'Racao seca.', 'Sao Paulo', 'SP', 'centro', 'adotado'),

 ('22222222-2222-4222-8222-222222222225', '11111111-1111-4111-8111-111111111111',
  'bento-j9k0', 'Bento', 'gato', 'macho', 'pequeno', 'SRD', 12,
  true, true, true, null, null,
  array['Curioso', 'Brincalhao'],
  'Bento adora uma caixa de papelao e um lugar alto para observar a casa.',
  'Ambiente telado, areia limpa todo dia.', 'Sao Paulo', 'SP', 'rosto', 'disponivel')
on conflict (id) do nothing;

commit;

-- =====================================================================
-- 16. CONFERENCIA
-- Rode depois de tudo para ver se o banco esta pronto.
-- =====================================================================
-- select nome, slug, status from public.ongs;
-- select nome, slug, status, idade_meses from public.animais order by nome;
-- select * from public.vw_pets_publicos;
--
-- Teste da funcao de solicitacao (deve devolver SOL-2026-0001):
-- select * from public.criar_solicitacao(
--     'caramelo-a1b2', array['mel-c3d4'],
--     'Ana Souza', 'ana@exemplo.com', '11999998888', 'Sao Paulo', 'SP',
--     29, 3, 'apartamento', 'ate_4h', null, 'Tenho quintal telado.', true);
--
-- Teste com gato: a resposta sobre telas e obrigatoria.
-- select * from public.criar_solicitacao(
--     'bento-j9k0', '{}', 'Ana Souza', 'ana@exemplo.com', null, null, null,
--     null, null, null, null, 'todas', null, true);
--
-- Teste que deve falhar (pet adotado):
-- select * from public.criar_solicitacao(
--     'caramelo-a1b2', array['tigrao-e5f6'],
--     'Ana Souza', 'ana@exemplo.com', null, null, null, null, null, null, null, null, null, true);
