-- ---------------------------------------------------------------------
-- 007. Link direto para a solicitação completa
--
-- Cada solicitação ganha um código impossível de adivinhar. Com ele, a ONG
-- abre uma página limpa, no formato de documento, e pode salvar em PDF pelo
-- próprio navegador.
--
-- O acesso é só por esse código: a tabela continua fechada. Quem tem o link
-- vê, quem não tem não vê. Se um link vazar, é só trocar o token da linha.
--
-- Rode depois do 006.
-- ---------------------------------------------------------------------

alter table public.solicitacoes
    add column if not exists token_publico uuid not null default gen_random_uuid();

create unique index if not exists solicitacoes_token_idx
    on public.solicitacoes (token_publico);

-- Endereço do site, usado nos links dos e-mails.
-- Para trocar de domínio sem mexer no código:
--   alter database postgres set adotapet.site_url = 'https://seudominio.com';
create or replace function public.url_site()
returns text
language sql
stable
as $$
    select coalesce(
        nullif(current_setting('adotapet.site_url', true), ''),
        'https://adotapet-five.vercel.app'
    );
$$;

create or replace function public.url_solicitacao(p_token uuid)
returns text
language sql
stable
as $$
    select public.url_site() || '/solicitacao/' || p_token::text;
$$;

-- Leitura pública pelo token. Devolve tudo o que a página precisa.
create or replace function public.solicitacao_publica(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_solicitacao public.solicitacoes;
    v_ong         public.ongs;
    v_pets        jsonb;
begin
    select * into v_solicitacao
      from public.solicitacoes
     where token_publico = p_token
     limit 1;

    if v_solicitacao.id is null then
        return null;
    end if;

    select * into v_ong from public.ongs where id = v_solicitacao.ong_id;

    select coalesce(
               jsonb_agg(
                   jsonb_build_object(
                       'nome', a.nome,
                       'slug', a.slug,
                       'foto', a.foto_url,
                       'especie', a.especie,
                       'sexo', a.sexo,
                       'porte', a.porte,
                       'idade_meses', a.idade_meses
                   )
                   order by a.nome
               ),
               '[]'::jsonb
           )
      into v_pets
      from public.solicitacao_animais sa
      join public.animais a on a.id = sa.animal_id
     where sa.solicitacao_id = v_solicitacao.id;

    return jsonb_build_object(
        'protocolo', v_solicitacao.protocolo,
        'status', v_solicitacao.status,
        'criado_em', v_solicitacao.criado_em,
        'nome', v_solicitacao.nome,
        'email', v_solicitacao.email,
        'telefone', v_solicitacao.telefone,
        'cidade', v_solicitacao.cidade,
        'uf', v_solicitacao.uf,
        'idade', v_solicitacao.idade,
        'pessoas_na_casa', v_solicitacao.pessoas_na_casa,
        'moradia', v_solicitacao.moradia,
        'pet_sozinho', v_solicitacao.pet_sozinho,
        'tem_telas', v_solicitacao.tem_telas,
        'mensagem', v_solicitacao.mensagem,
        'ong', jsonb_build_object(
            'nome', v_ong.nome,
            'slug', v_ong.slug,
            'email', v_ong.email,
            'whatsapp', v_ong.whatsapp,
            'cidade', v_ong.cidade,
            'uf', v_ong.uf
        ),
        'pets', v_pets
    );
end;
$$;

comment on function public.solicitacao_publica is
    'Devolve a solicitacao completa a partir do token publico, sem expor a tabela.';

revoke all on function public.solicitacao_publica(uuid) from public;
grant execute on function public.solicitacao_publica(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Conferir depois de rodar
--
--   select protocolo, public.url_solicitacao(token_publico) as link
--     from public.solicitacoes
--    order by criado_em desc
--    limit 5;
--
-- Para trocar o link de uma solicitação:
--   update public.solicitacoes
--      set token_publico = gen_random_uuid()
--    where protocolo = 'SOL-2026-0007';
-- ---------------------------------------------------------------------
