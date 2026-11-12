import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Archive,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Heart,
  Info,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  getPublicBaseUrl,
  petObjectPosition,
  photos,
  states,
  type Pet,
  type PetFocalPoint,
  type PetStatus,
} from "../mocks";
import {
  LIMITE_FOTOS,
  ROTULO_SOLICITACAO,
  atualizarPet,
  atualizarStatusPet,
  carregarPet,
  carregarSolicitacao,
  criarPet,
  enviarFoto,
  focalDoBanco,
  linkDaSolicitacao,
  listarFotosPet,
  listarPets,
  listarSolicitacoes,
  mudarStatusSolicitacao,
  petParaCard,
  useOng,
  type PetDetalhado,
  type Solicitacao,
  type StatusSolicitacao,
} from "../lib/dados";
import { PageHeader, useAbout } from "../components/Shells";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  SectionCard,
  Select,
  StatusBadge,
  Switch,
  TagCard,
  TextArea,
  TextField,
} from "../components/ui";
import { QrActions } from "../components/PetParts";
import { PhotoAdjuster, type PhotoAdjustment } from "../components/PhotoAdjuster";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const petPublicPath = (name: string) => `/pet/${slugify(name)}-a1b2`;

const WHATSAPP_MESSAGE_TEMPLATE =
  "Olá, {primeiro nome}! Aqui é da {nome da ONG}. Recebemos sua solicitação de adoção de {nome do pet} (protocolo {protocolo}) e queremos conversar sobre os próximos passos.";

function buildWhatsAppUrl(phone: string, values: Record<string, string>) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55\d{10,11}$/.test(digits)) return null;
  const ddd = Number(digits.slice(2, 4));
  if (ddd < 11 || ddd > 99) return null;
  const message = Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(value),
    WHATSAPP_MESSAGE_TEMPLATE,
  );
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

const formatarDataHora = (iso: string | null) => {
  if (!iso) return "data não informada";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "data não informada";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()} ${hora}:${minuto}`;
};

const nomesDosPets = (solicitacao: Solicitacao) =>
  solicitacao.pets.length ? solicitacao.pets.map((pet) => pet.nome).join(" + ") : "sem pet vinculado";

const TEXTO_MORADIA: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  chacara: "Chácara",
};

const TEXTO_SOZINHO: Record<string, string> = {
  ate_4h: "por até 4 horas",
  "4_a_8h": "de 4 a 8 horas",
  mais_de_8h: "por mais de 8 horas",
};

const TEXTO_TELAS: Record<string, string> = {
  todas: "Sim, em todas as janelas",
  algumas: "Sim, em algumas janelas",
  nao: "Não",
};

function HighlightsCarousel({ listaDePets }: { listaDePets: Pet[] }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const { open } = useAbout();
  const capasReais = listaDePets
    .slice(0, 3)
    .map((pet) => pet.image.replace("auto=format", "fm=webp").replace(/w=\d+/, "w=800"));
  const highlightImages = [
    capasReais[0] ?? photos.caramelo,
    capasReais[1] ?? photos.mel,
    capasReais[2] ?? photos.tigrao,
  ];
  const linkExemplo = listaDePets[0] ? `/p/${listaDePets[0].slug}` : "/painel/animais";
  const goTo = (index: number) => {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "auto" });
    setActive(index);
    card.focus();
  };
  const move = (direction: -1 | 1) => goTo(Math.max(0, Math.min(1, active + direction)));
  return (
    <section
      className="highlights"
      aria-label="Destaques do AdotaPet"
      aria-roledescription="carrossel"
    >
      <div
        className="highlights-track"
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
        onScroll={(event) => {
          const track = event.currentTarget;
          const cards = Array.from(track.children) as HTMLElement[];
          const nearest = cards.reduce(
            (best, card, index) =>
              Math.abs(card.offsetLeft - track.scrollLeft) <
              Math.abs(cards[best].offsetLeft - track.scrollLeft)
                ? index
                : best,
            0,
          );
          setActive(nearest);
        }}
      >
        <article
          className="highlight-card highlight-light"
          tabIndex={-1}
          aria-label="Destaque 1 de 2: Cada pet tem uma página própria"
        >
          <img
            className="highlight-image"
            src={highlightImages[0]}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
          <div className="highlight-copy">
            <span className="highlight-icon">
              <FileText />
            </span>
            <div>
              <h2>Cada pet tem uma página própria</h2>
              <p>Foto, saúde, temperamento e história em um único link.</p>
            </div>
            <Link to={linkExemplo}>
              Ver exemplo <ArrowRight />
            </Link>
          </div>
        </article>
        <article
          className="highlight-card highlight-dark"
          tabIndex={-1}
          aria-label="Destaque 2 de 2: Adoção com processo"
        >
          <img
            className="highlight-image"
            src={highlightImages[1]}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
          <div className="highlight-copy">
            <span className="highlight-icon">
              <ClipboardList />
            </span>
            <div>
              <h2>Adoção com processo</h2>
              <p>A solicitação chega organizada, com dados completos.</p>
            </div>
            <button onClick={open}>
              Como funciona <ArrowRight />
            </button>
          </div>
        </article>
      </div>
      <div className="highlight-dots" aria-label="Navegação dos destaques">
        {[0, 1].map((index) => (
          <button
            key={index}
            className={active === index ? "active" : ""}
            aria-label={`Ir para o destaque ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { ong: minhaOng } = useOng();
  const [petsDaOng, setPetsDaOng] = useState<Pet[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!minhaOng) {
      setPetsDaOng([]);
      setSolicitacoes([]);
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    void Promise.all([listarPets(minhaOng.id), listarSolicitacoes(minhaOng.id)]).then(
      ([listaDePets, listaDeSolicitacoes]) => {
        if (!ativo) return;
        setPetsDaOng(listaDePets);
        setSolicitacoes(listaDeSolicitacoes);
        setCarregando(false);
      },
    );
    return () => {
      ativo = false;
    };
  }, [minhaOng?.id]);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const disponiveis = petsDaOng.filter((pet) => pet.status === "disponível").length;
  const novas = solicitacoes.filter((solicitacao) => solicitacao.status === "nova").length;
  const concluidas = solicitacoes.filter((solicitacao) => solicitacao.status === "concluida").length;
  const recentes = solicitacoes.slice(0, 2);
  const petDeCapa = petsDaOng[0] ?? null;
  const fotoDoBlocoQr = petDeCapa?.image ?? photos.caramelo;
  const caminhoDaOng = minhaOng ? `/ong/${minhaOng.slug}` : "";
  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow={hoje.charAt(0).toUpperCase() + hoje.slice(1)}
        title={`Olá, ${minhaOng?.nome ?? "sua ONG"}`}
        action={
          <Link className="button button-primary desktop-action" to="/painel/animais/novo">
            <Plus />
            Cadastrar pet
          </Link>
        }
      />
      <HighlightsCarousel listaDePets={petsDaOng} />
      <Link className="home-qr-block" to="/painel/qr">
        <div className="home-qr-copy">
          <span>
            <QrCode />
          </span>
          <div>
            <h2>Sua ONG em um QR Code</h2>
            <p>
              Sua página pública fica em {caminhoDaOng || "/ong/sua-ong"} e reúne todos os pets
              disponíveis.
            </p>
          </div>
          <b>
            Ver meu QR <ArrowRight />
          </b>
        </div>
        <img
          src={fotoDoBlocoQr}
          alt={petDeCapa ? `Foto de ${petDeCapa.name}` : "Pet disponível para adoção"}
          style={{ objectPosition: petDeCapa ? petObjectPosition(petDeCapa) : "50% 35%" }}
          loading="lazy"
        />
      </Link>
      <div className="metric-grid">
        <div>
          <strong>{carregando ? "…" : disponiveis}</strong>
          <p>pets disponíveis</p>
        </div>
        <div>
          <strong>{carregando ? "…" : novas}</strong>
          <p>solicitações novas</p>
        </div>
        <div>
          <strong>{carregando ? "…" : concluidas}</strong>
          <p>adoções concluídas</p>
        </div>
      </div>
      <SectionCard
        title="Solicitações recentes"
        action={
          <Link className="text-link" to="/painel/solicitacoes">
            Ver todas
          </Link>
        }
      >
        {carregando ? (
          <ListSkeleton count={2} />
        ) : recentes.length ? (
          <div className="request-list">
            {recentes.map((solicitacao) => (
              <Link key={solicitacao.id} to={`/painel/solicitacoes/${solicitacao.id}`}>
                <span className="avatar" aria-hidden="true">
                  {iniciais(solicitacao.nome)}
                </span>
                <div>
                  <b>{solicitacao.nome}</b>
                  <small>
                    {nomesDosPets(solicitacao)} · {formatarDataHora(solicitacao.criado_em)}
                  </small>
                </div>
                <StatusBadge status={ROTULO_SOLICITACAO[solicitacao.status]} />
                <ArrowRight />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma solicitação por enquanto"
            text="Quando alguém enviar uma solicitação pelo formulário público, ela aparece aqui."
            action="Ver meus pets"
            to="/painel/animais"
          />
        )}
      </SectionCard>
    </div>
  );
}

export function PetsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const forcedState = new URLSearchParams(window.location.search).get("estado");
  const { ong: ongDaSessao } = useOng();
  const [isLoading, setIsLoading] = useState(true);
  const [meusPets, setMeusPets] = useState<Pet[]>([]);
  const [menuPet, setMenuPet] = useState<string | null>(null);
  const [confirmPet, setConfirmPet] = useState<Pet | null>(null);
  const [toast, setToast] = useState<{ name: string; id: string; previous: PetStatus } | null>(
    null,
  );
  useEffect(() => {
    if (!ongDaSessao) return;
    let ativo = true;
    setIsLoading(true);
    void listarPets(ongDaSessao.id).then((lista) => {
      if (!ativo) return;
      setMeusPets(lista);
      setIsLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, [ongDaSessao?.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const currentPets = meusPets;
  const shown = currentPets.filter(
    (p) =>
      (filter === "todos" || p.status === filter) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const updateStatus = (id: string, status: PetStatus) => {
    setMeusPets((atual) => atual.map((p) => (p.id === id ? { ...p, status } : p)));
    void atualizarStatusPet(id, status);
  };
  const confirmAdoption = () => {
    if (!confirmPet) return;
    const previous = confirmPet.status;
    updateStatus(confirmPet.id, "adotado");
    setToast({ name: confirmPet.name, id: confirmPet.id, previous });
    setConfirmPet(null);
  };
  return (
    <div className="dashboard-page pets-page">
      <PageHeader
        title="Seus pets"
        eyebrow={`${meusPets.length} ${meusPets.length === 1 ? "animal cadastrado" : "animais cadastrados"}`}
        className="pet-list-header"
        action={
          <Link
            className="button button-primary pet-add-button"
            to="/painel/animais/novo"
            aria-label="Cadastrar novo pet"
          >
            <Plus />
          </Link>
        }
      />
      <div className="filter-bar">
        <label className="search-box">
          <Search />
          <input
            aria-label="Buscar por nome"
            placeholder="Buscar por nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filter-chips">
          {["todos", "disponível", "em processo", "adotado", "indisponível"].map((x) => {
            const tone = x === "disponível" ? "green" : x === "em processo" ? "amber" : "gray";
            return (
              <button
                key={x}
                className={`${filter === x ? "active" : ""} ${x === "adotado" ? "adopted-filter" : ""}`}
                onClick={() => setFilter(x)}
              >
                {x === "adotado" ? (
                  <Check className="filter-check" aria-hidden="true" />
                ) : (
                  <span className={`filter-dot status-${tone}`} aria-hidden="true" />
                )}
                {x.charAt(0).toUpperCase() + x.slice(1)}
              </button>
            );
          })}
        </div>
      </div>
      {forcedState === "erro" ? (
        <ErrorState
          title="Não foi possível carregar os pets"
          text="Confira sua conexão e tente novamente."
        />
      ) : forcedState === "vazio" ? (
        <EmptyState
          title="Nenhum pet cadastrado ainda"
          text="Cadastre o primeiro animal para criar sua ficha pública e gerar o QR Code."
          action="Cadastrar o primeiro pet"
          to="/painel/animais/novo"
        />
      ) : isLoading ? (
        <ListSkeleton />
      ) : meusPets.length === 0 ? (
        <EmptyState
          title="Nenhum pet cadastrado ainda"
          text="Cadastre o primeiro animal para criar sua ficha pública e gerar o QR Code."
          action="Cadastrar o primeiro pet"
          to="/painel/animais/novo"
        />
      ) : shown.length ? (
        <div className="admin-pet-grid">
          {shown.map((p) => (
            <article key={p.id} className="admin-pet-card">
              <img src={p.image} alt="" style={{ objectPosition: petObjectPosition(p) }} />
              <div>
                <div className="row-between">
                  <h3>{p.name}</h3>
                  <StatusBadge status={p.status} />
                  <button
                    className="icon-button"
                    aria-label="Mais ações"
                    onClick={() => setMenuPet(menuPet === p.id ? null : p.id)}
                  >
                    <MoreHorizontal />
                  </button>
                  {menuPet === p.id && (
                    <div className="pet-action-menu">
                      <Link to={`/painel/animais/${p.id}`}>
                        <Edit3 /> Editar
                      </Link>
                      <Link to={`/painel/animais/${p.id}/qr`}>
                        <QrCode /> QR code
                      </Link>
                      <button
                        onClick={async () => {
                          const url = `${getPublicBaseUrl()}/pet/${p.slug}`;
                          if (navigator.share) {
                            try {
                              await navigator.share({ title: p.name, url });
                              return;
                            } catch {
                              /* usuário cancelou */
                            }
                          }
                          await navigator.clipboard?.writeText(url);
                        }}
                      >
                        <ExternalLink /> Compartilhar
                      </button>
                      <button className="danger-action">
                        <Trash2 /> Excluir
                      </button>
                    </div>
                  )}
                </div>
                <p>
                  {p.species} · {p.sex} · {p.size} · {p.age}
                </p>
                <div className="card-links quick-pet-actions">
                  {p.status === "adotado" ? (
                    <button onClick={() => updateStatus(p.id, "disponível")}>
                      <Archive /> Reabrir anúncio
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setConfirmPet(p)}>
                        <CheckCircle2 /> Marcar como adotado
                      </button>
                      <button onClick={() => updateStatus(p.id, "indisponível")}>
                        <Archive /> Marcar indisponível
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum pet encontrado"
          text="Tente outro filtro ou cadastre um novo animal."
          action="Cadastrar pet"
          to="/painel/animais/novo"
        />
      )}
      {confirmPet && (
        <div
          className="sheet-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setConfirmPet(null)}
        >
          <div
            className="sheet compact-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adoption-confirm-title"
          >
            <span className="sheet-handle" />
            <h2 id="adoption-confirm-title">Confirmar adoção de {confirmPet.name}?</h2>
            <p>O anúncio sai da lista de disponíveis e o pet passa para Adotados.</p>
            <div className="sheet-actions">
              <Button variant="secondary" onClick={() => setConfirmPet(null)}>
                Cancelar
              </Button>
              <Button onClick={confirmAdoption}>Confirmar adoção</Button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.name} marcado como adotado</span>
          <button
            onClick={() => {
              updateStatus(toast.id, toast.previous);
              setToast(null);
            }}
          >
            Desfazer
          </button>
        </div>
      )}
    </div>
  );
}

export function PetFormPage() {
  const { id } = useParams();
  const edit = !!id;
  const navigate = useNavigate();
  const { ong } = useOng();
  const inputFoto = useRef<HTMLInputElement>(null);

  const [carregando, setCarregando] = useState(edit);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState<"cao" | "gato">("cao");
  const [sexo, setSexo] = useState<"macho" | "femea">("macho");
  const [porte, setPorte] = useState<"pequeno" | "medio" | "grande">("medio");
  const [raca, setRaca] = useState("");
  const [anos, setAnos] = useState("2");
  const [meses, setMeses] = useState("0");
  const [cidade, setCidade] = useState("");
  const [status, setStatus] = useState<PetStatus>("disponível");
  const [castrado, setCastrado] = useState(true);
  const [vacinado, setVacinado] = useState(true);
  const [vermifugado, setVermifugado] = useState(true);
  const [condicoes, setCondicoes] = useState("");
  const [temperamento, setTemperamento] = useState<string[]>([]);
  const [story, setStory] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [previa, setPrevia] = useState("");
  const [focal, setFocal] = useState<PetFocalPoint>("face");
  const [photoAdjustOpen, setPhotoAdjustOpen] = useState(false);
  const [photoAdjustment, setPhotoAdjustment] = useState<PhotoAdjustment>({
    src: "",
    focalX: 50,
    focalY: 30,
    zoom: 1,
  });

  useEffect(() => {
    if (!edit || !id) return;
    let ativo = true;
    void carregarPet(id).then((pet) => {
      if (!ativo || !pet) {
        setCarregando(false);
        return;
      }
      setNome(pet.nome);
      setEspecie(pet.especie);
      setSexo(pet.sexo);
      setPorte(pet.porte);
      setRaca(pet.raca ?? "");
      const total = pet.idade_meses ?? 0;
      setAnos(String(Math.floor(total / 12)));
      setMeses(String(total % 12));
      setCidade(pet.cidade ?? "");
      setStatus(
        pet.status === "em_processo"
          ? "em processo"
          : pet.status === "disponivel"
            ? "disponível"
            : pet.status === "indisponivel"
              ? "indisponível"
              : pet.status === "adotado"
                ? "adotado"
                : "rascunho",
      );
      setCastrado(pet.castrado);
      setVacinado(pet.vacinado);
      setVermifugado(pet.vermifugado);
      setCondicoes(pet.condicoes_especiais ?? "");
      setTemperamento(pet.temperamento ?? []);
      setStory(pet.descricao ?? "");
      setFocal(focalDoBanco[pet.foto_enquadramento]);
      setPrevia(pet.foto_url ?? "");
      void listarFotosPet(pet.id).then((galeria) => {
        if (!ativo) return;
        const lista = galeria.length ? galeria : pet.foto_url ? [pet.foto_url] : [];
        setFotos(lista);
        if (lista[0]) setPrevia(lista[0]);
      });
      setPhotoAdjustment({
        src: pet.foto_url ?? "",
        focalX: pet.foto_foco_x,
        focalY: pet.foto_foco_y,
        zoom: Number(pet.foto_zoom),
      });
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [edit, id]);

  useEffect(() => {
    if (!ong) return;
    setCidade((atual) => atual || ong.cidade || "");
  }, [ong]);

  const escolherFotos = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const escolhidas = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (!escolhidas.length || !ong) return;

    const espaco = LIMITE_FOTOS - fotos.length;
    if (espaco <= 0) {
      setErro(`Você já enviou ${LIMITE_FOTOS} fotos. Remova uma para adicionar outra.`);
      return;
    }

    setErro("");
    setEnviandoFotos(true);
    try {
      const enviadas: string[] = [];
      for (const arquivo of escolhidas.slice(0, espaco)) {
        if (!arquivo.type.startsWith("image/")) {
          throw new Error("Escolha apenas arquivos de imagem, como JPG ou PNG.");
        }
        enviadas.push(await enviarFoto(arquivo, ong.id));
      }

      setFotos((atuais) => {
        const lista = [...atuais, ...enviadas].slice(0, LIMITE_FOTOS);
        setPrevia(lista[0] ?? "");
        setPhotoAdjustment((atual) => ({ ...atual, src: lista[0] ?? "" }));
        return lista;
      });

      if (escolhidas.length > espaco) {
        setErro(`Só cabem ${LIMITE_FOTOS} fotos. Enviamos as primeiras ${espaco}.`);
      }
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFotos(false);
    }
  };

  const removerFoto = (url: string) => {
    setFotos((atuais) => {
      const lista = atuais.filter((item) => item !== url);
      setPrevia(lista[0] ?? "");
      setPhotoAdjustment((atual) => ({ ...atual, src: lista[0] ?? "" }));
      return lista;
    });
  };

  const tornarCapa = (url: string) => {
    setFotos((atuais) => {
      const lista = [url, ...atuais.filter((item) => item !== url)];
      setPrevia(lista[0] ?? "");
      setPhotoAdjustment((atual) => ({ ...atual, src: lista[0] ?? "" }));
      return lista;
    });
  };

  const alternarTemperamento = (valor: string) =>
    setTemperamento((atual) =>
      atual.includes(valor) ? atual.filter((t) => t !== valor) : [...atual, valor],
    );

  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro("");

    if (!ong) return setErro("Não encontramos a ONG da sua sessão. Entre novamente.");
    if (!fotos.length) return setErro("Escolha pelo menos uma foto do pet antes de salvar.");

    setEnviando(true);
    try {
      const fotoUrl = fotos[0];
      const dados = {
        ongId: ong.id,
        nome: nome.trim(),
        especie,
        sexo,
        porte,
        idadeMeses: Number(anos || 0) * 12 + Number(meses || 0),
        raca: raca.trim(),
        castrado,
        vacinado,
        vermifugado,
        condicoesEspeciais: condicoes.trim(),
        temperamento,
        descricao: story.trim(),
        cidade: cidade.trim(),
        uf: ong.uf ?? undefined,
        fotoUrl,
        fotos,
        enquadramento: focal,
        focoX: photoAdjustment.focalX,
        focoY: photoAdjustment.focalY,
        zoom: photoAdjustment.zoom,
        status,
      };

      if (edit && id) {
        await atualizarPet(id, dados);
        navigate(`/painel/animais/${id}/qr`);
      } else {
        const criado = await criarPet(dados);
        navigate(`/painel/animais/${criado.id}/qr`);
      }
    } catch (falha) {
      console.error(falha);
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar o pet.");
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="dashboard-page form-page">
        <PageHeader title="Carregando pet" eyebrow="Ficha pública" />
      </div>
    );
  }

  return (
    <div className="dashboard-page form-page">
      <PageHeader
        title={edit ? `Editar ${nome}` : "Cadastrar novo pet"}
        eyebrow={edit ? "Ficha pública" : "Novo animal"}
      />
      <form className="form-stack" onSubmit={salvar}>
        <SectionCard title="Informações básicas">
          <div className="form-grid">
            <TextField
              label="Nome *"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Caramelo"
              required
            />
            <Select
              label="Espécie *"
              required
              value={especie}
              onChange={(e) => setEspecie(e.target.value as "cao" | "gato")}
            >
              <option value="cao">Cão</option>
              <option value="gato">Gato</option>
            </Select>
            <Select
              label="Sexo *"
              required
              value={sexo}
              onChange={(e) => setSexo(e.target.value as "macho" | "femea")}
            >
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </Select>
            <Select
              label="Porte *"
              required
              value={porte}
              onChange={(e) => setPorte(e.target.value as "pequeno" | "medio" | "grande")}
            >
              <option value="pequeno">Pequeno</option>
              <option value="medio">Médio</option>
              <option value="grande">Grande</option>
            </Select>
            <TextField
              label="Raça (opcional)"
              placeholder="Sem raça definida"
              value={raca}
              onChange={(e) => setRaca(e.target.value)}
            />
            <div className="age-fields">
              <TextField
                label="Anos *"
                type="number"
                min="0"
                value={anos}
                onChange={(e) => setAnos(e.target.value)}
                required
              />
              <TextField
                label="Meses *"
                type="number"
                min="0"
                max="11"
                value={meses}
                onChange={(e) => setMeses(e.target.value)}
                required
              />
            </div>
          </div>
          {nome && (
            <div className="url-preview">
              <Link2 />
              <span>
                <small>URL pública estável</small>
                <b>
                  {getPublicBaseUrl()}
                  {petPublicPath(nome)}
                </b>
                <em>O link não muda depois de publicado.</em>
              </span>
              <button
                type="button"
                aria-label="Copiar URL"
                onClick={() =>
                  navigator.clipboard?.writeText(`${getPublicBaseUrl()}${petPublicPath(nome)}`)
                }
              >
                <Copy />
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Saúde">
          <div className="switch-grid">
            <Switch label="Castrado" checked={castrado} onChange={() => setCastrado(!castrado)} />
            <Switch label="Vacinado" checked={vacinado} onChange={() => setVacinado(!vacinado)} />
            <Switch
              label="Vermifugado"
              checked={vermifugado}
              onChange={() => setVermifugado(!vermifugado)}
            />
          </div>
          <TextField
            label="Condições especiais"
            placeholder="Ex.: alergia, medicação contínua"
            value={condicoes}
            onChange={(e) => setCondicoes(e.target.value)}
          />
        </SectionCard>

        <SectionCard title="Jeito de ser">
          <div className="temper-picker">
            {[
              "Brincalhão",
              "Tranquilo",
              "Carinhoso",
              "Independente",
              "Sociável com crianças",
              "Sociável com animais",
            ].map((t) => {
              const escolhido = temperamento.includes(t);
              return (
                <button
                  type="button"
                  className={escolhido ? "selected" : ""}
                  key={t}
                  onClick={() => alternarTemperamento(t)}
                >
                  {escolhido && <Check />}
                  {t}
                </button>
              );
            })}
          </div>
          <TextArea
            label="História *"
            maxLength={600}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            hint="Conte como foi o resgate e o que torna este pet especial."
            required
          />
        </SectionCard>

        <SectionCard title="Publicação">
          <div className="form-grid">
            <TextField
              label="Cidade *"
              required
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Select
              label="Status *"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as PetStatus)}
            >
              <option value="disponível">Disponível</option>
              <option value="em processo">Em processo</option>
              <option value="adotado">Adotado</option>
              <option value="indisponível">Indisponível</option>
              <option value="rascunho">Rascunho</option>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Fotos *">
          <div className="form-stack">
            <div>
              <Button
                variant="secondary"
                type="button"
                onClick={() => inputFoto.current?.click()}
                loading={enviandoFotos}
                disabled={enviandoFotos || fotos.length >= LIMITE_FOTOS}
              >
                {fotos.length ? "Adicionar foto" : "Escolher fotos"}
              </Button>
              <input
                ref={inputFoto}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={escolherFotos}
              />
              <p className="field-hint">
                Até {LIMITE_FOTOS} fotos, de preferência horizontais e com o rosto do animal
                visível. A primeira é a capa do perfil e aparece na lista de pets.
              </p>
            </div>
            {fotos.length > 0 && (
              <div className="photo-strip" role="list" aria-label="Fotos enviadas">
                {fotos.map((url, indice) => (
                  <div className="photo-strip-item" role="listitem" key={url}>
                    <img src={url} alt={`Foto ${indice + 1} do pet`} />
                    <div className="photo-strip-actions">
                      {indice === 0 ? (
                        <Badge tone="amber">Capa</Badge>
                      ) : (
                        <button
                          type="button"
                          className="photo-strip-link"
                          onClick={() => tornarCapa(url)}
                        >
                          Usar como capa
                        </button>
                      )}
                      <button
                        type="button"
                        className="photo-strip-remove"
                        onClick={() => removerFoto(url)}
                        aria-label={`Remover a foto ${indice + 1}`}
                        disabled={fotos.length === 1}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="field-hint" aria-live="polite">
              {fotos.length} de {LIMITE_FOTOS} fotos enviadas.
            </p>
            {previa && (
              <div className="photo-preview">
                <img
                  src={previa}
                  alt="Prévia da foto"
                  style={{
                    objectPosition: `${photoAdjustment.focalX}% ${photoAdjustment.focalY}%`,
                    transform: `scale(${photoAdjustment.zoom})`,
                  }}
                />
                <Badge tone="amber">Capa</Badge>
              </div>
            )}
            <Button
              variant="secondary"
              type="button"
              onClick={() => setPhotoAdjustOpen(true)}
              disabled={!previa}
            >
              Ajustar enquadramento
            </Button>
            <Select
              label="Ponto focal da capa"
              value={focal}
              onChange={(event) => {
                const proximo = event.target.value as PetFocalPoint;
                setFocal(proximo);
                setPhotoAdjustment((atual) => ({
                  ...atual,
                  focalX: 50,
                  focalY: proximo === "top" ? 20 : proximo === "center" ? 50 : 30,
                }));
              }}
            >
              <option value="face">Rosto</option>
              <option value="top">Topo</option>
              <option value="center">Centro</option>
            </Select>
          </div>
        </SectionCard>

        {erro && (
          <p className="form-alert" aria-live="polite">
            <Info size={16} />
            {erro}
          </p>
        )}

        <div className="sticky-form-actions">
          <Button variant="ghost" type="button" onClick={() => navigate("/painel/animais")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando} loading={enviando}>
            {enviando ? "Salvando..." : "Salvar pet"}
          </Button>
        </div>
      </form>
      <PhotoAdjuster
        open={photoAdjustOpen}
        initial={photoAdjustment.src || previa}
        onClose={() => setPhotoAdjustOpen(false)}
        onUse={(adjustment) => {
          setPhotoAdjustment(adjustment);
          setPhotoAdjustOpen(false);
        }}
      />
    </div>
  );
}

export function QrPage({ ongQr = false }: { ongQr?: boolean }) {
  const { id } = useParams();
  const { ong: minhaOng, carregando: carregandoOng } = useOng();
  const [pet, setPet] = useState<PetDetalhado | null>(null);
  const [carregandoPet, setCarregandoPet] = useState(!ongQr);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const ongQrRef = useRef<HTMLCanvasElement>(null);
  const petQrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ongQr || !id) {
      setCarregandoPet(false);
      return;
    }
    let ativo = true;
    setCarregandoPet(true);
    void carregarPet(id).then((encontrado) => {
      if (!ativo) return;
      setPet(encontrado);
      setCarregandoPet(false);
    });
    return () => {
      ativo = false;
    };
  }, [id, ongQr]);

  useEffect(() => {
    if (!linkCopiado) return;
    const timer = window.setTimeout(() => setLinkCopiado(false), 3000);
    return () => window.clearTimeout(timer);
  }, [linkCopiado]);

  const slugOng = minhaOng?.slug ?? "";
  const slugPet = pet ? pet.slug ?? pet.id : "";
  const urlOng = slugOng ? `${getPublicBaseUrl()}/ong/${slugOng}` : "";
  const urlPet = slugPet ? `${getPublicBaseUrl()}/p/${slugPet}` : "";
  const urlPublica = ongQr ? urlOng : urlPet;
  const caminhoPublico = ongQr ? `/ong/${slugOng}` : `/p/${slugPet}`;
  const nomeArquivo = ongQr ? `adotapet-ong-${slugOng}.png` : `adotapet-${slugPet}.png`;
  const nomeOng = minhaOng?.nome ?? "sua ONG";
  const nomePet = pet?.nome ?? "este pet";
  const fotoDoPet = pet?.foto_url ?? photos.caramelo;

  const copiarLink = async () => {
    if (!urlPublica) return;
    await navigator.clipboard?.writeText(urlPublica);
    setLinkCopiado(true);
  };

  const compartilhar = async () => {
    if (!urlPublica) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: ongQr ? nomeOng : nomePet, url: urlPublica });
        return;
      } catch {
        /* a pessoa cancelou o compartilhamento */
      }
    }
    await copiarLink();
  };

  const baixarQr = () => {
    const canvas = ongQr ? ongQrRef.current : petQrRef.current;
    if (!canvas) return;
    const ancora = document.createElement("a");
    ancora.download = nomeArquivo;
    ancora.href = canvas.toDataURL("image/png");
    ancora.click();
  };

  if (ongQr ? carregandoOng : carregandoPet) {
    return (
      <div className="dashboard-page">
        <PageHeader title="QR Code" eyebrow="Preparando o cartaz" />
        <ListSkeleton count={2} />
      </div>
    );
  }

  if (ongQr && !minhaOng) {
    return (
      <div className="dashboard-page">
        <PageHeader title="QR Code da ONG" eyebrow="Pronto para imprimir" />
        <SectionCard title="Não encontramos os dados da ONG">
          <p>Entre novamente para carregar o perfil da sua instituição.</p>
          <Link className="button button-secondary" to="/entrar">
            Voltar para o login
          </Link>
        </SectionCard>
      </div>
    );
  }

  if (!ongQr && !pet) {
    return (
      <div className="dashboard-page">
        <PageHeader title="QR Code do pet" eyebrow="Pet não encontrado" />
        <SectionCard title="Não encontramos este pet">
          <p>
            O link pode ter mudado ou o animal foi removido. Confira a lista de pets da sua ONG e
            abra o QR por lá.
          </p>
          <Link className="button button-secondary" to="/painel/animais">
            Ver meus pets
          </Link>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title={ongQr ? "QR Code da ONG" : `QR Code de ${nomePet}`}
        eyebrow="Pronto para imprimir"
      />
      {!ongQr && pet?.status === "rascunho" && (
        <p className="system-note" aria-live="polite">
          <Info size={16} />
          Este pet está como rascunho e ainda não aparece publicamente. Publique a ficha em
          /painel/animais para que o QR funcione.
        </p>
      )}
      <div className="qr-layout">
        <div>
          <TagCard className="qr-card">
            <span className="qr-label">
              <QrCode size={18} />
              AdotaPet
            </span>
            {ongQr ? (
              minhaOng?.logo_url ? (
                <div className="ong-qr-logo">
                  <img
                    src={minhaOng.logo_url}
                    alt={`Logo de ${nomeOng}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 }}
                  />
                </div>
              ) : (
                <div className="ong-qr-logo" aria-hidden="true">
                  {iniciais(nomeOng)}
                </div>
              )
            ) : (
              <img
                src={fotoDoPet}
                alt={`Foto de ${nomePet}`}
                style={{
                  width: 96,
                  height: 96,
                  margin: "14px auto 0",
                  display: "block",
                  objectFit: "cover",
                  borderRadius: 24,
                }}
              />
            )}
            <div className="qr-wrap">
              <QRCodeSVG
                value={urlPublica}
                size={190}
                bgColor="#ffffff"
                fgColor="#101010"
                level="M"
                includeMargin
              />
            </div>
            <h2>{ongQr ? nomeOng : nomePet}</h2>
            <p>{ongQr ? "Conheça nossos pets disponíveis" : nomeOng}</p>
            <Badge tone="amber">Aponte a câmera</Badge>
          </TagCard>
          <div className="qr-actions">
            <Button icon={<Download />} onClick={baixarQr}>
              {ongQr ? "Baixar QR da ONG" : "Baixar QR do pet"}
            </Button>
            <Button variant="secondary" icon={<Copy />} onClick={() => void copiarLink()}>
              Copiar link
            </Button>
            <Link className="button button-secondary" to={caminhoPublico}>
              <ExternalLink />
              {ongQr ? "Abrir página da ONG" : "Abrir ficha pública"}
            </Link>
            <Button variant="secondary" icon={<Share2 />} onClick={() => void compartilhar()}>
              Compartilhar
            </Button>
          </div>
          {ongQr ? (
            <QrActions context="ong" ong={{ name: nomeOng, slug: slugOng }} url={urlOng} />
          ) : pet ? (
            <QrActions context="pet" pet={petParaCard(pet)} url={urlPet} />
          ) : null}
          {ongQr ? (
            <QRCodeCanvas
              ref={ongQrRef}
              className="export-qr-source"
              value={urlOng}
              size={1024}
              includeMargin
              level="M"
              bgColor="#ffffff"
              fgColor="#101010"
            />
          ) : (
            <QRCodeCanvas
              ref={petQrRef}
              className="export-qr-source"
              value={urlPet}
              size={1024}
              includeMargin
              level="M"
              bgColor="#ffffff"
              fgColor="#101010"
            />
          )}
        </div>
        <div className="qr-info">
          <SectionCard title={ongQr ? "Compartilhe todos os seus pets" : "Como usar"}>
            <ol className="number-list">
              <li>
                <span>1</span>
                <p>
                  <b>Escolha o formato ideal</b>
                  <small>Cartaz A4, post quadrado ou story vertical.</small>
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  <b>Confira a prévia</b>
                  <small>A foto e o QR respeitam o layout do AdotaPet.</small>
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  <b>Baixe e compartilhe</b>
                  <small>
                    {ongQr
                      ? "Quem escanear vê todos os seus pets disponíveis."
                      : "Coleira, cartaz da feira ou mural da clínica."}
                  </small>
                </p>
              </li>
            </ol>
          </SectionCard>
          <p className="system-note">
            <ShieldCheck />O QR aponta para um link público estável. Ele não guarda dados pessoais.
          </p>
        </div>
      </div>
      {linkCopiado && (
        <div className="toast" role="status">
          <span>Link copiado</span>
        </div>
      )}
    </div>
  );
}

export function OngSettingsPage() {
  const { ong: minhaOng, carregando, salvar } = useOng();
  const idCarregado = useRef<string | null>(null);
  const inputLogo = useRef<HTMLInputElement>(null);
  const inputCapa = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [siteInstagram, setSiteInstagram] = useState("");
  const [endereco, setEndereco] = useState("");
  const [sobre, setSobre] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    if (!minhaOng || idCarregado.current === minhaOng.id) return;
    idCarregado.current = minhaOng.id;
    setNome(minhaOng.nome ?? "");
    setCidade(minhaOng.cidade ?? "");
    setUf(minhaOng.uf ?? "");
    setWhatsapp(minhaOng.whatsapp ?? "");
    setSiteInstagram(minhaOng.site_instagram ?? "");
    setEndereco(minhaOng.endereco ?? "");
    setSobre(minhaOng.sobre ?? "");
  }, [minhaOng]);

  useEffect(() => {
    if (!linkCopiado) return;
    const timer = window.setTimeout(() => setLinkCopiado(false), 3000);
    return () => window.clearTimeout(timer);
  }, [linkCopiado]);

  const urlPublica = minhaOng ? `${getPublicBaseUrl()}/ong/${minhaOng.slug}` : "";

  const enviarImagem = async (arquivo: File | undefined, tipo: "logo" | "capa") => {
    if (!arquivo || !minhaOng) return;
    if (!arquivo.type.startsWith("image/")) {
      setAviso({ tipo: "erro", texto: "Escolha um arquivo de imagem, como JPG ou PNG." });
      return;
    }
    setAviso(null);
    if (tipo === "logo") setEnviandoLogo(true);
    else setEnviandoCapa(true);
    try {
      const url = await enviarFoto(arquivo, minhaOng.id);
      const erro = await salvar(tipo === "logo" ? { logo_url: url } : { capa_url: url });
      setAviso(
        erro
          ? { tipo: "erro", texto: erro }
          : { tipo: "sucesso", texto: tipo === "logo" ? "Logo atualizada." : "Capa atualizada." },
      );
    } catch (falha) {
      setAviso({
        tipo: "erro",
        texto: falha instanceof Error ? falha.message : "Não foi possível enviar a imagem.",
      });
    } finally {
      if (tipo === "logo") setEnviandoLogo(false);
      else setEnviandoCapa(false);
    }
  };

  const enviarFormulario = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setAviso(null);
    if (nome.trim().length < 3) {
      setAviso({ tipo: "erro", texto: "O nome da ONG precisa ter pelo menos 3 caracteres." });
      return;
    }
    if (!cidade.trim()) {
      setAviso({ tipo: "erro", texto: "Informe a cidade da ONG." });
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 10) {
      setAviso({ tipo: "erro", texto: "Informe o WhatsApp com DDD, com pelo menos 10 dígitos." });
      return;
    }
    setSalvando(true);
    const erro = await salvar({
      nome: nome.trim(),
      cidade: cidade.trim(),
      uf: uf || null,
      whatsapp: whatsapp.trim(),
      site_instagram: siteInstagram.trim() || null,
      endereco: endereco.trim() || null,
      sobre: sobre.trim() || null,
    });
    setSalvando(false);
    setAviso(
      erro
        ? { tipo: "erro", texto: erro }
        : { tipo: "sucesso", texto: "Dados salvos. Sua página pública já mostra as mudanças." },
    );
  };

  if (carregando && !minhaOng) {
    return (
      <div className="dashboard-page form-page">
        <PageHeader title="Dados da ONG" eyebrow="Perfil público" />
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!minhaOng) {
    return (
      <div className="dashboard-page form-page">
        <PageHeader title="Dados da ONG" eyebrow="Perfil público" />
        <SectionCard title="Não encontramos a ONG da sua sessão">
          <p>Entre novamente para editar os dados da instituição.</p>
          <Link className="button button-secondary" to="/entrar">
            Voltar para o login
          </Link>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="dashboard-page form-page">
      <PageHeader title="Dados da ONG" eyebrow="Perfil público" />
      <form className="form-stack" onSubmit={enviarFormulario}>
        <SectionCard title="Identidade">
          <div className="ong-cover-field">
            <span className="field-label">Capa do perfil público</span>
            <div className="cover-preview">
              {minhaOng.capa_url ? (
                <img src={minhaOng.capa_url} alt={`Capa da página de ${minhaOng.nome}`} />
              ) : (
                <div className="cover-placeholder">Nenhuma capa enviada ainda</div>
              )}
              <button
                type="button"
                className="cover-edit-button"
                onClick={() => inputCapa.current?.click()}
                disabled={enviandoCapa}
              >
                <Camera /> {enviandoCapa ? "Enviando..." : "Alterar capa"}
              </button>
            </div>
            <input
              ref={inputCapa}
              type="file"
              accept="image/*"
              hidden
              aria-label="Escolher imagem de capa"
              onChange={(evento) => {
                void enviarImagem(evento.target.files?.[0], "capa");
                evento.target.value = "";
              }}
            />
            <small>Aparece no topo da sua página pública. Formato 3 por 1.</small>
          </div>
          <div className="ong-cover-field">
            <span className="field-label">Logo da ONG</span>
            {minhaOng.logo_url ? (
              <div className="cover-preview" style={{ width: 120, aspectRatio: "1 / 1" }}>
                <img src={minhaOng.logo_url} alt={`Logo de ${minhaOng.nome}`} />
              </div>
            ) : (
              <div className="ong-avatar" style={{ width: 120, height: 120 }} aria-hidden="true">
                {iniciais(minhaOng.nome)}
              </div>
            )}
            <div>
              <Button
                variant="secondary"
                type="button"
                icon={<Upload />}
                loading={enviandoLogo}
                disabled={enviandoLogo}
                onClick={() => inputLogo.current?.click()}
              >
                {minhaOng.logo_url ? "Trocar logo" : "Enviar logo"}
              </Button>
            </div>
            <input
              ref={inputLogo}
              type="file"
              accept="image/*"
              hidden
              aria-label="Escolher imagem de logo"
              onChange={(evento) => {
                void enviarImagem(evento.target.files?.[0], "logo");
                evento.target.value = "";
              }}
            />
            <small>Use uma imagem quadrada. Ela aparece na página pública e nos cartazes.</small>
          </div>
          <div className="form-grid">
            <TextField
              label="Nome da instituição *"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <TextField
              label="E-mail de acesso"
              value={minhaOng.email}
              readOnly
              hint="Este é o e-mail usado para entrar no painel. Para trocar, fale com o suporte."
            />
          </div>
          <TextArea
            label="Descrição"
            maxLength={600}
            value={sobre}
            onChange={(e) => setSobre(e.target.value)}
            hint="Conte a história da ONG e o trabalho que vocês fazem."
          />
        </SectionCard>
        <SectionCard title="Contato e localização">
          <div className="form-grid">
            <TextField
              label="WhatsApp *"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 98888-7777"
            />
            <TextField
              label="Site ou Instagram"
              value={siteInstagram}
              onChange={(e) => setSiteInstagram(e.target.value)}
              placeholder="@suaong"
            />
            <TextField
              label="Cidade *"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              required
            />
            <Select label="UF" value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">Selecione</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <TextField
              label="Endereço (opcional)"
              className="span-2"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </div>
          <div className="url-preview">
            <Link2 />
            <span>
              <small>Página pública da ONG</small>
              <b>{urlPublica}</b>
              <em>Compartilhe este link com quem quer conhecer seus pets.</em>
            </span>
            <button
              type="button"
              aria-label="Copiar link da página pública"
              onClick={() => {
                void navigator.clipboard?.writeText(urlPublica);
                setLinkCopiado(true);
              }}
            >
              <Copy />
            </button>
          </div>
        </SectionCard>
        {aviso && (
          <p className={aviso.tipo === "erro" ? "form-alert" : "system-note"} aria-live="polite">
            <Info size={16} />
            {aviso.texto}
          </p>
        )}
        <div className="sticky-form-actions">
          <Button type="submit" disabled={salvando} loading={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
      {linkCopiado && (
        <div className="toast" role="status">
          <span>Link copiado</span>
        </div>
      )}
    </div>
  );
}

export function RequestsPage() {
  const { ong: minhaOng, carregando: carregandoOng } = useOng();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filter, setFilter] = useState<"todas" | StatusSolicitacao>("todas");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!minhaOng) {
      setSolicitacoes([]);
      setCarregando(carregandoOng);
      return;
    }
    let ativo = true;
    setCarregando(true);
    void listarSolicitacoes(minhaOng.id).then((lista) => {
      if (!ativo) return;
      setSolicitacoes(lista);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [minhaOng?.id, carregandoOng]);

  const termo = busca.trim().toLowerCase();
  const filtradas = solicitacoes.filter((solicitacao) => {
    const bateStatus = filter === "todas" || solicitacao.status === filter;
    const bateBusca =
      !termo ||
      solicitacao.nome.toLowerCase().includes(termo) ||
      solicitacao.protocolo.toLowerCase().includes(termo);
    return bateStatus && bateBusca;
  });
  const opcoes: [("todas" | StatusSolicitacao), string][] = [
    ["todas", "Todas"],
    ["nova", "Novas"],
    ["em_analise", "Em análise"],
    ["concluida", "Concluídas"],
    ["recusada", "Recusadas"],
  ];

  return (
    <div className="dashboard-page">
      <PageHeader title="Solicitações" eyebrow="Solicitações de adoção" />
      <div className="filter-bar">
        <label className="search-box">
          <Search />
          <input
            aria-label="Buscar por nome ou protocolo"
            placeholder="Buscar por nome ou protocolo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </div>
      <div className="filter-chips request-filters">
        {opcoes.map(([valor, label]) => {
          const tone =
            valor === "nova"
              ? "green"
              : valor === "em_analise"
                ? "amber"
                : valor === "recusada"
                  ? "red"
                  : "gray";
          return (
            <button
              key={valor}
              className={filter === valor ? "active" : ""}
              onClick={() => setFilter(valor)}
            >
              <span className={`filter-dot status-${tone}`} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      {carregando ? (
        <ListSkeleton count={4} />
      ) : solicitacoes.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação por aqui"
          text="As solicitações chegam pelo formulário público: a pessoa vê um pet no site ou no QR Code e envia os dados para adoção. Quando isso acontecer, a solicitação aparece nesta lista."
          action="Ver meus pets"
          to="/painel/animais"
        />
      ) : filtradas.length ? (
        <div className="requests-table">
          {filtradas.map((solicitacao) => (
            <Link key={solicitacao.id} to={`/painel/solicitacoes/${solicitacao.id}`}>
              <div>
                <b>{solicitacao.protocolo}</b>
                <small>{formatarDataHora(solicitacao.criado_em)}</small>
              </div>
              <div>
                <b>{solicitacao.nome}</b>
                <small>{nomesDosPets(solicitacao)}</small>
              </div>
              <div className="avatar-row">
                {solicitacao.pets.map((petDaSolicitacao) => (
                  <img
                    key={petDaSolicitacao.id}
                    src={petDaSolicitacao.foto ?? photos.caramelo}
                    alt={`Foto de ${petDaSolicitacao.nome}`}
                  />
                ))}
              </div>
              <StatusBadge status={ROTULO_SOLICITACAO[solicitacao.status]} />
              <ArrowRight />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma solicitação com este filtro"
          text="Tente outro status ou apague a busca para ver todas as solicitações."
          action="Ver todas"
          to="/painel/solicitacoes"
        />
      )}
    </div>
  );
}

export function RequestDetailPage() {
  const { id } = useParams();
  const { ong: minhaOng } = useOng();
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [processando, setProcessando] = useState<StatusSolicitacao | null>(null);
  const [emailCopiado, setEmailCopiado] = useState(false);
  const [confirmarRecusa, setConfirmarRecusa] = useState(false);

  useEffect(() => {
    if (!id) {
      setErro("Não encontramos o identificador da solicitação.");
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    void carregarSolicitacao(id).then((encontrada) => {
      if (!ativo) return;
      setSolicitacao(encontrada);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!emailCopiado) return;
    const timer = window.setTimeout(() => setEmailCopiado(false), 3000);
    return () => window.clearTimeout(timer);
  }, [emailCopiado]);

  const mudarStatus = async (novoStatus: StatusSolicitacao) => {
    if (!solicitacao) return;
    setAviso(null);
    setProcessando(novoStatus);
    const mensagem = await mudarStatusSolicitacao(solicitacao.id, novoStatus);
    if (mensagem) {
      setAviso({ tipo: "erro", texto: mensagem });
      setProcessando(null);
      return;
    }
    setSolicitacao({ ...solicitacao, status: novoStatus });
    if (novoStatus === "concluida") {
      const falhas: string[] = [];
      for (const petDaSolicitacao of solicitacao.pets) {
        const erroPet = await atualizarStatusPet(petDaSolicitacao.id, "adotado");
        if (erroPet) falhas.push(petDaSolicitacao.nome);
      }
      if (falhas.length) {
        setAviso({
          tipo: "erro",
          texto: `A adoção foi registrada, mas não conseguimos marcar ${falhas.join(", ")} como adotado. Ajuste o status na lista de pets.`,
        });
      } else {
        setAviso({
          tipo: "sucesso",
          texto: solicitacao.pets.length
            ? "Adoção concluída. Os pets foram marcados como adotados."
            : "Solicitação concluída.",
        });
      }
    } else {
      setAviso({
        tipo: "sucesso",
        texto: `Solicitação atualizada para ${ROTULO_SOLICITACAO[novoStatus]}.`,
      });
    }
    setProcessando(null);
  };

  if (carregando) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Solicitação" eyebrow="Carregando" />
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="dashboard-page">
        <PageHeader title="Solicitação não encontrada" eyebrow="Solicitações de adoção" />
        <SectionCard title="Não conseguimos abrir esta solicitação">
          <p>{erro || "O link pode estar errado ou a solicitação foi removida."}</p>
          <Link className="button button-secondary" to="/painel/solicitacoes">
            Ver solicitações
          </Link>
        </SectionCard>
      </div>
    );
  }

  const primeiroNome = solicitacao.nome.split(" ")[0];
  const whatsappUrl = buildWhatsAppUrl(solicitacao.telefone ?? "", {
    "primeiro nome": primeiroNome,
    "nome da ONG": minhaOng?.nome ?? "nossa ONG",
    "nome do pet": nomesDosPets(solicitacao),
    protocolo: solicitacao.protocolo,
  });
  const localizacao = [solicitacao.cidade, solicitacao.uf].filter(Boolean).join(", ");
  const textoMoradia = solicitacao.moradia
    ? (TEXTO_MORADIA[solicitacao.moradia] ?? solicitacao.moradia)
    : "não informado";
  const textoTelas = solicitacao.tem_telas
    ? (TEXTO_TELAS[solicitacao.tem_telas] ?? solicitacao.tem_telas)
    : "";
  const textoSozinho = solicitacao.pet_sozinho
    ? (TEXTO_SOZINHO[solicitacao.pet_sozinho] ?? solicitacao.pet_sozinho)
    : "";

  return (
    <div className="dashboard-page">
      <PageHeader
        title={solicitacao.protocolo}
        eyebrow={`Recebida em ${formatarDataHora(solicitacao.criado_em)}`}
        action={<StatusBadge status={ROTULO_SOLICITACAO[solicitacao.status]} />}
      />
      <div className="detail-columns">
        <div className="form-stack">
          <SectionCard title="Solicitante">
            <div className="person-header">
              <span className="avatar big" aria-hidden="true">
                {iniciais(solicitacao.nome)}
              </span>
              <div>
                <h3>{solicitacao.nome}</h3>
                <p>
                  {solicitacao.email} · {solicitacao.telefone ?? "telefone não informado"}
                </p>
              </div>
            </div>
            <div className="button-row">
              <Button
                variant="secondary"
                icon={<Copy />}
                onClick={() => {
                  void navigator.clipboard?.writeText(solicitacao.email);
                  setEmailCopiado(true);
                }}
              >
                Copiar e-mail
              </Button>
              {whatsappUrl ? (
                <a
                  className="button button-secondary"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle /> Abrir WhatsApp
                </a>
              ) : (
                <Button
                  variant="secondary"
                  icon={<MessageCircle />}
                  disabled
                  title="O telefone do solicitante está ausente ou inválido."
                >
                  WhatsApp não informado
                </Button>
              )}
            </div>
            <p className="system-note">
              <Info size={16} />A continuidade do processo é da ONG. Fale com a pessoa por e-mail ou
              WhatsApp para combinar visita, conversa e entrega do animal.
            </p>
          </SectionCard>
          <SectionCard title="Respostas do formulário">
            <dl className="answers">
              <div>
                <dt>Protocolo e data</dt>
                <dd>
                  {solicitacao.protocolo} · {formatarDataHora(solicitacao.criado_em)}
                </dd>
              </div>
              <div>
                <dt>Localização e idade</dt>
                <dd>
                  {localizacao || "cidade não informada"} ·{" "}
                  {solicitacao.idade ? `${solicitacao.idade} anos` : "idade não informada"}
                </dd>
              </div>
              <div>
                <dt>Pessoas na casa</dt>
                <dd>
                  {solicitacao.pessoas_na_casa
                    ? `${solicitacao.pessoas_na_casa} ${
                        solicitacao.pessoas_na_casa === 1 ? "pessoa" : "pessoas"
                      }`
                    : "não informado"}
                </dd>
              </div>
              <div>
                <dt>Moradia</dt>
                <dd>{textoMoradia}</dd>
              </div>
              <div>
                <dt>Tempo sozinho</dt>
                <dd>
                  {textoSozinho
                    ? `O pet ficaria sozinho ${textoSozinho}`
                    : "não informado"}
                </dd>
              </div>
              {textoTelas && (
                <div>
                  <dt>Telas de proteção</dt>
                  <dd>{textoTelas}</dd>
                </div>
              )}
            </dl>
          </SectionCard>
          <SectionCard title="Mensagem">
            <p>{solicitacao.mensagem || "A pessoa não escreveu uma mensagem."}</p>
          </SectionCard>
        </div>
        <aside className="form-stack">
          <SectionCard title="Pets solicitados">
            {solicitacao.pets.length ? (
              solicitacao.pets.map((petDaSolicitacao) => (
                <Link
                  className="pet-mini"
                  key={petDaSolicitacao.id}
                  to={`/p/${petDaSolicitacao.slug}`}
                >
                  <img
                    src={petDaSolicitacao.foto ?? photos.caramelo}
                    alt={`Foto de ${petDaSolicitacao.nome}`}
                  />
                  <span>
                    <b>{petDaSolicitacao.nome}</b>
                    <small>Ver ficha pública</small>
                  </span>
                  <ExternalLink size={17} />
                </Link>
              ))
            ) : (
              <p>Nenhum pet vinculado a esta solicitação.</p>
            )}
          </SectionCard>
          <SectionCard title="Ações">
            <div className="action-stack">
              <Button
                onClick={() => void mudarStatus("em_analise")}
                disabled={solicitacao.status === "em_analise" || processando !== null}
                loading={processando === "em_analise"}
              >
                Marcar em análise
              </Button>
              <Button
                variant="secondary"
                icon={<Heart />}
                onClick={() => void mudarStatus("concluida")}
                disabled={solicitacao.status === "concluida" || processando !== null}
                loading={processando === "concluida"}
              >
                Concluir adoção
              </Button>
              <Button
                variant="ghost"
                className="rejection-action"
                onClick={() => setConfirmarRecusa(true)}
                disabled={solicitacao.status === "recusada" || processando !== null}
              >
                Recusar
              </Button>
            </div>
            {aviso && (
              <p className={aviso.tipo === "erro" ? "form-alert" : "system-note"} aria-live="polite">
                <Info size={16} />
                {aviso.texto}
              </p>
            )}
            <a
              className="button button-secondary request-doc-link"
              href={linkDaSolicitacao(solicitacao.token_publico)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink /> Ver documento da solicitação
            </a>
            <p className="field-hint">
              Ao concluir, os pets desta solicitação passam para adotado. O contato com a pessoa
              continua sendo por e-mail e WhatsApp.
            </p>
          </SectionCard>
        </aside>
      </div>
      {confirmarRecusa && (
        <div
          className="sheet-backdrop"
          onMouseDown={(evento) =>
            evento.target === evento.currentTarget && setConfirmarRecusa(false)
          }
        >
          <div
            className="sheet compact-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recusa-titulo"
          >
            <span className="sheet-handle" />
            <h2 id="recusa-titulo">Recusar esta solicitação?</h2>
            <p>
              A solicitação fica marcada como recusada. Avise a pessoa por e-mail ou WhatsApp para
              explicar o motivo com calma.
            </p>
            <div className="sheet-actions">
              <Button variant="secondary" onClick={() => setConfirmarRecusa(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmarRecusa(false);
                  void mudarStatus("recusada");
                }}
              >
                Recusar solicitação
              </Button>
            </div>
          </div>
        </div>
      )}
      {emailCopiado && (
        <div className="toast" role="status">
          <span>E-mail copiado</span>
        </div>
      )}
    </div>
  );
}

export function ConfigPage() {
  const [confirm, setConfirm] = useState("");
  const { ong: minhaOng } = useOng();
  return (
    <div className="dashboard-page form-page">
      <PageHeader title="Configurações" eyebrow="Conta e privacidade" />
      <SectionCard title="Acesso">
        <div className="setting-row">
          <div>
            <b>E-mail da conta</b>
            <p>{minhaOng?.email ?? "e-mail não informado"}</p>
          </div>
          <Button variant="secondary">Trocar e-mail</Button>
        </div>
        <div className="setting-row">
          <div>
            <b>Sair deste dispositivo</b>
            <p>Você precisará de um novo código para entrar.</p>
          </div>
          <Button variant="ghost">Sair</Button>
        </div>
      </SectionCard>
      <SectionCard title="Privacidade">
        <div className="link-list">
          <a href="#">
            Política de privacidade <ExternalLink />
          </a>
          <a href="#">
            Termos de uso <ExternalLink />
          </a>
        </div>
      </SectionCard>
      <SectionCard title="Excluir conta" className="danger-zone">
        <p>Essa ação exclui a ONG, as fichas e solicitações. Não pode ser desfeita.</p>
        <TextField
          label='Digite "EXCLUIR" para confirmar'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button variant="danger" disabled={confirm !== "EXCLUIR"}>
          <Trash2 />
          Excluir conta
        </Button>
      </SectionCard>
      <p className="version">AdotaPet · versão 1.0.0</p>
    </div>
  );
}
