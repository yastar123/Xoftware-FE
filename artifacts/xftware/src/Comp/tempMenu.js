import { Box, ListItemButton, ListItemText, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const EVT_NAV = 'menutemp:navigate';

function safeGetStored(localMenuName, safeMenuList, fallback) {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(localMenuName);
  if (stored && safeMenuList.some(m => m.key === stored)) return stored;
  return fallback;
}

function getStateKey(e, localMenuName) {
  const st = e?.state;
  if (!st) return null;
  // scope per localMenuName biar ga tabrakan antar MenuTemp
  if (st.__menutemp?.name !== localMenuName) return null;
  return st.__menutemp?.key || null;
}

function replaceHistory(localMenuName, key) {
  if (typeof window === 'undefined') return;
  try {
    window.history.replaceState(
      { ...(window.history.state || {}), __menutemp: { name: localMenuName, key } },
      '',
      window.location.href // URL tetap sama (nggak berubah di address bar)
    );
  } catch {}
}

function pushHistory(localMenuName, key) {
  if (typeof window === 'undefined') return;
  try {
    window.history.pushState(
      { ...(window.history.state || {}), __menutemp: { name: localMenuName, key } },
      '',
      window.location.href // URL tetap sama
    );
  } catch {}
}

export default function MenuTemp({ menuList = [], defaultNotFound = <Typography variant="caption">Halaman masih dalam tahap pengembangan</Typography>, defaultActiveMenu = 'home', localMenuName = 'owner' }) {
  const validMenuList = useMemo(() => {
    return Array.isArray(menuList) ? menuList.filter(m => m && typeof m.key === 'string' && typeof m.label === 'string' && (typeof m.action === 'function' || m.action != null)) : [];
  }, [menuList]);

  const safeMenuList = useMemo(() => {
    return validMenuList.length > 0
      ? validMenuList
      : [
          {
            key: 'default',
            label: 'Default Menu',
            action: (
              <Typography variant="body2" color="text.secondary">
                Default Action
              </Typography>
            ),
          },
        ];
  }, [validMenuList]);

  const isValidKey = useCallback(k => !!k && safeMenuList.some(m => m.key === k), [safeMenuList]);

  const resolveInitial = useCallback(() => {
    // 1) history.state -> 2) localStorage -> 3) default
    if (typeof window !== 'undefined') {
      const hk = window.history.state?.__menutemp?.name === localMenuName ? window.history.state?.__menutemp?.key : null;
      if (isValidKey(hk)) return hk;
    }

    const fallback = isValidKey(defaultActiveMenu) ? defaultActiveMenu : safeMenuList[0]?.key;

    return safeGetStored(localMenuName, safeMenuList, fallback);
  }, [defaultActiveMenu, isValidKey, localMenuName, safeMenuList]);

  const [activePage, setActivePage] = useState(resolveInitial);

  const navigate = useCallback(
    (key, opts = { push: true }) => {
      if (!isValidKey(key)) return;

      setActivePage(key);

      if (typeof window !== 'undefined') {
        localStorage.setItem(localMenuName, key);

        // push/back support tanpa ubah URL
        if (opts?.push === false) replaceHistory(localMenuName, key);
        else pushHistory(localMenuName, key);
      }
    },
    [isValidKey, localMenuName]
  );

  // init: sync state + ensure history has initial (tanpa nambah entry)
  useEffect(() => {
    const init = resolveInitial();
    setActivePage(init);

    if (typeof window !== 'undefined') {
      localStorage.setItem(localMenuName, init);
      replaceHistory(localMenuName, init);
    }
  }, [resolveInitial, localMenuName]);

  // back/forward handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPop = e => {
      const k = getStateKey(e, localMenuName);
      if (isValidKey(k)) {
        setActivePage(k);
        localStorage.setItem(localMenuName, k);
        return;
      }

      // fallback kalau state kosong
      const stored = localStorage.getItem(localMenuName);
      if (isValidKey(stored)) setActivePage(stored);
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isValidKey, localMenuName]);

  // allow navigation from other components without reload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onNav = e => {
      const d = e?.detail || {};
      if (d.localMenuName && d.localMenuName !== localMenuName) return;
      if (d.key) navigate(d.key, { push: true });
    };

    window.addEventListener(EVT_NAV, onNav);
    return () => window.removeEventListener(EVT_NAV, onNav);
  }, [localMenuName, navigate]);

  const activeAction = safeMenuList.find(f => f.key === activePage)?.action ?? defaultNotFound;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: { md: 'calc(100vh - 64px)' },
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: '100%', md: 300 },
          borderRight: { md: '1px solid #eee' },
          borderBottom: { xs: '1px solid #eee', md: 'none' },
          bgcolor: '#f9f9fb',
          p: 2,
          height: { xs: 'auto', md: '100vh' },
          position: { xs: 'static', md: 'sticky' },
          top: { xs: 'auto', md: 0 },
        }}
      >
        {safeMenuList.map(({ key, label }) => (
          <ListItemButton
            key={key}
            selected={activePage === key}
            onClick={() => navigate(key, { push: true })}
            sx={{
              borderRadius: 2,
              mb: 1,
              backgroundColor: activePage === key ? alpha('#6366F1', 0.08) : 'transparent',
              '&:hover': { backgroundColor: alpha('#6366F1', 0.04) },
            }}
          >
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontWeight: activePage === key ? 600 : 400,
                color: activePage === key ? '#6366F1' : '#333',
              }}
            />
          </ListItemButton>
        ))}
      </Box>

      {/* Konten */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: t => t.palette.background.default,
          display: 'flex',
          justifyContent: 'center',
          p: { xs: 2, sm: 3 },
          width: '100%',
          overflowX: { xs: 'hidden', md: 'auto' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '1100px' }}>
          <motion.div key={activePage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {typeof activeAction === 'function' ? activeAction() : activeAction}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
