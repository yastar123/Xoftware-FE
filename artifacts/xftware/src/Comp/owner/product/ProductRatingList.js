import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, Grid, Switch, FormControlLabel, CircularProgress, alpha,
  Rating, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  StarRounded, Warning, DeleteSweep, Search, CheckCircle,
  Refresh, Inventory2
} from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { useDebounce } from '@/Hook/debouncingState';
import dayjs from 'dayjs';

export default function ProductRatingList() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, average: 0 });
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [form, setForm] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    rating: 'all'
  });
  const debouncedSearch = useDebounce(form.search, 500);

  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const abort = useRef(new AbortController());

  // Check Feature Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await reqOwner({ action: 'rating.featureStatus' });
      if (!res.error) {
        setFeatureEnabled(res.data?.enable_review || false);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    abort.current.abort();
    abort.current = new AbortController();
    try {
      const payload = {
        action: 'rating.getList',
        page: form.page,
        limit: form.limit,
      };
      if (debouncedSearch) payload.search_user = debouncedSearch;
      if (form.rating !== 'all') {
        payload.rating_min = parseInt(form.rating);
        payload.rating_max = parseInt(form.rating);
      }
      if (form.status === 'published') {
        payload.is_hidden = false;
        payload.has_delete_request = false;
      } else if (form.status === 'pending_delete') {
        payload.has_delete_request = true;
        payload.is_hidden = false;
      } else if (form.status === 'deleted') {
        payload.is_hidden = true;
      }

      const res = await reqOwner(payload, { signal: abort.current.signal });

      if (!res.error) {
        setRatings(res.data?.data || []);
        setTotalPage(res.data?.totalPages || Math.ceil((res.data?.total || 0) / form.limit));
        setStats({ total: res.data?.total || 0, average: res.data?.avg_rating || 0 });
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Gagal memuat ulasan');
    } finally {
      setLoading(false);
    }
  }, [form.page, form.limit, debouncedSearch, form.status, form.rating]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handleToggleFeature = async (e) => {
    const checked = e.target.checked;
    setToggling(true);
    try {
      const res = await reqOwner({ action: 'rating.toggleFeature', enable: checked });
      if (res.error) throw new Error(res.message);
      setFeatureEnabled(checked);
      toast.success(`Fitur ulasan berhasil ${checked ? 'diaktifkan' : 'dimatikan'}`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status fitur ulasan');
    } finally {
      setToggling(false);
    }
  };

  const handleRequestDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Alasan penghapusan harus diisi');
      return;
    }
    setSubmittingDelete(true);
    try {
      const res = await reqOwner({
        action: 'rating.requestDelete',
        rating_id: deleteDialog.id,
        reason: deleteReason
      });
      if (res.error) throw new Error(res.message);
      toast.success('Permintaan hapus ulasan berhasil dikirim ke developer');
      setDeleteDialog(null);
      setDeleteReason('');
      fetchRatings();
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim permintaan hapus');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'published':
        return <Chip label="Publik" size="small" color="success" variant="outlined" />;
      case 'pending_delete':
        return <Chip label="Menunggu Dihapus" size="small" color="warning" variant="outlined" />;
      case 'deleted':
        return <Chip label="Dihapus" size="small" color="error" variant="outlined" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status Fitur Ulasan</Typography>
                <FormControlLabel
                  control={<Switch checked={featureEnabled} onChange={handleToggleFeature} disabled={toggling} color="primary" />}
                  label={
                    <Typography variant="body1" fontWeight={700} color={featureEnabled ? 'success.main' : 'error.main'}>
                      {featureEnabled ? 'AKTIF' : 'NONAKTIF'}
                    </Typography>
                  }
                  sx={{ mt: 1, ml: 0 }}
                />
              </Box>
              {toggling && <CircularProgress size={24} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Ulasan</Typography>
              <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mt: 1 }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Rata-rata Rating</Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="h4" fontWeight={800} color="warning.main">
                  {parseFloat(stats.average).toFixed(1)}
                </Typography>
                <Rating value={parseFloat(stats.average)} precision={0.1} readOnly size="small" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          placeholder="Cari produk atau pembeli..."
          size="small"
          fullWidth
          value={form.search}
          onChange={e => setForm({ ...form, search: e.target.value, page: 1 })}
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
          }}
          sx={{ maxWidth: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={form.status}
            label="Status"
            onChange={e => setForm({ ...form, status: e.target.value, page: 1 })}
          >
            <MenuItem value="all">Semua</MenuItem>
            <MenuItem value="published">Publik</MenuItem>
            <MenuItem value="pending_delete">Menunggu Hapus</MenuItem>
            <MenuItem value="deleted">Dihapus</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Bintang</InputLabel>
          <Select
            value={form.rating}
            label="Bintang"
            onChange={e => setForm({ ...form, rating: e.target.value, page: 1 })}
          >
            <MenuItem value="all">Semua Bintang</MenuItem>
            <MenuItem value="5">5 Bintang</MenuItem>
            <MenuItem value="4">4 Bintang</MenuItem>
            <MenuItem value="3">3 Bintang</MenuItem>
            <MenuItem value="2">2 Bintang</MenuItem>
            <MenuItem value="1">1 Bintang</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button variant="outlined" size="small" onClick={fetchRatings} startIcon={<Refresh />}>
          Segarkan
        </Button>
      </Stack>

      <TableContainer component={Card} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: alpha('#6366f1', 0.04), fontWeight: 600 } }}>
              <TableCell>Produk</TableCell>
              <TableCell>Pembeli</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell>Ulasan</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Waktu</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : ratings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Inventory2 sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Belum ada data ulasan</Typography>
                </TableCell>
              </TableRow>
            ) : (
              ratings.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.recap_product?.title || row.stock?.title || 'Unknown Product'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      ID: {row.stock_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.user?.name || row.user?.sender || 'Unknown User'}</Typography>
                    <Typography variant="caption" color="text.secondary">Trx: {row.recap_product_id}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" alignItems="center" justifyContent="center">
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 0.5 }}>{row.rating}</Typography>
                      <StarRounded sx={{ fontSize: 16, color: '#f59e0b' }} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 250, whiteSpace: 'pre-wrap' }}>
                      {row.ulasan || <span style={{ color: '#999', fontStyle: 'italic' }}>Tanpa teks ulasan</span>}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(row.is_hidden ? 'deleted' : row.delete_requested_at ? 'pending_delete' : 'published')}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption">{dayjs(row.createdAt).format('DD MMM YYYY HH:mm')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {!row.is_hidden ? (
                      <Tooltip title="Ajukan Hapus (Ke Developer)">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog(row)}>
                          <DeleteSweep fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPage > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid divider' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button size="small" disabled={form.page === 1} onClick={() => setForm({ ...form, page: form.page - 1 })}>Prev</Button>
              <Typography variant="caption">Halaman {form.page} dari {totalPage}</Typography>
              <Button size="small" disabled={form.page === totalPage} onClick={() => setForm({ ...form, page: form.page + 1 })}>Next</Button>
            </Stack>
          </Box>
        )}
      </TableContainer>

      <Dialog open={Boolean(deleteDialog)} onClose={() => !submittingDelete && setDeleteDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" fontSize="small" />
          Ajukan Hapus Ulasan
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Apakah Anda yakin ingin mengajukan penghapusan ulasan ini ke Developer?
            Mohon sertakan alasan yang valid (misal: spam, kata kasar, dll).
          </Typography>

          <Box sx={{ p: 1.5, bgcolor: alpha('#f59e0b', 0.1), borderRadius: 2, mb: 2 }}>
            <Rating value={deleteDialog?.rating || 0} readOnly size="small" />
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              &quot;{deleteDialog?.ulasan || 'Tanpa teks ulasan'}&quot;
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Alasan Penghapusan"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Ketikkan alasan mengapa ulasan ini perlu dihapus..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} disabled={submittingDelete} color="inherit">Batal</Button>
          <Button
            onClick={handleRequestDelete}
            color="error"
            variant="contained"
            disabled={submittingDelete || !deleteReason.trim()}
            startIcon={submittingDelete ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          >
            Ajukan Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
