import { Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Card, TextField, Stack, Pagination, IconButton, Typography, Chip, Skeleton, Button, MenuItem, Grid, alpha, Tooltip, CircularProgress, Alert, CardContent } from '@mui/material';
import { RemoveRedEye, Refresh, TrendingUp, TrendingDown, Lock, Receipt, Payments, ShoppingCart, CalendarMonth, Today, AttachMoney } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { reqOwner } from '@/lib/requestApi';
import { dateParse, idr } from '@/lib/helper';
import { useDialog } from '@/Context/Dialog';
import DetailTransactionSmm from './detailTransactionSmm';
import dayjs from 'dayjs';
import { BalanceCard, DepositSmmDialog } from './depositSmmBalance';
import { useSocket } from '@/Context/SocketContext';

const statusColor = { success: 'success', pending: 'warning', fail: 'error', failed: 'error' };

function Aborter() { const c = new AbortController(); c.abort = c.abort.bind(c); return c; }

function useSmmGate() {
  const [state, setState] = useState({ checking: true, allowed: false, message: '' });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reqOwner({ action: 'isSupportSmm' });
        if (!alive) return;
        if (res?.error) setState({ checking: false, allowed: false, message: res?.message || 'Access denied!' });
        else setState({ checking: false, allowed: true, message: '' });
      } catch (e) {
        if (!alive) return;
        setState({ checking: false, allowed: false, message: e?.message || 'Access denied!' });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

function BlockedView({ subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ p: 3, display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <Card variant="outlined" sx={{ maxWidth: 480, width: '100%', borderRadius: 3, borderColor: alpha('#ef4444', 0.2) }}>
          <CardContent sx={{ p: 4 }}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha('#ef4444', 0.08), color: '#ef4444', display: 'grid', placeItems: 'center' }}>
                <Lock sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={800}>Access Denied!</Typography>
              <Typography variant="body2" color="text.secondary" align="center">{subtitle || 'Fitur SMM tidak aktif untuk bot ini.'}</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
}

function StatCard({ title, value, loading, isMoney = true, delta = 0, icon }) {
  const showDelta = typeof delta === 'number' && !Number.isNaN(delta) && delta !== 0;
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.2, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Typography>
            {loading ? (
              <Skeleton width={100} height={20} sx={{ mt: 0.25 }} />
            ) : (
              <>
                <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMoney ? idr(value || 0) : (value ?? 0).toLocaleString('id-ID')}</Typography>
                {showDelta && (
                  <Chip
                    size="small"
                    icon={delta >= 0 ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
                    label={`${delta >= 0 ? '+' : ''}${isMoney ? idr(delta) : delta.toLocaleString('id-ID')}`}
                    color={delta >= 0 ? 'success' : 'error'}
                    sx={{ height: 18, fontSize: 10, fontWeight: 600, mt: 0.25, '& .MuiChip-icon': { fontSize: 12 } }}
                  />
                )}
              </>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SmmStats({ channel, onChangeChannel }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsMenu, setStatsMenu] = useState('pendapatan');
  const { openDialog, closeDialog } = useDialog();

  const fetchStats = async signal => {
    try {
      setRefreshing(true);
      const d = await reqOwner({ action: 'md.stats', channel }, { signal });
      if (d?.error) throw new Error(d?.message || 'Gagal ambil stats');
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

  const revToday = stats?.revenue?.today ?? 0;
  const revThis = stats?.revenue?.thisMonth ?? 0;
  const revPrev = stats?.revenue?.prevMonth ?? 0;
  const profitTotal = stats?.profit?.total ?? 0;
  const profitThis = stats?.profit?.thisMonth ?? 0;
  const profitPrev = stats?.profit?.prevMonth ?? 0;
  const cntToday = stats?.count?.today ?? 0;
  const cntThis = stats?.count?.thisMonth ?? 0;
  const cntPrev = stats?.count?.prevMonth ?? 0;

  return (
    <Box>
      <Box sx={{ mt: 1, mb: 2 }}>
        <BalanceCard onDeposit={({ onSettled }) => openDialog('Deposit SMM', <DepositSmmDialog onClose={closeDialog} onSettled={onSettled} />)} />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} gap={1}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Ringkasan • Asia/Jakarta • Channel:</Typography>
          <Chip label={String(channel || 'balance').toUpperCase()} size="small" sx={{ fontWeight: 700, borderRadius: 1.5, cursor: 'pointer' }} onClick={() => onChangeChannel?.(channel === 'balance' ? 'qris' : 'balance')} />
        </Stack>
        <Button size="small" onClick={() => fetchStats()} disabled={refreshing} startIcon={refreshing ? <React.Fragment /> : <Refresh sx={{ fontSize: 16 }} />} sx={{ borderRadius: 2, textTransform: 'none' }}>
          {refreshing ? 'Merefresh…' : 'Refresh'}
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant={statsMenu === 'pendapatan' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('pendapatan'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Pendapatan
            </Button>
            <Button
              variant={statsMenu === 'profit' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('profit'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Profit
            </Button>
            <Button
              variant={statsMenu === 'transaksi' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('transaksi'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Transaksi
            </Button>
          </Stack>
          <Grid container spacing={1.5}>
            {statsMenu === 'pendapatan' && (
              <>
                <Grid item xs={4}><StatCard title={`Pendapatan Harian (${nowJkt.toLocaleDateString('id-ID')})`} value={revToday} loading={loading} isMoney icon={<Today sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Pendapatan ${monthLabel}`} value={revThis} loading={loading} isMoney delta={revThis - revPrev} icon={<CalendarMonth sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Pendapatan ${prevLabel}`} value={revPrev} loading={loading} isMoney icon={<CalendarMonth sx={{ fontSize: 18 }} />} /></Grid>
              </>
            )}
            {statsMenu === 'profit' && (
              <>
                <Grid item xs={4}><StatCard title="Total Profit" value={profitTotal} loading={loading} isMoney icon={<Payments sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Profit ${monthLabel}`} value={profitThis} loading={loading} isMoney delta={profitThis - profitPrev} icon={<AttachMoney sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Profit ${prevLabel}`} value={profitPrev} loading={loading} isMoney icon={<AttachMoney sx={{ fontSize: 18 }} />} /></Grid>
              </>
            )}
            {statsMenu === 'transaksi' && (
              <>
                <Grid item xs={4}><StatCard title="Transaksi Harian" value={cntToday} loading={loading} isMoney={false} icon={<ShoppingCart sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Transaksi ${monthLabel}`} value={cntThis} loading={loading} isMoney={false} delta={cntThis - cntPrev} icon={<Receipt sx={{ fontSize: 18 }} />} /></Grid>
                <Grid item xs={4}><StatCard title={`Transaksi ${prevLabel}`} value={cntPrev} loading={loading} isMoney={false} icon={<Receipt sx={{ fontSize: 18 }} />} /></Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>Stats menghitung transaksi <b>success</b> dan mengikuti filter <b>channel</b> (balance/qris).</Alert>
    </Box>
  );
}

function TransactionSmmContent() {
  const { checking, allowed, message } = useSmmGate();
  const { openDialog, closeDialog } = useDialog();
  const [form, setForm] = useState({ search: '', startDate: '', endDate: '', page: 1, status: '', channel: 'balance' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();
  const abort = useRef(new Aborter());
  const [debouncedSearch, setDebouncedSearch] = useState(form.search);

  // Track if user is busy with search/filters to pause auto-reload
  useEffect(() => {
    if (!socket) return;
    const isBusy = !!(form.search || form.startDate || form.endDate || form.status || form.page !== 1);
    socket.emit('ui_state', { isBusy });
  }, [form, socket]);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(form.search), 250); return () => clearTimeout(t); }, [form.search]);

  const fetchData = (payload, silent = false) => {
    if (!silent) setLoading(true);
    abort.current.abort();
    abort.current = new Aborter();
    const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    reqOwner({ action: 'md.getTransaction', ...body }, { signal: abort.current.signal })
      .then(d => { if (!d?.error) setResult(d.data || d); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  // Listen for realtime reload from server
  useEffect(() => {
    if (!socket) return;
    const onReload = (data) => {
      if (data?.action?.includes('md.getTransaction')) {
        fetchData(form, true); // silent refresh
      }
    };
    socket.on('o2_reload', onReload);
    return () => socket.off('o2_reload', onReload);
  }, [socket, form]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!allowed) return; startTransition(() => { fetchData(form); }); }, [allowed]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!allowed) return; fetchData({ ...form, search: debouncedSearch, page: 1 }); }, [debouncedSearch, form.status]);

  const onDateChange = (key, e) => { const val = e?.toDate?.(); const updated = { ...form, [key]: val, page: 1 }; setForm(updated); fetchData(updated); };
  const onChangeField = key => e => { setForm(s => ({ ...s, [key]: e.target.value, ...(key !== 'page' ? { page: 1 } : {}) })); };

  const rows = result?.data || result?.rows || [];
  const total = result?.total ?? result?.count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / 40));

  if (checking) {
    return (
      <Box sx={{ p: 3, display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!allowed) return <BlockedView subtitle={message} />;

  const renderSkeleton = () => [...Array(10)].map((_, i) => (
    <TableRow key={`sk-${i}`}>{Array(10).fill(0).map((_, idx) => <TableCell align="center" key={idx}><Skeleton variant="text" width="70%" height={18} /></TableCell>)}</TableRow>
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={2.5}>
        <SmmStats channel={form.channel} onChangeChannel={ch => setForm(s => ({ ...s, channel: ch }))} />

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField type="text" label="Cari (reffId / nama / sender)" size="small" fullWidth value={form.search} onChange={onChangeField('search')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField select label="Status" size="small" fullWidth value={form.status} onChange={onChangeField('status')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="">Semua</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="success">Success</MenuItem><MenuItem value="fail">Fail</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField select label="Channel Stats" size="small" fullWidth value={form.channel} onChange={e => setForm(s => ({ ...s, channel: e.target.value }))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="balance">Balance</MenuItem><MenuItem value="qris">QRIS</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5}>
          <DatePicker label="Dari" onChange={e => onDateChange('startDate', e)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.startDate ? dayjs(form.startDate) : null} />
          <DatePicker label="Sampai" onChange={e => onDateChange('endDate', e)} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.endDate ? dayjs(form.endDate) : null} />
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="body2" color="text.secondary">{total} transaksi ditemukan</Typography>
          <Button size="small" variant="outlined" startIcon={refreshing ? <React.Fragment /> : <Refresh sx={{ fontSize: 16 }} />} onClick={() => { setRefreshing(true); fetchData({ ...form, search: debouncedSearch }); }} disabled={refreshing} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {refreshing ? '…' : 'Refresh'}
          </Button>
        </Stack>

        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto'}}>
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', borderBottom: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell align="center">Reff ID</TableCell>
                <TableCell align="center">User</TableCell>
                <TableCell align="center">Service</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Price</TableCell>
                <TableCell align="center">Profit</TableCell>
                <TableCell align="center">Channel</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Waktu</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || !rows ? renderSkeleton() : rows.map(row => {
                const statusKey = String(row.status || '').toLowerCase();
                const userLabel = row.user?.sender?.split('@')?.[0] || row.user?.name || '-';
                return (
                  <TableRow key={`${row.id}-${row.reff_id}`} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { fontSize: 12, borderBottomColor: alpha('#000', 0.04) }, transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{row.reff_id || '-'}</Typography></TableCell>
                    <TableCell align="center">{userLabel}</TableCell>
                    <TableCell align="center" sx={{ maxWidth: 160, whiteSpace: 'normal' }}>{row.service_name || row.product_name || row.service || '-'}</TableCell>
                    <TableCell align="center">{row.qty ?? row.quantity ?? '-'}</TableCell>
                    <TableCell align="center">{idr(row.price || 0)}</TableCell>
                    <TableCell align="center"><Typography color={(row.fee_owner || 0) > 0 ? 'success.main' : 'text.secondary'} fontWeight={600}>{idr(row.fee_owner || 0)}</Typography></TableCell>
                    <TableCell align="center">{row.channel || '-'}</TableCell>
                    <TableCell align="center"><Chip label={row.status || '-'} color={statusColor[statusKey] || 'default'} size="small" sx={{ textTransform: 'capitalize', borderRadius: 1.5, fontWeight: 500, fontSize: 11 }} /></TableCell>
                    <TableCell align="center" sx={{ fontSize: 11 }}>{dateParse(row.createdAt)} WIB</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail"><IconButton size="small" onClick={() => openDialog('Detail Transaksi SMM', <DetailTransactionSmm id={row.id} closeDialog={closeDialog} />)}><RemoveRedEye sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {pageCount > 1 && (
          <Stack direction="row" justifyContent="center">
            <Pagination count={pageCount} page={form.page} onChange={(_, value) => { const updated = { ...form, page: value }; setForm(updated); fetchData(updated); }} shape="rounded" size="small" showFirstButton showLastButton />
          </Stack>
        )}
      </Stack>
    </motion.div>
  );
}

export default function TransactionSmm() {
  return <Box><TransactionSmmContent /></Box>;
}