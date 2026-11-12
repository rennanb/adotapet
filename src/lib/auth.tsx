import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type ValorAuth = {
  sessao: Session | null;
  carregando: boolean;
  sair: () => Promise<void>;
};

const AuthContext = createContext<ValorAuth>({
  sessao: null,
  carregando: true,
  sair: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo<ValorAuth>(
    () => ({
      sessao,
      carregando,
      sair: async () => {
        await supabase.auth.signOut();
      },
    }),
    [sessao, carregando],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/**
 * Layout de rota que exige sessão.
 * Enquanto o Supabase responde, mostra carregando em vez de mandar
 * a pessoa para o login sem necessidade.
 */
export function Protegido() {
  const { sessao, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return <Carregando />;
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;

  return <Outlet />;
}

function Carregando() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        color: "var(--muted, #6b7280)",
      }}
    >
      Carregando...
    </div>
  );
}

/**
 * Traduz as mensagens que o Supabase devolve para algo que a pessoa entende.
 * O texto original continua no console, para depurar.
 */
export function traduzErro(mensagem: string): string {
  const m = mensagem.toLowerCase();

  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitos pedidos em pouco tempo. Espere alguns minutos e tente de novo.";
  }
  if (m.includes("expired") || m.includes("invalid") || m.includes("token")) {
    return "Código inválido ou expirado. Peça um novo.";
  }
  if (m.includes("not authorized")) {
    return "Este e-mail não está autorizado a receber mensagens. Avise o responsável pelo projeto.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Confira o e-mail digitado.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Não conseguimos falar com o servidor. Verifique sua conexão.";
  }
  return mensagem;
}
