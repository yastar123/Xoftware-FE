import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
  alpha,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
} from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import {
  Add,
  SyncAlt,
  AccountBalanceWallet,
  AccessTime,
  History,
  Payment,
  ArrowForward,
  CheckCircle,
  ErrorOutline,
  Autorenew,
  NotificationsActive,
  ShoppingCart,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';

function msToDuration(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

export default function ServiceInfoPage() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [convertAmount, setConvertAmount] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [openDepositDialog, setOpenDepositDialog] = useState(false);

  // Credit Channel & Tab State
  const [openBuyCreditDialog, setOpenBuyCreditDialog] = useState(false);
  const [buyingCredit, setBuyingCredit] = useState(false);
  const [historyTab, setHistoryTab] = useState(0);

  const [creditHistoryRows, setCreditHistoryRows] = useState([]);
  const [creditHistoryTotal, setCreditHistoryTotal] = useState(0);
  const [creditHistoryPage, setCreditHistoryPage] = useState(1);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);

  useEffect(() => {
    fetchRenewalInfo();
    fetchRenewalHistory(1);
    fetchCreditHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRenewalInfo = async () => {
    try {
      const res = await reqOwner({ action: 'getRenewalInfo' });
      if (res.error) return toast.error(res.message);
      setInfo(res.data);
    } catch {
      toast.error('Gagal mengambil data layanan');
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewalHistory = async (nextPage = 1) => {
    try {
      const res = await reqOwner({ action: 'getRenewalHistory', page: nextPage });
      if (res.error) return toast.error(res.message);
      const newHistory = nextPage === 1 ? res.data.data : [...history, ...res.data.data];
      setHistory(newHistory);
      setHasMore(nextPage < res.data.totalPages);
      setPage(nextPage);
    } catch {
      toast.error('Gagal memuat riwayat layanan');
    }
  };

  const fetchCreditHistory = async (targetPage = 1) => {
    setCreditHistoryLoading(true);
    try {
      const res = await reqOwner({
        action: 'getChannelCreditHistory',
        page: targetPage,
        limit: 10,
      });
      if (!res.error && res.data) {
        setCreditHistoryRows(res.data.rows || []);
        setCreditHistoryTotal(res.data.total || 0);
        setCreditHistoryPage(targetPage);
      }
    } catch {
      toast.error('Gagal memuat riwayat credit notifikasi');
    } finally {
      setCreditHistoryLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!convertAmount || isNaN(convertAmount)) return;
    setConvertLoading(true);
    try {
      const res = await reqOwner({ action: 'convertBalanceToRenewal', amount: parseInt(convertAmount, 10) });
      if (res.error) return toast.error(res.message);
      toast.success(res.message);
      fetchRenewalInfo();
      fetchRenewalHistory(1);
      setConvertAmount('');
    } catch {
      toast.error('Konversi gagal');
    } finally {
      setConvertLoading(false);
    }
  };

  const handleDeposit = async (amount) => {
    setTopupLoading(true);
    try {
      const res = await reqOwner({ action: 'depositRenewalBalance', amount: parseInt(amount, 10) });
      if (res.error) return toast.error(res.message);
      toast.success('Mengalihkan ke pembayaran...');
      window.location.href = res.data.redirect;
    } catch {
      toast.error('Gagal memproses topup');
    } finally {
      setTopupLoading(false);
      setOpenDepositDialog(false);
    }
  };

  const handleBuyCredit = async (amount) => {
    const qty = parseInt(amount, 10);
    if (!qty || isNaN(qty) || qty <= 0) {
      return toast.warning('Jumlah credit minimal 1');
    }
    const cost = qty * (info?.channelNotifPricePerCredit || 25);
    if ((info?.balance || 0) < cost) {
      return toast.error('Saldo layanan tidak mencukupi');
    }

    setBuyingCredit(true);
    try {
      const res = await reqOwner({
        action: 'buyChannelCredit',
        amount: qty,
      });
      if (!res.error) {
        toast.success(res.message || 'Credit berhasil dibeli');
        setOpenBuyCreditDialog(false);
        fetchRenewalInfo();
        fetchCreditHistory(1);
      } else {
        toast.error(res.message || 'Gagal membeli credit');
      }
    } catch {
      toast.error('Terjadi kesalahan saat membeli credit');
    } finally {
      setBuyingCredit(false);
    }
  };

  const calculatedDays = useMemo(() => {
    if (!info?.pricePerDay || !convertAmount) return 0;
    return convertAmount / info.pricePerDay;
  }, [convertAmount, info]);

  const handleQuickSelectDays = (days) => {
    if (!info?.pricePerDay) return;
    setConvertAmount(String(days * info.pricePerDay));
  };

  const handleMaxConvert = () => {
    if (!info?.balance) return;
    setConvertAmount(String(info.balance));
  };

  if (loading || !info) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Memuat informasi layanan...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Informasi Layanan
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kelola saldo layanan, masa aktif bot, dan credit notifikasi.
        </Typography>
      </Box>

      {/* 3 Top Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Saldo Layanan */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              height: '100%',
              boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)',
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, opacity: 0.9 }}>
                  <AccountBalanceWallet fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Saldo Layanan
                  </Typography>
                </Stack>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
                  {idr(info.balance || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Digunakan untuk perpanjangan dan pembelian credit.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="inherit"
                onClick={() => setOpenDepositDialog(true)}
                startIcon={<Add />}
                sx={{
                  mt: 3,
                  color: '#4f46e5',
                  bgcolor: 'white',
                  '&:hover': { bgcolor: alpha('#ffffff', 0.9) },
                  borderRadius: 2,
                  py: 1.2,
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Isi Saldo
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Masa Aktif Bot */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <AccessTime fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Masa Aktif Bot
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  {info.isActive ? (
                    <CheckCircle color="success" sx={{ fontSize: 28 }} />
                  ) : (
                    <ErrorOutline color="error" sx={{ fontSize: 28 }} />
                  )}
                  <Typography variant="h5" fontWeight={800}>
                    {msToDuration(info.activePeriod)}
                  </Typography>
                </Stack>
                <Chip
                  label={info.isActive ? 'Layanan Aktif' : 'Layanan Nonaktif'}
                  color={info.isActive ? 'success' : 'error'}
                  size="small"
                  sx={{ fontWeight: 700, borderRadius: 1 }}
                />
              </Box>

              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha('#6366f1', 0.05), border: '1px solid', borderColor: alpha('#6366f1', 0.1) }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tarif Perpanjangan
                </Typography>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                  {idr(info.pricePerDay || 0)} <Typography component="span" variant="caption" color="text.secondary">/ hari</Typography>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Credit Notifikasi Channel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <NotificationsActive fontSize="small" color="secondary" />
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Credit Notifikasi
                  </Typography>
                </Stack>
                <Typography
                  variant="h3"
                  fontWeight={800}
                  color={(info.channelNotifCredit || 0) > 0 ? 'text.primary' : 'error.main'}
                  sx={{ mb: 0.5 }}
                >
                  {(info.channelNotifCredit || 0).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tarif: {idr(info.channelNotifPricePerCredit || 25)} / pesan terkirim
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenBuyCreditDialog(true)}
                startIcon={<ShoppingCart />}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  py: 1.2,
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Beli Credit
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Perpanjang Masa Aktif */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4, boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#10b981', 0.1), color: '#10b981', display: 'flex' }}>
              <SyncAlt />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Perpanjang Layanan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tukar saldo layanan untuk menambah masa aktif bot.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Pilih Paket Cepat
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {[7, 30, 90, 365].map((days) => (
                  <Chip
                    key={days}
                    label={`${days} Hari`}
                    onClick={() => handleQuickSelectDays(days)}
                    variant={calculatedDays === days ? 'filled' : 'outlined'}
                    color={calculatedDays === days ? 'primary' : 'default'}
                    sx={{ borderRadius: 2, fontWeight: 600, px: 1 }}
                    clickable
                  />
                ))}
                <Chip
                  label="Maksimal Saldo"
                  onClick={handleMaxConvert}
                  variant="outlined"
                  color="secondary"
                  sx={{ borderRadius: 2, fontWeight: 600, px: 1 }}
                  clickable
                />
              </Stack>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Atau Masukkan Nominal Saldo
              </Typography>
              <TextField
                type="number"
                fullWidth
                placeholder="0"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: alpha('#6366f1', 0.04),
                  border: '1px dashed',
                  borderColor: alpha('#6366f1', 0.2),
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" textAlign="center" gutterBottom>
                  Estimasi Penambahan Masa Aktif
                </Typography>
                <Typography variant="h4" fontWeight={800} textAlign="center" color="primary.main" sx={{ mb: 1 }}>
                  {calculatedDays > 0 ? `${calculatedDays.toFixed(1).replace('.0', '')} Hari` : '-'}
                </Typography>
                {calculatedDays > 0 && (
                  <Typography variant="caption" textAlign="center" color="text.secondary" display="block">
                    Sisa saldo: <strong>{idr(Math.max(0, (info?.balance || 0) - parseInt(convertAmount, 10)))}</strong>
                  </Typography>
                )}

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleConvert}
                  disabled={convertLoading || !convertAmount || convertAmount <= 0 || convertAmount > info.balance}
                  endIcon={convertLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                  sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.5 }}
                >
                  Konversi Sekarang
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Riwayat */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Tabs
            value={historyTab}
            onChange={(e, val) => setHistoryTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { whiteSpace: 'nowrap' },
            }}
          >
            <Tab
              icon={<Autorenew fontSize="small" />}
              iconPosition="start"
              label="Riwayat Perpanjangan Layanan"
              sx={{ textTransform: 'none', fontWeight: 700 }}
            />
            <Tab
              icon={<NotificationsActive fontSize="small" />}
              iconPosition="start"
              label="Riwayat Pembelian Credit Notif"
              sx={{ textTransform: 'none', fontWeight: 700 }}
            />
          </Tabs>

          {/* Tab 0: Perpanjangan Bot */}
          {historyTab === 0 && (
            <Box>
              {history.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <History sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                  <Typography color="text.secondary">Belum ada riwayat perpanjangan.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {history.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: alpha('#000', 0.01) },
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Autorenew fontSize="small" color="primary" /> Perpanjangan {msToDuration(item.duration_ms)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.renew_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                          </Typography>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography variant="body2" fontWeight={700}>
                            {idr(item.amount_used)}
                          </Typography>
                          <Chip
                            label={item.status.toUpperCase()}
                            size="small"
                            color={item.status === 'success' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 700, borderRadius: 1 }}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              {hasMore && (
                <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => fetchRenewalHistory(page + 1)}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
                  >
                    Muat Lebih Banyak
                  </Button>
                </Stack>
              )}
            </Box>
          )}

          {/* Tab 1: Riwayat Credit Notif */}
          {historyTab === 1 && (
            <Box>
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fetchCreditHistory(creditHistoryPage)}
                  startIcon={<Refresh />}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Stack>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Waktu</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Biaya</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Saldo Sebelum</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Saldo Sesudah</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sumber</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditHistoryLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : creditHistoryRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Belum ada riwayat pembelian credit.
                        </TableCell>
                      </TableRow>
                    ) : (
                      creditHistoryRows.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            {row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="secondary.main">
                              +{Number(row.credit_amount || 0).toLocaleString('id-ID')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {idr(row.total_cost || 0)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>
                            {idr(row.before_balance || 0)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {idr(row.after_balance || 0)}
                          </TableCell>
                          <TableCell>
                            {row.source === 'web_owner' ? 'Web' : 'Telegram /admin'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {creditHistoryTotal > 10 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Pagination
                    count={Math.ceil(creditHistoryTotal / 10)}
                    page={creditHistoryPage}
                    onChange={(e, p) => fetchCreditHistory(p)}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog Deposit Saldo Layanan */}
      <DepositSaldoDialog
        open={openDepositDialog}
        onClose={() => setOpenDepositDialog(false)}
        onSubmit={handleDeposit}
        loading={topupLoading}
      />

      {/* Dialog Beli Credit Channel */}
      <BuyCreditDialog
        open={openBuyCreditDialog}
        onClose={() => setOpenBuyCreditDialog(false)}
        onSubmit={handleBuyCredit}
        loading={buyingCredit}
        balance={info?.balance || 0}
        pricePerCredit={info?.channelNotifPricePerCredit || 25}
      />
    </Box>
  );
}

function DepositSaldoDialog({ open, onClose, onSubmit, loading }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const handleChange = (val) => {
    setAmount(val);
    if (val < 50000) setError('Minimal deposit Rp 50.000');
    else if (val % 1000 !== 0) setError('Harus kelipatan Rp 1.000');
    else setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex' }}>
            <Payment fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            Isi Saldo Layanan
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {quickAmounts.map((amt) => (
            <Grid item xs={6} key={amt}>
              <Button
                fullWidth
                variant={amount === amt ? 'contained' : 'outlined'}
                onClick={() => handleChange(amt)}
                color={amount === amt ? 'primary' : 'inherit'}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: amount === amt ? 'transparent' : 'divider',
                }}
              >
                {idr(amt)}
              </Button>
            </Grid>
          ))}
        </Grid>

        <TextField
          label="Jumlah Lainnya"
          type="number"
          value={amount}
          onChange={(e) => handleChange(parseInt(e.target.value, 10) || '')}
          fullWidth
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Batal
        </Button>
        <Button
          onClick={() => {
            if (!error && amount) onSubmit(amount);
          }}
          variant="contained"
          disabled={loading || !!error || !amount}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, py: 1 }}
        >
          Lanjutkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BuyCreditDialog({ open, onClose, onSubmit, loading, balance, pricePerCredit }) {
  const [amount, setAmount] = useState(100);
  const quickOptions = [50, 100, 250, 500, 1000];

  const totalCost = (parseInt(amount, 10) || 0) * pricePerCredit;
  const isInsufficient = balance < totalCost;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#ec4899', 0.1), color: '#ec4899', display: 'flex' }}>
            <ShoppingCart fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            Beli Credit Notifikasi
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: alpha('#6366f1', 0.05), border: '1px solid', borderColor: alpha('#6366f1', 0.15) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Saldo Tersedia:</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{idr(balance)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Harga per Credit:</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{idr(pricePerCredit)}</Typography>
          </Stack>
        </Box>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Pilihan Paket
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {quickOptions.map((opt) => (
            <Chip
              key={opt}
              label={`${opt} Credit`}
              onClick={() => setAmount(opt)}
              variant={amount === opt ? 'filled' : 'outlined'}
              color={amount === opt ? 'secondary' : 'default'}
              sx={{ borderRadius: 1.5, fontWeight: 600 }}
              clickable
            />
          ))}
        </Stack>

        <TextField
          label="Jumlah Credit"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
          fullWidth
          InputProps={{ inputProps: { min: 1 } }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Total Pembayaran
          </Typography>
          <Typography variant="h5" fontWeight={800} color="secondary.main">
            {idr(totalCost)}
          </Typography>
        </Box>

        {isInsufficient && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            Saldo layanan tidak mencukupi. Silakan isi saldo terlebih dahulu.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
          Batal
        </Button>
        <Button
          onClick={() => onSubmit(amount)}
          variant="contained"
          color="secondary"
          disabled={loading || isInsufficient || !amount || amount <= 0}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, py: 1 }}
        >
          Konfirmasi Beli
        </Button>
      </DialogActions>
    </Dialog>
  );
}