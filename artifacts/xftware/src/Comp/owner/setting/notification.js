import React, { useEffect, useMemo, useState } from 'react';
import { FaCopy, FaEdit, FaExternalLinkAlt, FaLink, FaSyncAlt, FaTelegramPlane, FaTrash, FaUser, FaCheck, FaTimes } from 'react-icons/fa';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton,
  Card, CardContent, Stack, Tooltip, Typography, alpha,
  FormControlLabel, Switch, Grid, TextField as MuiTextField,
  Collapse
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { Check, Close } from '@mui/icons-material';

function safeStr(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function formatDateTimeID(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeStr(value);
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function isAnyActive(row) {
  return !!(row?.buyproduk || row?.buysmm || row?.buyppob || row?.saldosmm || row?.saldoppob || row?.reseller_product_update);
}

async function copyText(text, okMsg = 'Disalin') {
  try {
    await navigator.clipboard.writeText(String(text ?? ''));
    toast.success(okMsg);
    return true;
  } catch {
    toast.error('Gagal menyalin');
    return false;
  }
}

function OnOffChip({ label, active, extra = '' }) {
  return (
    <Chip
      size="small"
      label={`${label}: ${active ? 'ON' : 'OFF'}${extra ? ` ${extra}` : ''}`}
      variant="outlined"
      color={active ? 'success' : 'default'}
      sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 500 }}
    />
  );
}

export default function OwnerTelegramNotificationPage() {
  const BOT_USERNAME = 'noreplyXoftwareBOT';
  const [loadingList, setLoadingList] = useState(true);
  const [creatingToken, setCreatingToken] = useState(true);
  const [token, setToken] = useState('');
  const [items, setItems] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  
  // Inline edit & delete state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [updating, setUpdating] = useState(false);
  
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEditClick = (row) => {
    if (editingId === row.id) {
      setEditingId(null);
      return;
    }
    setEditingId(row.id);
    setEditData({
      id: row.id,
      buyproduk: !!row.buyproduk,
      buysmm: !!row.buysmm,
      buyppob: !!row.buyppob,
      saldosmm: !!row.saldosmm,
      saldoppob: !!row.saldoppob,
      saldoreseller: !!row.saldoreseller,
      saldosmm_limit: row.saldosmm_limit || 0,
      saldoppob_limit: row.saldoppob_limit || 0,
      saldoreseller_limit: row.saldoreseller_limit || 0,
      reseller_product_update: !!row.reseller_product_update,
    });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await reqOwner({ action: 'updateTeleNotification', ...editData });
      if (!res?.error) {
        toast.success('Pengaturan diperbarui');
        setEditingId(null);
        await fetchList({ silent: true });
      } else {
        toast.error(res?.message || 'Gagal memperbarui');
      }
    } catch {
      toast.error('Gagal memperbarui');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await reqOwner({ action: 'delTeleNotification', id });
      if (!res?.error) {
        toast.success('Berhasil dihapus');
        await fetchList({ silent: true });
      } else {
        setErrMsg(res?.message || 'Gagal menghapus notification');
      }
    } catch {
      setErrMsg('Gagal menghapus');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const deepLink = useMemo(() => {
    const t = safeStr(token).trim();
    if (!t) return `https://t.me/${BOT_USERNAME}`;
    return `https://t.me/${BOT_USERNAME}?start=`;
  }, [token]);

  const prettyToken = useMemo(() => {
    const t = safeStr(token).trim();
    if (!t) return '';
    if (t.length <= 20) return t;
    return `${t.slice(0, 10)}…${t.slice(-6)}`;
  }, [token]);

  const fetchList = async (opts = {}) => {
    if (!opts?.silent) setErrMsg('');
    setLoadingList(true);
    try {
      const res = await reqOwner({ action: 'getTeleNotifications', status: 'connected' });
      if (!res?.error) {
        const data = res?.data || res || [];
        setItems(Array.isArray(data) ? data : []);
      } else {
        setErrMsg(res?.message || 'Gagal mengambil data Telegram notification');
      }
    } catch (e) {
      setErrMsg(`Gagal mengambil data: ${String(e)}`);
    } finally {
      setLoadingList(false);
    }
  };

  const createToken = async () => {
    setCreatingToken(true);
    setErrMsg('');
    try {
      const res = await reqOwner({ action: 'requestConnectTeleNotification' });
      if (!res?.error) {
        const data = res?.data || {};
        setToken(safeStr(data?.token));
      } else {
        setErrMsg(res?.message || 'Gagal membuat token');
      }
    } catch (e) {
      setErrMsg(`Gagal membuat token: ${String(e)}`);
    } finally {
      setCreatingToken(false);
    }
  };

  useEffect(() => {
    (async () => { await Promise.all([createToken(), fetchList({ silent: true })]); })();
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', maxWidth: 960 }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha('#229ED9', 0.08), color: '#229ED9', display: 'grid', placeItems: 'center' }}>
            <FaTelegramPlane size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>Telegram Notification</Typography>
            <Typography variant="body2" color="text.secondary">Kelola token koneksi dan filter notifikasi dari bot.</Typography>
          </Box>
        </Stack>

        <AnimatePresence>
          {errMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{errMsg}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Sisi Kiri: Token & Cara Connect */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ borderRadius: 4, position: 'sticky', top: 16 }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaTelegramPlane color="#229ED9" />
                  Connect Telegram
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={700}>Token:</Typography>
                  <Box sx={{ flex: 1, px: 1.5, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                    {creatingToken ? 'Loading…' : token ? prettyToken : '-'}
                  </Box>
                </Stack>

                <Stack direction="column" spacing={1.5}>
                  <Button variant="contained" disabled={!token} onClick={() => window.open(deepLink, '_blank', 'noreferrer')} endIcon={<FaExternalLinkAlt size={12} />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1, bgcolor: '#229ED9', '&:hover': { bgcolor: alpha('#229ED9', 0.8) } }}>
                    Buka Bot Telegram
                  </Button>
                  <Stack direction="row" spacing={1.5}>
                    <Button fullWidth size="small" variant="outlined" onClick={createToken} disabled={creatingToken} startIcon={creatingToken ? <CircularProgress size={14} /> : <FaSyncAlt size={12} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>
                      Refresh Token
                    </Button>
                    <Button fullWidth size="small" variant="outlined" disabled={!token} onClick={() => copyText(token, 'Token disalin')} startIcon={<FaCopy size={12} />} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>
                      Copy Token
                    </Button>
                  </Stack>
                </Stack>

                <Alert severity="info" sx={{ borderRadius: 2, py: 1, '& .MuiAlert-message': { p: 0 } }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>Cara connect:</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: 13 }}>
                    1) Klik tombol <b>Buka Bot Telegram</b>.<br />
                    2) Di Telegram, klik <b>Start</b> lalu paste token Anda.<br />
                    3) Akun Anda akan muncul di daftar kanan.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Sisi Kanan: Daftar User */}
          <Grid item xs={12} md={7}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>User Terhubung</Typography>
              <Chip label={`${items.length} user`} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 700 }} />
            </Stack>

            {loadingList ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : items.length === 0 ? (
              <Card variant="outlined" sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
                <FaUser size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                <Typography color="text.secondary">Belum ada user Telegram yang terkoneksi.</Typography>
              </Card>
            ) : (
              <AnimatePresence>
                <Stack spacing={2}>
                  {items.map(row => {
                    const active = isAnyActive(row);
                    const saldoSmmLimit = row?.saldosmm_limit == null ? '-' : safeStr(row.saldosmm_limit);
                    const saldoPpobLimit = row?.saldoppob_limit == null ? '-' : safeStr(row.saldoppob_limit);
                    const saldoResellerLimit = row?.saldoreseller_limit == null ? '-' : safeStr(row.saldoreseller_limit);
                    const isEditing = editingId === row.id;
                    const isDeleting = deletingId === row.id;

                    return (
                      <motion.div key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                        <Card variant="outlined" sx={{ borderRadius: 4, transition: 'all 0.2s', borderColor: isEditing ? '#6366f1' : 'divider', boxShadow: isEditing ? '0 8px 24px -4px rgba(99,102,241,0.15)' : 'none' }}>
                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Stack spacing={{ xs: 1.5, md: 2 }}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#229ED9', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaUser size={12} color="#229ED9" />
                                  </Box>
                                  <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>{safeStr(row.userid)}</Typography>
                                  <Chip size="small" label={active ? 'ON' : 'OFF'} variant="outlined" color={active ? 'success' : 'default'} sx={{ borderRadius: 1.5, fontWeight: 700, ml: 1, height: 22 }} />
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {!isDeleting && (
                                    <Tooltip title={isEditing ? 'Tutup Edit' : 'Edit Notifikasi'}>
                                      <IconButton
                                        onClick={() => handleEditClick(row)}
                                        size="small"
                                        sx={{ 
                                          border: '1px solid', borderColor: isEditing ? '#6366f1' : 'divider', 
                                          borderRadius: 2, color: isEditing ? '#6366f1' : 'primary.main', 
                                          bgcolor: isEditing ? alpha('#6366f1', 0.1) : alpha('#1976d2', 0.04), 
                                          '&:hover': { bgcolor: alpha('#1976d2', 0.1) } 
                                        }}
                                      >
                                        <FaEdit size={12} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  
                                  <Collapse in={!isEditing} orientation="horizontal">
                                    {isDeleting ? (
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Button size="small" color="inherit" onClick={() => setDeletingId(null)} sx={{ minWidth: 0, px: 1, borderRadius: 2 }}><Close sx={{ fontSize: 16 }} /></Button>
                                        <Button 
                                          size="small" variant="contained" color="error" 
                                          onClick={() => handleDelete(row.id)} 
                                          disabled={deleting}
                                          sx={{ borderRadius: 2, textTransform: 'none', px: 1.5, py: 0.5, minWidth: 80 }}
                                        >
                                          {deleting ? <CircularProgress size={14} color="inherit" /> : 'Hapus'}
                                        </Button>
                                      </Stack>
                                    ) : (
                                      <Tooltip title="Hapus User">
                                        <IconButton
                                          onClick={() => setDeletingId(row.id)}
                                          size="small"
                                          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, color: 'error.main', bgcolor: alpha('#d32f2f', 0.04), '&:hover': { bgcolor: alpha('#d32f2f', 0.1) } }}
                                        >
                                          <FaTrash size={12} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Collapse>
                                </Stack>
                              </Stack>
                              
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <OnOffChip label="Produk" active={!!row.buyproduk} />
                                <OnOffChip label="SMM" active={!!row.buysmm} />
                                <OnOffChip label="PPOB" active={!!row.buyppob} />
                                <OnOffChip label="Saldo SMM" active={!!row.saldosmm} extra={`(≤ ${saldoSmmLimit})`} />
                                <OnOffChip label="Saldo PPOB" active={!!row.saldoppob} extra={`(≤ ${saldoPpobLimit})`} />
                                <OnOffChip label="Saldo Reseller" active={!!row.saldoreseller} extra={`(≤ ${saldoResellerLimit})`} />
                                <OnOffChip label="Update Produk Reseller" active={!!row.reseller_product_update} />
                              </Stack>
                              
                              <Collapse in={isEditing}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ p: 2, bgcolor: alpha('#6366f1', 0.03), borderRadius: 3, border: '1px solid', borderColor: alpha('#6366f1', 0.1) }}>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: '#6366f1' }}>Event Transaksi</Typography>
                                      <Stack spacing={0.5}>
                                        <FormControlLabel control={<Switch size="small" checked={!!editData.buyproduk} onChange={(e) => setEditData({ ...editData, buyproduk: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Produk Manual</Typography>} />
                                        <FormControlLabel control={<Switch size="small" checked={!!editData.buysmm} onChange={(e) => setEditData({ ...editData, buysmm: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Produk SMM</Typography>} />
                                        <FormControlLabel control={<Switch size="small" checked={!!editData.buyppob} onChange={(e) => setEditData({ ...editData, buyppob: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Produk PPOB</Typography>} />
                                        <FormControlLabel control={<Switch size="small" checked={!!editData.reseller_product_update} onChange={(e) => setEditData({ ...editData, reseller_product_update: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Update Produk Reseller</Typography>} />
                                      </Stack>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: '#6366f1' }}>Notifikasi Saldo Rendah</Typography>
                                      <Stack spacing={2}>
                                        <Box>
                                          <FormControlLabel control={<Switch size="small" checked={!!editData.saldosmm} onChange={(e) => setEditData({ ...editData, saldosmm: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Saldo SMM Rendah</Typography>} />
                                          <MuiTextField 
                                            fullWidth size="small" label="Limit Saldo SMM" type="number" 
                                            value={editData.saldosmm_limit || 0} 
                                            onChange={(e) => setEditData({ ...editData, saldosmm_limit: e.target.value })}
                                            disabled={!editData.saldosmm}
                                            sx={{ mt: 1, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
                                          />
                                        </Box>
                                        <Box>
                                          <FormControlLabel control={<Switch size="small" checked={!!editData.saldoppob} onChange={(e) => setEditData({ ...editData, saldoppob: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Saldo PPOB Rendah</Typography>} />
                                          <MuiTextField 
                                            fullWidth size="small" label="Limit Saldo PPOB" type="number" 
                                            value={editData.saldoppob_limit || 0} 
                                            onChange={(e) => setEditData({ ...editData, saldoppob_limit: e.target.value })}
                                            disabled={!editData.saldoppob}
                                            sx={{ mt: 1, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
                                          />
                                        </Box>
                                        <Box>
                                          <FormControlLabel control={<Switch size="small" checked={!!editData.saldoreseller} onChange={(e) => setEditData({ ...editData, saldoreseller: e.target.checked })} />} label={<Typography variant="body2" fontWeight={500}>Saldo Reseller Rendah</Typography>} />
                                          <MuiTextField 
                                            fullWidth size="small" label="Limit Saldo Reseller" type="number" 
                                            value={editData.saldoreseller_limit || 0} 
                                            onChange={(e) => setEditData({ ...editData, saldoreseller_limit: e.target.value })}
                                            disabled={!editData.saldoreseller}
                                            sx={{ mt: 1, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
                                          />
                                        </Box>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1, flexWrap: 'wrap' }}>
                                    <Button onClick={() => setEditingId(null)} disabled={updating} size="small" sx={{ borderRadius: 2, textTransform: 'none', px: { xs: 1, md: 2 } }}>Batal</Button>
                                    <Button onClick={handleUpdate} variant="contained" disabled={updating} size="small" sx={{ borderRadius: 2, textTransform: 'none', px: { xs: 2, md: 3 }, fontWeight: 700 }} startIcon={updating ? <CircularProgress size={14} color="inherit" /> : null}>Simpan Perubahan</Button>
                                  </Box>
                                </Box>
                              </Collapse>
                            </Stack>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </Stack>
              </AnimatePresence>
            )}
          </Grid>
        </Grid>
      </Stack>
      </Box>
    </Box>
  );
}