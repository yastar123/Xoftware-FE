import { Box, Typography, Divider, Grid, Chip, Stack, Skeleton, alpha, Card, CardContent } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { idr, dateParse } from '@/lib/helper';
import { Receipt } from '@mui/icons-material';

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

export default function DetailTransactionPpob({ id }) {
  const [data, setData] = useState(null);
  const abort = useRef(new AbortController());

  useEffect(() => {
    abort.current.abort();
    abort.current = new AbortController();
    setData(null);
    reqOwner({ action: 'getTransactionPpob', id }, { signal: abort.current?.signal }).then(res => {
      if (!res.error) setData(res.data);
    });
  }, [id]);

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={1.5}>{[...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={24} sx={{ borderRadius: 1 }} />)}</Stack>
      </Box>
    );
  }

  const { reff_id, channel, status, createdAt, updatedAt, product_code, product_name, final_user_price, operator_vendor_id, vendor_price_raw, tv_category, tv_operator, payment } = data;
  const buyer = payment?.user || null;
  const settle = payment?.settlement || null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
              <Receipt sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Detail Transaksi PPOB</Typography>
            <Chip label={status} size="small" color={status === 'success' ? 'success' : status === 'pending' ? 'warning' : status === 'fail' || status === 'failed' ? 'error' : 'default'} sx={{ fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: 'capitalize' }} />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1.5}>
            <Info label="Reff ID" value={reff_id} />
            <Info label="Channel" value={channel || '-'} />
            <Info label="Waktu Buat" value={dateParse(createdAt) + ' WIB'} />
            <Info label="Waktu Update" value={dateParse(updatedAt) + ' WIB'} />
            {buyer && (<><Info label="Buyer ID" value={buyer.id} /><Info label="Buyer Name" value={buyer.name || '-'} /><Info label="Sender" value={buyer.sender?.split('@')[0] || '-'} /></>)}
            <Info label="Produk" value={product_name || '-'} />
            <Info label="Product Code" value={product_code || '-'} />
            <Info label="Harga" value={idr(vendor_price_raw || 0)} />
            <Info label="Harga Akhir" value={idr(final_user_price || 0)} />
            <Info label="Operator Vendor ID" value={operator_vendor_id || '-'} />
            <Info label="Operator" value={tv_operator?.name || '-'} />
            <Info label="Category" value={tv_category?.name || '-'} />
            {payment && (<><Info label="Payment ID" value={payment.id} /><Info label="Payment Reff" value={payment.reff_id} /><Info label="Status Pembayaran" value={payment.status} /><Info label="Jumlah Dibayar" value={idr(payment.amount || 0)} /><Info label="Waktu Bayar" value={dateParse(payment.createdAt) + ' WIB'} /></>)}
            {settle && (<><Info label="Jumlah Masuk (Settlement)" value={idr(settle.amount || 0)} /><Info label="Waktu Settlement" value={dateParse(settle.createdAt) + ' WIB'} /></>)}
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}