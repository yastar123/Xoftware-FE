import { Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Card, TextField, Stack, Pagination, IconButton, Typography, Chip, Skeleton, Button, MenuItem, Grid, alpha, Tooltip, CardContent } from '@mui/material';
import { RemoveRedEye, Refresh, TrendingUp, TrendingDown, Receipt, Payments, ShoppingCart, CalendarMonth, Today, AttachMoney } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { startTransition, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/Hook/debouncingState';
import { DatePicker } from '@mui/x-date-pickers';
import { reqOwner } from '@/lib/requestApi';
import { dateParse, idr } from '@/lib/helper';
import { useDialog } from '@/Context/Dialog';
import DetailTransactionPpob from './detailTransactionPpob';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { BalanceCard, DepositPpobDialog } from './depositPpobBalance';
import { useSocket } from '@/Context/SocketContext';

const statusColor = { success: 'success', pending: 'warning', failed: 'error', fail: 'error', refunded: 'default' };

function Aborter() { const c = new AbortController(); c.abort = c.abort.bind(c); return c; }

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

function StatsPpobCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsMenu, setStatsMenu] = useState('pendapatan');

  const fetchStats = async signal => {
    try { setRefreshing(true); const d = await reqOwner({ action: 'ppob.stats' }, { signal }); setStats(d?.data || d); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { startTransition(() => { const c = new AbortController(); fetchStats(c.signal); return () => c.abort(); }); }, []);

  const nowJkt = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" gap={1}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Ringkasan performa • Asia/Jakarta</Typography>
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
    </Box>
  );
}

function TransactionPpobContent() {
  const [form, setForm] = useState({ search: '', startDate: '', endDate: '', page: 1, status: '', channel: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { openDialog, closeDialog } = useDialog();
  const { socket } = useSocket();
  const abort = useRef(new Aborter());
  const debounceSearch = useDebounce(form.search, 250);

  // Track if user is busy with search/filters to pause auto-reload
  useEffect(() => {
    if (!socket) return;
    const isBusy = !!(form.search || form.startDate || form.endDate || form.status || form.channel || form.page !== 1);
    socket.emit('ui_state', { isBusy });
  }, [form, socket]);

  const fetchData = (payload, silent = false) => {
    if (!silent) setLoading(true);
    abort.current.abort();
    abort.current = new Aborter();
    const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    reqOwner({ action: 'getTransactionPpob', ...body }, { signal: abort.current.signal })
      .then(d => { if (!d.error) setResult(d.data || d); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  // Listen for realtime reload from server
  useEffect(() => {
    if (!socket) return;
    const onReload = (data) => {
      if (data?.action?.includes('getTransactionPpob')) {
        fetchData(form, true); // silent refresh
      }
    };
    socket.on('o2_reload', onReload);
    return () => socket.off('o2_reload', onReload);
  }, [socket, form]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { fetchData(form); }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData({ ...form, search: debounceSearch, page: 1 }); }, [debounceSearch, form.channel, form.status]);

  const onDateChange = (key, e) => { const val = e?.toDate?.(); const updated = { ...form, [key]: val, page: 1 }; setForm(updated); fetchData(updated); };
  const onChangeField = key => e => { setForm(s => ({ ...s, [key]: e.target.value, ...(key !== 'page' ? { page: 1 } : {}) })); };

  const exportToExcel = async () => {
    const rows = result?.data || result?.rows || [];
    if (!rows.length) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('PPOB Transactions');
    sheet.columns = [
      { header: 'Reff ID', key: 'reff_id', width: 24 }, { header: 'Nomor/ID Tele', key: 'sender', width: 18 }, { header: 'Product', key: 'product_name', width: 28 },
      { header: 'Price', key: 'price', width: 16 }, { header: 'Channel', key: 'channel', width: 12 }, { header: 'Status', key: 'status', width: 12 },
      { header: 'Operator', key: 'operator', width: 22 }, { header: 'Category', key: 'category', width: 22 }, { header: 'Created At', key: 'createdAt', width: 24 },
    ];
    rows.forEach(r => { sheet.addRow({ reff_id: r.reff_id, sender: r.user?.sender?.split('@')?.[0] || r.user?.name || '-', product_name: r.product_name || '-', price: r.price ?? 0, channel: r.channel || '-', status: r.status || '-', operator: r.tv_operator?.name || '-', category: r.tv_category?.name || '-', createdAt: dateParse(r.createdAt) + ' WIB' }); });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ppob-transactions-${Date.now()}.xlsx`);
  };

  const rows = result?.data || result?.rows || [];
  const total = result?.total ?? result?.count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / 40));

  const renderSkeleton = () => [...Array(10)].map((_, i) => (
    <TableRow key={`sk-${i}`}>{Array(13).fill(0).map((_, idx) => <TableCell align="center" key={idx}><Skeleton variant="text" width="70%" height={18} /></TableCell>)}</TableRow>
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={2.5}>
        <Box sx={{ mt: 1 }}><BalanceCard onDeposit={({ onSettled }) => openDialog('Deposit PPOB', <DepositPpobDialog onClose={closeDialog} onSettled={onSettled} />)} /></Box>
        <Box><StatsPpobCards /></Box>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <TextField type="text" label="Cari (reffId / nama / sender / product)" size="small" fullWidth value={form.search} onChange={onChangeField('search')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField select label="Status" size="small" fullWidth value={form.status} onChange={onChangeField('status')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="">Semua</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="success">Success</MenuItem><MenuItem value="fail">Fail</MenuItem><MenuItem value="refunded">Refunded</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField select label="Channel" size="small" fullWidth value={form.channel} onChange={onChangeField('channel')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <MenuItem value="">Semua</MenuItem><MenuItem value="qris">QRIS</MenuItem><MenuItem value="balance">Balance</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <DatePicker label="Dari" onChange={e => onDateChange('startDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.startDate ? dayjs(form.startDate) : null} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <DatePicker label="Sampai" onChange={e => onDateChange('endDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.endDate ? dayjs(form.endDate) : null} />
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="body2" color="text.secondary">{total} transaksi ditemukan</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={refreshing ? <React.Fragment /> : <Refresh sx={{ fontSize: 16 }} />} onClick={() => { setRefreshing(true); fetchData({ ...form, search: debounceSearch }); }} disabled={refreshing} sx={{ borderRadius: 2, textTransform: 'none' }}>{refreshing ? '…' : 'Refresh'}</Button>
            {!loading && <Button variant="contained" color="success" onClick={exportToExcel} size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Export</Button>}
          </Stack>
        </Stack>

        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto'}}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', borderBottom: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                <TableCell align="center">Reff ID</TableCell><TableCell align="center">Nomor/ID</TableCell><TableCell align="center">Product</TableCell><TableCell align="center">Price</TableCell><TableCell align="center">Profit</TableCell><TableCell align="center">Saldo Potong</TableCell><TableCell align="center">Saldo</TableCell><TableCell align="center">Channel</TableCell><TableCell align="center">Status</TableCell><TableCell align="center">Operator</TableCell><TableCell align="center">Category</TableCell><TableCell align="center">Waktu</TableCell><TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || !rows ? renderSkeleton() : rows.map(row => {
                const statusKey = (row.status || '').toLowerCase();
                const priceVendor = row.vendor_price_raw + row.vendor_fee_amount;
                const profit = statusKey == 'success' ? row.final_user_price - priceVendor : 0;
                return (
                  <TableRow key={`${row.id}-${row.reff_id}`} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { fontSize: 12, borderBottomColor: alpha('#000', 0.04) }, transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{row.reff_id || '-'}</Typography></TableCell>
                    <TableCell align="center">{row.user?.sender?.split('@')?.[0] || row.user?.name || '-'}</TableCell>
                    <TableCell align="center" sx={{ maxWidth: 160, whiteSpace: 'normal' }}>{row.product_name || '-'}</TableCell>
                    <TableCell align="center">{idr(row.final_user_price || 0)}</TableCell>
                    <TableCell align="center"><Typography color={profit > 0 ? 'success.main' : 'text.secondary'} fontWeight={600}>{idr(profit)}</Typography></TableCell>
                    <TableCell align="center">{idr(priceVendor)}</TableCell>
                    <TableCell align="center">{idr(row.bot_saldo)}</TableCell>
                    <TableCell align="center">{row.channel || '-'}</TableCell>
                    <TableCell align="center"><Chip label={row.status || '-'} color={statusColor[statusKey] || 'default'} size="small" sx={{ textTransform: 'capitalize', borderRadius: 1.5, fontWeight: 500, fontSize: 11 }} /></TableCell>
                    <TableCell align="center">{row.tv_operator?.name || '-'}</TableCell>
                    <TableCell align="center">{row.tv_category?.name || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 11 }}>{dateParse(row.createdAt)} WIB</TableCell>
                    <TableCell align="center"><Tooltip title="Detail"><IconButton size="small" onClick={() => openDialog('Detail Transaksi PPOB', <DetailTransactionPpob id={row.id} closeDialog={closeDialog} />)}><RemoveRedEye sx={{ fontSize: 16 }} /></IconButton></Tooltip></TableCell>
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

export default function TransactionPpob() {
  return <Box><TransactionPpobContent /></Box>;
}