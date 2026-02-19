'use client';

import { useEffect } from 'react';
import { trackQuoteClick } from '@/lib/analytics';

interface TrackQuoteClickProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Client component wrapper for Link that tracks quote button clicks.
 * Use this instead of regular Link for quote CTAs.
 */
export function TrackQuoteClick({ href, children, className, style, ...props }: TrackQuoteClickProps) {
  function handleClick() {
    trackQuoteClick();
  }

  return (
    <a href={href} onClick={handleClick} className={className} style={style} {...props}>
      {children}
    </a>
  );
}
