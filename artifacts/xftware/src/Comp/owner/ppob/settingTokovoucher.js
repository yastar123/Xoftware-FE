import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, ListItemButton, ListItemText, Card, CardContent, Stack, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Chip, MenuItem, Switch, Tooltip, Divider, alpha, InputAdornment, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { FaImage, FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Lock, Category, Settings, ViewList } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';
import PPOBInformation from './ppobInformation';

const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const ProfitTypeSelect = ({ value, onChange, label = 'Tipe Profit' }) => (
  <TextField select label={label} size="small" fullWidth value={value ?? ''} onChange={e => onChange(e.target.value || null)} sx={{ borderRadius: 2 }}>
    <MenuItem value="">(inherit)</MenuItem>
    <MenuItem value="nominal">Nominal</MenuItem>
    <MenuItem value="percent">Percent</MenuItem>
  </TextField>
);

export function usePpobGate() {
  const [state, setState] = React.useState({ checking: true, allowed: false, message: '' });
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reqOwner({ action: 'isSupportPpob' });
        if (!alive) return;
        if (!res?.error) setState({ checking: false, allowed: true, message: '' });
        else setState({ checking: false, allowed: false, message: res.message || 'Access denied!' });
      } catch (e) {
        if (!alive) return;
        setState({ checking: false, allowed: false, message: e?.message || 'Access denied!' });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

export function BlockedView({ title = 'Access denied!', subtitle }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
      <Lock sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography color="text.disabled">{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.disabled" align="center" maxWidth={400}>{subtitle}</Typography>}
    </Stack>
  );
}

export function OwnerCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, data: null, file: null, base64: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await reqOwner({ action: 'ppob.myCategories' });
    if (!res?.error) setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = c => setDialog({ open: true, data: { ...c }, file: null, base64: '' });
  const closeEdit = () => setDialog({ open: false, data: null, file: null, base64: '' });

  const onPickFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setDialog(d => ({ ...d, file, base64 }));
  };

  const save = async () => {
    if (!dialog.data) return;
    setSaving(true);
    const payload = { action: 'ppob.setCategory', categoryId: dialog.data.id, is_visible: !!dialog.data.is_visible, profit_type: dialog.data.profit_type || null, profit_value: dialog.data.profit_value ? Number(dialog.data.profit_value) : null };
    if (dialog.base64) payload.icon_base64 = dialog.base64;
    if (dialog.data.icon_url && !dialog.base64) payload.icon_url = dialog.data.icon_url;
    const res = await reqOwner(payload);
    setSaving(false);
    if (!res?.error) { closeEdit(); fetchData(); }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Category sx={{ fontSize: 24, color: '#6366f1' }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>Kategori</Typography>
            <Typography variant="caption" color="text.secondary">Kelola visibilitas, profit, dan icon kategori</Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${rows.length} item`} variant="outlined" sx={{ borderRadius: 1.5 }} />
      </Stack>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}><CircularProgress /></Stack>
      ) : (
        <Grid container spacing={1.5}>
          {rows.map((c, i) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700} fontSize={14}>{c.alias || c.name}</Typography>
                        <Chip size="small" label={(c.provider_type || 'other').toUpperCase()} variant="outlined" sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />
                      </Stack>
                      <Tooltip title={c.is_visible ? 'Visible' : 'Hidden'}>
                        <Box sx={{ color: c.is_visible ? '#10b981' : 'text.disabled' }}>{c.is_visible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}</Box>
                      </Tooltip>
                    </Stack>
                    <Box sx={{ width: '100%', height: 100, overflow: 'hidden', borderRadius: 2, mb: 1.5, bgcolor: alpha('#000', 0.02), display: 'grid', placeItems: 'center' }}>
                      {c.icon_url ? <Box component="img" src={c.icon_url} alt="icon" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FaImage size={28} color="#ccc" />}
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip size="small" label={c.profit_type === 'percent' ? `Profit: ${c.profit_value || 0}%` : `Profit: ${idr(c.profit_value || 0)}`} sx={{ fontSize: 11, borderRadius: 1.5 }} />
                      <Button size="small" variant="outlined" onClick={() => openEdit(c)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Edit</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialog.open} onClose={closeEdit} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Kategori</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nama" size="small" value={dialog.data?.name || ''} disabled fullWidth sx={{ borderRadius: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1}><Switch checked={!!dialog.data?.is_visible} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, is_visible: e.target.checked } }))} /><Typography fontSize={13}>Tampilkan</Typography></Stack>
            <ProfitTypeSelect value={dialog.data?.profit_type ?? null} onChange={v => setDialog(d => ({ ...d, data: { ...d.data, profit_type: v } }))} />
            <TextField type="number" label="Profit Value" size="small" fullWidth value={dialog.data?.profit_value ?? ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, profit_value: e.target.value } }))} sx={{ borderRadius: 2 }} />
            <Divider />
            <Typography variant="caption" color="text.secondary">Icon</Typography>
            {(dialog.file || dialog.data?.icon_url) && (
              <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1, textAlign: 'center' }}>
                <Box component="img" alt="preview" src={dialog.file ? URL.createObjectURL(dialog.file) : dialog.data.icon_url} sx={{ maxHeight: 140, borderRadius: 1 }} />
              </Box>
            )}
            <Button variant="outlined" startIcon={<FaImage />} component="label" sx={{ borderRadius: 2, textTransform: 'none' }}>Pilih Gambar<input type="file" accept="image/*" hidden onChange={onPickFile} /></Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <FaSave />} onClick={save} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none' }}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function OwnerOperators() {
  const [cats, setCats] = useState([]);
  const [activeCatId, setActiveCatId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, data: null, file: null, base64: '' });
  const [saving, setSaving] = useState(false);

  const loadCats = async () => { const res = await reqOwner({ action: 'ppob.myCategories' }); if (!res?.error) setCats(res.data || []); };
  useEffect(() => { loadCats(); }, []);

  const loadOps = async categoryId => { setLoading(true); const res = await reqOwner({ action: 'ppob.myOperators', categoryId }); if (!res?.error) setRows(res.data || []); setLoading(false); };
  useEffect(() => { if (activeCatId) loadOps(activeCatId); }, [activeCatId]);

  const openEdit = o => setDialog({ open: true, data: { ...o }, file: null, base64: '' });
  const closeEdit = () => setDialog({ open: false, data: null, file: null, base64: '' });
  const onPickFile = async e => { const file = e.target.files?.[0]; if (!file) return; const base64 = await fileToBase64(file); setDialog(d => ({ ...d, file, base64 })); };

  const save = async () => {
    if (!dialog.data) return;
    setSaving(true);
    const payload = { action: 'ppob.setOperator', operatorId: dialog.data.id, is_visible: !!dialog.data.is_visible, profit_type: dialog.data.profit_type || null, profit_value: dialog.data.profit_value ? Number(dialog.data.profit_value) : null };
    if (dialog.base64) payload.icon_base64 = dialog.base64;
    if (dialog.data.icon_url && !dialog.base64) payload.icon_url = dialog.data.icon_url;
    const res = await reqOwner(payload);
    setSaving(false);
    if (!res?.error) { closeEdit(); loadOps(activeCatId); }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ViewList sx={{ fontSize: 24, color: '#6366f1' }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>Operator</Typography>
            <Typography variant="caption" color="text.secondary">Kelola operator berdasarkan kategori</Typography>
          </Box>
        </Stack>
        <TextField select size="small" label="Kategori" sx={{ minWidth: 240, borderRadius: 2 }} value={activeCatId || ''} onChange={e => setActiveCatId(Number(e.target.value))}>
          <MenuItem value="" disabled>Pilih kategori</MenuItem>
          {cats.map(c => <MenuItem key={c.id} value={c.id}>{c.alias || c.name}</MenuItem>)}
        </TextField>
      </Stack>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}><CircularProgress /></Stack>
      ) : activeCatId ? (
        <Grid container spacing={1.5}>
          {rows.map((o, i) => (
            <Grid item xs={12} sm={6} md={4} key={o.id}>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={700} fontSize={14}>{o.alias || o.name}</Typography></Stack>
                      <Tooltip title={o.is_visible ? 'Visible' : 'Hidden'}><Box sx={{ color: o.is_visible ? '#10b981' : 'text.disabled' }}>{o.is_visible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}</Box></Tooltip>
                    </Stack>
                    <Box sx={{ width: '100%', height: 100, overflow: 'hidden', borderRadius: 2, mb: 1.5, bgcolor: alpha('#000', 0.02), display: 'grid', placeItems: 'center' }}>
                      {(o.icon_url || o.icon_vendor || o.logo_url) ? <Box component="img" src={o.icon_url || o.icon_vendor || o.logo_url} alt="icon" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FaImage size={28} color="#ccc" />}
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip size="small" label={o.profit_type ? (o.profit_type === 'percent' ? `Profit: ${o.profit_value || 0}%` : `Profit: ${idr(o.profit_value || 0)}`) : 'Profit: (inherit)'} sx={{ fontSize: 11, borderRadius: 1.5 }} />
                      <Button size="small" variant="outlined" onClick={() => openEdit(o)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Edit</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 300 }}><Typography color="text.disabled">Pilih kategori terlebih dahulu</Typography></Stack>
      )}

      <Dialog open={dialog.open} onClose={closeEdit} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Operator</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nama" size="small" value={dialog.data?.name || ''} disabled fullWidth sx={{ borderRadius: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1}><Switch checked={!!dialog.data?.is_visible} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, is_visible: e.target.checked } }))} /><Typography fontSize={13}>Tampilkan</Typography></Stack>
            <ProfitTypeSelect value={dialog.data?.profit_type ?? null} onChange={v => setDialog(d => ({ ...d, data: { ...d.data, profit_type: v } }))} />
            <TextField type="number" label="Profit Value" size="small" fullWidth value={dialog.data?.profit_value ?? ''} onChange={e => setDialog(d => ({ ...d, data: { ...d.data, profit_value: e.target.value } }))} sx={{ borderRadius: 2 }} />
            <Divider />
            <Typography variant="caption" color="text.secondary">Icon</Typography>
            {(dialog.file || dialog.data?.icon_url || dialog.data?.icon_vendor) && (
              <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1, textAlign: 'center' }}>
                <Box component="img" alt="current" src={dialog.file ? URL.createObjectURL(dialog.file) : dialog.data.icon_url || dialog.data.icon_vendor} sx={{ maxHeight: 140, borderRadius: 1 }} />
              </Box>
            )}
            <Button variant="outlined" startIcon={<FaImage />} component="label" sx={{ borderRadius: 2, textTransform: 'none' }}>Pilih Gambar<input type="file" accept="image/*" hidden onChange={onPickFile} /></Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <FaSave />} onClick={save} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none' }}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function OwnerVendorPreview() {
  const [catVendor, setCatVendor] = useState([]);
  const [opVendor, setOpVendor] = useState([]);
  const [jenisVendor, setJenisVendor] = useState([]);
  const [prodVendor, setProdVendor] = useState([]);
  const [selected, setSelected] = useState({ catId: '', opId: '', jenisId: '' });
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => { setLoading(true); const res = await reqOwner({ action: 'ppob.vendorCategories' }); if (!res?.error) setCatVendor(res.data || []); setLoading(false); };
  const loadOperators = async catId => { setLoading(true); const res = await reqOwner({ action: 'ppob.vendorOperators', categoryVendorId: catId }); if (!res?.error) setOpVendor(res.data?.rows || []); setLoading(false); };
  const loadJenis = async opId => { setLoading(true); const res = await reqOwner({ action: 'ppob.vendorJenis', operatorVendorId: opId }); if (!res?.error) setJenisVendor(res.data?.rows || []); setLoading(false); };
  const loadProducts = async (opId, jenisId) => { setLoading(true); const res = await reqOwner({ action: 'ppob.vendorProducts', operatorVendorId: opId, jenisId }); if (!res?.error) setProdVendor(res.data?.rows || []); setLoading(false); };

  useEffect(() => { loadCategories(); }, []);

  const listBoxSx = { border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1, maxHeight: 420, overflow: 'auto', bgcolor: 'background.paper' };
  const itemSx = { borderRadius: 2, transition: 'all 0.15s', '&:hover': { bgcolor: alpha('#6366f1', 0.04) }, '&.Mui-selected': { bgcolor: alpha('#6366f1', 0.08), color: '#4338ca', '&.Mui-selected:hover': { bgcolor: alpha('#6366f1', 0.12) } } };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <ViewList sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>Preview Vendor</Typography>
          <Typography variant="caption" color="text.secondary">Jelajahi data vendor: kategori, operator, jenis, produk</Typography>
        </Box>
      </Stack>

      <Grid container spacing={1.5}>
        {[
          { title: 'Kategori', items: catVendor, activeId: selected.catId, onClick: id => { setSelected({ catId: id, opId: '', jenisId: '' }); setOpVendor([]); setJenisVendor([]); setProdVendor([]); loadOperators(id); } },
          { title: 'Operator', items: opVendor, activeId: selected.opId, onClick: id => { setSelected(s => ({ ...s, opId: id, jenisId: '' })); setJenisVendor([]); setProdVendor([]); loadJenis(id); } },
          { title: 'Jenis', items: jenisVendor, activeId: selected.jenisId, onClick: id => { setSelected(s => ({ ...s, jenisId: id })); setProdVendor([]); loadProducts(selected.opId || '', id); } },
          { title: 'Produk', items: prodVendor, activeId: null },
        ].map((col, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{col.title}</Typography>
            <Box sx={listBoxSx}>
              {loading && !col.items.length && <Stack alignItems="center" py={4}><CircularProgress size={16} /></Stack>}
              {col.items.map(item => (
                <ListItemButton key={item.id} selected={col.activeId === item.id} onClick={() => col.onClick?.(item.id)} sx={itemSx}>
                  <ListItemText primary={item.name} secondary={item.logo ? 'Has logo' : null} primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }} secondaryTypographyProps={{ fontSize: 11 }} />
                </ListItemButton>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}