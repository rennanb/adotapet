import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { supabase } from "../lib/supabase";
import { traduzErro } from "../lib/auth";
import {
  buscarOngPublica,
  buscarPetPublico,
  criarSolicitacao,
  type OngPublica,
  type PetPublico,
  carregarSolicitacaoPorToken,
  type SolicitacaoPublica,
} from "../lib/dados";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  PawPrint,
  Pause,
  Play,
  Share2,
} from "lucide-react";
import { getPublicBaseUrl, petObjectPosition, photos, states, type Pet } from "../mocks";
import { AboutTag, PublicTopbar } from "../components/Shells";
import {
  BackLink,
  Badge,
  Button,
  CheckField,
  EmptyState,
  FileUpload,
  ListSkeleton,
  RadioCards,
  SectionCard,
  Select,
  Stepper,
  TagCard,
  TextArea,
  TextField,
} from "../components/ui";
import { PetCard } from "../components/PetParts";

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
    pill: "Pets esperando um lar",
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setError("Digite um e-mail válido.");

    const limpo = email.trim().toLowerCase();
    setLoading(true);
    setError("");

    const { error: falha } = await supabase.auth.signInWithOtp({
      email: limpo,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/painel`,
      },
    });

    setLoading(false);

    if (falha) {
      console.error(falha);
      setError(traduzErro(falha.message));
      return;
    }

    navigate("/entrar/codigo", { state: { email: limpo } });
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
          <p className="auth-explore">
            Quer adotar? Veja os <Link to="/pets">pets disponíveis</Link> e conheça as{" "}
            <Link to="/ongs">ONGs parceiras</Link>.
          </p>
          <AboutTag />
          <footer className="auth-footer">
            Seus dados são protegidos pela LGPD · <Link to="/privacidade">Privacidade</Link> ·{" "}
            <Link to="/termos">Termos</Link>
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const filled = digits.every(Boolean);

  useEffect(() => {
    if (!email) navigate("/entrar", { replace: true });
  }, [email, navigate]);
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
  const enter = async () => {
    if (!filled || loading) return;
    setLoading(true);
    setError("");

    // O Supabase usa tipos diferentes conforme a situação do e-mail:
    // "signup" quando a conta está sendo criada e "email" quando ela já existe.
    // Como a tela é a mesma nos dois casos, tentamos os dois em sequência.
    const tipos = ["email", "signup"] as const;
    let mensagem: string | null = null;

    for (const tipo of tipos) {
      const { error: falha } = await supabase.auth.verifyOtp({
        email,
        token: digits.join(""),
        type: tipo,
      });
      if (!falha) {
        mensagem = null;
        break;
      }
      mensagem = falha.message;
      console.error(`verifyOtp (${tipo}):`, falha);
    }

    setLoading(false);

    if (mensagem) {
      setError(traduzErro(mensagem));
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/painel", { replace: true }), 900);
  };

  const reenviar = async () => {
    setError("");
    setLoading(true);
    const { error: falha } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (falha) {
      setError(traduzErro(falha.message));
      return;
    }
    setResendIn(59);
  };
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="narrow">
        <BackLink to="/entrar" />
        <div className="mail-icon">{success ? <Check /> : <span>@</span>}</div>
        <h1>{success ? "Tudo certo!" : "Confira seu e-mail"}</h1>
        <p>
          Enviamos um código para <b>{email || "seu e-mail"}</b>.{" "}
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
        <Button onClick={enter} disabled={!filled || success || loading} loading={loading}>
          {success ? "Entrando..." : loading ? "Verificando..." : "Entrar"}
        </Button>
        <p className="resend">
          {resendIn > 0 ? (
            `Reenviar em 00:${String(resendIn).padStart(2, "0")}`
          ) : (
            <button onClick={reenviar} disabled={loading}>
              Reenviar código
            </button>
          )}
        </p>
      </div>
    </main>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aceite, setAceite] = useState(false);
  const [dados, setDados] = useState({
    nome: "",
    cnpj: "",
    cidade: "",
    uf: "SP",
    whatsapp: "",
    responsavel: "",
    email: "",
    sobre: "",
    site: "",
    endereco: "",
  });

  const campo = (chave: keyof typeof dados) => ({
    value: dados[chave],
    onChange: (evento: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDados((atual) => ({ ...atual, [chave]: evento.target.value })),
  });

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim());
  const passo1Ok =
    dados.nome.trim().length > 2 &&
    dados.cidade.trim().length > 1 &&
    dados.whatsapp.trim().length > 7 &&
    dados.responsavel.trim().length > 2 &&
    emailValido;
  const passo2Ok = dados.sobre.trim().length >= 40;

  const enviar = async () => {
    setErro("");
    setEnviando(true);
    const email = dados.email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/painel`,
        data: {
          nome: dados.nome.trim(),
          cidade: dados.cidade.trim(),
          uf: dados.uf,
          whatsapp: dados.whatsapp.trim(),
          responsavel: dados.responsavel.trim(),
          sobre: dados.sobre.trim(),
          site: dados.site.trim(),
          cnpj: dados.cnpj.trim(),
        },
      },
    });

    setEnviando(false);

    if (error) {
      console.error(error);
      setErro(traduzErro(error.message));
      return;
    }

    navigate("/entrar/codigo", { state: { email } });
  };

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
              ? "Confira tudo antes de receber o código de acesso."
              : "Essas informações ajudam as famílias a confiar no seu trabalho."}
          </p>
        </div>

        {step === 1 && (
          <div className="form-grid">
            <TextField label="Nome da instituição *" required {...campo("nome")} />
            <TextField
              label="CNPJ (opcional)"
              placeholder="00.000.000/0000-00"
              {...campo("cnpj")}
            />
            <TextField label="Cidade *" required {...campo("cidade")} />
            <Select
              label="UF *"
              required
              value={dados.uf}
              onChange={(e) => setDados((a) => ({ ...a, uf: e.target.value }))}
            >
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <TextField label="WhatsApp *" required {...campo("whatsapp")} />
            <TextField label="Nome do responsável *" required {...campo("responsavel")} />
            <TextField
              label="E-mail da ONG *"
              type="email"
              required
              className="span-2"
              hint="É para este endereço que enviamos o código de acesso."
              {...campo("email")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="form-stack">
            <TextArea
              label="Descrição da ONG *"
              hint="Conte sua missão e há quanto tempo atua. Mínimo de 40 caracteres."
              {...campo("sobre")}
            />
            <FileUpload circular />
            <TextField label="Site ou Instagram" {...campo("site")} />
            <TextField
              label="Endereço (opcional)"
              placeholder="Rua, número e bairro"
              {...campo("endereco")}
            />
          </div>
        )}

        {step === 3 && (
          <>
            <SectionCard title="Instituição">
              <dl className="review-list">
                <div>
                  <dt>Nome</dt>
                  <dd>{dados.nome || "não informado"}</dd>
                </div>
                <div>
                  <dt>Localização</dt>
                  <dd>
                    {dados.cidade || "não informada"}
                    {dados.uf ? `, ${dados.uf}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Responsável</dt>
                  <dd>{dados.responsavel || "não informado"}</dd>
                </div>
                <div>
                  <dt>Contato</dt>
                  <dd>
                    {dados.email || "sem e-mail"} · {dados.whatsapp || "sem WhatsApp"}
                  </dd>
                </div>
              </dl>
            </SectionCard>
            <SectionCard title="Sobre a ONG">
              <p>{dados.sobre || "Sem descrição."}</p>
              {dados.site && <p>{dados.site}</p>}
            </SectionCard>
            <div className="signup-consent">
              <CheckField checked={aceite} onChange={() => setAceite(!aceite)}>
                Li e aceito os <a href="#">termos</a> e a <a href="#">política de privacidade</a>.
              </CheckField>
            </div>
            {erro && (
              <p className="form-alert" aria-live="polite">
                <Info size={16} />
                {erro}
              </p>
            )}
          </>
        )}

        <div className="form-actions">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
          )}
          <Button
            disabled={
              enviando ||
              (step === 1 && !passo1Ok) ||
              (step === 2 && !passo2Ok) ||
              (step === 3 && !aceite)
            }
            loading={enviando}
            onClick={() => {
              if (step < 3) return setStep(step + 1);
              void enviar();
            }}
          >
            {step === 3 ? (enviando ? "Enviando..." : "Receber código de acesso") : "Continuar"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function useShare() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);
  const share = async ({ title, text, url }: { title: string; text?: string; url: string }) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copiado");
    } catch {
      setMessage("Não foi possível copiar o link");
    }
  };
  return { share, message };
}

type DadosOng = { ong: OngPublica; pets: Pet[] };
type DadosPet = { pet: PetPublico; ong: OngPublica; irmaos: Pet[] };

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "AP";
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return `${primeira}${ultima}`.toUpperCase();
}

function linkDoWhatsapp(numero: string) {
  const digitos = numero.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos.length > 11 ? digitos : `55${digitos}`}`;
}

function cidadeComUf(cidade: string | null, uf: string | null) {
  if (!cidade) return uf ?? "";
  return uf ? `${cidade}, ${uf}` : cidade;
}

export function OngPage() {
  const { slug = "" } = useParams();
  const { share, message } = useShare();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<DadosOng | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setDados(null);
    buscarOngPublica(slug)
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setDados(null);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (carregando) {
    return (
      <main className="public-page">
        <PublicTopbar />
        <div className="content-1100 ong-profile">
          <p className="field-hint" role="status" aria-live="polite">
            Carregando o perfil da ONG...
          </p>
          <ListSkeleton count={2} />
        </div>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="public-page">
        <PublicTopbar />
        <div className="content-1100">
          <EmptyState
            title="Não encontramos esta ONG"
            text="O endereço pode ter mudado ou o perfil saiu do ar. Volte ao início para conhecer outros pets."
            action="Voltar ao início"
            to="/"
          />
        </div>
      </main>
    );
  }

  const { ong: ongPublica, pets: petsDaOng } = dados;
  const disponiveis = petsDaOng.filter((pet) => pet.status === "disponível");
  const local = cidadeComUf(ongPublica.cidade, ongPublica.uf);
  const capa = ongPublica.capa || photos.caramelo;
  const url = `${getPublicBaseUrl()}/ong/${ongPublica.slug}`;
  const whatsapp = ongPublica.whatsapp ? linkDoWhatsapp(ongPublica.whatsapp) : null;
  const whatsappUrl = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(
        `Olá! Vi os pets da ${ongPublica.nome} no AdotaPet e quero saber mais sobre a adoção.`,
      )}`
    : null;

  return (
    <main className="public-page">
      <PublicTopbar />
      <section className="ong-cover duotone">
        <img
          src={capa}
          alt={`Capa do perfil da ${ongPublica.nome}`}
          style={{ objectPosition: "50% 30%" }}
        />
      </section>
      <div className="content-1100 ong-profile">
        <div className="ong-logo">
          {ongPublica.logo ? (
            <img src={ongPublica.logo} alt={`Logo da ${ongPublica.nome}`} />
          ) : (
            <span>{iniciaisDoNome(ongPublica.nome)}</span>
          )}
        </div>
        <div className="ong-heading">
          <div>
            <h1>{ongPublica.nome}</h1>
            <Badge tone="gray">ONG cadastrada</Badge>
            <p>
              <MapPin size={16} />
              {local}
            </p>
          </div>
          <div className="button-row">
            {whatsappUrl && (
              <a
                className="button button-primary"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={19} />
                Falar no WhatsApp
              </a>
            )}
            <Button
              variant="secondary"
              icon={<Share2 />}
              onClick={() =>
                share({
                  title: ongPublica.nome,
                  text: `Conheça os pets da ${ongPublica.nome}`,
                  url,
                })
              }
            >
              Compartilhar
            </Button>
          </div>
        </div>
        <div className="stat-strip" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div>
            <strong>{disponiveis.length}</strong>
            <span>{disponiveis.length === 1 ? "pet disponível" : "pets disponíveis"}</span>
          </div>
          <div>
            <strong>{ongPublica.cidade}</strong>
            <span>{ongPublica.uf ? `cidade da ONG, ${ongPublica.uf}` : "cidade da ONG"}</span>
          </div>
        </div>
        <p className="ong-description">
          {ongPublica.sobre || "A ONG ainda não escreveu uma apresentação do seu trabalho."}
        </p>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Esperando por você</span>
            <h2>Pets disponíveis</h2>
          </div>
          <Badge tone="amber">
            {disponiveis.length} {disponiveis.length === 1 ? "amigo" : "amigos"}
          </Badge>
        </div>
        {disponiveis.length > 0 ? (
          <div className="pet-grid">
            {disponiveis.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="empty-icon">
              <PawPrint />
            </span>
            <h3>Nenhum pet disponível agora</h3>
            <p>
              Esta ONG não tem pets disponíveis para adoção neste momento. Assim que um novo amigo
              for cadastrado, ele aparece aqui.
            </p>
          </div>
        )}
      </div>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </main>
  );
}

export function PetPage() {
  const { slug = "" } = useParams();
  const { share, message } = useShare();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<DadosPet | null>(null);
  const [indiceFoto, setIndiceFoto] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setDados(null);
    buscarPetPublico(slug)
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setDados(null);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (carregando) {
    return (
      <main className="public-page">
        <PublicTopbar />
        <div className="content-720">
          <p className="field-hint" role="status" aria-live="polite">
            Carregando a ficha do pet...
          </p>
          <ListSkeleton count={1} />
        </div>
      </main>
    );
  }

  if (!dados || dados.pet.status !== "disponível") {
    return (
      <UnavailablePage
        petName={dados?.pet.name}
        petImage={dados?.pet.image}
        petPosition={dados ? petObjectPosition(dados.pet, "hero") : undefined}
        ongSlug={dados?.ong.slug}
        outros={dados?.irmaos.filter((pet) => pet.status === "disponível")}
      />
    );
  }

  const { pet, ong: ongPublica, irmaos } = dados;
  const saude = [
    pet.castrado ? "Castrado" : null,
    pet.vacinado ? "Vacinado" : null,
    pet.vermifugado ? "Vermifugado" : null,
  ].filter((item): item is string => Boolean(item));
  const temSaude = saude.length > 0 || Boolean(pet.condicoes);
  const temTemperamento = pet.temperament.length > 0;
  const outrosPets = irmaos.filter((irmao) => irmao.status === "disponível").slice(0, 3);
  const localDoPet = pet.cidade ? cidadeComUf(pet.cidade, pet.uf) : "Localização não informada";
  const fotos = pet.fotos.length ? pet.fotos : [pet.image];

  return (
    <main className="public-page pet-detail">
      <PublicTopbar overlay />
      <section
        className="pet-gallery duotone"
        aria-roledescription="carrossel"
        aria-label={`Fotos de ${pet.name}`}
        onKeyDown={(evento) => {
          if (fotos.length < 2) return;
          if (evento.key === "ArrowRight") {
            setIndiceFoto((atual) => (atual + 1) % fotos.length);
          }
          if (evento.key === "ArrowLeft") {
            setIndiceFoto((atual) => (atual - 1 + fotos.length) % fotos.length);
          }
        }}
        tabIndex={fotos.length > 1 ? 0 : -1}
      >
        <img
          src={fotos[Math.min(indiceFoto, fotos.length - 1)]}
          alt={`${pet.name} para adoção, foto ${Math.min(indiceFoto, fotos.length - 1) + 1} de ${fotos.length}`}
          style={{ objectPosition: petObjectPosition(pet, "hero") }}
        />
        <button
          className="icon-button gallery-share"
          aria-label="Compartilhar a ficha deste pet"
          onClick={() =>
            share({
              title: pet.name,
              text: `${pet.name} procura um lar. Veja a ficha completa.`,
              url: `${getPublicBaseUrl()}/pet/${pet.slug}`,
            })
          }
        >
          <Share2 />
        </button>
        {fotos.length > 1 && (
          <>
            <button
              className="gallery-nav gallery-prev"
              aria-label="Foto anterior"
              onClick={() => setIndiceFoto((atual) => (atual - 1 + fotos.length) % fotos.length)}
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-nav gallery-next"
              aria-label="Próxima foto"
              onClick={() => setIndiceFoto((atual) => (atual + 1) % fotos.length)}
            >
              <ChevronRight />
            </button>
            <div className="gallery-dots" role="tablist" aria-label="Escolher foto">
              {fotos.map((url, indice) => (
                <button
                  key={url}
                  role="tab"
                  aria-selected={indice === Math.min(indiceFoto, fotos.length - 1)}
                  aria-label={`Foto ${indice + 1}`}
                  className={indice === Math.min(indiceFoto, fotos.length - 1) ? "is-active" : ""}
                  onClick={() => setIndiceFoto(indice)}
                />
              ))}
            </div>
            <span className="gallery-count" aria-live="polite">
              {Math.min(indiceFoto, fotos.length - 1) + 1} / {fotos.length}
            </span>
          </>
        )}
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
          <div
            className="detail-grid"
            style={temTemperamento ? undefined : { gridTemplateColumns: "1fr" }}
          >
            <SectionCard title="Saúde">
              {temSaude ? (
                <ul className="check-list">
                  {saude.map((item) => (
                    <li key={item}>
                      <CheckCircle2 />
                      {item}
                    </li>
                  ))}
                  {pet.condicoes && (
                    <li>
                      <Info />
                      {pet.condicoes}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="field-hint">A ONG ainda não informou os dados de saúde.</p>
              )}
            </SectionCard>
            {temTemperamento && (
              <SectionCard title="Temperamento">
                <div className="temper-tags">
                  {pet.temperament.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
          <section className="story">
            <span className="eyebrow">Conheça de verdade</span>
            <h2>A história de {pet.name}</h2>
            <p>
              {pet.descricao ||
                "A ONG ainda não escreveu a história deste pet. Fale com ela para saber mais sobre o jeito e a rotina dele."}
            </p>
            <span>
              <MapPin size={17} />
              {localDoPet}
            </span>
          </section>
          <TagCard className="ong-tag">
            <div className="ong-avatar">
              <PawPrint />
            </div>
            <div>
              <small>ONG responsável</small>
              <h3>{pet.ongNome}</h3>
              <p>{cidadeComUf(ongPublica.cidade, ongPublica.uf)}</p>
            </div>
            <Link to={`/ong/${pet.ongSlug}`}>
              Ver perfil <ArrowRight size={16} />
            </Link>
          </TagCard>
          {outrosPets.length > 0 && (
            <>
              <div className="section-heading">
                <h2>Outros pets desta ONG</h2>
              </div>
              <div className="pet-grid mini-grid">
                {outrosPets.map((irmao) => (
                  <PetCard key={irmao.id} pet={irmao} compact />
                ))}
              </div>
            </>
          )}
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
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
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

type DadosPessoa = {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  idade: string;
  pessoas: string;
};

const pessoaVazia: DadosPessoa = {
  nome: "",
  email: "",
  telefone: "",
  cidade: "",
  uf: "",
  idade: "",
  pessoas: "",
};

export function AdoptPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<DadosPet | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DadosPessoa>(pessoaVazia);
  const [housing, setHousing] = useState("");
  const [alone, setAlone] = useState("");
  const [protection, setProtection] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [protectionReviewed, setProtectionReviewed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setDados(null);
    buscarPetPublico(slug)
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setSelected(resultado ? [resultado.pet.id] : []);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setDados(null);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (carregando) {
    return (
      <main className="simple-page adoption-page">
        <PublicTopbar />
        <div className="content-720">
          <p className="field-hint" role="status" aria-live="polite">
            Carregando o formulário de adoção...
          </p>
          <ListSkeleton count={2} />
        </div>
      </main>
    );
  }

  if (!dados || dados.pet.status !== "disponível") {
    return (
      <UnavailablePage
        petName={dados?.pet.name}
        petImage={dados?.pet.image}
        petPosition={dados ? petObjectPosition(dados.pet, "hero") : undefined}
        ongSlug={dados?.ong.slug}
        outros={dados?.irmaos.filter((pet) => pet.status === "disponível")}
      />
    );
  }

  const originPet = dados.pet;
  const opcoes = [dados.pet, ...dados.irmaos.filter((pet) => pet.status === "disponível")];
  const hasCat = selected.some((id) => opcoes.find((pet) => pet.id === id)?.species === "Gato");
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const telefoneDigitos = form.telefone.replace(/\D/g, "").length;
  const idadeNumero = Number(form.idade);
  const pessoasNumero = Number(form.pessoas);
  const idadeValida = Number.isInteger(idadeNumero) && idadeNumero >= 18 && idadeNumero <= 110;
  const pessoasValida =
    Number.isInteger(pessoasNumero) && pessoasNumero >= 1 && pessoasNumero <= 20;
  const dadosOk =
    form.nome.trim().length > 2 &&
    emailValido &&
    telefoneDigitos >= 10 &&
    form.cidade.trim().length > 1 &&
    form.uf.length === 2 &&
    idadeValida &&
    pessoasValida;
  const rotinaOk = Boolean(housing) && Boolean(alone) && (!hasCat || Boolean(protection));

  const campo = (chave: keyof DadosPessoa) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setForm((atual) => ({ ...atual, [chave]: evento.target.value }));

  const toggle = (id: string) => {
    const jaEscolhido = selected.includes(id);
    if (jaEscolhido) {
      setSelected(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= 3) return;
    if (opcoes.find((pet) => pet.id === id)?.species === "Gato") setProtectionReviewed(false);
    setSelected([...selected, id]);
  };

  const nomesSelecionados = selected
    .map((id) => opcoes.find((pet) => pet.id === id)?.name)
    .filter((nome): nome is string => Boolean(nome));

  const enviar = async () => {
    if (enviando) return;
    setErro("");
    if (!dadosOk) {
      setErro(
        "Confira seus dados antes de enviar. Nome, e-mail, WhatsApp, cidade, UF e idade são obrigatórios.",
      );
      setStep(1);
      return;
    }
    if (!rotinaOk) {
      setErro("Faltou responder sobre a casa e a rotina antes de enviar.");
      setStep(2);
      return;
    }
    if (!consent) {
      setErro("É preciso aceitar os termos para enviar.");
      return;
    }

    const extras = selected
      .filter((id) => id !== originPet.id)
      .map((id) => opcoes.find((pet) => pet.id === id)?.slug)
      .filter((extra): extra is string => Boolean(extra));

    setEnviando(true);
    try {
      const protocolo = await criarSolicitacao({
        animalSlug: originPet.slug,
        extras,
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf,
        idade: idadeNumero,
        pessoasNaCasa: pessoasNumero,
        moradia: housing,
        petSozinho: alone,
        temTelas: hasCat ? protection : null,
        mensagem: mensagem.trim(),
        consentimento: consent,
      });
      navigate(`/pet/${originPet.slug}/adotar/enviado`, {
        state: { protocolo, nome: form.nome.trim(), pets: nomesSelecionados },
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível enviar sua solicitação agora. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
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
              alt={`${originPet.name}, ${originPet.species.toLowerCase()} para adoção`}
              style={{ objectPosition: petObjectPosition(originPet) }}
            />
            <span>
              <b>{originPet.name}</b>
              <small>
                {originPet.species} · {originPet.sex} · {originPet.size} · {originPet.age}
              </small>
            </span>
            <Link to={`/ong/${dados.ong.slug}`}>Trocar pet</Link>
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
            <div className="form-grid">
              <TextField
                label="Nome completo *"
                name="nome"
                value={form.nome}
                onChange={campo("nome")}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
                required
              />
              <TextField
                label="E-mail *"
                name="email"
                type="email"
                value={form.email}
                onChange={campo("email")}
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
              <TextField
                label="WhatsApp *"
                name="telefone"
                value={form.telefone}
                onChange={campo("telefone")}
                placeholder="(11) 91234-5678"
                autoComplete="tel"
                required
              />
              <TextField
                label="Cidade *"
                name="cidade"
                value={form.cidade}
                onChange={campo("cidade")}
                placeholder="Sua cidade"
                autoComplete="address-level2"
                required
              />
              <Select
                label="UF *"
                name="uf"
                value={form.uf}
                onChange={(evento) => setForm((atual) => ({ ...atual, uf: evento.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <TextField
                label="Idade *"
                name="idade"
                type="number"
                min={18}
                max={110}
                value={form.idade}
                onChange={campo("idade")}
                placeholder="Ex.: 29"
                hint="É preciso ter 18 anos ou mais para adotar."
                required
              />
              <TextField
                label="Com quantas pessoas você mora? *"
                name="pessoas"
                type="number"
                min={1}
                max={20}
                value={form.pessoas}
                onChange={campo("pessoas")}
                placeholder="Ex.: 2"
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
          </div>
        )}
        {step === 3 && (
          <>
            <p className="system-note">
              <Info />
              Todos os pets precisam ser da mesma ONG.
            </p>
            <div className="select-pets">
              {opcoes.map((p) => (
                <label key={p.id} className={selected.includes(p.id) ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    disabled={p.id === originPet.id}
                    onChange={() => toggle(p.id)}
                  />
                  <img
                    src={p.image}
                    alt={`${p.name}, ${p.species.toLowerCase()}`}
                    style={{ objectPosition: petObjectPosition(p) }}
                  />
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
            {selected.length >= 3 && (
              <p className="field-hint">Você já escolheu 3 pets, que é o máximo por solicitação.</p>
            )}
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
                {form.nome.trim() || "Nome não informado"} ·{" "}
                {form.idade ? `${form.idade} anos` : "idade não informada"}
                <br />
                {form.cidade.trim() || "cidade não informada"}
                {form.uf ? `, ${form.uf}` : ""} · {form.telefone.trim() || "sem telefone"}
                <br />
                {form.email.trim() || "sem e-mail"}
                <br />
                {form.pessoas
                  ? `Mora com ${form.pessoas} ${Number(form.pessoas) === 1 ? "pessoa" : "pessoas"}`
                  : "Número de pessoas na casa não informado"}
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
                {housing || "Moradia não informada"} · pet sozinho{" "}
                {alone ? alone.toLowerCase() : "não informado"}
                {hasCat && (
                  <>
                    <br />
                    Telas de proteção: {protection ? protection.toLowerCase() : "não informado"}
                  </>
                )}
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
                  const escolhido = opcoes.find((pet) => pet.id === id);
                  return escolhido ? (
                    <img
                      key={id}
                      src={escolhido.image}
                      alt={`${escolhido.name}, ${escolhido.species.toLowerCase()}`}
                      style={{ objectPosition: petObjectPosition(escolhido) }}
                    />
                  ) : null;
                })}
              </div>
              <p>{nomesSelecionados.join(", ")}</p>
            </SectionCard>
            <TextArea
              label="Mensagem para a ONG (opcional)"
              maxLength={400}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Conte por que você quer adotar..."
            />
            <CheckField checked={consent} onChange={() => setConsent(!consent)}>
              Autorizo o uso dos meus dados para este processo, conforme a{" "}
              <a href="#">política de privacidade</a>.
            </CheckField>
            {!consent && <p className="field-hint">Marque o consentimento para enviar.</p>}
            {erro && (
              <p className="form-alert" aria-live="polite">
                <Info size={16} />
                {erro}
              </p>
            )}
          </div>
        )}
        <div className="form-actions">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={enviando}>
              Voltar
            </Button>
          )}
          <div className="submit-context">
            {step === 4 && (
              <p>
                Ao enviar, a {dados.ong.nome} recebe sua solicitação e entra em contato com você.
              </p>
            )}
            <Button
              disabled={enviando || (step === 1 && !dadosOk) || (step === 2 && !rotinaOk)}
              loading={enviando}
              onClick={() => {
                if (enviando) return;
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
                  setErro("");
                  setStep(step + 1);
                  return;
                }
                void enviar();
              }}
            >
              {step === 4 ? (enviando ? "Enviando..." : "Enviar solicitação") : "Continuar"}
            </Button>
          </div>
        </div>
        {step !== 4 && erro && (
          <p className="form-alert" aria-live="polite">
            <Info size={16} />
            {erro}
          </p>
        )}
      </div>
    </main>
  );
}

type EstadoEnvio = { protocolo?: string; nome?: string; pets?: string[] };

export function SuccessPage() {
  const location = useLocation();
  const { slug = "" } = useParams();
  const estado = (location.state as EstadoEnvio | null) ?? null;
  const protocolo = typeof estado?.protocolo === "string" ? estado.protocolo : "";
  const nome = typeof estado?.nome === "string" ? estado.nome.trim() : "";
  const petsEnviados = Array.isArray(estado?.pets)
    ? estado.pets.filter((pet): pet is string => typeof pet === "string")
    : [];
  const [ong, setOng] = useState<{ nome: string; slug: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let ativo = true;
    buscarPetPublico(slug)
      .then((resultado) => {
        if (!ativo || !resultado) return;
        setOng({ nome: resultado.ong.nome, slug: resultado.ong.slug });
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [slug]);

  const copiar = () => {
    if (!protocolo) return;
    void navigator.clipboard?.writeText(protocolo);
  };

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
          {nome ? `${nome}, sua solicitação foi registrada.` : "Sua solicitação foi registrada."}{" "}
          {protocolo ? "Guarde o protocolo:" : ""}
        </p>
        {protocolo ? (
          <TagCard className="protocol">
            <small>Seu protocolo</small>
            <strong>{protocolo}</strong>
            <button onClick={copiar} aria-label="Copiar o número do protocolo">
              <Copy />
              Copiar
            </button>
          </TagCard>
        ) : (
          <p className="system-note" aria-live="polite">
            <Info size={16} />
            Não conseguimos recuperar o protocolo nesta página. Se você acabou de enviar, ele também
            fica registrado na solicitação que a ONG recebe.
          </p>
        )}
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
          {petsEnviados.length > 0
            ? `Solicitação para ${petsEnviados.join(", ")}. A ONG entra em contato, você não precisa fazer mais nada.`
            : "A ONG entra em contato. Você não precisa fazer mais nada."}
          {ong && <strong>{ong.nome}</strong>}
        </p>
        {ong ? (
          <>
            <Link className="button button-primary" to={`/ong/${ong.slug}`}>
              <PawPrint />
              Ver outros pets
            </Link>
            <Link className="text-link" to={`/ong/${ong.slug}`}>
              Ir para o perfil da ONG
            </Link>
          </>
        ) : (
          <Link className="button button-primary" to="/">
            <PawPrint />
            Voltar ao início
          </Link>
        )}
      </div>
    </main>
  );
}

type UnavailableProps = {
  petName?: string;
  petImage?: string;
  petPosition?: string;
  ongSlug?: string;
  outros?: Pet[];
};

export function UnavailablePage({
  petName,
  petImage,
  petPosition,
  ongSlug,
  outros,
}: UnavailableProps = {}) {
  const disponiveis = (outros ?? []).filter((pet) => pet.status === "disponível").slice(0, 3);
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="content-1100 unavailable">
        <div className="unavailable-hero">
          <div>
            <span className="eyebrow">Ficha indisponível</span>
            <h1>Este pet não está disponível agora</h1>
            <p>
              {petName
                ? `${petName} pode já ter encontrado um lar ou estar em processo de adoção.`
                : "Este pet pode já ter encontrado um lar ou estar em processo de adoção."}
              {disponiveis.length > 0 ? " Outros amigos ainda esperam por uma família." : ""}
            </p>
            {ongSlug ? (
              <Link className="button button-primary" to={`/ong/${ongSlug}`}>
                Conhecer outros pets
              </Link>
            ) : (
              <Link className="button button-primary" to="/">
                Voltar ao início
              </Link>
            )}
          </div>
          <img
            src={petImage ?? photos.nina}
            alt={petName ? `Foto de ${petName}` : "Pet que não está mais disponível para adoção"}
            style={{ objectPosition: petPosition ?? "50% 30%" }}
          />
        </div>
        {disponiveis.length > 0 && (
          <>
            <div className="section-heading">
              <h2>Quem ainda está esperando</h2>
            </div>
            <div className="pet-grid">
              {disponiveis.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const MORADIA_DOC: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  chacara: "Chácara",
};

const SOZINHO_DOC: Record<string, string> = {
  ate_4h: "Até 4 horas",
  "4_a_8h": "De 4 a 8 horas",
  mais_de_8h: "Mais de 8 horas",
};

const TELAS_DOC: Record<string, string> = {
  todas: "Sim, em todas as janelas",
  algumas: "Sim, em algumas janelas",
  nao: "Não tem telas",
};

const ESPECIE_DOC: Record<string, string> = { cao: "Cão", gato: "Gato" };
const SEXO_DOC: Record<string, string> = { macho: "Macho", femea: "Fêmea" };
const PORTE_DOC: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

function idadeDoc(meses: number | null) {
  if (meses === null || meses === undefined) return "Idade não informada";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos === 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  if (resto === 0) return parteAnos;
  return `${parteAnos} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
}

export function SolicitacaoPage() {
  const { token = "" } = useParams();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<SolicitacaoPublica | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    void carregarSolicitacaoPorToken(token)
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setDados(null);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token]);

  if (carregando) {
    return (
      <main className="doc-page">
        <div className="doc-sheet">
          <p className="field-hint" role="status" aria-live="polite">
            Abrindo a solicitação...
          </p>
        </div>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="doc-page">
        <div className="doc-sheet">
          <span className="doc-brand">
            AdotaPet <i aria-hidden="true" />
          </span>
          <h1 className="doc-title">Não encontramos esta solicitação</h1>
          <p className="doc-text">
            O link pode ter sido trocado ou a solicitação foi removida. Peça um link novo para a
            ONG ou abra o painel para conferir a lista.
          </p>
          <Link className="doc-back" to="/entrar">
            Ir para o AdotaPet
          </Link>
        </div>
      </main>
    );
  }

  const petPrincipal = dados.pets[0];
  const nomes = dados.pets.map((pet) => pet.nome).join(" e ");
  const local = [dados.cidade, dados.uf].filter(Boolean).join("/");
  const localOng = [dados.ong.cidade, dados.ong.uf].filter(Boolean).join("/");
  const emitido = new Date(dados.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const ficha = [
    ["Nome", dados.nome],
    ["Idade", dados.idade ? `${dados.idade} anos` : "não informada"],
    ["Cidade", local || "não informada"],
    ["E-mail", dados.email],
    ["Telefone", dados.telefone || "não informado"],
  ];

  const rotina = [
    ["Moradia", dados.moradia ? (MORADIA_DOC[dados.moradia] ?? dados.moradia) : "não informada"],
    [
      "Tempo sozinho",
      dados.pet_sozinho ? (SOZINHO_DOC[dados.pet_sozinho] ?? dados.pet_sozinho) : "não informado",
    ],
    ["Telas nas janelas", dados.tem_telas ? (TELAS_DOC[dados.tem_telas] ?? dados.tem_telas) : "não informado"],
    [
      "Pessoas na casa",
      dados.pessoas_na_casa ? String(dados.pessoas_na_casa) : "não informado",
    ],
  ];

  return (
    <main className="doc-page">
      <div className="doc-actions">
        <button type="button" className="doc-print" onClick={() => window.print()}>
          Salvar em PDF
        </button>
        <span className="doc-hint">Abre a impressão do navegador. Escolha "Salvar como PDF".</span>
      </div>

      <article className="doc-sheet">
        <header className="doc-head">
          <span className="doc-brand">
            AdotaPet <i aria-hidden="true" />
          </span>
          <span className="doc-stamp">Solicitação de adoção</span>
        </header>

        {petPrincipal?.foto && (
          <div className="doc-cover">
            <img src={petPrincipal.foto} alt={`Foto de ${petPrincipal.nome}`} />
          </div>
        )}

        <h1 className="doc-title">{nomes || "Solicitação de adoção"}</h1>
        {petPrincipal && (
          <p className="doc-specs">
            {ESPECIE_DOC[petPrincipal.especie] ?? petPrincipal.especie} ·{" "}
            {SEXO_DOC[petPrincipal.sexo] ?? petPrincipal.sexo} ·{" "}
            {PORTE_DOC[petPrincipal.porte] ?? petPrincipal.porte} ·{" "}
            {idadeDoc(petPrincipal.idade_meses)}
          </p>
        )}

        <div className="doc-protocol">
          <span>Protocolo</span>
          <strong>{dados.protocolo}</strong>
          <span>Recebida em {emitido}</span>
        </div>

        <section className="doc-section">
          <h2>Quem se candidatou</h2>
          <dl className="doc-list">
            {ficha.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="doc-section">
          <h2>Rotina da casa</h2>
          <dl className="doc-list">
            {rotina.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        {dados.mensagem && (
          <section className="doc-section">
            <h2>Mensagem de quem se candidatou</h2>
            <p className="doc-text">{dados.mensagem}</p>
          </section>
        )}

        {dados.pets.length > 1 && (
          <section className="doc-section">
            <h2>Pets desta solicitação</h2>
            <ul className="doc-pets">
              {dados.pets.map((pet) => (
                <li key={pet.nome}>
                  {pet.foto && <img src={pet.foto} alt={`Foto de ${pet.nome}`} />}
                  <div>
                    <strong>{pet.nome}</strong>
                    <span>
                      {ESPECIE_DOC[pet.especie] ?? pet.especie} ·{" "}
                      {PORTE_DOC[pet.porte] ?? pet.porte} · {idadeDoc(pet.idade_meses)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="doc-section">
          <h2>ONG responsável</h2>
          <dl className="doc-list">
            <div>
              <dt>Nome</dt>
              <dd>{dados.ong.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{dados.ong.email}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{dados.ong.whatsapp || "não informado"}</dd>
            </div>
            <div>
              <dt>Cidade</dt>
              <dd>{localOng || "não informada"}</dd>
            </div>
          </dl>
        </section>

        <footer className="doc-foot">
          <span>adotapet · {dados.protocolo}</span>
          <span>Adote, não compre</span>
        </footer>
      </article>
    </main>
  );
}
