import React, { createContext, useContext, useState, useEffect } from 'react';

const UpdateContext = createContext({ hasUpdate: false, applyUpdate: () => {} });

export function UpdateProvider({ children }) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingSW, setWaitingSW] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialVersion = null;
    let swRegistration = null;

    const trackWorker = (worker) => {
      if (!worker) return;
      if (worker.state === 'installed' && navigator.serviceWorker?.controller) {
        setWaitingSW(worker);
        setHasUpdate(true);
        return;
      }
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker?.controller) {
          setWaitingSW(worker);
          setHasUpdate(true);
        }
      });
    };

    // Version polling check
    const checkVersionJson = async () => {
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.version) return;

        if (!initialVersion) {
          initialVersion = data.version;
        } else if (data.version !== initialVersion) {
          setHasUpdate(true);
          if (swRegistration) {
            swRegistration.update().catch(() => {});
          }
        }
      } catch {}
    };

    checkVersionJson();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          swRegistration = reg;

          if (reg.waiting && navigator.serviceWorker.controller) {
            setWaitingSW(reg.waiting);
            setHasUpdate(true);
          }

          if (reg.installing) {
            trackWorker(reg.installing);
          }

          reg.addEventListener('updatefound', () => {
            if (reg.installing) {
              trackWorker(reg.installing);
            }
          });

          // Check on focus & visibility
          const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
              checkVersionJson();
            }
          };
          document.addEventListener('visibilitychange', onVisibilityChange);
          window.addEventListener('focus', onVisibilityChange);

          // Periodic check
          const interval = setInterval(() => {
            reg.update().catch(() => {});
            checkVersionJson();
          }, 3 * 60 * 1000);

          return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('focus', onVisibilityChange);
          };
        })
        .catch(() => {});

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const applyUpdate = async () => {
    if (waitingSW) {
      waitingSW.postMessage('SKIP_WAITING');
    } else {
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {}
      }
      window.location.reload();
    }
    setHasUpdate(false);
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  return (
    <UpdateContext.Provider value={{ hasUpdate, applyUpdate, dismissUpdate }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  return useContext(UpdateContext);
}

