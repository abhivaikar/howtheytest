'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function Turnstile({ siteKey, onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Cleanup function to reset widget on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  const handleScriptLoad = () => {
    if (!containerRef.current || !window.turnstile) return;

    setIsLoaded(true);

    // Remove existing widget if present
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    // Render new widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        setIsLoading(false);
        onVerify(token);
      },
      'error-callback': () => {
        setIsLoading(false);
        onError?.();
      },
      'expired-callback': () => {
        onExpire?.();
      },
      theme: 'light',
      size: 'normal',
    });
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={handleScriptLoad}
        strategy="afterInteractive"
      />
      <div className="relative">
        {isLoading && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!isLoaded && (
          <div className="h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 text-sm">
            Loading security verification...
          </div>
        )}
        <div ref={containerRef} />
      </div>
    </>
  );
}

// Type definition for window.turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
      }) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}
