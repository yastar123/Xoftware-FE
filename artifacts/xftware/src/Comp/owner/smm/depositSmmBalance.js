import { Box, Card, TextField, Stack, IconButton, Typography, Skeleton, Button, CardContent, Tooltip, CircularProgress, InputAdornment, Alert, alpha } from '@mui/material';
import { AccountBalanceWallet, AddCard, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';
import { toast } from 'react-toastify';

export function BalanceCard({ onDeposit }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      setRefreshing(true);
      const d = await reqOwner({ action: 'getSMMSaldoInfo' });
      const data = d?.data || d;
      if (data && typeof data.balance !== 'undefined') setBalance(Number(data.balance) || 0);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchBalance(); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#FFF'}}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', py: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '16px', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', background: 'linear-gradient(135deg, #9d3c00, #afa400)', color: '#fff', flex: '0 0 auto' }}>
              <AccountBalanceWallet sx={{ fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>SMM BALANCE</Typography>
              <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, fontSize: { xs: 'clamp(20px, 5vw, 28px)', sm: 'clamp(22px, 3.5vw, 32px)' }, lineHeight: 1.1, color: '#fff' }} title={loading ? '' : idr(balance)}>
                {loading ? <Skeleton width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} /> : idr(balance)}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: '0 0 auto' }}>
            <Tooltip title="Refresh">
              <span><IconButton onClick={fetchBalance} disabled={refreshing} size="small" sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>{refreshing ? <CircularProgress size={18} /> : <Refresh />}</IconButton></span>
            </Tooltip>
            <Button variant="contained" startIcon={<AddCard />} color="warning" onClick={() => onDeposit({ onSettled: fetchBalance })} sx={{ borderRadius: 2, px: 2.5, minWidth: 110, fontWeight: 600, textTransform: 'none' }}>
              Deposit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DepositSmmDialog({ onClose, onSettled }) {
  const [amount, setAmount] = useState(50000);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'depositSMMBalance', amount });
      if (res?.error) { toast.error(res.message || 'Gagal membuat deposit'); setLoading(false); return; }
      toast.success(res.message || 'Pembelian telah di proses!');
      onClose?.();
      onSettled?.();
      const redirect = res?.data?.redirect;
      if (redirect) window.location.href = redirect;
    } catch (e) { toast.error(e?.message || 'Gagal membuat deposit'); }
    setLoading(false);
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>Minimal deposit <b>Rp. 50.000</b> dan harus kelipatan <b>Rp. 1.000</b></Alert>
        <TextField label="Jumlah Deposit" type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value || '0'))} fullWidth size="small" />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
        <Button variant="contained" onClick={submit} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>{loading ? 'Memproses...' : 'Lanjut Bayar'}</Button>
      </Stack>
    </Box>
  );
}