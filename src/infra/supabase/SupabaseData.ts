import { supabase } from "./client";
import type { Person, RecurringCommitment, CommitmentKind } from "../../app/state";

export class SupabaseData {
  async getCurrentWorkspaceId(): Promise<string> {
    const { data, error } = await supabase.rpc("ensure_workspace");
    if (error) throw error;
    if (!data) throw new Error("Workspace not found/created.");
    return data as string;
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
    createdBy: string;
    kind: CommitmentKind;
    title: string;
    amountCents: number;
    cadence: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate: string;
    counterpartyId: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("recurring_commitments").insert([
      {
        workspace_id: input.workspaceId,
        kind: input.kind,
        title: input.title,
        amount_cents: input.amountCents,
        cadence: input.cadence,
        start_date: input.startDate,
        counterparty_id: input.counterpartyId,
        active: true,
        created_by: input.createdBy,
      },
    ]);

    if (error) throw error;
  }
}
