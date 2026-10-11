import React, { useEffect, useRef, useState, startTransition } from 'react';
import { Box, Table, TableRow, TableBody, TableCell, TableContainer, TableHead, Card, Typography, Stack, TextField, Pagination, Skeleton, Chip, alpha, InputAdornment, MenuItem, Button, FormControl, Select, Popover, IconButton } from '@mui/material';
import { Search, Add, Delete, Close } from '@mui/icons-material';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { DatePicker } from '@mui/x-date-pickers';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import { dateParse, idr } from '@/lib/helper';
import { useDebounce } from '@/Hook/debouncingState';
import DynamicFilterBuilder from '../DynamicFilterBuilder';

const typeColor = { in: 'success', out: 'error' };

const FILTER_FIELDS = [
  { value: 'createdAt', label: 'Tanggal', type: 'dateRange' },
  { value: 'user.sender', label: 'Buyer', type: 'text' },
  { value: 'type', label: 'Tipe Transaksi', type: 'select', options: ['kredit', 'debit'] },
  { value: 'platform', label: 'Platform', type: 'text' },
];

export default function MutationSection() {
  const [form, setForm] = useState({ endDate: '', startDate: '', search: '', platform: '', page: 1 });
  const [filters, setFilters] = useState([
    { id: 1, field: 'createdAt', op: 'between', value: [dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'), dayjs().endOf('day').format('YYYY-MM-DDTHH:mm')] }
  ]);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const abort = useRef(new AbortController());
  const debounceQuery = useDebounce(form.search, 200);

  const fetchData = payload => {
    setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    reqOwner({ action: 'getMutation', filters, ...payload }, { signal: abort.current.signal })
      .then(d => { if (!d.error) setResult(d.data); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTransition(() => { fetchData(form); }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData({ ...form, search: debounceQuery }); }, [debounceQuery]);

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== undefined && v !== null));
      const res = await reqOwner({ action: 'exportMutation', filters, ...body });

      const dataRows = res?.data?.rows || res?.rows || [];
      if (!dataRows.length) {
        toast.info('Tidak ada data untuk diexport');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Mutasi Saldo");
      sheet.columns = [
        { header: "Waktu/Tanggal", key: "created_at", width: 25 },
        { header: "Buyer", key: "buyer", width: 20 },
        { header: "Platform", key: "platform", width: 15 },
        { header: "Tipe", key: "type", width: 15 },
        { header: "Kredit", key: "kredit", width: 15 },
        { header: "Debit", key: "debit", width: 15 },
        { header: "Note", key: "note", width: 40 },
      ];

      dataRows.forEach(item => {
        sheet.addRow({
          created_at: item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') + " WIB" : "-",
          buyer: item.User?.sender?.split('@')?.[0] || '-',
          platform: item.platform,
          type: item.kredit > 0 ? "Kredit" : "Debit",
          kredit: item.kredit || 0,
          debit: item.debit || item.debet || 0,
          note: item.note || '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `MutasiSaldo-${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
      toast.success(`Export selesai....`);
    } catch (e) {
      toast.error(e?.message || "Export gagal.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
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
          <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center" flexWrap="wrap" gap={2}>
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
            <Button variant="contained" color="success" onClick={exportToExcel} disabled={exporting || loading} size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>{exporting ? 'Mengekspor' : 'Export Excel'}</Button>
          </Stack>
        )}
      </Stack>


      {!loading && result && <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1 }}>Result ditampilkan: {result.count}</Typography>}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900, '& thead th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }, '& tbody td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) }, '& tbody tr:hover': { bgcolor: alpha('#6366f1', 0.02), transition: 'background 0.15s' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">Buyer</TableCell>
                <TableCell align="center">Price</TableCell>
                <TableCell align="center">Saldo</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="center">Tanggal/Jam</TableCell>
                <TableCell align="center">Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || result === null
                ? [...Array(10)].map((_, i) => <TableRow key={`skeleton-${i}`}>{Array(6).fill(0).map((_, idx) => <TableCell align="center" key={idx}><Skeleton variant="text" width="75%" height={20} /></TableCell>)}</TableRow>)
                : result.rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell align="center">{row.user?.sender.split('@')[0]} ({row.user?.name || 'Unknown'})</TableCell>
                    <TableCell align="center">{idr(row.amount)}</TableCell>
                    <TableCell align="center">{idr(row.saldo)}</TableCell>
                    <TableCell align="center"><Chip label={row.type === 'in' ? 'Masuk' : 'Keluar'} color={typeColor[row.type] || 'default'} size="small" sx={{ textTransform: 'capitalize', fontWeight: 600, height: 24 }} /></TableCell>
                    <TableCell align="center">{dateParse(row.createdAt)} WIB</TableCell>
                    <TableCell align="center">{row.note}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>

      {!loading && result && (
        <Stack direction="row" justifyContent="center" mt={2.5}>
          <Pagination count={Math.ceil(result.count / 40)} page={form.page} onChange={(_, value) => { const updated = { ...form, page: value }; setForm(updated); fetchData(updated); }} color="primary" shape="rounded" size="small" />
        </Stack>
      )}
    </Box>
  );
}