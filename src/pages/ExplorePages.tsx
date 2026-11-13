import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, MapPin, PawPrint, Search } from "lucide-react";
import { PublicFooter, PublicTopbar } from "../components/Shells";
import { PetCard } from "../components/PetParts";
import { EmptyState } from "../components/ui";
import { photos } from "../mocks";
import {
  listarOngsPublicas,
  listarPetsPublicos,
  type OngResumo,
  type PetListado,
} from "../lib/dados";

type Especie = "todos" | "cao" | "gato";
type Sexo = "todos" | "macho" | "femea";
type Porte = "todos" | "pequeno" | "medio" | "grande";

const ESPECIES: { valor: Especie; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "cao", rotulo: "Cães" },
  { valor: "gato", rotulo: "Gatos" },
];

const SEXOS: { valor: Sexo; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "femea", rotulo: "Fêmeas" },
  { valor: "macho", rotulo: "Machos" },
];

const PORTES: { valor: Porte; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "pequeno", rotulo: "Pequeno" },
  { valor: "medio", rotulo: "Médio" },
  { valor: "grande", rotulo: "Grande" },
];

function cidadeComUf(cidade: string | null, uf: string | null) {
  if (!cidade) return uf ?? "Brasil";
  return uf ? `${cidade}, ${uf}` : cidade;
}

function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "AP";
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return `${primeira}${ultima}`.toUpperCase();
}

function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function Chip({
  ativo,
  children,
  onClick,
}: {
  ativo: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="chip" aria-pressed={ativo} onClick={onClick}>
      {children}
    </button>
  );
}

function ExploreSteps({
  eyebrow,
  titulo,
  passos,
}: {
  eyebrow: string;
  titulo: string;
  passos: { titulo: string; texto: string }[];
}) {
  return (
    <section className="explore-steps" aria-label={titulo}>
      <div className="explore-steps-head">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{titulo}</h2>
      </div>
      <ol>
        {passos.map((passo, indice) => (
          <li key={passo.titulo}>
            <span className="explore-steps-num">{indice + 1}</span>
            <b>{passo.titulo}</b>
            <p>{passo.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pôster de abertura                                                  */
/* ------------------------------------------------------------------ */

function ExplorePoster({
  imagem,
  alt,
  eyebrow,
  titulo,
  texto,
  selo,
  posicao = "center 32%",
}: {
  imagem: string;
  alt: string;
  eyebrow: string;
  titulo: string;
  texto: string;
  selo: string;
  posicao?: string;
}) {
  return (
    <section className="explore-poster">
      <div className="explore-poster-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{titulo}</h1>
        <p>{texto}</p>
        <span className="explore-poster-seal">
          <PawPrint size={15} />
          {selo}
        </span>
      </div>
      <div className="explore-poster-photo">
        <img src={imagem} alt={alt} style={{ objectPosition: posicao }} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Todos os pets                                                       */
/* ------------------------------------------------------------------ */

export function PetsPublicPage() {
  const [carregando, setCarregando] = useState(true);
  const [pets, setPets] = useState<PetListado[]>([]);
  const [busca, setBusca] = useState("");
  const [especie, setEspecie] = useState<Especie>("todos");
  const [sexo, setSexo] = useState<Sexo>("todos");
  const [porte, setPorte] = useState<Porte>("todos");

  useEffect(() => {
    document.title = "Pets para adoção | AdotaPet";
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listarPetsPublicos()
      .then((lista) => {
        if (!ativo) return;
        setPets(lista);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setPets([]);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    return pets.filter((item) => {
      if (especie !== "todos" && item.especie !== especie) return false;
      if (sexo !== "todos" && item.sexo !== sexo) return false;
      if (porte !== "todos" && item.porte !== porte) return false;
      if (!termo) return true;
      const alvo = semAcento(
        [item.pet.name, item.cidade ?? "", item.uf ?? "", item.ongNome].join(" "),
      );
      return alvo.includes(termo);
    });
  }, [pets, busca, especie, sexo, porte]);

  const limpando = busca !== "" || especie !== "todos" || sexo !== "todos" || porte !== "todos";

  return (
    <main className="public-page">
      <PublicTopbar />
      <div className="content-1100">
        <ExplorePoster
          imagem={photos.nina}
          alt="Cão resgatado sorrindo, em luz natural"
          eyebrow="Adoção responsável"
          titulo="Todos os pets para adoção"
          texto="O AdotaPet reúne animais resgatados por ONGs de proteção. Adotar é assumir cuidado, tempo e companhia pelos próximos anos, e devolve a cada um deles a chance de ter um lar."
          selo={
            carregando
              ? "Carregando os pets"
              : `${filtrados.length} ${filtrados.length === 1 ? "pet esperando por uma família" : "pets esperando por uma família"}`
          }
          posicao="center 26%"
        />

        <div className="filter-bar">
          <div className="search-field">
            <Search size={18} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cidade ou ONG"
              aria-label="Buscar pets por nome, cidade ou ONG"
            />
          </div>
          <div className="filter-groups">
          <div className="chip-row" role="group" aria-label="Espécie">
            {ESPECIES.map((opcao) => (
              <Chip
                key={opcao.valor}
                ativo={especie === opcao.valor}
                onClick={() => setEspecie(opcao.valor)}
              >
                {opcao.rotulo}
              </Chip>
            ))}
          </div>
          <div className="chip-row" role="group" aria-label="Sexo">
            {SEXOS.map((opcao) => (
              <Chip key={opcao.valor} ativo={sexo === opcao.valor} onClick={() => setSexo(opcao.valor)}>
                {opcao.rotulo}
              </Chip>
            ))}
          </div>
          <div className="chip-row" role="group" aria-label="Porte">
            {PORTES.map((opcao) => (
              <Chip
                key={opcao.valor}
                ativo={porte === opcao.valor}
                onClick={() => setPorte(opcao.valor)}
              >
                {opcao.rotulo}
              </Chip>
            ))}
          </div>
          </div>
        </div>

        <div className="explore-meta">
          <span>
            {carregando
              ? "Carregando os pets..."
              : `${filtrados.length} ${filtrados.length === 1 ? "pet encontrado" : "pets encontrados"}`}
          </span>
          {limpando && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setBusca("");
                setEspecie("todos");
                setSexo("todos");
                setPorte("todos");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {carregando ? null : filtrados.length ? (
          <div className="pet-grid" style={{ marginTop: 18 }}>
            {filtrados.map((item) => (
              <PetCard
                key={item.pet.id}
                pet={item.pet}
                nota={`${item.ongNome} · ${cidadeComUf(item.cidade, item.uf)}`}
              />
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <EmptyState
              title="Nenhum pet com esses filtros"
              text="Tente outra busca ou limpe os filtros para ver todos os animais disponíveis."
              action="Ver todos os pets"
              to="/pets"
            />
          </div>
        )}

        <ExploreSteps
          eyebrow="Do interesse à adoção"
          titulo="Como funciona para quem quer adotar"
          passos={[
            {
              titulo: "Escolha o pet",
              texto: "Abra a ficha e veja fotos, saúde, temperamento e a ONG responsável.",
            },
            {
              titulo: "Envie a solicitação",
              texto: "Um formulário curto, que chega direto para a ONG, com protocolo para acompanhar.",
            },
            {
              titulo: "A ONG entra em contato",
              texto: "Ela avalia o pedido, combina a visita e segue com você na adoção responsável.",
            },
          ]}
        />

        <div className="explore-cta">
          <div>
            <h3>Sua ONG ainda não está no AdotaPet?</h3>
            <p>Crie a conta, cadastre os animais e divulgue cada um com um QR Code.</p>
          </div>
          <div className="explore-cta-actions">
            <Link className="button button-primary" to="/cadastro">
              Cadastrar minha ONG
              <ArrowRight size={18} />
            </Link>
            <Link className="explore-cta-login" to="/entrar">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Todas as ONGs                                                       */
/* ------------------------------------------------------------------ */

export function OngsPublicPage() {
  const [carregando, setCarregando] = useState(true);
  const [ongs, setOngs] = useState<OngResumo[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    document.title = "ONGs na plataforma | AdotaPet";
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listarOngsPublicas()
      .then((lista) => {
        if (!ativo) return;
        setOngs(lista);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        setOngs([]);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    if (!termo) return ongs;
    return ongs.filter((ong) =>
      semAcento([ong.nome, ong.cidade ?? "", ong.uf ?? "", ong.sobre ?? ""].join(" ")).includes(
        termo,
      ),
    );
  }, [ongs, busca]);

  const totalPets = ongs.reduce((soma, ong) => soma + ong.pets, 0);

  return (
    <main className="public-page">
      <PublicTopbar />
      <div className="content-1100">
        <ExplorePoster
          imagem={photos.mel}
          alt="Cão resgatado sob a luz do fim de tarde"
          eyebrow="Quem está no AdotaPet"
          titulo="ONGs na plataforma"
          texto="São grupos de proteção animal que resgatam, tratam e procuram família para quem foi abandonado. Conhecer esse trabalho é o primeiro passo para ajudar, seja adotando, divulgando ou doando."
          selo={
            carregando
              ? "Carregando as ONGs"
              : `${ongs.length} ${ongs.length === 1 ? "ONG cadastrada" : "ONGs cadastradas"} e ${totalPets} ${totalPets === 1 ? "pet disponível" : "pets disponíveis"}`
          }
          posicao="center 30%"
        />

        <div className="filter-bar">
          <div className="search-field">
            <Search size={18} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome da ONG ou cidade"
              aria-label="Buscar ONGs por nome ou cidade"
            />
          </div>
        </div>

        {carregando ? null : filtradas.length ? (
          <div className="ong-grid">
            {filtradas.map((ong) => (
              <Link key={ong.slug} to={`/ong/${ong.slug}`} className="ong-card">
                <div className="ong-card-top">
                  <span className="ong-card-logo">
                    {ong.logo ? (
                      <img src={ong.logo} alt={`Logo da ${ong.nome}`} />
                    ) : (
                      iniciaisDoNome(ong.nome)
                    )}
                  </span>
                  <div>
                    <h3>{ong.nome}</h3>
                    <p className="ong-card-local">
                      <MapPin size={14} />
                      {cidadeComUf(ong.cidade, ong.uf)}
                    </p>
                  </div>
                </div>
                <p className="ong-card-sobre">
                  {ong.sobre?.trim() || "Esta ONG ainda não escreveu uma apresentação do trabalho."}
                </p>
                <div className="ong-card-foot">
                  <span>
                    <PawPrint size={15} /> {ong.pets} {ong.pets === 1 ? "pet" : "pets"}
                  </span>
                  <span className="ong-card-link">
                    Ver perfil <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : ongs.length ? (
          <div style={{ marginTop: 18 }}>
            <EmptyState
              title="Nenhuma ONG com essa busca"
              text="Tente outro nome ou cidade."
              action="Ver todas as ONGs"
              to="/ongs"
            />
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <EmptyState
              title="Ainda não há ONGs por aqui"
              text="Assim que a primeira ONG criar a conta, o perfil dela aparece nesta página."
              action="Cadastrar minha ONG"
              to="/cadastro"
            />
          </div>
        )}

        <ExploreSteps
          eyebrow="Para a sua ONG"
          titulo="Como o AdotaPet ajuda no dia a dia"
          passos={[
            {
              titulo: "Crie a conta",
              texto: "Entrada por código de seis dígitos no e-mail, sem senha para guardar.",
            },
            {
              titulo: "Cadastre os animais",
              texto: "Até cinco fotos, dados de saúde, temperamento e status de cada pet.",
            },
            {
              titulo: "Divulgue e receba",
              texto: "QR Code do pet e da ONG, com as solicitações organizadas por protocolo no painel.",
            },
          ]}
        />

        <div className="explore-cta">
          <div>
            <h3>Quer ver a sua ONG nesta lista?</h3>
            <p>
              O cadastro é gratuito. Você cadastra os animais, gera os QR Codes e recebe as
              solicitações com protocolo.
            </p>
          </div>
          <div className="explore-cta-actions">
            <Link className="button button-primary" to="/cadastro">
              Criar conta da ONG
              <ArrowRight size={18} />
            </Link>
            <Link className="explore-cta-login" to="/entrar">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
