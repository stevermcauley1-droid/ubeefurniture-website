'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return <div className="w-full aspect-square bg-gray-100 rounded-lg" />;
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText ?? productTitle}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
          className="object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                idx === selectedIndex ? 'border-[var(--ubee-yellow)]' : 'border-gray-200'
              }`}
            >
              <Image src={img.url} alt={img.altText ?? ''} width={80} height={80} className="w-full h-full object-cover rounded" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
