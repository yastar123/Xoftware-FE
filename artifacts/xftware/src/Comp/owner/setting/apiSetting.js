import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton,
  Card, CardContent, Stack, Tooltip, Typography, alpha,
  TextField, InputAdornment, Paper,
} from '@mui/material';
import {
  VpnKey, Visibility, VisibilityOff, ContentCopy, Refresh,
  Add, Delete, Language, History, Security, Info
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import Config from '@/config';
import { HiOutlineExternalLink } from 'react-icons/hi';

function safeStr(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function parseIps(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }
  return [];
}

export default function ApiSettingPage() {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [ips, setIps] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingIp, setIsAddingIp] = useState(false);
  const [deletingIp, setDeletingIp] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getApikey' });
      if (!res?.error) {
        setApiKey(safeStr(res?.data?.api_key));
        setIps(parseIps(res?.data?.whitelisted_ips));
      } else {
        toast.error(res?.message || 'Gagal mengambil data API');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text, msg = 'Berhasil disalin') => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const generateNewKey = async () => {
    if (!window.confirm('PERINGATAN: Membuat API Key baru akan membatalkan key yang lama seketika. Lanjutkan?')) return;
    setIsGenerating(true);
    try {
      const res = await reqOwner({ action: 'generateApikey' });
      if (!res?.error) {
        setApiKey(safeStr(res?.data?.api_key));
        toast.success('API Key baru berhasil dibuat');
      } else {
        toast.error(res?.message || 'Gagal membuat API Key');
      }
    } catch {
      toast.error('Gagal memproses permintaan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddIp = async (customIp) => {
    const ipTrim = (typeof customIp === 'string' ? customIp : newIp).trim();
    if (!ipTrim) return;
    setIsAddingIp(true);
    try {
      const res = await reqOwner({ action: 'whitelistIp', ip: ipTrim, method: 'add' });
      if (!res?.error) {
        setIps(parseIps(res?.data?.whitelisted_ips));
        setNewIp('');
        toast.success(ipTrim === '*' ? 'Wildcard (*) berhasil ditambahkan' : 'IP berhasil ditambahkan');
      } else {
        toast.error(res?.message || 'Gagal menambahkan IP');
      }
    } catch {
      toast.error('Gagal menambahkan IP');
    } finally {
      setIsAddingIp(false);
    }
  };

  const handleRemoveIp = async (ip) => {
    setDeletingIp(ip);
    try {
      const res = await reqOwner({ action: 'whitelistIp', ip, method: 'remove' });
      if (!res?.error) {
        setIps(parseIps(res?.data?.whitelisted_ips));
        toast.success('IP berhasil dihapus');
      } else {
        toast.error(res?.message || 'Gagal menghapus IP');
      }
    } catch {
      toast.error('Gagal memproses penghapusan');
    } finally {
      setDeletingIp(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
            <VpnKey sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Manajemen API</Typography>
            <Typography variant="caption" color="text.secondary">Kelola akses kunci API dan batasan IP untuk integrasi eksternal</Typography>
          </Box>
        </Stack>

        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            borderRadius: 3,
            bgcolor: alpha('#6366f1', 0.05),
            color: 'primary.main',
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.1),
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography variant="body2" fontWeight={600}>
              Butuh bantuan integrasi? Pelajari selengkapnya di dokumentasi kami.
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={() => window.open(Config.docLink, '_blank')}
              endIcon={<HiOutlineExternalLink />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2, boxShadow: 'none' }}
            >
              Dokumentasi
            </Button>
          </Stack>
        </Alert>

        {/* API Key Section */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Security sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={700}>API Access Key</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Gunakan kunci ini untuk mengautentikasi permintaan dari server atau bot pihak ketiga Anda.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={apiKey || ''}
                  type={showKey ? 'text' : 'password'}
                  InputProps={{
                    readOnly: true,
                    sx: { borderRadius: 2, fontFamily: 'monospace', bgcolor: alpha('#000', 0.02) },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowKey(!showKey)}>
                          {showKey ? <VisibilityOff size={18} /> : <Visibility size={18} />}
                        </IconButton>
                        <Tooltip title="Salin Key">
                          <IconButton size="small" onClick={() => handleCopy(apiKey)}>
                            <ContentCopy sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={isGenerating ? <CircularProgress size={14} color="inherit" /> : <Refresh sx={{ fontSize: 18 }} />}
                  onClick={generateNewKey}
                  disabled={isGenerating}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Regenerate Key
                </Button>
              </Box>

              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Jangan berikan API Key Anda kepada siapapun. Siapapun yang memiliki key ini dapat mengakses fungsionalitas admin Anda.
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* IP Whitelist Section */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Language sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight={700}>IP Whitelist</Typography>
                </Stack>
                <Chip label={`${ips.length} IP`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Batasi akses API hanya dari alamat IP yang Anda percayai. Jika daftar kosong, API dapat diakses dari IP manapun (tidak disarankan).
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Contoh: 1.2.3.4, 27.124.*.*, atau * (semua IP)"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIp()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Button
                  variant="contained"
                  startIcon={isAddingIp ? <CircularProgress size={14} color="inherit" /> : <Add />}
                  onClick={() => handleAddIp()}
                  disabled={isAddingIp || !newIp.trim()}
                  sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}
                >
                  Tambah
                </Button>
              </Box>

              {/* Opsi Cepat Preset */}
              {!ips.includes('*') && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">Opsi Cepat:</Typography>
                  <Chip
                    label="+ Izinkan Semua IP (*)"
                    size="small"
                    clickable
                    color="primary"
                    variant="outlined"
                    disabled={isAddingIp}
                    onClick={() => handleAddIp('*')}
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </Stack>
              )}

              <Divider />

              {ips.length === 0 ? (
                <Box sx={{ py: 3, px: 2, textAlign: 'center', bgcolor: alpha('#6366f1', 0.03), borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Belum ada IP yang didaftarkan.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Mode Bebas Aktif: API saat ini dapat diakses dari alamat IP manapun.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {ips.map((ip) => (
                    <Paper
                      key={ip}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: alpha('#6366f1', 0.02), borderColor: alpha('#6366f1', 0.2) },
                        transition: 'all 0.2s'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: (ip === '*' || ip === '0.0.0.0/0') ? alpha('#2e7d32', 0.1) : alpha('#6366f1', 0.1), color: (ip === '*' || ip === '0.0.0.0/0') ? '#2e7d32' : '#6366f1' }}>
                          <Language sx={{ fontSize: 16 }} />
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{ip}</Typography>
                          {(ip === '*' || ip === '0.0.0.0/0') && (
                            <Chip
                              label="Semua IP (Wildcard)"
                              size="small"
                              color="success"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          )}
                          {ip.includes('*') && ip !== '*' && (
                            <Chip
                              label="Subnet Wildcard"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          )}
                          {ip.includes('/') && (
                            <Chip
                              label="Subnet CIDR"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          )}
                        </Stack>
                      </Stack>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveIp(ip)}
                        disabled={deletingIp === ip}
                        sx={{ bgcolor: alpha('#d32f2f', 0.05), '&:hover': { bgcolor: alpha('#d32f2f', 0.1) } }}
                      >
                        {deletingIp === ip ? <CircularProgress size={16} color="inherit" /> : <Delete sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Alert Panduan Format IP & Wildcard */}
              <Alert
                severity="info"
                icon={<Info fontSize="small" />}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : '#f0f4ff',
                  color: (theme) => theme.palette.mode === 'dark' ? '#c7d2fe' : '#312e81',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.25)' : '#c7d2fe',
                  '& .MuiAlert-icon': {
                    color: '#6366f1',
                  },
                }}
              >
                <Typography variant="caption" component="div" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.84rem' }}>
                  Panduan Format IP & Wildcard:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <strong>IP Tunggal:</strong> Masukkan alamat IP spesifik server Anda (contoh: <code>27.124.95.119</code>).
                  </li>
                  <li>
                    <strong>Subnet Wildcard:</strong> Gunakan tanda bintang untuk rentang IP (contoh: <code>27.124.*.*</code> atau <code>192.168.1.*</code>) atau format CIDR (contoh: <code>27.124.95.0/24</code>).
                  </li>
                  <li>
                    <strong>Akses Bebas (Non-Whitelist):</strong> Masukkan tanda <code>*</code> atau biarkan daftar kosong untuk mengizinkan permintaan dari alamat IP manapun.
                  </li>
                </ul>
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </motion.div>
  );
}
