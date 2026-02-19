/**
 * Simple A/B testing infrastructure using cookies.
 * For production, consider using Vercel Edge Config, LaunchDarkly, or similar.
 */

export type ABTestVariant = 'A' | 'B';

export interface ABTest {
  name: string;
  variant: ABTestVariant;
}

/**
 * Get A/B test variant for a test name.
 * Uses cookie to persist variant for the session.
 * Falls back to 'A' (control) if not set.
 */
export function getABTestVariant(testName: string): ABTestVariant {
  if (typeof window === 'undefined') return 'A';

  const cookieName = `ab_${testName}`;
  const cookies = document.cookie.split(';');
  const cookie = cookies.find((c) => c.trim().startsWith(`${cookieName}=`));

  if (cookie) {
    const value = cookie.split('=')[1];
    if (value === 'A' || value === 'B') {
      return value;
    }
  }

  // Randomly assign A or B (50/50 split)
  const variant: ABTestVariant = Math.random() < 0.5 ? 'A' : 'B';
  document.cookie = `${cookieName}=${variant};path=/;max-age=${60 * 60 * 24 * 30}`; // 30 days

  return variant;
}

/**
 * Track A/B test exposure in GA4.
 * Call this when rendering a variant to track which variant was shown.
 */
export function trackABTestExposure(testName: string, variant: ABTestVariant) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'ab_test_exposure', {
    test_name: testName,
    variant,
  });
}

/**
 * Predefined test names matching AB-TEST-PLAN.md
 */
export const AB_TESTS = {
  HERO_MESSAGING: 'hero_messaging',
  LANDLORD_CTA: 'landlord_cta',
  PACKAGE_PRICING: 'package_pricing',
} as const;
