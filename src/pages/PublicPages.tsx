import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Camera,
  Clock3,
  Copy,
  ChevronLeft,
  ChevronRight,
  Heart,
  HeartHandshake,
  Info,
  Link2,
  MapPin,
  MessageCircle,
  PawPrint,
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { ong, petObjectPosition, pets, petsBySlug, photos, states } from "../mocks";
import { AboutTag, PublicTopbar } from "../components/Shells";
import {
  BackLink,
  Badge,
  Button,
  CheckField,
  FileUpload,
  RadioCards,
  SectionCard,
  Select,
  Stepper,
  TagCard,
  TextArea,
  TextField,
} from "../components/ui";
import { PetCard } from "../components/PetParts";
import { PhotoAdjuster, type PhotoAdjustment } from "../components/PhotoAdjuster";

export function LandingRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate("/entrar", { replace: true });
  }, [navigate]);
  return null;
}

const authSlides = [
  {
    title: "Todo pet merece uma plaquinha e um lar.",
    pill: "12 pets esperando um lar",
    image: photos.caramelo,
    position: "50% 25%",
  },
  {
    title: "Cadastre o pet em dois minutos.",
    pill: "Foto, ficha e história em um só lugar",
    image:
      "https://images.unsplash.com/photo-1753685728459-d443fca74862?auto=format&fit=crop&w=1400&q=85",
    position: "50% 40%",
  },
  {
    title: "Um QR code conta a história dele.",
    pill: "Quem encontra o animal escaneia e vê o perfil",
    image:
      "https://images.unsplash.com/photo-1667716705760-233650f8f3fe?auto=format&fit=crop&w=1400&q=85",
    position: "50% 36%",
  },
  {
    title: "A adoção chega direto na sua ONG.",
    pill: "A pessoa preenche, você recebe e dá continuidade",
    image:
      "https://images.unsplash.com/photo-1724120504738-df4853569270?auto=format&fit=crop&w=1400&q=85",
    position: "50% 40%",
  },
];

function AuthCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const touchStart = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const scheduleResume = () => {
    if (reducedMotion.current) return;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), 8000);
  };
  const pauseWhileInteracting = () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    setPaused(true);
  };
  const interact = () => {
    setPaused(true);
    scheduleResume();
  };
  const move = (direction: number) => {
    setActive((current) => (current + direction + authSlides.length) % authSlides.length);
    interact();
  };
  useEffect(() => {
    if (paused || manualPaused || reducedMotion.current) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % authSlides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused, manualPaused]);
  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    [],
  );
  return (
    <section
      className="auth-hero auth-carousel"
      tabIndex={0}
      aria-label="Apresentação do AdotaPet"
      aria-roledescription="carrossel"
      onMouseEnter={pauseWhileInteracting}
      onMouseLeave={scheduleResume}
      onFocusCapture={pauseWhileInteracting}
      onBlurCapture={scheduleResume}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
        interact();
      }}
      onTouchEnd={(event) => {
        const distance = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(distance) >= 48) move(distance < 0 ? 1 : -1);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
    >
      {authSlides.map((slide, index) => (
        <article
          key={slide.title}
          className={`auth-slide ${active === index ? "active" : ""}`}
          aria-label={`Slide ${index + 1} de 4`}
          aria-hidden={active !== index}
        >
          <img src={slide.image} alt="" style={{ objectPosition: slide.position }} />
          <div className="auth-slide-scrim" />
          <div className="auth-hero-copy">
            <h1>{slide.title}</h1>
            <Badge tone="amber">
              <PawPrint size={14} /> {slide.pill}
            </Badge>
          </div>
        </article>
      ))}
      <div className="hero-grain" aria-hidden="true" />
      <PublicTopbar overlay />
      <button
        className="auth-carousel-arrow prev"
        aria-label="Slide anterior"
        onClick={() => move(-1)}
      >
        <ChevronLeft />
      </button>
      <button
        className="auth-carousel-arrow next"
        aria-label="Próximo slide"
        onClick={() => move(1)}
      >
        <ChevronRight />
      </button>
      <div className="auth-carousel-controls">
        <div className="auth-carousel-dots">
          {authSlides.map((slide, index) => (
            <button
              key={slide.title}
              className={active === index ? "active" : ""}
              aria-label={`Ir para o slide ${index + 1}`}
              onClick={() => {
                setActive(index);
                interact();
              }}
            />
          ))}
        </div>
        <button
          className="auth-pause"
          aria-label={manualPaused ? "Retomar carrossel" : "Pausar carrossel"}
          onClick={() => setManualPaused((value) => !value)}
        >
          {manualPaused ? <Play /> : <Pause />}
        </button>
      </div>
    </section>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setError("Digite um e-mail válido.");
    setLoading(true);
    window.setTimeout(() => navigate("/entrar/codigo", { state: { email } }), 700);
  };
  return (
    <main className="auth-page">
      <AuthCarousel />
      <section className="auth-sheet perforated">
        <div className="auth-content">
          <h2>Boas-vindas</h2>
          <p>Entre com o e-mail da ONG para receber um código de acesso.</p>
          <form onSubmit={submit}>
            <TextField
              label="E-mail da ONG *"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              required
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              hint="Enviamos um código de 6 dígitos. Sem senha."
            />
            <Button type="submit" disabled={!valid || loading} loading={loading}>
              {loading ? "Enviando..." : "Receber código"}
            </Button>
          </form>
          <div className="divider">
            <span>ou</span>
          </div>
          <Link className="text-link" to="/cadastro">
            Ainda não tem conta? <b>Crie a da sua ONG</b>
          </Link>
          <AboutTag />
          <footer className="auth-footer">
            Seus dados são protegidos pela LGPD · <a href="#">Privacidade</a> · v1.0
          </footer>
        </div>
      </section>
    </main>
  );
}

export function CodePage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(59);
  const navigate = useNavigate();
  const filled = digits.every(Boolean);
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);
  const update = (v: string, i: number) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      setDigits([...clean.slice(0, 6), ...Array(6).fill("")].slice(0, 6));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean) document.getElementById(`code-${i + 1}`)?.focus();
  };
  const enter = () => {
    if (!filled) return;
    if (digits.join("") === "000000") return setError("Código inválido ou expirado. Peça um novo.");
    setSuccess(true);
    setTimeout(() => navigate("/painel"), 900);
  };
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="narrow">
        <BackLink to="/entrar" />
        <div className="mail-icon">{success ? <Check /> : <span>@</span>}</div>
        <h1>{success ? "Tudo certo!" : "Confira seu e-mail"}</h1>
        <p>
          Enviamos um código para <b>contato@amigosdepatas.org</b>.{" "}
          <Link to="/entrar">Trocar e-mail</Link>
        </p>
        <div
          className="code-inputs"
          onPaste={(e) => {
            e.preventDefault();
            update(e.clipboardData.getData("text"), 0);
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              id={`code-${i}`}
              value={d}
              inputMode="numeric"
              maxLength={1}
              onChange={(e) => update(e.target.value, i)}
              aria-label={`Dígito ${i + 1}`}
            />
          ))}
        </div>
        {error && (
          <p className="form-alert" aria-live="polite">
            <Info size={16} />
            {error}
          </p>
        )}
        <Button onClick={enter} disabled={!filled || success}>
          {success ? "Entrando..." : "Entrar"}
        </Button>
        <p className="resend">
          {resendIn > 0 ? (
            `Reenviar em 00:${String(resendIn).padStart(2, "0")}`
          ) : (
            <button
              onClick={() => {
                setResendIn(59);
                setError("");
              }}
            >
              Reenviar código
            </button>
          )}
        </p>
      </div>
    </main>
  );
}

export function SignupPage() {
  const [step, setStep] = useState(1);
  const [desc, setDesc] = useState("");
  const [institutionValid, setInstitutionValid] = useState(true);
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="content-720">
        <div className="form-progress-header">
          <BackLink to="/entrar" label="" />
          <Stepper steps={["Instituição", "Sobre a ONG", "Revisão"]} current={step} />
        </div>
        <div className="page-intro">
          <span className="eyebrow">{["Instituição", "Sobre a ONG", "Revisão"][step - 1]}</span>
          <h1>
            {step === 1
              ? "Conte sobre a instituição"
              : step === 2
                ? "Apresente o trabalho da ONG"
                : "Revise os dados"}
          </h1>
          <p>
            {step === 3
              ? "Confira tudo antes de criar a conta."
              : "Essas informações ajudam as famílias a confiar no seu trabalho."}
          </p>
        </div>
        {step === 1 && (
          <div
            className="form-grid"
            onInput={(event) =>
              setInstitutionValid(
                !(event.currentTarget as HTMLDivElement).querySelector(":invalid"),
              )
            }
          >
            <TextField label="Nome da instituição *" defaultValue="Amigos de Patas" required />
            <TextField label="CNPJ (opcional)" placeholder="00.000.000/0000-00" />
            <TextField label="Cidade *" defaultValue="São Paulo" required />
            <Select label="UF *" defaultValue="SP" required>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <TextField label="WhatsApp *" defaultValue="(11) 98888-7777" required />
            <TextField label="Nome do responsável *" defaultValue="Marina Alves" required />
            <TextField label="E-mail" value={ong.email} readOnly disabled className="span-2" />
          </div>
        )}
        {step === 2 && (
          <div className="form-stack">
            <TextArea
              label="Descrição da ONG *"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              hint="Conte sua missão e há quanto tempo atua."
            />
            <FileUpload circular />
            <TextField label="Site ou Instagram" defaultValue="@amigosdepatas" />
            <TextField label="Endereço (opcional)" placeholder="Rua, número e bairro" />
          </div>
        )}
        {step === 3 && (
          <>
            <SectionCard title="Instituição">
              <dl className="review-list">
                <div>
                  <dt>Nome</dt>
                  <dd>Amigos de Patas</dd>
                </div>
                <div>
                  <dt>Localização</dt>
                  <dd>São Paulo, SP</dd>
                </div>
                <div>
                  <dt>Responsável</dt>
                  <dd>Marina Alves</dd>
                </div>
                <div>
                  <dt>Contato</dt>
                  <dd>
                    {ong.email} · {ong.whatsapp}
                  </dd>
                </div>
              </dl>
            </SectionCard>
            <div className="signup-consent">
              <CheckField checked>
                Li e aceito os <a href="#">termos</a> e a <a href="#">política de privacidade</a>.
              </CheckField>
            </div>
          </>
        )}
        <div className="form-actions">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
          )}
          <Button
            disabled={(step === 1 && !institutionValid) || (step === 2 && !desc.trim())}
            onClick={() => (step < 3 ? setStep(step + 1) : location.assign("/painel"))}
          >
            {step === 3 ? "Criar conta da ONG" : "Continuar"}
          </Button>
        </div>
      </div>
    </main>
  );
}

export function OngPage() {
  const [photoTarget, setPhotoTarget] = useState<"cover" | "logo" | null>(null);
  const [cover, setCover] = useState<PhotoAdjustment | null>({
    src: photos.nina,
    focalX: 50,
    focalY: 30,
    zoom: 1,
  });
  const [logo, setLogo] = useState<PhotoAdjustment | null>(null);
  return (
    <main className="public-page">
      <PublicTopbar />
      <section className="ong-cover duotone">
        {cover ? (
          <img
            src={cover.src}
            alt=""
            style={{
              objectPosition: `${cover.focalX}% ${cover.focalY}%`,
              transform: `scale(${cover.zoom})`,
            }}
          />
        ) : (
          <div className="cover-placeholder">
            <Camera /> Adicionar capa
          </div>
        )}
        <button className="cover-edit-button" onClick={() => setPhotoTarget("cover")}>
          <Camera /> {cover ? "Editar capa" : "Adicionar capa"}
        </button>
      </section>
      <div className="content-1100 ong-profile">
        <button
          className="ong-logo"
          onClick={() => setPhotoTarget("logo")}
          aria-label="Alterar logo"
        >
          {logo ? (
            <img
              src={logo.src}
              alt=""
              style={{
                objectPosition: `${logo.focalX}% ${logo.focalY}%`,
                transform: `scale(${logo.zoom})`,
              }}
            />
          ) : (
            <span>AP</span>
          )}
        </button>
        <div className="ong-heading">
          <div>
            <h1>{ong.name}</h1>
            <Badge tone="green">
              <ShieldCheck size={14} /> ONG verificada
            </Badge>
            <p>
              <MapPin size={16} />
              {ong.city}
            </p>
          </div>
          <div className="button-row">
            <Button icon={<MessageCircle />}>Falar no WhatsApp</Button>
            <Button variant="secondary" icon={<Share2 />}>
              Compartilhar
            </Button>
          </div>
        </div>
        <div className="stat-strip">
          <div>
            <strong>12</strong>
            <span>pets disponíveis</span>
          </div>
          <div>
            <strong>148</strong>
            <span>adoções realizadas</span>
          </div>
          <div>
            <strong>8</strong>
            <span>anos de atuação</span>
          </div>
        </div>
        <p className="ong-description">{ong.description}</p>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Esperando por você</span>
            <h2>Pets disponíveis</h2>
          </div>
          <Badge tone="amber">12 amigos</Badge>
        </div>
        <div className="pet-grid">
          {pets
            .filter((p) => p.status === "disponível")
            .map((p) => (
              <PetCard key={p.id} pet={p} />
            ))}
        </div>
      </div>
      <PhotoAdjuster
        open={photoTarget !== null}
        title={photoTarget === "cover" ? "Ajustar capa" : "Alterar logo"}
        aspect={photoTarget === "cover" ? "3 / 1" : "1 / 1"}
        initial={photoTarget === "logo" ? logo?.src || photos.caramelo : cover?.src || photos.nina}
        onClose={() => setPhotoTarget(null)}
        onUse={(adjustment) => {
          if (photoTarget === "logo") setLogo(adjustment);
          else setCover(adjustment);
          setPhotoTarget(null);
        }}
      />
    </main>
  );
}

export function PetPage() {
  const { slug } = useParams();
  const pet = (slug ? petsBySlug[slug] : undefined) || pets[0];
  if (pet.status !== "disponível") return <UnavailablePage />;
  return (
    <main className="public-page pet-detail">
      <PublicTopbar overlay />
      <section className="pet-gallery duotone">
        <img
          src={pet.image}
          alt={`${pet.name} para adoção`}
          style={{ objectPosition: petObjectPosition(pet, "hero") }}
        />
        <button className="icon-button gallery-share" aria-label="Compartilhar">
          <Share2 />
        </button>
        <span className="gallery-count">1 / 3</span>
      </section>
      <div className="pet-sheet perforated">
        <div className="content-720">
          <span className="eyebrow">Uma história mora aqui</span>
          <h1>{pet.name}</h1>
          <dl className="pet-specs">
            {[
              ["Espécie", pet.species],
              ["Sexo", pet.sex],
              ["Porte", pet.size],
              ["Idade", pet.age],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="detail-grid">
            <SectionCard title="Saúde">
              <ul className="check-list">
                <li>
                  <CheckCircle2 />
                  Castrado
                </li>
                <li>
                  <CheckCircle2 />
                  Vacinado
                </li>
                <li>
                  <CheckCircle2 />
                  Vermifugado
                </li>
                {pet.note && (
                  <li>
                    <Info />
                    {pet.note} · acompanhamento veterinário
                  </li>
                )}
              </ul>
            </SectionCard>
            <SectionCard title="Temperamento">
              <div className="temper-tags">
                {pet.temperament.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </SectionCard>
          </div>
          <section className="story">
            <span className="eyebrow">Conheça de verdade</span>
            <h2>A história do {pet.name}</h2>
            <p>
              Encontrado perto de uma escola, {pet.name} chegou tímido e desconfiado. Com cuidado e
              alguns petiscos, mostrou ser um companheiro alegre, carinhoso e cheio de vontade de
              brincar. Agora está saudável e pronto para fazer parte de uma família paciente e
              amorosa.
            </p>
            <span>
              <MapPin size={17} />
              Está em {ong.city}
            </span>
          </section>
          <TagCard className="ong-tag">
            <div className="ong-avatar">
              <PawPrint />
            </div>
            <div>
              <small>ONG responsável</small>
              <h3>{ong.name}</h3>
              <p>{ong.city}</p>
            </div>
            <Link to={`/ong/${ong.slug}`}>
              Ver perfil <ArrowRight size={16} />
            </Link>
          </TagCard>
          <div className="section-heading">
            <h2>Outros pets desta ONG</h2>
          </div>
          <div className="pet-grid mini-grid">
            {pets
              .filter((p) => p.id !== pet.id && p.status === "disponível")
              .slice(0, 3)
              .map((p) => (
                <PetCard key={p.id} pet={p} compact />
              ))}
          </div>
        </div>
      </div>
      <div className="sticky-cta">
        <div>
          <small>Pronto para dar o próximo passo?</small>
          <b>Conheça o processo de adoção</b>
        </div>
        <Link className="button button-primary" to={`/pet/${pet.slug}/adotar`}>
          <Heart size={19} />
          Quero adotar
        </Link>
      </div>
    </main>
  );
}

const adoptSteps = ["Quem é você", "Casa e rotina", "Escolha dos pets", "Revisão e envio"];
const adoptTitles = [
  "Conte sobre você",
  "Sua casa e sua rotina",
  "Escolha os pets",
  "Revise sua solicitação",
];
export function AdoptPage() {
  const { slug } = useParams();
  const originPet = pets.find((pet) => pet.slug === slug) || pets[0];
  const [step, setStep] = useState(1);
  const [identityValid, setIdentityValid] = useState(true);
  const [housing, setHousing] = useState("Casa");
  const [alone, setAlone] = useState("Até 4h");
  const [selected, setSelected] = useState([originPet.id]);
  const [protection, setProtection] = useState("Sim, em todas as janelas");
  const [protectionReviewed, setProtectionReviewed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const hasCat = selected.some((id) => pets.find((pet) => pet.id === id)?.species === "Gato");
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= 3) return;
    const addedPet = pets.find((pet) => pet.id === id);
    if (addedPet?.species === "Gato") setProtectionReviewed(false);
    setSelected([...selected, id]);
  };
  return (
    <main className="simple-page adoption-page">
      <PublicTopbar />
      <div className="content-720">
        <div className="form-progress-header">
          <BackLink to={`/pet/${originPet.slug}`} label="" />
          <Stepper steps={adoptSteps} current={step} />
        </div>
        {step === 1 && (
          <div className="adopt-context-row">
            <img
              src={originPet.image}
              alt=""
              style={{ objectPosition: petObjectPosition(originPet) }}
            />
            <span>
              <b>{originPet.name}</b>
              <small>
                {originPet.species} · {originPet.sex} · {originPet.size} · {originPet.age}
              </small>
            </span>
            <Link to={`/ong/${ong.slug}`}>Trocar pet</Link>
          </div>
        )}
        <div className="page-intro">
          <span className="eyebrow">{adoptSteps[step - 1]}</span>
          <h1>{adoptTitles[step - 1]}</h1>
          <p>
            {step === 1
              ? "Primeiro, precisamos saber como falar com você."
              : step === 2
                ? "Não existem respostas perfeitas. Queremos conhecer sua rotina."
                : step === 3
                  ? "Você pode incluir até 3 pets desta ONG na mesma solicitação."
                  : "Confira suas respostas antes de enviar."}
          </p>
        </div>
        {step === 1 && (
          <>
            <p className="system-note adoption-note">
              <Info />
              Sua solicitação vai direto para a ONG responsável pelo pet. Ela analisa e entra em
              contato pelo e-mail e pelo WhatsApp que você informar.
            </p>
            <div
              className="form-grid"
              onInput={(event) =>
                setIdentityValid(!(event.currentTarget as HTMLDivElement).querySelector(":invalid"))
              }
            >
              <TextField label="Nome completo *" defaultValue="Ana Souza" required />
              <TextField label="E-mail *" type="email" defaultValue="ana@email.com" required />
              <TextField label="WhatsApp *" defaultValue="(11) 97777-1234" required />
              <TextField label="Cidade *" defaultValue="São Paulo" required />
              <Select label="UF *" defaultValue="SP" required>
                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <TextField label="Idade *" type="number" defaultValue="29" required />
              <TextField
                label="Com quantas pessoas você mora? *"
                type="number"
                defaultValue="2"
                required
              />
            </div>
          </>
        )}
        {step === 2 && (
          <div className="form-stack">
            <RadioCards
              label="Tipo de moradia"
              options={["Casa", "Apartamento", "Chácara"]}
              value={housing}
              onChange={setHousing}
            />
            <RadioCards
              label="O pet ficaria sozinho por quanto tempo?"
              options={["Até 4h", "4 a 8h", "Mais de 8h"]}
              value={alone}
              onChange={setAlone}
            />
            {hasCat && (
              <div className="protection-field">
                <RadioCards
                  label="A casa ou apartamento tem telas de proteção?"
                  options={["Sim, em todas as janelas", "Sim, em algumas", "Não"]}
                  value={protection}
                  onChange={setProtection}
                />
                <p className="field-hint">
                  Para gatos, as telas são obrigatórias. Sem elas, a ONG não consegue aprovar a
                  adoção.
                </p>
                {protection === "Não" && (
                  <p className="neutral-note">
                    <Info />
                    A ONG ainda pode avaliar o caso e orientar você sobre a instalação das telas.
                  </p>
                )}
              </div>
            )}
            <div className="switch-grid">
              {[
                "Imóvel próprio",
                "Tem quintal",
                "Crianças em casa",
                "Outros animais",
                "Já teve pet antes",
              ].map((x, i) => (
                <label className="switch-question" key={x}>
                  <span>{x}</span>
                  <select defaultValue={i < 3 ? "Sim" : "Não"}>
                    <option>Sim</option>
                    <option>Não</option>
                    <option>Parcial</option>
                  </select>
                </label>
              ))}
            </div>
            <CheckField checked>Todos na casa concordam com a adoção.</CheckField>
            <CheckField checked>
              Tenho condições de arcar com alimentação, vacinas e veterinário.
            </CheckField>
          </div>
        )}
        {step === 3 && (
          <>
            <p className="system-note">
              <Info />
              Todos os pets precisam ser da mesma ONG.
            </p>
            <div className="select-pets">
              {pets
                .filter((p) => p.status === "disponível")
                .map((p) => (
                  <label key={p.id} className={selected.includes(p.id) ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      disabled={p.id === originPet.id}
                      onChange={() => toggle(p.id)}
                    />
                    <img src={p.image} alt="" style={{ objectPosition: petObjectPosition(p) }} />
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.species} · {p.sex} · {p.size} · {p.age}
                      </small>
                    </span>
                    <span className="select-check">
                      <Check />
                    </span>
                  </label>
                ))}
            </div>
          </>
        )}
        {step === 4 && (
          <div className="form-stack">
            <SectionCard
              title="Seus dados"
              action={
                <button className="text-button" onClick={() => setStep(1)}>
                  Editar
                </button>
              }
            >
              <p>
                Ana Souza · 29 anos
                <br />
                São Paulo, SP · (11) 97777-1234
              </p>
            </SectionCard>
            <SectionCard
              title="Casa e rotina"
              action={
                <button className="text-button" onClick={() => setStep(2)}>
                  Editar
                </button>
              }
            >
              <p>
                {housing} · pet sozinho {alone.toLowerCase()}
                <br />
                Todos concordam com a adoção
              </p>
            </SectionCard>
            <SectionCard
              title="Pets escolhidos"
              action={
                <button className="text-button" onClick={() => setStep(3)}>
                  Editar
                </button>
              }
            >
              <div className="avatar-row">
                {selected.map((id) => {
                  const selectedPet = pets.find((pet) => pet.id === id);
                  return selectedPet ? (
                    <img
                      key={id}
                      src={selectedPet.image}
                      alt=""
                      style={{ objectPosition: petObjectPosition(selectedPet) }}
                    />
                  ) : null;
                })}
              </div>
            </SectionCard>
            <TextArea
              label="Mensagem para a ONG (opcional)"
              maxLength={400}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte por que você quer adotar..."
            />
            <CheckField checked={consent} onChange={() => setConsent(!consent)}>
              Autorizo o uso dos meus dados para este processo, conforme a{" "}
              <a href="#">política de privacidade</a>.
            </CheckField>
            {!consent && <p className="field-hint">Marque o consentimento para enviar.</p>}
          </div>
        )}
        <div className="form-actions">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
          )}
          <div className="submit-context">
            {step === 4 && <p>Ao enviar, a ONG Amigos de Patas recebe sua solicitação.</p>}
            <Button
              disabled={(step === 1 && !identityValid) || (step === 4 && !consent)}
              onClick={() => {
                if (step === 2) {
                  if (hasCat) setProtectionReviewed(true);
                  setStep(3);
                  return;
                }
                if (step === 3 && hasCat && !protectionReviewed) {
                  setStep(2);
                  return;
                }
                if (step < 4) {
                  setStep(step + 1);
                  return;
                }
                navigate(`/pet/${originPet.slug}/adotar/enviado`);
              }}
            >
              {step === 4 ? "Enviar solicitação" : "Continuar"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export function SuccessPage() {
  const copy = () => navigator.clipboard?.writeText("SOL-2026-0001");
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="narrow success-page">
        <span className="success-icon">
          <Check />
        </span>
        <span className="eyebrow">Solicitação recebida</span>
        <h1>Solicitação enviada</h1>
        <p>
          Enviamos uma cópia para <b>ana@email.com</b>. Guarde o protocolo:
        </p>
        <TagCard className="protocol">
          <small>Seu protocolo</small>
          <strong>SOL-2026-0001</strong>
          <button onClick={copy}>
            <Copy />
            Copiar
          </button>
        </TagCard>
        <p className="response-time">
          <Clock3 />A ONG costuma responder em até <b>3 dias úteis</b>.
        </p>
        <SectionCard title="O que acontece agora?">
          <ol className="next-steps">
            <li>
              <span>1</span>A ONG recebe sua solicitação por e-mail.
            </li>
            <li>
              <span>2</span>A ONG analisa e entra em contato pelo e-mail informado.
            </li>
            <li>
              <span>3</span>A adoção segue com a ONG, que combina a entrega do animal.
            </li>
          </ol>
        </SectionCard>
        <p className="success-contact">
          A ONG entra em contato. Você não precisa fazer mais nada.
          <strong>ana@email.com</strong>
        </p>
        <Link className="button button-primary" to={`/ong/${ong.slug}`}>
          <PawPrint />
          Ver outros pets
        </Link>
        <Link className="text-link" to={`/ong/${ong.slug}`}>
          Ir para o perfil da ONG
        </Link>
      </div>
    </main>
  );
}

export function UnavailablePage() {
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="content-1100 unavailable">
        <div className="unavailable-hero">
          <div>
            <span className="eyebrow">Uma boa notícia</span>
            <h1>Este pet já encontrou um lar</h1>
            <p>
              A ficha de Nina continua aqui para celebrar sua história. Outros amigos da mesma ONG
              ainda esperam por uma família.
            </p>
            <Link className="button button-primary" to={`/ong/${ong.slug}`}>
              Conhecer outros pets
            </Link>
          </div>
          <img
            src={photos.nina}
            alt="Nina, que já foi adotada"
            style={{ objectPosition: petObjectPosition(pets[3]) }}
          />
        </div>
        <div className="section-heading">
          <h2>Quem ainda está esperando</h2>
        </div>
        <div className="pet-grid">
          {pets
            .filter((p) => p.status === "disponível")
            .slice(0, 3)
            .map((p) => (
              <PetCard key={p.id} pet={p} />
            ))}
        </div>
      </div>
    </main>
  );
}
