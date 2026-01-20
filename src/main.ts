import "./style.css";

import { setRoot } from "./app/ui";
import { getRoute, go } from "./app/router";
import { state } from "./app/state";

import { AuthService } from "./domain/services/AuthService";
import { SupabaseAuthAdapter } from "./infra/supabase/SupabaseAuthAdapter";
import { SessionStore } from "./persistence/session/SessionStore";
import { SupabaseData } from "./infra/supabase/SupabaseData";

import { loginPage } from "./presentation/pages/LoginPage";
import { dashboardPage } from "./presentation/pages/DashboardPage";

const authService = new AuthService(new SupabaseAuthAdapter());
const sessionStore = new SessionStore();
const data = new SupabaseData();

async function bootstrap() {
  state.session = sessionStore.load();

  try {
    const remote = await authService.getSession();
    state.session = remote;
    if (remote) sessionStore.save(remote);
    else sessionStore.clear();
  } catch {
    // mantém local no MVP
  }

  window.addEventListener("hashchange", render);
  await hydrateIfLogged();
  render();
}

async function hydrateIfLogged() {
  if (!state.session) return;

  if (!state.workspaceId) {
    state.workspaceId = await data.getCurrentWorkspaceId();
  }

  // carrega people + commitments
  const [people, commitments] = await Promise.all([
    data.listPeople(state.workspaceId),
    data.listCommitments(state.workspaceId),
  ]);

  state.people = people;
  state.commitments = commitments;
}

function render() {
  const route = getRoute();

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

  // Dashboard/Compromissos
  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const totals = calcTotals(state.commitments, now);

  setRoot(
    dashboardPage({
      email: state.session?.user.email ?? "",
      commitments: state.commitments,
      people: state.people,
      monthLabel,
      totals,
    })
  );

  wireDashboard();
}

function calcTotals(commitments: typeof state.commitments, now: Date) {
  let expenses = 0;
  let incomes = 0;
  let savings = 0;

  for (const c of commitments) {
    if (!c.active) continue;
    if (c.kind === "EXPENSE") expenses += c.amount_cents;
    if (c.kind === "INCOME") incomes += c.amount_cents;
    if (c.kind === "SAVINGS_GOAL") savings += c.amount_cents;
  }

  const requiredMonthly = expenses + savings - incomes; // o que precisa ser coberto por "faturamento"
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const requiredDaily = Math.max(0, Math.round(requiredMonthly / daysInMonth));

  const status =
    requiredMonthly > 0 ? "DEFICITARIO" :
    requiredMonthly === 0 ? "EQUILIBRADO" : "FOLGA";

  return {
    expensesCents: expenses,
    incomesCents: incomes,
    savingsCents: savings,
    requiredMonthlyCents: Math.abs(requiredMonthly),
    requiredDailyCents: requiredDaily,
    status,
  } as const;
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

      // hidrata dados
      state.workspaceId = null;
      await hydrateIfLogged();

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

      state.workspaceId = null;
      await hydrateIfLogged();

      setMsg("Conta criada e logado ✅", false);
      go("/dashboard");
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao criar conta.";
      setMsg(msg);
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
      state.workspaceId = null;
      state.commitments = [];
      state.people = [];
      sessionStore.clear();
      go("/login");
    }
  });

  const btnOpen = document.querySelector<HTMLButtonElement>("#btnOpenAdd")!;
  const backdrop = document.querySelector<HTMLDivElement>("#addModalBackdrop")!;
  const btnClose = document.querySelector<HTMLButtonElement>("#btnCloseAdd")!;
  const btnSave = document.querySelector<HTMLButtonElement>("#btnAddSave")!;

  const kindEl = document.querySelector<HTMLSelectElement>("#addKind")!;
  const titleEl = document.querySelector<HTMLInputElement>("#addTitle")!;
  const amountEl = document.querySelector<HTMLInputElement>("#addAmount")!;
  const personEl = document.querySelector<HTMLSelectElement>("#addPerson")!;
  const msgEl = document.querySelector<HTMLDivElement>("#addMsg")!;

  const open = () => {
    msgEl.textContent = "";
    titleEl.value = "";
    amountEl.value = "";
    personEl.value = "";
    kindEl.value = "EXPENSE";
    backdrop.style.display = "block";
    titleEl.focus();
  };
  const close = () => (backdrop.style.display = "none");

  btnOpen.addEventListener("click", open);
  btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  btnSave.addEventListener("click", async () => {
    msgEl.textContent = "";

    const workspaceId = state.workspaceId;
    if (!workspaceId) {
      msgEl.textContent = "Workspace não carregado.";
      return;
    }

    const kind = kindEl.value as any;
    const title = titleEl.value.trim();
    const amountCents = parseMoneyToCents(amountEl.value);
    const personId = personEl.value ? personEl.value : null;

    if (!title) {
      msgEl.textContent = "Informe um título.";
      return;
    }
    if (amountCents <= 0) {
      msgEl.textContent = "Informe um valor válido.";
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = "Salvando...";

    try {
      const startDate = new Date().toISOString().slice(0, 10);
      await data.createCommitment({
        workspaceId,
        kind,
        title,
        amountCents,
        startDate,
        counterpartyId: personId,
      });

      // recarrega lista
      state.commitments = await data.listCommitments(workspaceId);

      close();
      render();
    } catch (e: any) {
      msgEl.textContent = e?.message ?? "Erro ao salvar.";
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Salvar";
    }
  });
}

function parseMoneyToCents(raw: string): number {
  // aceita "1200,50" "1200.50" "1.200,50"
  const cleaned = raw
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

bootstrap();
