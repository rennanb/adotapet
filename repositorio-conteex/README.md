# Sistema Web de Adoção Responsável (AdotaPet)

Material do projeto apresentado no 11º Congresso de Projetos Interdisciplinares do Centro Universitário Fam (CONTEEX), grupo 4301, turma 2ENGSOF, 2º semestre de Engenharia de Software.

O AdotaPet é uma aplicação web em que a ONG entra no painel com um código de seis dígitos enviado ao e-mail, cadastra animais com até cinco fotos, controla o status de cada um e gera QR Codes de divulgação. Quem encontra o animal escaneia o código, consulta a ficha pública sem precisar de login e envia o formulário de adoção, que chega à ONG por e-mail junto de um documento em PDF com protocolo.

## Como navegar nesta pasta

| Pasta | O que tem |
| --- | --- |
| `01 - Artigo Atual` | Artigo do CONTEEX 2026-2 em PDF e em DOCX, no modelo oficial (Short Note, duas páginas). |
| `02 - Artigos Anteriores` | Artigo da edição anterior, projeto Origem (CONTEEX 2026-1), para mostrar a evolução do trabalho. |
| `03 - Diagramas ou Plantas` | Modelo de dados (MER) e fluxo de uso do sistema. |
| `04 - Imagens` | QR Code que leva a este repositório. |
| `05 - Telas ou Vídeos` | Ficha pública do animal no celular e painel da ONG no computador. |
| `06 - Código` | Indicação de onde está o código-fonte e o banco de dados. |
| `07 - Banner` | Banner 90 x 120 cm em PDF (para impressão) e em PPTX (para edição). |
| `08 - Edição Anterior` | Fluxograma, QR Code e telas do projeto Origem, preservados como histórico. |

## Onde está o código

O código-fonte fica na raiz deste repositório:

- `src/` — aplicação em TypeScript, React e Vite.
- `supabase/` — schema do banco, políticas de acesso e funções de e-mail.

Aplicação em produção: https://adotapet-conteex.vercel.app

## Equipe

Emerson Ferreira Silva, Gennik Vieira Salas, Luiz Henrique de Jesus Bispo, Nicolas Souza Carranca de Abreu, Raul Toledo Abolafio e Rennan Lima Bastos.

Orientador: Prof. Dr. Wagner Ballak.
