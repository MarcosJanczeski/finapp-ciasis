import { supabase } from "./client";
import type { Person, RecurringCommitment, CommitmentKind } from "../../app/state";
import type { Occurrence, OccurrenceStatus } from "../../app/state";

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
  async generateMonthOccurrences(year: number, month: number): Promise<number> {
    const { data, error } = await supabase.rpc("generate_month_occurrences", {
      p_year: year,
      p_month: month,
    });
    if (error) throw error;
    return (data ?? 0) as number;
  }

  async listOccurrences(params: {
    workspaceId: string;
    year: number;
    month: number; // 1..12
    onlyOpen: boolean;
  }): Promise<Occurrence[]> {
    const start = new Date(Date.UTC(params.year, params.month - 1, 1))
      .toISOString()
      .slice(0, 10);
    const end = new Date(Date.UTC(params.year, params.month, 1))
      .toISOString()
      .slice(0, 10);

    let q = supabase
      .from("occurrences")
      .select("*")
      .eq("workspace_id", params.workspaceId)
      .gte("due_date", start)
      .lt("due_date", end)
      .order("due_date", { ascending: true });

    if (params.onlyOpen) {
      q = q.eq("status", "OPEN");
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Occurrence[];
  }

  async setOccurrenceStatus(input: {
    id: string;
    status: OccurrenceStatus;
    settledAt: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from("occurrences")
      .update({
        status: input.status,
        settled_at: input.settledAt,
      })
      .eq("id", input.id);

    if (error) throw error;
  }

}
