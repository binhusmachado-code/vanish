import { getSupabase } from "./db";
import type { RunResult } from "./engine-types";
import { summarize } from "./run";

export interface CustomerRow {
  token: string;
  name: string;
  email: string;
  createdAt: string;
  run: RunResult | null;
  progress: { total: number; removed: number; todos: number; pct: number };
}

export async function getAllCustomers(): Promise<CustomerRow[]> {
  try {
    const db = getSupabase();

    // Fetch all customers with their runs
    const { data: customers, error } = await db
      .from("customers")
      .select(
        `
        id,
        token,
        full_name,
        verified_email,
        created_at,
        removal_runs(run_data)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }

    const rows: CustomerRow[] = customers.map((c) => {
      const runData = c.removal_runs?.[0]?.run_data as RunResult | null;
      const s = runData
        ? summarize(runData)
        : { total: 0, removed: 0, todos: [], pct: 0 };

      return {
        token: c.token,
        name: c.full_name,
        email: c.verified_email,
        createdAt: c.created_at,
        run: runData,
        progress: {
          total: s.total,
          removed: s.removed,
          todos: Array.isArray(s.todos) ? s.todos.length : 0,
          pct: s.pct,
        },
      };
    });

    return rows;
  } catch {
    return [];
  }
}
