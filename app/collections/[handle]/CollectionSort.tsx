import Link from 'next/link';

interface Option {
  value: string;
  label: string;
}

interface CollectionSortProps {
  handle: string;
  currentSort: string;
  options: Option[];
}

export function CollectionSort({ handle, currentSort, options }: CollectionSortProps) {
  return (
    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sort:</span>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={opt.value === 'default' ? `/collections/${handle}` : `/collections/${handle}?sort=${opt.value}`}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.875rem',
            background: currentSort === opt.value ? '#000' : '#eee',
            color: currentSort === opt.value ? '#fff' : '#000',
            borderRadius: 4,
          }}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
