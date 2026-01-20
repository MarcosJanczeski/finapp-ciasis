import { shell } from "../layout/shell";

export function dashboardPage(email: string) {
  return shell(`
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div>
          <div style="font-size:14px;opacity:.8;">Logado como</div>
          <div style="font-weight:600;">${email}</div>
        </div>
        <button id="btnSignOut"
          style="padding:10px 12px;border-radius:10px;border:1px solid #111;background:#fff;color:#111;">
          Sair
        </button>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:10px;">
        ${card("Despesas mensais", "—")}
        ${card("Receitas recorrentes", "—")}
        ${card("Meta de poupança", "—")}
        ${card("Faturamento médio diário necessário", "—")}
        ${card("Status", "—")}
      </div>

      <p style="margin:6px 0 0 0;opacity:.7;font-size:12px;">
        (Dashboard mínimo: placeholders. Próximo passo será ligar ao banco e ao cálculo.)
      </p>
    </div>
  `);
}

function card(title: string, value: string) {
  return `
  <div style="border:1px solid #eee;border-radius:14px;padding:12px;">
    <div style="font-size:13px;opacity:.75;">${title}</div>
    <div style="font-size:22px;font-weight:700;margin-top:6px;">${value}</div>
  </div>
  `;
}
