import { createClient } from "@/utils/supabase/server";

export default async function Page() {
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
