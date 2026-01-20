import { supabase } from "./client";
import type { Person, RecurringCommitment, CommitmentKind } from "../../app/state";

export class SupabaseData {
  async getCurrentWorkspaceId(): Promise<string> {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .limit(1);

    if (error) throw error;
    const row = data?.[0];
    if (!row?.workspace_id) throw new Error("Workspace not found for current user.");
    return row.workspace_id as string;
  }

  async listPeople(workspaceId: string): Promise<Person[]> {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Person[];
  }

  async listCommitments(workspaceId: string): Promise<RecurringCommitment[]> {
    const { data, error } = await supabase
      .from("recurring_commitments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as RecurringCommitment[];
  }

  async createCommitment(input: {
    workspaceId: string;
    kind: CommitmentKind;
    title: string;
    amountCents: number;
    startDate: string;
    counterpartyId: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("recurring_commitments").insert([
      {
        workspace_id: input.workspaceId,
        kind: input.kind,
        title: input.title,
        amount_cents: input.amountCents,
        cadence: "MONTHLY",
        start_date: input.startDate,
        counterparty_id: input.counterpartyId,
        active: true,
      },
    ]);

    if (error) throw error;
  }
}
