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

export default function DetailTransactionSmm({ id }) {
  const [data, setData] = useState(null);
  const abort = useRef(new AbortController());

  useEffect(() => {
    abort.current.abort();
    abort.current = new AbortController();
    setData(null);
    reqOwner({ action: 'md.getTransaction', id }, { signal: abort.current?.signal }).then(res => {
      if (!res?.error) setData(res.data || res);
    });
    return () => abort.current.abort();
  }, [id]);

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={1.5}>{[...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={24} sx={{ borderRadius: 1 }} />)}</Stack>
      </Box>
    );
  }

  const user = data.user || null;
  const payment = data.payment || null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
              <Receipt sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Detail Transaksi SMM</Typography>
            <Chip label={data.status || '-'} size="small" color={data.status === 'success' ? 'success' : data.status === 'pending' ? 'warning' : data.status === 'fail' || data.status === 'failed' ? 'error' : 'default'} sx={{ fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: 'capitalize' }} />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1.5}>
            <Info label="Reff ID" value={data.reff_id || '-'} />
            <Info label="Channel" value={data.channel || '-'} />
            <Info label="Waktu Buat" value={dateParse(data.createdAt) + ' WIB'} />
            <Info label="Waktu Update" value={data.updatedAt ? dateParse(data.updatedAt) + ' WIB' : '-'} />
            {user && (<><Info label="User ID" value={user.id} /><Info label="User Name" value={user.name || '-'} /><Info label="Sender" value={user.sender?.split('@')?.[0] || '-'} /></>)}
            <Info label="Note" value={data.note || '-'} />
            <Info label="Harga Base" value={idr(data.price || 0)} />
            <Info label="Profit" value={idr(data.fee_owner || 0)} />
            <Info label="Harga Total" value={idr(data.price + data.fee_owner || 0)} />
            {payment && (<><Info label="Payment ID" value={payment.id} /><Info label="Payment Reff" value={payment.reff_id} /><Info label="Payment Status" value={payment.status} /><Info label="Jumlah Dibayar" value={idr(payment.amount || 0)} /><Info label="Payment Type" value={payment.type || '-'} /><Info label="Waktu Bayar" value={payment.createdAt ? dateParse(payment.createdAt) + ' WIB' : '-'} /></>)}
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}