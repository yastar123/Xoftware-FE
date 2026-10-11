import { Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Card, TextField, Stack, Pagination, IconButton, Typography, Chip, Skeleton, Button, alpha, Grid, Tooltip } from '@mui/material';
import { RemoveRedEye, Receipt, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';

import { DateRangePicker } from 'react-date-range';
import { Add, Delete, Close } from '@mui/icons-material';
import { FormControl, Select, MenuItem, Popover } from '@mui/material';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

import React, { startTransition, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/Hook/debouncingState';
import { DatePicker } from '@mui/x-date-pickers';
import { reqOwner } from '@/lib/requestApi';
import { dateParse, idr } from '@/lib/helper';
import { useDialog } from '@/Context/Dialog';
import DetailTransaction from './detailTransaction';
import DynamicFilterBuilder from '../DynamicFilterBuilder';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useSocket } from '@/Context/SocketContext';

const statusColor = { success: 'success', pending: 'warning', failed: 'error' };

function convertSettle(settle) {
  if (settle.is_error) return { color: 'error', bg: 'orange', label: 'Error' };
  if (settle.is_process) return { color: 'success', bg: 'cyan', label: 'Settle' };
  if (!settle.is_process) return { color: 'warning', bg: 'red', label: 'Unsettle' };
  if (settle.is_lock) return { color: 'default', bg: 'red', label: 'Locked' };
  return { color: '', bg: '', label: '-' };
}

const FILTER_FIELDS = [
  { value: 'createdAt', label: 'Tanggal', type: 'dateRange' },
  { value: 'reff_id', label: 'ID Trx / Reff ID', type: 'text' },
  { value: 'type', label: 'Tipe Transaksi', type: 'select', options: ['buy', 'deposit', 'depositbalance', 'ppob'] },
  { value: 'status', label: 'Status TRX', type: 'select', options: ['success', 'pending', 'failed'] },
  { value: 'amount', label: 'Nominal / Amount', type: 'number' },
  { value: 'detail_server.gateway', label: 'Gateway', type: 'text' },
  { value: 'user_id', label: 'Pengguna / User ID', type: 'number' },
  { value: 'bot.username', label: 'Bot / Sub Akun', type: 'text' },
  { value: 'settlement.is_process', label: 'Status Saldo (Success)', type: 'select', options: ['true', 'false'] },
  { value: 'settlement.is_error', label: 'Status Saldo (Error)', type: 'select', options: ['true', 'false'] },
  { value: 'settlement.is_lock', label: 'Status Saldo (Lock)', type: 'select', options: ['true', 'false'] },
  { value: 'platform', label: 'Platform', type: 'text' },
  { value: 'detail_product.code', label: 'Nama Produk', type: 'text' },
];

export default function TransactionContent() {

  const [form, setForm] = useState({ search: '', page: 1 });
  const [filters, setFilters] = useState([
    { id: 1, field: 'createdAt', op: 'between', value: [dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'), dayjs().endOf('day').format('YYYY-MM-DDTHH:mm')] }
  ]);
  const [exporting, setExporting] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { openDialog, closeDialog } = useDialog();
  const { socket } = useSocket();
  const abort = useRef(new AbortController());
  const debounceSearch = useDebounce(form.search, 200);

  // Track if user is busy with search/filters to pause auto-reload
  useEffect(() => {
    if (!socket) return;
    const isBusy = !!(form.search || filters.length > 0 || form.page !== 1);
    socket.emit('ui_state', { isBusy });
  }, [form, filters, socket]);

  const fetchData = (payload, silent = false) => {
    if (!silent) setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    reqOwner({ action: 'getTransaction', filters, ...payload }, { signal: abort.current.signal })
      .then(d => { if (!d.error) setResult(d.data); })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  // Listen for realtime reload from server
  useEffect(() => {
    if (!socket) return;
    const onReload = (data) => {
      if (data?.action?.includes('getTransaction')) {
        fetchData(form, true); // true = silent refresh (no skeleton)
      }
    };
    socket.on('o2_reload', onReload);
    return () => socket.off('o2_reload', onReload);
  }, [socket, form]);


  const validateExportRange = () => {
    const dateFilter = filters.find(f => f.field === 'createdAt');
    if (!dateFilter || !dateFilter.value || dateFilter.value.length !== 2) {
      toast.error("Export wajib memiliki kriteria filter Tanggal (Diantara).");
      return false;
    }
    const s = dayjs(dateFilter.value[0]);
    const e = dayjs(dateFilter.value[1]);
    if (!s.isValid() || !e.isValid()) {
      toast.error("Format tanggal tidak valid.");
      return false;
    }
    const diffDays = e.startOf("day").diff(s.startOf("day"), "day");
    if (diffDays > 31) {
      toast.error("Maksimal rentang export adalah 31 hari.");
      return false;
    }
    return true;
  };

  const exportToExcel = async () => {
    if (!validateExportRange()) return;
    if (exporting) return;

    setExporting(true);
    toast.info("Menyiapkan export, mohon tunggu...");

    try {
      const res = await reqOwner({ action: "downloadTransaction", filters, search: form.search });
      if (res.error) throw new Error(res?.message || 'Error tidak diketahui')
      
      const dataRows = res?.data?.rows || res?.rows || [];
      if (!dataRows.length) {
        toast.info('Tidak ada data untuk diexport');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Transactions");
      sheet.columns = [
        { header: "Reff ID", key: "reff_id", width: 25 },
        { header: "Buyer", key: "buyer", width: 20 },
        { header: "Jumlah", key: "amount", width: 15 },
        { header: "Jumlah masuk", key: "amount_in", width: 15 },
        { header: "Platform", key: "platform", width: 15 },
        { header: "Type", key: "type", width: 15 },
        { header: "Status Settle", key: "statusSettle", width: 15 },
        { header: "Status TRX", key: "statusTrx", width: 15 },
        { header: "Created At", key: "createdAt", width: 25 },
      ];

      dataRows.forEach(item => {
        const settle = item.settlement || {};
        let badge = 'Pending';
        if (settle.is_error) badge = 'Error';
        else if (settle.is_process) badge = 'Success';
        else if (settle.is_lock) badge = 'Lock';

        sheet.addRow({
          reff_id: item.reff_id,
          buyer: item.user?.sender?.split('@')?.[0] || '-',
          amount: item.amount || 0,
          amount_in: settle.amount || 0,
          platform: item.platform,
          type: item.type,
          statusSettle: badge,
          statusTrx: item.status,
          createdAt: item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') + " WIB" : "-",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `TransaksiQRIS-${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
      toast.success(`Export selesai....`);
    } catch (e) {
      toast.error(e?.message || "Export gagal.");
    } finally {
      setExporting(false);
    }
  };


  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { fetchData(form); }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData({ ...form, search: debounceSearch }); }, [debounceSearch]);

  const renderSkeleton = () => [...Array(10)].map((_, i) => (
    <TableRow key={`sk-${i}`}>{Array(10).fill(0).map((_, idx) => <TableCell align="center" key={idx}><Skeleton variant="text" width="75%" height={18} /></TableCell>)}</TableRow>
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
              <Receipt sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Transaksi QRIS</Typography>
              <Typography variant="caption" color="text.secondary">{result?.count || 0} transaksi ditemukan</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={refreshing ? <React.Fragment /> : <Refresh sx={{ fontSize: 16 }} />} onClick={() => { setRefreshing(true); fetchData(form); }} disabled={refreshing} sx={{ borderRadius: 2, textTransform: 'none' }}>
              {refreshing ? '…' : 'Refresh'}
            </Button>
            {!loading && result && (
              <Button variant="contained" color="success" onClick={exportToExcel} disabled={exporting} size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>{exporting ? 'Mengekspor' : 'Export'}</Button>
            )}
          </Stack>
        </Stack>


        <Stack
          spacing={2}
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3, gap: 3 }}
        >
          {loading ? (
            <Stack direction="row" spacing={2} width="100%">
              <Skeleton variant="rounded" width={140} height={40} />
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
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', borderBottom: '2px solid', borderColor: 'divider' } }}>
                <TableCell align="center">Reff ID</TableCell>
                <TableCell align="center">Buyer</TableCell>
                <TableCell align="center">Jumlah</TableCell>
                <TableCell align="center">Jumlah Masuk</TableCell>
                <TableCell align="center">Platform</TableCell>
                <TableCell align="center">Tipe</TableCell>
                <TableCell align="center">Status Settle</TableCell>
                <TableCell align="center">Status TRX</TableCell>
                <TableCell align="center">Waktu</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || result === null ? renderSkeleton() : result.rows.map(row => {
                let settle = row?.settlement || {};
                let badge = convertSettle(settle);
                return (
                  <TableRow key={row.reff_id} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) }, transition: 'background 0.15s' }}>
                    <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.reff_id}</Typography></TableCell>
                    <TableCell align="center">{row.user?.sender?.split('@')[0]}</TableCell>
                    <TableCell align="center">{idr(row.amount || 0)}</TableCell>
                    <TableCell align="center">{idr(settle.amount || 0)}</TableCell>
                    <TableCell align="center">{row.platform}</TableCell>
                    <TableCell align="center">{row.reff_id?.startsWith('AMD') ? row.type : row.reff_id.split('-')[0]}</TableCell>
                    <TableCell align="center">
                      {row.settlement ? (
                        <Chip label={badge.label} color={badge.color} size="small" sx={{ fontWeight: 500, fontSize: 11, borderRadius: 1.5, textTransform: 'capitalize' }} />
                      ) : <Typography color="text.disabled" variant="body2">—</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" sx={{ fontWeight: 500, fontSize: 11, borderRadius: 1.5, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: 12 }}>{dateParse(row.createdAt)} WIB</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail"><IconButton size="small" onClick={() => openDialog('Detail Transaksi', <DetailTransaction id={row.reff_id} closeDialog={closeDialog} />)}><RemoveRedEye sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && (
          <Stack direction="row" justifyContent="center">
            <Pagination count={Math.ceil((result?.count || 40) / 40)} page={form.page} onChange={(_, value) => { const updated = { ...form, page: value }; setForm(updated); fetchData(updated); }} shape="rounded" size="small" showFirstButton showLastButton />
          </Stack>
        )}
      </Stack>
    </motion.div>
  );
}
