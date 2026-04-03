import { createClient } from "@/utils/supabase/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/utils/supabase/env";

/** Avoid static prerender without Supabase env (e.g. GitHub Actions CI). */
export const dynamic = "force-dynamic";

export default async function Page() {
  if (!getSupabaseUrl() || !getSupabasePublishableKey()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Supabase SSR Todo Test</h1>
        <p className="text-zinc-600">
          Supabase is not configured (set{" "}
          <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="rounded bg-zinc-100 px-1">.env.local</code>). CI builds skip this demo without those vars.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Supabase SSR Todo Test</h1>
      {error ? (
        <p className="text-red-600">Error loading todos: {error.message}</p>
      ) : (
        <ul className="list-disc pl-6">
          {todos?.map((todo: { id: string | number; name: string }) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
