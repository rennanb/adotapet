import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getPublicBaseUrl } from "../mocks";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import type { Pet, PetFocalPoint, PetStatus } from "../mocks";

export type Ong = {
  id: string;
  slug: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  cidade: string | null;
  uf: string | null;
  sobre: string | null;
  site_instagram: string | null;
  endereco: string | null;
  logo_url: string | null;
  capa_url: string | null;
  status: "pendente" | "ativa" | "suspensa";
};

type ValorOng = {
  ong: Ong | null;
  carregando: boolean;
  recarregar: () => Promise<void>;
  salvar: (campos: Partial<Ong>) => Promise<string | null>;
};

const ContextoOng = createContext<ValorOng>({
  ong: null,
  carregando: true,
  recarregar: async () => {},
  salvar: async () => null,
});

const COLUNAS =
  "id, slug, nome, email, whatsapp, cidade, uf, sobre, site_instagram, endereco, logo_url, capa_url, status";

export function OngProvider({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();
  const [ong, setOng] = useState<Ong | null>(null);
  const [carregando, setCarregando] = useState(true);
  const idUsuario = sessao?.user?.id;

  const recarregar = useCallback(async () => {
    if (!idUsuario) {
      setOng(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const { data, error } = await supabase
      .from("ongs")
      .select(COLUNAS)
      .eq("user_id", idUsuario)
      .maybeSingle();

    if (error) console.error("Erro ao carregar a ONG:", error);
    setOng((data as Ong) ?? null);
    setCarregando(false);
  }, [idUsuario]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const salvar = useCallback(
    async (campos: Partial<Ong>) => {
      if (!ong) return "Não encontramos a ONG da sua sessão.";
      const { error } = await supabase.from("ongs").update(campos).eq("id", ong.id);
      if (error) {
        console.error("Erro ao salvar a ONG:", error);
        return error.message;
      }
      setOng((atual) => (atual ? { ...atual, ...campos } : atual));
      return null;
    },
    [ong],
  );

  const valor = useMemo<ValorOng>(
    () => ({ ong, carregando, recarregar, salvar }),
    [ong, carregando, recarregar, salvar],
  );

  return <ContextoOng.Provider value={valor}>{children}</ContextoOng.Provider>;
}

export const useOng = () => useContext(ContextoOng);

/* ------------------------------------------------------------------ */
/* Pets                                                                */
/* ------------------------------------------------------------------ */

type LinhaAnimal = {
  id: string;
  slug: string | null;
  nome: string;
  especie: "cao" | "gato";
  sexo: "macho" | "femea";
  porte: "pequeno" | "medio" | "grande";
  idade_meses: number | null;
  status: "disponivel" | "em_processo" | "adotado" | "indisponivel" | "rascunho";
  foto_url: string | null;
  foto_enquadramento: "rosto" | "topo" | "centro";
  temperamento: string[] | null;
  descricao: string | null;
  cidade: string | null;
  uf: string | null;
};

const COLUNAS_ANIMAL =
  "id, slug, nome, especie, sexo, porte, idade_meses, status, foto_url, foto_enquadramento, temperamento, descricao, cidade, uf";

const ROTULO_STATUS: Record<LinhaAnimal["status"], PetStatus> = {
  disponivel: "disponível",
  em_processo: "em processo",
  adotado: "adotado",
  indisponivel: "indisponível",
  rascunho: "rascunho",
};

const STATUS_DO_BANCO: Record<PetStatus, LinhaAnimal["status"]> = {
  disponível: "disponivel",
  "em processo": "em_processo",
  adotado: "adotado",
  indisponível: "indisponivel",
  rascunho: "rascunho",
};

const FOCAL: Record<LinhaAnimal["foto_enquadramento"], PetFocalPoint> = {
  rosto: "face",
  topo: "top",
  centro: "center",
};

const FOCAL_DO_BANCO: Record<PetFocalPoint, LinhaAnimal["foto_enquadramento"]> = {
  face: "rosto",
  top: "topo",
  center: "centro",
};

function idadeEmTexto(meses: number | null) {
  if (meses === null) return "idade não informada";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return resto ? `${textoAnos} e ${resto} ${resto === 1 ? "mês" : "meses"}` : textoAnos;
}

/** Converte a linha do banco no formato que os componentes de cartão usam. */
export function petParaCard(linha: LinhaAnimal): Pet {
  return {
    id: linha.id,
    slug: linha.slug ?? linha.id,
    name: linha.nome,
    species: linha.especie === "gato" ? "Gato" : "Cão",
    sex: linha.sexo === "femea" ? "Fêmea" : "Macho",
    age: idadeEmTexto(linha.idade_meses),
    size: linha.porte === "pequeno" ? "Pequeno" : linha.porte === "grande" ? "Grande" : "Médio",
    status: ROTULO_STATUS[linha.status],
    image:
      linha.foto_url ??
      "https://images.unsplash.com/photo-1580629607699-5d97e8cb43d6?auto=format&fit=crop&w=1400&q=85",
    focal: FOCAL[linha.foto_enquadramento],
    temperament: linha.temperamento ?? [],
    description: linha.descricao ?? undefined,
  };
}

export type PetDoBanco = {
  id: string;
  nome: string;
  slug: string | null;
};

export async function listarPets(ongId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("animais")
    .select(COLUNAS_ANIMAL)
    .eq("ong_id", ongId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao listar pets:", error);
    return [];
  }
  return (data as LinhaAnimal[]).map(petParaCard);
}

export async function atualizarStatusPet(
  petId: string,
  status: PetStatus,
): Promise<string | null> {
  const { error } = await supabase
    .from("animais")
    .update({ status: STATUS_DO_BANCO[status] })
    .eq("id", petId);
  if (error) {
    console.error("Erro ao mudar o status:", error);
    return error.message;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Fotos no Storage                                                    */
/* ------------------------------------------------------------------ */

const BUCKET = "fotos";
export const LIMITE_FOTOS = 5;

export async function enviarFoto(arquivo: File, ongId: string): Promise<string> {
  const extensao = (arquivo.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const caminho = `${ongId}/${crypto.randomUUID()}.${extensao || "jpg"}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
    cacheControl: "31536000",
    upsert: false,
    contentType: arquivo.type || "image/jpeg",
  });

  if (error) {
    console.error("Erro no upload:", error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* Criar pet                                                           */
/* ------------------------------------------------------------------ */

export type NovoPet = {
  ongId: string;
  nome: string;
  especie: "cao" | "gato";
  sexo: "macho" | "femea";
  porte: "pequeno" | "medio" | "grande";
  idadeMeses: number;
  raca?: string;
  castrado: boolean;
  vacinado: boolean;
  vermifugado: boolean;
  condicoesEspeciais?: string;
  temperamento: string[];
  descricao: string;
  cidade?: string;
  uf?: string;
  fotoUrl: string;
  fotos?: string[];
  enquadramento: PetFocalPoint;
  focoX: number;
  focoY: number;
  zoom: number;
  status: PetStatus;
};

export async function criarPet(dados: NovoPet): Promise<{ id: string; slug: string | null }> {
  const { data, error } = await supabase
    .from("animais")
    .insert({
      ong_id: dados.ongId,
      nome: dados.nome,
      especie: dados.especie,
      sexo: dados.sexo,
      porte: dados.porte,
      idade_meses: dados.idadeMeses,
      raca: dados.raca || null,
      castrado: dados.castrado,
      vacinado: dados.vacinado,
      vermifugado: dados.vermifugado,
      condicoes_especiais: dados.condicoesEspeciais || null,
      temperamento: dados.temperamento,
      descricao: dados.descricao,
      cidade: dados.cidade || null,
      uf: dados.uf || null,
      foto_url: dados.fotoUrl,
      foto_enquadramento: FOCAL_DO_BANCO[dados.enquadramento],
      foto_foco_x: Math.round(dados.focoX),
      foto_foco_y: Math.round(dados.focoY),
      foto_zoom: Math.min(3, Math.max(1, dados.zoom)),
      status: STATUS_DO_BANCO[dados.status],
    })
    .select("id, slug")
    .returns<{ id: string; slug: string | null }[]>();

  if (error) {
    console.error("Erro ao criar pet:", error);
    throw new Error(error.message);
  }

  const criado = Array.isArray(data) ? data[0] : data;
  if (!criado?.id) {
    throw new Error("O pet foi salvo, mas não conseguimos abrir a ficha. Confira a lista.");
  }

  const galeria = (dados.fotos ?? []).filter(Boolean).slice(0, LIMITE_FOTOS);
  if (galeria.length) {
    const { error: erroGaleria } = await supabase.from("animal_fotos").insert(
      galeria.map((url, ordem) => ({ animal_id: criado.id, url, ordem })),
    );
    if (erroGaleria) console.error("Erro ao salvar a galeria:", erroGaleria);
  }

  return criado;
}

/* ------------------------------------------------------------------ */
/* Ler e editar um pet                                                 */
/* ------------------------------------------------------------------ */

export type PetDetalhado = LinhaAnimal & {
  raca: string | null;
  castrado: boolean;
  vacinado: boolean;
  vermifugado: boolean;
  condicoes_especiais: string | null;
  foto_foco_x: number;
  foto_foco_y: number;
  foto_zoom: number;
};

const COLUNAS_DETALHE =
  "id, slug, nome, especie, sexo, porte, idade_meses, status, foto_url, foto_enquadramento, temperamento, descricao, cidade, uf, raca, castrado, vacinado, vermifugado, condicoes_especiais, foto_foco_x, foto_foco_y, foto_zoom";

export async function carregarPet(id: string): Promise<PetDetalhado | null> {
  const { data, error } = await supabase
    .from("animais")
    .select(COLUNAS_DETALHE)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar o pet:", error);
    return null;
  }
  return (data as PetDetalhado) ?? null;
}

function camposDoPet(dados: NovoPet) {
  return {
    nome: dados.nome,
    especie: dados.especie,
    sexo: dados.sexo,
    porte: dados.porte,
    idade_meses: dados.idadeMeses,
    raca: dados.raca || null,
    castrado: dados.castrado,
    vacinado: dados.vacinado,
    vermifugado: dados.vermifugado,
    condicoes_especiais: dados.condicoesEspeciais || null,
    temperamento: dados.temperamento,
    descricao: dados.descricao,
    cidade: dados.cidade || null,
    uf: dados.uf || null,
    foto_url: dados.fotoUrl,
    foto_enquadramento: FOCAL_DO_BANCO[dados.enquadramento],
    foto_foco_x: Math.round(dados.focoX),
    foto_foco_y: Math.round(dados.focoY),
    foto_zoom: Math.min(3, Math.max(1, dados.zoom)),
    status: STATUS_DO_BANCO[dados.status],
  };
}

export async function atualizarPet(id: string, dados: NovoPet): Promise<void> {
  const { error } = await supabase.from("animais").update(camposDoPet(dados)).eq("id", id);
  if (error) {
    console.error("Erro ao salvar o pet:", error);
    throw new Error(error.message);
  }

  const galeria = (dados.fotos ?? []).filter(Boolean).slice(0, LIMITE_FOTOS);
  if (!galeria.length) return;

  const { error: erroLimpeza } = await supabase.from("animal_fotos").delete().eq("animal_id", id);
  if (erroLimpeza) console.error("Erro ao limpar a galeria:", erroLimpeza);

  const { error: erroGaleria } = await supabase.from("animal_fotos").insert(
    galeria.map((url, ordem) => ({ animal_id: id, url, ordem })),
  );
  if (erroGaleria) console.error("Erro ao salvar a galeria:", erroGaleria);
}

export async function listarFotosPet(animalId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("animal_fotos")
    .select("url, ordem")
    .eq("animal_id", animalId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao carregar a galeria:", error);
    return [];
  }
  return (data as { url: string }[]).map((linha) => linha.url);
}

export const focalDoBanco = FOCAL;

/* ------------------------------------------------------------------ */
/* Solicitações de adoção                                              */
/* ------------------------------------------------------------------ */

export type StatusSolicitacao = "nova" | "em_analise" | "concluida" | "recusada" | "cancelada";

export const ROTULO_SOLICITACAO: Record<StatusSolicitacao, string> = {
  nova: "nova",
  em_analise: "em análise",
  concluida: "concluída",
  recusada: "recusada",
  cancelada: "cancelada",
};

export type PetDaSolicitacao = {
  id: string;
  nome: string;
  slug: string;
  foto: string | null;
};

export type SolicitacaoPublica = {
  protocolo: string;
  status: StatusSolicitacao;
  criado_em: string;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  idade: number | null;
  pessoas_na_casa: number | null;
  moradia: string | null;
  pet_sozinho: string | null;
  tem_telas: string | null;
  mensagem: string | null;
  ong: {
    nome: string;
    slug: string;
    email: string;
    whatsapp: string | null;
    cidade: string | null;
    uf: string | null;
  };
  pets: {
    nome: string;
    slug: string | null;
    foto: string | null;
    especie: string;
    sexo: string;
    porte: string;
    idade_meses: number | null;
  }[];
};

export async function carregarSolicitacaoPorToken(
  token: string,
): Promise<SolicitacaoPublica | null> {
  const { data, error } = await supabase.rpc("solicitacao_publica", { p_token: token });

  if (error) {
    console.error("Erro ao abrir a solicitação pelo link:", error);
    return null;
  }
  return (data as SolicitacaoPublica) ?? null;
}

export function linkDaSolicitacao(token: string): string {
  const base =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : getPublicBaseUrl();
  return `${base}/solicitacao/${token}`;
}

export type Solicitacao = {
  id: string;
  protocolo: string;
  token_publico: string;
  nome: string;
  email: string;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  idade: number | null;
  pessoas_na_casa: number | null;
  moradia: string | null;
  pet_sozinho: string | null;
  tem_telas: string | null;
  mensagem: string | null;
  status: StatusSolicitacao;
  criado_em: string;
  pets: PetDaSolicitacao[];
};

type AnimalEmbutido = { id: string; nome: string; slug: string | null; foto_url: string | null };

type LinhaSolicitacao = Omit<Solicitacao, "pets"> & {
  solicitacao_animais?: { animais: AnimalEmbutido | AnimalEmbutido[] | null }[];
};

const COLUNAS_SOLICITACAO =
  "id, protocolo, token_publico, nome, email, telefone, cidade, uf, idade, pessoas_na_casa, moradia, pet_sozinho, tem_telas, mensagem, status, criado_em, solicitacao_animais(animais(id, nome, slug, foto_url))";

function montarSolicitacao(linha: LinhaSolicitacao): Solicitacao {
  const { solicitacao_animais = [], ...resto } = linha;
  return {
    ...resto,
    pets: solicitacao_animais
      .flatMap((item) => (Array.isArray(item.animais) ? item.animais : item.animais ? [item.animais] : []))
      .map((animal) => ({
        id: animal.id,
        nome: animal.nome,
        slug: animal.slug ?? animal.id,
        foto: animal.foto_url,
      })),
  };
}

export async function listarSolicitacoes(ongId: string): Promise<Solicitacao[]> {
  const { data, error } = await supabase
    .from("solicitacoes")
    .select(COLUNAS_SOLICITACAO)
    .eq("ong_id", ongId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao listar solicitações:", error);
    return [];
  }
  return (data as unknown as LinhaSolicitacao[]).map(montarSolicitacao);
}

export async function carregarSolicitacao(id: string): Promise<Solicitacao | null> {
  const { data, error } = await supabase
    .from("solicitacoes")
    .select(COLUNAS_SOLICITACAO)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar a solicitação:", error);
    return null;
  }
  return data ? montarSolicitacao(data as unknown as LinhaSolicitacao) : null;
}

export async function mudarStatusSolicitacao(
  id: string,
  status: StatusSolicitacao,
): Promise<string | null> {
  const { error } = await supabase
    .from("solicitacoes")
    .update({ status, respondido_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Erro ao mudar o status da solicitação:", error);
    return error.message;
  }
  return null;
}

const MORADIA: Record<string, string> = {
  casa: "casa",
  apartamento: "apartamento",
  chacara: "chacara",
  "chácara": "chacara",
};

const SOZINHO: Record<string, string> = {
  "até 4h": "ate_4h",
  "ate 4h": "ate_4h",
  "4 a 8h": "4_a_8h",
  "mais de 8h": "mais_de_8h",
};

const TELAS: Record<string, string> = {
  "sim, em todas as janelas": "todas",
  "sim, em algumas": "algumas",
  "não": "nao",
  nao: "nao",
};

export type NovaSolicitacao = {
  animalSlug: string;
  extras: string[];
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  idade: number;
  pessoasNaCasa: number;
  moradia: string;
  petSozinho: string;
  temTelas: string | null;
  mensagem: string;
  consentimento: boolean;
};

const ERROS_SOLICITACAO: Record<string, string> = {
  CONSENTIMENTO_OBRIGATORIO: "É preciso aceitar os termos para enviar.",
  ANIMAL_INDISPONIVEL: "Este pet não está mais disponível para adoção.",
  TELAS_OBRIGATORIO: "Para gatos, informe se a casa tem telas de proteção.",
  ANIMAL_EXTRA_INVALIDO: "Um dos pets extras não está disponível ou é de outra ONG.",
};

export async function criarSolicitacao(dados: NovaSolicitacao): Promise<string> {
  const { data, error } = await supabase.rpc("criar_solicitacao", {
    p_animal_slug: dados.animalSlug,
    p_extras: dados.extras,
    p_nome: dados.nome,
    p_email: dados.email.trim().toLowerCase(),
    p_telefone: dados.telefone || null,
    p_cidade: dados.cidade || null,
    p_uf: dados.uf || null,
    p_idade: dados.idade,
    p_pessoas_casa: dados.pessoasNaCasa,
    p_moradia: MORADIA[dados.moradia.toLowerCase()] ?? null,
    p_pet_sozinho: SOZINHO[dados.petSozinho.toLowerCase()] ?? null,
    p_tem_telas: dados.temTelas ? (TELAS[dados.temTelas.toLowerCase()] ?? null) : null,
    p_mensagem: dados.mensagem || null,
    p_consentimento: dados.consentimento,
  });

  if (error) {
    const chave = Object.keys(ERROS_SOLICITACAO).find((codigo) => error.message.includes(codigo));
    throw new Error(chave ? ERROS_SOLICITACAO[chave] : error.message);
  }

  const retorno = Array.isArray(data) ? data[0] : data;
  const protocolo = (retorno as { protocolo?: string } | null)?.protocolo;
  if (!protocolo) throw new Error("A solicitação foi enviada, mas não recebemos o protocolo.");
  return protocolo;
}

/* ------------------------------------------------------------------ */
/* Páginas públicas                                                    */
/* ------------------------------------------------------------------ */

export type PetPublico = Pet & {
  fotos: string[];
  descricao: string;
  cidade: string | null;
  uf: string | null;
  castrado: boolean;
  vacinado: boolean;
  vermifugado: boolean;
  condicoes: string | null;
  ongNome: string;
  ongSlug: string;
  ongWhatsapp: string | null;
  ongEmail: string;
};

export type OngPublica = {
  nome: string;
  slug: string;
  cidade: string;
  uf: string | null;
  sobre: string;
  whatsapp: string | null;
  email: string;
  logo: string | null;
  capa: string | null;
};

const COLUNAS_ONG_PUBLICA = "nome, slug, cidade, uf, sobre, whatsapp, email, logo_url, capa_url";

type LinhaOngPublica = {
  nome: string;
  slug: string;
  cidade: string | null;
  uf: string | null;
  sobre: string | null;
  whatsapp: string | null;
  email: string;
  logo_url: string | null;
  capa_url: string | null;
};

function montarOngPublica(linha: LinhaOngPublica): OngPublica {
  return {
    nome: linha.nome,
    slug: linha.slug,
    cidade: linha.cidade ?? "Brasil",
    uf: linha.uf,
    sobre: linha.sobre ?? "",
    whatsapp: linha.whatsapp,
    email: linha.email,
    logo: linha.logo_url,
    capa: linha.capa_url,
  };
}

export async function buscarOngPublica(
  slug: string,
): Promise<{ ong: OngPublica; pets: Pet[] } | null> {
  const { data, error } = await supabase
    .from("ongs")
    .select(`id, ${COLUNAS_ONG_PUBLICA}`)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Erro ao carregar a ONG pública:", error);
    return null;
  }

  const pets = await listarPets((data as { id: string }).id);
  return { ong: montarOngPublica(data as LinhaOngPublica), pets };
}

export async function buscarPetPublico(
  slug: string,
): Promise<{ pet: PetPublico; ong: OngPublica; irmaos: Pet[] } | null> {
  const { data, error } = await supabase
    .from("animais")
    .select(`*, animal_fotos(url, ordem), ongs!inner(${COLUNAS_ONG_PUBLICA})`)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Erro ao carregar o pet público:", error);
    return null;
  }

  const linha = data as LinhaAnimal & {
    animal_fotos?: { url: string; ordem: number }[];
    ongs: LinhaOngPublica;
    castrado: boolean;
    vacinado: boolean;
    vermifugado: boolean;
    condicoes_especiais: string | null;
    ong_id: string;
  };

  const irmaos = (await listarPets(linha.ong_id)).filter((p) => p.slug !== slug);

  const galeria = (linha.animal_fotos ?? [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((foto) => foto.url)
    .filter(Boolean);
  if (!galeria.length && linha.foto_url) galeria.push(linha.foto_url);

  return {
    pet: {
      ...petParaCard(linha),
      fotos: galeria,
      descricao: linha.descricao ?? "",
      cidade: linha.cidade,
      uf: linha.uf,
      castrado: linha.castrado,
      vacinado: linha.vacinado,
      vermifugado: linha.vermifugado,
      condicoes: linha.condicoes_especiais,
      ongNome: linha.ongs.nome,
      ongSlug: linha.ongs.slug,
      ongWhatsapp: linha.ongs.whatsapp,
      ongEmail: linha.ongs.email,
    },
    ong: montarOngPublica(linha.ongs),
    irmaos,
  };
}

/* ------------------------------------------------------------------ */
/* Explorar: todas as ONGs e todos os pets                             */
/* ------------------------------------------------------------------ */

export type OngResumo = {
  nome: string;
  slug: string;
  cidade: string | null;
  uf: string | null;
  sobre: string | null;
  logo: string | null;
  capa: string | null;
  pets: number;
};

/** ONGs ativas na plataforma, com a contagem de pets disponíveis. */
export async function listarOngsPublicas(): Promise<OngResumo[]> {
  const [respostaOngs, respostaPets] = await Promise.all([
    supabase.from("ongs").select(COLUNAS_ONG_PUBLICA).order("nome", { ascending: true }),
    supabase.from("vw_pets_publicos").select("ong_slug"),
  ]);

  if (respostaOngs.error) {
    console.error("Erro ao listar as ONGs:", respostaOngs.error);
    return [];
  }
  if (respostaPets.error) console.error("Erro ao contar os pets:", respostaPets.error);

  const contagem = new Map<string, number>();
  for (const linha of (respostaPets.data ?? []) as { ong_slug: string }[]) {
    contagem.set(linha.ong_slug, (contagem.get(linha.ong_slug) ?? 0) + 1);
  }

  return ((respostaOngs.data ?? []) as LinhaOngPublica[]).map((linha) => ({
    nome: linha.nome,
    slug: linha.slug,
    cidade: linha.cidade,
    uf: linha.uf,
    sobre: linha.sobre,
    logo: linha.logo_url,
    capa: linha.capa_url,
    pets: contagem.get(linha.slug) ?? 0,
  }));
}

export type PetListado = {
  pet: Pet;
  especie: "cao" | "gato";
  sexo: "macho" | "femea";
  porte: "pequeno" | "medio" | "grande";
  cidade: string | null;
  uf: string | null;
  ongNome: string;
  ongSlug: string;
};

type LinhaPetListado = LinhaAnimal & { ong_nome: string; ong_slug: string };

const COLUNAS_PET_LISTADO =
  "id, slug, nome, especie, sexo, porte, idade_meses, foto_url, foto_enquadramento, temperamento, descricao, cidade, uf, ong_nome, ong_slug";

/** Todos os pets disponíveis, de todas as ONGs ativas. */
export async function listarPetsPublicos(): Promise<PetListado[]> {
  const { data, error } = await supabase
    .from("vw_pets_publicos")
    .select(COLUNAS_PET_LISTADO)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar os pets públicos:", error);
    return [];
  }

  return ((data ?? []) as unknown as LinhaPetListado[]).map((linha) => ({
    pet: petParaCard({ ...linha, status: "disponivel" }),
    especie: linha.especie,
    sexo: linha.sexo,
    porte: linha.porte,
    cidade: linha.cidade,
    uf: linha.uf,
    ongNome: linha.ong_nome,
    ongSlug: linha.ong_slug,
  }));
}
