-- ---------------------------------------------------------------------
-- 006. O que acontece com as solicitações quando um pet é adotado
--
-- Regra combinada:
--   - solicitação que tinha SOMENTE esse pet é encerrada como recusada,
--     e a pessoa recebe o e-mail explicando que não seguiu adiante;
--   - solicitação que tinha esse pet junto com outros continua aberta,
--     apenas sem o pet que já encontrou um lar.
--
-- Isso vale para qualquer caminho: botão de ação rápida na lista de pets,
-- formulário de edição ou conclusão dentro de uma solicitação.
--
-- Depende do 005 (e-mails) para o aviso sair. Rode depois dele.
-- ---------------------------------------------------------------------

create or replace function public.ajustar_solicitacoes_ao_adotar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    pedido     record;
    restantes  int;
    fechadas   int := 0;
    ajustadas  int := 0;
begin
    if new.status <> 'adotado' or old.status = 'adotado' then
        return new;
    end if;

    for pedido in
        select s.id
          from public.solicitacoes s
          join public.solicitacao_animais sa on sa.solicitacao_id = s.id
         where sa.animal_id = new.id
           and s.status in ('nova', 'em_analise')
    loop
        delete from public.solicitacao_animais
         where solicitacao_id = pedido.id
           and animal_id = new.id;

        select count(*) into restantes
          from public.solicitacao_animais
         where solicitacao_id = pedido.id;

        if restantes = 0 then
            update public.solicitacoes
               set status = 'recusada',
                   respondido_em = now()
             where id = pedido.id;
            fechadas := fechadas + 1;
        else
            ajustadas := ajustadas + 1;
        end if;
    end loop;

    if fechadas > 0 or ajustadas > 0 then
        raise notice 'Pet %: % solicitacao(oes) encerrada(s), % ajustada(s).',
            new.nome, fechadas, ajustadas;
    end if;

    return new;
end;
$$;

comment on function public.ajustar_solicitacoes_ao_adotar is
    'Encerra solicitacoes que dependiam do pet adotado e remove o pet das demais.';

drop trigger if exists trg_ajustar_solicitacoes_ao_adotar on public.animais;
create trigger trg_ajustar_solicitacoes_ao_adotar
    after update of status on public.animais
    for each row
    execute function public.ajustar_solicitacoes_ao_adotar();

-- ---------------------------------------------------------------------
-- Conferir depois de rodar
--
--   select a.nome, s.protocolo, s.status
--     from public.animais a
--     join public.solicitacao_animais sa on sa.animal_id = a.id
--     join public.solicitacoes s on s.id = sa.solicitacao_id
--    order by s.criado_em desc;
--
-- ---------------------------------------------------------------------
