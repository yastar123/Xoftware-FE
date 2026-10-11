import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  CircularProgress, Divider, Chip, Pagination, Tooltip, Alert,
  FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup,
  ToggleButton, Button, alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Add, Contacts, Delete, Edit, Refresh } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

const MotionCard = motion(Card);

const TAGS = [
  { value: 'wa', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'link', label: 'Link' },
];

const DAYS = [
  { key: 'senin', label: 'Sen' },
  { key: 'selasa', label: 'Sel' },
  { key: 'rabu', label: 'Rab' },
  { key: 'kamis', label: 'Kam' },
  { key: 'jumat', label: 'Jum' },
  { key: 'sabtu', label: 'Sab' },
  { key: 'minggu', label: 'Min' },
];

function safeJsonParse(v) {
  try {
    if (!v) return null;
    if (typeof v === 'object') return v;
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function hhmmColonToDot(v) {
  const s = String(v ?? '').trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s.replace(':', '.');
  return s;
}

function dotToColon(v) {
  const s = String(v ?? '').trim();
  if (/^\d{2}\.\d{2}$/.test(s)) return s.replace('.', ':');
  return s;
}

function dotTimeToMinutes(dot) {
  const s = String(dot ?? '').trim();
  const m = s.match(/^(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function buildTimeOptions(stepMinutes = 15) {
  const out = [];
  for (let t = 0; t <= 23 * 60 + 45; t += stepMinutes) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    out.push(`${hh}.${mm}`);
  }
  if (!out.includes('23.59')) out.push('23.59');
  return out;
}

const TIME_OPTIONS = buildTimeOptions(15);

function getTargetHint(tag) {
  if (tag === 'wa') return 'Contoh: 62812xxxx atau +62812xxxx';
  if (tag === 'telegram') return 'Contoh: username (tanpa @ boleh)';
  if (tag === 'link') return 'Contoh: https://example.com/contact';
  return 'Masukkan target';
}

function validateTarget(tag, usertarget) {
  const t = String(tag || '').toLowerCase();
  const u = String(usertarget || '').trim();
  if (!u) return 'Target wajib diisi';
  if (t === 'wa') {
    const cleaned = u.replace(/\s+/g, '');
    if (!/^\+?\d{6,20}$/.test(cleaned)) return 'Nomor WA tidak valid (contoh: 62812xxxx)';
    return null;
  }
  if (t === 'telegram') {
    const cleaned = u.replace(/^@+/, '');
    if (!/^[A-Za-z0-9_]{5,32}$/.test(cleaned)) return 'Username Telegram tidak valid (5-32, huruf/angka/_)';
    return null;
  }
  if (t === 'link') {
    try {
      const url = new URL(u);
      if (!/^https?:$/.test(url.protocol)) return 'Link harus diawali http:// atau https://';
      return null;
    } catch {
      return 'Link tidak valid';
    }
  }
  return 'Tag tidak valid';
}

function normalizeTarget(tag, usertarget) {
  const t = String(tag || '').toLowerCase();
  let u = String(usertarget || '').trim();
  if (t === 'wa') return u.replace(/\s+/g, '');
  if (t === 'telegram') return u.replace(/^@+/, '');
  if (t === 'link') return new URL(u).toString();
  return u;
}

function formatActiveAtForChip(active_at) {
  const obj = safeJsonParse(active_at);
  if (!obj) return '-';
  const days = Array.isArray(obj.days) ? obj.days : [];
  const start = obj.start ? String(obj.start) : '';
  const end = obj.end ? String(obj.end) : '';
  const dayNames = days.map(d => DAYS.find(x => x.key === String(d).toLowerCase())?.label).filter(Boolean);
  const timePart = start && end ? `${start} - ${end} WIB` : 'Jam tidak set';
  const dayPart = dayNames.length ? dayNames.join(', ') : 'Hari tidak set';
  return `${dayPart} • ${timePart}`;
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

export default function OwnerContactPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null, label: 'admin 1', tag: 'wa', usertarget: '',
    days: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
    start: '08.00', end: '17.00',
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (debouncedQ?.trim()) chips.push({ key: 'q', label: `Search: "${debouncedQ.trim()}"` });
    if (tagFilter) chips.push({ key: 'tag', label: `Tag: ${tagFilter}` });
    chips.push({ key: 'total', label: `Total: ${totalItems}` });
    return chips;
  }, [debouncedQ, tagFilter, totalItems]);

  const resetForm = () => {
    setForm({
      id: null, label: 'admin 1', tag: 'wa', usertarget: '',
      days: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
      start: '08.00', end: '17.00',
    });
    setIsEdit(false);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = row => {
    const aa = safeJsonParse(row?.active_at) || {};
    const days = Array.isArray(aa.days) ? aa.days.map(d => String(d).toLowerCase()) : [];
    const startDot = hhmmColonToDot(aa.start || '08:00');
    const endDot = hhmmColonToDot(aa.end || '17:00');
    setForm({
      id: row.id, label: row.label || 'admin 1', tag: row.tag || 'wa', usertarget: row.usertarget || '',
      days: days.length ? days : ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
      start: /^\d{2}\.\d{2}$/.test(startDot) ? startDot : '08.00',
      end: /^\d{2}\.\d{2}$/.test(endDot) ? endDot : '17.00',
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const fetchContacts = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    setLoading(true);
    const payload = { action: 'getContactOwners', page: nextPage, limit: 12, q: debouncedQ?.trim() };
    if (tagFilter) payload.tag = tagFilter;
    const res = await reqOwner(payload);
    if (!res?.error) {
      const data = res?.data || res || {};
      const rows = data.rows || data.items || data || [];
      setItems(Array.isArray(rows) ? rows : []);
      setPage(data.page || nextPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.count ?? data.totalItems ?? (Array.isArray(rows) ? rows.length : 0));
    } else {
      toast.error(res?.message || 'Gagal memuat contact owner');
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchContacts({ page: 1 }); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchContacts({ page: 1 }); }, [debouncedQ, tagFilter]);

  const validateForm = () => {
    const label = String(form.label || '').trim();
    if (!label || label.length < 2 || label.length > 60) return 'Label wajib 2-60 karakter';
    const tag = String(form.tag || '').toLowerCase();
    if (!TAGS.some(t => t.value === tag)) return 'Tag tidak valid';
    const targetErr = validateTarget(tag, form.usertarget);
    if (targetErr) return targetErr;
    const days = Array.isArray(form.days) ? form.days : [];
    if (!days.length) return 'Pilih minimal 1 hari aktif';
    const startMin = dotTimeToMinutes(form.start);
    const endMin = dotTimeToMinutes(form.end);
    if (startMin == null || endMin == null) return 'Jam tidak valid (format HH.MM)';
    if (endMin <= startMin) return 'Jam selesai harus lebih besar dari jam mulai';
    return null;
  };

  const submitForm = async () => {
    const err = validateForm();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const tag = String(form.tag).toLowerCase();
      const usertarget = normalizeTarget(tag, form.usertarget);
      const payload = {
        action: isEdit ? 'editContactOwner' : 'addContactOwner',
        label: String(form.label || '').trim(),
        tag, usertarget,
        active_at: { days: form.days, start: dotToColon(form.start).replace(':', '.'), end: dotToColon(form.end).replace(':', '.') },
      };
      if (isEdit) payload.id = form.id;
      const res = await reqOwner(payload);
      if (!res?.error) {
        toast.success(res?.message || (isEdit ? 'Berhasil update' : 'Berhasil tambah'));
        setDialogOpen(false);
        resetForm();
        fetchContacts({ page: 1 });
      } else {
        toast.error(res?.message || 'Gagal menyimpan contact owner');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await reqOwner({ action: 'delContactOwner', id: deleteTarget.id });
      if (!res?.error) {
        toast.success(res?.message || 'Berhasil menghapus');
        setDeleteOpen(false);
        setDeleteTarget(null);
        const willEmpty = items.length === 1 && page > 1;
        fetchContacts({ page: willEmpty ? page - 1 : page });
      } else {
        toast.error(res?.message || 'Gagal menghapus contact owner');
      }
    } finally {
      setDeleting(false);
    }
  };

  const onChangeTag = nextTag => setForm(s => ({ ...s, tag: nextTag, usertarget: '' }));

  const onChangeStart = v => {
    setForm(s => {
      const startMin = dotTimeToMinutes(v);
      const endMin = dotTimeToMinutes(s.end);
      if (startMin != null && endMin != null && endMin <= startMin) {
        const idx = TIME_OPTIONS.indexOf(v);
        const nextEnd = TIME_OPTIONS[Math.min(idx + 1, TIME_OPTIONS.length - 1)] || '23.59';
        return { ...s, start: v, end: nextEnd };
      }
      return { ...s, start: v };
    });
  };

  const renderTagChip = tag => {
    const t = String(tag || '').toLowerCase();
    const found = TAGS.find(x => x.value === t);
    return <Chip size="small" label={found?.label || t || '-'} variant="outlined" sx={{ textTransform: 'capitalize' }} />;
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Management Contact Owner</Typography>
            <Typography variant="caption" color="text.secondary">Kelola kontak owner (WA / Telegram / Link) + jam aktif (WIB).</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchContacts({ page })} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tambah Contact">
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
                <TextField label="Cari label / target" value={q} onChange={e => setQ(e.target.value)} size="small" fullWidth />
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Filter Tag</InputLabel>
                  <Select label="Filter Tag" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                    <MenuItem value="">Semua</MenuItem>
                    {TAGS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button variant="contained" size="small" onClick={() => fetchContacts({ page: 1 })} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Apply</Button>
                  <Button variant="text" size="small" onClick={() => { setQ(''); setTagFilter(''); setTimeout(() => fetchContacts({ page: 1 }), 0); }} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Reset</Button>
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
            {items.map((row, i) => (
              <MotionCard
                key={row.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', transition: 'all 0.2s', '&:hover': {} }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: '100%' }}>{row.label || '-'}</Typography>
                      {renderTagChip(row.tag)}
                      <Chip size="small" label={String(row.usertarget || '-')} variant="outlined" sx={{ maxWidth: '100%' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{formatActiveAtForChip(row.active_at)}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#6366f1', bgcolor: alpha('#6366f1', 0.08), '&:hover': { bgcolor: alpha('#6366f1', 0.15) } }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => { setDeleteTarget(row); setDeleteOpen(true); }} sx={{ color: 'error.main', bgcolor: alpha('#ef4444', 0.08), '&:hover': { bgcolor: alpha('#ef4444', 0.15) } }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </MotionCard>
            ))}
            {items.length === 0 && (
              <Card variant="outlined" sx={{ borderRadius: 3, py: 6, textAlign: 'center' }}>
                <Contacts sx={{ fontSize: 40, color: 'text.disabled', mb: 0.5 }} />
                <Typography color="text.disabled">Tidak ada contact owner.</Typography>
              </Card>
            )}
          </Stack>
          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" mt={3}>
              <Pagination page={page} count={Math.max(1, totalPages)} onChange={(_, p) => fetchContacts({ page: p })} color="primary" shape="rounded" size="small" />
            </Stack>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => { setDialogOpen(false); resetForm(); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Contact Owner' : 'Tambah Contact Owner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <TextField label="Label" value={form.label} onChange={e => setForm(s => ({ ...s, label: e.target.value }))} fullWidth size="small" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Tag</InputLabel>
                <Select label="Tag" value={form.tag} onChange={e => onChangeTag(e.target.value)}>
                  {TAGS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Target" placeholder={getTargetHint(form.tag)} value={form.usertarget} onChange={e => setForm(s => ({ ...s, usertarget: e.target.value }))} fullWidth size="small" />
            </Stack>
            <Divider />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Aktif Sampai (WIB)</Typography>
              <Typography variant="caption" color="text.secondary">Pilih hari aktif, lalu atur jam mulai & selesai.</Typography>
              <Box sx={{ mt: 1.25 }}>
                <ToggleButtonGroup value={form.days} onChange={(_, next) => setForm(s => ({ ...s, days: next }))} size="small">
                  {DAYS.map(d => (
                    <ToggleButton key={d.key} value={d.key} sx={{ borderRadius: 2, px: 1.2, py: 0.6, textTransform: 'none', fontWeight: 700 }}>
                      {d.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mulai</InputLabel>
                  <Select label="Mulai" value={form.start} onChange={e => onChangeStart(e.target.value)}>
                    {TIME_OPTIONS.map(t => <MenuItem key={t} value={t}>{t} WIB</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Selesai</InputLabel>
                  <Select label="Selesai" value={form.end} onChange={e => setForm(s => ({ ...s, end: e.target.value }))}>
                    {TIME_OPTIONS.map(t => <MenuItem key={t} value={t}>{t} WIB</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                Preview: <b>{(form.days || []).map(k => DAYS.find(d => d.key === k)?.label).filter(Boolean).join(', ') || '-'}</b> • <b>{dotToColon(form.start)} - {dotToColon(form.end)} WIB</b>
              </Alert>
            </Box>
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
        title="Hapus Contact Owner?"
        message={`Data contact "${deleteTarget?.label || '-'}" akan dihapus permanen.\n\n${String(deleteTarget?.tag || '-').toUpperCase()} • ${String(deleteTarget?.usertarget || '-')}`}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={deleting}
      />
    </Box>
  );
}