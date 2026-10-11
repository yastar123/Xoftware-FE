import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Card, TextField,
  Stack, Pagination, Typography, Chip, Skeleton, Button, MenuItem, Grid, alpha,
  CardContent, FormControl, Select, Popover, IconButton,
} from '@mui/material';
import { Refresh, AccountBalance, TrendingUp, TrendingDown, Add, Delete, Close } from '@mui/icons-material';
import { DateRangePicker } from 'react-date-range';
import { motion } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import DynamicFilterBuilder from '../DynamicFilterBuilder';

const statusColor = { SUCCESS: 'success', PENDING: 'warning', FAILED: 'error' };

const FILTER_FIELDS = [
  { value: 'createdAt', label: 'Tanggal', type: 'dateRange' },
  { value: 'payment.reff_id', label: 'Reff ID', type: 'text' },
  { value: 'type', label: 'Tipe Transaksi', type: 'select', options: ['kredit', 'debit'] },
  { value: 'status', label: 'Status Saldo', type: 'select', options: ['success', 'pending', 'failed'] },
  { value: 'amount', label: 'Nominal / Amount', type: 'number' },
];

export default function MutationMerchant() {
  const [form, setForm] = useState({ search: '', page: 1, limit: 20 });
  const [filters, setFilters] = useState([
    { id: 1, field: 'createdAt', op: 'between', value: [dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'), dayjs().endOf('day').format('YYYY-MM-DDTHH:mm')] }
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const abort = useRef(new AbortController());
  const [debouncedSearch, setDebouncedSearch] = useState(form.search);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(form.search), 300); return () => clearTimeout(t); }, [form.search]);

  const fetchData = (payload) => {
    setLoading(true);
    if (abort.current) abort.current.abort();
    abort.current = new AbortController();
    const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    reqOwner({ action: 'mutation.list', filters, ...body }, { signal: abort.current.signal })
      .then(d => { if (!d?.error) setResult(d.data || d); })
      .catch(() => { })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== undefined && v !== null));
      const res = await reqOwner({ action: 'mutation.export', filters, ...body });
      
      const dataRows = res?.data?.rows || res?.rows || [];
      if (!dataRows.length) {
        toast.info('Tidak ada data untuk diexport');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Mutasi QRIS');
      sheet.columns = [
        { header: 'Waktu/Tanggal', key: 'created_at', width: 25 },
        { header: 'Reff ID/WD ID', key: 'reff_id', width: 25 },
        { header: 'Tipe', key: 'type', width: 15 },
        { header: 'Kredit', key: 'kredit', width: 15 },
        { header: 'Debit', key: 'debet', width: 15 },
        { header: 'Saldo Akhir', key: 'total_saldo', width: 15 },
        { header: 'Saldo Unsettle', key: 'saldo_unsettle', width: 15 },
        { header: 'Note', key: 'note', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
      ];

      dataRows.forEach(item => {
        sheet.addRow({
          created_at: `${dateParse(item.created_at)} WIB`,
          reff_id: item.reff_id || item.withdraw_id || '-',
          type: item.type,
          kredit: item.kredit || 0,
          debet: item.debet || 0,
          total_saldo: item.total_saldo || 0,
          saldo_unsettle: item.saldo_unsettle || 0,
          note: item.note || '-',
          status: item.status || '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `mutation-qris-${Date.now()}.xlsx`);
      toast.success('Berhasil mendownload laporan');
    } catch {
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(form); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData({ ...form, search: debouncedSearch, page: 1 }); }, [debouncedSearch, form.type]);

  const onDateChange = (key, e) => { const val = e?.toDate?.(); const updated = { ...form, [key]: val, page: 1 }; setForm(updated); fetchData(updated); };
  const onChangeField = (key) => (e) => { const val = e.target.value; setForm(s => ({ ...s, [key]: val, ...(key !== 'page' ? { page: 1 } : {}) })); };

  const rows = result?.rows || [];
  const total = result?.count || 0;
  const pageCount = Math.max(1, Math.ceil(total / form.limit));

  const getTypeColor = (row) => row.kredit > 0 ? 'success' : row.debet > 0 ? 'error' : 'default';

  const totalKredit = rows.reduce((s, r) => s + (r.kredit || 0), 0);
  const totalDebet = rows.reduce((s, r) => s + (r.debet || 0), 0);

  const renderSkeleton = () => [...Array(8)].map((_, i) => (
    <TableRow key={`sk-${i}`}>{Array(8).fill(0).map((_, j) => <TableCell key={j} align="center"><Skeleton variant="text" width="75%" height={18} /></TableCell>)}</TableRow>
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
              <AccountBalance sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Riwayat Mutasi Saldo</Typography>
              <Typography variant="caption" color="text.secondary">{total} mutasi ditemukan</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={refreshing ? <React.Fragment /> : <Refresh sx={{ fontSize: 16 }} />} onClick={() => { setRefreshing(true); fetchData({ ...form, search: debouncedSearch }); }} disabled={refreshing} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {refreshing ? 'Merefresh…' : 'Refresh'}
            </Button>
            <Button size="small" variant="contained" color="success" onClick={exportToExcel} disabled={exporting || loading} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#10b981', 0.08), color: '#10b981', display: 'grid', placeItems: 'center' }}><TrendingUp sx={{ fontSize: 16 }} /></Box>
                  <Box><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total Kredit</Typography><Typography variant="subtitle2" fontWeight={700} color="success.main">{idr(totalKredit)}</Typography></Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#ef4444', 0.08), color: '#ef4444', display: 'grid', placeItems: 'center' }}><TrendingDown sx={{ fontSize: 16 }} /></Box>
                  <Box><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total Debit</Typography><Typography variant="subtitle2" fontWeight={700} color="error.main">{idr(totalDebet)}</Typography></Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack
          spacing={2}
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          sx={{ mb: 3, gap: 3 }}
        >
          {loading ? (
            <Stack direction="row" spacing={2} width="100%">
              <Skeleton variant="rounded" width={140} height={40} />
              <Skeleton variant="rounded" width={140} height={40} />
            </Stack>
          ) : (
            <DynamicFilterBuilder
              filters={filters}
              setFilters={setFilters}
              filterFields={FILTER_FIELDS}
              onSearch={() => {
                setForm({ ...form, page: 1 });
                fetchData({ ...form, page: 1 });
              }}
              loading={loading}
            />
          )}
        </Stack>

        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', borderBottom: '2px solid', borderColor: 'divider' } }}>
                <TableCell>Waktu/Tanggal</TableCell>
                <TableCell align="center">Reff ID/WD ID</TableCell>
                <TableCell align="center">Tipe</TableCell>
                <TableCell align="right">Kredit</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Saldo Akhir</TableCell>
                <TableCell align="right">Saldo Unsettle</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? renderSkeleton() : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.disabled">Tidak ada data mutasi ditemukan</Typography></TableCell></TableRow>
              ) : rows.map(row => (
                <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) }, transition: 'background 0.15s' }}>
                  <TableCell sx={{ fontSize: 12 }}>{dateParse(row.created_at)} WIB</TableCell>
                  <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.reff_id || row.withdraw_id || '-'}</Typography></TableCell>
                  <TableCell align="center"><Chip label={row.kredit > 0 ? 'KREDIT' : 'DEBIT'} color={getTypeColor(row)} size="small" sx={{ fontWeight: 600, fontSize: 11, borderRadius: 1.5 }} /></TableCell>
                  <TableCell align="right"><Typography color="success.main" fontWeight={600} sx={{ fontSize: 13 }}>{row.kredit > 0 ? `+${idr(row.kredit)}` : '-'}</Typography></TableCell>
                  <TableCell align="right"><Typography color="error.main" fontWeight={600} sx={{ fontSize: 13 }}>{row.debet > 0 ? `-${idr(row.debet)}` : '-'}</Typography></TableCell>
                  <TableCell align="right"><Typography fontWeight={600} sx={{ fontSize: 13 }}>{idr(row.total_saldo)}</Typography></TableCell>
                  <TableCell align="right"><Typography fontWeight={600} sx={{ fontSize: 13, color: 'warning.main' }}>{idr(row.saldo_unsettle || 0)}</Typography></TableCell>
                  <TableCell sx={{ maxWidth: 200, fontSize: 12, color: 'text.secondary' }}>{row.note}</TableCell>
                  <TableCell align="center"><Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" sx={{ fontWeight: 500, fontSize: 11, borderRadius: 1.5 }} /></TableCell>
                </TableRow>
              ))}
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
