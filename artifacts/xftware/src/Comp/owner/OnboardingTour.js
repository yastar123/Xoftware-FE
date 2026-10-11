import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Fab, Tooltip, Stack, Chip, alpha, Collapse } from '@mui/material';
import { CloudOutlined, HelpOutline, SystemUpdateAlt, Close, CheckCircleOutline } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdate } from '@/Context/UpdateContext';

function getTourTarget(selector) {
  if (!selector || selector === 'body') return selector === 'body' ? document.body : null;

  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn('[v0] Ignoring invalid onboarding selector:', selector, error);
    return null;
  }
}

export default function OnboardingTour({ openMenu, setMobileOpen }) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  const { hasUpdate, applyUpdate, dismissUpdate } = useUpdate();

  // Tampilkan popup otomatis saat ada update tersedia
  useEffect(() => {
    if (hasUpdate) {
      setShowUpdatePopup(true);
    }
  }, [hasUpdate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tourSteps = React.useMemo(() => {
    const baseSteps = [
      {
        target: '.tour-step-payment-channel',
        menuKey: 'setting',
        menuSubKey: 'payment-channel',
        title: '1. Atur Channel Pembayaran',
        content: 'Buka menu Pengaturan, lalu pilih submenu Channel Pembayaran. Anda wajib mengatur metode pembayaran ini terlebih dahulu agar pelanggan bisa melakukan transaksi.',
        detailContent: 'Di halaman ini Anda dapat menambahkan metode pembayaran otomatis xoftware pay.',
      },
      {
        target: '.tour-step-product-list',
        menuKey: 'product',
        menuSubKey: 'product-list',
        title: '2. Kelola Produk',
        content: 'Selanjutnya pada menu Product, Anda bisa menambahkan Daftar Produk, Daftar Voucher, hingga mengatur Level Harga untuk pelanggan.',
        detailContent: 'Halaman ini menampilkan seluruh produk Anda. Anda bisa menambah, mengedit, dan mengatur harga produk di sini.',
      },
      {
        target: '.tour-step-bot-wa',
        menuKey: 'bot',
        menuSubKey: 'bot-wa',
        title: '3. Hubungkan Bot WhatsApp',
        content: 'Langkah selanjutnya, buka menu Bot dan pilih Bot WhatsApp. Anda bisa menghubungkan nomor WhatsApp Anda dengan metode Pairing QR Code ataupun Pairing No. HP.',
        detailContent: 'Pada halaman ini, scan QR Code atau gunakan Pairing Code untuk menghubungkan WhatsApp Anda menjadi bot otomatis.',
      },
      {
        target: '.tour-step-bot-telegram',
        menuKey: 'bot',
        menuSubKey: 'bot-telegram',
        title: '4. Hubungkan Bot Telegram',
        content: 'Anda juga dapat menghubungkan Bot Telegram dengan memasukkan token bot dari BotFather di menu Bot Telegram.',
        detailContent: 'Masukkan token bot dari BotFather di halaman ini agar bot Telegram toko Anda dapat segera aktif.',
      },
      {
        target: '.tour-step-layanan',
        menuKey: 'bot',
        menuSubKey: 'layanan',
        title: '5. Informasi Layanan',
        content: 'Untuk informasi lebih lengkap terkait durasi sewa bot Telegram dan WhatsApp serta detail layanan lainnya, Anda dapat melihatnya di menu Informasi Layanan ini.',
        detailContent: 'Halaman ini merangkum sisa durasi masa aktif bot Anda serta informasi paket layanan yang sedang berjalan.',
      },
      {
        target: '.tour-step-webapp',
        menuKey: 'webapp',
        menuSubKey: '',
        title: '6. Kelola WebApp',
        content: 'Anda juga dapat mengatur tampilan dan konfigurasi website toko Anda melalui menu Web App. Sesuaikan tema, media, hingga pengaturan domain khusus Anda di sini.',
        detailContent: 'Di halaman WebApp ini, Anda bisa mengubah banner, warna tema, serta mengatur custom domain untuk website Anda.',
      }
    ];

    let steps = [
      {
        target: 'body',
        title: 'Selamat Datang di Dashboard Owner! 🎉',
        content: 'Mari ikuti panduan singkat ini untuk mengatur sistem bot dan toko Anda agar siap digunakan. Klik Lanjut untuk mulai.',
      }
    ];

    if (isMobile) {
      steps.push({
        target: '.tour-step-hamburger',
        title: 'Buka Navigasi',
        content: 'Klik ikon garis tiga (hamburger) ini untuk membuka menu navigasi di bagian kiri layar.',
        action: 'close_sidebar'
      });

      baseSteps.forEach((bs, index) => {
        steps.push({
          target: bs.target,
          menuKey: bs.menuKey,
          menuSubKey: bs.menuSubKey,
          title: bs.title,
          content: bs.content,
          action: 'open_sidebar'
        });
        steps.push({
          target: 'body',
          menuKey: bs.menuKey,
          menuSubKey: bs.menuSubKey,
          title: `Detail: ${bs.title.replace(/^\d+\.\s/, '')}`,
          content: bs.detailContent,
          action: 'close_sidebar'
        });
      });
    } else {
      baseSteps.forEach((bs) => {
        steps.push({
          target: bs.target,
          menuKey: bs.menuKey,
          menuSubKey: bs.menuSubKey,
          title: bs.title,
          content: bs.content,
        });
      });
    }

    return steps;
  }, [isMobile]);

  const updateRect = useCallback(() => {
    if (!run) return;
    const step = tourSteps[stepIndex];
    if (step.target === 'body') {
      setTargetRect(null);
      return;
    }
    const el = getTourTarget(step.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      let attempt = 0;
      const poll = setInterval(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        attempt++;
        if (attempt > 10) clearInterval(poll);
      }, 50);
    }
  }, [run, stepIndex, tourSteps]);

  useEffect(() => {
    if (run) {
      const step = tourSteps[stepIndex];
      // Jika instruksi mengarah ke menu tertentu, kita bantu buka menu tersebut
      // Buka halaman sesuai menuKey dan menuSubKey
      if (openMenu && typeof openMenu === 'function' && step.menuKey) {
        openMenu(step.menuKey, step.menuSubKey);
      }

      // Kontrol sidebar di mobile
      if (setMobileOpen && typeof window !== 'undefined' && window.innerWidth < 900) {
        if (step.action === 'open_sidebar') {
          setMobileOpen(true);
        } else if (step.action === 'close_sidebar') {
          setMobileOpen(false);
        } else {
          // Default fallback logic jika action tidak diset eksplisit
          if (step.target !== 'body' && step.target !== '.tour-step-hamburger') {
            setMobileOpen(true);
          } else {
            setMobileOpen(false);
          }
        }
      }

      updateRect();

      const handleScrollResize = () => {
        const el = getTourTarget(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
      };

      window.addEventListener('resize', handleScrollResize);
      window.addEventListener('scroll', handleScrollResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollResize);
        window.removeEventListener('scroll', handleScrollResize, true);
      };
    }
  }, [run, stepIndex, openMenu, updateRect, setMobileOpen, tourSteps]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setRun(false);
    setStepIndex(0);
    localStorage.setItem('hasSeenTour', 'true');
    if (setMobileOpen && typeof window !== 'undefined' && window.innerWidth < 900) {
      setMobileOpen(false);
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const currentStep = tourSteps[stepIndex];

  let tooltipStyle = {};
  const tooltipWidth = typeof window !== 'undefined' ? Math.min(340, window.innerWidth - 32) : 340;

  if (targetRect) {
    if (typeof window !== 'undefined') {
      const isBottomHalf = targetRect.top > window.innerHeight / 2;

      if (isBottomHalf) {
        const bottomPos = Math.max(24, window.innerHeight - targetRect.bottom - 16);
        tooltipStyle = {
          position: 'absolute',
          bottom: bottomPos,
          left: targetRect.left + targetRect.width + 24,
        };
      } else {
        const topPos = Math.max(24, targetRect.top - 16);
        tooltipStyle = {
          position: 'absolute',
          top: topPos,
          left: targetRect.left + targetRect.width + 24,
        };
      }

      // Mencegah tooltip keluar dari batas kanan
      if (tooltipStyle.left + tooltipWidth > window.innerWidth) {
        if (isBottomHalf) {
          tooltipStyle = {
            position: 'absolute',
            bottom: Math.max(24, window.innerHeight - targetRect.top + 24),
            left: '50%',
            transform: 'translateX(-50%)',
          };
        } else {
          tooltipStyle = {
            position: 'absolute',
            top: targetRect.top + targetRect.height + 24,
            left: '50%',
            transform: 'translateX(-50%)',
          };
        }
      }
    } else {
      // fallback SSR
      tooltipStyle = {
        position: 'absolute',
        top: targetRect.top,
        left: targetRect.left + targetRect.width + 24,
      };
    }
  } else {
    tooltipStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  return (
    <>
      <AnimatePresence>
        {run && (
          <Box sx={{ position: 'fixed', zIndex: 9999, inset: 0 }}>
            {/* Backdrop penangkap klik */}
            <Box
              sx={{ position: 'absolute', inset: 0, cursor: 'default' }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Overlay / Spotlight */}
            {targetRect ? (
              <Box
                style={{
                  position: 'absolute',
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                  borderRadius: '8px',
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
                  pointerEvents: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Tooltip Content */}
            <Box
              style={{
                ...tooltipStyle,
                zIndex: 10000,
              }}
            >
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: tooltipWidth,
                  pointerEvents: 'auto',
                }}
              >
                <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 12px 40px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: '#6366f1' }} />

                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1, fontSize: '1.1rem', color: '#1e293b' }}>
                    {currentStep.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
                    {currentStep.content}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                      Langkah {stepIndex + 1} dari {tourSteps.length}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {stepIndex > 0 && (
                        <Button size="small" onClick={handleBack} sx={{ textTransform: 'none', color: '#64748b', minWidth: 'auto', px: 1.5, fontWeight: 700 }}>
                          Kembali
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleNext}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, px: 2.5, fontWeight: 700 }}
                      >
                        {stepIndex === tourSteps.length - 1 ? 'Selesai' : 'Lanjut'}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </motion.div>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      {/* ===== Popup notifikasi update versi baru ===== */}
      <AnimatePresence>
        {showUpdatePopup && hasUpdate && (
          <motion.div
            key="update-popup"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: { xs: 80, md: 96 },
              right: 16,
              zIndex: 9997,
            }}
          >
            <Paper
              elevation={6}
              sx={{
                position: 'fixed',
                bottom: { xs: 80, md: 90 },
                right: { xs: 16, md: 24 },
                zIndex: 9997,
                width: { xs: 'calc(100vw - 32px)', sm: 340 },
                maxWidth: 340,
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: alpha('#6366f1', 0.2),
                boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
              }}
            >
              {/* Header strip */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                  px: 2,
                  py: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SystemUpdateAlt sx={{ color: '#fff', fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', letterSpacing: 0.3 }}>
                    Versi Baru Tersedia
                  </Typography>
                </Stack>
                <Box
                  component="button"
                  onClick={() => { setShowUpdatePopup(false); dismissUpdate(); }}
                  sx={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    p: 0.2,
                    borderRadius: 1,
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Close sx={{ fontSize: 16 }} />
                </Box>
              </Box>

              {/* Body */}
              <Box sx={{ px: 2.5, pt: 2, pb: 2.5, bgcolor: 'background.paper' }}>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                  Update siap dipasang
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.5 }}>
                  Pembaruan sistem sudah diunduh dan siap diaktifkan. Pasang sekarang atau tunda untuk nanti.
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => { applyUpdate(); setShowUpdatePopup(false); }}
                    startIcon={<CheckCircleOutline sx={{ fontSize: 16 }} />}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#4f46e5' },
                      fontSize: '0.78rem',
                    }}
                  >
                    Pasang Sekarang
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowUpdatePopup(false)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: alpha('#6366f1', 0.4),
                      color: '#6366f1',
                      fontSize: '0.78rem',
                      '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.05) },
                    }}
                  >
                    Nanti
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Tombol Update (muncul di atas tombol ?) kalau ada update ===== */}
      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            key="update-fab"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Tooltip title="Update tersedia — klik untuk lihat detail" placement="left">
              <Fab
                size="medium"
                onClick={() => setShowUpdatePopup(true)}
                sx={{
                  position: 'fixed',
                  bottom: { xs: 76, md: 84 },
                  right: { xs: 16, md: 24 },
                  zIndex: 9998,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SystemUpdateAlt sx={{ fontSize: 24, color: '#fff' }} />
                  {/* Pulse ring */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      border: '2px solid rgba(16,185,129,0.6)',
                      animation: 'pulse-ring 1.8s ease-out infinite',
                      '@keyframes pulse-ring': {
                        '0%': { transform: 'scale(1)', opacity: 0.8 },
                        '100%': { transform: 'scale(1.7)', opacity: 0 },
                      },
                    }}
                  />
                </Box>
              </Fab>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Tombol panduan (?) ===== */}
      <Tooltip title="Putar Ulang Panduan" placement="left">
        <Fab
          color="primary"
          size="medium"
          onClick={startTour}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            zIndex: 9998,
            bgcolor: '#6366f1',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            '&:hover': {
              bgcolor: '#4f46e5'
            }
          }}
        >
          <HelpOutline sx={{ fontSize: 26 }} />
        </Fab>
      </Tooltip>
    </>
  );
}
