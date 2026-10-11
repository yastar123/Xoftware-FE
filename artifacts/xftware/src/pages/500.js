import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import Head from 'next/head';
import Config from '@/config';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Terjadi Kesalahan</title>
      </Head>
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${Config.themeColor.backgroundLight} 0%, #ffebee 100%)`,
          px: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.90)',
            boxShadow: '0 20px 40px rgba(239,68,68,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.4)',
          }}>
            <Typography 
              variant="h1" 
              fontWeight={900} 
              sx={{ 
                color: '#ef4444', 
                fontSize: { xs: 90, md: 140 }, 
                lineHeight: 1,
                letterSpacing: -4,
                mb: 1
              }}
            >
              500
            </Typography>
            <Typography variant="h5" fontWeight={850} sx={{ color: Config.themeColor.textLight, letterSpacing: -0.5 }}>
              Terjadi Kesalahan Server
            </Typography>
            <Typography variant="body1" sx={{ color: Config.themeColor.secondary, mt: 2, mb: 4, lineHeight: 1.7 }}>
              Maaf, permintaan Anda tidak dapat diproses saat ini akibat masalah teknis pada server. Silakan coba beberapa saat lagi.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              sx={{
                bgcolor: '#ef4444',
                color: '#fff',
                px: 4,
                py: 1.4,
                borderRadius: 2,
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                '&:hover': {
                  bgcolor: '#dc2626',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 25px rgba(239, 68, 68, 0.4)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Muat Ulang Halaman
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
