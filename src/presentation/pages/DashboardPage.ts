import { shell } from "../layout/shell";
import type { Person, RecurringCommitment } from "../../app/state";

export function dashboardPage(params: {
  email: string;
  commitments: RecurringCommitment[];
  people: Person[];
  monthLabel: string;
  totals: {
    expensesCents: number;
    incomesCents: number;
    savingsCents: number;
    requiredMonthlyCents: number;
    requiredDailyCents: number;
    status: "DEFICITARIO" | "EQUILIBRADO" | "FOLGA";
  };
}) {
  const { email, commitments, people, monthLabel, totals } = params;

  const summary = `
    <div style="display:grid;grid-template-columns:1fr;gap:10px;">
      ${card("Despesas mensais", formatBRL(totals.expensesCents))}
      ${card("Receitas recorrentes", formatBRL(totals.incomesCents))}
      ${card("Meta de poupança", formatBRL(totals.savingsCents))}
      ${card("Faturamento médio diário necessário", formatBRL(totals.requiredDailyCents), true)}
      ${statusCard(totals.status, totals.requiredMonthlyCents)}
    </div>
  `;

  const list = commitments.length === 0
    ? emptyState()
    : `
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">
        ${commitments.map(c => commitmentCard(c, people)).join("")}
      </div>
    `;

  const modal = addModal(people);

  return shell(`
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${topBar(email, monthLabel)}
      ${summary}

      <div style="margin-top:10px;">
        <div style="display:flex;align-items:end;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:16px;font-weight:700;">Compromissos</div>
            <div style="font-size:12px;opacity:.7;">Recorrências mensais ativas</div>
          </div>
        </div>
        ${list}
      </div>

      ${modal}

      <!-- FAB -->
      <button id="btnOpenAdd"
        style="
          position:fixed;right:16px;bottom:16px;
          width:56px;height:56px;border-radius:999px;
          border:none;background:#111;color:#fff;
          font-size:26px;line-height:0;
          box-shadow:0 10px 25px rgba(0,0,0,.18);
        ">+</button>
    </div>
  `);
}

function topBar(email: string, monthLabel: string) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <div>
      <div style="font-size:12px;opacity:.7;">${monthLabel}</div>
      <div style="font-size:18px;font-weight:800;">FINAPP</div>
      <div style="font-size:12px;opacity:.7;">${email}</div>
    </div>
    <button id="btnSignOut"
      style="padding:10px 12px;border-radius:12px;border:1px solid #ddd;background:#fff;">
      Sair
    </button>
  </div>
  `;
}

function card(title: string, value: string, highlight = false) {
  return `
  <div style="
    border:1px solid ${highlight ? "#111" : "#eee"};
    border-radius:18px;
    padding:14px;
    background:${highlight ? "#111" : "#fff"};
    color:${highlight ? "#fff" : "#111"};
  ">
    <div style="font-size:12px;color:${highlight ? "rgba(255,255,255,.85)" : "rgba(17,17,17,.7)"};">${title}</div>
    <div style="font-size:24px;font-weight:900;margin-top:6px;color:${highlight ? "#fff" : "#111"};">${value}</div>
  </div>
  `;
}

function statusCard(status: "DEFICITARIO" | "EQUILIBRADO" | "FOLGA", requiredMonthlyCents: number) {
  const label =
    status === "DEFICITARIO" ? "Deficitário" :
      status === "EQUILIBRADO" ? "Equilibrado" : "Folga";

  const hint =
    status === "DEFICITARIO"
      ? `Falta cobrir ${formatBRL(requiredMonthlyCents)} no mês.`
      : status === "EQUILIBRADO"
        ? "Coberto no mês (no limite)."
        : "Sobrou no mês (acima da meta).";

  return `
  <div style="border:1px solid #eee;border-radius:18px;padding:14px;background:#fff;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:12px;opacity:.7;">Status</div>
        <div style="font-size:20px;font-weight:900;margin-top:6px;">${label}</div>
        <div style="font-size:12px;opacity:.7;margin-top:6px;">${hint}</div>
      </div>
    </div>
  </div>
  `;
}

function emptyState() {
  return `
  <div style="
    margin-top:14px;
    border:1px dashed #ddd;border-radius:18px;padding:16px;
    background:#fff;
  ">
    <div style="font-weight:800;">Sem compromissos ainda</div>
    <div style="opacity:.7;margin-top:6px;font-size:13px;">
      Toque no <b>+</b> para cadastrar uma despesa, receita ou meta de poupança.
    </div>
  </div>
  `;
}

function commitmentCard(c: RecurringCommitment, people: Person[]) {
  const kindLabel =
    c.kind === "EXPENSE" ? "Despesa" :
      c.kind === "INCOME" ? "Receita" : "Poupança";

  const kindBadgeStyle =
    c.kind === "EXPENSE" ? "background:#fff0f0;border:1px solid #ffd7d7;color:#a00000;" :
      c.kind === "INCOME" ? "background:#f0fff4;border:1px solid #c7f3d6;color:#0a7a2f;" :
        "background:#f4f6ff;border:1px solid #dbe2ff;color:#2a3aa0;";

  const counterparty = c.counterparty_id
    ? people.find(p => p.id === c.counterparty_id)?.name ?? "Pessoa"
    : null;

  return `
  <div style="border:1px solid #eee;border-radius:18px;padding:14px;background:#fff;">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div style="min-width:0;">
        <div style="font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(c.title)}
        </div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <span style="padding:6px 10px;border-radius:999px;font-size:12px;${kindBadgeStyle}">
            ${kindLabel}
          </span>
          ${counterparty ? `<span style="font-size:12px;opacity:.7;">${escapeHtml(counterparty)}</span>` : ""}
        </div>
      </div>
      <div style="font-size:18px;font-weight:900;">${formatBRL(c.amount_cents)}</div>
    </div>
  </div>
  `;
}

function addModal(people: Person[]) {
  const peopleOptions = [
    `<option value="">(sem pessoa)</option>`,
    ...people.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`),
  ].join("");

  return `
  <div id="addModalBackdrop" style="
    display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);
    padding:16px;
  ">
    <div style="
      max-width:420px;margin:60px auto 0 auto;background:#fff;border-radius:20px;
      border:1px solid #eee;padding:16px;
      box-shadow:0 20px 50px rgba(0,0,0,.2);
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="font-size:16px;font-weight:900;">Adicionar compromisso</div>
        <button id="btnCloseAdd" style="border:none;background:transparent;font-size:22px;">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;opacity:.7;">Tipo</span>
          <select id="addKind" style="padding:12px;border:1px solid #ddd;border-radius:14px;">
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
            <option value="SAVINGS_GOAL">Meta de poupança</option>
          </select>
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;opacity:.7;">Título</span>
          <input id="addTitle" placeholder="Ex: Aluguel"
            style="padding:12px;border:1px solid #ddd;border-radius:14px;" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;opacity:.7;">Valor (R$)</span>
          <input id="addAmount" inputmode="decimal" placeholder="Ex: 1200,00"
            style="padding:12px;border:1px solid #ddd;border-radius:14px;" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;opacity:.7;">Recorrência</span>
          <select id="addCadence" style="padding:12px;border:1px solid #ddd;border-radius:14px;">
            <option value="MONTHLY">Mensal</option>
            <option value="WEEKLY">Semanal</option>
            <option value="DAILY">Diária</option>
            <option value="YEARLY">Anual</option>
          </select>
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;opacity:.7;">Pessoa (opcional)</span>
          <select id="addPerson" style="padding:12px;border:1px solid #ddd;border-radius:14px;">
            ${peopleOptions}
          </select>
        </label>

        <div id="addMsg" style="min-height:18px;color:#b00020;font-size:13px;"></div>

        <button id="btnAddSave"
          style="padding:12px;border-radius:14px;border:1px solid #111;background:#111;color:#fff;font-weight:800;">
          Salvar
        </button>
      </div>
    </div>
  </div>
  `;
}

function formatBRL(cents: number) {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
