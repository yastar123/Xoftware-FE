import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Skeleton,
  Pagination,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Switch,
  FormControlLabel,
  alpha,
  CircularProgress,
} from '@mui/material';
import { People, Edit, Block, LockOpen, SyncAlt, CalendarToday, FilterList } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { idr } from '@/lib/helper';

const formatMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const formatMonthLabel = (m) => {
  if (!m) return '-';
  const [y, mo] = m.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${months[parseInt(mo, 10) - 1]} ${y}`;
};

export default function UsersManagePage() {
  /* ── Table state ── */
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ── Query state ── */
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [sort, setSort] = useState('created_new');
  const [month, setMonth] = useState(formatMonth());

  /* ── Modals state ── */
  const [openEdit, setOpenEdit] = useState(false);
  const [openBan, setOpenBan] = useState(false);

  /* ── Form states ── */
  const [formEdit, setFormEdit] = useState({ id: null, name: '', group: '', saldo: '', is_ban: false });
  const [targetBan, setTargetBan] = useState({ id: null, display: '', is_ban: false });

  const [submitting, setSubmitting] = useState(false);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch ── */
  const fetchUsers = async (pg = page) => {
    try {
      setLoading(true);
      const payload = { action: 'getUser', page: pg, limit: rowsPerPage, sort, month };
      if (search) payload.search = search;
      if (group) payload.group = group;

      const res = await reqOwner(payload);
      const data = res?.data || {};
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setCount(Number(data.count || 0));
    } catch {
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, group, sort, month]);

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, group, sort, month]);

  /* ── Initial loading (centered spinner like ServiceInfoPage) ── */
  if (loading && rows.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Memuat data user...</Typography>
      </Stack>
    );
  }

  /* ── Skeleton rows for subsequent loads ── */
  const renderSkeleton = () =>
    Array.from({ length: rowsPerPage }).map((_, idx) => (
      <TableRow key={idx}>
        {Array(15)
          .fill(0)
          .map((__, j) => (
            <TableCell key={j} align="center">
              <Skeleton variant="text" width="70%" height={18} />
            </TableCell>
          ))}
      </TableRow>
    ));

  const sortOptions = [
    { value: 'created_new', label: 'Created: Terbaru' },
    { value: 'created_old', label: 'Created: Terlama' },
    { value: 'id', label: 'ID (Naik)' },
    { value: 'name', label: 'Nama A→Z' },
    { value: 'sum_amount_all_desc', label: 'Total Amount ALL ↓' },
    { value: 'sum_amount_all_asc', label: 'Total Amount ALL ↑' },
    { value: 'sum_amount_month_desc', label: 'Amount Bulan ↓' },
    { value: 'sum_amount_month_asc', label: 'Amount Bulan ↑' },
  ];


  /* ── Handlers — Edit ── */
  const onOpenEdit = (row) => {
    setFormEdit({
      id: row.id,
      name: row.name || '',
      group: row.platform_user || '',
      saldo: row.saldo ?? '',
      is_ban: Boolean(row.is_ban || false),
    });
    setOpenEdit(true);
  };
  const onSubmitEdit = async () => {
    try {
      setSubmitting(true);
      const id = Number(formEdit.id);
      const name = typeof formEdit.name === 'string' ? formEdit.name.trim() : undefined;
      const group = formEdit.group || undefined;
      const saldo = formEdit.saldo === '' ? undefined : Number(formEdit.saldo);
      const is_ban = Boolean(formEdit.is_ban);

      if (!id) return toast.warn('ID tidak valid');
      if (name && name.length > 50) return toast.warn('Nama maksimal 50 karakter');
      if (saldo != null && Number.isNaN(saldo)) return toast.warn('Saldo harus angka');
      if (group && !['whatsapp', 'telegram'].includes(group)) return toast.warn('Group harus whatsapp/telegram');

      await reqOwner({ action: 'updateUser', id, name, group, saldo, is_ban });
      toast.success('User berhasil diupdate');
      setOpenEdit(false);
      fetchUsers(page);
    } catch (e) {
      toast.error(e?.message || 'Gagal update user');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Handlers — Ban/Unban ── */
  const onOpenBan = (row) => {
    setTargetBan({ id: row.id, display: `${row.sender?.split('@')?.[0] || '-'} (#${row.id})`, is_ban: row.is_ban });
    setOpenBan(true);
  };
  const onSubmitBan = async () => {
    try {
      setSubmitting(true);
      const id = Number(targetBan.id);
      const nextStatus = !targetBan.is_ban;
      if (!id) return toast.warn('ID tidak valid');

      await reqOwner({ action: 'updateUser', id, is_ban: nextStatus });
      toast.success(nextStatus ? 'User berhasil diblokir' : 'User berhasil dipulihkan');
      setOpenBan(false);
      fetchUsers(page);
    } catch (e) {
      toast.error(e?.message || 'Gagal memproses permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* ═══════ Header ═══════ */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <People sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>Kelola User</Typography>
          <Typography variant="caption" color="text.secondary">
            Cari, filter, sortir, dan pantau agregat transaksi bulanan
          </Typography>
        </Box>
      </Stack>

      {/* ═══════ Stat cards ═══════ */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                  <People sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total User</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{count}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#10b981', 0.08), color: '#10b981', display: 'grid', placeItems: 'center' }}>
                  <CalendarToday sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Bulan</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{formatMonthLabel(month)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                  <FilterList sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Platform</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {group === '' ? 'Semua' : group === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ═══════ Filter card ═══════ */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Filter & Pencarian</Typography>
            <Button
              size="small"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SyncAlt sx={{ fontSize: 16 }} />}
              onClick={() => fetchUsers(1)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Refresh
            </Button>
          </Stack>

          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label="Cari (nama / WhatsApp / ID Telegram)"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                sx={{ borderRadius: 2 }}
              />
            </Grid>

            {/* Platform quick-chips */}
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['', 'whatsapp', 'telegram'].map((g) => (
                  <Chip
                    key={g}
                    label={g === '' ? 'Semua' : g === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                    onClick={() => setGroup(g)}
                    variant={group === g ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: group === g ? 700 : 400,
                    }}
                    color={g === 'whatsapp' ? 'success' : g === 'telegram' ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Sort */}
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="sort-label">Sort</InputLabel>
                <Select
                  labelId="sort-label"
                  label="Sort"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {sortOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Month */}
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Bulan"
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                inputProps={{ max: formatMonth() }}
                InputLabelProps={{ shrink: true }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          </Grid>

        </CardContent>
      </Card>

      {/* ═══════ Table card ═══════ */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
        <Table
          size="small"
          sx={{
            minWidth: 1200,
            '& thead th': {
              fontWeight: 600,
              fontSize: 12,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              borderBottom: '2px solid',
              borderColor: 'divider',
              py: 1.5,
            },
            '& tbody td': {
              fontSize: 13,
              color: 'text.secondary',
              borderBottom: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              py: 1.2,
            },
            '& tbody tr:hover': {
              backgroundColor: alpha('#6366f1', 0.03),
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center">No</TableCell>
              <TableCell align="center">User (ID)</TableCell>
              <TableCell align="center">Name/Username</TableCell>
              <TableCell align="center">Platform</TableCell>
              <TableCell align="center">Saldo</TableCell>
              <TableCell align="center">Total Amount ALL</TableCell>
              <TableCell align="center">Amount Bulan</TableCell>
              <TableCell align="center">Count Bulan</TableCell>
              <TableCell align="center">QRIS Bulan</TableCell>
              <TableCell align="center">QRIS Tx</TableCell>
              <TableCell align="center">Mutasi In</TableCell>
              <TableCell align="center">Mutasi Out</TableCell>
              <TableCell align="center">Mutasi Net</TableCell>
              <TableCell align="center">Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? renderSkeleton()
              : rows.map((row, idx) => {
                  const monthly = row?.monthly || {};
                  const totals = row?.totals || {};
                  return (
                    <TableRow key={row.id || idx}>
                      <TableCell align="center">{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={600} color="text.primary">
                          {row.sender?.split('@')?.[0] || '-'}
                        </Typography>
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          <Typography variant="caption" color="text.disabled">({row.id})</Typography>
                          {row.is_ban && (
                            <Chip 
                              label="Banned" 
                              size="small" 
                              color="error" 
                              sx={{ height: 16, fontSize: 9, fontWeight: 700, borderRadius: 1 }} 
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{row.name}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row.platform_user || '-'}
                          sx={{
                            borderRadius: 1.5,
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor: row.platform_user === 'whatsapp'
                              ? alpha('#10b981', 0.1)
                              : row.platform_user === 'telegram'
                                ? alpha('#6366f1', 0.1)
                                : alpha('#9ca3af', 0.1),
                            color: row.platform_user === 'whatsapp'
                              ? '#10b981'
                              : row.platform_user === 'telegram'
                                ? '#6366f1'
                                : '#9ca3af',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">{idr(Number(row.saldo || 0))}</TableCell>
                      <TableCell align="center">{idr(Number(totals.payments_amount_all || 0))}</TableCell>
                      <TableCell align="center">{idr(Number(monthly.payments_amount || 0))}</TableCell>
                      <TableCell align="center">{Number(monthly.payments_count || 0)}</TableCell>
                      <TableCell align="center">{idr(Number(monthly.qris_amount || 0))}</TableCell>
                      <TableCell align="center">{Number(monthly.qris_tx_count || 0)}</TableCell>
                      <TableCell align="center">{idr(Number(monthly.mutation_in || 0))}</TableCell>
                      <TableCell align="center">{idr(Number(monthly.mutation_out || 0))}</TableCell>
                      <TableCell align="center">{idr(Number(monthly.mutation_net || 0))}</TableCell>
                      <TableCell align="center">{row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => onOpenEdit(row)}
                              sx={{ color: '#6366f1', '&:hover': { bgcolor: alpha('#6366f1', 0.08) } }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={row.is_ban ? "Unban User" : "Ban User"}>
                            <IconButton
                              size="small"
                              onClick={() => onOpenBan(row)}
                              sx={{ color: row.is_ban ? '#10b981' : '#ef4444', '&:hover': { bgcolor: row.is_ban ? alpha('#10b981', 0.08) : alpha('#ef4444', 0.08) } }}
                            >
                              {row.is_ban ? <LockOpen fontSize="small" /> : <Block fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </Card>

      {/* ═══════ Pagination ═══════ */}
      {!loading && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 2.5, mb: 1 }}>
          <Pagination
            count={Math.ceil(count / rowsPerPage) || 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            boundaryCount={1}
            siblingCount={2}
            showFirstButton
            showLastButton
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 500 },
              '& .Mui-selected': {
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                fontWeight: 700,
                '&:hover': { bgcolor: alpha('#6366f1', 0.15) },
              },
            }}
          />
        </Stack>
      )}


      {/* ═══════ Edit Dialog ═══════ */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nama"
              fullWidth
              size="small"
              value={formEdit.name}
              onChange={e => setFormEdit(s => ({ ...s, name: e.target.value }))}
              inputProps={{ maxLength: 50 }}
              helperText={`${(formEdit.name || '').length}/50`}
              sx={{ borderRadius: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="group-edit-label">Group</InputLabel>
                  <Select
                    labelId="group-edit-label"
                    label="Group"
                    value={formEdit.group || ''}
                    onChange={e => setFormEdit(s => ({ ...s, group: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">(kosong)</MenuItem>
                    <MenuItem value="whatsapp">whatsapp</MenuItem>
                    <MenuItem value="telegram">telegram</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Saldo (absolute)"
                  fullWidth
                  size="small"
                  value={formEdit.saldo}
                  onChange={e => setFormEdit(s => ({ ...s, saldo: e.target.value }))}
                  type="number"
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={formEdit.is_ban}
                  onChange={e => setFormEdit(s => ({ ...s, is_ban: e.target.checked }))}
                />
              }
              label="Ban User"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: 14 } }}
            />
            <Typography variant="caption" color="text.disabled">
              Note: Penambahan saldo Max Rp1.000.000
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEdit(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button
            onClick={onSubmitEdit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════ Ban/Unban Dialog ═══════ */}
      <Dialog open={openBan} onClose={() => setOpenBan(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{targetBan.is_ban ? 'Unban User' : 'Ban User'}</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {targetBan.is_ban 
              ? <span>Yakin mau memulihkan akses (Unban) untuk user <b>{targetBan.display}</b>?</span>
              : <span>Yakin mau memblokir akses (Ban) untuk user <b>{targetBan.display}</b>? User ini tidak akan bisa melakukan transaksi apapun.</span>
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenBan(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button
            onClick={onSubmitBan}
            color={targetBan.is_ban ? 'success' : 'error'}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {submitting ? 'Memproses...' : (targetBan.is_ban ? 'Unban User' : 'Ban User')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}