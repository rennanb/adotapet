import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Outlet, Link, NavLink, useLocation, useRouteError } from "react-router";
import {
  Code2,
  HeartHandshake,
  Home,
  Info,
  LayoutDashboard,
  PawPrint,
  QrCode,
  ScanLine,
  Settings,
  UserRound,
  WifiOff,
  X,
  ClipboardList,
} from "lucide-react";
import { Brand, Button, TagCard } from "./ui";

const AboutContext = createContext({ open: () => {} });
export const useAbout = () => useContext(AboutContext);

function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        tabIndex={-1}
        ref={ref}
      >
        <span className="sheet-handle" />
        <button className="icon-button sheet-close" onClick={onClose} aria-label="Fechar">
          <X />
        </button>
        <span className="project-seal">Projeto interdisciplinar · FAM · CONTEEX 2026</span>
        <h2 id="about-title">Sobre o projeto</h2>
        <p>
          O AdotaPet aproxima ONGs e famílias usando uma coisa simples: uma plaquinha com QR Code e
          uma história bem contada.
        </p>
        <p>
          Cada solicitação chega organizada e com protocolo, para que a equipe dedique menos tempo
          às mensagens e mais tempo aos animais.
        </p>
        <div className="about-steps">
          {[
            [ScanLine, "Escaneie o QR"],
            [PawPrint, "Conheça o pet"],
            [HeartHandshake, "Envie a solicitação"],
          ].map(([Icon, text], i) => {
            const I = Icon as typeof PawPrint;
            return (
              <div key={String(text)}>
                <span>
                  <I size={20} />
                </span>
                <b>
                  {i + 1}. {String(text)}
                </b>
              </div>
            );
          })}
        </div>
        <div className="about-qr">
          <QrCode size={62} />
          <span>
            adotapet
            <br />
            <b>uma história mora aqui</b>
          </span>
        </div>
        <div className="made-by">
          <b>Turma do 2º semestre de Engenharia de Software, FAM</b>
          <span className="made-by-names">Emerson, Luiz, Rennan, Raul, Gennik e Nicolas</span>
        </div>
        <div className="about-links">
          <a
            href="https://github.com/rennanb/adotapet"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Code2 size={16} /> Código no GitHub
          </a>
          <span className="about-links-legal">
            <Link to="/privacidade" onClick={onClose}>
              Política de privacidade
            </Link>
            <Link to="/termos" onClick={onClose}>
              Termos de uso
            </Link>
          </span>
        </div>
        <Button onClick={onClose}>Entendi</Button>
      </div>
    </div>
  );
}

export function RootShell() {
  const [about, setAbout] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const location = useLocation();
  const closeAbout = useCallback(() => setAbout(false), []);
  const openAbout = useCallback(() => setAbout(true), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);
  return (
    <AboutContext.Provider value={{ open: openAbout }}>
      {!online && (
        <div className="offline-banner" role="status" aria-live="polite">
          <WifiOff />
          Sem conexão. Você pode continuar preenchendo, mas algumas ações precisarão ser reenviadas
          quando a internet voltar.
        </div>
      )}
      <Outlet />
      <AboutSheet open={about} onClose={closeAbout} />
    </AboutContext.Provider>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  console.error(error);
  return (
    <main className="simple-page">
      <PublicTopbar />
      <div className="narrow error-page">
        <span className="mail-icon">
          <PawPrint />
        </span>
        <span className="eyebrow">Algo saiu do caminho</span>
        <h1>Não conseguimos abrir esta página</h1>
        <p>Tente recarregar. Se o problema continuar, volte para o início do AdotaPet.</p>
        <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        <Link className="text-link" to="/entrar">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}

export function PublicTopbar({ overlay = false }: { overlay?: boolean }) {
  const { open } = useAbout();
  return (
    <header className={`public-topbar ${overlay ? "overlay" : ""}`}>
      <div className="topbar-left">
        <Brand />
        <nav className="topbar-actions" aria-label="Explorar">
          <NavLink to="/pets" className="topbar-link">
            Pets
          </NavLink>
          <NavLink to="/ongs" className="topbar-link">
            ONGs
          </NavLink>
        </nav>
      </div>
      <div className="topbar-right">
        <NavLink to="/entrar" className="topbar-login">
          Entrar
        </NavLink>
        <button className="icon-button" aria-label="Sobre o projeto" onClick={open}>
          <Info />
        </button>
      </div>
    </header>
  );
}

const nav = [
  ["/painel", Home, "Início"],
  ["/painel/animais", PawPrint, "Pets"],
  ["/painel/solicitacoes", ClipboardList, "Solicitações"],
  ["/painel/ong", UserRound, "ONG"],
];

export function DashboardShell() {
  const { open } = useAbout();
  const [maisAberto, setMaisAberto] = useState(false);
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {nav.map(([to, Icon, label]) => {
            const I = Icon as typeof Home;
            return (
              <NavLink key={String(to)} to={String(to)} end={to === "/painel"}>
                <I />
                {String(label)}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <NavLink to="/painel/config">
            <Settings />
            Configurações
          </NavLink>
          <button onClick={open}>
            <Info />
            Sobre
          </button>
          <div className="user-mini">
            <span>AP</span>
            <p>
              <b>Amigos de Patas</b>
              <small>Equipe da ONG</small>
            </p>
          </div>
        </div>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {nav.map(([to, Icon, label]) => {
          const I = Icon as typeof Home;
          return (
            <NavLink key={String(to)} to={String(to)} end={to === "/painel"}>
              <I />
              <span>{String(label)}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className="bottom-nav-more"
          aria-expanded={maisAberto}
          aria-controls="mais-painel"
          onClick={() => setMaisAberto(true)}
        >
          <Settings />
          <span>Mais</span>
        </button>
      </nav>
      {maisAberto && (
        <div
          className="sheet-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setMaisAberto(false)}
        >
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="mais-painel">
            <span className="sheet-handle" />
            <button
              className="icon-button sheet-close"
              onClick={() => setMaisAberto(false)}
              aria-label="Fechar"
            >
              <X />
            </button>
            <h2 id="mais-painel">Mais</h2>
            <div className="mobile-more-list">
              <NavLink to="/painel/config" onClick={() => setMaisAberto(false)} className="more-item">
                <Settings />
                <span>
                  <b>Configurações</b>
                  <small>Dados da ONG, perfil público e conta</small>
                </span>
              </NavLink>
              <button
                type="button"
                className="more-item"
                onClick={() => {
                  setMaisAberto(false);
                  open();
                }}
              >
                <Info />
                <span>
                  <b>Sobre o projeto</b>
                  <small>Como o AdotaPet funciona e quem fez</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  action,
  eyebrow,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={`page-header ${className}`}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function AboutTag() {
  const { open } = useAbout();
  return (
    <button className="about-trigger" onClick={open}>
      <TagCard>
        <span>
          <Info size={19} />
          <b>Sobre o projeto</b>
        </span>
        <small>Conheça a ideia por trás do AdotaPet</small>
      </TagCard>
    </button>
  );
}

export function PublicFooter() {
  const { open } = useAbout();
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <Brand />
          <p>
            Projeto interdisciplinar do 2º semestre de Engenharia de Software da FAM, apresentado no
            CONTEEX 2026. A ONG cadastra os animais, divulga com QR Code, link ou post pronto e
            recebe as solicitações de adoção com protocolo.
          </p>
        </div>
        <nav className="public-footer-nav" aria-label="Links do projeto">
          <div className="public-footer-col">
            <span className="public-footer-label">Explorar</span>
            <Link to="/pets">Pets para adoção</Link>
            <Link to="/ongs">ONGs</Link>
          </div>
          <div className="public-footer-col">
            <span className="public-footer-label">Para ONGs</span>
            <Link to="/entrar">Entrar</Link>
            <Link to="/cadastro">Criar conta</Link>
          </div>
          <div className="public-footer-col">
            <span className="public-footer-label">Projeto</span>
            <button type="button" onClick={open}>
              Sobre o projeto
            </button>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos de uso</Link>
            <a href="https://github.com/rennanb/adotapet" target="_blank" rel="noopener noreferrer">
              Código no GitHub
            </a>
          </div>
        </nav>
      </div>
      <p className="public-footer-note">
        AdotaPet é o nome fantasia do Sistema Web de Adoção Responsável. Os dados de quem se
        candidata são usados apenas pela ONG responsável pelo animal.
      </p>
    </footer>
  );
}
