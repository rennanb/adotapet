import { createBrowserRouter } from "react-router";
import { DashboardShell, RootShell, RouteErrorPage } from "../components/Shells";
import { Protegido } from "../lib/auth";
import {
  AdoptPage,
  CodePage,
  LandingRedirect,
  LoginPage,
  OngPage,
  PetPage,
  SignupPage,
  SolicitacaoPage,
  SuccessPage,
  UnavailablePage,
} from "../pages/PublicPages";
import { PrivacidadePage, TermosPage } from "../pages/LegalPages";
import { OngsPublicPage, PetsPublicPage } from "../pages/ExplorePages";
import {
  ConfigPage,
  DashboardPage,
  OngSettingsPage,
  PetFormPage,
  PetsPage,
  QrPage,
  RequestDetailPage,
  RequestsPage,
} from "../pages/PanelPages";

export const router = createBrowserRouter([
  {
    Component: RootShell,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: LandingRedirect },
      { path: "entrar", Component: LoginPage },
      { path: "entrar/codigo", Component: CodePage },
      { path: "cadastro", Component: SignupPage },
      { path: "ongs", Component: OngsPublicPage },
      { path: "pets", Component: PetsPublicPage },
      { path: "ong/:slug", Component: OngPage },
      { path: "pet-indisponivel", Component: UnavailablePage },
      { path: "pet/:slug", Component: PetPage },
      { path: "p/:slug", Component: PetPage },
      { path: "solicitacao/:token", Component: SolicitacaoPage },
      { path: "privacidade", Component: PrivacidadePage },
      { path: "termos", Component: TermosPage },
      { path: "pet/:slug/adotar", Component: AdoptPage },
      { path: "pet/:slug/adotar/enviado", Component: SuccessPage },
      {
        Component: Protegido,
        children: [
          {
            path: "painel",
            Component: DashboardShell,
            children: [
              { index: true, Component: DashboardPage },
              { path: "animais", Component: PetsPage },
              { path: "animais/novo", Component: PetFormPage },
              { path: "animais/:id", Component: PetFormPage },
              { path: "animais/:id/qr", Component: () => <QrPage /> },
              { path: "qr", Component: () => <QrPage ongQr /> },
              { path: "ong", Component: OngSettingsPage },
              { path: "solicitacoes", Component: RequestsPage },
              { path: "solicitacoes/:id", Component: RequestDetailPage },
              { path: "config", Component: ConfigPage },
            ],
          },
        ],
      },
      { path: "*", Component: LandingRedirect },
    ],
  },
]);
