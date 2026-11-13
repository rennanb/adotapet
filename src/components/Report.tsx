import { useEffect, useState } from "react";
import { Check, Flag, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const EMAIL_DENUNCIA = "adotapet.projeto@gmail.com";

type TipoDenuncia = "pet" | "ong";

const MOTIVOS = [
  "Informação incorreta na ficha",
  "O animal já foi adotado",
  "Suspeita de maus-tratos",
  "Pedido de dinheiro pela adoção",
  "Perfil falso ou duplicado",
  "Outro motivo",
];

/** Link de e-mail usado como alternativa quando o registro falha. */
export function linkDenuncia({ tipo, nome, url }: { tipo: TipoDenuncia; nome: string; url: string }) {
  const alvo = tipo === "pet" ? "a ficha do animal" : "o perfil da ONG";
  const assunto = `Denúncia: ${tipo === "pet" ? "ficha de animal" : "perfil de ONG"} - ${nome}`;
  const corpo = [
    "Olá, equipe AdotaPet.",
    "",
    `Quero registrar uma denúncia sobre ${alvo} "${nome}".`,
    "",
    "O que aconteceu:",
    "",
    "",
    `Link da página: ${url}`,
    "",
    "Meu nome:",
    "Meu contato (e-mail ou telefone):",
  ].join("\n");
  return `mailto:${EMAIL_DENUNCIA}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

export function ReportButton({
  tipo,
  nome,
  slug,
  ongSlug,
  className,
}: {
  tipo: TipoDenuncia;
  nome: string;
  slug?: string;
  ongSlug?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [descricao, setDescricao] = useState("");
  const [nomePessoa, setNomePessoa] = useState("");
  const [contato, setContato] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [falhou, setFalhou] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!aberto) return;
    const fechar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [aberto]);

  const limpar = () => {
    setDescricao("");
    setNomePessoa("");
    setContato("");
    setMotivo(MOTIVOS[0]);
    setProtocolo("");
    setFalhou(false);
    setAviso("");
  };

  const fecharModal = () => {
    setAberto(false);
    window.setTimeout(limpar, 200);
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const texto = descricao.trim();
    if (texto.length < 20) {
      setAviso("Conte um pouco mais, com pelo menos 20 caracteres, para a equipe entender o caso.");
      return;
    }
    setAviso("");
    setEnviando(true);
    const id = crypto.randomUUID();
    const { error } = await supabase.from("denuncias").insert({
      id,
      tipo,
      animal_slug: tipo === "pet" ? slug ?? null : null,
      ong_slug: tipo === "pet" ? ongSlug ?? null : slug ?? null,
      nome_exibido: nome,
      motivo,
      descricao: texto,
      nome_denunciante: nomePessoa.trim() || null,
      contato: contato.trim() || null,
      pagina: typeof window === "undefined" ? null : window.location.href,
    });
    setEnviando(false);
    if (error) {
      setFalhou(true);
      return;
    }
    setProtocolo(id.slice(0, 8).toUpperCase());
  };

  return (
    <>
      <button
        type="button"
        className={className ? `report-trigger ${className}` : "report-trigger"}
        onClick={() => setAberto(true)}
      >
        <Flag size={13} />
        {tipo === "pet" ? "Denunciar esta ficha" : "Denunciar esta ONG"}
      </button>

      {aberto && (
        <div className="report-overlay" role="presentation" onClick={fecharModal}>
          <div
            className="report-card"
            role="dialog"
            aria-modal="true"
            aria-label="Registrar denúncia"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              type="button"
              className="report-close"
              aria-label="Fechar"
              onClick={fecharModal}
            >
              <X size={18} />
            </button>

            {protocolo ? (
              <div className="report-done">
                <span className="report-done-icon">
                  <Check size={20} />
                </span>
                <h3>Denúncia registrada</h3>
                <p>
                  Obrigado por avisar. A equipe vai analisar o caso
                  {contato.trim() ? " e pode entrar em contato pelo dado informado" : ""}. Guarde o
                  protocolo para referência.
                </p>
                <div className="report-protocol">{protocolo}</div>
                <button type="button" className="button button-primary" onClick={fecharModal}>
                  Fechar
                </button>
              </div>
            ) : falhou ? (
              <div className="report-done">
                <h3>Não foi possível registrar agora</h3>
                <p>
                  O registro automático falhou, mas a denúncia pode ser enviada por e-mail. Copie o
                  link da página e escreva para a equipe.
                </p>
                <a
                  className="button button-primary"
                  href={linkDenuncia({
                    tipo,
                    nome,
                    url: typeof window === "undefined" ? "" : window.location.href,
                  })}
                >
                  Enviar por e-mail
                </a>
                <button type="button" className="report-cancel" onClick={fecharModal}>
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={enviar}>
                <h3>{tipo === "pet" ? "Denunciar esta ficha" : "Denunciar esta ONG"}</h3>
                <p className="report-sub">
                  Você está denunciando <b>{nome}</b>. A equipe do projeto lê todos os registros e a
                  ONG não é avisada de quem denunciou.
                </p>

                <label className="report-field">
                  <span>Qual o problema?</span>
                  <select value={motivo} onChange={(evento) => setMotivo(evento.target.value)}>
                    {MOTIVOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="report-field">
                  <span>Conte o que aconteceu</span>
                  <textarea
                    rows={4}
                    value={descricao}
                    onChange={(evento) => setDescricao(evento.target.value)}
                    placeholder="Descreva o que você viu, quando e onde. Quanto mais detalhe, mais fácil verificar."
                  />
                </label>

                <div className="report-two">
                  <label className="report-field">
                    <span>Seu nome (opcional)</span>
                    <input
                      value={nomePessoa}
                      onChange={(evento) => setNomePessoa(evento.target.value)}
                      placeholder="Como podemos te chamar"
                    />
                  </label>
                  <label className="report-field">
                    <span>Contato (opcional)</span>
                    <input
                      value={contato}
                      onChange={(evento) => setContato(evento.target.value)}
                      placeholder="E-mail ou telefone"
                    />
                  </label>
                </div>

                {aviso && <p className="report-alert">{aviso}</p>}

                <div className="report-actions">
                  <button type="button" className="report-cancel" onClick={fecharModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="button button-primary" disabled={enviando}>
                    {enviando ? "Enviando..." : "Registrar denúncia"}
                  </button>
                </div>
                <p className="report-note">
                  Denúncia falsa também é registrada e pode gerar consequências para quem enviou.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
