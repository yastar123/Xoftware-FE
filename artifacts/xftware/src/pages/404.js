import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Config from '@/config';

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>404 - Halaman Tidak Ditemukan</title>
      </Head>
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${Config.themeColor.backgroundLight} 0%, #e2e8f0 100%)`,
          px: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.90)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.4)',
          }}>
            <Typography 
              variant="h1" 
              fontWeight={900} 
              sx={{ 
                color: Config.themeColor.primary, 
                fontSize: { xs: 90, md: 140 }, 
                lineHeight: 1,
                letterSpacing: -4,
                mb: 1
              }}
            >
              404
            </Typography>
            <Typography variant="h5" fontWeight={850} sx={{ color: Config.themeColor.textLight, letterSpacing: -0.5 }}>
              Halaman Tidak Ditemukan
            </Typography>
            <Typography variant="body1" sx={{ color: Config.themeColor.secondary, mt: 2, mb: 4, lineHeight: 1.7 }}>
              Maaf, halaman yang Anda tuju mungkin telah dipindahkan, diubah namanya, atau memang tidak pernah ada.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push('/')}
              sx={{
                bgcolor: Config.themeColor.customColor,
                color: '#fff',
                px: 4,
                py: 1.4,
                borderRadius: 2,
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  bgcolor: Config.themeColor.primary,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 25px rgba(99, 102, 241, 0.4)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Kembali ke Beranda
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
