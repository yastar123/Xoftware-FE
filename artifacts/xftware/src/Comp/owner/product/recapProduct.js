import React, { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Collapse, Divider, Grid,
  IconButton, MenuItem, Pagination, Skeleton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
  alpha, InputAdornment, Tooltip
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Refresh, Search, ReceiptLong, Inventory2, TrendingUp, AccountBalanceWallet } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reqOwner } from '@/lib/requestApi';
import { dateParse, idr } from '@/lib/helper';

function Aborter() {
  const controller = new AbortController();
  controller.abort = controller.abort.bind(controller);
  return controller;
}

function renderSkeletonRow(colCount = 10, rowCount = 10) {
  return Array.from({ length: rowCount }).map((_, i) => (
    <TableRow key={`sk-${i}`}>
      {Array.from({ length: colCount }).map((__, idx) => (
        <TableCell align="center" key={idx}>
          <Skeleton variant="text" width="80%" height={18} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

const ALLOWED_STATUS = ['BUY_WHATSAPP', 'BUY_TELEGRAM', 'BUY_WEB', 'BUYNOW_WHATSAPP', 'BUYNOW_TELEGRAM', 'BUYNOW_WEB'];

const statusChipColor = s => {
  if (!s) return 'default';
  const str = String(s);
  if (str.includes('BUYNOW')) return 'success';
  if (str.includes('BUY_')) return 'info';
  return 'default';
};

const labelStyle = { fontWeight: 700, color: 'text.secondary', fontSize: 12 };
const valueStyle = { color: 'text.primary', fontSize: 13 };

function toSenderLabel(v) {
  if (!v) return '-';
  const s = String(v);
  return s.includes('@') ? s.split('@')[0] : s;
}

function parseAccounts(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    return Array.isArray(j) ? j : [];
  } catch {
    return s.split(/\n+/g).map(x => x.trim()).filter(Boolean).map(x => [x]);
  }
}

function accountRowSummary(accRow) {
  if (!Array.isArray(accRow) || accRow.length === 0) return '-';
  return accRow[0] != null ? String(accRow[0]) : '-';
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const TABLE_HEAD_SX = {
  '& th': {
    bgcolor: alpha('#6366f1', 0.04),
    fontWeight: 600, fontSize: '0.75rem',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#64748B',
    borderBottom: '2px solid',
    borderColor: 'divider',
    whiteSpace: 'nowrap',
  },
};
const TABLE_ROW_SX = {
  '&:hover': { bgcolor: alpha('#6366f1', 0.02) },
  '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04), verticalAlign: 'top' },
  transition: 'background 0.15s',
};

function RecapCard({ title, value, icon, isMoney = false, loading }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>{icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{title}</Typography>
            {loading
              ? <Skeleton width={120} height={26} />
              : <Typography variant="subtitle2" fontWeight={700}>{isMoney ? idr(safeNum(value)) : safeNum(value).toLocaleString('id-ID')}</Typography>
            }
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ==========================
 * Expanded content
   ========================== */
function ExpandedRecap({ row, colSpan }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 30;

  const accounts = parseAccounts(row?.accounts);
  const sender = toSenderLabel(row?.user_sender);
  const userName = row?.user_name || '-';

  const maxCols = useMemo(() => {
    let m = 0;
    for (const r of accounts) { if (Array.isArray(r)) m = Math.max(m, r.length); else m = Math.max(m, 1); }
    return Math.max(m, 1);
  }, [accounts]);

  const fieldHeaders = useMemo(() => Array.from({ length: maxCols }).map((_, i) => `FIELD ${i + 1}`), [maxCols]);

  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ p: 0, borderBottom: 'none' }}>
        <Box sx={{ p: 2.5, backgroundColor: alpha('#6366f1', 0.015), minWidth: '1100px' }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Typography sx={labelStyle}>User</Typography>
              <Typography sx={valueStyle}>
                {userName}{' '}
                <Typography component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>({sender})</Typography>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={labelStyle}>Accounts Count</Typography>
              <Typography sx={valueStyle}>{accounts.length}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: 13 }}>Accounts Detail</Typography>
              {accounts.length === 0 ? (
                <Typography sx={valueStyle} color="text.disabled">-</Typography>
              ) : (
                <Table size="small" sx={{ background: '#fff', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 50, fontSize: 11 }}>#</TableCell>
                      {fieldHeaders.map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accounts.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((accRow, idx) => {
                      const cols = Array.isArray(accRow) ? accRow : [String(accRow)];
                      const actualIdx = (page - 1) * rowsPerPage + idx + 1;
                      return (
                        <TableRow key={actualIdx} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontSize: 12 }}>{actualIdx}</TableCell>
                          {fieldHeaders.map((_, ci) => (
                            <TableCell key={ci} sx={{ fontSize: 12, fontFamily: 'monospace' }}>{cols[ci] != null ? String(cols[ci]) : '-'}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {Math.ceil(accounts.length / rowsPerPage) > 1 && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Menampilkan {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, accounts.length)} dari {accounts.length} akun
                  </Typography>
                  <Pagination 
                    count={Math.ceil(accounts.length / rowsPerPage)} 
                    page={page} 
                    onChange={(_, v) => setPage(v)} 
                    size="small" 
                    color="primary" 
                    shape="rounded"
                  />
                </Stack>
              )}
            </Grid>
          </Grid>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default function RecapProductPage() {
  const [form, setForm] = useState({
    page: 1, startDate: '', endDate: '', title: '',
    paymentReffId: '', userSender: '', stockTitle: '',
    status_type: '', account: '', platform: '',
    sortBy: 'createdAt', sortOrder: 'DESC',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const abort = useRef(new Aborter());
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleExpanded = id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const [debouncedTitle, setDebouncedTitle] = useState(form.title);
  const [debouncedAccount, setDebouncedAccount] = useState(form.account);

  useEffect(() => { const t = setTimeout(() => setDebouncedTitle(form.title), 250); return () => clearTimeout(t); }, [form.title]);
  useEffect(() => { const t = setTimeout(() => setDebouncedAccount(form.account), 250); return () => clearTimeout(t); }, [form.account]);

  const recap = result?.recap || null;
  const list = result?.list || null;
  const rows = list?.rows || [];
  const total = list?.count ?? 0;
  const totalPages = list?.totalPages ?? 1;

  const cleanBody = payload => Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));

  const fetchData = payload => {
    setLoading(true);
    abort.current.abort();
    abort.current = new Aborter();
    reqOwner({ action: 'getRecapProduct', ...cleanBody(payload) }, { signal: abort.current.signal })
      .then(d => { if (!d?.error) setResult(d?.data || d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { startTransition(() => fetchData(form)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData({ ...form, title: debouncedTitle, account: debouncedAccount, page: 1 }); }, [debouncedTitle, debouncedAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDateChange = (key, e) => {
    const val = e?.toDate?.();
    const updated = { ...form, [key]: val, page: 1 };
    setForm(updated);
    fetchData(updated);
  };

  const onFieldChange = (key, value) => {
    const updated = { ...form, [key]: value, page: 1 };
    setForm(updated);
    fetchData(updated);
  };

  const sortOptions = useMemo(() => [
    { label: 'Created At', value: 'createdAt' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Price Total', value: 'price_total' },
    { label: 'Profit', value: 'profit' },
    { label: 'Title', value: 'title' },
    { label: 'Note', value: 'note' },
    { label: 'Price', value: 'price' },
    { label: 'ID', value: 'id' },
  ], []);

  const COLUMNS = useMemo(() => [
    { key: '_exp', label: '', align: 'center', width: 40 },
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'reff_id', label: 'REFF ID', align: 'center' },
    { key: 'title', label: 'NAMA', align: 'center' },
    { key: 'accounts', label: 'ACCOUNTS', align: 'center' },
    { key: 'platform', label: 'PLATFORM', align: 'center' },
    { key: 'status_type', label: 'TIPE STATUS', align: 'center' },
    { key: 'note', label: 'CATATAN SELLER', align: 'center' },
    { key: 'price', label: 'HARGA', align: 'center' },
    { key: 'quantity', label: 'JUMLAH', align: 'center' },
    { key: 'price_total', label: 'TOTAL', align: 'center' },
    { key: 'profit', label: 'PROFIT', align: 'center' },
    { key: 'user_sender', label: 'SENDER', align: 'center' },
    { key: 'user_name', label: 'USER', align: 'center' },
    { key: 'createdAt', label: 'DIBUAT', align: 'center' },
  ], []);

  const exportToExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const base = { ...form, page: 1, title: debouncedTitle, account: debouncedAccount };
      const first = await reqOwner({ action: 'getRecapProduct', ...cleanBody(base) });
      if (first?.error) throw new Error(first?.message || 'Gagal export');
      const firstData = first?.data || first;
      const pageMax = firstData?.list?.totalPages || 1;
      let allRows = [...(firstData?.list?.rows || [])];
      for (let p = 2; p <= pageMax; p++) {
        const res = await reqOwner({ action: 'getRecapProduct', ...cleanBody({ ...base, page: p }) });
        if (res?.error) throw new Error(res?.message || `Gagal ambil page ${p}`);
        const d = res?.data || res;
        allRows = allRows.concat(d?.list?.rows || []);
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Recap Product');
      const rc = firstData?.recap || {};
      sheet.addRow(['RECAP PRODUCT']);
      sheet.addRow(['Total Rows', safeNum(rc.totalRows)]);
      sheet.addRow(['Total Quantity', safeNum(rc.totalQuantity)]);
      sheet.addRow(['Total Price Total', safeNum(rc.totalPriceTotal)]);
      sheet.addRow(['Total Profit', safeNum(rc.totalProfit)]);
      sheet.addRow([]); sheet.addRow(['Filters']);
      sheet.addRow(['Date', `${form.startDate ? dateParse(form.startDate) : '-'} s/d ${form.endDate ? dateParse(form.endDate) : '-'}`]);
      sheet.addRow(['Title', form.title || '-']);
      sheet.addRow(['Catatan Seller', form.note || '-']);
      sheet.addRow(['Reff ID', form.paymentReffId || '-']);
      sheet.addRow(['Pembeli/ID', form.userSender || '-']);
      sheet.addRow(['Nama Produk', form.stockTitle || '-']);
      sheet.addRow(['Status', form.status_type || '-']);
      sheet.addRow(['Platform', form.platform || 'all']);
      sheet.addRow(['Akun', form.account || '-']);
      sheet.addRow([]); sheet.addRow([]);

      const headerRowIndex = sheet.rowCount + 1;
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Payment Reff ID', key: 'reff_id', width: 22 },
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Platform', key: 'platform', width: 15 },
        { header: 'Status Type', key: 'status_type', width: 20 },
        { header: 'Price', key: 'price', width: 16 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Price Total', key: 'price_total', width: 18 },
        { header: 'Profit', key: 'profit', width: 16 },
        { header: 'Sender', key: 'user_sender', width: 18 },
        { header: 'Note', key: 'note', width: 18 },
        { header: 'User Name', key: 'user_name', width: 18 },
        { header: 'Accounts (raw)', key: 'accounts', width: 50 },
        { header: 'Created At', key: 'createdAt', width: 24 },
      ];
      sheet.getRow(headerRowIndex).font = { bold: true };

      allRows.forEach(r => {
        sheet.addRow({
          id: r.id, reff_id: r.reff_id || '-', title: r.title || '-',
          platform: r.platform || '-',
          status_type: r.status_type || '-', price: safeNum(r.price),
          quantity: safeNum(r.quantity), note: r.note || '-',
          price_total: safeNum(r.price_total), profit: safeNum(r.profit),
          user_sender: toSenderLabel(r.user_sender), user_name: r.user_name || '-',
          accounts: r.accounts || '-', createdAt: r.createdAt ? `${dateParse(r.createdAt)} WIB` : '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `recap-product-${Date.now()}.xlsx`);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <ReceiptLong sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>Rekap Produk</Typography>
          <Typography variant="caption" color="text.secondary">Analisis transaksi, akun, dan profit per produk</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Muat ulang data">
            <Button size="small" variant="outlined" startIcon={<Refresh sx={{ fontSize: 16 }} />} onClick={() => fetchData({ ...form, title: debouncedTitle, account: debouncedAccount })} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Muat
            </Button>
          </Tooltip>
          <Button variant="contained" color="success" size="small" onClick={exportToExcel} disabled={loading || exporting || !result} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
        Pastikan profit produk sudah di-setting dengan tepat untuk hasil rekap yang akurat.
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <RecapCard title="Total Rows" value={recap?.totalRows ?? 0} icon={<Inventory2 sx={{ fontSize: 18 }} />} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <RecapCard title="Total Quantity" value={recap?.totalQuantity ?? 0} icon={<Inventory2 sx={{ fontSize: 18 }} />} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <RecapCard title="Total Omzet" value={recap?.totalPriceTotal ?? 0} icon={<AccountBalanceWallet sx={{ fontSize: 18 }} />} isMoney loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <RecapCard title="Total Profit" value={recap?.totalProfit ?? 0} icon={<TrendingUp sx={{ fontSize: 18 }} />} isMoney loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={1.5}>
            {/* Row 1: Search Fields */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Cari Nama" size="small" fullWidth
                value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value, page: 1 }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Cari Account" size="small" fullWidth
                value={form.account} onChange={e => setForm(s => ({ ...s, account: e.target.value, page: 1 }))}
                placeholder="mis: email@gmail.com"
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Cari Reff ID" size="small" fullWidth value={form.paymentReffId} onChange={e => onFieldChange('paymentReffId', e.target.value)} sx={{ borderRadius: 2 }} />
            </Grid>

            {/* Row 2: Additional Filters */}
            <Grid item xs={12} md={4}>
              <TextField label="Pembeli" size="small" fullWidth value={form.userSender} onChange={e => onFieldChange('userSender', e.target.value)} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Cari Nama Produk" size="small" fullWidth value={form.stockTitle} onChange={e => onFieldChange('stockTitle', e.target.value)} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Tipe Status" size="small" fullWidth value={form.status_type} onChange={e => onFieldChange('status_type', e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="">Semua</MenuItem>
                {ALLOWED_STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Row 3: Sort & Platform */}
            <Grid item xs={12} md={4}>
              <TextField select label="Urutkan" size="small" fullWidth value={form.sortBy} onChange={e => onFieldChange('sortBy', e.target.value)} sx={{ borderRadius: 2 }}>
                {sortOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Order" size="small" fullWidth value={form.sortOrder} onChange={e => onFieldChange('sortOrder', e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="DESC">Teratas</MenuItem>
                <MenuItem value="ASC">Terdahulu</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select label="Platform" size="small" fullWidth value={form.platform} onChange={e => onFieldChange('platform', e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="">Semua Platform</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="telegram">Telegram</MenuItem>
                <MenuItem value="web">Web</MenuItem>
              </TextField>
            </Grid>

            {/* Row 4: Date Range */}
            <Grid item xs={12} md={6}>
              <DatePicker label="Dari" onChange={e => onDateChange('startDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.startDate ? dayjs(form.startDate) : null} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker label="Sampai" onChange={e => onDateChange('endDate', e)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2 } }} value={form.endDate ? dayjs(form.endDate) : null} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!loading && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: 12 }}>
          Ditemukan <b>{total.toLocaleString('id-ID')}</b> data
        </Typography>
      )}

      {/* Table */}
      <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto' }}>
        <Table size="small" sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow sx={TABLE_HEAD_SX}>
              {COLUMNS.map(c => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderSkeletonRow(COLUMNS.length, 10)
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <ReceiptLong sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography color="text.disabled">Belum ada data rekap</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows.map(row => {
              const isExpanded = expandedIds.has(row.id);
              const accs = parseAccounts(row.accounts);
              const sender = toSenderLabel(row.user_sender);
              return (
                <React.Fragment key={row.id}>
                  <TableRow hover sx={{ ...TABLE_ROW_SX, cursor: 'pointer' }} onClick={() => toggleExpanded(row.id)}>
                    <TableCell align="center" sx={{ width: 40 }}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); toggleExpanded(row.id); }} sx={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <KeyboardArrowDown sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{row.id}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.reff_id || '-'}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={500} wrap sx={{ maxWidth: 200 }}>{row.title || '-'}</Typography></TableCell>
                    <TableCell align="center" sx={{ minWidth: 200 }}>
                      {accs.length ? (
                        <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                          {accs.slice(0, 2).map((ar, i) => <Chip key={i} size="small" variant="outlined" label={accountRowSummary(ar)} sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />)}
                          {accs.length > 2 && <Chip size="small" variant="outlined" label={`+${accs.length - 2}`} sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />}
                        </Stack>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 11 }}>
                        {row.platform || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={row.status_type || '-'} size="small" color={statusChipColor(row.status_type)} sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell align="center"><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>{row.note || '-'}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{idr(safeNum(row.price))}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{safeNum(row.quantity).toLocaleString('id-ID')}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" fontWeight={600}>{idr(safeNum(row.price_total))}</Typography></TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700} color={safeNum(row.profit) >= 0 ? 'success.main' : 'error.main'}>
                        {idr(safeNum(row.profit))}
                      </Typography>
                    </TableCell>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontSize: 12 }}>{sender}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{row.user_name || '-'}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{row.createdAt ? dateParse(row.createdAt) : '-'}</Typography></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} sx={{ p: 0, borderBottom: 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Table size="small"><TableBody><ExpandedRecap row={row} colSpan={COLUMNS.length} /></TableBody></Table>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && (
        <Stack direction="row" justifyContent="center" mt={2.5}>
          <Pagination
            count={Math.max(1, totalPages)} page={form.page}
            onChange={(_, value) => { const updated = { ...form, page: value }; setForm(updated); fetchData(updated); }}
            color="primary" shape="rounded" size="small"
            showFirstButton showLastButton
          />
        </Stack>
      )}
    </Box>
  );
}