'use client';

import { Logo } from '../header/Logo';
import { SearchBar } from '../navigation/SearchBar';
import { CartIcon } from '../header/CartIcon';

export function MainRow() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="flex-1 flex justify-center max-w-xl mx-4">
            <SearchBar />
          </div>
          <div className="flex-shrink-0">
            <CartIcon />
          </div>
        </div>
      </div>
    </div>
  );
}
