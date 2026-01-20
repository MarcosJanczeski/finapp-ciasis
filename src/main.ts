import "./style.css";

import { setRoot } from "./app/ui";
import { getRoute, go } from "./app/router";
import { state } from "./app/state";

import { AuthService } from "./domain/services/AuthService";
import { SupabaseAuthAdapter } from "./infra/supabase/SupabaseAuthAdapter";
import { SessionStore } from "./persistence/session/SessionStore";

import { loginPage } from "./presentation/pages/LoginPage";
import { dashboardPage } from "./presentation/pages/DashboardPage";

const authService = new AuthService(new SupabaseAuthAdapter());
const sessionStore = new SessionStore();

async function bootstrap() {
  // tenta sessão local primeiro (rápido)
  state.session = sessionStore.load();

  // confirma com supabase (fonte de verdade)
  try {
    const remote = await authService.getSession();
    state.session = remote;
    if (remote) sessionStore.save(remote);
    else sessionStore.clear();
  } catch {
    // se der erro, seguimos com o que tinha local (MVP)
  }

  window.addEventListener("hashchange", render);
  render();
}

function render() {
  const route = getRoute();

  // guarda de rota
  if (!state.session && route !== "/login") {
    go("/login");
    return;
  }
  if (state.session && route === "/login") {
    go("/dashboard");
    return;
  }

  if (route === "/login") {
    setRoot(loginPage());
    wireLogin();
    return;
  }

  // dashboard
  setRoot(dashboardPage(state.session?.user.email ?? ""));
  wireDashboard();
}

function wireLogin() {
  const emailEl = document.querySelector<HTMLInputElement>("#email")!;
  const passEl = document.querySelector<HTMLInputElement>("#password")!;
  const msgEl = document.querySelector<HTMLDivElement>("#msg")!;

  const btnIn = document.querySelector<HTMLButtonElement>("#btnSignIn")!;
  const btnUp = document.querySelector<HTMLButtonElement>("#btnSignUp")!;

  const setMsg = (text: string, isError = true) => {
    msgEl.style.color = isError ? "#b00020" : "#0a7a2f";
    msgEl.textContent = text;
  };

  const setLoading = (loading: boolean) => {
    btnIn.disabled = loading;
    btnUp.disabled = loading;
    btnIn.textContent = loading ? "Aguarde..." : "Entrar";
    btnUp.textContent = loading ? "Aguarde..." : "Criar conta";
  };

  btnIn.addEventListener("click", async () => {
    setMsg("");
    setLoading(true);
    try {
      const session = await authService.signIn(emailEl.value.trim(), passEl.value);
      state.session = session;
      sessionStore.save(session);
      go("/dashboard");
    } catch (e: any) {
      setMsg(e?.message ?? "Falha no login.");
    } finally {
      setLoading(false);
    }
  });

  btnUp.addEventListener("click", async () => {
    setMsg("");
    setLoading(true);
    try {
      const session = await authService.signUp(emailEl.value.trim(), passEl.value);
      state.session = session;
      sessionStore.save(session);
      setMsg("Conta criada e logado ✅", false);
      go("/dashboard");
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao criar conta.";
      // caso de confirmação por e-mail
      if (msg.toLowerCase().includes("check email")) {
        setMsg("Conta criada. Confirme no e-mail e depois faça login.", true);
      } else {
        setMsg(msg);
      }
    } finally {

      setLoading(false);
    }
  });
}

function wireDashboard() {
  const btnOut = document.querySelector<HTMLButtonElement>("#btnSignOut")!;
  btnOut.addEventListener("click", async () => {
    try {
      await authService.signOut();
    } finally {
      state.session = null;
      sessionStore.clear();
      go("/login");
    }
  });
}

bootstrap();
