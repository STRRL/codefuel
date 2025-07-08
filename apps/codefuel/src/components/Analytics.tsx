'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Simple page view tracking
    const trackPageView = () => {
      if (typeof window !== 'undefined') {
        // Store page view in localStorage for now
        const pageViews = JSON.parse(localStorage.getItem('codefuel_page_views') || '{}');
        pageViews[pathname] = (pageViews[pathname] || 0) + 1;
        pageViews.last_visit = new Date().toISOString();
        localStorage.setItem('codefuel_page_views', JSON.stringify(pageViews));
        
        // Log for development
        console.log('Page view tracked:', pathname);
      }
    };

    trackPageView();
  }, [pathname]);

  return null;
}