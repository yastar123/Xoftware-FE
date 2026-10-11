import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, ListItemButton, ListItemText, TableRow, TableCell,
  Skeleton, Stack, TextField, Button, FormControlLabel, Switch,
  TableContainer, Table, TableHead, TableSortLabel, TableBody,
  IconButton, Pagination, Chip, FormControl, InputLabel, Select,
  MenuItem, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Card, CardContent, Tooltip, alpha, useTheme,
  InputAdornment, Divider, Alert, Collapse, Grid
} from '@mui/material';
import {
  Add, Delete, Edit, CloudUpload, Storefront, ContentCopy,
  VisibilityOff, Visibility, Close, Check, Refresh, Inventory2,
  Search, Warning, Info, Category, LinkOff,
  UploadFile, Download, CheckCircle, Error as ErrorIcon,
  Chat,
  Lock,
  LocalFireDepartment,
  Public,
  RocketLaunch,
  Gavel,
  Description,
  ChevronRight,
  Person,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/Hook/debouncingState';
import { fileToBase64, idr } from '@/lib/helper';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import VoucherList from './voucherList';
import Level from './level';
import RecapProductPage from './recapProduct';
import RecapDashboardPage from './recapProductDashboard';
import ResellerTransactionPage from './resellerInformation';
import { OptimizedProductCard } from './CardMarketplace';
import ResellerChatDrawer from './chat/ChatDrawer';
import { useResellerChat } from '@/Hook/useResellerChat';
import SellerChatPage from './chat/SellerChatPage';
import SellerProfilePage from './SellerProfilePage';
import ProductRatingList from './ProductRatingList';
import MarketplaceBanner from './MarketplaceBanner';
import * as XLSX from 'xlsx';

const safeParseTiers = (t) => {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  if (typeof t === 'string') {
    try { return JSON.parse(t) || []; } catch (e) { return []; }
  }
  return [];
};

function generateTemplate(templates) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Panduan
  const guide = [
    ['PANDUAN IMPORT STOCK'],
    [],
    ['Petunjuk:'],
    ['1. Kolom pertama SELALU product_code'],
    ['2. Kolom selanjutnya sesuai urutan field di form masing-masing'],
    ['3. Satu baris = satu akun stok'],
    ['4. Bisa campuran product code dari form berbeda dalam satu file'],
    ['5. Baris tanpa product_code akan diabaikan'],
    [],
    ['DAFTAR FORM & PRODUCT CODE:'],
    [],
  ];
  templates.forEach(t => {
    guide.push([`Form: ${t.form_name} (${t.total_products} produk)`]);
    guide.push(['Fields:', ...t.fields]);
    guide.push(['Product Codes:', ...t.product_codes]);
    guide.push([]);
  });

  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 30 }, ...templates.reduce((max, t) => Math.max(max, t.fields.length), 0).fill(0).map(() => ({ wch: 25 }))];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  // One sheet per form
  templates.forEach(t => {
    const rows = [
      ['product_code', ...t.fields],
      ...t.product_codes.map(code => [code, ...t.fields.map(() => '')]),
      ['', ...t.fields.map(() => '')],
      ['', ...t.fields.map(() => '')],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, ...t.fields.map(() => ({ wch: 25 }))];
    XLSX.utils.book_append_sheet(wb, ws, t.form_name || `Form_${t.form_id}`);
  });

  XLSX.writeFile(wb, 'template_import_stock.xlsx');
}

function ImportStockDialog({ open, onClose, onImported }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState('idle'); // idle | uploading | result
  const [result, setResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error('Format file harus .xlsx atau .xls');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setStep('uploading');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await reqOwner({
        action: 'v2ImportStock',
        fileBase64: base64,
      });

      if (res?.error) {
        toast.error(res.message || 'Gagal import');
        setStep('idle');
      } else {
        setResult(res.data);
        setStep('result');
        if (onImported) onImported();
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal membaca file');
      setStep('idle');
    }

    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await reqOwner({ action: 'v2DownloadStockTemplate' });
      if (res?.error) { toast.error(res.message); return; }
      const templates = res.data?.templates || [];
      if (templates.length === 0) {
        toast.warning('Belum ada form stock. Buat produk terlebih dahulu.');
        return;
      }
      generateTemplate(templates);
      toast.success('Template berhasil didownload');
    } catch {
      toast.error('Gagal download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleClose = () => {
    setStep('idle');
    setResult(null);
    setFileName('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={step === 'uploading' ? undefined : handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadFile sx={{ fontSize: 20, color: '#6366f1' }} />
        <Typography fontWeight={700} sx={{ flex: 1 }}>Import Stock dari Excel</Typography>
        <IconButton size="small" onClick={handleClose} disabled={step === 'uploading'}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {step === 'idle' && (
          <Stack spacing={2.5} sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 2, py: 0.75 }}>
              <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                <b>Format:</b> Kolom pertama = <code>product_code</code>, kolom selanjutnya = data akun sesuai form.<br />
                Bisa campuran product code dari form berbeda dalam satu file.
              </Typography>
            </Alert>

            <Box>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleFileSelect}
              />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<UploadFile />}
                onClick={() => fileRef.current?.click()}
                sx={{
                  borderRadius: 2.5, py: 2, textTransform: 'none',
                  borderStyle: 'dashed', borderWidth: 2,
                  '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.04) },
                }}
              >
                Pilih File Excel (.xlsx / .xls) • Max 2MB
              </Button>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={downloadingTemplate ? <CircularProgress size={16} /> : <Download />}
              disabled={downloadingTemplate}
              sx={{ borderRadius: 2, textTransform: 'none' }}
              onClick={async () => {
                try {
                  const res = await reqOwner({ action: 'v2DownloadStockTemplate' });
                  if (res?.error) { toast.error(res.message); return; }
                  const templates = res.data?.templates || [];
                  if (templates.length === 0) { toast.warning('Belum ada form stock'); return; }
                  // Generate Excel di frontend
                  const XLSX = await import('xlsx');
                  const wb = XLSX.utils.book_new();
                  const guide = [
                    ['PANDUAN IMPORT STOCK'], [], ['Petunjuk:'],
                    ['1. Kolom pertama SELALU product_code'],
                    ['2. Kolom selanjutnya sesuai urutan field di form'],
                    ['3. Satu baris = satu akun stok'], [],
                    ['DAFTAR FORM & PRODUCT CODE:'], [],
                  ];
                  templates.forEach(t => {
                    guide.push([`Form: ${t.form_name} (${t.total_products} produk)`]);
                    guide.push(['Fields:', ...t.fields]);
                    guide.push(['Product Codes:', ...t.product_codes]);
                    guide.push([]);
                  });
                  const wsG = XLSX.utils.aoa_to_sheet(guide);
                  XLSX.utils.book_append_sheet(wb, wsG, 'Panduan');
                  templates.forEach(t => {
                    const rows = [
                      ['product_code', ...t.fields],
                      ...t.product_codes.map(c => [c, ...t.fields.map(() => '')]),
                      ['', ...t.fields.map(() => '')],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, t.form_name || `Form_${t.form_id}`);
                  });
                  XLSX.writeFile(wb, 'template_import_stock.xlsx');
                  toast.success('Template didownload');
                } catch { toast.error('Gagal download template'); }
              }}
            >
              Template
            </Button>
          </Stack>
        )}

        {step === 'uploading' && (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress size={40} sx={{ color: '#6366f1' }} />
            <Typography color="text.secondary" variant="body2">
              Membaca <b>{fileName}</b>...
            </Typography>
          </Stack>
        )}

        {step === 'result' && result && (
          <Stack spacing={2} sx={{ py: 1 }}>
            {/* Summary */}
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: alpha('#10b981', 0.06), border: '1px solid', borderColor: alpha('#10b981', 0.15), textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 20, color: '#10b981' }} />
                <Typography variant="h6" fontWeight={800} color="success.main">{result.success}</Typography>
                <Typography variant="caption" color="text.secondary">Berhasil</Typography>
              </Box>
              {result.skipped > 0 && (
                <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.06), border: '1px solid', borderColor: alpha('#f59e0b', 0.15), textAlign: 'center' }}>
                  <Warning sx={{ fontSize: 20, color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={800} color="warning.main">{result.skipped}</Typography>
                  <Typography variant="caption" color="text.secondary">Dilewati</Typography>
                </Box>
              )}
            </Stack>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: 13 }}>
                  Detail Dilewati ({result.errors.length})
                </Typography>
                <TableContainer sx={{ maxHeight: 280, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['Baris', 'Sheet', 'Code', 'Alasan'].map(h => (
                          <TableCell key={h} align="center" sx={{ fontSize: 10, fontWeight: 700, bgcolor: alpha('#ef4444', 0.04), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, i) => (
                        <TableRow key={i} hover>
                          <TableCell align="center" sx={{ fontSize: 11 }}>{err.row}</TableCell>
                          <TableCell align="center" sx={{ fontSize: 11 }}>{err.sheet || '-'}</TableCell>
                          <TableCell align="center" sx={{ fontSize: 11, fontFamily: 'monospace' }}>{err.code || '-'}</TableCell>
                          <TableCell sx={{ fontSize: 11 }}>{err.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'result' && (
          <Button onClick={handleClose} fullWidth variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Selesai
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export function useSellerGate() {
  const [state, setState] = useState({ checking: true, allowed: false, message: '', notify: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await reqOwner({ action: 'isSupportSellerStar' });
        if (!alive) return;
        if (res?.error) setState({ checking: false, allowed: false, message: res.message || 'Access denied!', notify: null });
        else setState({ checking: false, allowed: true, message: '', notify: null });
      } catch (e) {
        if (!alive) return;
        setState({ checking: false, allowed: false, message: e?.message || 'Access denied!', notify: null });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

function ConfirmDialog({ open, title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', confirmColor = 'error', onConfirm, onCancel, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" fontSize="small" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} size="small">{cancelText}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading} size="small" startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ThumbnailDropzone({ value, onChange, existingUrl, size = 140 }) {
  const theme = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (e) {
      toast.error('Gagal membaca file gambar');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onSelect = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const src = value ? `data:image/*;base64,${value}` : (existingUrl ? (existingUrl.startsWith('http') ? existingUrl : `https://cdn.xoftware.shop/f/${existingUrl}`) : null);

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      sx={{
        width: size,
        height: size,
        borderRadius: 3,
        border: '2px dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.background.paper, 0.5),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        hidden
        accept="image/*"
        onChange={onSelect}
      />

      <AnimatePresence mode="wait">
        {src ? (
          <motion.div
            key={src}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Box
              component="img"
              src={src}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                bgcolor: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 }
              }}
            >
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                  <Refresh fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} onClick={(e) => { e.stopPropagation(); onChange(null); }}>
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: 10 }}
          >
            <CloudUpload sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="caption" color="text.secondary" display="block">
              Thumbnail
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function WholesaleTiersInput({ value = [], onChange, basePrice = 0 }) {
  const tiers = Array.isArray(value) ? value : [];

  const addTier = () => {
    onChange([...tiers, { min_qty: '', price: '', profit: '' }]);
  };

  const removeTier = (index) => {
    const next = [...tiers];
    next.splice(index, 1);
    onChange(next);
  };

  const updateTier = (index, field, val) => {
    const next = [...tiers];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocalFireDepartment sx={{ fontSize: 18, color: '#f59e0b' }} />
          <Typography variant="subtitle2" fontWeight={600}>Tier Harga Grosir</Typography>
        </Stack>
        <Button size="small" variant="outlined" startIcon={<Add />} onClick={addTier} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 11 }}>
          Tambah Tier
        </Button>
      </Stack>

      {tiers.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
          Belum ada tier grosir. Klik Tambah Tier untuk memberikan diskon kuantitas.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {tiers.map((tier, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label="Min. Qty"
                type="number"
                size="small"
                value={tier.min_qty}
                onChange={(e) => updateTier(i, 'min_qty', e.target.value)}
                sx={{ width: 100 }}
              />
              <TextField
                label="Harga/Unit (Rp)"
                type="number"
                size="small"
                value={tier.price}
                onChange={(e) => updateTier(i, 'price', e.target.value)}
                sx={{ flex: 1 }}
                helperText={tier.price && basePrice ? `Hemat ${idr(basePrice - tier.price)}` : ''}
              />
              <TextField
                label="Profit/Unit (Rp)"
                type="number"
                size="small"
                value={tier.profit}
                onChange={(e) => updateTier(i, 'profit', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton size="small" color="error" onClick={() => removeTier(i)} sx={{ mt: 0.5 }}>
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Alert severity="info" sx={{ borderRadius: 2, py: 0, '& .MuiAlert-message': { fontSize: 11 } }}>
            Harga grosir akan otomatis aktif jika pembelian mencapai jumlah minimum.
          </Alert>
        </Stack>
      )}
    </Box>
  );
}

function ProductTableV2({ onAdd, onEdit, allowSellerStar }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem('productTableState');
    return saved ? JSON.parse(saved) : { search: '', page: 1, type: 'all' };
  });

  useEffect(() => {
    sessionStorage.setItem('productTableState', JSON.stringify(form));
  }, [form]);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [totalPage, setTotalPage] = useState(1);
  const [filterEmpty, setFilterEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const debounceQuery = useDebounce(form.search, 400);
  const abort = useRef(new AbortController());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const res = await reqOwner({ action: 'v2GetProducts', search: debounceQuery, page: form.page, type: form.type }, { signal: abort.current.signal });
      if (!res?.error && Array.isArray(res?.data?.rows)) {
        let rows = res.data.rows;
        if (filterEmpty) rows = rows.filter(r => (r.remaining_stock || 0) > 0);
        const sorted = [...rows].sort((a, b) => {
          const aV = a[sortConfig.key]?.toString().toLowerCase() || '';
          const bV = b[sortConfig.key]?.toString().toLowerCase() || '';
          return sortConfig.direction === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
        });
        setProducts(sorted);
        setTotalPage(Math.ceil(res.data.total / 20));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Gagal memuat produk');
    }
    setLoading(false);
  }, [debounceQuery, form.page, form.type, sortConfig, filterEmpty]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSort = key => setSortConfig(p => ({ key, direction: p.key === key && p.direction === 'asc' ? 'desc' : 'asc' }));

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const action = confirmDelete.reseller_provider_bot_id ? 'v2DeleteClonedResellerProduct' : 'v2DeleteProduct';
      const res = await reqOwner({ action, productId: confirmDelete.id });
      if (res?.error) { toast.error(res.message || 'Gagal menghapus'); }
      else { toast.success(res.message || 'Berhasil'); fetchProducts(); }
    } catch { toast.error('Gagal menghapus produk'); }
    setDeleting(false);
    setConfirmDelete(null);
  };

  const handleToggleReseller = async (row) => {
    const next = row.status_reseller === 'open' ? 'close' : 'open';
    try {
      const res = await reqOwner({ action: 'v2SetResellerStatus', stockId: row.id, status: next });
      if (res?.error) { toast.error(res.message); return; }
      setProducts(prev => prev.map(p => p.id === row.id ? { ...p, status_reseller: next } : p));
      toast.success(`Status reseller diubah menjadi ${next}`);
    } catch { toast.error('Gagal mengubah status'); }
  };

  const stats = useMemo(() => ({
    total: products.length,
    stock: products.reduce((s, p) => s + (parseInt(p.remaining_stock) || 0), 0),
    variation: products.filter(p => !!p.is_variation).length,
    reseller: products.filter(p => p.status_reseller === 'open').length,
    supplier: products.filter(p => !!p.reseller_provider_bot_id).length,
  }), [products]);

  const renderSkeleton = () => [...Array(8)].map((_, i) => (
    <TableRow key={`sk-${i}`}>{Array(9).fill(0).map((_, j) => (<TableCell key={j} align="center"><Skeleton variant="text" width="75%" height={20} /></TableCell>))}</TableRow>
  ));

  const columns = [
    { key: 'code', label: 'Kode', width: 100 },
    { key: 'title', label: 'Nama Produk', minWidth: 200 },
    { key: 'sold', label: 'Terjual', width: 70 },
    { key: 'cashback_amount', label: 'Cashback', width: 90 },
    { key: 'bulk_count', label: 'Bulk', width: 70 },
    { key: 'remaining_stock', label: 'Stok', width: 90 },
    { key: 'is_variation', label: 'Variasi', width: 75 },
    { key: 'reseller_provider_bot_id', label: 'Sumber', width: 95 },
    ...(allowSellerStar ? [{ key: 'status_reseller', label: 'Reseller', width: 100 }] : []),
  ];

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: 'Total Produk', value: stats.total, icon: <Inventory2 sx={{ fontSize: 18 }} />, color: '#6366f1' },
          { label: 'Total Stok', value: stats.stock, icon: <Inventory2 sx={{ fontSize: 18 }} />, color: '#10b981' },
          { label: 'Produk Variasi', value: stats.variation, icon: <Category sx={{ fontSize: 18 }} />, color: '#8b5cf6' },
          ...(allowSellerStar ? [{ label: 'Reseller Aktif', value: stats.reseller, icon: <Storefront sx={{ fontSize: 18 }} />, color: '#f59e0b' }] : []),
          { label: 'Dari Supplier', value: stats.supplier, icon: <Storefront sx={{ fontSize: 18 }} />, color: '#ef4444' },
        ].map((s, i) => (
          <Grid item xs={6} sm={2.4} key={i}>
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha(s.color, 0.08), color: s.color, display: 'grid', placeItems: 'center' }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{s.label}</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{s.value.toLocaleString('id-ID')}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <TextField placeholder="Cari produk..." size="small" fullWidth value={form.search} onChange={e => setForm({ ...form, search: e.target.value, page: 1 })}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ maxWidth: { sm: 350 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipe Produk</InputLabel>
          <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, page: 1 })} label="Tipe Produk">
            <MenuItem value="all">Semua</MenuItem>
            <MenuItem value="own">Sendiri</MenuItem>
            <MenuItem value="supplier">Dari Supplier</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel control={<Switch checked={filterEmpty} onChange={(_, c) => setFilterEmpty(c)} size="small" />} label={<Typography variant="body2">Sembunyikan kosong</Typography>} />
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={onAdd} startIcon={<Add />} sx={{ borderRadius: 2, px: 2.5 }}>Tambah Produk</Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setImportOpen(true)}
            startIcon={<UploadFile sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, px: 2.5 }}
          >
            Import Akun
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto' }}>
        <Table size="small" sx={{ minWidth: 950 }}>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', borderBottom: '2px solid', borderColor: 'divider' } }}>
              {columns.map(col => (
                <TableCell key={col.key} align="center" sx={{ width: col.width, minWidth: col.minWidth }}>
                  {col.key === 'status_reseller' || col.key === 'reseller_provider_bot_id' ? col.label : (
                    <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => handleSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { fontSize: 16 } }}>{col.label}</TableSortLabel>
                  )}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ width: 80 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? renderSkeleton() : products.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                <Stack alignItems="center" spacing={1}><Inventory2 sx={{ fontSize: 40, color: 'text.disabled' }} /><Typography color="text.disabled">Belum ada produk</Typography></Stack>
              </TableCell></TableRow>
            ) : products.map(row => (
              <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { fontSize: 13, borderBottomColor: alpha('#000', 0.04) }, transition: 'background 0.15s' }}>
                <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{row.code}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {!row.is_variation && (
                      <Box component="img" src={row.thumbnail?.startsWith('http') ? row.thumbnail : `https://cdn.xoftware.shop/f/${row.thumbnail}`} alt="" sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover', flexShrink: 0, bgcolor: 'grey.100' }} onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 220 }}>{row.title}</Typography>
                        {row.is_flash_sale && (
                          <Chip label="⚡ Flash Sale" size="small" sx={{ fontSize: 9, height: 16, background: 'linear-gradient(90deg,#f59e0b,#ef4444)', color: '#fff', fontWeight: 700 }} />
                        )}
                        {row.has_wholesale && (
                          <Chip label="Grosir" size="small" sx={{ fontSize: 9, height: 16, bgcolor: alpha('#f59e0b', 0.1), color: '#d97706', fontWeight: 700 }} />
                        )}
                        {row.price_changed && (
                          <Tooltip title={`Harga supplier ${row.price_diff > 0 ? 'Naik' : 'Turun'} Rp ${Math.abs(row.price_diff).toLocaleString()}`}>
                            <Chip
                              label={row.price_diff > 0 ? 'Naik' : 'Turun'}
                              size="small"
                              icon={row.price_diff > 0 ? <TrendingUp sx={{ fontSize: '10px !important' }} /> : <TrendingDown sx={{ fontSize: '10px !important' }} />}
                              sx={{
                                fontSize: 9,
                                height: 16,
                                bgcolor: alpha(row.price_diff > 0 ? '#ef4444' : '#22c55e', 0.1),
                                color: row.price_diff > 0 ? '#ef4444' : '#22c55e',
                                fontWeight: 700,
                                '& .MuiChip-icon': { color: 'inherit', ml: '4px', mr: '-4px' }
                              }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                      {row.is_variation && <Typography variant="caption" color="primary" sx={{ fontSize: 10 }}>Ada variasi</Typography>}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="center">{row.sold || 0}</TableCell>
                <TableCell align="center">
                  {row.cashback_amount ? <Chip label={`${row.cashback_type === 'percent' ? row.cashback_amount + '%' : idr(row.cashback_amount)}`} size="small" color="success" variant="outlined" sx={{ fontSize: 11, height: 22 }} /> : <Typography color="text.disabled" variant="body2">—</Typography>}
                </TableCell>
                <TableCell align="center">
                  {row.bulk_count ? <Chip label={row.bulk_count} size="small" color="info" variant="outlined" sx={{ fontSize: 11, height: 22 }} /> : <Typography color="text.disabled" variant="body2">—</Typography>}
                </TableCell>
                <TableCell align="center">
                  <Chip label={`${row.remaining_stock || 0} pcs`} size="small" color={(row.remaining_stock || 0) > 0 ? 'success' : 'error'} sx={{ fontSize: 11, fontWeight: 600, height: 24, minWidth: 60 }} />
                </TableCell>
                <TableCell align="center">
                  {row.is_variation ? <Chip label="Ya" size="small" color="primary" variant="outlined" sx={{ fontSize: 11, height: 22 }} /> : <Typography color="text.disabled" variant="body2">—</Typography>}
                </TableCell>
                <TableCell align="center">
                  {row.reseller_provider_bot_id ? (
                    <Chip label="Supplier" size="small" color="warning" variant="outlined" sx={{ fontSize: 10, height: 22, fontWeight: 600, borderColor: 'warning.main', color: 'warning.dark' }} icon={<Storefront sx={{ fontSize: 12 }} />} />
                  ) : (
                    <Chip label="Sendiri" size="small" color="default" variant="outlined" sx={{ fontSize: 10, height: 22 }} />
                  )}
                </TableCell>
                {allowSellerStar && <TableCell align="center">
                  {row.reseller_provider_bot_id ? (
                    <Tooltip title="Produk dari supplier"><Typography variant="body2" color="text.disabled" sx={{ fontSize: 11 }}>—</Typography></Tooltip>
                  ) : (
                    <Tooltip title={row.status_reseller === 'open' ? 'Klik untuk menutup' : 'Klik untuk membuka'}>
                      <Switch checked={row.status_reseller === 'open'} onChange={() => handleToggleReseller(row)} size="small" color="success" />
                    </Tooltip>
                  )}
                </TableCell>}
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(row)}><Edit sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                    <Tooltip title="Hapus"><IconButton size="small" color="error" onClick={() => setConfirmDelete(row)}><Delete sx={{ fontSize: 17 }} /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPage > 1 && (
        <Stack direction="row" justifyContent="center" mt={2.5}>
          <Pagination count={totalPage} page={form.page} onChange={(_, p) => setForm(f => ({ ...f, page: p }))} color="primary" shape="rounded" size="small" />
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Hapus Produk"
        message={confirmDelete?.reseller_provider_bot_id
          ? `Putuskan hubungan dengan supplier untuk produk "${confirmDelete?.title}"?\n\nProduk akan menjadi "Produk Sendiri" dengan stok kosong. Anda bisa menghapus permanen setelahnya.`
          : `Apakah Anda yakin ingin menghapus produk "${confirmDelete?.title}"?\n\nTindakan ini tidak dapat dibatalkan. Semua variasi dan stok akun terkait juga akan dihapus.`}
        confirmText={confirmDelete?.reseller_provider_bot_id ? 'Putuskan' : 'Ya, Hapus'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
      <ImportStockDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchProducts}
      />
    </Box>
  );
}

function ProductFormV2({ mode = 'add', id = null, allowSellerStar, onDone }) {
  const isEdit = mode === 'edit';
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [forms, setForms] = useState([]);
  const [thumbnailBuffer, setThumbnailBuffer] = useState(null);
  const [variationModal, setVariationModal] = useState({ open: false, code: null });
  const [confirmDeleteVar, setConfirmDeleteVar] = useState(null);
  const [deletingVar, setDeletingVar] = useState(false);
  const [activeProductId, setActiveProductId] = useState(isEdit ? id : null);
  const abort = useRef(new AbortController());

  const [data, setData] = useState({
    code: '', title: '', price: 0, profit: 0, bulkCount: 0,
    required_seller_note: false, desc: '', snk: '',
    cashback_type: 'amount', cashback_amount: '',
    is_variation: false, form: '', editable: false,
    accountList: '', addAccountList: '',
    thumbnail: '', statusReseller: 'close', showProduct: true,
    variations: [],
    wholesaleTiers: [],
    is_flash_sale: false, flash_sale_price: '', flash_sale_end: '',
  });

  const fetchForms = async () => {
    const res = await reqOwner({ action: 'getFormList' });
    if (!res.error) setForms(res.data || []);
  };

  const fetchDetail = async () => {
    if (!id) return;
    setFetching(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const res = await reqOwner({ action: 'v2GetProductDetail', productId: id }, { signal: abort.current.signal });
      if (!res.error) {
        const d = res.data;
        setForms(d.forms || []);
        setData(prev => ({
          ...prev, code: d.code, title: d.title, price: d.price, profit: d.profit,
          bulkCount: d.bulk_count || 0, required_seller_note: !!d.required_seller_note,
          desc: d.desc || '', snk: d.snk || '',
          cashback_type: d.cashback_type || 'amount', cashback_amount: d.cashback_amount || '',
          is_variation: !!d.is_variation, form: d.form || '',
          editable: false, accountList: d.accountList || '', addAccountList: '',
          thumbnail: d.thumbnail || '', statusReseller: d.status_reseller || 'close',
          showProduct: d.is_show !== false,
          is_flash_sale: !!d.is_flash_sale,
          flash_sale_price: d.flash_sale_price || '',
          flash_sale_end: d.flash_sale_end ? new Date(d.flash_sale_end).toISOString().slice(0, 16) : '',
          variations: (d.variations || []).map(v => ({
            id: v.id, code: v.code, title: v.title, price: v.price, profit: v.profit,
            bulk_count: v.bulk_count, required_seller_note: v.required_seller_note,
            remaining_stock: v.remaining_stock || 0, ...(allowSellerStar ? { statusReseller: v.statusReseller || v.status_reseller } : {}),
            wholesaleTiers: safeParseTiers(v.wholesale_tiers),
          })),
          wholesaleTiers: safeParseTiers(d.wholesale_tiers),
        }));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Gagal memuat detail produk');
    }
    setFetching(false);
  };

  useEffect(() => {
    if (isEdit) {
      if (!id) { toast.success('Berhasil membuat produk.'); onDone?.(); return; }
      fetchDetail();
    } else fetchForms();
    return () => { abort.current.abort(); abort.current = new AbortController(); };
  }, [id]);

  const selectedForm = forms.find(f => f.id === data.form);
  const formFormat = selectedForm ? JSON.parse(selectedForm.form || '[]') : [];

  const handleSave = async () => {
    if (!data.code?.trim() && !data.is_variation) { toast.error('Kode Produk wajib diisi'); return; }
    if (!data.title?.trim()) { toast.error('Nama Produk wajib diisi'); return; }
    setLoading(true);
    try {
      const stocksPayload = data.editable ? data.accountList : data.addAccountList;
      if (!isEdit) {
        const res = await reqOwner({
          action: 'v2PostProduct', code: data.code, title: data.title, price: data.price, profit: data.profit,
          bulkCount: data.bulkCount, required_seller_note: data.required_seller_note,
          desc: data.desc, snk: data.snk, cashbackType: data.cashback_type,
          cashbackAmount: data.cashback_amount, form: data.form || undefined,
          stocks: stocksPayload, thumbnailBuffer: thumbnailBuffer || undefined,
          is_variation: data.is_variation, wholesaleTiers: data.wholesaleTiers, ...(allowSellerStar ? { statusReseller: data.statusReseller } : {}),
          is_flash_sale: data.is_flash_sale,
          flash_sale_price: data.is_flash_sale ? data.flash_sale_price : null,
          flash_sale_end: data.is_flash_sale && data.flash_sale_end ? data.flash_sale_end : null,
        });
        if (res.error) { toast.error(res.message || 'Gagal membuat produk'); setLoading(false); return; }
        toast.success(data.is_variation ? 'Produk berhasil dibuat! Silakan tambahkan variasi.' : 'Produk berhasil dibuat!');
        if (!data.is_variation) onDone?.();
      } else {
        const res = await reqOwner({
          action: 'v2PutProduct', productId: activeProductId || id,
          title: data.title, price: data.price, profit: data.profit,
          bulkCount: data.bulkCount, required_seller_note: data.required_seller_note,
          desc: data.desc, snk: data.snk, cashbackType: data.cashback_type,
          cashbackAmount: data.cashback_amount, form: data.form || undefined,
          stocks: stocksPayload, thumbnailBuffer: thumbnailBuffer || undefined,
          is_variation: data.is_variation, editable: data.editable,
          wholesaleTiers: data.wholesaleTiers,
          ...(allowSellerStar ? { statusReseller: data.statusReseller } : {}), showProduct: data.showProduct,
          is_flash_sale: data.is_flash_sale,
          flash_sale_price: data.is_flash_sale ? data.flash_sale_price : null,
          flash_sale_end: data.is_flash_sale && data.flash_sale_end ? data.flash_sale_end : null,
        });
        if (res.error) { toast.error(res.message || 'Gagal memperbarui produk'); setLoading(false); return; }
        toast.success('Produk berhasil diperbarui');
        onDone?.();
      }
    } catch { toast.error('Terjadi kesalahan saat menyimpan'); }
    setLoading(false);
  };

  const handleDeleteVariation = async () => {
    if (!confirmDeleteVar || !activeProductId) return;
    setDeletingVar(true);
    try {
      const res = await reqOwner({ action: 'v2DeleteVariation', productId: activeProductId, variationId: confirmDeleteVar.id });
      if (res.error) toast.error(res.message);
      else { setData(d => ({ ...d, variations: d.variations.filter(v => v.id !== confirmDeleteVar.id) })); toast.success('Variasi berhasil dihapus'); }
    } catch { toast.error('Gagal menghapus variasi'); }
    setDeletingVar(false);
    setConfirmDeleteVar(null);
  };

  const handleVariationSaved = (variation) => {
    setData(d => {
      const list = [...d.variations];
      const idx = list.findIndex(v => v.code === variation.code);
      if (idx >= 0) list[idx] = variation; else list.unshift(variation);
      return { ...d, variations: list };
    });
    toast.success('Variasi berhasil disimpan');
    setVariationModal({ open: false, code: null });
  };

  if (fetching) {
    return (
      <Box><Typography variant="h6" mb={2}>Memuat Data...</Typography>
        <Stack spacing={2}>{[...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />)}</Stack>
      </Box>
    );
  }

  const thumbnailUrl = data.thumbnail?.startsWith('http') ? data.thumbnail : data.thumbnail ? `https://cdn.xoftware.shop/f/${data.thumbnail}` : null;

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={2.5}>
        {isEdit ? 'Edit Produk' : (activeProductId ? 'Kelola Variasi' : 'Tambah Produk')}
      </Typography>

      {activeProductId && !isEdit && (
        <Alert severity="info" icon={<Info sx={{ fontSize: 18 }} />} sx={{ mb: 2, borderRadius: 2 }}>
          Produk berhasil dibuat. {data.is_variation ? 'Sekarang tambahkan variasi di bawah.' : ''}
        </Alert>
      )}

      {data.reseller_provider_stock_id && (data.price_diff !== 0) && !data.is_variation && (
        <Alert
          severity={data.price_diff > 0 ? 'error' : 'success'}
          variant="outlined"
          sx={{ mb: 2, borderRadius: 3, borderStyle: 'dashed' }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Harga Supplier Berubah!
          </Typography>
          <Typography variant="caption">
            Harga modal supplier saat ini adalah <b>{idr(data.provider_current_price)}</b> ({data.price_diff > 0 ? 'Naik' : 'Turun'} {idr(Math.abs(data.price_diff))} dari saat Anda meng-clone).
            Silakan sesuaikan harga jual Anda untuk menjaga profit.
          </Typography>
        </Alert>
      )}

      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <ThumbnailDropzone value={thumbnailBuffer} onChange={setThumbnailBuffer} existingUrl={thumbnailUrl} />
          <Box sx={{ flex: 1, width: '100%' }}>
            <TextField label="Kode Produk" size="small" value={data.code} onChange={e => setData({ ...data, code: e.target.value })} fullWidth disabled={isEdit || !!activeProductId} sx={{ mb: 1.5 }} />
            <TextField label="Nama Produk" size="small" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} fullWidth />
          </Box>
        </Stack>

        <Divider />

        <FormControlLabel
          control={<Switch checked={data.is_variation} onChange={e => setData({ ...data, is_variation: e.target.checked })} color="primary" />}
          label={<Typography variant="body2" fontWeight={500}>Gunakan variasi produk</Typography>}
        />

        {!data.is_variation && (
          <Collapse in={!data.is_variation} unmountOnExit>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Form Stock</InputLabel>
                <Select value={data.form} onChange={e => setData({ ...data, form: e.target.value })} label="Form Stock">
                  <MenuItem value="">Tidak Ada</MenuItem>
                  {forms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
              {formFormat.length > 0 && <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Format: <b>{formFormat.join(' | ')}</b></Alert>}
              <FormControlLabel control={<Switch checked={data.editable} onChange={e => setData({ ...data, editable: e.target.checked })} size="small" />} label={<Typography variant="body2">Mode Edit Stock (ganti semua)</Typography>} />
              {data.form && data.accountList && <TextField label="Preview Akun Tersimpan" value={data.accountList} fullWidth multiline minRows={4} InputProps={{ readOnly: true }} size="small" />}
              <TextField label={data.editable ? 'Edit Stock Akun' : 'Tambah Stock Akun'} multiline minRows={4} fullWidth size="small"
                value={data.editable ? data.accountList : data.addAccountList}
                onChange={e => setData({ ...data, [data.editable ? 'accountList' : 'addAccountList']: e.target.value })}
                placeholder={formFormat.length > 0 ? `Format: ${formFormat.join(' | ')}` : 'Satu akun per baris'} />
              <TextField label="Deskripsi" size="small" multiline rows={2} value={data.desc} onChange={e => setData({ ...data, desc: e.target.value })} fullWidth />
              <TextField label="Syarat & Ketentuan" size="small" multiline rows={2} value={data.snk} onChange={e => setData({ ...data, snk: e.target.value })} fullWidth />
              <FormControl fullWidth size="small">
                <InputLabel>Wajibkan Catatan Seller</InputLabel>
                <Select value={String(data.required_seller_note)} onChange={e => setData({ ...data, required_seller_note: e.target.value === 'true' })} label="Wajibkan Catatan Seller">
                  <MenuItem value="false">Tidak</MenuItem><MenuItem value="true">Ya</MenuItem>
                </Select>
              </FormControl>
              <Grid container spacing={1.5}>
                <Grid item xs={6}><TextField select label="Tipe Cashback" size="small" fullWidth value={data.cashback_type} onChange={e => setData({ ...data, cashback_type: e.target.value, cashback_amount: data.cashback_type !== e.target.value ? '' : data.cashback_amount })}><MenuItem value="percent">Persen</MenuItem><MenuItem value="amount">Potongan Nominal</MenuItem></TextField></Grid>
                <Grid item xs={6}><TextField label={data.cashback_type === 'amount' ? 'Cashback (Rp)' : 'Cashback (%)'} type="number" size="small" fullWidth value={data.cashback_amount} onChange={e => setData({ ...data, cashback_amount: e.target.value })} /></Grid>
              </Grid>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={4}><TextField label="Harga Jual (Rp)" type="number" size="small" fullWidth value={data.price} onChange={e => setData({ ...data, price: e.target.value })} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Profit (Rp)" type="number" size="small" fullWidth value={data.profit} onChange={e => setData({ ...data, profit: e.target.value })} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Mode Bulking" type="number" size="small" fullWidth value={data.bulkCount} onChange={e => setData({ ...data, bulkCount: e.target.value })} helperText="Default 0 = non-bulk" /></Grid>
              </Grid>
              <WholesaleTiersInput value={data.wholesaleTiers} onChange={tiers => setData({ ...data, wholesaleTiers: tiers })} basePrice={data.price} />
            </Stack>
          </Collapse>
        )}

        {data.is_variation && (
          <Collapse in={data.is_variation} unmountOnExit>
            <Stack spacing={2}>
              <TextField label="Deskripsi" size="small" multiline rows={2} value={data.desc} onChange={e => setData({ ...data, desc: e.target.value })} fullWidth />
              <TextField label="Syarat & Ketentuan" size="small" multiline rows={2} value={data.snk} onChange={e => setData({ ...data, snk: e.target.value })} fullWidth />
              {allowSellerStar && <FormControl fullWidth size="small"><InputLabel>Status Reseller</InputLabel><Select value={data.statusReseller} onChange={e => setData({ ...data, statusReseller: e.target.value })} label="Status Reseller"><MenuItem value="close">Tutup</MenuItem><MenuItem value="open">Buka</MenuItem></Select></FormControl>}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Daftar Variasi ({data.variations.length})</Typography>
                  <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setVariationModal({ open: true, code: null })} disabled={!activeProductId} sx={{ borderRadius: 2, textTransform: 'none' }}>Tambah Variasi</Button>
                </Stack>
                {!activeProductId ? (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>Simpan produk terlebih dahulu sebelum menambah variasi.</Alert>
                ) : data.variations.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 3, py: 4, textAlign: 'center' }}><Typography color="text.disabled">Belum ada variasi. Klik Tambah Variasi untuk memulai.</Typography></Card>
                ) : (
                  <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto' }}>
                    <Table size="small"><TableHead><TableRow>{['Kode', 'Nama', 'Harga', 'Profit', 'Bulk', 'Catatan', 'Stok', 'Aksi'].map(h => (<TableCell key={h} align="center" sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>))}</TableRow></TableHead>
                      <TableBody>{data.variations.map(v => (
                        <TableRow key={v.id || v.code} hover>
                          <TableCell align="center"><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{v.code}</Typography></TableCell>
                          <TableCell align="center">
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                              <Typography variant="body2">{v.title}</Typography>
                              {safeParseTiers(v.wholesaleTiers).length > 0 && (
                                <Chip label="Grosir" size="small" sx={{ fontSize: 9, height: 16, bgcolor: alpha('#f59e0b', 0.1), color: '#d97706', fontWeight: 700 }} />
                              )}
                              {v.price_diff !== 0 && (
                                <Tooltip title={`Harga supplier ${v.price_diff > 0 ? 'Naik' : 'Turun'} Rp ${Math.abs(v.price_diff).toLocaleString()}`}>
                                  <Chip
                                    label={v.price_diff > 0 ? 'Naik' : 'Turun'}
                                    size="small"
                                    icon={v.price_diff > 0 ? <TrendingUp sx={{ fontSize: '10px !important' }} /> : <TrendingDown sx={{ fontSize: '10px !important' }} />}
                                    sx={{
                                      fontSize: 9,
                                      height: 16,
                                      bgcolor: alpha(v.price_diff > 0 ? '#ef4444' : '#22c55e', 0.1),
                                      color: v.price_diff > 0 ? '#ef4444' : '#22c55e',
                                      fontWeight: 700,
                                      '& .MuiChip-icon': { color: 'inherit', ml: '4px', mr: '-4px' }
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="center">{idr(v.price)}</TableCell>
                          <TableCell align="center">{idr(v.profit)}</TableCell>
                          <TableCell align="center">{v.bulk_count || 0}</TableCell>
                          <TableCell align="center">{v.required_seller_note ? 'Ya' : 'Tidak'}</TableCell>
                          <TableCell align="center"><Chip label={v.remaining_stock || 0} size="small" color={(v.remaining_stock || 0) > 0 ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: 11 }} /></TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <IconButton size="small" onClick={() => setVariationModal({ open: true, code: v.code })}><Edit sx={{ fontSize: 16 }} /></IconButton>
                              <IconButton size="small" color="error" onClick={() => setConfirmDeleteVar(v)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}</TableBody></Table>
                  </TableContainer>
                )}
              </Box>
            </Stack>
          </Collapse>
        )}

            <Divider />
            {/* ⚡ Flash Sale Section */}
            <Box
              sx={{
                borderRadius: 3,
                border: '2px solid',
                borderColor: data.is_flash_sale ? '#f59e0b' : 'divider',
                p: 2,
                transition: 'border-color 0.25s, background 0.25s',
                bgcolor: data.is_flash_sale ? alpha('#f59e0b', 0.04) : 'transparent',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ fontSize: 20, lineHeight: 1 }}>⚡</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: data.is_flash_sale ? '#d97706' : 'text.primary' }}>
                      Flash Sale
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tampilkan produk sebagai promo terbatas di bot Telegram
                    </Typography>
                  </Box>
                </Stack>
                <Switch
                  checked={data.is_flash_sale}
                  onChange={e => setData({ ...data, is_flash_sale: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-thumb': { bgcolor: data.is_flash_sale ? '#f59e0b' : undefined },
                    '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#f59e0b !important' },
                  }}
                />
              </Stack>

              <Collapse in={data.is_flash_sale} unmountOnExit>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Alert
                    severity="warning"
                    icon={<Box sx={{ fontSize: 16 }}>🔥</Box>}
                    sx={{ borderRadius: 2, py: 0.5, fontSize: 12, bgcolor: alpha('#f59e0b', 0.08), color: '#92400e', border: '1px solid', borderColor: alpha('#f59e0b', 0.3), '& .MuiAlert-message': { fontSize: 12 } }}
                  >
                    Produk ini akan muncul di etalase <b>⚡ FLASH SALE</b> di atas list produk bot Telegram, lengkap dengan harga coret dan countdown.
                  </Alert>
                  <Grid container spacing={1.5}>
                    {data.is_variation && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Harga Jual Flash Sale (Rp)"
                            type="number"
                            size="small"
                            fullWidth
                            value={data.price}
                            onChange={e => setData({ ...data, price: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={700} color="warning.dark">Rp</Typography></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#f59e0b' } } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Profit Flash Sale (Rp)"
                            type="number"
                            size="small"
                            fullWidth
                            value={data.profit}
                            onChange={e => setData({ ...data, profit: e.target.value })}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={700} color="warning.dark">Rp</Typography></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#f59e0b' } } }}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Harga Asli / Coret (Rp)"
                        type="number"
                        size="small"
                        fullWidth
                        value={data.flash_sale_price}
                        onChange={e => setData({ ...data, flash_sale_price: e.target.value })}
                        helperText={
                          data.flash_sale_price && data.price && data.flash_sale_price > data.price
                            ? `Diskon ${Math.round((1 - data.price / data.flash_sale_price) * 100)}% dari harga asli`
                            : data.flash_sale_price && data.price && data.flash_sale_price <= data.price
                            ? '⚠ Harga asli harus lebih tinggi dari harga jual'
                            : 'Harga asli yang akan dicoret (harus lebih tinggi dari harga jual)'
                        }
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Typography variant="caption" fontWeight={700} color="warning.dark">Rp</Typography></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#f59e0b' } } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Berakhir Pada (Opsional)"
                        type="datetime-local"
                        size="small"
                        fullWidth
                        value={data.flash_sale_end}
                        onChange={e => setData({ ...data, flash_sale_end: e.target.value })}
                        helperText="Kosongkan jika tidak ada batas waktu"
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#f59e0b' } } }}
                      />
                    </Grid>
                  </Grid>
                  {data.price > 0 && data.flash_sale_price > 0 && (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.08), border: '1px dashed', borderColor: alpha('#f59e0b', 0.4) }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Preview tampilan di bot Telegram:</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.primary', lineHeight: 1.8 }}>
                        🔥 <b>{data.title || 'Nama Produk'}</b> (Sisa X!)<br />
                        &nbsp;&nbsp;&nbsp;<s>Rp{Number(data.flash_sale_price).toLocaleString('id-ID')}</s> ➜ <b>Rp{Number(data.price).toLocaleString('id-ID')}</b>
                        {data.flash_sale_end && ` ⏳ ~${Math.max(0, Math.ceil((new Date(data.flash_sale_end) - Date.now()) / 3600000))}j`}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Collapse>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel control={<Switch checked={data.showProduct} onChange={e => setData({ ...data, showProduct: e.target.checked })} size="small" />} label={<Stack direction="row" spacing={0.5} alignItems="center"><Visibility sx={{ fontSize: 16 }} /><Typography variant="body2">Tampilkan Produk</Typography></Stack>} />
              {allowSellerStar && <FormControl fullWidth size="small" sx={{ maxWidth: 200 }}><InputLabel>Status Reseller</InputLabel><Select value={data.statusReseller} onChange={e => setData({ ...data, statusReseller: e.target.value })} label="Status Reseller"><MenuItem value="close">Tutup</MenuItem><MenuItem value="open">Buka</MenuItem></Select></FormControl>}
            </Stack>

        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button variant="contained" onClick={handleSave} fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Check />} sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 600 }}>
            {isEdit ? 'Simpan Perubahan' : (activeProductId && data.is_variation ? 'Selesai' : 'Buat Produk')}
          </Button>
          <Button variant="outlined" color="inherit" onClick={onDone} fullWidth disabled={loading} sx={{ borderRadius: 2, py: 1.2, textTransform: 'none' }}>
            {activeProductId && !isEdit ? 'Kembali ke Daftar' : 'Batal'}
          </Button>
        </Stack>
      </Stack>

      <Dialog open={variationModal.open} onClose={() => setVariationModal({ open: false, code: null })} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{variationModal.code ? 'Edit Variasi' : 'Tambah Variasi'}</DialogTitle>
        <DialogContent dividers>
          {variationModal.open && <VariationFormV2 allowSellerStar={allowSellerStar} productId={activeProductId || id} variationCode={variationModal.code} forms={forms} onSaved={handleVariationSaved} onCancel={() => setVariationModal({ open: false, code: null })} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDeleteVar} title="Hapus Variasi" message={`Hapus variasi "${confirmDeleteVar?.title}" (${confirmDeleteVar?.code})?\n\nStok akun terkait juga akan dihapus.`} onConfirm={handleDeleteVariation} onCancel={() => setConfirmDeleteVar(null)} loading={deletingVar} />
    </Box>
  );
}

function VariationFormV2({ productId, variationCode, forms = [], onSaved, onCancel, allowSellerStar }) {
  const isEdit = !!variationCode;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const abort = useRef(new AbortController());
  const [data, setData] = useState({ code: '', title: '', price: 0, profit: '', bulkCount: 0, desc: '', snk: '', required_seller_note: false, form: '', editable: false, accountList: '', addAccountList: '', statusReseller: 'close', wholesaleTiers: [] });

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    abort.current.abort();
    abort.current = new AbortController();
    reqOwner({ action: 'v2GetVariationDetail', productId, code: variationCode }, { signal: abort.current.signal })
      .then(res => {
        if (res.error) { toast.error(res.message); return; }
        const d = res.data;
        setData({ code: d.code || '', title: d.title || '', price: d.price || 0, profit: d.profit || '', bulkCount: d.bulk_count || 0, desc: d.desc || '', snk: d.snk || '', required_seller_note: !!d.required_seller_note, form: d.form || '', editable: false, accountList: d.accountList || '', addAccountList: '', wholesaleTiers: safeParseTiers(d.wholesale_tiers), ...(allowSellerStar ? { statusReseller: d.statusReseller || 'close' } : {}) });
      })
      .catch(err => { if (err?.name !== 'AbortError') toast.error('Gagal memuat variasi'); })
      .finally(() => setFetching(false));
    return () => { abort.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variationCode, productId]);

  const selectedForm = forms.find(f => f.id === data.form);
  const formFormat = selectedForm ? JSON.parse(selectedForm.form || '[]') : [];

  const handleSave = async () => {
    if (!data.code?.trim()) { toast.error('Kode variasi wajib diisi'); return; }
    if (!data.title?.trim()) { toast.error('Nama variasi wajib diisi'); return; }
    setLoading(true);
    try {
      const stocksPayload = data.editable ? data.accountList : data.addAccountList;
      const action = isEdit ? 'v2PutVariation' : 'v2PostVariation';
      const payload = { action, productId, code: data.code, title: data.title, price: data.price, profit: data.profit, bulkCount: data.bulkCount, desc: data.desc, snk: data.snk, required_seller_note: data.required_seller_note, form: data.form || undefined, stocks: stocksPayload, editable: isEdit ? data.editable : undefined, wholesaleTiers: data.wholesaleTiers, ...(allowSellerStar ? { statusReseller: data.statusReseller } : {}) };
      const res = await reqOwner(payload);
      if (res.error) { toast.error(res.message); setLoading(false); return; }
      const stockCount = (stocksPayload || '').split('\n').filter(Boolean).length;
      onSaved?.({ id: isEdit ? variationCode : `new_${data.code}`, code: data.code, title: data.title, price: parseInt(data.price) || 0, profit: parseInt(data.profit) || 0, bulk_count: parseInt(data.bulkCount) || 0, required_seller_note: data.required_seller_note, remaining_stock: stockCount, wholesale_tiers: data.wholesaleTiers, ...(allowSellerStar ? { statusReseller: data.statusReseller } : {}) });
    } catch {
      toast.error('Gagal menyimpan variasi');
    }
    setLoading(false);
  };

  if (fetching) return <Stack spacing={1.5} sx={{ py: 2 }}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 1 }} />)}</Stack>;

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField label="Kode Variasi" size="small" value={data.code} onChange={e => setData({ ...data, code: e.target.value })} fullWidth disabled={isEdit} />
      <TextField label="Nama Variasi" size="small" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} fullWidth />
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField label="Harga (Rp)" type="number" size="small" fullWidth value={data.price} onChange={e => setData({ ...data, price: e.target.value })} /></Grid>
        <Grid item xs={6}><TextField label="Profit (Rp)" type="number" size="small" fullWidth value={data.profit} onChange={e => setData({ ...data, profit: e.target.value })} /></Grid>
      </Grid>
      <Grid container spacing={1.5}>
        <Grid item xs={6}><TextField label="Mode Bulking" type="number" size="small" fullWidth value={data.bulkCount} onChange={e => setData({ ...data, bulkCount: e.target.value })} /></Grid>
        <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Catatan Seller</InputLabel><Select value={String(data.required_seller_note)} onChange={e => setData({ ...data, required_seller_note: e.target.value === 'true' })} label="Catatan Seller"><MenuItem value="false">Tidak Wajib</MenuItem><MenuItem value="true">Wajib</MenuItem></Select></FormControl></Grid>
      </Grid>
      {allowSellerStar && <FormControl fullWidth size="small"><InputLabel>Status Reseller</InputLabel><Select value={data.statusReseller} onChange={e => setData({ ...data, statusReseller: e.target.value })} label="Status Reseller"><MenuItem value="close">Tutup</MenuItem><MenuItem value="open">Buka</MenuItem></Select></FormControl>}
      <TextField label="Deskripsi" size="small" multiline rows={2} value={data.desc} onChange={e => setData({ ...data, desc: e.target.value })} fullWidth />
      <TextField label="Syarat & Ketentuan" size="small" multiline rows={2} value={data.snk} onChange={e => setData({ ...data, snk: e.target.value })} fullWidth />
      <FormControl fullWidth size="small"><InputLabel>Form Stock</InputLabel><Select value={data.form} onChange={e => setData({ ...data, form: e.target.value })} label="Form Stock"><MenuItem value="">Tidak Ada</MenuItem>{forms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}</Select></FormControl>
      {formFormat.length > 0 && <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Format: <b>{formFormat.join(' | ')}</b></Alert>}
      {isEdit && data.accountList && <TextField label="Preview Akun Tersimpan" value={data.accountList} fullWidth multiline minRows={3} InputProps={{ readOnly: true }} size="small" />}
      {isEdit && <FormControlLabel control={<Switch checked={data.editable} onChange={e => setData({ ...data, editable: e.target.checked })} size="small" />} label={<Typography variant="body2">Mode Edit (ganti semua stok)</Typography>} />}
      <TextField label={data.editable ? 'Edit Stok Akun' : 'Tambah Stok Akun'} multiline minRows={3} fullWidth size="small"
        value={data.editable ? data.accountList : data.addAccountList}
        onChange={e => setData({ ...data, [data.editable ? 'accountList' : 'addAccountList']: e.target.value })}
        placeholder={formFormat.length > 0 ? `Format: ${formFormat.join(' | ')}` : 'Satu akun per baris'} />
      <WholesaleTiersInput value={data.wholesaleTiers} onChange={tiers => setData({ ...data, wholesaleTiers: tiers })} basePrice={data.price} />
      <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
        <Button variant="contained" fullWidth onClick={handleSave} disabled={loading} startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Check />} sx={{ borderRadius: 2, textTransform: 'none' }}>{isEdit ? 'Update Variasi' : 'Simpan Variasi'}</Button>
        <Button variant="outlined" fullWidth onClick={onCancel} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
      </Stack>
    </Stack>
  );
}

function CloneSingleVariationDialog({ open, variation, onClose, productId, onCloned }) {
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && variation) { setCode(`RSL-${variation.code}`); setPrice(''); }
  }, [open, variation]);

  const handleClone = async () => {
    if (!code.trim()) { toast.error('Kode variasi wajib diisi'); return; }
    const p = parseInt(price);
    if (isNaN(p) || p < 0) { toast.error('Harga jual wajib diisi'); return; }
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'v2CloneResellerVariation', clonedProductId: productId, providerVariationId: variation.id, customCode: code.trim(), customPrice: p });
      if (res.error) { toast.error(res.message); setLoading(false); return; }
      toast.success(res.message);
      onCloned?.();
      onClose();
    } catch {
      toast.error('Gagal menambah variasi');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Ambil Variasi: {variation?.title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Harga modal supplier: <b>{idr(variation?.price || 0)}</b></Alert>
          <TextField label="Kode Variasi" size="small" fullWidth value={code} onChange={e => setCode(e.target.value)} />
          <TextField label="Harga Jual (Rp)" type="number" size="small" fullWidth value={price} onChange={e => setPrice(e.target.value)} placeholder="0" helperText="Minimal = harga modal supplier" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} size="small">Batal</Button>
        <Button variant="contained" onClick={handleClone} disabled={loading} size="small" startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Add />}>Ambil</Button>
      </DialogActions>
    </Dialog>
  );
}

function ClonedResellerProductForm({ id, handleMenuClick, onDone }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [thumbnailBuffer, setThumbnailBuffer] = useState(null);
  const [cloneVarDialog, setCloneVarDialog] = useState({ open: false, variation: null });
  const [expandedVarId, setExpandedVarId] = useState(null);
  const abort = useRef(new AbortController());

  const [data, setData] = useState({
    code: '', title: '', desc: '', snk: '', thumbnail: '', showProduct: true,
    price: 0, profit: 0, reseller_provider_price: 0, is_variation: false, is_reseller_active: true,
    clonedVariations: [], unclonedVariations: [],
  });

  const fetchDetail = async () => {
    setFetching(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const res = await reqOwner({ action: 'v2GetClonedProductDetail', productId: id }, { signal: abort.current.signal });
      if (res.error) { toast.error(res.message); onDone?.(); return; }
      setData(res.data);
    } catch (err) {
      if (err?.name !== 'AbortError') { toast.error('Gagal memuat detail'); onDone?.(); }
    }
    setFetching(false);
  };

  useEffect(() => {
    if (!id) { toast.error('ID tidak ditemukan'); onDone?.(); return; }
    fetchDetail();
    return () => abort.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!data.code?.trim()) { toast.error('Kode produk wajib diisi'); return; }
    if (!data.title?.trim()) { toast.error('Nama produk wajib diisi'); return; }
    setLoading(true);
    try {
      const payload = {
        action: 'v2PutClonedResellerProduct', productId: id,
        code: data.code, title: data.title, desc: data.desc, snk: data.snk,
        showProduct: data.showProduct, thumbnailBuffer: thumbnailBuffer || undefined,
      };
      if (!data.is_variation) payload.price = data.price;
      if (data.is_variation && data.clonedVariations.length > 0) {
        payload.variationUpdates = data.clonedVariations.map(v => ({ variationId: v.id, code: v.code, title: v.title, price: v.price, desc: v.desc, snk: v.snk }));
      }
      const res = await reqOwner(payload);
      if (res.error) { toast.error(res.message); setLoading(false); return; }
      toast.success('Produk reseller berhasil diperbarui');
      onDone?.();
    } catch { toast.error('Terjadi kesalahan'); }
    setLoading(false);
  };

  const updateVariationField = (index, field, value) => {
    setData(prev => {
      const next = [...prev.clonedVariations];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, clonedVariations: next };
    });
  };
  const toggleExpand = (varId) => {
    setExpandedVarId(prev => prev === varId ? null : varId);
  };

  const handleDisconnectVariation = async (varId) => {
    try {
      const res = await reqOwner({ action: 'v2DisconnectClonedVariation', productId: id, variationId: varId });
      if (res.error) { toast.error(res.message); return; }
      toast.success(res.message);
      fetchDetail();
    } catch { toast.error('Gagal memutus variasi'); }
  };

  if (fetching) {
    return (<Box><Typography variant="h6" mb={2}>Memuat Data...</Typography><Stack spacing={2}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />)}</Stack></Box>);
  }

  const thumbnailUrl = data.thumbnail?.startsWith('http') ? data.thumbnail : data.thumbnail ? `https://cdn.xoftware.shop/f/${data.thumbnail}` : null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Edit Produk Reseller</Typography>
        <Chip label="DARI SUPPLIER" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} icon={<Storefront sx={{ fontSize: 14 }} />} />
        {!data.is_reseller_active && <Chip label="DINONAKTIFKAN SUPPLIER" size="small" color="error" sx={{ fontWeight: 600, fontSize: 11 }} />}
        <Button
          size="small"
          variant="outlined"
          startIcon={<Chat sx={{ fontSize: 16 }} />}
          onClick={() => {
            localStorage.setItem('initResellerChatStockId', id);
            localStorage.setItem('initResellerChatIsCloned', 'true');
            localStorage.setItem('initResellerChatProductData', JSON.stringify({
              title: data.title,
              code: data.code,
              price: data.price,
              is_variation: data.is_variation,
              variations: data.clonedVariations || [],
            }));
            handleMenuClick?.('product', 'seller-chat');
          }}
          sx={{
            ml: 'auto',
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 12,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.light',
              color: 'primary.main',
            },
          }}
        >
          Chat Seller
        </Button>
      </Stack>

      {!data.is_reseller_active && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>Produk ini dinonaktifkan oleh supplier. Anda tidak bisa menjual produk ini sampai supplier mengaktifkannya kembali.</Alert>}
      <Alert severity="info" icon={<Info sx={{ fontSize: 18 }} />} sx={{ mb: 2.5, borderRadius: 2 }}>Produk ini diambil dari supplier. Stok dikelola supplier dan tidak bisa ditambahkan di sini.</Alert>

      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <ThumbnailDropzone value={thumbnailBuffer} onChange={setThumbnailBuffer} existingUrl={thumbnailUrl} />
          <Box sx={{ flex: 1, width: '100%' }}>
            <TextField label="Kode Produk" size="small" value={data.code} onChange={e => setData({ ...data, code: e.target.value })} fullWidth sx={{ mb: 1.5 }} />
            <TextField label="Nama Produk" size="small" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} fullWidth />
          </Box>
        </Stack>

        <Divider />
        <TextField label="Deskripsi" size="small" multiline rows={2} value={data.desc} onChange={e => setData({ ...data, desc: e.target.value })} fullWidth />
        <TextField label="Syarat & Ketentuan" size="small" multiline rows={2} value={data.snk} onChange={e => setData({ ...data, snk: e.target.value })} fullWidth />
        <Divider />

        {!data.is_variation && (
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}><TextField label="Harga Jual (Rp)" type="number" size="small" fullWidth value={data.price} onChange={e => setData({ ...data, price: parseInt(e.target.value) || 0 })} helperText={`Modal: ${idr(data.reseller_provider_price)}`} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Profit (Rp)" type="number" size="small" fullWidth value={data.profit} InputProps={{ readOnly: true }} helperText="Otomatis" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Harga Modal" type="number" size="small" fullWidth value={data.reseller_provider_price} InputProps={{ readOnly: true }} helperText="Dari supplier" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }} /></Grid>
          </Grid>
        )}

        {data.is_variation && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Variasi yang Sudah Di-Ambil ({data.clonedVariations.length})
            </Typography>
            {data.clonedVariations.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>Belum ada variasi yang di-clone.</Alert>
            ) : (
              <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 600, fontSize: 11 } }}>
                      <TableCell sx={{ width: 40 }}></TableCell>
                      <TableCell>Kode</TableCell>
                      <TableCell>Nama</TableCell>
                      <TableCell align="center" sx={{ width: 100 }}>Modal</TableCell>
                      <TableCell align="center" sx={{ width: 120 }}>Harga Jual</TableCell>
                      <TableCell align="center" sx={{ width: 90 }}>Profit</TableCell>
                      <TableCell align="center" sx={{ width: 50 }}>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.clonedVariations.map((v, i) => {
                      const profit = v.price - v.reseller_provider_price;
                      const isExpanded = expandedVarId === v.id;
                      const hasCustomDesc = v.desc && v.desc !== '';
                      const hasCustomSnk = v.snk && v.snk !== '';

                      return (
                        <React.Fragment key={v.id}>
                          <TableRow
                            hover
                            onClick={() => toggleExpand(v.id)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isExpanded ? alpha('#6366f1', 0.03) : 'transparent',
                              '&:hover': { bgcolor: isExpanded ? alpha('#6366f1', 0.06) : alpha('#000', 0.02) },
                            }}
                          >
                            {/* Expand Icon */}
                            <TableCell sx={{ p: 0.5 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'transform 0.2s',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                }}
                              >
                                {(hasCustomDesc || hasCustomSnk) ? (
                                  <Tooltip title="Ada deskripsi/ketentuan kustom">
                                    <Info sx={{ fontSize: 16, color: 'primary.main' }} />
                                  </Tooltip>
                                ) : (
                                  <ChevronRight sx={{ fontSize: 18, color: 'text.disabled' }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="standard"
                                size="small"
                                value={v.code}
                                onClick={e => e.stopPropagation()}
                                onChange={e => updateVariationField(i, 'code', e.target.value)}
                                sx={{ '& input': { fontSize: 12, fontFamily: 'monospace' } }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                variant="standard"
                                size="small"
                                value={v.title}
                                onClick={e => e.stopPropagation()}
                                onChange={e => updateVariationField(i, 'title', e.target.value)}
                                sx={{ '& input': { fontSize: 13 } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                {idr(v.reseller_provider_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                variant="standard"
                                size="small"
                                value={v.price}
                                onClick={e => e.stopPropagation()}
                                sx={{ width: 110, '& input': { fontSize: 13, textAlign: 'right' } }}
                                onChange={e => {
                                  const newPrice = parseInt(e.target.value) || 0;
                                  updateVariationField(i, 'price', newPrice);
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color={profit >= 0 ? 'success.main' : 'error.main'} fontWeight={600} sx={{ fontSize: 12 }}>
                                {idr(profit)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" onClick={e => e.stopPropagation()}>
                              <Tooltip title="Putuskan dari supplier">
                                <IconButton size="small" color="error" onClick={() => handleDisconnectVariation(v.id)}>
                                  <LinkOff sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2.5, bgcolor: alpha('#6366f1', 0.02) }}>
                                  <Stack spacing={2}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Description sx={{ fontSize: 18, color: 'primary.main' }} />
                                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: 13 }}>
                                        Deskripsi Variasi
                                      </Typography>
                                      {hasCustomDesc && (
                                        <Chip label="Kustom" size="small" color="primary" variant="outlined" sx={{ fontSize: 9, height: 18 }} />
                                      )}
                                    </Stack>
                                    <TextField
                                      placeholder="Kosongkan untuk menggunakan deskripsi supplier..."
                                      size="small"
                                      multiline
                                      rows={2}
                                      fullWidth
                                      value={v.desc || ''}
                                      onChange={e => updateVariationField(i, 'desc', e.target.value)}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: '#fff',
                                          fontSize: 13,
                                        },
                                      }}
                                    />

                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Gavel sx={{ fontSize: 18, color: 'warning.main' }} />
                                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: 13 }}>
                                        Syarat & Ketentuan Variasi
                                      </Typography>
                                      {hasCustomSnk && (
                                        <Chip label="Kustom" size="small" color="warning" variant="outlined" sx={{ fontSize: 9, height: 18 }} />
                                      )}
                                    </Stack>
                                    <TextField
                                      placeholder="Kosongkan untuk menggunakan SNK supplier..."
                                      size="small"
                                      multiline
                                      rows={2}
                                      fullWidth
                                      value={v.snk || ''}
                                      onChange={e => updateVariationField(i, 'snk', e.target.value)}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: '#fff',
                                          fontSize: 13,
                                        },
                                      }}
                                    />

                                    <Alert severity="info" sx={{ py: 0.5, borderRadius: 1.5, fontSize: 11 }}>
                                      Kosongkan field jika ingin menggunakan deskripsi/SNK dari supplier.
                                    </Alert>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {data.unclonedVariations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ mb: 1 }}>
                  Variasi Baru dari Supplier ({data.unclonedVariations.length})
                </Typography>
                <Alert severity="info" sx={{ borderRadius: 2, mb: 1, py: 0.5 }}>
                  Supplier menambahkan variasi baru. Klik ambil untuk menambahkan ke toko Anda.
                </Alert>
                <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'primary.light' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: 11 } }}>
                        <TableCell>Kode</TableCell>
                        <TableCell>Nama</TableCell>
                        <TableCell align="center">Harga Modal</TableCell>
                        <TableCell align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.unclonedVariations.map(v => (
                        <TableRow key={v.id} hover>
                          <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{v.code}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{v.title}</Typography></TableCell>
                          <TableCell align="center"><Typography variant="body2" color="text.secondary">{idr(v.price)}</Typography></TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<Add sx={{ fontSize: 14 }} />}
                              onClick={() => setCloneVarDialog({ open: true, variation: v })}
                              sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 11 }}
                            >
                              Ambil
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        <Divider />
        <FormControlLabel control={<Switch checked={data.showProduct} onChange={e => setData({ ...data, showProduct: e.target.checked })} size="small" />} label={<Typography variant="body2">Tampilkan Produk</Typography>} />
        <Divider />
        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button variant="contained" onClick={handleSave} fullWidth disabled={loading || !data.is_reseller_active} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Check />} sx={{ borderRadius: 2, py: 1.2, textTransform: 'none', fontWeight: 600 }}>Simpan Perubahan</Button>
          <Button variant="outlined" color="inherit" onClick={onDone} fullWidth disabled={loading} sx={{ borderRadius: 2, py: 1.2, textTransform: 'none' }}>Batal</Button>
        </Stack>
      </Stack>

      <CloneSingleVariationDialog open={cloneVarDialog.open} variation={cloneVarDialog.variation} onClose={() => setCloneVarDialog({ open: false, variation: null })} productId={id} onCloned={fetchDetail} />
    </Box>
  );
}

function ResellerMarketplace({ handleMenuClick }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [priceSort, setPriceSort] = useState('');
  const [hasVariation, setHasVariation] = useState('');
  const [total, setTotal] = useState(0);
  const debounceSearch = useDebounce(search, 400);
  const debounceSellerSearch = useDebounce(sellerSearch, 400);
  const abort = useRef(new AbortController());

  const fetchMarket = useCallback(async () => {
    setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const res = await reqOwner({
        action: 'v2GetAvailableResellerProducts',
        search: debounceSearch,
        sellerSearch: debounceSellerSearch,
        page,
        price_sort: priceSort,
        has_variation: hasVariation,
      }, { signal: abort.current.signal });
      if (!res.error) {
        setProducts(res.data?.rows || []);
        setTotal(res.data?.total || 0);
        setTotalPage(Math.ceil((res.data?.total || 0) / 20));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Gagal memuat marketplace');
    }
    setLoading(false);
  }, [debounceSearch, debounceSellerSearch, page, priceSort, hasVariation]);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  const handlePriceSortChange = (value) => {
    setPriceSort(prev => prev === value ? '' : value);
    setPage(1);
  };

  const handleHasVariationChange = (value) => {
    setHasVariation(prev => prev === value ? '' : value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSellerSearch('');
    setPriceSort('');
    setHasVariation('');
    setPage(1);
  };

  const hasActiveFilters = search || sellerSearch || priceSort || hasVariation;

  const handleChat = useCallback((product) => {
    localStorage.setItem('initResellerChatStockId', product.id);
    localStorage.setItem('initResellerChatIsCloned', 'false');
    localStorage.setItem('initResellerChatProductData', JSON.stringify({
      title: product.title,
      code: product.code,
      price: product.price,
      is_variation: product.is_variation,
      variations: product.variations || [],
    }));
    handleMenuClick?.('product', 'seller-chat');
  }, [handleMenuClick]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Storefront sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Marketplace Reseller {total > 0 && <Typography component="span" variant="inherit" color="primary" sx={{ opacity: 0.8 }}>({total.toLocaleString('id-ID')} Produk)</Typography>}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ambil produk dari supplier lain ke toko Anda
          </Typography>
        </Box>
      </Stack>

      {/* Marketplace Promotional Banners */}
      <MarketplaceBanner />

      {/* Search & Filter Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <TextField
          placeholder="Cari produk supplier..."
          size="small"
          fullWidth
          sx={{ maxWidth: { sm: 300 } }}
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSearch(''); setPage(1); }} sx={{ p: 0.25 }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <TextField
          placeholder="Cari Username Seller..."
          size="small"
          fullWidth
          sx={{ maxWidth: { sm: 250 } }}
          value={sellerSearch}
          onChange={(e) => { setSellerSearch(e.target.value); setPage(1); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            endAdornment: sellerSearch ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSellerSearch(''); setPage(1); }} sx={{ p: 0.25 }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Box sx={{ flex: 1 }} />

        {/* Sort Harga Filter */}
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Urutkan Harga</InputLabel>
          <Select
            value={priceSort}
            onChange={(e) => handlePriceSortChange(e.target.value)}
            label="Urutkan Harga"
          >
            <MenuItem value="">Default (Nama A-Z)</MenuItem>
            <MenuItem value="asc">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: 18, lineHeight: 1 }}>↗</Typography>
                <span>Termurah → Termahal</span>
              </Stack>
            </MenuItem>
            <MenuItem value="desc">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: 18, lineHeight: 1 }}>↘</Typography>
                <span>Termahal → Termurah</span>
              </Stack>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Variasi Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipe Produk</InputLabel>
          <Select
            value={hasVariation}
            onChange={(e) => handleHasVariationChange(e.target.value)}
            label="Tipe Produk"
          >
            <MenuItem value="">Semua Tipe</MenuItem>
            <MenuItem value="yes">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Category sx={{ fontSize: 16, color: '#8b5cf6' }} />
                <span>Ada Variasi</span>
              </Stack>
            </MenuItem>
            <MenuItem value="no">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Inventory2 sx={{ fontSize: 16, color: '#10b981' }} />
                <span>Tanpa Variasi</span>
              </Stack>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Tooltip title="Hapus semua filter">
            <IconButton
              size="small"
              onClick={handleClearFilters}
              sx={{
                color: 'error.main',
                bgcolor: alpha('#ef4444', 0.08),
                '&:hover': { bgcolor: alpha('#ef4444', 0.15) },
                transition: 'all 0.2s',
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Active Filters Chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}
            >
              {search && (
                <Chip
                  label={`Produk: "${search}"`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  onDelete={() => { setSearch(''); setPage(1); }}
                  sx={{ fontSize: 11, borderRadius: 2 }}
                  icon={<Search sx={{ fontSize: 14 }} />}
                />
              )}
              {sellerSearch && (
                <Chip
                  label={`Seller: "${sellerSearch}"`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  onDelete={() => { setSellerSearch(''); setPage(1); }}
                  sx={{ fontSize: 11, borderRadius: 2 }}
                  icon={<Person sx={{ fontSize: 14 }} />}
                />
              )}
              {priceSort && (
                <Chip
                  label={priceSort === 'asc' ? 'Harga: Termurah' : 'Harga: Termahal'}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onDelete={() => { setPriceSort(''); setPage(1); }}
                  sx={{ fontSize: 11, borderRadius: 2 }}
                  icon={
                    <Typography sx={{ fontSize: 14 }}>
                      {priceSort === 'asc' ? '↗' : '↘'}
                    </Typography>
                  }
                />
              )}
              {hasVariation && (
                <Chip
                  label={hasVariation === 'yes' ? 'Ada Variasi' : 'Tanpa Variasi'}
                  size="small"
                  variant="outlined"
                  color={hasVariation === 'yes' ? 'warning' : 'success'}
                  onDelete={() => { setHasVariation(''); setPage(1); }}
                  sx={{ fontSize: 11, borderRadius: 2 }}
                  icon={hasVariation === 'yes' ? <Category sx={{ fontSize: 14 }} /> : <Inventory2 sx={{ fontSize: 14 }} />}
                />
              )}
              <Chip
                label="Hapus Semua"
                size="small"
                variant="outlined"
                color="error"
                onClick={handleClearFilters}
                sx={{ fontSize: 11, borderRadius: 2, borderColor: alpha('#ef4444', 0.3), color: 'error.main' }}
              />
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      <Grid container spacing={2}>
        {loading ? [...Array(6)].map((_, i) => (
          <Grid item xs={6} sm={6} md={4} lg={3} xl={2} key={`sk-${i}`}>
            <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 0 }} />
              <CardContent sx={{ flex: 1 }}>
                <Skeleton width="80%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="50%" height={16} />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 2 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )) : products.length === 0 ? (
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center' }}>
              <Storefront sx={{ fontSize: 56, color: 'grey.300', mb: 1 }} />
              <Typography color="text.disabled" sx={{ fontSize: 15, mb: 1 }}>
                {hasActiveFilters ? 'Tidak ada produk yang sesuai filter' : 'Tidak ada produk yang tersedia'}
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearFilters}
                  sx={{ textTransform: 'none', mt: 0.5 }}
                >
                  Hapus filter untuk melihat semua produk
                </Button>
              )}
            </Card>
          </Grid>
        ) : products.map(p => (
          <Grid item xs={6} sm={6} md={4} lg={3} xl={2} key={p.id}>
            <OptimizedProductCard product={p} onAction={setCloneTarget} onChat={handleChat} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPage > 1 && (
        <Stack direction="row" justifyContent="center" alignItems="center" mt={3} spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Halaman {page} dari {totalPage}
          </Typography>
          <Pagination
            count={totalPage}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Stack>
      )}

      {/* Clone Dialog */}
      {cloneTarget && (
        <CloneProductDialog
          product={cloneTarget}
          open={!!cloneTarget}
          onClose={() => setCloneTarget(null)}
          onDone={() => { setCloneTarget(null); fetchMarket(); }}
          onChat={handleChat}
        />
      )}
    </Box>
  );
}

function CloneProductDialog({ product, open, onClose, onDone, onChat }) {
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [variations, setVariations] = useState([]);
  const isVariation = !!product?.is_variation;
  const providerVars = product?.variations || [];

  useEffect(() => {
    if (open && product) {
      setNewCode('');
      setVariations(providerVars.map(v => ({
        variationId: v.id,
        providerCode: v.code,
        providerTitle: v.title,
        basePrice: v.price,
        statusReseller: v.status_reseller || 'open',
        is_cloned: v.is_cloned || false,
        selected: !v.is_cloned,
        customCode: v.is_cloned ? '' : `RSL-${v.code}`,
        customPrice: '',
        error: false
      })));
    }
  }, [open, product]);

  const toggleSelect = (idx) => setVariations(prev => {
    const next = [...prev];
    next[idx] = { ...next[idx], selected: !next[idx].selected };
    return next;
  });

  const updateField = (idx, field, value) => setVariations(prev => {
    const next = [...prev];
    next[idx] = { ...next[idx], [field]: value, error: false };
    return next;
  });

  const selectedVars = variations.filter(v => v.selected && !v.is_cloned);
  const allPricesFilled = selectedVars.every(v => {
    const p = parseInt(v.customPrice);
    return !isNaN(p) && p >= 0;
  });
  const canSubmit = newCode.trim() && (isVariation ? selectedVars.length > 0 && allPricesFilled : true);

  const handleClone = async () => {
    if (!newCode.trim()) { toast.error('Kode produk baru wajib diisi'); return; }

    if (isVariation) {
      if (selectedVars.length === 0) { toast.error('Pilih minimal 1 variasi baru untuk diambil'); return; }
      if (!allPricesFilled) { toast.error('Isi semua harga jual untuk variasi yang dipilih'); return; }
    }

    setLoading(true);
    try {
      const payload = {
        action: 'v2CloneResellerProduct',
        providerStockId: product.id,
        newCode: newCode.trim(),
        selectedVariations: isVariation
          ? selectedVars.map(v => ({
            variationId: v.variationId,
            customCode: v.customCode,
            customPrice: parseInt(v.customPrice)
          }))
          : [{ customPrice: parseInt(variations[0]?.customPrice) || 0 }],
      };

      const res = await reqOwner(payload);
      if (res.error) { toast.error(res.message); setLoading(false); return; }
      toast.success(res.message || 'Produk berhasil di-clone!');
      onDone?.();
    } catch { toast.error('Gagal meng-clone produk'); }
    setLoading(false);
  };
  const totalAvailable = variations.filter(v => !v.is_cloned).length;
  const totalCloned = variations.filter(v => v.is_cloned).length;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ContentCopy sx={{ fontSize: 20, color: '#6366f1' }} />
        {product?.is_cloned && !isVariation ? 'Detail Produk' : 'Ambil Produk'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Product Info */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              component="img"
              src={product.thumbnail?.startsWith('http') ? product.thumbnail : `https://cdn.xoftware.id/f/${product.thumbnail}`}
              alt=""
              sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', bgcolor: 'grey.100', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>{product.title}</Typography>
              {isVariation ? (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                  <Chip label={`${totalAvailable} tersedia`} size="small" color="info" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  {totalCloned > 0 && (
                    <Chip label={`${totalCloned} sudah diambil`} size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Harga supplier: <b>{idr(product.price)}</b>
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider />
          {product?.is_cloned && !isVariation && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Produk ini sudah pernah di-ambil ke toko Anda. Anda tidak bisa mengambil ulang.
            </Alert>
          )}
          {isVariation && totalAvailable === 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Semua variasi sudah di-ambil. Anda bisa menambahkan variasi baru dari halaman edit produk.
            </Alert>
          )}
          {(!product?.is_cloned || isVariation) && (
            <TextField
              label="Kode Produk Baru"
              size="small"
              fullWidth
              required
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="contoh: produk-saya-1"
              helperText="Kode unik untuk produk Anda"
              disabled={product?.is_cloned && isVariation}
            />
          )}

          {/* Non-Variation Price */}
          {!isVariation && !product?.is_cloned && (
            <TextField
              label="Harga Jual (Rp)"
              type="number"
              size="small"
              fullWidth
              required
              value={variations[0]?.customPrice || ''}
              onChange={e => updateField(0, 'customPrice', e.target.value)}
              helperText="Minimal = harga supplier + fee platform"
            />
          )}
          {isVariation && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Pilih Variasi Baru ({selectedVars.length}/{totalAvailable})
                </Typography>
                {totalAvailable > 0 && (
                  <Button
                    size="small"
                    onClick={() => setVariations(prev => prev.map(v => !v.is_cloned ? { ...v, selected: true } : v))}
                    sx={{ textTransform: 'none', fontSize: 11 }}
                  >
                    Pilih Semua Baru
                  </Button>
                )}
              </Stack>

              {variations.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Tidak ada variasi tersedia dari supplier.
                </Alert>
              ) : (
                <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 600, fontSize: 11, py: 0.75 } }}>
                        <TableCell padding="checkbox" sx={{ pl: 1.5 }}>Status</TableCell>
                        <TableCell>Nama</TableCell>
                        <TableCell align="center" sx={{ width: 90 }}>Modal</TableCell>
                        <TableCell align="center" sx={{ width: 110 }}>Kode</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>Harga Jual</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {variations.map((v, i) => (
                        <TableRow
                          key={v.variationId}
                          hover
                          sx={{
                            opacity: v.is_cloned ? 0.5 : 1,
                            bgcolor: v.is_cloned ? alpha('#10b981', 0.03) : 'transparent'
                          }}
                        >
                          <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                            {v.is_cloned ? (
                              <Tooltip title="Sudah diambil">
                                <Chip
                                  label="Diambil"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: 9, height: 20, minWidth: 60 }}
                                  icon={<Check sx={{ fontSize: 10 }} />}
                                />
                              </Tooltip>
                            ) : (
                              <Switch
                                checked={v.selected}
                                onChange={() => toggleSelect(i)}
                                size="small"
                                color="primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: 13 }}>
                              {v.providerTitle}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                              {idr(v.basePrice)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {!v.is_cloned && v.selected ? (
                              <TextField
                                variant="standard"
                                size="small"
                                value={v.customCode}
                                onChange={e => updateField(i, 'customCode', e.target.value)}
                                sx={{ '& input': { fontSize: 12, fontFamily: 'monospace', textAlign: 'center' } }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                                {v.is_cloned ? '-' : v.customCode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {!v.is_cloned && v.selected ? (
                              <TextField
                                type="number"
                                variant="standard"
                                size="small"
                                value={v.customPrice}
                                onChange={e => updateField(i, 'customPrice', e.target.value)}
                                placeholder="0"
                                error={v.error}
                                sx={{ '& input': { fontSize: 13, textAlign: 'right' } }}
                                helperText={v.error ? 'Wajib diisi' : ''}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                                {v.is_cloned ? '-' : 'Pilih dulu'}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedVars.length > 0 && !allPricesFilled && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2, py: 0.5, fontSize: 12 }}>
                  Semua variasi yang dipilih wajib memiliki harga jual!
                </Alert>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          variant="outlined"
          onClick={() => {
            onClose();
            onChat?.(product);
          }}
          startIcon={<Chat sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.light',
              color: 'primary.main',
            },
          }}
        >
          Tanya Seller
        </Button>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Batal
        </Button>
        {!(product?.is_cloned && !isVariation) && !(isVariation && totalAvailable === 0) && (
          <Button
            variant="contained"
            onClick={handleClone}
            disabled={loading || !canSubmit}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ContentCopy sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {product?.is_cloned && isVariation ? 'Ambil Variasi Baru' : 'Ambil Sekarang'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function ResellerDistributionPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const debounceSearch = useDebounce(search, 400);
  const abort = useRef(new AbortController());

  const fetchData = useCallback(async () => {
    setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const res = await reqOwner({ action: 'v2GetResellerDistribution', search: debounceSearch }, { signal: abort.current.signal });
      if (res.error) { toast.error(res.message); return; }
      const rows = (res.data?.rows || []).filter(p => { if (!debounceSearch) return true; return p.title?.toLowerCase().includes(debounceSearch.toLowerCase()); });
      setProducts(rows);
      if (rows.length > 0 && !selectedProduct) setSelectedProduct(rows[0]);
      else if (rows.length > 0) { const still = rows.find(p => p.id === selectedProduct?.id); if (still) setSelectedProduct(still); else setSelectedProduct(rows[0]); }
      else setSelectedProduct(null);
    } catch (err) { if (err?.name !== 'AbortError') toast.error('Gagal memuat data'); }
    setLoading(false);
  }, [debounceSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (clonedStockId, currentActive) => {
    setTogglingId(clonedStockId);
    try {
      const res = await reqOwner({ action: 'v2ToggleResellerProductActive', clonedStockId, isActive: !currentActive });
      if (res.error) { toast.error(res.message); return; }
      toast.success(res.message);
      fetchData();
    } catch { toast.error('Gagal mengubah status'); }
    setTogglingId(null);
  };

  const clones = selectedProduct?.clones || [];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Storefront sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box><Typography variant="h6" fontWeight={700}>Distribusi Reseller</Typography><Typography variant="caption" color="text.secondary">Kelola produk yang di-clone oleh reseller</Typography></Box>
      </Stack>
      <Alert severity="info" icon={<Info sx={{ fontSize: 16 }} />} sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>Nonaktifkan = produk clone tidak bisa dijual reseller. Tutup status reseller = putus semua hubungan clone.</Alert>
      <TextField placeholder="Cari produk..." size="small" fullWidth sx={{ mb: 2, maxWidth: 400 }} value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />

      <Stack direction="row" spacing={2} sx={{ gap: 2 }}>
        <Box sx={{ width: { xs: '100%', md: '45%' }, flexShrink: 0 }}>
          {loading ? (
            <Stack spacing={1.5}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2 }} />)}</Stack>
          ) : products.length === 0 ? (
            <Card variant="outlined" sx={{ borderRadius: 3, py: 6, textAlign: 'center' }}><Typography color="text.disabled">Belum ada produk reseller</Typography></Card>
          ) : (
            <Stack spacing={1}>{products.map(p => (
              <Card key={p.id} variant="outlined" onClick={() => setSelectedProduct(p)} sx={{
                borderRadius: 2.5, cursor: 'pointer', transition: 'all 0.15s', border: '2px solid',
                borderColor: selectedProduct?.id === p.id ? '#6366f1' : 'divider',
                bgcolor: selectedProduct?.id === p.id ? alpha('#6366f1', 0.04) : 'transparent',
                '&:hover': { borderColor: selectedProduct?.id === p.id ? '#6366f1' : 'grey.400' },
              }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {p.thumbnail && <Box component="img" src={p.thumbnail?.startsWith('http') ? p.thumbnail : `https://cdn.xoftware.shop/f/${p.thumbnail}`} alt="" sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{p.title}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                      <Chip label={p.total_clone} size="small" color="primary" sx={{ fontSize: 10, height: 18, minWidth: 20, fontWeight: 600 }} />
                      <Chip label={`${p.active_clone} aktif`} size="small" color="success" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                      {p.inactive_clone > 0 && <Chip label={`${p.inactive_clone} off`} size="small" color="error" variant="outlined" sx={{ fontSize: 10, height: 18 }} />}
                      {p.is_variation && <Chip label="variasi" size="small" color="default" variant="outlined" sx={{ fontSize: 10, height: 18 }} />}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            ))}</Stack>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!selectedProduct ? (
            <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center' }}>
              <Storefront sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.disabled">Pilih produk untuk melihat reseller</Typography>
            </Card>
          ) : (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>{selectedProduct.title}</Typography>
                <IconButton size="small" onClick={fetchData}><Refresh sx={{ fontSize: 18 }} /></IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {clones.length} reseller • {clones.filter(c => c.is_reseller_active).length} aktif • {clones.filter(c => !c.is_reseller_active).length} nonaktif
              </Typography>

              {clones.length === 0 ? (
                <Card variant="outlined" sx={{ borderRadius: 3, py: 5, textAlign: 'center' }}>
                  <Typography color="text.disabled">Belum ada reseller yang clone produk ini</Typography>
                </Card>
              ) : (
                <TableContainer component={Card} sx={{ borderRadius: 2.5, overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' } }}>
                        <TableCell>Reseller</TableCell>
                        <TableCell>Kode</TableCell>
                        <TableCell align="center">Tanggal ambil</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clones.map(c => (
                        <TableRow key={c.id} hover sx={{ '& td': { fontSize: 13 } }}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{c['Bot.name'] || c['Bot.store_name'] || '-'}</Typography>
                              <Typography variant="caption" color="text.disabled">@{c['Bot.username'] || '-'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{c.code}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" color="text.secondary">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={c.is_reseller_active ? 'Aktif' : 'Nonaktif'} size="small" color={c.is_reseller_active ? 'success' : 'error'} sx={{ fontSize: 10, height: 22, fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={c.is_reseller_active ? 'Nonaktifkan' : 'Aktifkan'}>
                              <Switch
                                checked={c.is_reseller_active}
                                onChange={() => handleToggle(c.id, c.is_reseller_active)}
                                size="small"
                                color="success"
                                disabled={togglingId === c.id}
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function BlockedView({ title = 'Access denied!', subtitle, onDeposit }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
      <Lock sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography color="text.disabled">{title}</Typography>

      {/* Upgrade Star Seller Card */}
      <Card
        elevation={0}
        sx={{
          maxWidth: 440,
          width: '100%',
          mt: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1b23 0%, #1e1f2b 100%)'
              : '#fff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Accent top bar */}
        <Box
          sx={{
            height: 4,
            background: 'linear-gradient(90deg, #f5a623, #ff6b35)',
          }}
        />

        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Heading */}
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(90deg, #f5a623, #ff6b35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              lineHeight: 1.4,
            }}
          >
            UPGRADE STAR SELLER: MAKSIMALKAN CUAN SEKARANG! 🚀
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.7 }}
          >
            Ingin jualan makin laris tanpa potongan biaya? Saatnya Upgrade ke
            Star Seller! Nikmati beragam keuntungan eksklusif:
          </Typography>

          {/* Benefits list */}
          <Stack gap={1.5}>
            <Stack direction="row" alignItems="flex-start" gap={1.2}>
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 166, 35, 0.1)',
                  flexShrink: 0,
                  mt: 0.2,
                }}
              >
                <RocketLaunch sx={{ fontSize: 15, color: '#f5a623' }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                  Booster Penjualan
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Produk Anda tampil di baris terdepan Marketplace Xoftware.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="flex-start" gap={1.2}>
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(52, 211, 153, 0.1)',
                  flexShrink: 0,
                  mt: 0.2,
                }}
              >
                <Public sx={{ fontSize: 15, color: '#34d399' }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                  Jangkauan Luas
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Tarik ribuan pelanggan baru setiap harinya secara otomatis.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="flex-start" gap={1.2}>
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 107, 53, 0.1)',
                  flexShrink: 0,
                  mt: 0.2,
                }}
              >
                <LocalFireDepartment sx={{ fontSize: 15, color: '#ff6b35' }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                  Profit 100% Untuk Anda
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Nikmati Bebas Biaya Layanan dan Fee Platform! 🔥
                </Typography>
              </Box>
            </Stack>
          </Stack>

          {/* CTA Button */}
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => onDeposit?.()}
            sx={{
              mt: 2.5,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              background: 'linear-gradient(90deg, #f5a623, #ff6b35)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(90deg, #e6951a, #f05a2a)',
              },
            }}
          >
            Upgrade ke Star Seller Sekarang
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ResellerManagementPage({ handleMenuClick }) {
  const { checking, allowed, message } = useSellerGate();
  const [activeTab, setActiveTab] = useState('reseller-info');

  const tabs = [
    { key: 'reseller-info', label: 'Info Reseller' },
    { key: 'reseller-marketplace', label: 'Marketplace Reseller' },
    { key: 'seller-chat', label: 'Reseller Chat' },
    { key: 'reseller-distribution', label: 'Distribusi Reseller' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'reseller-info':
        return <ResellerTransactionPage />;
      case 'reseller-marketplace':
        return <ResellerMarketplace handleMenuClick={handleMenuClick} />;
      case 'seller-chat':
        return <SellerChatPage />;
      case 'reseller-distribution':
        if (checking) {
          return (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
              <CircularProgress />
              <Typography color="text.disabled">Checking access…</Typography>
            </Stack>
          );
        }
        if (!allowed) return <BlockedView title="Access denied!" onDeposit={() => handleMenuClick('product', 'seller-profile')} />;
        return <ResellerDistributionPage />;
      default:
        return <ResellerTransactionPage />;
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </Box>
  );
}

function ProductManagementPage({ handleMenuClick }) {
  const { checking, allowed, message } = useSellerGate();
  const [activeTab, setActiveTab] = useState('product-list');

  const tabs = [
    { key: 'product-list', label: 'Daftar Produk' },
    { key: 'recap-product', label: 'Rekap Produk' },
    { key: 'product-rating', label: 'Ulasan Produk' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'product-list':
        return (
          <ProductTableV2
            allowSellerStar={allowed}
            onAdd={() => handleMenuClick('product', 'product-add')}
            onEdit={(row) => {
              if (row.reseller_provider_bot_id) {
                localStorage.setItem('editingResellerProductId', row.id);
                handleMenuClick('product', 'product-edit-reseller');
              } else {
                localStorage.setItem('editingProductId', row.id);
                handleMenuClick('product', 'product-edit');
              }
            }}
          />
        );
      case 'recap-product':
        return <RecapProductPage />;
      case 'product-rating':
        return <ProductRatingList />;
      default:
        return (
          <ProductTableV2
            allowSellerStar={allowed}
            onAdd={() => handleMenuClick('product', 'product-add')}
            onEdit={(row) => {
              if (row.reseller_provider_bot_id) {
                localStorage.setItem('editingResellerProductId', row.id);
                handleMenuClick('product', 'product-edit-reseller');
              } else {
                localStorage.setItem('editingProductId', row.id);
                handleMenuClick('product', 'product-edit');
              }
            }}
          />
        );
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </Box>
  );
}

export default function ProductManage({ activeSubPage, handleMenuClick }) {
  const { checking, allowed, message } = useSellerGate();
  switch (activeSubPage) {
    case 'product-add':
      localStorage.removeItem('editingProductId');
      localStorage.removeItem('editingResellerProductId');
      return <ProductFormV2 allowSellerStar={allowed} mode="add" onDone={() => handleMenuClick('product', 'product-list')} />;
    case 'product-edit': {
      const id = localStorage.getItem('editingProductId');
      return (
        <ProductFormV2
          allowSellerStar={allowed}
          mode="edit" id={id}
          onDone={() => { localStorage.removeItem('editingProductId'); handleMenuClick('product', 'product-list'); }}
        />
      );
    }
    case 'product-edit-reseller': {
      const resellerId = localStorage.getItem('editingResellerProductId');
      return (
        <ClonedResellerProductForm
          allowSellerStar={allowed}
          id={resellerId}
          handleMenuClick={handleMenuClick}
          onDone={() => { localStorage.removeItem('editingResellerProductId'); handleMenuClick('product', 'product-list'); }}
        />
      );
    }
    case 'product-list':
      return <ProductManagementPage handleMenuClick={handleMenuClick} />;
    case 'product-level': return <Level />;
    case 'recap-dashboard': return <RecapDashboardPage />;
    case 'reseller-info': return <ResellerManagementPage handleMenuClick={handleMenuClick} />;
    case 'seller-profile': return <SellerProfilePage />;
    case 'voucher-list':
    default:
      return <VoucherList />;
  }
}