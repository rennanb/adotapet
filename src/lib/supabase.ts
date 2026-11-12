import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !chave) {
  // Sem as variáveis o site fica em branco, o que é péssimo para descobrir o
  // problema. Aqui escrevemos o aviso direto na página, antes de interromper.
  const alvo = document.getElementById("root");
  if (alvo) {
    alvo.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f6f7;font-family:Inter,system-ui,sans-serif;">
        <div style="max-width:540px;background:#fff;border:1px solid #e9eaec;border-radius:16px;padding:28px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#15181e;">Falta configurar o arquivo .env</h1>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563;">
            O site precisa de duas variáveis para falar com o Supabase. Crie um arquivo chamado
            <b>.env</b> na raiz do projeto, no mesmo lugar do package.json, com estas duas linhas:
          </p>
          <pre style="margin:0 0 14px;padding:14px;background:#f9fafb;border:1px solid #e9eaec;border-radius:10px;font-size:13px;overflow:auto;">VITE_SUPABASE_URL=https://seuprojeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...</pre>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
            Depois pare o servidor com Ctrl+C e rode <b>npm run dev</b> novamente.
            Se o arquivo já existe, confira se o nome não ficou <b>.env.txt</b>.
          </p>
        </div>
      </div>`;
  }
  throw new Error("Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env");
}

export const supabase = createClient(url, chave, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
