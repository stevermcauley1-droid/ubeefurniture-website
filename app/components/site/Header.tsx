'use client';

import { UtilityBar } from './UtilityBar';
import { MainRow } from './MainRow';
import { PrimaryNav } from './PrimaryNav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      <UtilityBar />
      <MainRow />
      <PrimaryNav />
    </header>
  );
}
