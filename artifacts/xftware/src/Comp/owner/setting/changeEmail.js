import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography, Card, CardContent, Divider, alpha, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { Email, VerifiedUser } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

export default function ChangeEmailPage() {
  const [emailDefault, setEmailDefault] = useState('');
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [is2FA, setIs2FA] = useState(false);

  useEffect(() => {
    reqOwner({ action: 'getMe' }).then(r => {
      if (r.error) return toast.error(r.message);
      setEmailDefault(r.data.email);
    });
    reqOwner({ action: 'check2FA' }).then(res => {
      if (!res.error && res.data) setIs2FA(res.data.isTwoFA);
    });
  }, []);

  const sendOtpToEmail = async () => {
    if (is2FA) return toast.info('2FA aktif. Gunakan kode dari aplikasi Authenticator Anda.');
    if (!email) return toast.error('Masukkan email baru terlebih dahulu.');
    const res = await reqOwner({
      action: 'setEmail',
      email,
    });
    if (res.error) return toast.error(res.message);
    toast.success('Kode verifikasi dikirim ke email.');
  };

  const handleSubmit = async () => {
    if (!verifyCode) return toast.error(is2FA ? 'Kode Authenticator wajib diisi.' : 'Kode verifikasi wajib diisi.');
    setLoading(true);
    const res = await reqOwner({
      action: 'setEmail',
      email,
      verifyCode,
    });
    setLoading(false);

    if (res.error) return toast.error(res.message);
    toast.success('Email berhasil diperbarui.');
    setEmailDefault(email || emailDefault);
    setEmail('');
    setVerifyCode('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box sx={{ width: '100%' }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
          <Grid item xs={12} md={5}>
            <Box sx={{ pr: { md: 2 } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <Email sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>Ganti Email</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Email Anda adalah kunci utama untuk login dan pemulihan akun. Pastikan Anda menggunakan email yang selalu aktif dan aman. 
                {is2FA ? ' Karena 2FA aktif, Anda akan membutuhkan kode Authenticator untuk mengganti email.' : ' Kami akan mengirimkan kode verifikasi ke email baru Anda untuk konfirmasi.'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack spacing={2.5}>
                  <TextField label="Email Saat Ini" value={emailDefault} disabled fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                  <TextField label="Email Baru" value={email} onChange={e => setEmail(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                  <Stack direction="row" spacing={1.5}>
                    <TextField 
                      label={is2FA ? "Kode Authenticator" : "Kode OTP"} 
                      value={verifyCode} 
                      onChange={e => setVerifyCode(e.target.value)} 
                      fullWidth 
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      helperText={is2FA ? "Masukkan 6 digit dari aplikasi Authenticator" : "Cek email baru Anda"}
                    />
                    {!is2FA && (
                      <Button variant="outlined" onClick={sendOtpToEmail} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', minWidth: 120, flexShrink: 0, fontWeight: 700, height: 56 }}>
                        Kirim Kode
                      </Button>
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    fullWidth
                    startIcon={loading ? null : <VerifiedUser sx={{ fontSize: 18 }} />}
                    sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontWeight: 800 }}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
}