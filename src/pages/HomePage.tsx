import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileCheck2,
  Heart,
  Info,
  LayoutDashboard,
  Link2,
  Mail,
  PawPrint,
  QrCode,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicFooter, PublicTopbar } from "../components/Shells";
import { PetCard } from "../components/PetParts";
import { photos } from "../mocks";
import { useAuth } from "../lib/auth";
import { listarOngsPublicas, listarPetsPublicos, type PetListado } from "../lib/dados";

const passosAdotar = [
  ["01", "Encontre um animal", "Veja perfis completos e escolha com calma."],
  ["02", "Conheça a história", "Confira porte, idade, cuidados e a ONG responsável."],
  ["03", "Envie seu pedido", "Preencha a solicitação sem criar uma conta."],
];

const passosOng = [
  ["01", "Crie a conta da ONG", "O cadastro é gratuito e leva poucos minutos."],
  ["02", "Cadastre os animais", "Reúna fotos, história e informações importantes."],
  ["03", "Divulgue com facilidade", "Compartilhe o link ou imprima o QR Code."],
  ["04", "Acompanhe os pedidos", "Organize cada solicitação com protocolo e aviso."],
];

const recursos: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: FileCheck2,
    titulo: "Ficha completa",
    texto: "Tudo o que a pessoa precisa saber antes de pedir uma adoção.",
  },
  {
    icone: QrCode,
    titulo: "QR Code por animal",
    texto: "Leve a ficha para feiras, cartazes e redes sociais.",
  },
  {
    icone: Link2,
    titulo: "Link para compartilhar",
    texto: "Divulgue cada pet com um endereço simples e direto.",
  },
  {
    icone: Mail,
    titulo: "Aviso por e-mail",
    texto: "A ONG fica sabendo quando um novo pedido chega.",
  },
  {
    icone: LayoutDashboard,
    titulo: "Pedidos organizados",
    texto: "Veja interessados, status e protocolos em um só lugar.",
  },
  {
    icone: ShieldCheck,
    titulo: "Adoção responsável",
    texto: "Informação clara aproxima o animal da família certa.",
  },
];

const perguntas = [
  [
    "Preciso criar uma conta para adotar?",
    "Não. Você pode conhecer os animais e enviar uma solicitação sem login. A ONG recebe seus dados e entra em contato para continuar o processo.",
  ],
  [
    "A adoção é confirmada pelo site?",
    "Não. O AdotaPet organiza o primeiro contato. A análise, a conversa e a decisão final são conduzidas pela ONG responsável pelo animal.",
  ],
  [
    "Minha ONG paga para usar a plataforma?",
    "Não. O AdotaPet é gratuito, criado como projeto acadêmico para apoiar a adoção responsável.",
  ],
  [
    "Como funciona o QR Code?",
    "Cada animal recebe um QR Code próprio. Ao apontar a câmera do celular, a pessoa abre a ficha pública daquele pet.",
  ],
  [
    "Quem recebe os dados da solicitação?",
    "A ONG responsável pelo animal recebe o pedido identificado por protocolo e um aviso por e-mail para dar continuidade ao atendimento.",
  ],
];

function Cabecalho({
  eyebrow,
  titulo,
  texto,
}: {
  eyebrow: string;
  titulo: string;
  texto?: string;
}) {
  return (
    <div className="home-heading">
      <p className="home-eyebrow">{eyebrow}</p>
      <h2>{titulo}</h2>
      {texto && <p className="home-heading-text">{texto}</p>}
    </div>
  );
}

function PreviaCelular() {
  return (
    <div className="home-phone">
      <div className="home-phone-notch" />
      <div className="home-phone-screen">
        <div className="home-phone-top">
          <span className="home-mini-brand">
            <PawPrint size={11} />
            AdotaPet
          </span>
          <span className="home-phone-hour">9:41</span>
        </div>
        <div className="home-phone-photo">
          <img src={photos.caramelo} alt="" style={{ objectPosition: "50% 58%" }} />
          <span className="home-pill-status">Disponível</span>
        </div>
        <div className="home-phone-body">
          <p className="home-phone-label">Cão para adoção</p>
          <h3>Caramelo</h3>
          <p className="home-phone-place">São Paulo, SP</p>
          <div className="home-phone-chips">
            <span>Macho</span>
            <span>2 anos</span>
            <span>Médio</span>
          </div>
          <p className="home-phone-story">
            Resgatado no jardim da praça. Adora colo e já sabe passear de coleira.
          </p>
          <div className="home-phone-button">Quero adotar</div>
        </div>
      </div>
    </div>
  );
}

function PreviaPainel() {
  const pedidos = [
    ["Ana Souza", "Caramelo", "Hoje, 13:40", "Nova", true],
    ["Bruno Lima", "Mel", "Ontem, 18:10", "Em análise", false],
    ["Carla Dias", "Nina", "Ontem, 09:05", "Contato feito", false],
  ] as const;
  return (
    <div className="home-browser">
      <div className="home-browser-bar">
        <div className="home-browser-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>adotapet-conteex.vercel.app/painel</span>
      </div>
      <div className="home-dash">
        <aside>
          <span className="home-dash-brand">
            <PawPrint size={13} />
          </span>
          <span className="is-active">
            <LayoutDashboard size={14} />
          </span>
          <span>
            <Heart size={14} />
          </span>
          <span>
            <UsersRound size={14} />
          </span>
        </aside>
        <div className="home-dash-main">
          <div className="home-dash-head">
            <div>
              <p>Visão geral</p>
              <h3>Olá, Amigos de Patas</h3>
            </div>
            <div className="home-dash-avatar">AP</div>
          </div>
          <div className="home-dash-stats">
            <div>
              <span>Pets disponíveis</span>
              <strong>03</strong>
            </div>
            <div>
              <span>Pedidos novos</span>
              <strong>01</strong>
            </div>
            <div>
              <span>Adoções feitas</span>
              <strong>12</strong>
            </div>
          </div>
          <div className="home-dash-table">
            <div className="home-table-title">
              <strong>Solicitações recentes</strong>
              <span>Ver todas</span>
            </div>
            {pedidos.map(([pessoa, pet, quando, status, nova]) => (
              <div className="home-table-row" key={pessoa}>
                <span className="home-table-avatar">{pessoa.slice(0, 1)}</span>
                <strong>{pessoa}</strong>
                <span>{pet}</span>
                <span className="home-table-when">{quando}</span>
                <em className={nova ? "is-new" : undefined}>{status}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { sessao } = useAuth();
  const [pets, setPets] = useState<PetListado[]>([]);
  const [totais, setTotais] = useState({ pets: 0, ongs: 0 });

  useEffect(() => {
    document.title = "AdotaPet | Sistema Web de Adoção Responsável";
  }, []);

  useEffect(() => {
    let ativo = true;
    listarPetsPublicos()
      .then((lista) => {
        if (!ativo) return;
        setPets(lista);
        setTotais((atual) => ({ ...atual, pets: lista.length }));
      })
      .catch(() => undefined);
    listarOngsPublicas()
      .then((lista) => ativo && setTotais((atual) => ({ ...atual, ongs: lista.length })))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  const destaques: PetListado[] = [];
  const fotosUsadas = new Set<string>();
  for (const item of pets) {
    if (destaques.length === 3) break;
    const foto = item.pet.image ?? "";
    if (foto && fotosUsadas.has(foto)) continue;
    fotosUsadas.add(foto);
    destaques.push(item);
  }

  return (
    <main className="public-page home-page">
      <PublicTopbar />
      <div className="content-1100">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="home-project-note">
              <span />
              Projeto acadêmico apresentado no CONTEEX 2026
            </p>
            <h1>
              Adoção responsável começa com <em>informação.</em>
            </h1>
            <p className="home-hero-text">
              Encontre animais que esperam por uma família ou dê à sua ONG uma forma simples de
              organizar e divulgar adoções.
            </p>
            <div className="home-hero-actions">
              <Link className="button button-primary" to="/pets">
                Ver animais para adoção
                <ArrowRight size={18} />
              </Link>
              {sessao ? (
                <Link className="home-text-link" to="/painel">
                  Ir para o painel
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <Link className="home-text-link" to="/cadastro">
                  Sou ONG, quero participar
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
            <div className="home-trust">
              <span className="home-trust-icons" aria-hidden="true">
                <i>
                  <PawPrint size={13} />
                </i>
                <i>
                  <Heart size={13} />
                </i>
                <i>
                  <UsersRound size={13} />
                </i>
              </span>
              <p>
                {totais.pets === 0 && totais.ongs === 0 ? (
                  <>Plataforma em piloto, aberta a novas ONGs</>
                ) : (
                  <>
                    <strong>
                      {totais.ongs} {totais.ongs === 1 ? "ONG" : "ONGs"} e {totais.pets}{" "}
                      {totais.pets === 1 ? "animal" : "animais"}
                    </strong>{" "}
                    cadastrados
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-hero-image">
              <img
                src={photos.nina}
                alt="Cão resgatado olhando para a câmera, em luz natural"
                style={{ objectPosition: "center 26%" }}
              />
              <div className="home-hero-caption">
                <span>
                  <Heart size={16} fill="currentColor" />
                </span>
                <div>
                  <b>Histórias que encontram famílias</b>
                  <small>Com cuidado em cada etapa</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <Cabecalho
            eyebrow="Como funciona"
            titulo="Um caminho claro para cada pessoa"
            texto="Menos dúvida para quem adota. Mais organização para quem cuida."
          />
          <div className="home-paths">
            <article className="home-path">
              <div className="home-path-title">
                <span>
                  <Heart size={19} />
                </span>
                <div>
                  <p>Um novo começo</p>
                  <h3>Para quem quer adotar</h3>
                </div>
              </div>
              <div className="home-steps">
                {passosAdotar.map(([numero, titulo, texto]) => (
                  <div className="home-step" key={numero}>
                    <span className="home-step-number">{numero}</span>
                    <div>
                      <h4>{titulo}</h4>
                      <p>{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="home-path">
              <div className="home-path-title">
                <span>
                  <UsersRound size={19} />
                </span>
                <div>
                  <p>Gestão que cabe na rotina</p>
                  <h3>Para a ONG</h3>
                </div>
              </div>
              <div className="home-steps">
                {passosOng.map(([numero, titulo, texto]) => (
                  <div className="home-step" key={numero}>
                    <span className="home-step-number">{numero}</span>
                    <div>
                      <h4>{titulo}</h4>
                      <p>{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="home-section">
          <Cabecalho
            eyebrow="O que está dentro"
            titulo="Feito para facilitar, não para complicar"
            texto="Recursos simples que ajudam a ONG a cuidar do que importa."
          />
          <div className="home-resource-grid">
            {recursos.map(({ icone: Icone, titulo, texto }) => (
              <article className="home-resource" key={titulo}>
                <span className="home-resource-icon">
                  <Icone size={19} strokeWidth={1.9} />
                </span>
                <div>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </div>
                <Check className="home-resource-check" size={15} />
              </article>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-product-heading">
            <Cabecalho
              eyebrow="Por dentro da plataforma"
              titulo="Fácil para conhecer. Simples para cuidar."
            />
            <p>
              A pessoa vê uma ficha clara no celular. A ONG acompanha tudo em um painel organizado.
            </p>
          </div>
          <div className="home-stage">
            <div className="home-stage-phone">
              <span className="home-preview-label">Ficha pública</span>
              <PreviaCelular />
            </div>
            <div className="home-stage-browser">
              <span className="home-preview-label">Painel da ONG</span>
              <PreviaPainel />
            </div>
          </div>
        </section>

        {destaques.length > 0 && (
          <section className="home-section">
            <div className="home-featured-head">
              <Cabecalho
                eyebrow="Animais em destaque"
                titulo="Talvez seu novo amigo esteja aqui"
                texto="Conheça alguns dos animais que esperam por uma família."
              />
              <Link className="home-all-link" to="/pets">
                Ver todos
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="pet-grid home-pets">
              {destaques.map((item) => (
                <PetCard
                  key={item.pet.id}
                  pet={item.pet}
                  nota={`${item.ongNome} · ${[item.cidade, item.uf].filter(Boolean).join(", ")}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="home-section home-faq">
          <div className="home-faq-intro">
            <Cabecalho
              eyebrow="Dúvidas comuns"
              titulo="Antes de começar"
              texto="Respostas diretas para ajudar você a dar o próximo passo com segurança."
            />
            <div className="home-faq-help">
              <Info size={17} />
              <p>
                Ainda tem dúvida?{" "}
                <a href="mailto:adotapet.projeto@gmail.com">Fale com a equipe</a>
              </p>
            </div>
          </div>
          <div className="home-accordion">
            {perguntas.map(([pergunta, resposta], indice) => (
              <details key={pergunta} open={indice === 0}>
                <summary>
                  <span>{pergunta}</span>
                  <i aria-hidden="true">
                    <ChevronRight size={18} />
                  </i>
                </summary>
                <p>{resposta}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="home-final">
          <div className="home-final-card">
            <div className="home-final-mark" aria-hidden="true">
              <PawPrint size={26} />
            </div>
            <div className="home-final-copy">
              <p className="home-eyebrow">Sua ONG pode começar hoje</p>
              <h2>Mais alcance para os animais. Mais clareza para sua equipe.</h2>
              <p>Crie sua conta gratuita e organize as próximas histórias de adoção em um só lugar.</p>
            </div>
            <div className="home-final-actions">
              <Link className="button button-primary" to="/cadastro">
                Criar conta da ONG
                <ArrowRight size={18} />
              </Link>
              <Link className="home-text-link" to="/entrar">
                Já tenho conta. Entrar no painel
              </Link>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
