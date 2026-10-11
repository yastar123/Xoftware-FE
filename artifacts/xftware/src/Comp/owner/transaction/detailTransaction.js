import { Box, Typography, Divider, Grid, Chip, Stack, Skeleton, alpha, Card, CardContent, Button } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';
import { Receipt, Replay } from '@mui/icons-material';
import { toast } from 'react-toastify';

function Info({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 13, flexShrink: 0 }}>{label}:</Typography>
        <Typography sx={{ color: 'text.primary', fontSize: 13 }} component="span">{value}</Typography>
      </Stack>
    </Grid>
  );
}

export default function DetailTransaction({ id }) {
  const [data, setData] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const abort = useRef(new AbortController());

  useEffect(() => {
    abort.current.abort();
    abort.current = new AbortController();
    setData(null);
    reqOwner({ action: 'getTransaction', reffId: id }, { signal: abort.current?.signal }).then(res => {
      if (!res.error) setData(res.data);
    });
  }, [id]);

  const handleRetryWebhook = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      const res = await reqOwner({ action: 'retryWebhook', reffId: id });
      if (!res.error) {
        toast.success(res.message || 'Webhook retry scheduled');
      } else {
        toast.error(res.message || 'Gagal melakukan retry webhook');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setRetrying(false);
    }
  };

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={1.5}>{[...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={24} sx={{ borderRadius: 1 }} />)}</Stack>
      </Box>
    );
  }

  const { reff_id, platform, user, status, type, createdAt, updatedAt, detail_product, settlement, history_trx, amount } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                <Receipt sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>Detail Transaksi</Typography>
              <Chip label={status} size="small" color={status === 'success' ? 'success' : status === 'pending' ? 'warning' : status === 'failed' ? 'error' : 'default'} sx={{ fontWeight: 600, fontSize: 11, borderRadius: 1.5 }} />
            </Stack>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Replay sx={{ fontSize: 16 }} />}
              onClick={handleRetryWebhook}
              disabled={retrying}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
            >
              {retrying ? 'Retry...' : 'Retry Webhook'}
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1.5}>
            <Info label="Reff ID" value={reff_id} />
            <Info label="Platform" value={platform} />
            {user && (<><Info label="Buyer ID" value={user.id} /><Info label="Buyer Name" value={user.name} /><Info label="Sender" value={user.sender?.split('@')[0]} /></>)}
            <Info label="Tipe" value={type} />
            <Info label="Tanggal Transaksi" value={dateParse(createdAt) + ' WIB'} />
            {detail_product && (
              <>
                <Info label="Kode Produk" value={detail_product.code} />
                <Info label="Jumlah Produk" value={detail_product.amount || 0} />
                <Info label="Total Harga" value={idr((detail_product.total_price || 0) * (detail_product.amount || 0))} />
                <Info label="Total Profit" value={idr((detail_product.total_profit || 0) * (detail_product.amount || 0))} />
                {detail_product.is_guest && (
                  <>
                    <Info label="Tipe Akun" value={<Chip label="Guest" size="small" color="secondary" sx={{ height: 20, fontSize: 10 }} />} />
                    <Info label="Nama Guest" value={detail_product.customer_name || '-'} />
                    <Info label="Telepon Guest" value={detail_product.customer_phone || '-'} />
                    <Info label="Email Guest" value={detail_product.customer_email || '-'} />
                  </>
                )}
              </>
            )}
            {settlement && (<><Info label="Biaya Platform" value={`${idr(amount - settlement.amount - settlement.fee)} + ${idr(settlement.fee)}`} /><Info label="Jumlah Masuk" value={idr(settlement.amount)} /><Info label="Status Saldo" value={settlement.is_error ? 'Error' : settlement.is_process ? 'Settle' : !settlement.is_process && settlement.is_lock ? 'Locked' : 'Unsettle'} /></>)}
            {history_trx && (<><Info label="Brand Bank" value={history_trx.brand} /><Info label="Atas Nama" value={history_trx.name} /><Info label="Kode RRN" value={history_trx.rrn} /><Info label="Waktu Sukses" value={dateParse(updatedAt)} /></>)}
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}