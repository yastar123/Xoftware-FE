import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, CircularProgress, Container, Paper, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { LockReset, CheckCircle, ErrorOutline, Shield } from '@mui/icons-material';
import { reqApiHttp } from '@/lib/requestApi';
import Head from 'next/head';

const RevokeSessionPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Memproses permintaan pencabutan sesi...');

  useEffect(() => {
    const handleRevoke = async () => {
      try {
        const res = await reqApiHttp('/owner/auth/revoke', { token });
        if (res.error) {
          setStatus('error');
          setMessage(res.message || 'Token tidak valid atau sudah kadaluarsa.');
        } else {
          setStatus('success');
          setMessage(res.message || 'Sesi tersebut telah berhasil dicabut.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Terjadi kesalahan server. Silakan coba lagi nanti.');
      }
    };

    if (token) {
      handleRevoke();
    }
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Head>
        <title>Keamanan Akun | Xoftware</title>
      </Head>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        py={4}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            }}
          >
            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Stack spacing={3} alignItems="center">
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress size={80} thickness={2} sx={{ color: 'primary.main' }} />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Shield sx={{ fontSize: 40, color: 'primary.main', opacity: 0.5 }} />
                      </Box>
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      Memproses Keamanan...
                    </Typography>
                    <Typography color="text.secondary">
                      {message}
                    </Typography>
                  </Stack>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <Stack spacing={3} alignItems="center">
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      Sesi Dicabut!
                    </Typography>
                    <Typography variant="body1">
                      {message}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ bgcolor: 'info.lighter', p: 2, borderRadius: 2 }}>
                      Demi keamanan, kami sangat menyarankan Anda untuk segera <b>mengubah password</b> akun Anda jika Anda merasa tidak melakukan login tersebut.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%">
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => router.push('/login')}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Kembali ke Login
                      </Button>
                    </Stack>
                  </Stack>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Stack spacing={3} alignItems="center">
                    <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      Gagal Memproses
                    </Typography>
                    <Typography variant="body1">
                      {message}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/login')}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Buka Halaman Login
                    </Button>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default RevokeSessionPage;
