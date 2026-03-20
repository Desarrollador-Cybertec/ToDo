import { useEffect, useRef, useState } from 'react';

/**
 * Blocks navigation (NavLink, back/forward, programmatic) when `when` is true.
 * Compatible with BrowserRouter (does NOT require a data router).
 * Returns { isBlocked, confirm, cancel } to control a confirmation modal.
 */
export function useNavigationGuard(when: boolean) {
  const [isBlocked, setIsBlocked] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  // Separate bypass flags so confirm() can skip both the pushState AND the popstate handlers
  const bypassPushRef = useRef(false);
  const bypassPopRef  = useRef(false);

  useEffect(() => {
    if (!when) return;

    const originalPush    = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    const interceptPush = (state: unknown, unused: string, url?: string | URL | null) => {
      if (bypassPushRef.current) {
        bypassPushRef.current = false;
        originalPush(state, unused, url);
        return;
      }
      if (url) {
        pendingUrl.current = String(url);
        setIsBlocked(true);
        return;
      }
      originalPush(state, unused, url);
    };

    const interceptReplace = (state: unknown, unused: string, url?: string | URL | null) => {
      if (bypassPushRef.current) {
        bypassPushRef.current = false;
        originalReplace(state, unused, url);
        return;
      }
      if (url) {
        pendingUrl.current = String(url);
        setIsBlocked(true);
        return;
      }
      originalReplace(state, unused, url);
    };

    const onPopState = () => {
      if (bypassPopRef.current) {
        bypassPopRef.current = false;
        return;
      }
      originalPush(history.state, '', window.location.href);
      pendingUrl.current = null;
      setIsBlocked(true);
    };

    history.pushState    = interceptPush    as typeof history.pushState;
    history.replaceState = interceptReplace as typeof history.replaceState;
    window.addEventListener('popstate', onPopState);

    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      history.pushState    = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [when]);

  const confirm = () => {
    setIsBlocked(false);
    const url = pendingUrl.current;
    pendingUrl.current = null;
    if (url) {
      // Bypass both the pushState intercept AND the subsequent synthetic popstate
      bypassPushRef.current = true;
      bypassPopRef.current  = true;
      history.pushState(null, '', url);
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    }
  };

  const cancel = () => {
    setIsBlocked(false);
    pendingUrl.current = null;
  };

  /** Call immediately before an intentional navigate() after successful submit */
  const skip = () => { bypassPushRef.current = true; };

  return { isBlocked, confirm, cancel, skip };
}

