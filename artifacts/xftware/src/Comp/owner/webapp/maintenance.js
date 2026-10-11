import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Stack, Switch, TextField, Alert } from '@mui/material';
import { PowerSettingsNewRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

export default function MaintenanceSetting() {
  const [data, setData] = useState({
    is_store_open: true,
    store_closed_message: 'Mohon maaf, layanan sedang ditutup sementara.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    reqOwner({ action: 'getStoreMaintenance' }).then(res => {
      if (res?.data) {
        setData(res.data);
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      if (!loading) {
        isInitialMount.current = false;
      }
      return;
    }

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await reqOwner({ 
          action: 'setStoreMaintenance', 
          ...data 
        });
      } catch (err) {
        console.error('Gagal menyimpan status toko:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, loading]);

  const handleChangeStatus = (e) => {
    setData({ ...data, is_store_open: e.target.checked });
  };

  const handleChangeMessage = (e) => {
    setData({ ...data, store_closed_message: e.target.value });
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Memuat data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <PowerSettingsNewRounded sx={{ color: data.is_store_open ? '#10b981' : '#f43f5e', fontSize: 24 }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Status Layanan Web
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Matikan fitur ini untuk menutup layanan pesanan di Web. Transaksi baru dan deposit akan ditolak oleh sistem.
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ 
            bgcolor: 'background.default', 
            p: 2, 
            borderRadius: 3, 
            border: t => `1px solid ${t.palette.divider}`,
            mb: data.is_store_open ? 0 : 3
          }}>
          <Box>
            <Typography variant="body1" fontWeight={600} color={data.is_store_open ? 'success.main' : 'error.main'}>
              {data.is_store_open ? 'Layanan Aktif' : 'Layanan Ditutup'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.is_store_open ? 'Pengguna dapat melakukan pesanan seperti biasa.' : 'Sistem menolak semua transaksi baru saat ini.'}
            </Typography>
          </Box>
          <Switch 
            checked={data.is_store_open} 
            onChange={handleChangeStatus} 
            color="success"
            sx={{ transform: 'scale(1.2)' }}
          />
        </Stack>

        {!data.is_store_open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Pesan ini akan ditampilkan kepada pengguna ketika mereka mencoba melakukan pesanan.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Pesan Pengumuman"
              value={data.store_closed_message}
              onChange={handleChangeMessage}
              placeholder="Contoh: Layanan sedang dalam perbaikan..."
              variant="outlined"
            />
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
}
