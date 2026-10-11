import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Card, TextField, Stack, Pagination,
  IconButton, Typography, Chip, Skeleton, Button, MenuItem,
  Grid, CardContent, CircularProgress, Alert, Divider,
  Tabs, Tab, Tooltip, alpha, InputAdornment, List,
  ListItemText, ListItem, ListItemAvatar, ListItemIcon,
  Collapse
} from '@mui/material';
import {
  RemoveRedEye, Refresh, TrendingUp, TrendingDown,
  AccountBalanceWallet, AddCard, Storefront, Receipt,
  Search, Info, Inventory2, AttachMoney, ArrowUpward,
  ArrowDownward, SouthWest, NorthEast, Schedule
} from '@mui/icons-material';
import { startTransition } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { reqOwner } from '@/lib/requestApi';
import { dateParse, idr } from '@/lib/helper';
import { useDialog } from '@/Context/Dialog';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const STATUS_COLOR = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  fail: 'error',
};

function Aborter() {
  const c = new AbortController();
  c.abort = c.abort.bind(c);
  return c;
}

function renderSkeletonRow(colCount = 11) {
  return [...Array(8)].map((_, i) => (
    <TableRow key={`sk-${i}`}>
      {Array.from({ length: colCount }).map((_, j) => (
        <TableCell align="center" key={j}>
          <Skeleton variant="text" width="75%" height={18} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function ResellerBalanceCard({ onDeposit }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      setRefreshing(true);
      const d = await reqOwner({ action: 'getResellerSaldoInfo' });
      if (d?.data && typeof d.data.balance !== 'undefined') setBalance(Number(d.data.balance) || 0);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { startTransition(() => fetchBalance()); }, []);

  return (
    <Card
      sx={{
        borderRadius: 3, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#FFF',
      }}
    >
      <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
      <Box sx={{ position: 'absolute', bottom: -20, left: 60, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', py: 2.5, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '16px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #e94560, #c23616)', boxShadow: '0 8px 24px rgba(233,69,96,0.35)', flex: '0 0 auto' }}>
            <AccountBalanceWallet sx={{ fontSize: 26 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1, fontSize: 10 }}>RESELLER BALANCE</Typography>
            <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, fontSize: { xs: 'clamp(20px, 5vw, 28px)', sm: 'clamp(22px, 3vw, 32px)' }, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={loading ? '' : idr(balance)}>
              {loading ? <Skeleton width={140} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /> : idr(balance)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh"><span><IconButton onClick={fetchBalance} disabled={refreshing} color="inherit" size="small">{refreshing ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Refresh />}</IconButton></span></Tooltip>
          <Button variant="contained" startIcon={<AddCard />} onClick={() => onDeposit({ onSettled: fetchBalance })} sx={{ borderRadius: 2, px: 2.5, minWidth: 110, fontWeight: 600, background: 'linear-gradient(135deg, #e94560, #c23616)', boxShadow: '0 4px 16px rgba(233,69,96,0.4)', textTransform: 'none', '&:hover': { background: 'linear-gradient(135deg, #d63851, #b02e14)', boxShadow: '0 6px 20px rgba(233,69,96,0.5)' } }}>
            Deposit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DepositResellerDialog({ onClose, onSettled }) {
  const [amount, setAmount] = useState(50000);
  const [loading, setLoading] = useState(false);
  const presets = [50000, 100000, 200000, 500000, 1000000];

  const submit = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'depositReseller', amount });
      if (res?.error) { toast.error(res.message || 'Gagal membuat deposit'); setLoading(false); return; }
      toast.success(res.message || 'Pembelian telah diproses!');
      onClose?.(); onSettled?.();
      const redirect = res?.data?.redirect;
      if (redirect) window.location.href = redirect;
    } catch (e) { toast.error(e?.message || 'Gagal membuat deposit'); }
    setLoading(false);
  };

  return (
    <Box sx={{ minWidth: 320 }}>
      <Stack spacing={2}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>Minimal deposit <b>Rp 20.000</b> • Kelipatan <b>Rp 1.000</b></Alert>
        <Typography variant="subtitle2" fontWeight={600}>Nominal Cepat:</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {presets.map(p => (
            <Chip key={p} label={idr(p)} variant={amount === p ? 'filled' : 'outlined'} color={amount === p ? 'primary' : 'default'} onClick={() => setAmount(p)} sx={{ cursor: 'pointer', fontWeight: amount === p ? 600 : 400, transition: 'all 0.15s' }} />
          ))}
        </Stack>
        <TextField label="Jumlah Deposit" type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || '0'))} fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
        <Button variant="contained" onClick={submit} disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddCard sx={{ fontSize: 16 }} />} sx={{ borderRadius: 2, textTransform: 'none' }}>{loading ? 'Memproses...' : 'Lanjut Bayar'}</Button>
      </Stack>
    </Box>
  );
}

function StatCard({ title, value, loading, isMoney = true, delta = 0, accentColor = '#6366f1' }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)' } }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2.5, bgcolor: accentColor }} />
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>{title}</Typography>
          {loading ? <Skeleton width={110} height={24} /> : (
            <>
              <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>{isMoney ? idr(value || 0) : (value ?? 0).toLocaleString('id-ID')}</Typography>
              {typeof delta === 'number' && !Number.isNaN(delta) && delta !== 0 && (
                <Chip size="small" icon={delta >= 0 ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />} label={`${delta >= 0 ? '+' : ''}${isMoney ? idr(Math.abs(delta)) : delta.toLocaleString('id-ID')}`} color={delta >= 0 ? 'success' : 'error'} sx={{ height: 20, fontSize: 9, fontWeight: 600, borderRadius: 1.5, '& .MuiChip-icon': { fontSize: 11 } }} />
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ResellerStatsRow({ channel, onChangeChannel }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const channels = [
    { key: 'all', label: 'ALL' },
    { key: 'balance', label: 'BALANCE' },
    { key: 'qris', label: 'QRIS' },
  ];

  const fetchStats = async (signal) => {
    try {
      setRefreshing(true);
      const d = await reqOwner({ action: 'resellerStats', channel }, { signal });
      if (d?.error) throw new Error(d?.message);
      setStats(d?.data || d);
    } catch { setStats(null); }
    finally { setLoading(false); setRefreshing(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { const c = new AbortController(); fetchStats(c.signal); return () => c.abort(); }); }, [channel]);

  const nowJkt = useMemo(() => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })), []);
  const monthLabel = nowJkt.toLocaleString('id-ID', { month: 'long' });
  const prev = new Date(nowJkt); prev.setMonth(nowJkt.getMonth() - 1);
  const prevLabel = prev.toLocaleString('id-ID', { month: 'long' });
  const g = (p) => stats?.[p.split('.')[0]]?.[p.split('.')[1]] ?? 0;
  const delta = (m) => g(`${m}.thisMonth`) - g(`${m}.prevMonth`);

  const items = [
    { label: 'Revenue Hari Ini', value: g('revenue.today'), accent: '#6366f1' },
    { label: `Revenue ${monthLabel}`, value: g('revenue.thisMonth'), accent: '#6366f1', delta: delta('revenue') },
    { label: 'Cost Hari Ini', value: g('cost.today'), accent: '#f59e0b' },
    { label: `Cost ${monthLabel}`, value: g('cost.thisMonth'), accent: '#f59e0b', delta: delta('cost') },
    { label: 'Profit Hari Ini', value: g('profit.today'), accent: '#10b981' },
    { label: `Profit ${monthLabel}`, value: g('profit.thisMonth'), accent: '#10b981', delta: delta('profit') },
    { label: 'Trx Hari Ini', value: g('count.today'), accent: '#8b5cf6', isMoney: false },
    { label: `Trx ${monthLabel}`, value: g('count.thisMonth'), accent: '#8b5cf6', isMoney: false, delta: delta('count') },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1} flexWrap="wrap">
        <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Channel:</Typography>
          {channels.map((ch) => (
            <Chip
              key={ch.key}
              label={ch.label}
              size="small"
              color={channel === ch.key ? 'primary' : 'default'}
              variant={channel === ch.key ? 'filled' : 'outlined'}
              onClick={() => onChangeChannel?.(ch.key)}
              sx={{
                fontWeight: channel === ch.key ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
                ...(channel === ch.key && {
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }),
              }}
            />
          ))}
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>• Hanya transaksi <b>success</b></Typography>
        </Stack>
        <Button size="small" onClick={() => fetchStats()} disabled={refreshing} startIcon={<Refresh sx={{ fontSize: 15 }} />} sx={{ textTransform: 'none', borderRadius: 1.5, minWidth: 0, px: 1.5 }}>
          {refreshing ? '…' : ''}
        </Button>
      </Stack>
      <Grid container spacing={1}>
        {items.map((item, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={i}>
            <StatCard title={item.label} value={item.value} loading={loading} isMoney={item.isMoney !== false} delta={item.delta} accentColor={item.accent} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function DetailResellerTransaction({ id, closeDialog }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startTransition(() => {
      if (!id) return;
      setLoading(true);
      reqOwner({ action: 'getResellerTransaction', id })
        .then(res => { if (!res.error) setData(res.data || res); else toast.error(res.message); })
        .catch(() => toast.error('Gagal memuat detail'))
        .finally(() => setLoading(false));
    });
  }, [id]);

  if (loading) return <Box sx={{ p: 3 }}><Stack spacing={2}>{[...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={32} sx={{ borderRadius: 1 }} />)}</Stack></Box>;
  if (!data) return <Typography color="error" sx={{ p: 3 }}>Data tidak ditemukan</Typography>;

  const statusKey = String(data.status || '').toLowerCase();
  const userLabel = data.user?.sender?.split('@')?.[0] || data.user?.name || '-';
  const providerLabel = data.bot_provider?.username || '-';
  const profit = (data.price_reseller || 0) - (data.price_seller || 0);
  const pay = data.payment || data.Payment;

  const InfoRow = ({ label, value, mono, chipColor, bold, valueColor }) => (
    <Stack direction="row" spacing={1} sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#000', 0.02) }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 130, flexShrink: 0, pt: 0.3, fontSize: 11 }}>{label}</Typography>
      <Box sx={{ flex: 1 }}>
        {chipColor ? (
          <Chip label={value} color={chipColor} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', borderRadius: 1.5 }} />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500, color: valueColor || 'text.primary', fontFamily: mono ? 'monospace' : 'inherit', fontSize: 13 }}>{value}</Typography>
        )}
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}><InfoRow label="Reff ID" value={data.reff_id || '-'} mono /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Status" value={data.status || '-'} chipColor={STATUS_COLOR[statusKey] || 'default'} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Channel" value={data.channel || '-'} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Judul Produk" value={data.title || '-'} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Pembeli" value={userLabel} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Supplier" value={providerLabel} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Jumlah (Qty)" value={data.quantity ?? '-'} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Harga Modal" value={idr(data.price_seller || 0)} valueColor="text.secondary" /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Harga Jual" value={idr(data.price_reseller || 0)} bold /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Profit/Item" value={idr(profit)} bold valueColor={profit >= 0 ? 'success.main' : 'error.main'} /></Grid>
        <Grid item xs={12} sm={6}><InfoRow label="Total Revenue" value={idr((data.price_reseller || 0) * (data.quantity || 1))} bold valueColor="#6366f1" /></Grid>
        <Grid item xs={12}><InfoRow label="Waktu" value={dateParse(data.createdAt) + ' WIB'} /></Grid>
        {data.note && <Grid item xs={12}><InfoRow label="Catatan" value={data.note} /></Grid>}
      </Grid>

      {pay && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}><AttachMoney sx={{ fontSize: 16 }} /> Info Pembayaran</Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}><InfoRow label="Payment Reff" value={pay.reff_id || '-'} mono /></Grid>
            <Grid item xs={12} sm={6}><InfoRow label="Status Payment" value={pay.status || '-'} chipColor={STATUS_COLOR[String(pay.status || '').toLowerCase()] || 'default'} /></Grid>
            <Grid item xs={12} sm={6}><InfoRow label="Jumlah Bayar" value={idr(pay.amount || 0)} /></Grid>
            <Grid item xs={12} sm={6}><InfoRow label="Tipe" value={pay.type || '-'} /></Grid>
          </Grid>
        </>
      )}

      {(data.before_saldo != null || data.after_saldo != null) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}><AccountBalanceWallet sx={{ fontSize: 16 }} /> Info Saldo</Typography>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: alpha('#ef4444', 0.06), border: '1px solid', borderColor: alpha('#ef4444', 0.15) }}>
              <Typography variant="caption" color="text.secondary" fontSize={10}>Sebelum</Typography>
              <Typography variant="body2" fontWeight={700} color="error.main">{idr(data.before_saldo || 0)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}><Typography sx={{ color: 'text.disabled', fontSize: 20 }}>→</Typography></Box>
            <Box sx={{ flex: 1, p: 1.5, borderRadius: 1.5, bgcolor: alpha('#10b981', 0.06), border: '1px solid', borderColor: alpha('#10b981', 0.15) }}>
              <Typography variant="caption" color="text.secondary" fontSize={10}>Sesudah</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">{idr(data.after_saldo || 0)}</Typography>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}

function DepositHistorySidebar() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const abort = useRef(new Aborter());

  const fetchHistory = useCallback(async (nextPage = 1) => {
    setLoading(true);
    abort.current.abort();
    abort.current = new Aborter();
    try {
      const res = await reqOwner({
        action: 'getResellerDepositHistory',
        page: nextPage, search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }, { signal: abort.current.signal });
      if (res?.error) { toast.error(res.message); setLoading(false); return; }
      const rows = res?.data?.data || [];
      setHistory(rows);
      setTotalPages(res?.data?.totalPages || 1);
      setTotalResults(res?.data?.total || 0);
      setPage(nextPage);
    } catch (err) { if (err?.name !== 'AbortError') toast.error('Gagal memuat riwayat'); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate]);

  useEffect(() => { startTransition(() => fetchHistory(1)); }, [fetchHistory]);

  const applyFilter = () => fetchHistory(1);
  const resetFilter = () => { setSearch(''); setStartDate(''); setEndDate(''); setTimeout(() => fetchHistory(1), 0); };

  const statusColor = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'success' || v === 'paid' || v === 'settlement') return 'success';
    if (v === 'pending' || v === 'process') return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SouthWest sx={{ fontSize: 16, color: '#10b981' }} />
            Riwayat Deposit
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={totalResults} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 600 }} />
            <Tooltip title="Filter">
              <IconButton size="small" onClick={() => setShowFilter(f => !f)} color={showFilter ? 'primary' : 'default'}>
                <Search sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Collapse in={showFilter} unmountOnExit>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <TextField size="small" placeholder="Reff ID..." value={search} onChange={e => setSearch(e.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 14, color: 'text.disabled' }} /></InputAdornment> }} />
            <Stack direction="row" spacing={0.5}>
              <TextField size="small" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
              <TextField size="small" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Button size="small" variant="contained" onClick={applyFilter} fullWidth sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5 }}>Filter</Button>
              <Button size="small" variant="outlined" onClick={resetFilter} fullWidth sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5 }}>Reset</Button>
            </Stack>
          </Stack>
        </Collapse>
      </Box>

      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {loading && history.length === 0 ? (
          <Box sx={{ p: 3 }}><Stack spacing={1.5}>{[...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 1.5 }} />)}</Stack></Box>
        ) : history.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
            <Inventory2 sx={{ fontSize: 36, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.disabled">Belum ada deposit</Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {history.map((item, idx) => {
              const pay = item?.payment || item?.Payment || {};
              const reff = pay?.reff_id || '-';
              const itemStatus = item?.status || pay?.status || '-';
              const amount = Number(item?.amount ?? pay?.amount ?? 0);
              const before = Number(item?.saldo_before ?? item?.before_saldo ?? 0);
              const after = Number(item?.saldo_after ?? item?.after_saldo ?? 0);
              const createdAt = item?.createdAt || pay?.createdAt;
              const diff = after - before;

              return (
                <React.Fragment key={item?.id ?? idx}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 2, py: 1.5,
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: alpha('#10b981', 0.03) },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: '10px',
                          display: 'grid', placeItems: 'center',
                          bgcolor: statusColor(itemStatus) === 'success' ? alpha('#10b981', 0.1) : statusColor(itemStatus) === 'warning' ? alpha('#f59e0b', 0.1) : alpha('#ef4444', 0.1),
                          color: statusColor(itemStatus) === 'success' ? '#10b981' : statusColor(itemStatus) === 'warning' ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        <NorthEast sx={{ fontSize: 18 }} />
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 14 }}>{idr(amount)}</Typography>
                          <Chip label={String(itemStatus).toUpperCase()} color={statusColor(itemStatus)} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 9, height: 20, borderRadius: 1.5 }} />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.3} sx={{ mt: 0.3 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10, color: 'text.disabled', lineHeight: 1 }}>{reff}</Typography>
                          <Stack direction="row" spacing={1}>
                            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
                              {idr(before)} → <b>{idr(after)}</b>
                            </Typography>
                            {diff !== amount && diff !== 0 && (
                              <Typography variant="caption" sx={{ fontSize: 10, color: diff > 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                                ({diff > 0 ? '+' : ''}{idr(diff)})
                              </Typography>
                            )}
                          </Stack>
                          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <Schedule sx={{ fontSize: 10 }} />
                            {createdAt ? dayjs(createdAt).fromNow() : '-'}
                          </Typography>
                        </Stack>
                      }
                      sx={{ m: 0 }}
                    />
                  </ListItem>
                  {idx < history.length - 1 && <Divider component="li" sx={{ borderColor: alpha('#000', 0.04) }} />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
      {totalPages > 1 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => fetchHistory(v)} shape="rounded" size="small" color="primary" />
          </Box>
        </>
      )}
    </Card>
  );
}

function TransactionTable({ channel }) {
  const { openDialog, closeDialog } = useDialog();
  const [form, setForm] = useState({ search: '', page: 1, status: '', startDate: '', endDate: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const abort = useRef(new Aborter());

  const [debouncedSearch, setDebouncedSearch] = useState(form.search);
  useEffect(() => { startTransition(() => { const t = setTimeout(() => setDebouncedSearch(form.search), 250); return () => clearTimeout(t); }); }, [form.search]);

  const fetchData = useCallback((payload) => {
    setLoading(true);
    abort.current.abort();
    abort.current = new Aborter();
    const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    reqOwner({ action: 'getResellerTransaction', ...body }, { signal: abort.current.signal })
      .then(d => { if (!d?.error) setResult(d.data || d); })
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { fetchData({ ...form, search: debouncedSearch, page: 1, channel }); }); }, [debouncedSearch, form.status, channel]);

  const onDateChange = (key, e) => {
    const val = e?.toDate?.();
    const updated = { ...form, [key]: val, page: 1 };
    setForm(updated);
    fetchData({ ...updated, search: debouncedSearch, channel });
  };

  const onChangeField = (key) => (e) => {
    const val = e.target.value;
    setForm(s => ({ ...s, [key]: val, ...(key !== 'page' ? { page: 1 } : {}) }));
  };

  const rows = result?.data || result?.rows || [];
  const total = result?.total ?? result?.count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / 40));

  const columns = [
    { label: 'Reff ID', width: 130 },
    { label: 'Pembeli', width: 90 },
    { label: 'Produk', minWidth: 150 },
    { label: 'Qty', width: 50 },
    { label: 'H. Modal', width: 95 },
    { label: 'H. Jual', width: 95 },
    { label: 'Profit', width: 95 },
    { label: 'Ch', width: 55 },
    { label: 'Status', width: 85 },
    { label: 'Waktu', width: 130 },
    { label: 'Action', width: 70 },
  ];

  return (
    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Receipt sx={{ fontSize: 16, color: '#6366f1' }} />
            Transaksi Reseller
          </Typography>
          {!loading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}><b>{total}</b> hasil</Typography>
              <Button size="small" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={() => fetchData({ ...form, search: debouncedSearch, channel })} sx={{ textTransform: 'none', borderRadius: 1.5, minWidth: 0, px: 1 }}>Refresh</Button>
            </Stack>
          )}
        </Stack>

        <Grid container spacing={1}>
          <Grid item xs={12} md={4}>
            <TextField placeholder="Cari reff/nama/produk..." size="small" fullWidth value={form.search} onChange={onChangeField('search')} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField select label="Status" size="small" fullWidth value={form.status} onChange={onChangeField('status')}>
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker label="Dari" onChange={e => onDateChange('startDate', e)} sx={{ width: '100%' }} value={form.startDate ? dayjs(form.startDate) : null} slotProps={{ textField: { size: 'small' } }} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DatePicker label="Sampai" onChange={e => onDateChange('endDate', e)} sx={{ width: '100%' }} value={form.endDate ? dayjs(form.endDate) : null} slotProps={{ textField: { size: 'small' } }} />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <TableContainer sx={{ height: '100%' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1050, '& thead th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: 10.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap', px: 1.5 }, '& tbody td': { fontSize: 12, color: '#444', borderBottomColor: alpha('#000', 0.04), whiteSpace: 'nowrap', px: 1.5 }, '& tbody tr:hover': { bgcolor: alpha('#6366f1', 0.02), transition: 'background 0.15s' } }}>
            <TableHead>
              <TableRow>
                {columns.map(col => <TableCell key={col.label} align="center" sx={{ width: col.width, minWidth: col.minWidth }}>{col.label}</TableCell>)}
                <TableCell align="center" sx={{ width: 45 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || !rows ? renderSkeletonRow(12) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                    <Stack alignItems="center" spacing={1}><Receipt sx={{ fontSize: 40, color: 'text.disabled' }} /><Typography color="text.disabled">Belum ada transaksi</Typography></Stack>
                  </TableCell>
                </TableRow>
              ) : rows.map(row => {
                const statusKey = String(row.status || '').toLowerCase();
                const userLabel = row.user?.sender?.split('@')?.[0] || row.user?.name || '-';
                const profit = (row.price_reseller || 0) - (row.price_seller || 0);
                return (
                  <TableRow key={`${row.id}-${row.reff_id}`}>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{row.reff_id || '-'}</Typography></TableCell>
                    <TableCell align="center"><Tooltip title={row.user?.sender || ''}><Typography variant="body2" noWrap sx={{ maxWidth: 80 }}>{userLabel}</Typography></Tooltip></TableCell>
                    <TableCell align="center"><Tooltip title={row.title || ''}><Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{row.title || '-'}</Typography></Tooltip></TableCell>
                    <TableCell align="center">{row.quantity ?? '-'}</TableCell>
                    <TableCell align="center"><Typography variant="body2" color="text.secondary" fontSize={11}>{idr(row.price_seller || 0)}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={500}>{idr(row.price_reseller || 0)}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={700} color={profit >= 0 ? 'success.main' : 'error.main'} fontSize={12}>{idr(profit)}</Typography></TableCell>
                    <TableCell align="center"><Chip label={row.channel || '-'} size="small" variant="outlined" sx={{ fontSize: 9, height: 18, fontWeight: 600, textTransform: 'uppercase' }} /></TableCell>
                    <TableCell align="center"><Chip label={row.status || '-'} color={STATUS_COLOR[statusKey] || 'default'} size="small" sx={{ textTransform: 'capitalize', borderRadius: 1.5, fontWeight: 600, fontSize: 10.5, height: 22 }} /></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="text.secondary" fontSize={11}>{dateParse(row.createdAt)}</Typography></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail"><IconButton size="small" onClick={() => openDialog('Detail Transaksi Reseller', <DetailResellerTransaction id={row.id} closeDialog={closeDialog} />)}><RemoveRedEye sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {!loading && pageCount > 1 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pageCount} page={form.page} onChange={(_, v) => { const u = { ...form, page: v }; setForm(u); fetchData({ ...u, search: debouncedSearch, channel }); }} shape="rounded" size="small" color="primary" showFirstButton showLastButton />
          </Box>
        </>
      )}
    </Card>
  );
}

export default function ResellerTransactionPage() {
  return <Box><ResellerTransactionContent /></Box>;
}

function ResellerTransactionContent() {
  const { openDialog, closeDialog } = useDialog();
  const [channel, setChannel] = useState('all');

  const handleDeposit = ({ onSettled }) => openDialog('Deposit Saldo Reseller', <DepositResellerDialog onClose={closeDialog} onSettled={onSettled} />);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', mx: 'auto' }}>
      <Box sx={{ mb: 2.5 }}>
        <ResellerBalanceCard onDeposit={handleDeposit} />
      </Box>
      <Box sx={{ mb: 2.5 }}>
        <ResellerStatsRow channel={channel} onChangeChannel={setChannel} />
      </Box>
      <Grid container spacing={2} sx={{ minHeight: 600 }}>
        <Grid item xs={12} lg={3.8}>
          <DepositHistorySidebar />
        </Grid>
        <Grid item xs={12} lg={8.2}>
          <TransactionTable channel={channel} />
        </Grid>
      </Grid>
    </Box>
  );
}