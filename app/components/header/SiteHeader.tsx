'use client';

import { UtilityBar } from './UtilityBar';
import { MainNav } from './MainNav';

interface SiteHeaderProps {
  collections: Array<{ handle: string; title: string }>;
}

export function SiteHeader({ collections }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50">
      <UtilityBar />
      <MainNav collections={collections} />
    </header>
  );
}
