import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  CircularProgress, Divider, Chip, Pagination, Collapse, Button,
  Tooltip, Alert, alpha,
} from '@mui/material';
import { Add, Delete, Edit, Refresh, ExpandMore, ExpandLess, Image as ImageIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { renderWhatsappText } from '@/lib/renderFormatWhatsApp';
import { toast } from 'react-toastify';

const MotionCard = motion(Card);

function formatDateTimeID(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getSnippet(text, maxChars = 120) {
  const t = (text || '').toString().trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars).trimEnd() + '…';
}

async function fileToBase64Pure(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  const s = String(dataUrl || '');
  const pure = s.includes(',') ? s.split(',')[1] : s;
  return { dataUrl: s, pureBase64: pure };
}

function ConfirmDialog({ open, title, message, confirmText = 'Hapus', confirmColor = 'error', onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <Delete color="error" fontSize="small" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
        <Button
          onClick={onConfirm} color={confirmColor} variant="contained"
          disabled={loading} size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Delete sx={{ fontSize: 14 }} />}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function OwnerAnnouncementPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [q, setQ] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', text: '', media_base64: '', media_preview: '', remove_media: false });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const toggleExpanded = id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setForm({ id: null, title: '', text: '', media_base64: '', media_preview: '', remove_media: false });
    setIsEdit(false);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = row => {
    setForm({
      id: row.id, title: row.title || '', text: row.text || '',
      media_base64: '', media_preview: row.media ? row.media : '', remove_media: false,
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const fetchAnnouncements = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    setLoading(true);
    const res = await reqOwner({ action: 'getAllOwnerAnnouncements', page: nextPage, limit: 10, q: debouncedQ?.trim() });
    if (!res?.error) {
      const data = res?.data || res || {};
      const it = data.items || data || [];
      setItems(Array.isArray(it) ? it : []);
      setPage(data.page || nextPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems ?? (Array.isArray(it) ? it.length : 0));
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAnnouncements({ page: 1 }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAnnouncements({ page: 1 }); }, [debouncedQ]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (debouncedQ?.trim()) chips.push({ key: 'q', label: `Search: "${debouncedQ.trim()}"` });
    chips.push({ key: 'total', label: `Total: ${totalItems}` });
    return chips;
  }, [debouncedQ, totalItems]);

  const onPickMedia = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 1.1 * 1024 * 1024) { toast.error('Ukuran file terlalu besar. Maks 1.1MB.'); return; }
    try {
      const { dataUrl, pureBase64 } = await fileToBase64Pure(file);
      setForm(s => ({ ...s, media_base64: pureBase64, media_preview: dataUrl, remove_media: false }));
    } catch { toast.error('Gagal memproses media'); }
  };

  const submitForm = async () => {
    const title = (form.title ?? '').toString().trim();
    const text = (form.text ?? '').toString().trim();
    if (!title) return toast.error('Title wajib diisi');
    if (!text) return toast.error('Text wajib diisi');
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        if (!form.id) return toast.error('ID announcement tidak valid');
        const payload = { action: 'editOwnerAnnouncement', id: form.id, title, text };
        if (form.media_base64) payload.media_base64 = form.media_base64;
        if (form.remove_media === true) payload.remove_media = true;
        res = await reqOwner(payload);
      } else {
        const payload = { action: 'createOwnerAnnouncement', title, text };
        if (form.media_base64) payload.media_base64 = form.media_base64;
        res = await reqOwner(payload);
      }
      if (!res?.error) {
        toast.success(res?.message || 'Pengumuman berhasil disimpan');
        setDialogOpen(false);
        resetForm();
        fetchAnnouncements({ page: 1 });
      } else {
        toast.error(res?.message || 'Gagal menyimpan announcement');
      }
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await reqOwner({ action: 'deleteOwnerAnnouncement', id: deleteTarget.id });
      if (!res?.error) {
        toast.success(res?.message || 'Pengumuman berhasil dihapus');
        setDeleteOpen(false);
        setDeleteTarget(null);
        const willEmpty = items.length === 1 && page > 1;
        fetchAnnouncements({ page: willEmpty ? page - 1 : page });
      } else {
        toast.error(res?.message || 'Gagal menghapus announcement');
      }
    } finally { setDeleting(false); }
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Management Pengumuman</Typography>
            <Typography variant="caption" color="text.secondary">Pengumuman akan ditampilkan di halaman website.</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchAnnouncements({ page })} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tambah Pengumuman">
              <IconButton onClick={openCreate} sx={{ borderRadius: 2, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' } }}>
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <Card sx={{ borderRadius: 3, mb: 2.5 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <TextField label="Cari judul" value={q} onChange={e => setQ(e.target.value)} size="small" fullWidth />
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button variant="contained" size="small" onClick={() => fetchAnnouncements({ page: 1 })} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Apply</Button>
                  <Button variant="text" size="small" onClick={() => { setQ(''); setTimeout(() => fetchAnnouncements({ page: 1 }), 0); }} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Reset</Button>
                </Stack>
              </Stack>
              <Divider />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                {activeChips.map(c => <Chip key={c.key} label={c.label} variant="outlined" size="small" />)}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          <Stack spacing={1.5}>
            {items.map((row, i) => {
              const isExpanded = expandedIds.has(row.id);
              return (
                <MotionCard
                  key={row.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3) }}
                  sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', transition: 'all 0.2s', '&:hover': {} }}
                >
                  <CardContent
                    onClick={() => toggleExpanded(row.id)}
                    sx={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{row.title || '-'}</Typography>
                        <Chip size="small" label={`Read: ${Number(row.total_read || row.read_count || 0)}`} variant="outlined" sx={{ ml: 0.5, fontSize: 11 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>{formatDateTimeID(row.createdAt)}</Typography>
                      </Stack>
                      {!isExpanded && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{getSnippet(row.text, 140)}</Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); toggleExpanded(row.id); }}
                          sx={{ bgcolor: alpha('#000', 0.04), '&:hover': { bgcolor: alpha('#000', 0.08) }, transition: 'all 0.2s' }}
                        >
                          {isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); openEdit(row); }}
                          sx={{ color: '#6366f1', bgcolor: alpha('#6366f1', 0.08), '&:hover': { bgcolor: alpha('#6366f1', 0.15) }, transition: 'all 0.2s' }}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); setDeleteTarget(row); setDeleteOpen(true); }}
                          sx={{ color: 'error.main', bgcolor: alpha('#ef4444', 0.08), '&:hover': { bgcolor: alpha('#ef4444', 0.15) }, transition: 'all 0.2s' }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider />
                    <CardContent sx={{ pt: 2 }}>
                      {row.media && (
                        <Box sx={{ mb: 1.5, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={row.media} alt="announcement-media" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                        </Box>
                      )}
                      <Typography variant="body2" component="div" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', color: 'text.primary', fontSize: 14, lineHeight: 1.6 }}>
                        {renderWhatsappText(row.text || '-')}
                      </Typography>
                    </CardContent>
                  </Collapse>
                </MotionCard>
              );
            })}
            {items.length === 0 && (
              <Card variant="outlined" sx={{ borderRadius: 3, py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 40, color: 'text.disabled', mb: 0.5 }}>📢</Typography>
                <Typography color="text.disabled">Tidak ada pengumuman.</Typography>
              </Card>
            )}
          </Stack>
          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" mt={3}>
              <Pagination page={page} count={Math.max(1, totalPages)} onChange={(_, p) => fetchAnnouncements({ page: p })} color="primary" shape="rounded" size="small" showFirstButton showLastButton />
            </Stack>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => { setDialogOpen(false); resetForm(); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth size="small" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
            <TextField label="Content" fullWidth multiline minRows={5} size="small" value={form.text} onChange={e => setForm(s => ({ ...s, text: e.target.value }))} />
            <Divider />
            <Stack direction="row" spacing={1} alignItems="center">
              <input id="owner-announce-media" type="file" accept="image/*" hidden onChange={onPickMedia} />
              <label htmlFor="owner-announce-media">
                <Button component="span" variant="outlined" size="small" startIcon={<ImageIcon sx={{ fontSize: 16 }} />} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Upload Media
                </Button>
              </label>
              {isEdit && (
                <Button
                  variant={form.remove_media ? 'contained' : 'text'}
                  color={form.remove_media ? 'error' : 'inherit'}
                  size="small" disabled={saving}
                  onClick={() => setForm(s => ({ ...s, remove_media: !s.remove_media, ...(s.remove_media ? {} : { media_base64: '', media_preview: '' }) }))}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {form.remove_media ? 'Media akan dihapus' : 'Hapus Media'}
                </Button>
              )}
            </Stack>
            {form.media_preview && (
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.media_preview} alt="preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            {isEdit && form.remove_media && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>Media akan dihapus saat kamu klik <b>Simpan</b>.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { if (saving) return; setDialogOpen(false); resetForm(); }} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={submitForm} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus Pengumuman?"
        message={`Pengumuman "${deleteTarget?.title || '-'}" akan dihapus permanen.`}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={deleting}
      />
    </Box>
  );
}