-- =====================================================================
-- 012 - PROCESSO, SEGURANÇA E TERMOS NO E-MAIL DO SOLICITANTE
--
-- O que este arquivo faz:
--   Substitui a função que monta o e-mail de confirmação enviado para
--   quem se candidatou, acrescentando duas orientações:
--     1. a ONG analisa o pedido e pode pedir documentos, marcar conversa
--        ou agendar visita, com processo e prazo próprios de cada ONG;
--     2. a adoção não deve envolver pagamento pelo animal;
--     3. o que acontece com os dados enviados no formulário;
--     4. links para os Termos de Uso e a Política de Privacidade.
--
-- Como aplicar:
--   Cole este arquivo inteiro no SQL Editor do Supabase e execute.
--   Pode rodar mais de uma vez, sem duplicar dados.
-- =====================================================================

create or replace function public.avisar_nova_solicitacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_ong_email text;
    v_ong_nome  text;
    v_ong_whats text;
    v_pets      text;
    v_quando    text;
    v_local     text;
    v_contato   text;
    v_corpo     text;
begin
    select o.email, o.nome, o.whatsapp
      into v_ong_email, v_ong_nome, v_ong_whats
      from public.ongs o
     where o.id = new.ong_id;

    select string_agg(a.nome, ', ' order by a.nome) into v_pets
      from public.solicitacao_animais sa
      join public.animais a on a.id = sa.animal_id
     where sa.solicitacao_id = new.id;

    v_quando := to_char(new.criado_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');
    v_local := coalesce(nullif(concat_ws('/', new.cidade, new.uf), ''), 'não informado');
    v_contato := concat_ws(' ou ', nullif(new.email, ''), nullif(new.telefone, ''));

    -- e-mail para a ONG
    v_corpo := format(
        '<p style="margin:0 0 18px 0;">Chegou uma nova solicitação de adoção para <strong>%s</strong>. Os dados estão abaixo.</p>
         %s
         <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
                style="font-family:''Inter'',-apple-system,''Segoe UI'',Roboto,Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2937;">
           <tr><td style="color:#6b7280;padding:2px 0;">Pessoa</td><td style="text-align:right;font-weight:600;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">E-mail</td><td style="text-align:right;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Telefone</td><td style="text-align:right;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Cidade</td><td style="text-align:right;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Pets</td><td style="text-align:right;font-weight:600;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Recebida em</td><td style="text-align:right;">%s</td></tr>
         </table>
         <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
           <tr>
             <td align="center" style="padding-top:22px;">
               <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                 <tr>
                   <td align="center" bgcolor="#f59e0b" style="border-radius:12px;">
                     <a href="%s" style="display:inline-block;padding:14px 26px;font-family:''Inter'',-apple-system,''Segoe UI'',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#15181e;text-decoration:none;border-radius:12px;">Ver solicitação completa</a>
                   </td>
                 </tr>
               </table>
             </td>
           </tr>
         </table>
         <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">O link abre a solicitação em formato de documento, com todas as respostas do formulário. Dá para salvar em PDF pelo próprio navegador.</p>
         <p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">A conversa segue por sua conta, pelo e-mail ou WhatsApp da pessoa. Abra o painel para ver todas as respostas do formulário e atualizar o andamento. Ao recusar ou concluir, o AdotaPet avisa quem se candidatou.</p>',
        coalesce(v_ong_nome, 'sua ONG'),
        public.caixa_protocolo(new.protocolo),
        coalesce(new.nome, 'não informado'),
        coalesce(new.email, 'não informado'),
        coalesce(new.telefone, 'não informado'),
        v_local,
        coalesce(v_pets, 'não informado'),
        v_quando,
        public.url_solicitacao(new.token_publico)
    );

    perform public.enviar_email(
        v_ong_email,
        format('Nova solicitação de adoção %s', new.protocolo),
        public.modelo_email('Uma família quer adotar', v_corpo, v_ong_email)
    );

    -- confirmação para quem enviou
    v_corpo := format(
        '<p style="margin:0 0 18px 0;">Recebemos a sua solicitação de adoção e ela já foi encaminhada para a <strong>%s</strong>.</p>
         %s
         <p style="margin:18px 0 0 0;">A partir de agora, a conversa é direta com a ONG. Ela pode entrar em contato pelos dados que você informou:</p>
         <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
                style="font-family:''Inter'',-apple-system,''Segoe UI'',Roboto,Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2937;margin-top:6px;">
           <tr><td style="color:#6b7280;padding:2px 0;">E-mail</td><td style="text-align:right;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Telefone</td><td style="text-align:right;">%s</td></tr>
           <tr><td style="color:#6b7280;padding:2px 0;">Pets</td><td style="text-align:right;font-weight:600;">%s</td></tr>
         </table>
         <p style="margin:18px 0 0 0;">Como funciona daqui para frente: a ONG analisa o seu pedido e pode pedir mais informações, marcar uma conversa ou agendar uma visita para conhecer o lugar onde o animal vai morar. Cada ONG tem o próprio processo e o prazo varia.</p>
         <p style="margin:12px 0 0 0;">A adoção não deve envolver pagamento pelo animal. Se alguém pedir qualquer valor em nome da ONG ou do AdotaPet, não pague e responda este e-mail para avisar a gente.</p>
         <p style="margin:18px 0 0 0;">Guarde o protocolo acima. Você não precisa criar conta nem senha para acompanhar: toda a conversa acontece por e-mail%s.</p>
         <p style="margin:18px 0 0 0;">Os dados que você enviou são usados apenas para esta solicitação de adoção e ficam visíveis para a ONG responsável pelo animal. Ao enviar o formulário, você concorda com os <a href="%s/termos" style="color:#a1600a;font-weight:600;text-decoration:none;">Termos de Uso</a> e a <a href="%s/privacidade" style="color:#a1600a;font-weight:600;text-decoration:none;">Política de Privacidade</a> do AdotaPet, que explicam o processo, as responsabilidades de cada parte e como pedir a remoção dos seus dados.</p>
         <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">Se você não enviou esta solicitação, pode ignorar este e-mail.</p>',
        coalesce(v_ong_nome, 'ONG responsável'),
        public.caixa_protocolo(new.protocolo),
        coalesce(new.email, 'não informado'),
        coalesce(new.telefone, 'não informado'),
        coalesce(v_pets, 'não informado'),
        case when v_ong_whats is null then '' else ' ou WhatsApp' end,
        public.url_site(),
        public.url_site()
    );

    perform public.enviar_email(
        new.email,
        format('Recebemos sua solicitação %s', new.protocolo),
        public.modelo_email('Solicitação recebida', v_corpo, coalesce(new.email, ''))
    );

    return new;
end;
$$;
