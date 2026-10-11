import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography, TextField, Alert, alpha, InputAdornment, Grid, Button, CircularProgress, Chip } from '@mui/material';
import { useDialog } from '@/Context/Dialog';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { idr } from '@/lib/helper';
import { BalanceCard, DepositSmmDialog } from './depositSmmBalance';
import { AccountBalanceWallet, History, Search, RestartAlt } from '@mui/icons-material';

function useSmmGate() {
  const [state, setState] = useState({ checking: true, allowed: false, message: '', notify: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reqOwner({ action: 'isSupportSmm' });
        if (!alive) return;
        if (res?.error) setState({ checking: false, allowed: false, message: res.message || 'Access denied!', notify: null });
        else setState({ checking: false, allowed: true, message: '', notify: null });
      } catch (e) {
        if (!alive) return;
        setState({ checking: false, allowed: false, message: e?.message || 'Access denied!', notify: null });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

export default function SMMInformation({ notify }) {
  const { checking, allowed, message } = useSmmGate();
  const { openDialog, closeDialog } = useDialog();
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async (nextPage = 1, mode = 'append') => {
    setLoadingHistory(true);
    try {
      const res = await reqOwner({ action: 'md.getHistoryDeposit', page: nextPage, search, startDate: startDate || undefined, endDate: endDate || undefined });
      if (res?.error) { toast.error(res.message || 'Gagal memuat riwayat deposit SMM'); setLoadingHistory(false); return; }
      const rows = res?.data?.data || [];
      const totalPages = res?.data?.totalPages || 1;
      setHistory(mode === 'replace' ? rows : [...history, ...rows]);
      setHasMore(nextPage < totalPages);
      setPage(nextPage);
    } catch (e) { toast.error(e?.message || 'Gagal memuat riwayat deposit SMM'); }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (allowed) fetchHistory(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const applyFilter = () => fetchHistory(1, 'replace');
  const resetFilter = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchHistory(1, 'replace'), 0);
  };

  const statusColor = status => {
    const s = String(status || '').toLowerCase();
    if (s === 'success' || s === 'paid' || s === 'settlement') return 'success';
    if (s === 'pending' || s === 'process') return 'warning';
    return 'error';
  };

  if (checking) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Checking access…</Typography>
      </Stack>
    );
  }

  if (!allowed) {
    return (
      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
        {message || 'Access denied!'}
      </Alert>
    );
  }

  return (
    <Box>
      {notify && (
        <Alert
          severity="info"
          component="pre"
          sx={{ mt: 2, mb: 2.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', borderRadius: 2, '& .MuiAlert-message': { width: '100%' }}}
        >
          {notify}
        </Alert>
      )}

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <AccountBalanceWallet sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>SMM Information</Typography>
          <Typography variant="caption" color="text.secondary">Cek saldo dan riwayat deposit SMM</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <BalanceCard onDeposit={({ onSettled }) => openDialog('Deposit SMM', <DepositSmmDialog onClose={closeDialog} onSettled={onSettled} />)} />
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <History sx={{ fontSize: 20, color: '#6366f1' }} />
            <Typography variant="subtitle1" fontWeight={700}>Riwayat Deposit</Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Search Reff ID"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220, borderRadius: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 2 }}
            />
            <TextField
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ borderRadius: 2 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={applyFilter} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>Filter</Button>
              <Button variant="outlined" onClick={resetFilter} startIcon={<RestartAlt sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>Reset</Button>
            </Stack>
          </Stack>

          {loadingHistory && history.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
              <CircularProgress />
            </Stack>
          ) : history.length === 0 ? (
            <Typography color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>Belum ada riwayat Deposit</Typography>
          ) : (
            history.map((item, idx) => {
              const pay = item?.payment || item?.Payment || {};
              const reff = pay?.reff_id || '-';
              const status = pay?.status || '-';
              const amount = Number(item?.amount ?? pay?.amount ?? 0);
              const before = Number(item?.saldo_before ?? item?.before_saldo ?? 0);
              const after = Number(item?.saldo_after ?? item?.after_saldo ?? 0);
              const createdAt = item?.createdAt || pay?.createdAt;

              return (
                <Box key={item?.id ?? idx} sx={{ py: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ sm: 'center' }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="h6" fontWeight={800}>{idr(amount)}</Typography>
                        <Chip size="small" label={`Reff: ${reff}`} variant="outlined" sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />
                        <Chip size="small" color={statusColor(status)} label={String(status).toUpperCase()} sx={{ fontSize: 10, height: 20, borderRadius: 1.5, fontWeight: 600 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Sesudah: {idr(after)} | Sebelum: {idr(before)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {createdAt ? new Date(createdAt).toLocaleString() : '-'}
                    </Typography>
                  </Stack>
                  {idx < history.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              );
            })
          )}

          {hasMore && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchHistory(page + 1, 'append')}
                disabled={loadingHistory}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {loadingHistory ? 'Loading...' : 'Load More'}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}