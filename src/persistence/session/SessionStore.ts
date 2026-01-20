import type { AuthSession } from "../../domain/ports/AuthPort";

const KEY = "finapp.session";

export class SessionStore {
  save(session: AuthSession) {
    localStorage.setItem(KEY, JSON.stringify(session));
  }

  load(): AuthSession | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  clear() {
    localStorage.removeItem(KEY);
  }
}
