import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, ListItemButton, ListItemText, Card, CardContent, Stack, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Chip, MenuItem, Tooltip, Divider, IconButton, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, Grid, alpha, InputAdornment } from '@mui/material';
import { Lock, Settings as SettingsIconMui, Category, ListAlt, Edit, VisibilityOff, Visibility, Search, RestartAlt } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';
import SMMInformation from './smmInformation';
import { motion } from "framer-motion"

function Toast({ toast, setToast }) {
  return (
    <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}>
      <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 2 }}>{toast.msg}</Alert>
    </Snackbar>
  );
}

const ProfitTypeSelect = ({ value, onChange, label = 'Tipe Profit' }) => (
  <TextField select label={label} size="small" fullWidth value={value ?? 'nominal'} onChange={e => onChange(e.target.value)} sx={{ borderRadius: 2 }}>
    <MenuItem value="nominal">Nominal</MenuItem>
    <MenuItem value="percent">Percent (%)</MenuItem>
  </TextField>
);

export function useSmmGate() {
  const [state, setState] = React.useState({ checking: true, allowed: false, message: '', notify: null });
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reqOwner({ action: 'isSupportSmm' });
        if (!alive) return;
        if (!res?.error) setState({ checking: false, allowed: true, message: '', notify: null });
        else setState({ checking: false, allowed: false, message: res?.message || 'Access denied!', notify: res?.data?.notify });
      } catch (e) {
        if (!alive) return;
        setState({ checking: false, allowed: false, message: e?.message || 'Access denied!', notify: null });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

const TABLE_HEAD_SX = {
  '& th': {
    bgcolor: alpha('#6366f1', 0.04),
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748B',
    borderBottom: '2px solid',
    borderColor: 'divider',
    whiteSpace: 'nowrap',
  },
};
const TABLE_ROW_SX = {
  '&:hover': { bgcolor: alpha('#6366f1', 0.02) },
  '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) },
  transition: 'background 0.15s',
};

export function SmmCategories({ notify }) {
  const [toast, setToast] = useState({ open: false, severity: 'success', msg: '' });
  const openToast = (msg, severity = 'success') => setToast({ open: true, severity, msg });
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dlg, setDlg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'md.getServiceCategories', search, page: p });
      if (res?.error) openToast(res.message || 'Gagal load category', 'error');
      else {
        setRows(res.data?.data || []);
        setPage(res.data?.page || p);
        setTotalPages(res.data?.totalPages || 1);
      }
    } catch (e) {
      openToast(e?.message || 'Gagal load category', 'error');
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1); }, []);

  const toggleHide = async row => {
    try {
      const res = await reqOwner({ action: 'md.setCategoryHide', id: row.id, is_hide: !row.is_hide });
      if (res?.error) openToast(res.message || 'Gagal ubah hide category', 'error');
      else { openToast('Hide Category berhasil diubah'); load(page); }
    } catch (e) { openToast(e?.message || 'Gagal ubah hide category', 'error'); }
  };

  const openEditProfit = row => setDlg({ isAll: false, id: row.id, name: row.name, profit: Number(row.profit_value || 0), profit_type: row.profit_type || 'nominal' });
  const openAllProfit = () => setDlg({ isAll: true, id: null, name: 'All Categories', profit: 0, profit_type: 'nominal' });

  const saveProfit = async () => {
    if (!dlg) return;
    try {
      const payload = dlg.isAll
        ? { action: 'md.setProfitCategory', isAll: true, profit: Number(dlg.profit), profitType: dlg.profit_type }
        : { action: 'md.setProfitCategory', id: Number(dlg.id), profit: Number(dlg.profit), profitType: dlg.profit_type };
      const res = await reqOwner(payload);
      if (res?.error) openToast(res.message || 'Gagal simpan profit category', 'error');
      else { openToast('Profit berhasil diubah'); setDlg(null); load(page); }
    } catch (e) { openToast(e?.message || 'Gagal simpan profit category', 'error'); }
  };

  return (
    <Box>
      {notify && (
        <Alert severity="info" component="pre" sx={{ mt: 2, mb: 2.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}>
          {notify}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems="center" flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Category sx={{ fontSize: 24, color: '#6366f1' }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>Kategori SMM</Typography>
              <Typography variant="caption" color="text.secondary">Kelola visibilitas dan profit per kategori</Typography>
            </Box>
          </Stack>
          <TextField
            size="small"
            label="Search category"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 240, borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => load(1)} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>Search</Button>
            <Chip size="small" label={`${rows.length} items`} variant="outlined" sx={{ borderRadius: 1.5 }} />
          </Stack>
        </Stack>
        <Button
          startIcon={<SettingsIconMui sx={{ fontSize: 16 }} />}
          variant="contained"
          onClick={openAllProfit}
          sx={{ borderRadius: 2, textTransform: 'none', px: 2.5, height: 36 }}
        >
          Setting Profit All
        </Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Grid container spacing={1.5}>
          {rows.map((c, i) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={800} fontSize={14}>{c.name}</Typography>
                        <Chip size="small" label={(c.type || 'other').toUpperCase()} variant="outlined" sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />
                      </Stack>
                      <Tooltip title={c.is_hide ? 'Hidden' : 'Visible'}>
                        <IconButton size="small" onClick={() => toggleHide(c)}>
                          {c.is_hide ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip size="small" label={c.profit_type === 'percent' ? `Profit: ${Number(c.profit_value || 0)}%` : `Profit: ${idr(Number(c.profit_value || 0))}`} sx={{ fontSize: 11, borderRadius: 1.5 }} />
                      <Tooltip title="Edit profit category">
                        <IconButton size="small" onClick={() => openEditProfit(c)}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack alignItems="center" mt={2.5}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => load(v)} color="primary" shape="rounded" size="small" />
      </Stack>

      <Dialog open={!!dlg} onClose={() => setDlg(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{dlg?.isAll ? 'Setting Profit All Categories' : `Edit Profit: ${dlg?.name || ''}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {!dlg?.isAll && <TextField label="Category" size="small" value={dlg?.name || ''} fullWidth disabled sx={{ borderRadius: 2 }} />}
            <ProfitTypeSelect value={dlg?.profit_type || 'nominal'} onChange={v => setDlg(d => ({ ...d, profit_type: v }))} />
            <TextField
              label="Profit"
              type="number"
              size="small"
              fullWidth
              value={dlg?.profit ?? 0}
              onChange={e => setDlg(d => ({ ...d, profit: Number(e.target.value) }))}
              helperText={dlg?.profit_type === 'percent' ? 'Profit percent harus 0–100' : 'Profit nominal (IDR)'}
              sx={{ borderRadius: 2 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlg(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={saveProfit} sx={{ borderRadius: 2, textTransform: 'none' }}>Simpan</Button>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} setToast={setToast} />
    </Box>
  );
}

export function SmmServices({ notify }) {
  const [toast, setToast] = useState({ open: false, severity: 'success', msg: '' });
  const openToast = (msg, severity = 'success') => setToast({ open: true, severity, msg });
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dlg, setDlg] = useState(null);

  const buildPayload = (p = 1) => {
    const payload = { action: 'md.getServiceList', search, page: p, sort, order };
    if (String(priceMin).trim() !== '') payload.price_min = Number(priceMin);
    if (String(priceMax).trim() !== '') payload.price_max = Number(priceMax);
    return payload;
  };

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await reqOwner(buildPayload(p));
      if (res?.error) openToast(res.message || 'Gagal load service', 'error');
      else {
        setRows(res.data?.data || []);
        setPage(res.data?.page || p);
        setTotalPages(res.data?.totalPages || 1);
      }
    } catch (e) { openToast(e?.message || 'Gagal load service', 'error'); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1); }, []);

  const onApplyFilter = () => load(1);
  const onResetFilter = () => {
    setSearch('');
    setSort('date');
    setOrder('desc');
    setPriceMin('');
    setPriceMax('');
    setTimeout(() => load(1), 0);
  };

  const toggleHide = async row => {
    try {
      const res = await reqOwner({ action: 'md.setHideService', id: row.id, is_hide: !row.is_hide });
      if (res?.error) openToast(res.message || 'Gagal ubah hide service', 'error');
      else { openToast('Status hide berhasil dirubah'); load(page); }
    } catch (e) { openToast(e?.message || 'Gagal ubah hide service', 'error'); }
  };

  const openProfit = row => setDlg({ id: row.id, name: row.name, profit: Number(row.profit_value || 0), profit_type: row.profit_type || 'nominal' });

  const saveProfit = async () => {
    if (!dlg) return;
    try {
      const res = await reqOwner({ action: 'md.setProfitService', id: Number(dlg.id), profit: Number(dlg.profit), profitType: dlg.profit_type });
      if (res?.error) openToast(res.message || 'Gagal simpan profit service', 'error');
      else { openToast('Profit berhasil dirubah'); setDlg(null); load(page); }
    } catch (e) { openToast(e?.message || 'Gagal simpan profit service', 'error'); }
  };

  const columns = [
    { key: 'id', label: 'ID', width: 60 },
    { key: 'name', label: 'Nama', minWidth: 280 },
    { key: 'category', label: 'Kategori', width: 120 },
    { key: 'type', label: 'Tipe', width: 100 },
    { key: 'price', label: 'Harga Normal', width: 120, align: 'right' },
    { key: 'price_modify', label: 'Harga + Profit', width: 130, align: 'right' },
    { key: 'limit', label: 'Limit', width: 100, align: 'center' },
    { key: 'is_hide', label: 'Sembunyikan', width: 110, align: 'center' },
    { key: 'profit', label: 'Profit Setting', width: 160, align: 'center' },
  ];

  return (
    <Box>
      {notify && (
        <Alert
          severity="info"
          component="pre"
          sx={{ mt: 2, mb: 2.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
        >
          {notify}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems="center" flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SettingsIconMui sx={{ fontSize: 24, color: '#6366f1' }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>List Layanan SMM</Typography>
              <Typography variant="caption" color="text.secondary">Kelola visibilitas dan profit per layanan</Typography>
            </Box>
          </Stack>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 240, borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Sort"
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            sx={{ minWidth: 150, borderRadius: 2 }}
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="price_min">Price Min</MenuItem>
            <MenuItem value="price_max">Price Max</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Order"
            value={order}
            onChange={e => { setOrder(e.target.value); setPage(1); }}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            <MenuItem value="desc">DESC</MenuItem>
            <MenuItem value="asc">ASC</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="number"
            label="Min"
            value={priceMin}
            onChange={e => { setPriceMin(e.target.value); setPage(1); }}
            sx={{ width: 130, borderRadius: 2 }}
          />
          <TextField
            size="small"
            type="number"
            label="Max"
            value={priceMax}
            onChange={e => { setPriceMax(e.target.value); setPage(1); }}
            sx={{ width: 130, borderRadius: 2 }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onApplyFilter} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>Apply</Button>
            <Button variant="outlined" onClick={onResetFilter} startIcon={<RestartAlt sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>Reset</Button>
          </Stack>
          <Chip size="small" label={`${rows.length} rows`} variant="outlined" sx={{ borderRadius: 1.5 }} />
        </Stack>
      </Stack>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto'}}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={TABLE_HEAD_SX}>
                {columns.map(col => (
                  <TableCell key={col.key} align={col.align || 'left'} sx={{ width: col.width, minWidth: col.minWidth }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id} hover sx={TABLE_ROW_SX}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{r.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                      {r.name}
                    </Typography>
                    {(r.average_time || r.is_refill) && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                        {r.average_time && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            Avg: {r.average_time}
                          </Typography>
                        )}
                        {r.is_refill && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            • Refill
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell><Chip size="small" label={r.category} sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} /></TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={(r.type || 'other').toUpperCase()} sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} /></TableCell>
                  <TableCell align="right">{idr(Number(r.price || 0))}</TableCell>
                  <TableCell align="right"><Typography fontWeight={600}>{idr(Number(r.price_modify || 0))}</Typography></TableCell>
                  <TableCell align="center">{r.min_order}–{r.max_order}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={r.is_hide ? 'Hidden' : 'Visible'}>
                      <span>
                        <IconButton size="small" onClick={() => toggleHide(r)}>
                          {r.is_hide ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <Chip
                        size="small"
                        label={r.profit_type
                          ? (r.profit_type === 'percent' ? `Profit: ${Number(r.profit_value || 0)}%`
                            : `Profit: ${idr(Number(r.profit_value || 0))}`)
                          : 'Profit: (inherit)'}
                        sx={{ fontSize: 10, borderRadius: 1.5 }}
                      />
                      <Tooltip title="Edit profit service">
                        <span>
                          <IconButton size="small" onClick={() => openProfit(r)}>
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack alignItems="center" mt={2.5}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => load(v)} color="primary" shape="rounded" size="small" />
      </Stack>

      <Dialog open={!!dlg} onClose={() => setDlg(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Setting Profit Service</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Service" size="small" value={dlg?.name || ''} fullWidth disabled sx={{ borderRadius: 2 }} />
            <ProfitTypeSelect value={dlg?.profit_type || 'nominal'} onChange={v => setDlg(d => ({ ...d, profit_type: v }))} />
            <TextField
              label="Profit"
              type="number"
              size="small"
              fullWidth
              value={dlg?.profit ?? 0}
              onChange={e => setDlg(d => ({ ...d, profit: Number(e.target.value) }))}
              helperText={dlg?.profit_type === 'percent' ? 'Profit percent harus 0–100' : 'Profit nominal (IDR)'}
              sx={{ borderRadius: 2 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlg(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={saveProfit} sx={{ borderRadius: 2, textTransform: 'none' }}>Simpan</Button>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} setToast={setToast} />
    </Box>
  );
}