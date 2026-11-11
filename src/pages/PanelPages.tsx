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
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PawPrint,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getPublicBaseUrl,
  ong,
  petObjectPosition,
  pets,
  photos,
  requests,
  states,
  type PetFocalPoint,
  type PetStatus,
} from "../mocks";
import { PageHeader, useAbout } from "../components/Shells";
import {
  Badge,
  Button,
  CheckField,
  EmptyState,
  ErrorState,
  FileUpload,
  ListSkeleton,
  RadioCards,
  SectionCard,
  Select,
  StatusBadge,
  Switch,
  TagCard,
  TextArea,
  TextField,
} from "../components/ui";
import { PetMiniLink, QrActions, QrCard } from "../components/PetParts";
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

function HighlightsCarousel() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const { open } = useAbout();
  const highlightImages = pets
    .slice(0, 3)
    .map((pet) => pet.image.replace("auto=format", "fm=webp").replace(/w=\d+/, "w=800"));
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
          <img className="highlight-image" src={highlightImages[1]} alt="" loading="lazy" />
          <div className="highlight-copy">
            <span className="highlight-icon">
              <FileText />
            </span>
            <div>
              <h2>Cada pet tem uma página própria</h2>
              <p>Foto, saúde, temperamento e história em um único link.</p>
            </div>
            <Link to="/pet/caramelo">
              Ver exemplo <ArrowRight />
            </Link>
          </div>
        </article>
        <article
          className="highlight-card highlight-dark"
          tabIndex={-1}
          aria-label="Destaque 2 de 2: Adoção com processo"
        >
          <img className="highlight-image" src={highlightImages[2]} alt="" loading="lazy" />
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
  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Quarta-feira, 18 de março"
        title={`Olá, ${ong.name}`}
        action={
          <Link className="button button-primary desktop-action" to="/painel/animais/novo">
            <Plus />
            Cadastrar pet
          </Link>
        }
      />
      <HighlightsCarousel />
      <Link className="home-qr-block" to="/painel/qr">
        <div className="home-qr-copy">
          <span>
            <QrCode />
          </span>
          <div>
            <h2>Sua ONG em um QR Code</h2>
            <p>Abra sua página com todos os pets disponíveis.</p>
          </div>
          <b>
            Ver meu QR <ArrowRight />
          </b>
        </div>
        <img src={pets[0].image} alt="" style={{ objectPosition: "50% 35%" }} loading="lazy" />
      </Link>
      <div className="metric-grid">
        <div>
          <strong>12</strong>
          <p>pets disponíveis</p>
        </div>
        <div>
          <strong>3</strong>
          <p>solicitações novas</p>
        </div>
        <div>
          <strong>7</strong>
          <p>adoções no mês</p>
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
        <div className="request-list">
          {requests.slice(0, 2).map((r) => (
            <Link key={r.id} to={`/painel/solicitacoes/${r.id}`}>
              <span className="avatar">
                {r.person
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </span>
              <div>
                <b>{r.person}</b>
                <small>
                  {r.pets.join(" + ")} · {r.time}
                </small>
              </div>
              <StatusBadge status={r.status} />
              <ArrowRight />
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function PetsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const forcedState = new URLSearchParams(window.location.search).get("estado");
  const [isLoading, setIsLoading] = useState(true);
  const [petStatuses, setPetStatuses] = useState<Record<string, PetStatus>>(
    Object.fromEntries(pets.map((pet) => [pet.id, pet.status])),
  );
  const [menuPet, setMenuPet] = useState<string | null>(null);
  const [confirmPet, setConfirmPet] = useState<(typeof pets)[number] | null>(null);
  const [toast, setToast] = useState<{ name: string; id: string; previous: PetStatus } | null>(
    null,
  );
  useEffect(() => {
    const ready = window.setTimeout(() => setIsLoading(false), 250);
    return () => window.clearTimeout(ready);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const currentPets = pets.map((pet) => ({ ...pet, status: petStatuses[pet.id] }));
  const shown = currentPets.filter(
    (p) =>
      (filter === "todos" || p.status === filter) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const updateStatus = (id: string, status: PetStatus) =>
    setPetStatuses((current) => ({ ...current, [id]: status }));
  const confirmAdoption = () => {
    if (!confirmPet) return;
    const previous = petStatuses[confirmPet.id];
    updateStatus(confirmPet.id, "adotado");
    setToast({ name: confirmPet.name, id: confirmPet.id, previous });
    setConfirmPet(null);
  };
  return (
    <div className="dashboard-page pets-page">
      <PageHeader
        title="Seus pets"
        eyebrow={`${pets.length} animais cadastrados`}
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
      ) : pets.length === 0 ? (
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
  const [name, setName] = useState(edit ? "Caramelo" : "");
  const [focal, setFocal] = useState<PetFocalPoint>("face");
  const [photoAdjustOpen, setPhotoAdjustOpen] = useState(false);
  const [photoAdjustment, setPhotoAdjustment] = useState<PhotoAdjustment>({
    src: pets[0].image,
    focalX: 50,
    focalY: 30,
    zoom: 1,
  });
  const [story, setStory] = useState(
    edit
      ? "Caramelo foi resgatado perto de uma escola e mostrou ser um companheiro muito carinhoso."
      : "",
  );
  return (
    <div className="dashboard-page form-page">
      <PageHeader
        title={edit ? "Editar Caramelo" : "Cadastrar novo pet"}
        eyebrow={edit ? "Ficha pública" : "Novo animal"}
      />
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/painel/animais/${id || pets[0].id}/qr`);
        }}
      >
        <SectionCard title="Informações básicas">
          <div className="form-grid">
            <TextField
              label="Nome *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Caramelo"
              required
            />
            <Select label="Espécie *" defaultValue="Cão" required>
              <option>Cão</option>
              <option>Gato</option>
            </Select>
            <Select label="Sexo *" required>
              <option>Macho</option>
              <option>Fêmea</option>
            </Select>
            <Select label="Porte *" required>
              <option>Pequeno</option>
              <option selected>Médio</option>
              <option>Grande</option>
            </Select>
            <TextField label="Raça (opcional)" placeholder="Sem raça definida" />
            <div className="age-fields">
              <TextField label="Anos *" type="number" defaultValue="2" required />
              <TextField label="Meses *" type="number" defaultValue="0" required />
            </div>
          </div>
          {name && (
            <div className="url-preview">
              <Link2 />
              <span>
                <small>URL pública estável</small>
                <b>
                  {getPublicBaseUrl()}
                  {petPublicPath(name)}
                </b>
                <em>O link não muda depois de publicado.</em>
              </span>
              <button
                type="button"
                aria-label="Copiar URL"
                onClick={() =>
                  navigator.clipboard?.writeText(`${getPublicBaseUrl()}${petPublicPath(name)}`)
                }
              >
                <Copy />
              </button>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Saúde">
          <div className="switch-grid">
            <Switch label="Castrado" checked />
            <Switch label="Vacinado" checked />
            <Switch label="Vermifugado" checked />
          </div>
          <TextField label="Condições especiais" placeholder="Ex.: alergia, medicação contínua" />
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
            ].map((t, i) => (
              <button type="button" className={i < 3 ? "selected" : ""} key={t}>
                {i < 3 && <Check />}
                {t}
              </button>
            ))}
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
            <TextField label="Cidade *" defaultValue="São Paulo" required />
            <Select label="Status *" required>
              <option>disponível</option>
              <option>em processo</option>
              <option>adotado</option>
              <option>indisponível</option>
              <option>rascunho</option>
            </Select>
          </div>
        </SectionCard>
        <SectionCard title="Fotos *">
          <FileUpload multiple />
          <p className="field-hint">Arraste para reordenar. A primeira foto será a capa.</p>
          <Button variant="secondary" type="button" onClick={() => setPhotoAdjustOpen(true)}>
            Ajustar enquadramento
          </Button>
          <Select
            label="Ponto focal da capa"
            value={focal}
            onChange={(event) => {
              const next = event.target.value as PetFocalPoint;
              setFocal(next);
              setPhotoAdjustment((current) => ({
                ...current,
                focalX: 50,
                focalY: next === "top" ? 20 : next === "center" ? 50 : 30,
              }));
            }}
          >
            <option value="face">Rosto</option>
            <option value="top">Topo</option>
            <option value="center">Centro</option>
          </Select>
          {edit && (
            <div className="photo-preview">
              <img
                src={photoAdjustment.src}
                alt="Capa atual"
                style={{
                  objectPosition: `${photoAdjustment.focalX}% ${photoAdjustment.focalY}%`,
                  transform: `scale(${photoAdjustment.zoom})`,
                }}
              />
              <Badge tone="amber">Capa</Badge>
            </div>
          )}
        </SectionCard>
        <div className="sticky-form-actions">
          <Button variant="ghost" type="button" onClick={() => navigate("/painel/animais")}>
            Cancelar
          </Button>
          <Button type="submit">Salvar pet</Button>
        </div>
      </form>
      <PhotoAdjuster
        open={photoAdjustOpen}
        initial={photoAdjustment.src}
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
  const [published, setPublished] = useState(pets[0].status !== "rascunho");
  const publicUrl = ongQr
    ? `${getPublicBaseUrl()}/ong/${ong.slug}`
    : `${getPublicBaseUrl()}/p/${pets[0].slug}`;
  if (!ongQr && !published) {
    return (
      <div className="dashboard-page">
        <PageHeader title="QR Code do Caramelo" eyebrow="Perfil em rascunho" />
        <SectionCard title="Publique o perfil para gerar o QR code">
          <p>O QR fica disponível assim que a ficha pública do pet for publicada.</p>
          <Button onClick={() => setPublished(true)}>Publicar perfil</Button>
        </SectionCard>
      </div>
    );
  }
  return (
    <div className="dashboard-page">
      <PageHeader
        title={ongQr ? "QR Code da ONG" : "QR Code do Caramelo"}
        eyebrow="Pronto para imprimir"
      />
      <div className="qr-layout">
        <div>
          <QrCard petName={ongQr ? undefined : "Caramelo"} url={publicUrl} />
          {ongQr ? (
            <QrActions context="ong" ong={{ name: ong.name, slug: ong.slug }} url={publicUrl} />
          ) : (
            <QrActions context="pet" pet={pets[0]} url={publicUrl} />
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
    </div>
  );
}

export function OngSettingsPage() {
  const [desc, setDesc] = useState(ong.description);
  const [coverOpen, setCoverOpen] = useState(false);
  const [cover, setCover] = useState<PhotoAdjustment>({
    src: photos.nina,
    focalX: 50,
    focalY: 30,
    zoom: 1,
  });
  return (
    <div className="dashboard-page form-page">
      <PageHeader title="Dados da ONG" eyebrow="Perfil público" />
      <form className="form-stack">
        <SectionCard title="Identidade">
          <div className="ong-cover-field">
            <span className="field-label">Capa do perfil público</span>
            <div className="cover-preview">
              <img
                src={cover.src}
                alt=""
                style={{
                  objectPosition: `${cover.focalX}% ${cover.focalY}%`,
                  transform: `scale(${cover.zoom})`,
                }}
              />
              <button
                type="button"
                className="cover-edit-button"
                onClick={() => setCoverOpen(true)}
              >
                <Camera /> Alterar capa
              </button>
            </div>
            <small>Aparece no topo da sua página pública. Formato 3 por 1.</small>
          </div>
          <FileUpload circular />
          <div className="form-grid">
            <TextField label="Nome da instituição" defaultValue={ong.name} />
            <TextField label="CNPJ (opcional)" placeholder="00.000.000/0000-00" />
            <TextArea
              label="Descrição"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="span-2"
            />
          </div>
        </SectionCard>
        <SectionCard title="Contato e localização">
          <div className="form-grid">
            <TextField label="WhatsApp" defaultValue={ong.whatsapp} />
            <TextField label="Site ou Instagram" defaultValue="@amigosdepatas" />
            <TextField label="Cidade" defaultValue="São Paulo" />
            <Select label="UF" defaultValue="SP">
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <TextField label="Endereço (opcional)" className="span-2" />
          </div>
        </SectionCard>
        <div className="sticky-form-actions">
          <Button>Salvar alterações</Button>
        </div>
      </form>
      <PhotoAdjuster
        open={coverOpen}
        title="Ajustar capa"
        aspect="3 / 1"
        initial={cover.src}
        onClose={() => setCoverOpen(false)}
        onUse={(adjustment) => {
          setCover(adjustment);
          setCoverOpen(false);
        }}
      />
    </div>
  );
}

export function RequestsPage() {
  const [filter, setFilter] = useState("todas");
  const forcedState = new URLSearchParams(window.location.search).get("estado");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const ready = window.setTimeout(() => setIsLoading(false), 250);
    return () => window.clearTimeout(ready);
  }, []);
  const filtered = requests.filter((r) => filter === "todas" || r.status === filter);
  return (
    <div className="dashboard-page">
      <PageHeader title="Solicitações" eyebrow="Solicitações de adoção" />
      <div className="filter-chips request-filters">
        {[
          ["todas", "Todas"],
          ["nova", "Novas"],
          ["em análise", "Em análise"],
          ["concluída", "Concluídas"],
          ["recusada", "Recusadas"],
        ].map(([x, label]) => {
          const tone =
            x === "nova"
              ? "green"
              : x === "em análise"
                ? "amber"
                : x === "recusada"
                  ? "red"
                  : "gray";
          return (
            <button key={x} className={filter === x ? "active" : ""} onClick={() => setFilter(x)}>
              <span className={`filter-dot status-${tone}`} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      {forcedState === "erro" ? (
        <ErrorState
          title="Não foi possível carregar as solicitações"
          text="Confira sua conexão e tente novamente."
        />
      ) : forcedState === "vazio" ? (
        <EmptyState
          title="Nenhuma solicitação por aqui"
          text="As solicitações enviadas a partir dos QR Codes aparecerão aqui."
          action="Ver QR Code da ONG"
          to="/painel/qr"
        />
      ) : isLoading ? (
        <ListSkeleton count={4} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação por aqui"
          text="As solicitações de adoção enviadas a partir dos QR Codes aparecerão aqui."
          action="Ver QR Code da ONG"
          to="/painel/qr"
        />
      ) : filtered.length ? (
        <div className="requests-table">
          {filtered.map((r) => (
            <Link key={r.id} to={`/painel/solicitacoes/${r.id}`}>
              <div>
                <b>{r.id}</b>
                <small>{r.time}</small>
              </div>
              <div>
                <b>{r.person}</b>
                <small>{r.pets.join(" + ")}</small>
              </div>
              <div className="avatar-row">
                {r.pets.map((name) => {
                  const requestedPet = pets.find((pet) => pet.name === name) || pets[0];
                  return (
                    <img
                      key={name}
                      src={requestedPet.image}
                      alt=""
                      style={{ objectPosition: petObjectPosition(requestedPet) }}
                    />
                  );
                })}
              </div>
              <StatusBadge status={r.status} />
              <ArrowRight />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma solicitação por aqui"
          text="Quando uma solicitação tiver este status, ela aparecerá nesta lista."
          action="Ver todas"
          to="/painel/solicitacoes"
        />
      )}
    </div>
  );
}

export function RequestDetailPage() {
  const { id } = useParams();
  const r = requests.find((x) => x.id === id) || requests[0];
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(r.status);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectionRecord, setRejectionRecord] = useState<{
    reason: string;
    pending: boolean;
  } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  useEffect(() => {
    if (!emailCopied) return;
    const timer = window.setTimeout(() => setEmailCopied(false), 3000);
    return () => window.clearTimeout(timer);
  }, [emailCopied]);
  const whatsappUrl = buildWhatsAppUrl("(11) 97777-1234", {
    "primeiro nome": r.person.split(" ")[0],
    "nome da ONG": ong.name,
    "nome do pet": r.pets[0],
    protocolo: r.id,
  });
  const rejectionReasons = [
    "Não atende aos requisitos",
    "Moradia sem telas de proteção",
    "Endereço fora da área de adoção",
    "Sem resposta após 7 dias",
    "Outro",
  ];
  const confirmRejection = () => {
    if (!rejectReason) return;
    const pending = !navigator.onLine;
    setStatus(pending ? "recusada, e-mail pendente" : "recusada");
    setRejectionRecord({ reason: rejectReason, pending });
    setRejectOpen(false);
  };
  return (
    <div className="dashboard-page">
      <PageHeader
        title={r.id}
        eyebrow={`Recebida em ${r.date}`}
        action={<StatusBadge status={status} />}
      />
      <div className="detail-columns">
        <div className="form-stack">
          <SectionCard title="Solicitante">
            <div className="person-header">
              <span className="avatar big">AS</span>
              <div>
                <h3>{r.person}</h3>
                <p>ana@email.com · (11) 97777-1234</p>
              </div>
            </div>
            <div className="button-row">
              <Button
                variant="secondary"
                icon={<Copy />}
                onClick={() => {
                  navigator.clipboard.writeText("ana@email.com");
                  setEmailCopied(true);
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
          </SectionCard>
          <SectionCard title="Respostas">
            <dl className="answers">
              <div>
                <dt>Localização e idade</dt>
                <dd>São Paulo, SP · 29 anos</dd>
              </div>
              <div>
                <dt>Moradia</dt>
                <dd>Casa própria, com quintal e telas de proteção</dd>
              </div>
              <div>
                <dt>Rotina</dt>
                <dd>O pet ficaria sozinho por até 4 horas</dd>
              </div>
              <div>
                <dt>Família</dt>
                <dd>2 pessoas, todos concordam com a adoção</dd>
              </div>
              <div>
                <dt>Experiência</dt>
                <dd>Já teve pets e pode arcar com os cuidados</dd>
              </div>
            </dl>
          </SectionCard>
          <SectionCard title="Mensagem">
            <p>
              Conheci o Caramelo na feira e me encantei. Temos espaço, tempo e muito carinho para
              oferecer.
            </p>
          </SectionCard>
        </div>
        <aside className="form-stack">
          <SectionCard title="Pets solicitados">
            {r.pets.slice(0, 3).map((n) => {
              const p = pets.find((x) => x.name === n) || pets[0];
              return <PetMiniLink key={n} pet={p} />;
            })}
            {r.pets.length > 3 && (
              <button className="text-button pet-show-all">
                Ver todos os {r.pets.length} pets
              </button>
            )}
          </SectionCard>
          <SectionCard title="Nota interna">
            <TextArea
              label="Visível apenas para a equipe"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registre contatos e observações..."
            />
            <Button variant="secondary">Salvar nota</Button>
          </SectionCard>
          <SectionCard title="Ações">
            <div className="action-stack">
              <Button onClick={() => setStatus("em análise")}>Marcar em análise</Button>
              <Button variant="secondary" onClick={() => setStatus("concluída")}>
                <Heart />
                Registrar adoção
              </Button>
              <Button
                variant="ghost"
                className="rejection-action"
                onClick={() => setRejectOpen(true)}
              >
                Recusar solicitação
              </Button>
              {rejectionRecord && (
                <div className="rejection-record">
                  <b>Recusada em 11/11/2026</b>
                  <span>Motivo: {rejectionRecord.reason}</span>
                  <span>
                    {rejectionRecord.pending
                      ? "E-mail pendente"
                      : "E-mail enviado em 11/11/2026 às 14:32"}
                  </span>
                  {rejectionRecord.pending && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStatus("recusada");
                        setRejectionRecord({ ...rejectionRecord, pending: false });
                      }}
                    >
                      Reenviar e-mail
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
      {rejectOpen && (
        <div
          className="sheet-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setRejectOpen(false)}
        >
          <div
            className="sheet rejection-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
          >
            <span className="sheet-handle" />
            <h2 id="reject-title">Recusar solicitação</h2>
            <p>Escolha um motivo. A pessoa receberá um e-mail automático da ONG.</p>
            <fieldset className="reason-field">
              <legend>Motivo da recusa *</legend>
              <div className="reason-chips">
                {rejectionReasons.map((reason) => (
                  <button
                    type="button"
                    key={reason}
                    className={rejectReason === reason ? "selected" : ""}
                    onClick={() => setRejectReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </fieldset>
            <TextArea
              label="Mensagem para a pessoa (opcional)"
              maxLength={200}
              value={rejectMessage}
              onChange={(event) => setRejectMessage(event.target.value)}
            />
            <section className="email-preview">
              <span>Prévia do e-mail</span>
              <b>Sobre sua solicitação de adoção de Caramelo (protocolo AD-2026-0142)</b>
              <p>
                Olá, Ana.
                <br />
                <br />
                Recebemos sua solicitação de adoção de Caramelo, protocolo AD-2026-0142, e a ONG
                Amigos de Patas avaliou com atenção.
                <br />
                <br />
                Neste momento, a adoção não foi aprovada. Motivo: a casa ou apartamento não tem
                telas de proteção nas janelas.
                <br />
                <br />
                Isso não fecha a porta. Muitos pets esperam por uma família como a sua, e você pode
                conhecer outros animais desta ONG no link abaixo.
                <br />
                <br />
                Se quiser entender melhor a decisão, responda este e-mail e a ONG fala com você.
                <br />
                <br />
                Amigos de Patas
              </p>
            </section>
            <div className="sheet-actions">
              <Button variant="ghost" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" disabled={!rejectReason} onClick={confirmRejection}>
                Recusar e avisar por e-mail
              </Button>
            </div>
          </div>
        </div>
      )}
      {emailCopied && (
        <div className="toast" role="status">
          <span>E-mail copiado</span>
        </div>
      )}
    </div>
  );
}

export function ConfigPage() {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="dashboard-page form-page">
      <PageHeader title="Configurações" eyebrow="Conta e privacidade" />
      <SectionCard title="Acesso">
        <div className="setting-row">
          <div>
            <b>E-mail da conta</b>
            <p>{ong.email}</p>
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
