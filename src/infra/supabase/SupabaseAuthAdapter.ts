import type { AuthPort, AuthSession } from "../../domain/ports/AuthPort";
import { supabase } from "./client";

function mapSession(session: any): AuthSession {
  const user = session.user;
  return {
    user: { id: user.id, email: user.email ?? "" },
    accessToken: session.access_token,
  };
}

export class SupabaseAuthAdapter implements AuthPort {
  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;
    return mapSession(data.session);
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("No session returned by Supabase.");
    return mapSession(data.session);
  }

  async signUp(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Dependendo da config do Supabase, pode exigir confirmação por e-mail.
    // Se não houver sessão imediata, orientamos o usuário a confirmar e depois fazer login.
    if (!data.session) {
      throw new Error("Signup created. Check email confirmation (if enabled), then sign in.");
    }

    return mapSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
