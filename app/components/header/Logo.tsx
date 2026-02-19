'use client';

import Link from 'next/link';

type LogoProps = { logoSrc?: string; alt?: string; className?: string };

export function Logo(p: LogoProps) {
  const { logoSrc, alt = 'uBee Furniture', className = '' } = p;
  return (
    <Link href="/" className={'flex items-center font-bold text-[var(--ubee-black)] hover:text-[var(--ubee-gray)] transition-colors ' + className} aria-label="uBee Furniture home">
      {logoSrc ? <img src={logoSrc} alt={alt} className="h-8 w-auto object-contain" /> : (
        <span className="flex flex-col leading-tight">
          <span className="text-xl">uBee</span>
          <span className="text-xs font-normal uppercase tracking-wider text-[var(--ubee-gray-light)]">Furniture</span>
        </span>
      )}
    </Link>
  );
}
