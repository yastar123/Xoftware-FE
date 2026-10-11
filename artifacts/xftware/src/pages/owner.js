import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import WifiOff from '@mui/icons-material/WifiOff';
import { useRouter } from 'next/router';
import { reqOwner, reqCheckSession } from '@/lib/requestApi';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardStats from '@/Comp/owner/dashboard';
import TransactionPage from '@/Comp/owner/transaction';
import WithdrawPage from '@/Comp/owner/withdraw';
import ProductManage from '@/Comp/owner/product';
import SettingPage from '@/Comp/owner/setting';
import BotManage from '@/Comp/owner/bot';
import PpobPage from '@/Comp/owner/ppob';
import SmmPage from '@/Comp/owner/smm';
import Cookies from 'js-cookie';
import { useDialogPaper } from '@/Context/DialogPaper';
import { useSocket } from '@/Context/SocketContext';
import Config from '@/config';
import ResumeLoader from '@/Comp/resumeLoader';
import ReloadGuardModal from '@/Comp/ReloadGuardModal';
import UsersManagePage from '@/Comp/owner/user';
import TicketingOwnerPage from '@/Comp/owner/ticketing';
import WebAppPage from '@/Comp/owner/webapp';
import Sidebar from '@/Comp/Sidebar';
import RecapDataOwner from '@/Comp/owner/unduh-data';
import DomainProviderPage from '@/Comp/owner/domainProvider';
import OnboardingTour from '@/Comp/owner/OnboardingTour';

export default function ClientPage() {
  const { socket, connected } = useSocket();
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [dataCheck, setDataCheck] = useState(null);
  const [activeKey, setActiveKey] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return localStorage.getItem('owner') || 'dashboard';
  });
  const [activeSubKey, setActiveSubKey] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('owner-sub') || null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const resumeCallbackRef = React.useRef(null);

  const { openDialogPaper } = useDialogPaper();
  const abort = React.useRef(new AbortController());
  const hasFetchedInitialData = React.useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Keep legacy slash-based hashes out of selector-based preview tooling.
    // Hashes such as #setting/payment-channel are invalid querySelector selectors.
    const currentHash = window.location.hash;
    if (currentHash.includes('/')) {
      const safeHash = currentHash.replaceAll('/', '-');
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${safeHash}`);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get('__access__token__');
    if (!token) {
      router.replace('/login');
      return;
    }

    reqCheckSession('owner')
      .then(result => {
        if (result.code === 401 || result.code === 403 || result.error) {
          router.replace('/login');
        } else {
          setDataCheck(result.data || {});
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    let hiddenAt = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenAt) {
          const elapsed = Date.now() - hiddenAt;
          if (elapsed < 900000) {
            if (typeof resumeCallbackRef.current === 'function') {
              try { resumeCallbackRef.current(); } catch (e) { console.error(e); }
            }
          }
        }
        hiddenAt = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Re-fetch session saat idle refresh dipicu (tanpa reload halaman)
  useEffect(() => {
    const handleIdleRefresh = () => {
      const token = Cookies.get('__access__token__');
      if (!token) {
        router.replace('/login');
        return;
      }
      reqCheckSession('owner')
        .then(result => {
          if (result.code === 401 || result.code === 403 || result.error) {
            router.replace('/login');
          } else {
            setDataCheck(result.data || {});
            if (typeof resumeCallbackRef.current === 'function') {
              try { resumeCallbackRef.current(); } catch (e) { console.error(e); }
            }
          }
        })
        .catch(() => router.replace('/login'));
    };
    window.addEventListener('xoft-idle-refresh', handleIdleRefresh);
    return () => window.removeEventListener('xoft-idle-refresh', handleIdleRefresh);
  }, [router]);

  function triggerAnnounce() {
    reqOwner({ action: 'getAnnouncement' }, { signal: abort.current?.signal })
      .then(res => {
        if (!res.error) {
          openDialogPaper({
            title: res?.data?.title,
            text: res?.data?.text,
            image: res.data.media,
            prelineText: true,
            onConfirm: () => {
              reqOwner({ action: 'setReadAnnouncements', announce_id: res?.data?.id }).catch(() => { });
            },
          });
        }
      })
      .catch(() => { });
  }

  React.useEffect(() => {
    if (!hasFetchedInitialData.current && connected) {
      triggerAnnounce();
      hasFetchedInitialData.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    const handlePopState = (e) => {
      const state = e.state;
      if (state?.key) {
        setActiveKey(state.key);
        setActiveSubKey(state.subKey || null);
        localStorage.setItem('owner', state.key);
        if (state.subKey) localStorage.setItem('owner-sub', state.subKey);
        else localStorage.removeItem('owner-sub');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleMenuClick = useCallback((key, subKey) => {
    setActiveKey(key);
    setActiveSubKey(subKey || null);
    localStorage.setItem('owner', key);
    if (subKey) localStorage.setItem('owner-sub', subKey);
    else localStorage.removeItem('owner-sub');
    window.history.pushState({ key, subKey }, '', `#${key}${subKey ? '-' + subKey : ''}`);
  }, []);

  const handleLogout = useCallback(async () => {
    Cookies.remove('__access__token__');
    router.push('/login');
  }, [router]);

  const setResumeDone = cb => (resumeCallbackRef.current = cb);

  const renderContent = (key, subKey) => {
    switch (key) {
      case 'dashboard':
        return <DashboardStats setOnResumeReady={setResumeDone} />;
      case 'product-list':
        return <ProductManage handleMenuClick={handleMenuClick} activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'product':
        return <ProductManage handleMenuClick={handleMenuClick} activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'user':
        return <UsersManagePage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'transaction':
        return <TransactionPage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'unduh-data':
        return <RecapDataOwner setOnResumeReady={setResumeDone} />;
      case 'withdraw':
        return <WithdrawPage setOnResumeReady={setResumeDone} />;
      case 'bot':
        return <BotManage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'ppob':
        return <PpobPage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'smm':
        return <SmmPage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'webapp':
        return <WebAppPage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'domain-provider':
        return <DomainProviderPage activeSubPage={subKey} setOnResumeReady={setResumeDone} />;
      case 'ticket':
        return <TicketingOwnerPage setOnResumeReady={setResumeDone} />;
      case 'setting':
        return <SettingPage activeSubPage={subKey} />;
      default:
        return <DashboardStats setOnResumeReady={setResumeDone} />;
    }
  };

  if (!dataCheck || (!hasConnectedOnce && !connected)) {
    return (
      <>
        <ResumeLoader />
        <ReloadGuardModal />
      </>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'dark' ? '#07111f' : '#f5f7fb',
      backgroundImage: theme => theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at 78% 0%, rgba(99,102,241,0.12), transparent 28%), radial-gradient(circle at 10% 100%, rgba(14,165,233,0.07), transparent 24%)'
        : 'radial-gradient(circle at 78% 0%, rgba(99,102,241,0.08), transparent 30%), radial-gradient(circle at 10% 100%, rgba(14,165,233,0.06), transparent 24%)',
      backgroundAttachment: 'fixed',
    }}>
      {!connected && hasConnectedOnce && (
        <Box
          sx={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            px: 3,
            py: 1.2,
            borderRadius: 2.5,
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.25)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.9, transform: 'translateX(-50%) scale(1)' },
              '50%': { opacity: 1, transform: 'translateX(-50%) scale(1.02)' },
              '100%': { opacity: 0.9, transform: 'translateX(-50%) scale(1)' },
            },
          }}
        >
          <WifiOff sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>
            Koneksi terputus. Menghubungkan kembali...
          </Typography>
          <Button
            size="small"
            onClick={() => {
              if (socket) {
                socket.disconnect();
                setTimeout(() => socket.connect(), 200);
              }
            }}
            sx={{
              ml: 1,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              textTransform: 'none',
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            Retry
          </Button>
        </Box>
      )}
      <Sidebar
        menuItems={Config.menuItemsOwner}
        activeKey={activeKey}
        activeSubKey={activeSubKey}
        onMenuClick={handleMenuClick}
        localStorageKey="owner"
        onLogout={handleLogout}
        mobileOpenProp={mobileMenuOpen}
        setMobileOpenProp={setMobileMenuOpen}
        sidebarOpenProp={sidebarOpen}
        setSidebarOpenProp={setSidebarOpen}
        ownerVariant
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: activeKey === 'ticket' ? 0 : { xs: 2, sm: 3, md: 4 },
          pt: activeKey === 'ticket' ? 0 : { xs: 2.5, md: 3.5 },
          mt: '56px',
          ml: { md: sidebarOpen ? '264px' : '76px' },
          transition: 'margin-left 0.25s ease',
          minWidth: 0,
          minHeight: 'calc(100vh - 56px)',
          overflow: activeKey === 'ticket' ? 'hidden' : 'auto',
          height: activeKey === 'ticket' ? 'calc(100vh - 56px)' : 'auto',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeKey}-${activeSubKey}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent(activeKey, activeSubKey)}
          </motion.div>
        </AnimatePresence>
      </Box>
        <OnboardingTour 
          openMenu={(key, subKey) => handleMenuClick(key, subKey || '')} 
          setMobileOpen={setMobileMenuOpen}
        />
        <ReloadGuardModal />
    </Box>
  );
}
