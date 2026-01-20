import type { User } from "../models/User";

export type AuthSession = {
  user: User;
  accessToken: string;
};

export type AuthPort = {
  getSession(): Promise<AuthSession | null>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
};
