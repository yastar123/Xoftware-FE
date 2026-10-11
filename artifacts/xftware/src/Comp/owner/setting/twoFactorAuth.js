import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography, Card, CardContent, Divider, alpha, Alert, TextField, CircularProgress, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Security, Lock, PowerSettingsNew } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import SettingAuth from './authenticator';

export default function TwoFactorAuthPage() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'check2FA' });
      if (!res.error) setIsActive(res.data.isTwoFA);
    } catch (e) {
      toast.error('Gagal mengambil status 2FA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);


  const handleVerifyActivation = async (code, secret) => {
    setSubmitting(true);
    try {
      const res = await reqOwner({ action: 'verifyTwoFA', code, secret });
      if (res.error) return toast.error(res.message);
      toast.success('2FA Berhasil Diaktifkan');
      setIsActive(true);
      setShowSetup(false);
    } catch (e) {
      toast.error('Gagal mengaktifkan 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (otpCode.length !== 6) return toast.error('Kode OTP harus 6 digit');
    setSubmitting(true);
    try {
      const res = await reqOwner({ action: 'disable2FA', code: otpCode });
      if (res.error) return toast.error(res.message);
      toast.success('2FA Berhasil Dinonaktifkan');
      setIsActive(false);
      setShowDisable(false);
      setOtpCode('');
    } catch (e) {
      toast.error('Gagal menonaktifkan 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress size={40} color="primary" />
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AnimatePresence mode="wait">
        {showSetup ? (
           <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingAuth 
                onSuccess={(code, secret) => handleVerifyActivation(code, secret)} 
                mode="setup"
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button variant="text" onClick={() => setShowSetup(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Batalkan Konfigurasi
                </Button>
              </Box>
           </motion.div>
        ) : (
           <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <Box sx={{ width: '100%' }}>
               <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
                 <Grid item xs={12} md={5}>
                   <Box sx={{ pr: { md: 2 } }}>
                     <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(isActive ? '#10b981' : '#6366f1', 0.1), color: isActive ? '#10b981' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                       <Security sx={{ fontSize: 24 }} />
                     </Box>
                     <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
                       Autentikasi Dua Faktor
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                       Lindungi akun Anda dengan lapisan keamanan tambahan. Kami sangat menyarankan penggunaan Google Authenticator agar akun Anda tetap aman meskipun password Anda diketahui orang lain.
                     </Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={7}>
                   <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                     <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                       {isActive ? (
                          <Box>
                            <Alert severity="success" icon={<Shield />} sx={{ borderRadius: 2, mb: 3 }}>
                              Status: <strong>AKTIF</strong>. Akun Anda saat ini terlindungi.
                            </Alert>
                            
                            {!showDisable ? (
                              <Button 
                                variant="outlined" 
                                color="error" 
                                fullWidth 
                                startIcon={<PowerSettingsNew />}
                                onClick={() => setShowDisable(true)}
                                sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 700 }}
                              >
                                Nonaktifkan 2FA
                              </Button>
                            ) : (
                              <Stack spacing={2.5}>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#ef4444', 0.05), border: '1px solid', borderColor: alpha('#ef4444', 0.2) }}>
                                  <Shield sx={{ fontSize: 24, color: '#ef4444' }} />
                                  <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ lineHeight: 1.5 }}>
                                    Masukkan 6 digit kode dari aplikasi Google Authenticator Anda untuk menonaktifkan 2FA.
                                  </Typography>
                                </Stack>
                                <TextField 
                                  label="Kode OTP" 
                                  fullWidth 
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value)}
                                  inputProps={{ maxLength: 6 }}
                                />
                                <Stack direction="row" spacing={1.5}>
                                  <Button 
                                    variant="outlined" 
                                    fullWidth 
                                    onClick={() => setShowDisable(false)}
                                    disabled={submitting}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2 }}
                                  >
                                    Batal
                                  </Button>
                                  <Button 
                                    variant="contained" 
                                    color="error" 
                                    fullWidth 
                                    onClick={handleDisable}
                                    disabled={submitting}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 1.2 }}
                                  >
                                    {submitting ? 'Memproses...' : 'Konfirmasi Nonaktifkan'}
                                  </Button>
                                </Stack>
                              </Stack>
                            )}
                          </Box>
                       ) : (
                          <Box>
                            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                              2FA belum diaktifkan. Ayo amankan akun Anda sekarang juga!
                            </Alert>
                            <Button 
                              variant="contained" 
                              fullWidth 
                              startIcon={<Lock />}
                              onClick={() => setShowSetup(true)}
                              sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 800 }}
                            >
                              Mulai Konfigurasi 2FA
                            </Button>
                          </Box>
                       )}
                     </CardContent>
                   </Card>
                 </Grid>
               </Grid>
             </Box>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
