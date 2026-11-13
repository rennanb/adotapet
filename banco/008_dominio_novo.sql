-- Troca do endereço usado nos links dos e-mails.
-- O Supabase não permite "alter database ... set adotapet.site_url"
-- (erro 42501), então o endereço fica gravado direto na função.

create or replace function public.url_site()
returns text
language sql
stable
as $$
    select 'https://adotapet-conteex.vercel.app'::text;
$$;

-- Conferir o resultado (deve mostrar o domínio novo)
select public.url_site() as endereco_do_site;

-- Conferir um link de solicitação de verdade, usando um token existente.
-- Se vier 0 linhas, é porque ainda não existe solicitação criada: sem problema.
select public.url_solicitacao(token_publico) as exemplo_de_link
from public.solicitacoes
where token_publico is not null
order by criado_em desc
limit 1;
