import { Box, Card, TextField, Stack, IconButton, Typography, Skeleton, Button, CardContent, Tooltip, CircularProgress, InputAdornment, alpha } from '@mui/material';
import { AccountBalanceWallet, AddCard, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';

export function BalanceCard({ onDeposit }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      setRefreshing(true);
      const d = await reqOwner({ action: 'getBotSaldoInfo' });
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
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>PPOB BALANCE</Typography>
              <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, fontSize: { xs: 'clamp(20px, 5vw, 28px)', sm: 'clamp(22px, 3.5vw, 32px)' }, lineHeight: 1.1, color: '#fff' }} title={loading ? '' : idr(balance)}>
                {loading ? <Skeleton width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} /> : idr(balance)}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: '0 0 auto' }}>
            <Tooltip title="Refresh">
              <span><IconButton onClick={fetchBalance} disabled={refreshing} size="small" sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>{refreshing ? <CircularProgress size={18} /> : <Refresh />}</IconButton></span>
            </Tooltip>
            <Button variant="contained" color="warning" startIcon={<AddCard />} onClick={() => onDeposit({ onSettled: fetchBalance })} sx={{ borderRadius: 2, px: 2.5, minWidth: 110, fontWeight: 600, textTransform: 'none' }}>
              Deposit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DepositPpobDialog({ onClose, onSettled }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const parsedAmount = useMemo(() => parseInt(String(amount).split('').filter(ch => ch >= '0' && ch <= '9').join('') || '0') || 0, [amount]);
  const minOk = parsedAmount >= 50000;
  const multOk = parsedAmount % 1000 === 0 && parsedAmount !== 0;
  const hasError = !minOk || !multOk;
  const helper = !parsedAmount ? 'Deposit minimal 50000 saldo ini akan di pakai untuk kebutuhan yang berhubungan PPOB' : !minOk ? 'Jumlah deposit minimal Rp. 50.000' : !multOk ? 'Jumlah deposit harus kelipatan dari Rp. 1.000' : 'Deposit minimal 50000 saldo ini akan di pakai untuk kebutuhan yang berhubungan PPOB';

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const d = await reqOwner({ action: 'depositPpobBalance', amount: parsedAmount });
      const data = d?.data || d;
      if (data?.redirect) window.location.href = data.redirect;
    } catch {} finally { setLoading(false); onSettled?.(); onClose?.(); }
  };

  return (
    <Box sx={{ px: 1, pt: 0.5, pb: 2, width: { xs: '100%', sm: 420 } }}>
      <TextField autoFocus margin="dense" label="Nominal Deposit" type="text" fullWidth value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contoh: 100000" InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment>, inputMode: 'numeric' }} helperText={helper} error={Boolean(amount) && hasError} size="small" />
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2.5 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || hasError} sx={{ borderRadius: 2, textTransform: 'none' }} startIcon={loading ? <CircularProgress size={16} /> : null}>{loading ? 'Processing…' : 'Lanjutkan'}</Button>
      </Stack>
    </Box>
  );
}