import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Refresh,
  WarningAmber,
  Schedule,
  WifiOff,
} from '@mui/icons-material';
import { useSocket } from '@/Context/SocketContext';

const IDLE_THRESHOLD_MS = 15 * 60 * 1000; // 15 menit

export default function ReloadGuardModal() {
  const { connected, reconnect } = useSocket();

  // Keyboard Reload Guard Modal State
  const [showKeyboardConfirm, setShowKeyboardConfirm] = useState(false);

  // Idle Refresh Modal State (bukan reload — hanya reconnect + refetch)
  const [showIdleRefresh, setShowIdleRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const idleRefreshTimeoutRef = useRef(null);

  // Saat berhasil connect setelah idle, tutup modal
  useEffect(() => {
    if (connected && showIdleRefresh && isRefreshing) {
      setIsRefreshing(false);
      setRefreshDone(true);
      // Tutup modal setelah 1.2 detik (tampilkan pesan berhasil dulu)
      idleRefreshTimeoutRef.current = setTimeout(() => {
        setShowIdleRefresh(false);
        setRefreshDone(false);
      }, 1200);
    }
  }, [connected, showIdleRefresh, isRefreshing]);

  useEffect(() => {
    return () => {
      if (idleRefreshTimeoutRef.current) clearTimeout(idleRefreshTimeoutRef.current);
    };
  }, []);

  // Execute clean reload (user intentional, e.g. dari Keyboard Guard)
  const executeCleanReload = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.location.reload();
  }, []);

  // Reconnect WS + re-fetch data (tanpa reload halaman)
  const handleRefreshSession = useCallback(() => {
    setIsRefreshing(true);
    setRefreshDone(false);
    // Trigger reconnect WS — SocketContext akan reconnect otomatis
    reconnect();
    // Dispatch event agar halaman (owner.js / developer.js) bisa re-fetch API-nya
    window.dispatchEvent(new CustomEvent('xoft-idle-refresh'));
  }, [reconnect]);

  // 1. Keyboard Shortcut Guard (Ctrl+R, Ctrl+Shift+R, Cmd+R, F5)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isReloadShortcut =
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) ||
        e.key === 'F5';

      if (isReloadShortcut) {
        e.preventDefault();
        e.stopPropagation();
        setShowKeyboardConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // 2. Idle / Inactivity Detection (Tab tidak aktif >= 15 menit)
  useEffect(() => {
    let hiddenAt = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenAt) {
          const elapsed = Date.now() - hiddenAt;
          if (elapsed >= IDLE_THRESHOLD_MS) {
            setRefreshDone(false);
            setIsRefreshing(false);
            setShowIdleRefresh(true);
          }
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <>
      {/* --- Modal 1: Keyboard Reload Guard Confirmation --- */}
      <Dialog
        open={showKeyboardConfirm}
        onClose={() => setShowKeyboardConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)',
          },
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha('#f59e0b', 0.12),
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <WarningAmber sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Muat Ulang Halaman?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            Pintasan reload keyboard terdeteksi. Pastikan perubahan atau data Anda sudah disimpan sebelum memuat ulang halaman.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setShowKeyboardConfirm(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={executeCleanReload}
            startIcon={<Refresh />}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Muat Ulang
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Modal 2: Idle — Reconnect WS + Re-fetch (BUKAN full reload) --- */}
      <Dialog
        open={showIdleRefresh}
        disableEscapeKeyDown={isRefreshing}
        onClose={() => {
          if (!isRefreshing) setShowIdleRefresh(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          },
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: refreshDone
                ? alpha('#10b981', 0.12)
                : alpha('#6366f1', 0.12),
              color: refreshDone ? '#10b981' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              transition: 'all 0.3s ease',
            }}
          >
            {isRefreshing ? (
              <CircularProgress size={32} thickness={4} sx={{ color: 'primary.main' }} />
            ) : refreshDone ? (
              <Refresh sx={{ fontSize: 34, color: '#10b981' }} />
            ) : (
              <Schedule sx={{ fontSize: 34 }} />
            )}
          </Box>

          <Typography variant="h6" fontWeight={800} gutterBottom>
            {refreshDone
              ? 'Sesi Diperbarui!'
              : isRefreshing
                ? 'Menghubungkan ulang...'
                : 'Tab Sudah Lama Tidak Aktif'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            {refreshDone
              ? 'Koneksi dan data berhasil diperbarui. Anda bisa melanjutkan.'
              : isRefreshing
                ? 'Sedang memperbarui koneksi dan data toko, harap tunggu sebentar.'
                : 'Tab ini tidak aktif cukup lama. Perbarui koneksi dan data toko tanpa menutup halaman.'}
          </Typography>
        </DialogContent>

        {!refreshDone && (
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'center', gap: 1.5 }}>
            {!isRefreshing && (
              <Button
                variant="outlined"
                onClick={() => setShowIdleRefresh(false)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Nanti
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={isRefreshing}
              onClick={handleRefreshSession}
              startIcon={isRefreshing
                ? <CircularProgress size={16} thickness={5} sx={{ color: 'inherit' }} />
                : <Refresh />
              }
              sx={{
                flex: isRefreshing ? undefined : 1,
                borderRadius: 2,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {isRefreshing ? 'Memperbarui...' : 'Perbarui Sekarang'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
