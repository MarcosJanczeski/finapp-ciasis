import type { AuthSession } from "../domain/ports/AuthPort";

export type AppState = {
  session: AuthSession | null;
};

export const state: AppState = {
  session: null,
};
