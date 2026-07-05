'use client';

import { useEffect } from 'react';

const CHUNK_RELOAD_KEY = 'no-smoke-alert-chunk-reload-attempted';
const MAX_MESSAGE_LENGTH = 200;

const getErrorName = (value: unknown): string => {
  if (value instanceof Error && value.name) return value.name;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string' && name) return name;
  }
  return 'UnknownError';
};

const getErrorMessage = (value: unknown): string => {
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  if (typeof value === 'string') return value;
  return 'Unknown client-side exception';
};

const truncate = (value: string) => value.slice(0, MAX_MESSAGE_LENGTH);

const getBrowserFamily = () => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
};

const isChunkLoadError = (name: string, message: string) => {
  const value = `${name} ${message}`.toLowerCase();
  return (
    value.includes('chunkloaderror') ||
    value.includes('loading chunk') ||
    value.includes('failed to fetch dynamically imported module') ||
    value.includes('importing a module script failed') ||
    value.includes('error loading dynamically imported module')
  );
};

const shouldReloadForChunkError = () => {
  try {
    const attemptedPath = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (attemptedPath === window.location.pathname) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, window.location.pathname);
    return true;
  } catch {
    return false;
  }
};

const reportClientException = (source: 'error' | 'unhandledrejection', reason: unknown) => {
  const name = getErrorName(reason);
  const message = getErrorMessage(reason);
  const isChunkError = isChunkLoadError(name, message);

  if (window.gtag) {
    window.gtag('event', 'client_exception', {
      event_category: 'client_error',
      error_name: truncate(name),
      error_message: truncate(message),
      error_source: source,
      error_kind: isChunkError ? 'chunk_load' : 'runtime',
      page_path: window.location.pathname,
      browser_family: getBrowserFamily(),
      non_interaction: true,
    });
  }

  if (isChunkError && shouldReloadForChunkError()) {
    window.location.reload();
  }
};

export function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientException('error', event.error ?? event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientException('unhandledrejection', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
