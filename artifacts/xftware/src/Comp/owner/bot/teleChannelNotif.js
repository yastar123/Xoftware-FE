import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  alpha,
  InputAdornment,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save,
  Send,
  NotificationsActive,
  Restore,
} from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

export default function TeleChannelNotifPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Config State
  const [enabled, setEnabled] = useState(false);
  const [product, setProduct] = useState(true);
  const [ppob, setPpob] = useState(true);
  const [smm, setSmm] = useState(true);
  const [target, setTarget] = useState('');
  const [credit, setCredit] = useState(0);
  const [template, setTemplate] = useState('');

  const DEFAULT_TELE_CHANNEL_TEMPLATE = `<b>🔔 PESANAN BERHASIL DIPROSES! 🔔</b>
<code>{{ORDER_TYPE}} — {{PRODUCT_TITLE}}</code>

<b>• Reff ID:</b> <code>{{REFF_ID}}</code>
<b>• Produk:</b> {{PRODUCT_TITLE}}
[IF_PRODUCT_DETAIL]<b>• Detail:</b> {{PRODUCT_DETAIL}}
[/IF_PRODUCT_DETAIL]<b>• Jumlah:</b> {{QTY}} item
<b>• Total Bayar:</b> {{TOTAL}}
[IF_TARGET]<b>• Tujuan:</b> <code>{{TARGET}}</code>
[/IF_TARGET][IF_SN]<b>• SN:</b> <code>{{SN}}</code>
[/IF_SN][IF_SELLER_NOTE]<b>• Catatan:</b> {{SELLER_NOTE}}
[/IF_SELLER_NOTE]<b>• Waktu:</b> {{TIME}}

Terima kasih telah berbelanja di @{{BOT_USERNAME}}!`;

  const fetchBotInfo = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getInformationBot' });
      if (!res.error && res.data) {
        setEnabled(!!res.data.channelNotifEnabled);
        setProduct(res.data.channelNotifProduct !== undefined ? !!res.data.channelNotifProduct : true);
        setPpob(res.data.channelNotifPpob !== undefined ? !!res.data.channelNotifPpob : true);
        setSmm(res.data.channelNotifSmm !== undefined ? !!res.data.channelNotifSmm : true);
        setTarget(res.data.channelNotifTarget || '');
        setCredit(Number(res.data.channelNotifCredit || 0));
        setTemplate(res.data.channelNotifTemplate || DEFAULT_TELE_CHANNEL_TEMPLATE);
      }
    } catch {
      toast.error('Gagal memuat pengaturan notifikasi channel');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBotInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertVariable = (varName) => {
    setTemplate((prev) => (prev ? `${prev} {{${varName}}}` : `{{${varName}}}`));
  };

  const handleSaveConfig = async () => {
    const targets = target
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (targets.length > 3) {
      return toast.warning('Maksimal 3 target channel.');
    }

    setSaving(true);
    try {
      const res = await reqOwner({
        action: 'updateChannelNotifConfig',
        enabled,
        product,
        ppob,
        smm,
        target: targets.join(', '),
        template,
      });
      if (!res.error) {
        toast.success(res.message || 'Pengaturan berhasil disimpan');
        fetchBotInfo();
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    }
    setSaving(false);
  };

  const handleTestSend = async () => {
    if (!target.trim()) {
      return toast.warning('Tentukan target channel terlebih dahulu');
    }
    if (credit <= 0) {
      return toast.warning('Credit tidak mencukupi. Silakan isi credit di Informasi Layanan.');
    }

    setTesting(true);
    try {
      const res = await reqOwner({ action: 'testChannelNotif' });
      if (!res.error) {
        toast.success(res.message || 'Pesan test berhasil dikirim');
        if (res.data?.credit !== undefined) {
          setCredit(res.data.credit);
        } else {
          fetchBotInfo();
        }
      } else {
        toast.error(res.message || 'Gagal mengirim pesan test');
      }
    } catch {
      toast.error('Gagal mengirim pesan test');
    }
    setTesting(false);
  };

  const targetsCount = target
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Memuat pengaturan notifikasi channel...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Notifikasi Channel Telegram
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pengaturan pengiriman notifikasi order transaksi ke channel Telegram.
        </Typography>
      </Box>

      {/* Credit Status Banner */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: alpha('#6366f1', 0.1),
                  color: 'primary.main',
                  display: 'flex',
                }}
              >
                <NotificationsActive />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  SISA CREDIT NOTIFIKASI
                </Typography>
                <Typography variant="h5" fontWeight={800} color={credit > 0 ? 'text.primary' : 'error.main'}>
                  {credit.toLocaleString('id-ID')}{' '}
                  <Typography component="span" variant="subtitle2" color="text.secondary">
                    Credit
                  </Typography>
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              1 credit terpakai per pesan sukses. Pembelian credit dapat dilakukan di menu <b>Informasi Layanan</b>.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Master Switch */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(enabled ? '#10b981' : '#6b7280', 0.08),
                border: '1px solid',
                borderColor: alpha(enabled ? '#10b981' : '#6b7280', 0.2),
              }}
            >
              <FormControlLabel
                control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="success" />}
                label={
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {enabled ? 'Notifikasi Channel Aktif' : 'Notifikasi Channel Nonaktif'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {enabled
                        ? 'Notifikasi akan dikirim ke target channel setiap ada pesanan selesai.'
                        : 'Pengiriman notifikasi ke channel dinonaktifkan.'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Category Toggles */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Kategori Transaksi:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={<Switch checked={product} onChange={(e) => setProduct(e.target.checked)} />}
                    label={<Typography variant="body2" fontWeight={600}>Produk Digital</Typography>}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={<Switch checked={ppob} onChange={(e) => setPpob(e.target.checked)} />}
                    label={<Typography variant="body2" fontWeight={600}>PPOB</Typography>}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={<Switch checked={smm} onChange={(e) => setSmm(e.target.checked)} />}
                    label={<Typography variant="body2" fontWeight={600}>SMM</Typography>}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Target Channel Input */}
            <Box>
              <TextField
                label="Contoh: @usernameChannel atau id channel: -123456788"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="@namachannel, -100123456789"
                helperText="Maksimal 3 channel, dipisahkan dengan koma. Pastikan bot menjadi admin di channel terkait."
                error={targetsCount > 3}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        variant="caption"
                        color={targetsCount > 3 ? 'error.main' : 'text.secondary'}
                        fontWeight={700}
                      >
                        {targetsCount}/3
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
              {targetsCount > 3 && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
                  Maksimal 3 channel target.
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Template Editor */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Template Pesan Telegram (HTML)
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<Restore fontSize="small" />}
                  onClick={() => setTemplate(DEFAULT_TELE_CHANNEL_TEMPLATE)}
                  sx={{ textTransform: 'none', fontSize: 12 }}
                >
                  Reset Template
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Format: <code>&lt;b&gt;tebal&lt;/b&gt;</code>, <code>&lt;i&gt;miring&lt;/i&gt;</code>, <code>&lt;code&gt;mono&lt;/code&gt;</code>, dan <code>[IF_KEY]...[/IF_KEY]</code>.
              </Typography>

              <TextField
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                fullWidth
                multiline
                rows={9}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: 13,
                  },
                }}
              />

              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                  Variabel yang tersedia:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {[
                    'ORDER_TYPE',
                    'PRODUCT_TITLE',
                    'PRODUCT_DETAIL',
                    'QTY',
                    'PRICE',
                    'TOTAL',
                    'USERNAME',
                    'TARGET',
                    'SN',
                    'SELLER_NOTE',
                    'TIME',
                    'BOT_USERNAME',
                    'REFF_ID',
                    'BUYER_ID',
                    'PLATFORM',
                    'SISA_CREDIT',
                  ].map((v) => (
                    <Chip
                      key={v}
                      label={`{{${v}}}`}
                      size="small"
                      onClick={() => insertVariable(v)}
                      clickable
                      sx={{ fontFamily: 'monospace', fontSize: 11 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleTestSend}
                disabled={testing || !target.trim()}
                startIcon={testing ? <CircularProgress size={16} /> : <Send />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Test Kirim
              </Button>

              <Button
                variant="contained"
                onClick={handleSaveConfig}
                disabled={saving || targetsCount > 3}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                Simpan
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
