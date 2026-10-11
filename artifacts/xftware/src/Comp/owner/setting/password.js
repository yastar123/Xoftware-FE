import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography, Card, CardContent, Divider, alpha, Grid } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Shield } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { reqOwner } from '@/lib/requestApi';

export default function SettingPasswordPage() {
  const [step, setStep] = useState(0);
  const [isReset, setIsReset] = useState(false);
  const [oldpass, setOldpass] = useState('');
  const [newpass, setNewpass] = useState('');
  const [confpass, setConfpass] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FA, setIs2FA] = useState(false);

  useEffect(() => {
    reqOwner({ action: 'check2FA' }).then(res => {
      if (!res.error && res.data) setIs2FA(res.data.isTwoFA);
    });
  }, []);

  const handleNext = async () => {
    if (!isReset && !oldpass) return toast.error('Password lama wajib diisi.');
    if (!newpass || !confpass) return toast.error('Password baru wajib diisi.');
    if (newpass !== confpass) return toast.error('Konfirmasi password tidak cocok.');
    
    if (is2FA) {
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const action = isReset ? 'resetpassword' : 'setpassword';
      const res = await reqOwner({ action, oldpass: isReset ? undefined : oldpass, newpass, confpass });
      if (res.error) return toast.error(res.message);
      toast.success(res.message || 'Kode verifikasi telah dikirim ke email Anda.');
      setStep(1);
    } catch (e) {
      toast.error(e?.message || 'Gagal mengirim kode verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (otp.length !== 6) return toast.error(is2FA ? 'Kode Authenticator harus 6 digit.' : 'Kode OTP harus 6 digit.');
    setLoading(true);
    try {
      const action = isReset ? 'resetpassword' : 'setpassword';
      const res = await reqOwner({ 
        action, 
        otpVerification: otp, 
        oldpass: isReset ? undefined : oldpass, 
        newpass, 
        confpass 
      });
      if (res.error) return toast.error(res.message);
      
      Cookies.remove('__access__token__');
      toast.success('Password berhasil diperbarui. Semua sesi perangkat telah dinonaktifkan. Silakan login kembali.');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'Password akun Anda berhasil diperbarui. Silakan masuk kembali dengan password baru.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1200);
      }
    } catch (e) {
      toast.error(e?.message || 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
          <Grid item xs={12} md={5}>
            <Box sx={{ pr: { md: 2 } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <Lock sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
                {isReset ? 'Reset Password' : 'Ubah Password'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {isReset 
                  ? 'Lupa password Anda? Tidak masalah. Kami akan membantu Anda meresetnya lewat panduan aman agar akun Anda kembali bisa diakses.'
                  : 'Lindungi akun Anda dengan rutin memperbarui kata sandi. Pastikan Anda menggunakan kombinasi angka, huruf, dan simbol agar tidak mudah ditebak.'
                }
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="pw-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                      <Stack spacing={2.5}>
                        {!isReset && (
                          <TextField label="Password Lama" type="password" value={oldpass} onChange={e => setOldpass(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} autoFocus />
                        )}
                        <TextField label="Password Baru" type="password" value={newpass} onChange={e => setNewpass(e.target.value)} helperText="Minimal 8 karakter untuk keamanan." fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField label="Konfirmasi Password Baru" type="password" value={confpass} onChange={e => setConfpass(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                          <Button variant="text" size="small" onClick={() => setIsReset(!isReset)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            {isReset ? 'Ingat password lama?' : 'Lupa password lama?'}
                          </Button>
                        </Box>

                        <Button variant="contained" onClick={handleNext} disabled={loading} fullWidth sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 800 }}>
                           {loading ? 'Memproses...' : (isReset ? 'Minta Kode Reset' : 'Lanjut Verifikasi')}
                        </Button>
                      </Stack>
                    </motion.div>
                  )}
                  {step === 1 && (
                    <motion.div key="otp-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                      <Stack spacing={2.5}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#6366f1', 0.05), border: '1px solid', borderColor: alpha('#6366f1', 0.2) }}>
                          <Shield sx={{ fontSize: 24, color: '#6366f1' }} />
                          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ lineHeight: 1.5 }}>
                            {is2FA ? 'Masukkan 6 digit kode dari aplikasi Google Authenticator Anda untuk mengonfirmasi.' : 'Cek kotak masuk email Anda dan masukkan kode OTP yang telah kami kirimkan.'}
                          </Typography>
                        </Stack>
                        <TextField 
                          label={is2FA ? "Kode Authenticator" : "Kode OTP"} 
                          value={otp} 
                          onChange={e => setOtp(e.target.value)} 
                          inputProps={{ maxLength: 6 }} 
                          fullWidth 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                        />
                        <Button variant="contained" onClick={handleSubmit} disabled={loading} fullWidth sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 800 }}>
                          {loading ? 'Menyimpan...' : (isReset ? 'Reset Password Sekarang' : 'Simpan Password')}
                        </Button>
                        <Button variant="outlined" onClick={() => setStep(0)} disabled={loading} fullWidth sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 700 }}>
                          Kembali
                        </Button>
                      </Stack>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}