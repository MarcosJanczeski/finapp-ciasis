import type { AuthPort, AuthSession } from "../ports/AuthPort";

export class AuthService {
  private auth: AuthPort;

  constructor(auth: AuthPort) {
    this.auth = auth;
  }

  getSession(): Promise<AuthSession | null> {
    return this.auth.getSession();
  }

  signIn(email: string, password: string): Promise<AuthSession> {
    return this.auth.signIn(email, password);
  }

  signUp(email: string, password: string): Promise<AuthSession> {
    return this.auth.signUp(email, password);
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
