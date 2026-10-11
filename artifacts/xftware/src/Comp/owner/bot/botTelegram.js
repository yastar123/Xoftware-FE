import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography, Card, CardContent, InputAdornment, Tabs, Tab, Grid, alpha } from '@mui/material';
import { SmartToy, Save, PlayArrow, Stop, CloudUpload, Settings, Campaign, Info, CheckCircle, ErrorOutline, NotificationsActive, Tune } from '@mui/icons-material';
import { useRef, useState } from 'react';
import TeleBroadcastPage from './teleBroadcast';
import TeleChannelNotifPage from './teleChannelNotif';
import TeleTemplateManager from './teleTemplateManager';

export default function BotTelegramConfig({ form, loading, teleStatus, handleChange, handleAction, handleUpdate, handleUploadThumbnail }) {
  const inputRef = useRef(null);
  const [tab, setTab] = useState('config');

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          maxWidth: '100%',
          width: '100%',
          minWidth: 0,
          '& .MuiTabs-scroller': {
            overflowX: 'auto !important',
          },
          '& .MuiTab-root': {
            whiteSpace: 'nowrap',
            fontSize: { xs: 12.5, sm: 14 },
            px: { xs: 1.5, sm: 2 },
          },
        }}
      >
        <Tab icon={<Settings fontSize="small" />} iconPosition="start" label="Pengaturan Dasar" value="config" />
        <Tab icon={<Campaign fontSize="small" />} iconPosition="start" label="Broadcast & Poling" value="broadcast" />
        <Tab icon={<NotificationsActive fontSize="small" />} iconPosition="start" label="Notifikasi Channel" value="channelNotif" />
        <Tab icon={<Tune fontSize="small" />} iconPosition="start" label="Kustomisasi Template" value="templates" />
      </Tabs>

      {tab === 'config' && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>Pengaturan Bot Telegram</Typography>
            <Typography variant="body2" color="text.secondary">Konfigurasi token bot, ID pemilik, dan panduan dasar untuk pengguna.</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Left Column: Form Config */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Detail Konfigurasi</Typography>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Token Bot Telegram"
                      value={form.telegramToken}
                      onChange={handleChange('telegramToken')}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SmartToy sx={{ fontSize: 20, color: 'primary.main' }} /></InputAdornment>,
                      }}
                      helperText="Dapatkan token dari @BotFather di Telegram."
                    />
                    <TextField
                      label="Telegram Owner ID"
                      value={form.telegramOwner}
                      onChange={handleChange('telegramOwner')}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      helperText="ID Telegram angka unik Anda (misal: 123456789)."
                    />
                    <TextField
                      label="Panduan Deposit"
                      value={form.telegramGuideDeposit}
                      onChange={handleChange('telegramGuideDeposit')}
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      helperText="Pesan otomatis yang akan dikirim saat user ingin deposit."
                    />

                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#6366f1', 0.04), border: '1px dashed', borderColor: alpha('#6366f1', 0.2) }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Thumbnail Bot</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        {form.telegramThumbnail ? (
                          <Box
                            component="img"
                            src={form.telegramThumbnail}
                            alt="thumb"
                            sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            onError={e => { e.target.onerror = null; e.target.src = '/image-fallback-error.png'; }}
                          />
                        ) : (
                          <Box sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloudUpload sx={{ color: 'text.disabled', opacity: 0.5 }} />
                          </Box>
                        )}
                        <Box>
                          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUploadThumbnail} />
                          <Button
                            variant="outlined"
                            startIcon={<CloudUpload sx={{ fontSize: 18 }} />}
                            onClick={() => inputRef.current?.click()}
                            sx={{ borderRadius: 2, textTransform: 'none', mb: 0.5 }}
                          >
                            Upload Gambar Baru
                          </Button>
                          <Typography variant="caption" color="text.secondary" display="block">Format: JPG, PNG. Rekomendasi 512x512px.</Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="contained"
                        disabled={loading}
                        onClick={handleUpdate}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4, py: 1.2 }}
                      >
                        Simpan Konfigurasi
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column: Status and Actions */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                       <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), display: 'flex' }}><Settings sx={{ color: '#6366f1' }} /></Box>
                       <Typography variant="h6" fontWeight={700}>Aksi & Kontrol Bot</Typography>
                    </Stack>
                    
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                       Selalu <b>Simpan Konfigurasi</b> terlebih dahulu sebelum menjalankan (Start) bot.
                    </Alert>

                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Status Bot Telegram</Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: alpha(teleStatus ? '#10b981' : '#ef4444', 0.05), border: '1px solid', borderColor: alpha(teleStatus ? '#10b981' : '#ef4444', 0.2) }}>
                      {teleStatus ? <CheckCircle color="success" sx={{ fontSize: 40 }} /> : <ErrorOutline color="error" sx={{ fontSize: 40 }} />}
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>Status Saat Ini</Typography>
                        <Typography variant="h6" fontWeight={800} color={teleStatus ? 'success.main' : 'error.main'}>
                          {teleStatus === null ? 'Memuat...' : teleStatus ? 'Bot Aktif & Berjalan' : 'Bot Sedang Mati'}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          disabled={loading}
                          onClick={() => handleAction('teleConfig', 'start')}
                          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2, boxShadow: 'none' }}
                        >
                          Start Bot
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          disabled={loading}
                          onClick={() => handleAction('teleConfig', 'stop')}
                          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Stop />}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2 }}
                        >
                          Stop Bot
                        </Button>
                      </Grid>
                    </Grid>

                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}
      {tab === 'broadcast' && <TeleBroadcastPage />}
      {tab === 'channelNotif' && <TeleChannelNotifPage />}
      {tab === 'templates' && <TeleTemplateManager />}
    </Box>
  );
}