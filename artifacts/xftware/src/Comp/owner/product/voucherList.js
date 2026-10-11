import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Button, Skeleton, Chip, alpha, Card, CardContent, Grid } from '@mui/material';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';
import EditVoucherForm from './editVoucherForm';
import { motion } from 'framer-motion';
import { ConfirmationNumber, Add, LocalOffer, CalendarToday, People, Download } from '@mui/icons-material';

/* ==========================
 * Animation Variants
   ========================== */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ==========================
 * Stat Cards
   ========================== */
function VoucherStat({ label, value, icon, color = '#6366f1' }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha(color, 0.08), color, display: 'grid', placeItems: 'center' }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{label}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ==========================
 * Voucher Card
   ========================== */
function VoucherCard({ voucher, onClick }) {
  const isPercent = voucher.type === 'percent';
  const isExpired = voucher.expired && new Date(voucher.expired) < new Date();

  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 3,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isExpired ? alpha('#ef4444', 0.2) : 'divider',
        transition: 'all 0.25s ease',
        opacity: isExpired ? 0.6 : 1,
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha('#6366f1', 0.3),
        },
      }}
    >
      {/* Gradient stripe */}
      <Box
        sx={{
          height: 4,
          background: isPercent
            ? 'linear-gradient(90deg, #6366f1, #818cf8)'
            : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        }}
      />

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Badge */}
        <Chip
          label={isPercent ? `${voucher.discount}%` : `- ${idr(voucher.discount)}`}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 1.5,
            bgcolor: isPercent ? alpha('#6366f1', 0.08) : alpha('#f59e0b', 0.08),
            color: isPercent ? '#4338ca' : '#b45309',
            border: `1px solid ${isPercent ? alpha('#6366f1', 0.15) : alpha('#f59e0b', 0.15)}`,
            mb: 1.5,
          }}
        />

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{voucher.title}</Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <LocalOffer sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Kode</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: 13 }}>{voucher.code}</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Expired</Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  {isExpired ? (
                    <Typography component="span" color="error" fontWeight={600}>{voucher.expired ? new Date(voucher.expired).toLocaleDateString() : '-'}</Typography>
                  ) : (
                    voucher.expired ? new Date(voucher.expired).toLocaleDateString() : 'Tidak ada'
                  )}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          {voucher.min_purchase > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography sx={{ fontSize: 13 }}>🔒</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>Min. {idr(voucher.min_purchase)}</Typography>
            </Stack>
          )}
          {voucher.claimed > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <People sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>Max {voucher.claimed}</Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Download sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>Diklaim {voucher.claimed}x</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ==========================
 * Main Page
   ========================== */
export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchVoucher = async () => {
    setLoading(true);
    const res = await reqOwner({ action: 'getVouchers' });
    if (!res.error) setVouchers(res.data?.rows || []);
    setLoading(false);
  };

  useEffect(() => { fetchVoucher(); }, []);

  const handleClose = () => { setEditId(null); fetchVoucher(); };

  // Stats
  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => !v.expired || new Date(v.expired) >= new Date()).length,
    expired: vouchers.filter(v => v.expired && new Date(v.expired) < new Date()).length,
    totalClaimed: vouchers.reduce((s, v) => s + (parseInt(v.claimed) || 0), 0),
  };

  if (editId !== null) {
    return (
      <motion.div key="edit-voucher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <EditVoucherForm id={editId} onDone={handleClose} />
      </motion.div>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <ConfirmationNumber sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>Daftar Voucher</Typography>
          <Typography variant="caption" color="text.secondary">Kelola diskon dan promo untuk pembeli</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add sx={{ fontSize: 18 }} />}
          onClick={() => setEditId('')}
          sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
        >
          Tambah Voucher
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <VoucherStat label="Total Voucher" value={stats.total} icon={<ConfirmationNumber sx={{ fontSize: 18 }} />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <VoucherStat label="Aktif" value={stats.active} icon={<LocalOffer sx={{ fontSize: 18 }} />} color="#10b981" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <VoucherStat label="Expired" value={stats.expired} icon={<CalendarToday sx={{ fontSize: 18 }} />} color="#ef4444" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <VoucherStat label="Total Diklaim" value={stats.totalClaimed} icon={<People sx={{ fontSize: 18 }} />} color="#f59e0b" />
        </Grid>
      </Grid>

      {/* Voucher List */}
      {loading ? (
        <Grid container spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={`sk-${i}`}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      ) : vouchers.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center' }}>
          <ConfirmationNumber sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.disabled" variant="body2">Belum ada voucher</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }} onClick={() => setEditId('')}>
            Buat Voucher Pertama
          </Button>
        </Card>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <Grid container spacing={1.5}>
            {vouchers.map(v => (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <motion.div variants={staggerItem}>
                  <VoucherCard voucher={v} onClick={() => setEditId(v.id)} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}
    </Box>
  );
}