'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const DEFAULT_FAQ: FAQItem[] = [
  {
    question: 'What is the delivery time?',
    answer: 'Delivery times vary by product and location. We confirm lead times after your order is placed. Standard delivery applies to most UK addresses.',
  },
  {
    question: 'Do you offer assembly?',
    answer: 'Yes, assembly can be arranged for larger items. Please contact us after ordering to schedule assembly, or mention it in your order notes.',
  },
  {
    question: 'What is your returns policy?',
    answer: 'We accept returns within 30 days of delivery for unused items in original packaging. See our full returns policy for details.',
  },
  {
    question: 'Is this suitable for rental properties?',
    answer: 'Many of our products are designed with durability and easy maintenance in mind, making them ideal for furnished rentals. Look for products tagged "landlord" or "rental-friendly".',
  },
  {
    question: 'Can I get a trade discount?',
    answer: 'Yes, we offer trade pricing for landlords and businesses. Register for a trade account or request a quote for bulk orders.',
  },
];

interface ProductFAQProps {
  productTitle?: string;
  customFAQ?: FAQItem[];
}

export function ProductFAQ({ productTitle, customFAQ }: ProductFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faq = customFAQ ?? DEFAULT_FAQ;

  return (
    <div className="space-y-2">
      {faq.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            aria-expanded={openIndex === idx}
          >
            <span className="font-medium text-[var(--ubee-black)]">{item.question}</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === idx && (
            <div className="px-4 pb-3 text-sm text-[var(--ubee-gray)]">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
