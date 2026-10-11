import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Stack, Skeleton,
  Alert, Chip, alpha, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Divider, Grid2 as Grid,
} from '@mui/material';
import {
  Link, ContentCopy, CheckCircle, Cancel, Telegram,
  Refresh, Info, Warning, Settings
} from '@mui/icons-material';
import { useSellerChatAuth } from '@/Hook/useSellerChatAuth';

export default function SellerChatSettings({ onBack }) {
  const { status, tokenData, requesting, disconnecting, fetchStatus, requestToken, disconnect } = useSellerChatAuth();
  const [copied, setCopied] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Countdown timer untuk token expiry
  useEffect(() => {
    if (!tokenData?.expiresAt || tokenData.isConnected) return;
    
    const expiry = new Date(tokenData.expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [tokenData]);

  const formatCountdown = (secs) => {
    if (secs === null) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isConnected = status.isConnected;
  const isExpired = countdown !== null && countdown <= 0;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Telegram sx={{ fontSize: 28, color: '#0088cc' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>Pengaturan Chat Seller</Typography>
          <Typography variant="caption" color="text.secondary">
            Opsional: Hubungkan bot Telegram untuk notifikasi chat instan
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Refresh status">
          <IconButton size="small" onClick={fetchStatus}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {status.loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          {/* Status Card */}
          <Card
            sx={{
              borderRadius: 3,
              border: '2px solid',
              borderColor: isConnected ? 'success.main' : (tokenData?.token && !isExpired ? 'warning.main' : 'divider'),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 3, py: 2,
                bgcolor: isConnected
                  ? alpha('#10b981', 0.06)
                  : (tokenData?.token && !isExpired ? alpha('#f59e0b', 0.06) : 'grey.50'),
                display: 'flex', alignItems: 'center', gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 52, height: 52, borderRadius: '50%',
                  bgcolor: isConnected ? alpha('#10b981', 0.12) : 'grey.100',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
              >
                <Telegram sx={{ fontSize: 28, color: isConnected ? '#10b981' : 'grey.400' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {isConnected ? 'Terhubung' : (tokenData?.token && !isExpired ? 'Menunggu Koneksi' : 'Tidak Terhubung')}
                  </Typography>
                  <Chip
                    icon={isConnected ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                    label={isConnected ? 'Aktif' : 'Nonaktif'}
                    size="small"
                    color={isConnected ? 'success' : 'default'}
                    sx={{ fontSize: 10, height: 22, fontWeight: 600 }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {isConnected
                    ? `Terhubung sejak ${status.connectedAt ? new Date(status.connectedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}`
                    : 'Belum ada bot Telegram yang terhubung'}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Connected State */}
          {isConnected && (
            <Alert
              severity="success"
              icon={<CheckCircle sx={{ fontSize: 20 }} />}
              sx={{ borderRadius: 2.5, py: 1.5 }}
            >
              <Typography variant="body2" fontWeight={500}>
                Bot Telegram terhubung. Anda akan menerima notifikasi chat dari reseller via Telegram.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Chat juga bisa dibaca dan dibalas langsung dari halaman <b>Reseller Chat</b> di web dashboard ini.
              </Typography>
            </Alert>
          )}

          {/* Token Card */}
          {tokenData?.token && !isConnected && !isExpired && (
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, bgcolor: alpha('#f59e0b', 0.04) }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Info sx={{ fontSize: 18, color: '#f59e0b' }} />
                  <Typography variant="subtitle2" fontWeight={700}>Kirim Token ke Bot Telegram</Typography>
                </Stack>
                
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    Token ini berlaku <b>{formatCountdown(countdown)}</b> menit lagi. Segera kirim ke bot!
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13, lineHeight: 1.7 }}>
                  1. Buka Telegram dan cari bot <b>@YourSellerChatBot</b><br />
                  2. Ketik token di bawah ini dan kirim<br />
                  3. Bot akan otomatis menghubungkan akun Anda
                </Typography>

                {/* Token Display */}
                <Box
                  onClick={handleCopy}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 1.5, p: 2, mb: 1.5,
                    bgcolor: 'white', borderRadius: 2.5,
                    border: '2px dashed',
                    borderColor: copied ? 'success.main' : alpha('#f59e0b', 0.4),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'success.light', bgcolor: alpha('#10b981', 0.02) },
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em',
                      color: copied ? 'success.main' : 'text.primary',
                    }}
                  >
                    {tokenData.token}
                  </Typography>
                  <Tooltip title={copied ? 'Tersalin!' : 'Salin token'}>
                    <IconButton size="small" sx={{ color: copied ? 'success.main' : 'text.secondary' }}>
                      {copied ? <CheckCircle sx={{ fontSize: 20 }} /> : <ContentCopy sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={requestToken}
                    disabled={requesting}
                    startIcon={requesting ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 14 }} />}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Buat Token Baru
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={fetchStatus}
                    sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
                  >
                    Cek Status
                  </Button>
                </Stack>
              </Box>
            </Card>
          )}

          {/* Token Expired */}
          {isExpired && (
            <Alert
              severity="error"
              icon={<Warning sx={{ fontSize: 20 }} />}
              action={
                <Button color="inherit" size="small" onClick={requestToken} disabled={requesting}>
                  Buat Ulang
                </Button>
              }
              sx={{ borderRadius: 2.5 }}
            >
              Token telah kadaluarsa. Buat token baru untuk menghubungkan bot.
            </Alert>
          )}

          {/* Not Connected & No Token */}
          {!isConnected && !tokenData?.token && !isExpired && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Telegram sx={{ fontSize: 48, color: 'grey.300', mb: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Notifikasi Telegram (Opsional)
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5, maxWidth: 360, mx: 'auto' }}>
                  Hubungkan bot Telegram untuk mendapatkan notifikasi instan saat ada chat masuk dari reseller. Anda tetap bisa membaca dan membalas chat langsung dari web dashboard tanpa menghubungkan Telegram.
                </Typography>
                <Button
                  variant="contained"
                  onClick={requestToken}
                  disabled={requesting}
                  startIcon={requesting ? <CircularProgress size={16} color="inherit" /> : <Telegram sx={{ fontSize: 18 }} />}
                  sx={{ borderRadius: 2.5, px: 4, py: 1.2, textTransform: 'none', fontWeight: 600 }}
                >
                  Hubungkan Bot Telegram
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Cards */}
          <Grid container spacing={1.5}>
            {[
              {
                title: 'Dari Web Dashboard',
                desc: 'Baca & balas chat reseller langsung dari web. Lebih mudah manage banyak chat.',
                icon: '🌐',
              },
              {
                title: 'Dari Telegram Bot',
                desc: 'Terima notifikasi & balas chat via Telegram. Reply pada pesan reseller untuk membalas.',
                icon: '📱',
              },
              {
                title: 'Sinkron Otomatis',
                desc: 'Chat dari web dan Telegram tersinkronisasi. Balas dari mana saja tetap tercatat.',
                icon: '🔄',
              },
            ].map((item, i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography sx={{ fontSize: 28, mb: 0.75 }}>{item.icon}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{item.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.5 }}>
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Disconnect */}
          {isConnected && (
            <>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" fontWeight={600} color="error">Putuskan Koneksi</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Anda tidak akan lagi menerima chat dari reseller
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setConfirmDisconnect(true)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Putuskan
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      )}

      {/* Confirm Disconnect Dialog */}
      <Dialog open={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Putuskan Koneksi Bot?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Setelah diputuskan, Anda tidak akan menerima pesan chat dari reseller melalui Telegram. 
            Chat yang sudah ada tetap tersimpan di web dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDisconnect(false)} size="small">Batal</Button>
          <Button
            onClick={async () => {
              await disconnect();
              setConfirmDisconnect(false);
            }}
            color="error"
            variant="contained"
            size="small"
            disabled={disconnecting}
            startIcon={disconnecting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Ya, Putuskan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}