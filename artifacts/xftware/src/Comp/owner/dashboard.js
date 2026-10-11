import React, { useEffect, useState, startTransition } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, CircularProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List, ListItemButton, ListItemText, alpha } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';
import { useSocket } from '@/Context/SocketContext';
import { FaWallet, FaClock, FaLock, FaArrowCircleDown, FaBoxOpen, FaExchangeAlt, FaCalendarDay, FaCalendarAlt, FaBullhorn } from 'react-icons/fa';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

export default function DashboardSection() {
  const { connected } = useSocket();
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
  const [cardMenu, setCardMenu] = useState('saldo');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    startTransition(() => {
      const fetchAnnouncements = async () => {
        setAnnLoading(true);
        try { const res = await reqOwner({ action: 'getAllAnnouncements' }); setAnnouncements(res?.data || []); }
        catch { setAnnError('Gagal memuat pengumuman.'); }
        finally { setAnnLoading(false); }
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
    } catch { toast.error('Gagal mengambil detail pengumuman.'); }
  };

  const handleMarkAsRead = async () => {
    if (!selectedAnnouncement?.id) return;
    await reqOwner({ action: 'setReadAnnouncements', announce_id: selectedAnnouncement.id });
    setAnnouncements(prev => prev.map(a => (a.id === selectedAnnouncement.id ? { ...a, is_read: true } : a)));
    setSelectedAnnouncement(prev => ({ ...prev, is_read: true }));
  };

  if (loadingAuth) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;

  const { saldo = 0, set_saldo = 0, lock_saldo = 0, out_saldo = 0, trx_count = 0, product_count = 0, income_today = 0, income_month = 0 } = summary || {};
  const { url = '' } = auth || {};
  const unreadCount = announcements.filter(a => !a.is_read).length;

  const cards = [
    { title: 'Saldo Tersedia', value: idr(saldo), color: '#22C55E', icon: <FaWallet size={22} />, group: 'saldo' },
    { title: 'Saldo Pending', value: idr(set_saldo), color: '#F59E0B', icon: <FaClock size={22} />, group: 'saldo' },
    { title: 'Saldo Terkunci', value: idr(lock_saldo), color: '#EF4444', icon: <FaLock size={22} />, group: 'saldo' },
    { title: 'Saldo Keluar', value: idr(out_saldo), color: '#64748B', icon: <FaArrowCircleDown size={22} />, group: 'saldo' },
    { title: 'Jumlah Produk', value: product_count, color: '#65a30d', icon: <FaBoxOpen size={22} />, group: 'produk' },
    { title: 'Jumlah Transaksi', value: trx_count, color: '#0d9488', icon: <FaExchangeAlt size={22} />, group: 'produk' },
    { title: 'Pendapatan Harian', value: idr(income_today), color: '#4a044e', icon: <FaCalendarDay size={22} />, group: 'pendapatan' },
    { title: 'Pendapatan Bulanan', value: idr(income_month), color: '#86198f', icon: <FaCalendarAlt size={22} />, group: 'pendapatan' },
  ];

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: 'white', boxShadow: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Halo Owner 😘</Typography>
            <Typography fontSize={14} mt={1}>“Kesuksesan bukan soal keberuntungan, tapi soal konsistensi.” 🚀</Typography>
            <Typography fontSize={13} mt={1}>Waktu (now): <b>{currentTime} WIB</b></Typography>
          </Box>
        </Box>
      </motion.div>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '3fr 1fr' }} gap={3} alignItems="flex-start">
        <Box>
          <Card sx={{ borderRadius: 3, mb: 2.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant={cardMenu === 'saldo' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => startTransition(() => setCardMenu('saldo'))}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Saldo
                </Button>
                <Button
                  variant={cardMenu === 'produk' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => startTransition(() => setCardMenu('produk'))}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Produk
                </Button>
                <Button
                  variant={cardMenu === 'pendapatan' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => startTransition(() => setCardMenu('pendapatan'))}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Pendapatan
                </Button>
              </Stack>
              <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}>
                {cards.filter(card => card.group === cardMenu).map((card, i) => (
                  <Card key={i} variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha(card.color, 0.1), color: card.color, display: 'grid', placeItems: 'center' }}>{card.icon}</Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{card.title}</Typography>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: card.color }}>{card.value}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Box mt={4}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Halaman Publik</Typography>
            <Button variant="outlined" size="small" href={url} target="_blank" sx={{ borderRadius: 2, textTransform: 'none' }}>{url}</Button>
          </Box>
        </Box>

        <Box sx={{ order: { xs: 2, md: 1 } }}>
          <Card variant="outlined" sx={{ borderRadius: 3, position: 'sticky', top: 16, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#f97316', 0.1), color: '#f97316', display: 'grid', placeItems: 'center' }}><FaBullhorn size={16} /></Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" fontWeight={700}>Pengumuman</Typography>
                  {unreadCount > 0 && <Typography variant="caption" color="error">{unreadCount} belum dibaca</Typography>}
                </Box>
              </Stack>
              {annLoading ? (
                <Box display="flex" justifyContent="center" py={2}><CircularProgress size={22} /></Box>
              ) : annError ? (
                <Typography variant="body2" color="error">{annError}</Typography>
              ) : announcements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Belum ada pengumuman.</Typography>
              ) : (
                <>
                  <List dense sx={{ maxHeight: 230, overflowY: 'auto', mb: 1.5 }}>
                    {announcements.map(ann => (
                      <ListItemButton key={ann.id} onClick={() => handleOpenAnnouncement(ann.id)} sx={{ borderRadius: 1.5, mb: 0.5, alignItems: 'flex-start', transition: 'all 0.15s', '&:hover': { bgcolor: alpha('#000', 0.02) } }}>
                        <Box flex={1}>
                          <ListItemText primary={ann.title} primaryTypographyProps={{ variant: 'body2', fontWeight: ann.is_read ? 400 : 600, style: { whiteSpace: 'normal', wordBreak: 'break-word' } }} />
                          <ListItemText primary={dateParse(ann.createdAt)} primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} />
                        </Box>
                        {!ann.is_read && <Chip label="Unread" color="error" size="small" sx={{ ml: 1 }} />}
                      </ListItemButton>
                    ))}
                  </List>
                  <Typography variant="caption" color="text.secondary">Klik judul untuk melihat detail</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            {graphView === 'daily' ? 'Grafik Harian (7 Hari)' : 'Grafik Bulanan (3 Bulan)'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant={graphView === 'daily' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setGraphView('daily'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              7 Hari
            </Button>
            <Button
              variant={graphView === 'monthly' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setGraphView('monthly'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              3 Bulan
            </Button>
          </Stack>
        </Stack>
        <Card sx={{ borderRadius: 3, p: 2, border: '1px solid', borderColor: 'divider' }}>
          <LineChart
            height={300}
            xAxis={[{
              data: graphView === 'daily' ? settlementSumGraphDaily.map(i => i.date) : settlementSumGraphMonthly.map(i => i.date),
              scaleType: 'band'
            }]}
            series={[
              {
                data: graphView === 'daily' ? settlementSumGraphDaily.map(i => i.settle) : settlementSumGraphMonthly.map(i => i.settle),
                label: 'Berhasil'
              },
              {
                data: graphView === 'daily' ? settlementSumGraphDaily.map(i => i.unsettle) : settlementSumGraphMonthly.map(i => i.unsettle),
                label: 'Pending'
              },
              {
                data: graphView === 'daily' ? settlementSumGraphDaily.map(i => i.error) : settlementSumGraphMonthly.map(i => i.error),
                label: 'Gagal'
              }
            ]}
          />
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pr: 5 }}>{selectedAnnouncement?.title || 'Pengumuman'}</DialogTitle>
        <IconButton aria-label="close" onClick={() => setDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon fontSize="small" /></IconButton>
        <DialogContent dividers><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{selectedAnnouncement?.message || selectedAnnouncement?.content || selectedAnnouncement?.body || selectedAnnouncement?.text || '-'}</Typography></DialogContent>
        <DialogActions>
          {!selectedAnnouncement?.is_read && <Button onClick={handleMarkAsRead} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Tandai sudah dibaca</Button>}
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Tutup</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}