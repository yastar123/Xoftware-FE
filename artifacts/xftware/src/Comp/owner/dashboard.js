import React, { useEffect, useState, startTransition, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItemButton, ListItemText, Tooltip, useTheme, alpha
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';
import { useSocket } from '@/Context/SocketContext';
import {
  FaWallet, FaClock, FaLock, FaArrowCircleDown, FaBoxOpen,
  FaExchangeAlt, FaCalendarDay, FaCalendarAlt, FaBullhorn,
  FaExternalLinkAlt, FaCopy, FaCheck, FaChartLine, FaShieldAlt,
  FaArrowUp, FaBell
} from 'react-icons/fa';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

export default function DashboardSection() {
  const { connected } = useSocket();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [auth, setAuth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [settlementSumGraphDaily, setSettlementSumGraphDaily] = useState([]);
  const [settlementSumGraphMonthly, setSettlementSumGraphMonthly] = useState([]);
  const [dashStep, setDashStep] = useState('summary');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [annError, setAnnError] = useState('');
  const [graphView, setGraphView] = useState('daily');
  const [cardCategory, setCardCategory] = useState('all');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Real-time clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Time-aware greeting
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Sequential data loading
  useEffect(() => {
    startTransition(() => {
      if (!connected) return;
      let cancelled = false;
      const run = async () => {
        try {
          if (dashStep === 'summary') {
            const res = await reqOwner({ action: 'dash.summary' });
            if (cancelled) return;
            if (res?.error) {
              console.error('[Dashboard] Error dash.summary:', res.message);
              return;
            }
            setSummary(res?.data || {});
            setDashStep('auth');
            return;
          }
          if (dashStep === 'auth') {
            const res = await reqOwner({ action: 'dash.auth' });
            if (cancelled) return;
            if (res?.error) {
              console.error('[Dashboard] Error dash.auth:', res.message);
              return;
            }
            setAuth(res?.data || {});
            setLoadingAuth(false);
            setDashStep('daily');
            return;
          }
          if (dashStep === 'daily') {
            const res = await reqOwner({ action: 'dash.graph.daily' });
            if (cancelled) return;
            if (res?.error) {
              console.error('[Dashboard] Error dash.graph.daily:', res.message);
              return;
            }
            setSettlementSumGraphDaily(res?.data || []);
            setDashStep('monthly');
            return;
          }
          if (dashStep === 'monthly') {
            const res = await reqOwner({ action: 'dash.graph.monthly' });
            if (cancelled) return;
            if (res?.error) {
              console.error('[Dashboard] Error dash.graph.monthly:', res.message);
              return;
            }
            setSettlementSumGraphMonthly(res?.data || []);
            setDashStep('done');
            return;
          }
        } catch (e) {
          console.error('[Dashboard] Fetch Error:', e);
          toast.error('Gagal memuat data dashboard');
        }
      };
      run();
      return () => { cancelled = true; };
    });
  }, [dashStep, connected]);

  // Load announcements
  useEffect(() => {
    startTransition(() => {
      const fetchAnnouncements = async () => {
        setAnnLoading(true);
        try {
          const res = await reqOwner({ action: 'getAllAnnouncements' });
          setAnnouncements(res?.data || []);
        } catch {
          setAnnError('Gagal memuat pengumuman.');
        } finally {
          setAnnLoading(false);
        }
      };
      fetchAnnouncements();
    });
  }, []);

  const handleOpenAnnouncement = async announceId => {
    try {
      const res = await reqOwner({ action: 'getAnnouncement', announce_id: announceId });
      const fromList = announcements.find(a => a.id === announceId);
      setSelectedAnnouncement({ ...res?.data, is_read: fromList?.is_read });
      setDialogOpen(true);
    } catch {
      toast.error('Gagal mengambil detail pengumuman.');
    }
  };

  const handleMarkAsRead = async () => {
    if (!selectedAnnouncement?.id) return;
    await reqOwner({ action: 'setReadAnnouncements', announce_id: selectedAnnouncement.id });
    setAnnouncements(prev => prev.map(a => (a.id === selectedAnnouncement.id ? { ...a, is_read: true } : a)));
    setSelectedAnnouncement(prev => ({ ...prev, is_read: true }));
  };

  const handleCopyUrl = (urlToCopy) => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(true);
    toast.success('Tautan toko disalin ke clipboard');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  if (loadingAuth && !summary) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <CircularProgress size={36} sx={{ color: '#6366F1' }} />
        <Typography variant="body2" color="text.secondary">
          Menyiapkan metrik dan analisis dashboard...
        </Typography>
      </Box>
    );
  }

  const {
    saldo = 0,
    set_saldo = 0,
    lock_saldo = 0,
    out_saldo = 0,
    trx_count = 0,
    product_count = 0,
    income_today = 0,
    income_month = 0
  } = summary || {};

  const publicUrl = auth?.url || 'https://xoftware.id';
  const unreadCount = announcements.filter(a => !a.is_read).length;

  // Chart statistics summary
  const activeGraphData = graphView === 'daily' ? settlementSumGraphDaily : settlementSumGraphMonthly;
  const chartTotals = useMemo(() => {
    const list = activeGraphData || [];
    return {
      settle: list.reduce((acc, curr) => acc + (Number(curr?.settle) || 0), 0),
      unsettle: list.reduce((acc, curr) => acc + (Number(curr?.unsettle) || 0), 0),
      error: list.reduce((acc, curr) => acc + (Number(curr?.error) || 0), 0),
    };
  }, [activeGraphData]);

  // Executive Core Metric Cards
  const vitals = [
    {
      id: 'income_today',
      title: 'Pendapatan Hari Ini',
      value: idr(income_today),
      subtitle: 'Omzet penjualan harian',
      color: '#10B981',
      icon: <FaCalendarDay size={20} />,
      category: 'finance'
    },
    {
      id: 'income_month',
      title: 'Pendapatan Bulan Ini',
      value: idr(income_month),
      subtitle: 'Akumulasi bulan berjalan',
      color: '#6366F1',
      icon: <FaCalendarAlt size={20} />,
      category: 'finance'
    },
    {
      id: 'trx_count',
      title: 'Transaksi Diproses',
      value: Number(trx_count).toLocaleString('id-ID'),
      subtitle: 'Total pesanan tervalidasi',
      color: '#06B6D4',
      icon: <FaExchangeAlt size={20} />,
      category: 'ops'
    },
    {
      id: 'product_count',
      title: 'Katalog Produk Aktif',
      value: Number(product_count).toLocaleString('id-ID'),
      subtitle: 'Produk digital siap jual',
      color: '#8B5CF6',
      icon: <FaBoxOpen size={20} />,
      category: 'ops'
    },
  ];

  const filteredVitals = cardCategory === 'all'
    ? vitals
    : vitals.filter(v => v.category === cardCategory);

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Header / Command Center Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          className="owner-welcome"
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, #131B2E 0%, #1E293B 100%)'
              : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            color: '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)',
            boxShadow: isDark
              ? '0 12px 36px rgba(0,0,0,0.45)'
              : '0 16px 40px rgba(67,56,202,0.22)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2.5,
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.75}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase'
                }}
              >
                Pusat Kendali Bisnis
              </Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
              <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 600, fontSize: '0.72rem' }}>
                ● Sistem Aktif
              </Typography>
            </Stack>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              {greetingText}, Owner
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                mt: 0.5,
                fontSize: { xs: '0.85rem', md: '0.92rem' }
              }}
            >
              Kelola pembayaran instan, katalog digital, dan pemantauan transaksi terpadu.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            alignItems="center"
            spacing={1.5}
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', fontSize: '0.7rem' }}>
                WAKTU SERVER (WIB)
              </Typography>
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {currentTime || '00:00:00 WIB'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </motion.div>

      {/* 2. Main Executive Grid: Balance Hero + Announcements */}
      <Box
        className="owner-dashboard-layout"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.6fr 0.8fr' },
          gap: { xs: 2.5, md: 3 },
          alignItems: 'start',
          mb: 3
        }}
      >
        {/* Left Column: Hero Balance & Financial Vitals */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Primary Balance Card */}
          <Card
            variant="outlined"
            className="owner-metric-panel"
            sx={{
              borderRadius: '18px',
              bgcolor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              boxShadow: isDark
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(15,23,42,0.04)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    letterSpacing="0.08em"
                    sx={{ textTransform: 'uppercase', fontSize: '0.72rem' }}
                  >
                    Saldo Tersedia (Siap Ditarik)
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      color: isDark ? '#34D399' : '#059669',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.03em',
                      mt: 0.5,
                      fontSize: { xs: '1.85rem', sm: '2.4rem' }
                    }}
                  >
                    {idr(saldo)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha('#10B981', 0.12),
                    color: '#10B981'
                  }}
                >
                  <FaWallet size={22} />
                </Box>
              </Stack>

              {/* Sub-Balances Ribbon */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 1.5,
                  p: 1.75,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
                  mb: 2.5
                }}
              >
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                    <Box sx={{ color: '#F59E0B' }}><FaClock size={12} /></Box>
                    <Typography variant="caption" color="text.secondary" fontSize="0.75rem" fontWeight={500}>
                      Saldo Pending
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', color: '#F59E0B' }}>
                    {idr(set_saldo)}
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                    <Box sx={{ color: '#EF4444' }}><FaLock size={12} /></Box>
                    <Typography variant="caption" color="text.secondary" fontSize="0.75rem" fontWeight={500}>
                      Saldo Terkunci
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', color: '#EF4444' }}>
                    {idr(lock_saldo)}
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                    <Box sx={{ color: '#64748B' }}><FaArrowCircleDown size={12} /></Box>
                    <Typography variant="caption" color="text.secondary" fontSize="0.75rem" fontWeight={500}>
                      Saldo Keluar
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                    {idr(out_saldo)}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  href="#withdraw"
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#6366F1',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
                    '&:hover': { bgcolor: '#4F46E5' },
                    px: 2.5,
                    py: 1
                  }}
                >
                  Tarik Penghasilan
                </Button>
                <Button
                  variant="outlined"
                  href="#transaction-mutation-pay"
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                    color: isDark ? '#E2E8F0' : '#334155',
                    '&:hover': { borderColor: '#6366F1' },
                    px: 2.5,
                    py: 1
                  }}
                >
                  Mutasi QRIS
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Vitals & KPIs Filter + Grid */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Performa Operasional & Penjualan
              </Typography>

              {/* Segmented Category Filter */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  p: 0.5,
                  borderRadius: '10px',
                  bgcolor: isDark ? '#1F2937' : '#F1F5F9',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'
                }}
              >
                <Button
                  size="small"
                  onClick={() => setCardCategory('all')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    minHeight: 30,
                    bgcolor: cardCategory === 'all' ? (isDark ? '#374151' : '#FFFFFF') : 'transparent',
                    color: cardCategory === 'all' ? (isDark ? '#F9FAFB' : '#0F172A') : 'text.secondary',
                    boxShadow: cardCategory === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    '&:hover': { bgcolor: isDark ? '#374151' : '#FFFFFF' }
                  }}
                >
                  Semua
                </Button>
                <Button
                  size="small"
                  onClick={() => setCardCategory('finance')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    minHeight: 30,
                    bgcolor: cardCategory === 'finance' ? (isDark ? '#374151' : '#FFFFFF') : 'transparent',
                    color: cardCategory === 'finance' ? (isDark ? '#F9FAFB' : '#0F172A') : 'text.secondary',
                    boxShadow: cardCategory === 'finance' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    '&:hover': { bgcolor: isDark ? '#374151' : '#FFFFFF' }
                  }}
                >
                  Keuangan
                </Button>
                <Button
                  size="small"
                  onClick={() => setCardCategory('ops')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    minHeight: 30,
                    bgcolor: cardCategory === 'ops' ? (isDark ? '#374151' : '#FFFFFF') : 'transparent',
                    color: cardCategory === 'ops' ? (isDark ? '#F9FAFB' : '#0F172A') : 'text.secondary',
                    boxShadow: cardCategory === 'ops' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    '&:hover': { bgcolor: isDark ? '#374151' : '#FFFFFF' }
                  }}
                >
                  Katalog & Order
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}
            >
              {filteredVitals.map((item, idx) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  className="owner-stat-card"
                  sx={{
                    borderRadius: '16px',
                    bgcolor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDark
                        ? '0 8px 24px rgba(0,0,0,0.35)'
                        : '0 8px 24px rgba(15,23,42,0.06)',
                      borderColor: alpha(item.color, 0.3)
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(item.color, 0.12),
                          color: item.color,
                          flexShrink: 0
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} fontSize="0.75rem" noWrap>
                          {item.title}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          sx={{
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.02em',
                            color: isDark ? '#F9FAFB' : '#0F172A',
                            mt: 0.25,
                            fontSize: '1.25rem'
                          }}
                        >
                          {item.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          {item.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Public Storefront Banner */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: '16px',
              p: 2.5,
              bgcolor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.06em">
                ETALASE DIGITAL PUBLIK
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.25 }}>
                Toko & Portal Pembeli Anda
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Pelanggan mengakses katalog produk dan pembayaran otomatis melalui alamat ini.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleCopyUrl(publicUrl)}
                startIcon={copiedUrl ? <FaCheck size={12} /> : <FaCopy size={12} />}
                sx={{
                  borderRadius: '9px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                  color: isDark ? '#E2E8F0' : '#334155',
                  py: 0.8
                }}
              >
                {copiedUrl ? 'Tersalin' : 'Salin URL'}
              </Button>
              <Button
                variant="contained"
                size="small"
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                endIcon={<FaExternalLinkAlt size={11} />}
                sx={{
                  borderRadius: '9px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  bgcolor: '#6366F1',
                  '&:hover': { bgcolor: '#4F46E5' },
                  py: 0.8
                }}
              >
                Kunjungi Toko
              </Button>
            </Stack>
          </Card>
        </Box>

        {/* Right Column: Executive Announcement Feed */}
        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 84 } }}>
          <Card
            variant="outlined"
            className="owner-announcements"
            sx={{
              borderRadius: '18px',
              bgcolor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(15,23,42,0.04)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha('#F97316', 0.12),
                      color: '#F97316'
                    }}
                  >
                    <FaBullhorn size={16} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Pengumuman
                  </Typography>
                </Stack>

                {unreadCount > 0 ? (
                  <Chip
                    label={`${unreadCount} baru`}
                    size="small"
                    sx={{
                      bgcolor: alpha('#EF4444', 0.1),
                      color: '#EF4444',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 24,
                      borderRadius: '6px'
                    }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                    Semua terbaca
                  </Typography>
                )}
              </Stack>

              {annLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={24} sx={{ color: '#6366F1' }} />
                </Box>
              ) : annError ? (
                <Typography variant="body2" color="error" py={2}>
                  {annError}
                </Typography>
              ) : announcements.length === 0 ? (
                <Box py={4} textAlign="center">
                  <FaBell size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada pengumuman terbaru saat ini.
                  </Typography>
                </Box>
              ) : (
                <>
                  <List dense sx={{ maxHeight: 340, overflowY: 'auto', p: 0 }}>
                    {announcements.map((ann, index) => (
                      <ListItemButton
                        key={ann.id || index}
                        onClick={() => handleOpenAnnouncement(ann.id)}
                        sx={{
                          borderRadius: '12px',
                          mb: 1,
                          p: 1.5,
                          alignItems: 'flex-start',
                          bgcolor: ann.is_read
                            ? 'transparent'
                            : (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'),
                          border: '1px solid',
                          borderColor: ann.is_read
                            ? (isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9')
                            : alpha('#6366F1', 0.2),
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                            borderColor: '#6366F1'
                          }
                        }}
                      >
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
                            {!ann.is_read && (
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366F1' }} />
                            )}
                            <Typography
                              variant="body2"
                              fontWeight={ann.is_read ? 500 : 700}
                              sx={{
                                color: isDark ? '#F9FAFB' : '#0F172A',
                                wordBreak: 'break-word',
                                fontSize: '0.85rem'
                              }}
                            >
                              {ann.title}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" fontSize="0.72rem">
                            {dateParse(ann.createdAt)}
                          </Typography>
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    textAlign="center"
                    mt={1.5}
                    fontSize="0.72rem"
                  >
                    Klik item untuk membaca pengumuman selengkapnya
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 3. Transaction Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <Card
          variant="outlined"
          className="owner-chart-card"
          sx={{
            borderRadius: '18px',
            bgcolor: isDark ? '#111827' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(15,23,42,0.04)',
            p: { xs: 2.25, md: 3 }
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={2}
            mb={2.5}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha('#6366F1', 0.12),
                    color: '#6366F1'
                  }}
                >
                  <FaChartLine size={18} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Tren & Performa Transaksi
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {graphView === 'daily' ? 'Distribusi harian 7 hari terakhir' : 'Distribusi bulanan 3 bulan terakhir'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Range Toggle */}
            <Stack
              direction="row"
              spacing={0.5}
              className="owner-chart-tabs"
              sx={{
                p: 0.5,
                borderRadius: '10px',
                bgcolor: isDark ? '#1F2937' : '#F1F5F9',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'
              }}
            >
              <Button
                variant={graphView === 'daily' ? 'contained' : 'text'}
                size="small"
                onClick={() => startTransition(() => setGraphView('daily'))}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.6,
                  bgcolor: graphView === 'daily' ? '#6366F1' : 'transparent',
                  color: graphView === 'daily' ? '#FFFFFF' : 'text.secondary',
                  '&:hover': { bgcolor: graphView === 'daily' ? '#4F46E5' : 'transparent' }
                }}
              >
                7 Hari
              </Button>
              <Button
                variant={graphView === 'monthly' ? 'contained' : 'text'}
                size="small"
                onClick={() => startTransition(() => setGraphView('monthly'))}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  px: 2,
                  py: 0.6,
                  bgcolor: graphView === 'monthly' ? '#6366F1' : 'transparent',
                  color: graphView === 'monthly' ? '#FFFFFF' : 'text.secondary',
                  '&:hover': { bgcolor: graphView === 'monthly' ? '#4F46E5' : 'transparent' }
                }}
              >
                3 Bulan
              </Button>
            </Stack>
          </Stack>

          {/* Quick Metrics Bar Above Chart */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(3, 1fr)' },
              gap: 1.5,
              mb: 2.5,
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#6366F1', fontWeight: 600 }}>
                ● Berhasil
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.1rem' }}>
                {chartTotals.settle}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                ● Pending
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.1rem' }}>
                {chartTotals.unsettle}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                ● Gagal
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.1rem' }}>
                {chartTotals.error}
              </Typography>
            </Box>
          </Box>

          {/* Chart Display */}
          <Box sx={{ width: '100%', minHeight: 300 }}>
            {activeGraphData && activeGraphData.length > 0 ? (
              <LineChart
                height={300}
                xAxis={[{
                  data: activeGraphData.map(i => i.date || ''),
                  scaleType: 'band'
                }]}
                series={[
                  {
                    data: activeGraphData.map(i => Number(i.settle) || 0),
                    label: 'Berhasil',
                    color: '#6366F1',
                    curve: 'natural'
                  },
                  {
                    data: activeGraphData.map(i => Number(i.unsettle) || 0),
                    label: 'Pending',
                    color: '#F59E0B',
                    curve: 'natural'
                  },
                  {
                    data: activeGraphData.map(i => Number(i.error) || 0),
                    label: 'Gagal',
                    color: '#EF4444',
                    curve: 'natural'
                  }
                ]}
                sx={{
                  '.MuiLineElement-root': {
                    strokeWidth: 2.5
                  },
                  '.MuiChartsAxis-tickLabel': {
                    fill: isDark ? '#94A3B8' : '#64748B',
                    fontSize: '0.75rem'
                  }
                }}
              />
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height={280}
                gap={1}
              >
                <FaChartLine size={32} style={{ opacity: 0.2 }} />
                <Typography variant="body2" color="text.secondary">
                  Menunggu data grafik transaksi dari server...
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </motion.div>

      {/* Announcement Detail Reader Modal */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#1E293B' : '#FFFFFF',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700, fontSize: '1.2rem' }}>
          {selectedAnnouncement?.title || 'Pengumuman'}
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setDialogOpen(false)}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
          <Typography variant="body2" color="text.secondary" mb={2} fontSize="0.75rem">
            Diterbitkan: {dateParse(selectedAnnouncement?.createdAt)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              color: isDark ? '#E2E8F0' : '#1E293B'
            }}
          >
            {selectedAnnouncement?.message ||
              selectedAnnouncement?.content ||
              selectedAnnouncement?.body ||
              selectedAnnouncement?.text ||
              '-'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {!selectedAnnouncement?.is_read && (
            <Button
              onClick={handleMarkAsRead}
              variant="contained"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#6366F1',
                '&:hover': { bgcolor: '#4F46E5' }
              }}
            >
              Tandai Sudah Dibaca
            </Button>
          )}
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
              color: isDark ? '#E2E8F0' : '#334155'
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
