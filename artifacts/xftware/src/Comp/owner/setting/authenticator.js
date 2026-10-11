import React, { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Card, CardContent, Stack, alpha, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { QrCode, Shield } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

function SettingAuth({ onSuccess, mode = 'setup', username, secretCode: propSecret, qrImage: propQr }) {
  const [qrImage, setQrImage] = useState(propQr || null);
  const [secretCode, setSecretCode] = useState(propSecret || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(!!(propQr && propSecret));

  const handleStart = async () => {
    setLoading(true);
    const res = await reqOwner({ action: 'setupTwoFA', username });
    setLoading(false);
    if (res.error) return toast.error(res.message);
    setQrImage(res.data.qrImage);
    setSecretCode(res.data.secretCode);
    setHasStarted(true);
  };

  const handleVerify = () => {
    if (!code || code.length !== 6) return toast.error('Kode harus 6 digit');
    if (onSuccess) onSuccess(code, secretCode);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }} justifyContent={mode === 'force' ? 'center' : 'flex-start'}>
          <Grid item xs={12} md={mode === 'force' ? 8 : 5}>
            <Box sx={{ pr: { md: 2 }, textAlign: mode === 'force' ? 'center' : 'left' }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#10b981', 0.1), color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5, mx: mode === 'force' ? 'auto' : 0 }}>
                <Shield sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
                Google Authenticator (2FA)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {mode === 'force' 
                  ? 'Sistem mewajibkan Anda untuk mengaktifkan keamanan tambahan menggunakan Google Authenticator agar Anda dapat melanjutkan dan mengakses fitur penting.' 
                  : 'Tingkatkan keamanan akun Anda secara signifikan dengan mengaktifkan verifikasi dua langkah. Walaupun ada yang mengetahui password Anda, mereka tetap butuh kode dari ponsel Anda.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={mode === 'force' ? 12 : 7}>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)', maxWidth: mode === 'force' ? 560 : '100%', mx: mode === 'force' ? 'auto' : 0 }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
                {!hasStarted ? (
                  <Stack spacing={3} alignItems="center" sx={{ py: 3, width: '100%' }}>
                    <Typography variant="body1" fontWeight={600} textAlign="center" sx={{ maxWidth: 320 }}>
                      Siap untuk mengamankan akun Anda?
                    </Typography>
                    <Button variant="contained" onClick={handleStart} sx={{ borderRadius: 2, px: 6, py: 1.5, textTransform: 'none', fontWeight: 800 }}>
                      Mulai Setup 2FA Sekarang
                    </Button>
                  </Stack>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }} style={{ width: '100%' }}>
                    <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'divider', display: 'inline-flex' }}>
                        {qrImage ? (
                          <Box component="img" src={qrImage} alt="QR Code" sx={{ width: 200, height: 200, borderRadius: 1.5, display: 'block' }} />
                        ) : (
                          <Box sx={{ width: 200, height: 200, display: 'grid', placeItems: 'center', bgcolor: alpha('#000', 0.02), borderRadius: 1.5 }}>
                            <QrCode sx={{ fontSize: 64, color: 'text.disabled' }} />
                          </Box>
                        )}
                      </Card>

                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ width: '100%', maxWidth: 360, px: 2, py: 1.5, borderRadius: 2, bgcolor: alpha('#000', 0.03), border: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">Kode rahasia manual:</Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace', letterSpacing: 1, color: 'text.primary' }}>{secretCode}</Typography>
                      </Stack>

                      <TextField
                        label="Kode OTP dari Google Authenticator"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        inputProps={{ maxLength: 6 }}
                        fullWidth
                        sx={{ maxWidth: 360, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Button
                        variant="contained"
                        onClick={handleVerify}
                        disabled={loading}
                        fullWidth
                        sx={{ maxWidth: 360, borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 800 }}
                      >
                        Aktifkan & Simpan 2FA
                      </Button>
                    </Stack>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}

export default SettingAuth;