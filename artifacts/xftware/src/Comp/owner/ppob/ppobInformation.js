import { Box, Card, CardContent, Divider, Stack, Typography, Button, alpha, Chip } from '@mui/material';
import { BalanceCard, DepositPpobDialog } from './depositPpobBalance';
import { useDialog } from '@/Context/Dialog';
import { useEffect, useState } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { idr } from '@/lib/helper';
import { AccountBalanceWallet, History } from '@mui/icons-material';

export default function PPOBInformation() {
  const { openDialog, closeDialog } = useDialog();
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDepositBalanceHistory(1); }, []);

  const fetchDepositBalanceHistory = async (nextPage = 1) => {
    try {
      const res = await reqOwner({ action: 'getHistoryDepositPpobBalance', page: nextPage });
      if (res.error) return toast.error(res.message);
      const newHistory = nextPage === 1 ? res.data.data : [...history, ...res.data.data];
      setHistory(newHistory);
      setHasMore(nextPage < res.data.totalPages);
      setPage(nextPage);
    } catch {
      toast.error('Gagal memuat riwayat layanan');
    }
  };

  const statusColor = status => {
    const s = String(status || '').toLowerCase();
    if (s === 'success' || s === 'paid' || s === 'settlement') return 'success';
    if (s === 'pending' || s === 'process') return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <AccountBalanceWallet sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>PPOB Information</Typography>
          <Typography variant="caption" color="text.secondary">Cek saldo dan riwayat topup saldo PPOB</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <BalanceCard onDeposit={({ onSettled }) => openDialog('Deposit PPOB', <DepositPpobDialog onClose={closeDialog} onSettled={onSettled} />)} />
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <History sx={{ fontSize: 20, color: '#6366f1' }} />
            <Typography variant="subtitle1" fontWeight={700}>Riwayat Topup Saldo</Typography>
          </Stack>

          {history.length === 0 && (
            <Typography color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>Belum ada riwayat Topup Saldo PPOB</Typography>
          )}

          {history.map((item, idx) => (
            <Box key={idx} sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>{idr(item.amount)}</Typography>
                <Chip size="small" label={String(item.status).toUpperCase()} color={statusColor(item.status)} sx={{ fontSize: 10, height: 20, borderRadius: 1.5, fontWeight: 600 }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Sesudah: {idr(item.after_saldo)} | Sebelum: {idr(item.before_saldo)}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString()}</Typography>
              </Stack>
              {idx < history.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Box>
          ))}

          {hasMore && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => fetchDepositBalanceHistory(page + 1)} sx={{ borderRadius: 2, textTransform: 'none' }}>Load More</Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}