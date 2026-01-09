'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [measurementId]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
}

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track report submissions
export const trackReportSubmission = (category: string, location?: { lat: number; lon: number }) => {
  trackEvent('submit_report', 'engagement', category, 1);
  
  if (location) {
    trackEvent('location_report', 'engagement', `${location.lat.toFixed(3)},${location.lon.toFixed(3)}`, 1);
  }
};

// Track map interactions
export const trackMapInteraction = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'map_interaction',
      value: 1,
      ...(params ?? {}),
    });
    return;
  }

  // Fallback (e.g. during SSR or if gtag isn't ready yet)
  const label = params ? JSON.stringify(params) : undefined;
  trackEvent(action, 'map_interaction', label, 1);
};

// Global type declarations for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}