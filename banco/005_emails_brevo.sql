-- ---------------------------------------------------------------------
-- 005. E-mails automáticos das solicitações
--
-- Três e-mails saem deste arquivo:
--   1. para a ONG, quando uma solicitação chega;
--   2. para quem enviou, confirmando que a solicitação foi recebida;
--   3. para quem enviou, quando a ONG recusa ou conclui a adoção.
--
-- O envio usa a API do Brevo pelo pg_net, sem servidor extra.
-- O visual segue o mesmo modelo do e-mail de código de acesso.
--
-- Antes de rodar, guarde a chave da API do Brevo no Vault (não é a senha
-- SMTP). No painel do Brevo: SMTP e API > Chaves API e MCP > gerar chave.
--
--   select vault.create_secret('xkeysib-SUA-CHAVE', 'brevo_api_key',
--                              'Chave da API do Brevo para envio de e-mails');
--
-- Para trocar depois:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'brevo_api_key'),
--     'xkeysib-NOVA-CHAVE');
-- ---------------------------------------------------------------------

create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- Envio
-- ---------------------------------------------------------------------

create or replace function public.enviar_email(
    p_para    text,
    p_assunto text,
    p_html    text
)
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
    v_chave text;
    v_remetente text := coalesce(
        current_setting('adotapet.email_remetente', true),
        'adotapet.projeto@gmail.com'
    );
    v_id bigint;
begin
    if p_para is null or position('@' in p_para) = 0 then
        return null;
    end if;

    select decrypted_secret into v_chave
      from vault.decrypted_secrets
     where name = 'brevo_api_key'
     limit 1;

    if v_chave is null then
        raise warning 'Chave brevo_api_key ausente no Vault. E-mail nao enviado.';
        return null;
    end if;

    select net.http_post(
        url     := 'https://api.brevo.com/v3/smtp/email',
        headers := jsonb_build_object(
                       'api-key', v_chave,
                       'content-type', 'application/json',
                       'accept', 'application/json'
                   ),
        body    := jsonb_build_object(
                       'sender', jsonb_build_object(
                           'name', 'AdotaPet',
                           'email', v_remetente
                       ),
                       'to', jsonb_build_array(jsonb_build_object('email', p_para)),
                       'subject', p_assunto,
                       'htmlContent', p_html
                   ),
        timeout_milliseconds := 8000
    ) into v_id;

    return v_id;
end;
$$;

comment on function public.enviar_email is
    'Envia e-mail transacional pelo Brevo. A chave fica no Vault, nunca no codigo.';

-- ---------------------------------------------------------------------
-- Modelo visual, igual ao e-mail de código de acesso
-- ---------------------------------------------------------------------

create or replace function public.modelo_email(
    p_titulo       text,
    p_corpo        text,
    p_destinatario text
)
returns text
language sql
immutable
as $$
    select format($html$<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f7;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f5f6f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background-color:#ffffff;border:1px solid #f1f2f4;border-radius:20px;overflow:hidden;">

          <tr>
            <td style="padding:28px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'Poppins','Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                             font-size:17px;font-weight:700;color:#15181e;letter-spacing:-0.2px;">
                    AdotaPet
                  </td>
                  <td style="padding-left:8px;">
                    <span style="display:inline-block;width:7px;height:7px;background-color:#f59e0b;border-radius:50%%;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0 32px;">
              <h1 style="margin:0 0 10px 0;font-family:'Poppins','Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                         font-size:22px;line-height:1.3;font-weight:700;color:#15181e;letter-spacing:-0.3px;">
                %s
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:4px 32px 0 32px;font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                       font-size:15px;line-height:1.6;color:#1f2937;">
              %s
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 28px 32px;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
                     style="border-top:1px solid #e9eaec;">
                <tr>
                  <td style="padding-top:18px;font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                             font-size:12px;line-height:1.7;color:#6b7280;font-weight:600;">
                    AdotaPet
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                             font-size:12px;line-height:1.7;color:#9ca3af;">
                    Sistema Web de Adoção Responsável
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                             font-size:12px;line-height:1.7;color:#9ca3af;">
                    Turma 2ENG.SOF, projeto do CONTEEX 2026
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                             font-size:12px;line-height:1.7;color:#9ca3af;">
                    Enviado para %s
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$, p_titulo, p_titulo, p_corpo, p_destinatario);
$$;

-- Caixa branca com borda, usada para o protocolo
create or replace function public.caixa_protocolo(p_protocolo text)
returns text
language sql
immutable
as $$
    select format($html$
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#ffffff;border:1px solid #e9eaec;border-radius:14px;margin:0 0 4px 0;">
  <tr>
    <td style="padding:18px 22px 20px 22px;">
      <div style="font-family:'Inter',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
                  font-size:13px;font-weight:500;color:#6b7280;padding-bottom:6px;">
        Protocolo da solicitação
      </div>
      <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
                  font-size:24px;font-weight:600;letter-spacing:2px;color:#15181e;">
        %s
      </div>
    </td>
  </tr>
</table>
$html$, p_protocolo);
$$;

-- ---------------------------------------------------------------------
-- 1. Solicitação nova: avisa a ONG e confirma para quem enviou
-- ---------------------------------------------------------------------

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
         <p style="margin:18px 0 0 0;">Guarde o protocolo acima. Você não precisa criar conta nem senha para acompanhar: toda a conversa acontece por e-mail%s.</p>
         <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">Se você não enviou esta solicitação, pode ignorar este e-mail.</p>',
        coalesce(v_ong_nome, 'ONG responsável'),
        public.caixa_protocolo(new.protocolo),
        coalesce(new.email, 'não informado'),
        coalesce(new.telefone, 'não informado'),
        coalesce(v_pets, 'não informado'),
        case when v_ong_whats is null then '' else ' ou WhatsApp' end
    );

    perform public.enviar_email(
        new.email,
        format('Recebemos sua solicitação %s', new.protocolo),
        public.modelo_email('Solicitação recebida', v_corpo, coalesce(new.email, ''))
    );

    return new;
end;
$$;

drop trigger if exists trg_avisar_ong_nova_solicitacao on public.solicitacoes;
drop trigger if exists trg_avisar_nova_solicitacao on public.solicitacoes;

-- Gatilho adiado de propósito: a RPC grava a solicitação e só depois grava os
-- pets em solicitacao_animais. Sem o adiamento, o e-mail sairia sem a lista.
create constraint trigger trg_avisar_nova_solicitacao
    after insert on public.solicitacoes
    deferrable initially deferred
    for each row
    execute function public.avisar_nova_solicitacao();

-- ---------------------------------------------------------------------
-- 2. Resposta da ONG: recusa ou conclusão
-- ---------------------------------------------------------------------

create or replace function public.avisar_candidato_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_ong_nome  text;
    v_ong_email text;
    v_ong_whats text;
    v_pets      text;
    v_titulo    text;
    v_corpo     text;
begin
    if new.status = old.status then
        return new;
    end if;
    if new.status not in ('recusada', 'concluida') then
        return new;
    end if;

    select o.nome, o.email, o.whatsapp
      into v_ong_nome, v_ong_email, v_ong_whats
      from public.ongs o
     where o.id = new.ong_id;

    select string_agg(a.nome, ', ' order by a.nome) into v_pets
      from public.solicitacao_animais sa
      join public.animais a on a.id = sa.animal_id
     where sa.solicitacao_id = new.id;

    if new.status = 'recusada' then
        v_titulo := 'Sobre a sua solicitação';
        v_corpo := format(
            '<p style="margin:0 0 18px 0;">Olá, %s.</p>
             <p style="margin:0 0 18px 0;">A <strong>%s</strong> analisou a sua solicitação para %s e, neste momento, ela não seguiu adiante.</p>
             %s
             <p style="margin:18px 0 0 0;">Isso não fecha a porta. Muitos pets esperam por uma família como a sua, e você pode se candidatar a outro animal quando quiser.</p>
             <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">Se quiser entender melhor a decisão, fale com a ONG pelo e-mail %s%s.</p>',
            coalesce(new.nome, 'tudo bem'),
            coalesce(v_ong_nome, 'ONG'),
            coalesce(v_pets, 'o pet'),
            public.caixa_protocolo(new.protocolo),
            coalesce(v_ong_email, ''),
            case when v_ong_whats is null then '' else format(' ou pelo WhatsApp %s', v_ong_whats) end
        );
    else
        v_titulo := 'Adoção concluída';
        v_corpo := format(
            '<p style="margin:0 0 18px 0;">Olá, %s.</p>
             <p style="margin:0 0 18px 0;">A <strong>%s</strong> marcou a sua solicitação para %s como concluída. Que alegria ter você nessa história.</p>
             %s
             <p style="margin:18px 0 0 0;">Os detalhes da entrega do animal são combinados direto com a ONG, pelo e-mail %s%s.</p>',
            coalesce(new.nome, 'tudo bem'),
            coalesce(v_ong_nome, 'ONG'),
            coalesce(v_pets, 'o pet'),
            public.caixa_protocolo(new.protocolo),
            coalesce(v_ong_email, ''),
            case when v_ong_whats is null then '' else format(' ou pelo WhatsApp %s', v_ong_whats) end
        );
    end if;

    perform public.enviar_email(
        new.email,
        format('%s · %s', v_titulo, new.protocolo),
        public.modelo_email(v_titulo, v_corpo, coalesce(new.email, ''))
    );

    return new;
end;
$$;

drop trigger if exists trg_avisar_candidato_status on public.solicitacoes;
create trigger trg_avisar_candidato_status
    after update of status on public.solicitacoes
    for each row
    execute function public.avisar_candidato_status();

-- ---------------------------------------------------------------------
-- Conferir depois de rodar
--
--   select id, status_code, left(content, 300) as resposta, created
--   from net._http_response order by created desc limit 5;
--
-- 401: chave do Brevo errada.
-- 400 com sender not verified: falta verificar o remetente no Brevo.
-- ---------------------------------------------------------------------
