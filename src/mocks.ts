export type PetStatus = "disponível" | "em processo" | "adotado" | "indisponível" | "rascunho";
export type PetFocalPoint = "top" | "center" | "face";

export type Pet = {
  id: string;
  slug: string;
  name: string;
  species: "Cão" | "Gato";
  sex: string;
  age: string;
  size: string;
  status: PetStatus;
  image: string;
  focal: PetFocalPoint;
  temperament: string[];
  description?: string;
  note?: string;
};

export const petObjectPosition = (pet: Pick<Pet, "focal">, context: "card" | "hero" = "card") => {
  if (pet.focal === "top") return "50% 20%";
  if (pet.focal === "center") return "50% 50%";
  return context === "hero" ? "50% 25%" : "50% 30%";
};

export const photos = {
  caramelo:
    "https://images.unsplash.com/photo-1580629607699-5d97e8cb43d6?auto=format&fit=crop&w=1400&q=85",
  mel: "https://images.unsplash.com/photo-1645254698439-09dd820ebff5?auto=format&fit=crop&w=1000&q=85",
  tigrao:
    "https://images.unsplash.com/photo-1551264783-4ad68886cf54?auto=format&fit=crop&w=1000&q=85",
  nina: "https://images.unsplash.com/photo-1478029973231-f42d99fe5c20?auto=format&fit=crop&w=1000&q=85",
  gato: "https://images.unsplash.com/photo-1625106828405-07e0e4457c1a?auto=format&fit=crop&w=1000&q=85",
};

export const pets: Pet[] = [
  {
    id: "1",
    slug: "caramelo-a1b2",
    name: "Caramelo",
    species: "Cão",
    sex: "Macho",
    age: "2 anos",
    size: "Médio",
    status: "disponível",
    image: photos.caramelo,
    focal: "face",
    temperament: ["Brincalhão", "Carinhoso", "Sociável com crianças"],
    description:
      "Caramelo é brincalhão, carinhoso e está pronto para encontrar uma família responsável.",
  },
  {
    id: "2",
    slug: "mel-c3d4",
    name: "Mel",
    species: "Cão",
    sex: "Fêmea",
    age: "8 meses",
    size: "Pequeno",
    status: "disponível",
    image: photos.mel,
    focal: "top",
    temperament: ["Tranquila", "Dócil"],
    description: "Mel é tranquila, dócil e adora ficar perto de pessoas.",
  },
  {
    id: "3",
    slug: "tigrao-e5f6",
    name: "Tigrão",
    species: "Cão",
    sex: "Macho",
    age: "4 anos",
    size: "Grande",
    status: "disponível",
    image: photos.tigrao,
    focal: "face",
    temperament: ["Companheiro", "Calmo"],
    description: "Tigrão é companheiro, calmo e busca uma família paciente.",
    note: "FIV+",
  },
  {
    id: "4",
    slug: "nina-g7h8",
    name: "Nina",
    species: "Cão",
    sex: "Fêmea",
    age: "3 anos",
    size: "Médio",
    status: "adotado",
    image: photos.nina,
    focal: "face",
    temperament: ["Curiosa", "Gentil"],
  },
  {
    id: "5",
    slug: "bento-j9k0",
    name: "Bento",
    species: "Gato",
    sex: "Macho",
    age: "1 ano",
    size: "Pequeno",
    status: "disponível",
    image: photos.gato,
    focal: "top",
    temperament: ["Independente", "Carinhoso"],
    description: "Bento é independente, carinhoso e gosta de observar tudo ao redor.",
  },
];

export const petsBySlug = Object.fromEntries(pets.map((pet) => [pet.slug, pet])) as Record<
  string,
  Pet
>;

export const getPublicBaseUrl = () => {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured)) {
    return configured;
  }
  if (
    typeof window !== "undefined" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return window.location.origin;
  }
  return "https://adotapet.app";
};

export const ong = {
  name: "Amigos de Patas",
  slug: "amigos-de-patas",
  city: "São Paulo, SP",
  whatsapp: "(11) 98888-7777",
  email: "contato@amigosdepatas.org",
  description:
    "Resgatamos, cuidamos e encontramos famílias responsáveis para animais em situação de vulnerabilidade desde 2018.",
  available: 12,
  adoptions: 148,
  years: 8,
};

export const requests = [
  {
    id: "SOL-2026-0001",
    person: "Ana Souza",
    pets: ["Caramelo", "Mel"],
    status: "nova",
    time: "há 12 min",
    date: "18 mar 2026, 14:32",
  },
  {
    id: "SOL-2026-0002",
    person: "Bruno Lima",
    pets: ["Tigrão"],
    status: "em análise",
    time: "há 2 h",
    date: "18 mar 2026, 12:05",
  },
  {
    id: "SOL-2026-0003",
    person: "Marina Costa",
    pets: ["Bento"],
    status: "concluída",
    time: "ontem",
    date: "17 mar 2026, 17:45",
  },
];

export const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
