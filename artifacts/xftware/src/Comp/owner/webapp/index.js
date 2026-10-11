import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { reqOwner } from '@/lib/requestApi';
import { motion } from 'framer-motion';
import { ViewQuiltRounded, CodeRounded } from '@mui/icons-material';

import SettingTheme from './theme';
import MediaSection from './media';
import OwnerContactPage from './contact';
import SettingDepositButton from './depositButton';
import OwnerAnnouncementPage from './announcement';
import OwnerWebAppDomainPage from './customdomain';
import SettingManifest from './manifest';
import MaintenanceSetting from './maintenance';

export default function WebAppPage() {
  const [authUrl, setAuthUrl] = useState('');
  const [iframeKey, setIframeKey] = useState(Date.now());

  const refreshPreview = useCallback(() => {
    setIframeKey(Date.now());
  }, []);

  useEffect(() => {
    reqOwner({ action: 'dash.auth' }).then(res => {
      if (res?.data?.url) {
        setAuthUrl(res.data.url);
      }
    });
  }, []);

  return (
    <Box sx={{ width: '100%', mb: 8 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <ViewQuiltRounded sx={{ color: '#6366f1', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={800}>
            Pengaturan Web App
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
          Kelola tampilan, media, kontak, pengumuman, dan konfigurasi kustom domain website Anda secara terpusat.
        </Typography>
      </motion.div>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column-reverse', lg: 'row' },
          gap: 4,
          alignItems: 'flex-start',
        }}
      >
        {/* Kolom Kiri: Form Pengaturan (Scrollable) */}
        <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <MaintenanceSetting />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <SettingTheme onThemeSaved={refreshPreview} />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <MediaSection onUpdate={refreshPreview} />
          </Paper>

          <SettingManifest onUpdate={refreshPreview} />

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <OwnerContactPage />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <SettingDepositButton />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <OwnerAnnouncementPage />
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <OwnerWebAppDomainPage />
          </Paper>
        </Box>

        {/* Kolom Kanan: Iframe Preview (Sticky) */}
        <Box
          sx={{
            width: { xs: '100%', lg: 340, xl: 380 },
            position: 'sticky',
            top: 88, // sticky offset
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: '100%',
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: 6,
              p: 2,
              border: t => `1px dashed ${t.palette.divider}`,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Paper
              elevation={24}
              sx={{
                width: 320,
                height: 640,
                borderRadius: '32px',
                overflow: 'hidden',
                border: '8px solid #111827', // frame smartphone
                position: 'relative',
                bgcolor: 'background.default',
                transform: { xs: 'scale(0.9)', xl: 'scale(1)' },
                transformOrigin: 'top center',
                mb: { xs: -6, xl: 0 },
              }}
            >
              {/* Notch smartphone mock */}
              <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 24, bgcolor: '#111827', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
              
              {authUrl ? (
                <iframe
                  key={iframeKey}
                  src={authUrl}
                  title="Website Preview"
                  style={{ width: '100%', height: '100%', border: 'none', paddingTop: 8 }}
                />
              ) : (
                <Box display="flex" height="100%" alignItems="center" justifyContent="center">
                  <Typography color="text.secondary" variant="caption">Memuat Pratinjau...</Typography>
                </Box>
              )}
            </Paper>
          </Box>
          <Typography variant="caption" color="text.disabled" textAlign="center">
            <CodeRounded sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
            Live Preview (Otomatis menyesuaikan)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}