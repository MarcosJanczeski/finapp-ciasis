import { shell } from "../layout/shell";
import type { Occurrence } from "../../app/state";

export function occurrencesPage(params: {
  monthLabel: string;
  onlyOpen: boolean;
  occurrences: Occurrence[];
}) {
  const { monthLabel, onlyOpen, occurrences } = params;

  return shell(`
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${topBar(monthLabel, onlyOpen)}

      ${occurrences.length === 0 ? emptyState() : list(occurrences)}
    </div>
  `);
}

function topBar(monthLabel: string, onlyOpen: boolean) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <div>
      <div style="font-size:12px;opacity:.7;">${monthLabel}</div>
      <div style="font-size:18px;font-weight:900;">Contas do mês</div>
      <div style="font-size:12px;opacity:.7;">Pagar / Receber</div>
    </div>

    <div style="display:flex;gap:8px;align-items:center;">
      <button id="btnBackDashboard"
        style="padding:10px 12px;border-radius:12px;border:1px solid #ddd;background:#fff;">
        Voltar
      </button>
    </div>
  </div>

  <div style="display:flex;gap:10px;align-items:center;">
    <button id="btnGenerateMonth"
      style="padding:12px 14px;border-radius:14px;border:1px solid #111;background:#111;color:#fff;font-weight:900;">
      Gerar mês
    </button>

    <label style="display:flex;gap:8px;align-items:center;font-size:13px;opacity:.9;">
      <input id="toggleOnlyOpen" type="checkbox" ${onlyOpen ? "checked" : ""} />
      Mostrar só abertas
    </label>

    <div id="occMsg" style="margin-left:auto;font-size:13px;color:#b00020;"></div>
  </div>
  `;
}

function emptyState() {
  return `
  <div style="
    border:1px dashed #ddd;border-radius:18px;padding:16px;background:#fff;
  ">
    <div style="font-weight:900;">Nenhuma conta neste mês</div>
    <div style="opacity:.7;margin-top:6px;font-size:13px;">
      Clique em <b>Gerar mês</b> para criar as contas a partir das recorrências.
    </div>
  </div>
  `;
}

function list(items: Occurrence[]) {
  return `
  <div style="display:flex;flex-direction:column;gap:10px;">
    ${items.map(card).join("")}
  </div>
  `;
}

function card(o: Occurrence) {
  const kindLabel =
    o.kind === "EXPENSE" ? "Despesa" :
    o.kind === "INCOME" ? "Receita" : "Poupança";

  const badgeStyle =
    o.kind === "EXPENSE" ? "background:#fff0f0;border:1px solid #ffd7d7;color:#a00000;" :
    o.kind === "INCOME" ? "background:#f0fff4;border:1px solid #c7f3d6;color:#0a7a2f;" :
    "background:#f4f6ff;border:1px solid #dbe2ff;color:#2a3aa0;";

  const statusLabel =
    o.status === "OPEN" ? "Aberta" :
    o.status === "PAID" ? "Paga" :
    o.status === "RECEIVED" ? "Recebida" : "Cancelada";

  const dueBR = toBRDate(o.due_date);

  const action =
    o.status !== "OPEN"
      ? `<span style="font-size:12px;opacity:.7;">${statusLabel}</span>`
      : `
        <div style="display:flex;gap:8px;">
          ${o.kind === "EXPENSE" || o.kind === "SAVINGS_GOAL"
            ? `<button data-act="pay" data-id="${o.id}" style="${miniBtn()}">Marcar pago</button>`
            : `<button data-act="recv" data-id="${o.id}" style="${miniBtn()}">Marcar recebido</button>`
          }
          <button data-act="undo" data-id="${o.id}" style="${miniBtnLight()}">Desfazer</button>
        </div>
      `;

  return `
  <div style="border:1px solid #eee;border-radius:18px;padding:14px;background:#fff;">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div style="min-width:0;">
        <div style="font-weight:900;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(o.title)}
        </div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <span style="padding:6px 10px;border-radius:999px;font-size:12px;${badgeStyle}">
            ${kindLabel}
          </span>
          <span style="font-size:12px;opacity:.7;">Vence: ${dueBR}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div style="font-size:18px;font-weight:900;">${formatBRL(o.amount_cents)}</div>
        ${action}
      </div>
    </div>
  </div>
  `;
}

function miniBtn() {
  return "padding:8px 10px;border-radius:12px;border:1px solid #111;background:#111;color:#fff;font-weight:800;";
}
function miniBtnLight() {
  return "padding:8px 10px;border-radius:12px;border:1px solid #ddd;background:#fff;font-weight:800;";
}

function formatBRL(cents: number) {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function toBRDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
