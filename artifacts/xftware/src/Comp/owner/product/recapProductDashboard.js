import { Box, Card, CardContent, Divider, Grid, MenuItem, Skeleton, Stack, TextField, Typography, Button, Alert, alpha, InputAdornment } from '@mui/material';
import { Refresh, Search, BarChart as BarChartIcon, TrendingUp, AccountBalanceWallet, Inventory2, ShoppingCart } from '@mui/icons-material';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';

function Aborter() {
  const controller = new AbortController();
  controller.abort = controller.abort.bind(controller);
  return controller;
}

const ALLOWED_STATUS = ['BUY_WHATSAPP', 'BUY_TELEGRAM', 'BUY_WEB', 'BUYNOW_WHATSAPP', 'BUYNOW_TELEGRAM', 'BUYNOW_WEB'];
const niceNumber = n => Number(n || 0).toLocaleString('id-ID');
const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#22c55e', '#3b82f6'];

function tooltipMoney(v) { return idr(Number(v || 0)); }
function tooltipNumber(v) { return niceNumber(Number(v || 0)); }

/* ==========================
 * Stat Card (indigo icon box style)
   ========================== */
function RecapCard({ title, value, sub, icon, isMoney = false, loading }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, display: 'block' }}>{title}</Typography>
            {loading ? (
              <Skeleton width={120} height={24} />
            ) : (
              <>
                <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{isMoney ? idr(value || 0) : niceNumber(value || 0)}</Typography>
                {sub && <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, display: 'block' }}>{sub}</Typography>}
              </>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children, loading, sx }) {
  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', ...sx }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>}
        </Box>
        <Divider sx={{ mb: 2 }} />
        {loading ? <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} /> : children}
      </CardContent>
    </Card>
  );
}

/* ==========================
 * Main Page
   ========================== */
export default function RecapDashboardPage() {
  const [form, setForm] = useState({ startDate: '', endDate: '', status_type: '', topLimit: 10 });
  const [statsMenu, setStatsMenu] = useState('profit');

  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingPie, setLoadingPie] = useState(true);
  const [loadingTopBar, setLoadingTopBar] = useState(true);

  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [pieTop, setPieTop] = useState([]);
  const [barTop, setBarTop] = useState([]);

  const abortStats = useRef(new Aborter());
  const abortDaily = useRef(new Aborter());
  const abortPie = useRef(new Aborter());
  const abortTop = useRef(new Aborter());

  const cleanBody = payload => Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));

  const bodyBase = useMemo(() => cleanBody({
    status_type: form.status_type || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    topLimit: form.topLimit || 10,
  }), [form]);

  const fetchStats = async () => {
    setLoadingStats(true);
    abortStats.current.abort();
    abortStats.current = new Aborter();
    try {
      const res = await reqOwner({ action: 'getRecapStats', ...cleanBody({ status_type: bodyBase.status_type }) }, { signal: abortStats.current.signal });
      if (!res?.error) setStats((res?.data || res)?.stats || null);
    } finally { setLoadingStats(false); }
  };

  const fetchDaily = async () => {
    setLoadingDaily(true);
    abortDaily.current.abort();
    abortDaily.current = new Aborter();
    try {
      const res = await reqOwner({ action: 'getRecapGraphDaily', ...bodyBase }, { signal: abortDaily.current.signal });
      if (!res?.error) {
        const d = res?.data || res;
        setDaily((d?.data || []).map(x => ({ date: x.date, profit: Number(x.profit || 0), gross: Number(x.price_total || 0) })));
      }
    } finally { setLoadingDaily(false); }
  };

  const fetchPieTop = async () => {
    setLoadingPie(true);
    abortPie.current.abort();
    abortPie.current = new Aborter();
    try {
      const res = await reqOwner({ action: 'getRecapGraphPieTopStock', ...bodyBase }, { signal: abortPie.current.signal });
      if (!res?.error) setPieTop(((res?.data || res)?.data || []).map(x => ({ name: x.name || '-', value: Number(x.value || 0) })));
    } finally { setLoadingPie(false); }
  };

  const fetchBarTop = async () => {
    setLoadingTopBar(true);
    abortTop.current.abort();
    abortTop.current = new Aborter();
    try {
      const res = await reqOwner({ action: 'getRecapGraphBarTopStock', ...bodyBase }, { signal: abortTop.current.signal });
      if (!res?.error) {
        const d = res?.data || res;
        setBarTop((d?.data || []).map(x => ({ title: x.title || '-', quantity: Number(x.quantity || 0), profit: Number(x.profit || 0), gross: Number(x.price_total || 0) })));
      }
    } finally { setLoadingTopBar(false); }
  };

  const fetchAll = async () => {
    setLoadingAll(true);
    await Promise.all([fetchStats(), fetchDaily(), fetchPieTop(), fetchBarTop()]);
    setLoadingAll(false);
  };

  useEffect(() => { startTransition(() => fetchAll()); return () => { abortStats.current.abort(); abortDaily.current.abort(); abortPie.current.abort(); abortTop.current.abort(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (loadingAll && !stats && daily.length === 0 && pieTop.length === 0 && barTop.length === 0) return; fetchAll(); }, [bodyBase.startDate, bodyBase.endDate, bodyBase.status_type, bodyBase.topLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDateChange = (key, e) => { const val = e?.toDate?.(); setForm(s => ({ ...s, [key]: val || '' })); };

  const statsSafe = stats || {
    profit: { today: 0, thisMonth: 0, lastMonth: 0 },
    gross: { today: 0, thisMonth: 0 },
    totalSold: { today: 0, thisMonth: 0, lastMonth: 0 },
  };

  const dateLabel = useMemo(() => {
    const s = form.startDate ? dateParse(form.startDate) : '7 hari terakhir';
    const e = form.endDate ? dateParse(form.endDate) : 'hari ini';
    return `${s} s/d ${e}`;
  }, [form.startDate, form.endDate]);

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <BarChartIcon sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>Dashboard Rekap</Typography>
          <Typography variant="caption" color="text.secondary">Timezone: <b>Asia/Jakarta</b> • Range: {dateLabel}</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 16 }} />} onClick={fetchAll} disabled={loadingAll} sx={{ borderRadius: 2, textTransform: 'none' }}>
          Refresh
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
        Pastikan profit pada produk/variasi sudah di-setting dengan baik agar data akurat.
      </Alert>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField select label="Status Type" size="small" fullWidth value={form.status_type} onChange={e => setForm(s => ({ ...s, status_type: e.target.value }))} sx={{ borderRadius: 2 }}>
                <MenuItem value="">Semua</MenuItem>
                {ALLOWED_STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField label="Top Limit" size="small" fullWidth type="number" inputProps={{ min: 1, max: 50 }} value={form.topLimit} onChange={e => { const v = parseInt(e.target.value || '10', 10); setForm(s => ({ ...s, topLimit: Number.isFinite(v) ? v : 10 })); }} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker label="Start Date" onChange={e => onDateChange('startDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.startDate ? dayjs(form.startDate) : null} slotProps={{ textField: { size: 'small' } }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker label="End Date" onChange={e => onDateChange('endDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.endDate ? dayjs(form.endDate) : null} slotProps={{ textField: { size: 'small' } }} />
            </Grid>
          </Grid>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontSize: 11 }}>
            Default Grafik Harian: 7 hari terakhir. | Default Top Stock: bulan ini.
          </Typography>
        </CardContent>
      </Card>

      {/* Stat Cards with Menu Toggle */}
      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant={statsMenu === 'profit' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('profit'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Profit
            </Button>
            <Button
              variant={statsMenu === 'omzet' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('omzet'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Omzet
            </Button>
            <Button
              variant={statsMenu === 'terjual' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => startTransition(() => setStatsMenu('terjual'))}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Terjual
            </Button>
          </Stack>
          <Grid container spacing={1.5}>
            {statsMenu === 'profit' && (
              <>
                <Grid item xs={4}>
                  <RecapCard title="Profit Today" value={statsSafe.profit.today} sub="Hari ini" icon={<TrendingUp sx={{ fontSize: 18 }} />} isMoney loading={loadingStats} />
                </Grid>
                <Grid item xs={4}>
                  <RecapCard title="Profit Bulan Ini" value={statsSafe.profit.thisMonth} sub="Bulan berjalan" icon={<TrendingUp sx={{ fontSize: 18 }} />} isMoney loading={loadingStats} />
                </Grid>
                <Grid item xs={4}>
                  <RecapCard title="Profit Bulan Lalu" value={statsSafe.profit.lastMonth} sub="Bulan sebelumnya" icon={<TrendingUp sx={{ fontSize: 18 }} />} isMoney loading={loadingStats} />
                </Grid>
              </>
            )}
            {statsMenu === 'omzet' && (
              <>
                <Grid item xs={6}>
                  <RecapCard title="Omzet Today" value={statsSafe.gross.today} sub="Hari ini" icon={<AccountBalanceWallet sx={{ fontSize: 18 }} />} isMoney loading={loadingStats} />
                </Grid>
                <Grid item xs={6}>
                  <RecapCard title="Omzet Bulan Ini" value={statsSafe.gross.thisMonth} sub="Bulan berjalan" icon={<AccountBalanceWallet sx={{ fontSize: 18 }} />} isMoney loading={loadingStats} />
                </Grid>
              </>
            )}
            {statsMenu === 'terjual' && (
              <>
                <Grid item xs={4}>
                  <RecapCard title="Terjual Today" value={statsSafe.totalSold.today} sub="Hari ini" icon={<ShoppingCart sx={{ fontSize: 18 }} />} loading={loadingStats} />
                </Grid>
                <Grid item xs={4}>
                  <RecapCard title="Terjual Bulan Ini" value={statsSafe.totalSold.thisMonth} sub="Bulan berjalan" icon={<ShoppingCart sx={{ fontSize: 18 }} />} loading={loadingStats} />
                </Grid>
                <Grid item xs={4}>
                  <RecapCard title="Terjual Bulan Lalu" value={statsSafe.totalSold.lastMonth} sub="Bulan sebelumnya" icon={<ShoppingCart sx={{ fontSize: 18 }} />} loading={loadingStats} />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Daily Bar Chart */}
      <ChartCard title="Pendapatan Kotor & Profit" subtitle="Per hari (Jakarta)" loading={loadingDaily} sx={{ mb: 2.5 }}>
        {daily.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>Tidak ada data untuk range ini.</Alert>
        ) : (
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => name === 'profit' ? [tooltipMoney(value), 'Profit'] : [tooltipMoney(value), 'Gross']}
                  labelFormatter={label => `Tanggal: ${label}`}
                  contentStyle={{ borderRadius: 2, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="gross" name="Kotor" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </ChartCard>

      {/* Pie + Top Stock */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <ChartCard title="Top Produk (Nama)" subtitle={`Berdasarkan jumlah (${Math.min(Math.max(form.topLimit || 10, 1), 50)})`} loading={loadingPie}>
            {pieTop.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>Tidak ada data.</Alert>
            ) : (
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value, name, props) => [tooltipNumber(value), props?.payload?.name || name]} contentStyle={{ borderRadius: 2, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Pie data={pieTop} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} innerRadius={40} paddingAngle={2}>
                      {pieTop.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title="Top Produk (Qty / Profit / Kotor)" loading={loadingTopBar}>
            {barTop.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>Tidak ada data top stock.</Alert>
            ) : (
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barTop} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.06)} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} interval={0} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'quantity') return [tooltipNumber(value), 'Qty'];
                        if (name === 'profit') return [tooltipMoney(value), 'Profit'];
                        return [tooltipMoney(value), 'Gross'];
                      }}
                      contentStyle={{ borderRadius: 2, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="quantity" name="Qty" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="gross" name="Gross" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}