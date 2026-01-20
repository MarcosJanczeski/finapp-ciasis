import { shell } from "../layout/shell";

export function loginPage() {
  return shell(`
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="margin:0;opacity:.8;">Entre ou crie sua conta</p>

      <label style="display:flex;flex-direction:column;gap:6px;">
        <span>Email</span>
        <input id="email" type="email" placeholder="voce@exemplo.com"
          style="padding:12px;border:1px solid #ddd;border-radius:10px;" />
      </label>

      <label style="display:flex;flex-direction:column;gap:6px;">
        <span>Senha</span>
        <input id="password" type="password" placeholder="••••••••"
          style="padding:12px;border:1px solid #ddd;border-radius:10px;" />
      </label>

      <div style="display:flex;gap:10px;">
        <button id="btnSignIn"
          style="flex:1;padding:12px;border-radius:10px;border:1px solid #111;background:#111;color:#fff;">
          Entrar
        </button>

        <button id="btnSignUp"
          style="flex:1;padding:12px;border-radius:10px;border:1px solid #111;background:#fff;color:#111;">
          Criar conta
        </button>
      </div>

      <div id="msg" style="min-height:20px;color:#b00020;"></div>
    </div>
  `);
}
