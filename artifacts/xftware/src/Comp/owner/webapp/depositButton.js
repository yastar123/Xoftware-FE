import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, TextField, Button, Chip,
  Card, CardContent, Grid, alpha, IconButton, Tooltip,
} from '@mui/material';
import { Payment, Add, Refresh, Delete } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { idr } from '@/lib/helper';

const MotionChip = motion(Chip);

export default function SettingDepositButton() {
  const [buttons, setButtons] = useState([]);
  const [value, setValue] = useState('');

  const loadData = async () => {
    const res = await reqOwner({ action: 'getAutoDepositButtons' });
    setButtons(res.data || []);
  };

  useEffect(() => { loadData(); }, []);

  const addButton = async () => {
    const amount = parseInt(value);
    if (isNaN(amount) || amount < 1000 || amount > 10000000 || amount % 1000 !== 0) {
      toast.error('Masukkan kelipatan 1000 antara 1.000 - 10.000.000');
      return;
    }
    await reqOwner({ action: 'addSingleDepositButton', value: amount });
    setValue('');
    loadData();
    toast.success('Tombol deposit berhasil ditambahkan');
  };

  const removeButton = async val => {
    await reqOwner({ action: 'removeAutoDepositButtonByValue', value: val });
    loadData();
    toast.success('Tombol deposit berhasil dihapus');
  };

  const resetAll = async () => {
    await reqOwner({ action: 'resetAutoDepositButtons' });
    loadData();
    toast.success('Semua tombol deposit berhasil direset');
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Tombol Cepat Deposit</Typography>
            <Typography variant="caption" color="text.secondary">Kelola nominal tombol cepat pada halaman deposit website.</Typography>
          </Box>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                <Payment sx={{ fontSize: 18 }} />
              </Box>
              <TextField
                label="Tambah Nominal"
                size="small"
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Contoh: 50000"
                fullWidth
                sx={{ maxWidth: 300 }}
                onKeyDown={e => { if (e.key === 'Enter') addButton(); }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={addButton}
                startIcon={<Add sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Tambah
              </Button>
              <Box sx={{ flex: 1 }} />
              <Tooltip title="Reset Semua">
                <IconButton onClick={resetAll} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, color: 'warning.main' }}>
                  <Refresh sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                  <Payment sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total Tombol</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{buttons.length}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Tombol Tersedia</Typography>
        {buttons.length === 0 ? (
          <Card variant="outlined" sx={{ borderRadius: 3, py: 4, textAlign: 'center' }}>
            <Payment sx={{ fontSize: 40, color: 'text.disabled', mb: 0.5 }} />
            <Typography color="text.disabled" variant="body2">Belum ada tombol tersedia</Typography>
          </Card>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <AnimatePresence>
              {buttons.map((btn, idx) => (
                <MotionChip
                  key={btn}
                  label={idr(btn)}
                  color="primary"
                  variant="outlined"
                  onDelete={() => removeButton(btn)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                  sx={{ fontWeight: 600, borderRadius: 2, px: 0.5 }}
                />
              ))}
            </AnimatePresence>
          </Stack>
        )}
      </Box>
    </Box>
  );
}