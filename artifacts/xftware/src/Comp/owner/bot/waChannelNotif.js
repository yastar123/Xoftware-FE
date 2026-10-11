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
  Chip,
  Divider,
} from '@mui/material';
import {
  Save,
  Send,
  NotificationsActive,
  WarningAmber,
  Restore,
} from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

const DEFAULT_WA_TEMPLATE = `*🔔 PESANAN BERHASIL DIPROSES! 🔔*
_{{ORDER_TYPE}} — {{PRODUCT_TITLE}}_

• *Reff ID:* \`{{REFF_ID}}\`
• *Produk:* {{PRODUCT_TITLE}}
[IF_PRODUCT_DETAIL]• *Detail:* {{PRODUCT_DETAIL}}
[/IF_PRODUCT_DETAIL]• *Jumlah:* {{QTY}} item
• *Total Bayar:* {{TOTAL}}
[IF_TARGET]• *Tujuan:* \`{{TARGET}}\`
[/IF_TARGET][IF_SN]• *SN:* \`{{SN}}\`
[/IF_SN][IF_SELLER_NOTE]• *Catatan:* {{SELLER_NOTE}}
[/IF_SELLER_NOTE]• *Waktu:* {{TIME}}

Terima kasih telah berbelanja!`;

export default function WaChannelNotifPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Config State
  const [enabled, setEnabled] = useState(false);
  const [product, setProduct] = useState(true);
  const [ppob, setPpob] = useState(true);
  const [smm, setSmm] = useState(true);
  const [target, setTarget] = useState('');
  const [template, setTemplate] = useState(DEFAULT_WA_TEMPLATE);
  const [credit, setCredit] = useState(0);

  const fetchBotInfo = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getInformationBot' });
      if (!res.error && res.data) {
        setEnabled(!!res.data.waChannelNotifEnabled);
        setProduct(res.data.waChannelNotifProduct !== undefined ? !!res.data.waChannelNotifProduct : true);
        setPpob(res.data.waChannelNotifPpob !== undefined ? !!res.data.waChannelNotifPpob : true);
        setSmm(res.data.waChannelNotifSmm !== undefined ? !!res.data.waChannelNotifSmm : true);
        setTarget(res.data.waChannelNotifTarget || '');
        setCredit(Number(res.data.channelNotifCredit || 0));
        if (res.data.waChannelNotifTemplate) {
          setTemplate(res.data.waChannelNotifTemplate);
        }
      }
    } catch {
      toast.error('Gagal memuat pengaturan notifikasi saluran WhatsApp');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBotInfo();
  }, []);

  const handleSaveConfig = async () => {
    const targets = target
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (targets.length > 3) {
      return toast.warning('Maksimal 3 target.');
    }

    setSaving(true);
    try {
      const res = await reqOwner({
        action: 'updateWaChannelNotifConfig',
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
      return toast.warning('Tentukan target saluran atau grup WhatsApp terlebih dahulu');
    }
    if (credit <= 0) {
      return toast.warning('Credit habis. Silakan isi credit di Informasi Layanan.');
    }

    setTesting(true);
    try {
      const res = await reqOwner({ action: 'testWaChannelNotif' });
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

  const insertVariable = (varName) => {
    setTemplate((prev) => `${prev} {{${varName}}}`);
  };

  const targetsCount = target
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Memuat pengaturan notifikasi WhatsApp...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Notifikasi Saluran & Grup WhatsApp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pengaturan notifikasi pesanan otomatis ke saluran atau grup WhatsApp.
        </Typography>
      </Box>

      {/* Anti-Ban & Compliance Banner */}
      <Alert
        severity="warning"
        icon={<WarningAmber fontSize="inherit" />}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#f59e0b', 0.3),
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
          Perhatian Risiko Banned WhatsApp
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>
          • Gunakan <b>Saluran (Channel)</b> agar lebih aman dari laporan spam dan risiko nomor terblokir.
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>
          • Nomor bot <b>wajib jadi Admin</b> di saluran/grup target agar pesan terkirim.
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
          • Ada jeda otomatis 2-3 detik per target untuk membatasi frekuensi kirim.
        </Typography>
      </Alert>

      {/* Credit Status Card */}
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
                  bgcolor: alpha('#25d366', 0.1),
                  color: '#16a34a',
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
              1 credit terpakai per pesan sukses (shared dengan Telegram). Isi credit di <b>Informasi Layanan</b>.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Main Configuration Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
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
                      {enabled ? 'Notifikasi Aktif' : 'Notifikasi Nonaktif'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {enabled
                        ? 'Notifikasi otomatis dikirim ke target saat pesanan selesai.'
                        : 'Notifikasi otomatis dinonaktifkan.'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Category Toggles */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Kategori Notifikasi:
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

            <Divider />

            {/* Target Channel/Group Input */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Target Saluran / Grup
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Bisa masukkan JID (<code>@newsletter</code> / <code>@g.us</code>) atau tempel link saluran/grup langsung (auto-resolve).
              </Typography>
              <TextField
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="https://whatsapp.com/channel/0029VaXXXXX, 120363023456789012@g.us"
                helperText="Maksimal 3 target, pisahkan dengan koma jika lebih dari satu."
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
                  Maksimal 3 target saluran atau grup.
                </Alert>
              )}

              {/* Guide on how to find JID using WhatsApp Bot commands */}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha('#6366f1', 0.04),
                  border: '1px dashed',
                  borderColor: alpha('#6366f1', 0.2),
                }}
              >
                <Typography variant="caption" fontWeight={700} color="primary.main" display="block" sx={{ mb: 0.5 }}>
                  Bantuan Perintah Bot (WhatsApp)
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
                  • Cek JID grup: ketik <code>#cekid</code> di dalam grup.<br />
                  • Cek JID saluran: kirim <code>#cekid link_saluran</code> ke bot.<br />
                  • Atur target lewat chat: <code>#setnotif target link_atau_jid</code>
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Template Editor */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Template Pesan WhatsApp (Markdown)
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<Restore fontSize="small" />}
                  onClick={() => setTemplate(DEFAULT_WA_TEMPLATE)}
                  sx={{ textTransform: 'none', fontSize: 12 }}
                >
                  Reset Template
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Format: <code>*bold*</code>, <code>_italic_</code>, <code>~strike~</code>, <code>```mono```</code>, dan <code>[IF_KEY]...[/IF_KEY]</code>.
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
                    'ORDER_ID',
                    'PRODUK',
                    'HARGA',
                    'PRICE',
                    'KATEGORI',
                    'QTY',
                    'USERNAME',
                    'PEMBELI',
                    'STATUS',
                    'TANGGAL',
                    'TARGET',
                    'SN',
                    'NOTE',
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
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
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
