export function SearchBar() {
  return (
    <form
      action="/search"
      method="GET"
      role="search"
      aria-label="Search products"
      style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
    >
      <input
        type="search"
        name="q"
        placeholder="Search products..."
        aria-label="Search products"
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid #ddd',
          borderRadius: 4,
          fontSize: '0.9375rem',
          minWidth: 160,
        }}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] border-none rounded font-semibold cursor-pointer transition-colors"
      >
        Search
      </button>
    </form>
  );
}
