export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          token: string;
          full_name: string;
          email: string;
          verified_email: string;
          dob: string;
          profile_data: Record<string, unknown>;
          stripe_customer_id: string | null;
          subscription_id: string | null;
          plan_id: string | null;
          status: "created" | "payment_pending" | "active" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      removal_runs: {
        Row: {
          id: string;
          customer_id: string;
          token: string;
          run_data: Record<string, unknown>;
          status: "queued" | "in_progress" | "completed" | "error";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["removal_runs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["removal_runs"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          customer_id: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: "pending" | "completed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
    };
  };
};
