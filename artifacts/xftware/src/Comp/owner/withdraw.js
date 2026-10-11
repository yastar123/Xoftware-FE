import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, MenuItem, Select, InputLabel, FormControl, Box, Typography,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Skeleton, Chip, Card, Pagination, alpha, IconButton, Tooltip, Divider, Alert, CircularProgress
} from '@mui/material';
import { AccountBalanceWallet, FileDownload, Clear } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { idr } from '@/lib/helper';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { useDialog } from '@/Context/Dialog';
import TurnstileBox from '@/Comp/TurnstileBox';
import * as XLSX from 'xlsx';
import { useSocket } from '@/Context/SocketContext';

const statusColor = { success: 'success', pending: 'warning', failed: 'error', process: 'info' };

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
};

const dateToInputValue = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dateToBackendFormat = (date) => {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const getDiffDays = (start, end) => {
  if (!start || !end) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const exportToExcel = (data) => {
  if (!data.length) {
    toast.warning('Tidak ada data untuk di-export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(
    data.map((row, idx) => ({
      'No': idx + 1,
      'Rekening': row.bank_set?.rek || '-',
      'Amount': row.amount,
      'Biaya Admin': row.fee,
      'Total Masuk': row.amount - row.fee,
      'Method': row.wd_type || 'manual',
      'Status': row.status,
      'Reason': row.reason || '-',
      'Tanggal': new Date(row.createdAt).toLocaleDateString('id-ID'),
    }))
  );

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Withdraw');
  XLSX.writeFile(workbook, `withdraw_${dateToInputValue(new Date())}.xlsx`);
  toast.success('Export berhasil!');
};

const WithdrawDialog = ({ onClose, onSuccess, saldo, bankList, info }) => {
  const [wd, setWd] = useState({ amount: '', pin: '', otp: '', bank_id: '', wd_type: 'manual' });
  const [tsToken, setTsToken] = useState('');
  const [errorAmount, setErrorAmount] = useState('');
  const [errorBank, setErrorBank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBank = bankList.find(b => b.id === wd.bank_id);
  const isRealtimeAvailable = selectedBank?.bank_list?.is_realtime;
  const isManualAvailable = selectedBank?.bank_list?.is_manual ?? true;
  const cutoffStart = selectedBank?.bank_list?.cutoff_start;
  const cutoffEnd = selectedBank?.bank_list?.cutoff_end;
  const hasCutoff = cutoffStart && cutoffEnd;

  const baseFee = info?.withdraw_fee || 0;
  const linkquFee = selectedBank?.bank_list?.fee_realtime || 0;
  const currentFee = wd.wd_type === 'realtime' ? Number(linkquFee) : baseFee;

  const reset = () => {
    setWd({ amount: '', pin: '', otp: '', bank_id: '', wd_type: 'manual' });
    setErrorAmount('');
    setErrorBank('');
    setTsToken('');
    onClose?.();
  };

  useEffect(() => {
    if (selectedBank) {
      if (!selectedBank.bank_list?.is_manual && wd.wd_type === 'manual') {
        setWd(prev => ({ ...prev, wd_type: 'realtime' }));
      }
    }
  }, [wd.bank_id, selectedBank, wd.wd_type]);

  const handleChange = key => e => {
    setWd({ ...wd, [key]: e.target.value });
    if (key === 'amount') setErrorAmount('');
    if (key === 'bank_id') setErrorBank('');
  };

  const handleTsToken = React.useCallback(t => { setTsToken(t || ''); }, []);

  const handleWithdraw = async () => {
    const amount = Number(wd.amount);
    if (!amount || amount < 10000 || amount % 1000 !== 0) {
      setErrorAmount('Masukkan jumlah yang valid (min 10.000 dan kelipatan 1.000)');
      return;
    }
    if (amount > saldo) {
      setErrorAmount('Saldo tidak mencukupi untuk penarikan ini');
      return;
    }
    if (!wd.bank_id) {
      setErrorBank('Silakan pilih bank tujuan terlebih dahulu');
      return;
    }
    if (!tsToken) return toast.error('Mohon tunggu captcha selesai');

    setIsSubmitting(true);
    try {
      const res = await reqOwner({
        action: 'setwithdraw',
        amount,
        pin: wd.pin,
        bank_id: wd.bank_id,
        wd_type: wd.wd_type,
        token: tsToken
      });
      toast[res.error ? 'error' : 'success'](res.message);
      if (!res.error) { onSuccess?.(); reset(); }
    } catch {
      toast.error('Gagal melakukan penarikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Jumlah (Rp)"
        fullWidth
        size="small"
        value={wd.amount}
        onChange={handleChange('amount')}
        type="number"
        inputProps={{ min: 10000, step: 1000 }}
        error={!!errorAmount}
        helperText={errorAmount}
      />
      <FormControl fullWidth size="small" error={!!errorBank}>
        <InputLabel>Pilih Bank Tujuan</InputLabel>
        <Select value={wd.bank_id} label="Pilih Bank Tujuan" onChange={handleChange('bank_id')}>
          {bankList.map(bank => (
            <MenuItem key={bank.id} value={bank.id}>
              {bank.bank_list?.name || '-'} - {bank.name} ({bank.rek})
            </MenuItem>
          ))}
        </Select>
        {errorBank && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{errorBank}</Typography>
        )}
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Metode Penarikan</InputLabel>
        <Select
          value={wd.wd_type}
          label="Metode Penarikan"
          onChange={handleChange('wd_type')}
          disabled={!wd.bank_id}
        >
          <MenuItem value="manual" disabled={!isManualAvailable}>
            Manual (Normal) {!isManualAvailable && wd.bank_id && " - Tidak didukung bank ini"}
          </MenuItem>
          <MenuItem value="realtime" disabled={!isRealtimeAvailable}>
            Real-time (Instan) {!isRealtimeAvailable && wd.bank_id && " - Tidak didukung bank ini"}
          </MenuItem>
        </Select>
        {wd.wd_type === 'realtime' && (
          <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            ⚡ Penarikan real-time akan diproses secara instan.
          </Typography>
        )}
      </FormControl>

      {hasCutoff && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Bank tujuan memiliki jadwal <b>offline (cut-off)</b> pada pukul <b>{cutoffStart} - {cutoffEnd} WIB</b>. Penarikan yang dilakukan pada jam tersebut tidak dapat diproses.
        </Alert>
      )}

      <Box sx={{ p: 1.5, bgcolor: alpha('#1976d2', 0.05), borderRadius: 2 }}>
        <Stack spacing={1}>

          {wd.wd_type === 'realtime' ? (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Biaya Real-time</Typography>
              <Typography variant="body2" fontWeight={600} color="primary">+{idr(linkquFee)}</Typography>
            </Stack>
          ) : (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Biaya Admin</Typography>
              <Typography variant="body2" fontWeight={600}>{idr(baseFee)}</Typography>
            </Stack>
          )}
          <Divider sx={{ my: 0.5 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" fontWeight={700}>Total Masuk</Typography>
            <Typography variant="body2" fontWeight={700} color={wd.amount && (Number(wd.amount) - currentFee <= 0) ? 'error' : 'success.main'}>
              {idr(Math.max(0, Number(wd.amount) - currentFee))}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      <TextField
        label="Masukkan Pin"
        fullWidth
        size="small"
        value={wd.pin}
        onChange={handleChange('pin')}
        type="number"
      />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Saldo tersedia: <b>{idr(saldo)}</b>
      </Typography>
      <TurnstileBox onToken={handleTsToken} />
      <Button
        variant="contained"
        onClick={handleWithdraw}
        fullWidth
        disabled={isSubmitting}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSubmitting ? 'Memproses...' : 'Lanjutkan'}
      </Button>
    </Stack>
  );
};

export default function WithdrawSection() {
  const [withdraws, setWithdraws] = useState([]);
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { openDialog, closeDialog } = useDialog();
  const [banks, setBanks] = useState([]);
  const [bankList, setBankList] = useState([]);
  const { socket } = useSocket();

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const fetchAll = useCallback(async (pg = 1, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const startFmt = dateToBackendFormat(startDate);
      const endFmt = dateToBackendFormat(endDate);

      const [summary, withdraw, bankListRes] = await Promise.all([
        reqOwner({ action: 'dash.summary' }),
        reqOwner({
          action: 'withdraw',
          page: pg,
          limit: rowsPerPage,
          start_date: startFmt,
          end_date: endFmt
        }),
        reqOwner({ action: 'banks', status: 'verified' })
      ]);

      setInfo(summary?.data || {});
      setBankList(bankListRes.data || []);
      setWithdraws(withdraw?.data?.withlist || []);
      setTotalCount(withdraw?.data?.count || 0);
      setBanks(withdraw?.data?.banks || []);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, rowsPerPage]);

  // Track if user is busy with search/filters to pause auto-reload
  useEffect(() => {
    if (!socket) return;
    const isBusy = !!(page !== 1); // Simple busy check for withdraw (pagination only)
    socket.emit('ui_state', { isBusy });
  }, [socket, page]);

  // Listen for realtime reload from server
  useEffect(() => {
    if (!socket) return;
    const onReload = (data) => {
      if (data?.action?.includes('withdraw')) {
        fetchAll(page, true); // silent refresh
      }
    };
    socket.on('o2_reload', onReload);
    return () => socket.off('o2_reload', onReload);
  }, [socket, page, fetchAll]);

  useEffect(() => { fetchAll(page); }, [page, fetchAll]);

  const handleDateChange = (type) => (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);

    if (type === 'start') setStartDate(newDate);
    else setEndDate(newDate);
    setPage(1);
  };

  const handleClearFilter = () => {
    const defaults = getDefaultDates();
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setPage(1);
  };

  const handleExport = async () => {
    const diffDays = getDiffDays(startDate, endDate);
    if (diffDays > 31) {
      toast.error('Range tanggal maksimal 1 bulan untuk export');
      return;
    }

    try {
      setExporting(true);
      const res = await reqOwner({
        action: 'withdraw_export',
        start_date: dateToBackendFormat(startDate),
        end_date: dateToBackendFormat(endDate)
      });
      exportToExcel(res?.data?.withlist || []);
    } catch {
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card sx={{
          p: 2, mb: 2, borderRadius: 3,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid', borderColor: 'divider'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{
              p: 0.8, borderRadius: 1.5,
              bgcolor: alpha('#1976d2', 0.1), color: '#1976d2',
              display: 'grid', placeItems: 'center'
            }}>
              <AccountBalanceWallet sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                Saldo Tersedia
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {idr(info?.saldo || 0)}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AccountBalanceWallet />}
            size="medium"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
            onClick={() => openDialog('Tarik Saldo',
              <WithdrawDialog
                banks={banks}
                bankList={bankList}
                closeDialog={closeDialog}
                saldo={info.saldo}
                info={info}
                onSuccess={() => fetchAll(page)}
              />
            )}
          >
            Tarik Saldo
          </Button>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              label="Dari Tanggal"
              type="date"
              size="small"
              value={dateToInputValue(startDate)}
              onChange={handleDateChange('start')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="Sampai Tanggal"
              type="date"
              size="small"
              value={dateToInputValue(endDate)}
              onChange={handleDateChange('end')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ minWidth: 160 }}
            />
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Tooltip title="Reset Filter">
                <IconButton size="small" onClick={handleClearFilter}>
                  <Clear fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                size="small"
                onClick={handleExport}
                disabled={exporting}
                sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 2, whiteSpace: 'nowrap' }}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </Stack>
          </Stack>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{
              minWidth: 900,
              '& thead th': {
                bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary',
                borderBottom: '2px solid', borderColor: 'divider'
              },
              '& tbody td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) },
              '& tbody tr:hover': { bgcolor: alpha('#6366f1', 0.02), transition: 'background 0.15s' }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">No</TableCell>
                  <TableCell align="center">ID</TableCell>
                  <TableCell align="center">Rekening</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="center">Biaya Admin</TableCell>
                  <TableCell align="center">Total Masuk</TableCell>
                  <TableCell align="center">Method</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Reason</TableCell>
                  <TableCell align="center">Tanggal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: rowsPerPage }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array(10).fill(0).map((__, j) => (
                        <TableCell align="center" key={j}>
                          <Skeleton variant="text" width="75%" height={20} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  withdraws.map((row, idx) => (
                    <TableRow key={row.id || idx}>
                      <TableCell align="center">{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">{row.id}</TableCell>
                      <TableCell align="center">{row.bank_set?.rek}</TableCell>
                      <TableCell align="center">{idr(row.amount)}</TableCell>
                      <TableCell align="center">{idr(row.fee)}</TableCell>
                      <TableCell align="center">{idr(row.amount - row.fee)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.wd_type || 'manual'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500, textTransform: 'capitalize', borderRadius: 1.5 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.status === 'process' ? 'Processing' : row.status}
                          color={statusColor[row.status] || 'default'}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize', borderRadius: 1.5 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {row.reason || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {new Date(row.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && (
            <Stack direction="row" justifyContent="center" p={2}>
              <Pagination
                count={Math.ceil(totalCount / rowsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                boundaryCount={1}
                siblingCount={2}
                showFirstButton
                showLastButton
                shape="rounded"
                size="small"
                color="primary"
              />
            </Stack>
          )}
        </Card>
      </motion.div>
    </Box>
  );
}