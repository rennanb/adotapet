# Sistema Web de Adoção Responsável

Plataforma web em que ONGs de proteção animal cadastram seus animais, divulgam cada um por QR Code e recebem solicitações de adoção com protocolo. O AdotaPet é o nome fantasia do projeto.

Projeto interdisciplinar apresentado no 11º Congresso de Projetos Interdisciplinares do Centro Universitário Fam (CONTEEX), grupo 4301, 2º semestre de Engenharia de Software.

**Site em produção:** https://adotapet-conteex.vercel.app
**Material do evento (artigo, banner, diagramas e telas):** [repositorio-conteex](repositorio-conteex)

<img src="repositorio-conteex/05%20-%20Telas%20ou%20V%C3%ADdeos/2.%20Painel%20da%20ONG.png" width="430" alt="Painel da ONG no computador">

## O problema

O abandono de cães e gatos é um problema de saúde pública e de bem-estar animal no Brasil. As ONGs que resgatam esses animais têm dificuldade para divulgar fichas atualizadas e para organizar os pedidos de adoção, que chegam espalhados por redes sociais, WhatsApp e comentários. Sem um registro único, a ONG repete informação e perde o contato de quem se interessou.

O projeto centraliza esse fluxo em uma aplicação web de uso simples, pensada para ONGs pequenas, que não têm sistema nem equipe técnica.

## Como funciona

1. A ONG entra com o e-mail e um código de seis dígitos, sem senha.
2. No painel, cadastra o animal com fotos, dados de saúde e status.
3. O sistema gera o QR Code do animal e o QR Code da ONG.
4. Quem encontra o animal escaneia o código, abre a ficha pública sem login e envia o formulário de adoção.
5. O pedido chega à ONG por e-mail, com documento em PDF e protocolo, e a ONG aprova ou recusa pelo painel.

<img src="repositorio-conteex/05%20-%20Telas%20ou%20V%C3%ADdeos/1.%20Ficha%20p%C3%BAblica%20do%20animal%20%28celular%29.png" width="230" alt="Ficha pública do animal no celular">

## Funcionalidades

Para a ONG:

- Acesso por código de seis dígitos enviado ao e-mail, sem senha.
- Cadastro e edição da ONG, com foto de perfil e capa.
- Cadastro de animais com até cinco fotos, galeria, dados de saúde e status.
- QR Code do animal e da ONG, com download para impressão.
- Geração de peças de divulgação para redes sociais e cartazes.
- Painel de solicitações com dados do candidato, aprovação e recusa.
- E-mails automáticos de nova solicitação, confirmação e recusa.

Para quem quer adotar:

- Página pública da ONG com todos os animais disponíveis.
- Ficha pública do animal, com galeria e informações de saúde.
- Formulário de adoção em quatro passos, com possibilidade de incluir mais de um animal na mesma solicitação.
- Confirmação com protocolo e documento público da solicitação.

## Tecnologias

| Camada | O que foi usado |
| --- | --- |
| Interface | TypeScript, React e Vite |
| Banco de dados | PostgreSQL no Supabase, com políticas de acesso por linha |
| Autenticação | Supabase Auth, com código de seis dígitos por e-mail |
| Armazenamento | Supabase Storage, para as fotos dos animais |
| E-mails | Brevo, acionado por funções e gatilhos no banco |
| Publicação | Vercel |

## Estrutura do repositório

```
src/
  components/    componentes de interface, navegação e peças de divulgação
  pages/         telas públicas, painel da ONG e páginas legais
  lib/           cliente do Supabase, autenticação e camada de dados
public/          ícone e arquivos estáticos
supabase/        schema do banco, políticas, funções e disparo de e-mails
conteex/         material do evento: artigo, banner, diagramas, telas e histórico
```

## Rodando o projeto localmente

Pré-requisitos: Node.js instalado.

```bash
npm install
npm run dev
```

Crie um arquivo `.env` na raiz, ao lado do `package.json`, com as duas variáveis do Supabase:

```
VITE_SUPABASE_URL=https://seuprojeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

A chave publishable é pública por natureza, porque o acesso aos dados é controlado pelas políticas de acesso do banco. Nunca use a chave secreta no front-end.

Para gerar a versão de produção:

```bash
npm run build
```

## Banco de dados

Os scripts em `supabase/` criam as tabelas de ONGs, animais, fotos, solicitações e a relação entre solicitação e animal, além das políticas de acesso, da função que registra a solicitação com protocolo e dos gatilhos que disparam os e-mails.

## Equipe

Emerson Ferreira Silva, Gennik Vieira Salas, Luiz Henrique de Jesus Bispo, Nicolas Souza Carranca de Abreu, Raul Toledo Abolafio e Rennan Lima Bastos.

Orientador: Prof. Dr. Wagner Ballak.
