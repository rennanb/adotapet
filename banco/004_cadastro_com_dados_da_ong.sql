-- ---------------------------------------------------------------------
-- 004. Cadastro da ONG com os dados que a pessoa digitou
--
-- Problema que este arquivo resolve:
-- a versao anterior adivinhava o nome da ONG pelo dominio do e-mail.
-- Com @gmail.com o nome virava "Ree-Nnan-Bs", ou seja, o endereco da
-- pessoa, e nao o nome da instituicao.
--
-- Agora a tela de cadastro envia nome, cidade, UF, WhatsApp, responsavel,
-- descricao e site junto do pedido de codigo, e este gatilho grava tudo.
-- Se os dados nao vierem, ele mantem o comportamento antigo como reserva.
-- ---------------------------------------------------------------------

create or replace function public.criar_ong_no_cadastro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
    v_nome    text;
    v_cidade  text;
    v_uf      text;
    v_zap     text;
    v_resp    text;
    v_sobre   text;
    v_site    text;
    v_base    text;
    v_slug    text;
    v_seq     int := 0;
    v_dominio text;
begin
    v_nome   := nullif(btrim(v_meta ->> 'nome'), '');
    v_cidade := nullif(btrim(v_meta ->> 'cidade'), '');
    v_uf     := upper(nullif(btrim(v_meta ->> 'uf'), ''));
    v_zap    := nullif(btrim(v_meta ->> 'whatsapp'), '');
    v_resp   := nullif(btrim(v_meta ->> 'responsavel'), '');
    v_sobre  := nullif(btrim(v_meta ->> 'sobre'), '');
    v_site   := nullif(btrim(v_meta ->> 'site'), '');

    -- O slug nasce do nome da ONG, que e o que aparece na URL publica.
    -- Sem nome, cai na regra antiga: dominio do e-mail ou parte antes do @.
    if v_nome is not null then
        v_base := public.slugify(v_nome);
    else
        v_dominio := split_part(split_part(coalesce(new.email, ''), '@', 2), '.', 1);
        if v_dominio in ('gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'live', 'bol', 'uol', 'terra') then
            v_base := public.slugify(split_part(coalesce(new.email, 'ong'), '@', 1));
        else
            v_base := public.slugify(v_dominio);
        end if;
    end if;

    if v_base = '' or v_base is null then
        v_base := 'ong';
    end if;

    v_slug := v_base;
    while exists (select 1 from public.ongs where slug = v_slug) loop
        v_seq := v_seq + 1;
        v_slug := v_base || '-' || v_seq::text;
    end loop;

    insert into public.ongs (
        user_id, slug, nome, email, status,
        cidade, uf, whatsapp, responsavel_nome, sobre, site_instagram
    )
    values (
        new.id,
        v_slug,
        coalesce(v_nome, initcap(v_base)),
        lower(new.email),
        'pendente',
        v_cidade,
        case when v_uf is null then null else left(v_uf, 2) end,
        v_zap,
        v_resp,
        v_sobre,
        v_site
    )
    on conflict (user_id) do nothing;

    return new;
end;
$$;

comment on function public.criar_ong_no_cadastro is
    'Cria a ONG no primeiro acesso. Usa os dados enviados pela tela de cadastro
     (raw_user_meta_data) e, na falta deles, deriva nome e slug do e-mail.';

-- ---------------------------------------------------------------------
-- Conferir depois de rodar:
--
--   select nome, slug, cidade, uf, whatsapp, responsavel_nome, status
--   from public.ongs order by criado_em desc;
-- ---------------------------------------------------------------------
