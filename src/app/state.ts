import type { AuthSession } from "../domain/ports/AuthPort";

export type CommitmentKind = "EXPENSE" | "INCOME" | "SAVINGS_GOAL";

export type RecurringCommitment = {
  id: string;
  workspace_id: string;
  kind: CommitmentKind;
  title: string;
  amount_cents: number;
  cadence: "MONTHLY";
  start_date: string; // YYYY-MM-DD
  counterparty_id: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
};

export type Person = {
  id: string;
  workspace_id: string;
  type: "PF" | "PJ";
  name: string;
  document: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type AppState = {
  session: AuthSession | null;
  workspaceId: string | null;
  commitments: RecurringCommitment[];
  people: Person[];
};

export const state: AppState = {
  session: null,
  workspaceId: null,
  commitments: [],
  people: [],
};
