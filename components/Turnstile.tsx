'use client';

import { useEffect, useRef } from 'react';
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

    // Remove existing widget if present
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    // Render new widget
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        onVerify(token);
      },
      'error-callback': () => {
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
        strategy="lazyOnload"
      />
      <div ref={containerRef} />
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
