"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };

export default function SupabaseTestPage() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    async function fetchClients() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from("Client").select("*").limit(10);

        if (error) {
          setState({ status: "error", message: error.message });
          return;
        }

        setState({ status: "success", data });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", message });
      }
    }

    fetchClients();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Supabase Connection Test</h1>

      {state.status === "loading" && <p className="text-gray-600">Loading…</p>}

      {state.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Error</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
        </div>
      )}

      {state.status === "success" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 font-medium text-gray-800">Response (Client table)</p>
          <pre className="overflow-x-auto text-sm text-gray-700">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
