import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PublicTopbar } from "../components/Shells";

const ATUALIZADO = "12 de novembro de 2026";
const CONTATO = "adotapet.projeto@gmail.com";

function LegalPage({
  eyebrow,
  titulo,
  resumo,
  children,
}: {
  eyebrow: string;
  titulo: string;
  resumo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="simple-page">
      <PublicTopbar />
      <article className="legal-page">
        <Link className="legal-back" to="/entrar">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{titulo}</h1>
        <p className="legal-lead">{resumo}</p>
        <p className="legal-updated">Última atualização: {ATUALIZADO}</p>
        {children}
        <div className="legal-foot">
          <Link to="/privacidade">Política de privacidade</Link>
          <Link to="/termos">Termos de uso</Link>
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a>
        </div>
      </article>
    </main>
  );
}

export function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="Transparência"
      titulo="Política de privacidade"
      resumo="O AdotaPet guarda o mínimo necessário para colocar um animal em contato com uma família. Esta página explica o que é coletado, por quê e como pedir a exclusão."
    >
      <h2>Quem somos</h2>
      <p>
        O AdotaPet é um projeto acadêmico interdisciplinar do 2º semestre de Engenharia de Software
        da FAM, apresentado no CONTEEX 2026. Não é uma empresa e não vende serviços. O sistema é
        operado pelos próprios estudantes, com o objetivo de ajudar ONGs de proteção animal a
        divulgar seus animais e organizar pedidos de adoção.
      </p>

      <h2>Quais dados são coletados</h2>
      <p>
        <b>Da ONG:</b> e-mail de acesso, nome da instituição, cidade, estado, WhatsApp, nome do
        responsável, descrição, site e imagens de logo e capa.
      </p>
      <p>
        <b>Dos animais:</b> nome, espécie, sexo, porte, idade, status de saúde, história, cidade e
        fotos enviadas pela ONG.
      </p>
      <p>
        <b>De quem quer adotar:</b> nome, e-mail, telefone, cidade, estado, idade, quantidade de
        pessoas na casa, tipo de moradia, tempo que o animal ficaria sozinho, se a casa tem telas e
        a mensagem escrita no formulário.
      </p>
      <p>
        <b>De navegação:</b> apenas o necessário para manter a sessão de login no seu navegador. Não
        usamos cookies de publicidade, nem rastreadores de terceiros.
      </p>

      <h2>Para que os dados são usados</h2>
      <ul>
        <li>enviar o código de acesso por e-mail e manter a ONG conectada;</li>
        <li>publicar a ficha do animal e gerar o QR Code de divulgação;</li>
        <li>entregar a solicitação de adoção para a ONG responsável, com protocolo;</li>
        <li>permitir que a ONG entre em contato com quem se candidatou;</li>
        <li>avisar por e-mail quando a solicitação for aceita ou recusada.</li>
      </ul>

      <h2>Base legal</h2>
      <p>
        Tratamos os dados com o consentimento de quem preenche o formulário e para executar o
        procedimento de adoção solicitado por essa pessoa, conforme a Lei Geral de Proteção de Dados
        (Lei 13.709/2018). O envio do formulário só acontece depois de marcar o aceite.
      </p>

      <h2>Quem tem acesso</h2>
      <p>
        A ONG responsável pelo animal vê os dados da solicitação enviada para ela. Os estudantes
        responsáveis pelo projeto têm acesso técnico ao banco para manutenção. Nenhum dado é vendido
        ou cedido para publicidade.
      </p>
      <p>
        Usamos três serviços de infraestrutura, que guardam dados em nome do projeto: Supabase
        (banco de dados e autenticação), Brevo (envio de e-mails) e Vercel (hospedagem do site).
      </p>

      <h2>Por quanto tempo ficam guardados</h2>
      <p>
        Enquanto a ONG mantiver a conta ativa ou enquanto a solicitação ainda estiver em andamento.
        Depois disso, os dados podem ser apagados a pedido. Fotos de animais já adotados podem
        permanecer no histórico do projeto, sem dados pessoais do adotante.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir a confirmação, o acesso, a correção ou a exclusão dos seus dados, além de
        retirar o consentimento a qualquer momento. Basta escrever para {CONTATO}. Respondemos em até
        15 dias.
      </p>

      <h2>Segurança</h2>
      <p>
        O acesso ao painel é feito por código enviado ao e-mail da ONG, sem senha para vazar. O banco
        aplica regras de acesso por linha, então uma ONG não vê os dados de outra. O link do
        documento da solicitação usa um código impossível de adivinhar e pode ser trocado se
        necessário.
      </p>

      <h2>Crianças e adolescentes</h2>
      <p>
        O formulário de adoção deve ser preenchido por pessoa maior de 18 anos ou por um responsável
        legal. Não coletamos dados de crianças de forma intencional.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Se o texto mudar, a data de atualização no topo também muda. Mudanças importantes serão
        avisadas na tela inicial do projeto.
      </p>
    </LegalPage>
  );
}

export function TermosPage() {
  return (
    <LegalPage
      eyebrow="Regras de uso"
      titulo="Termos de uso"
      resumo="O AdotaPet é uma vitrine e um canal de contato entre ONGs e famílias. A adoção em si é conduzida pela ONG, com critérios próprios."
    >
      <h2>O que o AdotaPet faz</h2>
      <p>
        É uma plataforma acadêmica que permite à ONG cadastrar animais, gerar QR Codes de divulgação
        e receber solicitações de adoção organizadas. O projeto foi desenvolvido por estudantes do 2º
        semestre de Engenharia de Software da FAM para o CONTEEX 2026.
      </p>

      <h2>Cadastro da ONG</h2>
      <ul>
        <li>o acesso é feito por código enviado ao e-mail informado, sem senha;</li>
        <li>a ONG é responsável pela veracidade dos dados que publica;</li>
        <li>cada ONG vê somente os próprios animais e solicitações;</li>
        <li>o e-mail de acesso deve ser institucional ou acompanhado por alguém da instituição.</li>
      </ul>

      <h2>Responsabilidade sobre os animais</h2>
      <p>
        As informações da ficha, as fotos e o status de cada animal são de responsabilidade da ONG,
        que deve manter a ficha atualizada, marcando como adotado ou indisponível quando for o caso.
      </p>

      <h2>Como funciona a adoção</h2>
      <p>
        O formulário enviado pelo interessado chega à ONG com um protocolo. A análise, a entrevista,
        a visita, a entrega do animal e o termo de adoção são feitos diretamente pela ONG, com
        critérios definidos por ela. O AdotaPet não participa da decisão, não garante que a adoção
        será aprovada e não é parte do acordo firmado entre as partes.
      </p>
      <p>
        A ONG pode pedir documentos e comprovação das informações, marcar entrevista, solicitar fotos
        do espaço e agendar visita técnica antes de aprovar. Cada ONG define o próprio processo, os
        critérios e o prazo, e a plataforma não interfere nessa etapa.
      </p>
      <p>
        A ONG pode aceitar ou recusar uma solicitação. Quando houver recusa, o sistema envia um
        e-mail automático para quem se candidatou.
      </p>
      <h2>Adoção sem cobrança</h2>
      <p>
        A adoção não deve envolver pagamento pelo animal. Cobrar por adoção, em nome da ONG ou do
        AdotaPet, é proibido nestes termos. Se alguém pedir qualquer valor, não pague, guarde a
        conversa e avise a ONG pelo contato oficial.
      </p>
      <p>
        Doações espontâneas para custear ração, castração e tratamento são bem-vindas quando
        combinadas direto com a ONG, sempre sem obrigação e sem qualquer relação com a aprovação de
        uma adoção.
      </p>

      <h2>Uso permitido</h2>
      <p>
        É permitido divulgar animais para adoção responsável, compartilhar os links e QR Codes
        gerados e usar o formulário para manifestar interesse real.
      </p>

      <h2>Uso proibido</h2>
      <ul>
        <li>cadastrar animais que não existem ou usar fotos de terceiros sem autorização;</li>
        <li>usar a plataforma para venda de animais, cruza ou qualquer comércio;</li>
        <li>enviar dados falsos, ofensivos ou de outras pessoas sem consentimento;</li>
        <li>tentar acessar dados de outra ONG, automatizar envios em massa ou explorar falhas;</li>
        <li>usar o conteúdo do site para golpes, spam ou cobrança de taxa de adoção.</li>
      </ul>
      <h2>Descumprimento e punições</h2>
      <p>
        Quem descumprir estes termos está sujeito a medidas aplicadas conforme a gravidade e a
        reincidência, sempre com registro interno:
      </p>
      <ul>
        <li>advertência com pedido de correção em até 48 horas;</li>
        <li>remoção do conteúdo irregular, como ficha, foto ou anúncio;</li>
        <li>suspensão temporária do acesso, com bloqueio de novas solicitações;</li>
        <li>encerramento definitivo da conta e bloqueio de novo cadastro com os mesmos dados;</li>
        <li>
          comunicação às autoridades quando houver indício de crime, como maus-tratos (Lei
          9.605/1998), estelionato (Código Penal, art. 171) ou venda de animais;
        </li>
        <li>medidas judiciais cabíveis para reparar prejuízos causados à plataforma ou a terceiros.</li>
      </ul>
      <p>
        Em situações de risco ao animal ou a pessoas, a suspensão pode ser imediata, sem aviso
        prévio, com comunicação posterior e direito de defesa pelo e-mail de contato.
      </p>
      <h2>Limitação de responsabilidade</h2>
      <p>
        O AdotaPet é uma plataforma acadêmica de divulgação e contato. Não é abrigo, não é tutor, não
        recebe animais e não verifica previamente as informações publicadas pelas ONGs.
      </p>
      <ul>
        <li>a veracidade das fichas, fotos e status é responsabilidade da ONG;</li>
        <li>a decisão de adotar ou de entregar o animal é exclusiva da ONG e de quem adota;</li>
        <li>não respondemos pelo comportamento, pela saúde ou pela adaptação do animal;</li>
        <li>não respondemos por acordos, pagamentos ou desentendimentos entre as partes;</li>
        <li>não garantimos disponibilidade contínua, resultado de adoção nem prazo de resposta.</li>
      </ul>
      <p>
        Na máxima extensão permitida pela lei, a responsabilidade da plataforma se limita aos danos
        diretos comprovadamente causados por falha própria na prestação do serviço.
      </p>

      <h2>Conteúdo e propriedade intelectual</h2>
      <p>
        As fotos e textos enviados continuam pertencendo à ONG, que autoriza a exibição pública
        deles no site e nos materiais de divulgação gerados pelo próprio sistema, como cartazes e
        stories. O código do projeto é aberto e está publicado no GitHub.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Sendo um projeto acadêmico, o serviço pode ficar fora do ar durante manutenção, mudanças ou
        apresentações. Não há garantia de disponibilidade contínua nem de prazo de resposta.
      </p>

      <h2>Encerramento de conta</h2>
      <p>
        A ONG pode pedir o encerramento a qualquer momento pelo e-mail {CONTATO}. Podemos suspender
        ou encerrar contas que violem estes termos, seguindo as medidas descritas em
        Descumprimento e punições.
      </p>

      <h2>Legislação</h2>
      <p>
        Estes termos seguem a legislação brasileira, em especial a Lei 13.709/2018 (LGPD) e a Lei
        14.063/2020, no que se aplica a assinaturas e comunicações eletrônicas. Dúvidas podem ser
        enviadas para {CONTATO}.
      </p>
    </LegalPage>
  );
}
