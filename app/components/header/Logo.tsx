'use client';

import Image from 'next/image';
import Link from 'next/link';

type LogoProps = { logoSrc?: string; alt?: string; className?: string };

function logoImageUnoptimized(src: string): boolean {
  if (!src.startsWith('http')) return false;
  try {
    return new URL(src).hostname !== 'cdn.shopify.com';
  } catch {
    return true;
  }
}

export function Logo(p: LogoProps) {
  const { logoSrc, alt = 'uBee Furniture', className = '' } = p;
  return (
    <Link href="/" className={'flex items-center font-bold text-[var(--ubee-black)] hover:text-[var(--ubee-gray)] transition-colors ' + className} aria-label="uBee Furniture home">
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={alt}
          width={160}
          height={32}
          className="h-8 w-auto object-contain"
          unoptimized={logoImageUnoptimized(logoSrc)}
        />
      ) : (
        <span className="flex flex-col leading-tight">
          <span className="text-xl">uBee</span>
          <span className="text-xs font-normal uppercase tracking-wider text-[var(--ubee-gray-light)]">Furniture</span>
        </span>
      )}
    </Link>
  );
}
