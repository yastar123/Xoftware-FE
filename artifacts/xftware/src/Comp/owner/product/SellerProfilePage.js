// file: pages/SellerProfilePage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Button,
  Chip, Skeleton, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Tooltip, alpha,
  LinearProgress, Avatar, Badge, TextField, CircularProgress
} from '@mui/material';
import {
  Storefront, Star, Lock, Edit, CloudUpload, Info, Warning,
  CheckCircle, Cancel, Schedule, Shield, AccountBalance,
  TrendingUp, Inventory2, People, Receipt, Gavel,
  Close, Save, RocketLaunch, Public, LocalFireDepartment
} from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { idr, fileToBase64 } from '@/lib/helper';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const STATUS_CFG = {
  none: { label: 'REGULAR SELLER', color: 'default' },
  eligible: { label: 'ELIGIBLE', color: 'info' },
  pending_deposit: { label: 'MENUNGGU PEMBAYARAN', color: 'warning' },
  deposit_paid: { label: 'DEPOSIT TERBAYAR', color: 'info' },
  active: { label: 'STAR SELLER', color: 'success' },
  downgrading: { label: 'PROSES BERHENTI', color: 'warning' },
  inactive: { label: 'NON-AKTIF', color: 'error' },
};

function MiniStatCard({ icon, label, value, color = '#6366f1', loading }) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha(color, 0.08), color, display: 'grid', placeItems: 'center' }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{label}</Typography>
            {loading ? <Skeleton width={70} height={20} /> : (
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 14 }}>{value}</Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max, label, fmt }) {
  const pct = Math.min(100, (value / max) * 100);
  const done = value >= max;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>{label}</Typography>
        <Typography variant="caption" color={done ? 'success.main' : 'text.secondary'} fontWeight={600} sx={{ fontSize: 11 }}>
          {fmt(value)} / {fmt(max)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8, borderRadius: 4,
          bgcolor: alpha(done ? '#10b981' : '#6366f1', 0.1),
          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: done ? '#10b981' : '#6366f1' },
        }}
      />
      <Typography variant="caption" color={done ? 'success.main' : 'text.secondary'} sx={{ mt: 0.2, fontSize: 10 }}>
        {done ? '✅ Tercapai' : `${pct.toFixed(1)}% — Kurang ${fmt(max - value)}`}
      </Typography>
    </Box>
  );
}

function TermsDialog({ open, onClose }) {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    reqOwner({ action: 'getStarSellerTerms' })
      .then(r => setTerms(r?.data?.terms || ''))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Gavel sx={{ color: '#f5a623', fontSize: 20 }} />
        <Typography fontWeight={700}>Syarat & Ketentuan Star Seller</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack spacing={1}>{[...Array(8)].map((_, i) => <Skeleton key={i} height={20} />)}</Stack>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 12 }}>{terms}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: 'none' }}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
}

function DowngradeDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" fontSize="small" />
        <Typography fontWeight={700}>Berhenti Star Seller?</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>Tindakan ini tidak dapat dibatalkan!</Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Dengan berhenti menjadi Star Seller:</Typography>
          {[
            'Akses Marketplace Reseller akan ditutup',
            'Semua produk yang di-resellerkan akan dinonaktifkan',
            'Deposit jaminan Rp 1.000.000 akan diproses pencairan',
            'Proses verifikasi membutuhkan waktu 3x24 jam',
            'Jika ada pelanggaran, deposit dapat disita',
          ].map((t, i) => (
            <Stack key={i} direction="row" spacing={0.8} alignItems="flex-start">
              <Close sx={{ fontSize: 13, color: 'error.main', mt: 0.2 }} />
              <Typography variant="body2" sx={{ fontSize: 13 }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 13 }}>Batal</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ borderRadius: 2, textTransform: 'none', fontSize: 13 }}>
          Ya, Berhenti
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BlockedView({ message }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
      <Lock sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography color="text.disabled" sx={{ textAlign: 'center', maxWidth: 400 }}>{message}</Typography>

      <Card elevation={0} sx={{ maxWidth: 440, width: '100%', mt: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #f5a623, #ff6b35)' }} />
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ background: 'linear-gradient(90deg, #f5a623, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1.5, lineHeight: 1.4 }}>
            UPGRADE STAR SELLER: MAKSIMALKAN CUAN SEKARANG! 🚀
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7, fontSize: 13 }}>
            Ingin jualan makin laris tanpa potongan biaya? Saatnya Upgrade ke Star Seller!
          </Typography>
          <Stack gap={1.5}>
            {[
              { icon: <RocketLaunch sx={{ fontSize: 15, color: '#f5a623' }} />, bg: 'rgba(245,166,35,0.1)', title: 'Booster Penjualan', desc: 'Produk tampil di baris terdepan Marketplace' },
              { icon: <Public sx={{ fontSize: 15, color: '#34d399' }} />, bg: 'rgba(52,211,153,0.1)', title: 'Jangkauan Luas', desc: 'Tarik ribuan pelanggan baru setiap harinya' },
              { icon: <LocalFireDepartment sx={{ fontSize: 15, color: '#ff6b35' }} />, bg: 'rgba(255,107,53,0.1)', title: 'Profit 100%', desc: 'Bebas Biaya Layanan dan Fee Platform! 🔥' },
            ].map((item, i) => (
              <Stack key={i} direction="row" alignItems="flex-start" gap={1.2}>
                <Box sx={{ minWidth: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg, flexShrink: 0, mt: 0.2 }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ fontSize: 13 }}>{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: 11 }}>{item.desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2, py: 0.75, '& .MuiAlert-message': { fontSize: 12 } }}>
            <Typography variant="caption">
              <b>Syarat:</b> Pendapatan min. Rp 100.000.000 + Deposit jaminan Rp 1.000.000
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function SellerProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ seller_description: '' });
  const [logoBuffer, setLogoBuffer] = useState(null);
  const [bannerBuffer, setBannerBuffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setBlocked(null);
    try {
      const res = await reqOwner({ action: 'getSellerProfile' });
      if (res?.error) {
        if (res.code === 403) {
          setBlocked(res.message || 'Access denied');
        } else {
          toast.error(res.message || 'Gagal memuat profile');
        }
        return;
      }
      setData(res.data);
      setEditForm({ seller_description: res.data?.profile?.seller_description || '' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { action: 'updateSellerProfile', seller_description: editForm.seller_description };
      if (logoBuffer) payload.seller_logo_base64 = logoBuffer;
      if (bannerBuffer) payload.seller_banner_base64 = bannerBuffer;
      const res = await reqOwner(payload);
      if (res?.error) { toast.error(res.message); } else {
        toast.success('Profile berhasil diperbarui');
        setEditMode(false);
        setLogoBuffer(null);
        setBannerBuffer(null);
        fetchProfile();
      }
    } catch (e) { toast.error(e?.message || 'Gagal menyimpan'); }
    setSaving(false);
  };

  const handlePayDeposit = async () => {
    setPayingDeposit(true);
    try {
      const res = await reqOwner({ action: 'payStarSellerDeposit' });
      if (res?.error) { toast.error(res.message); } else {
        const redirect = res?.data?.redirect;
        if (redirect) window.location.href = redirect;
        else { toast.success('Pembayaran diproses'); fetchProfile(); }
      }
    } catch (e) { toast.error(e?.message || 'Gagal'); }
    setPayingDeposit(false);
  };

  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      const res = await reqOwner({ action: 'requestStarSellerDowngrade' });
      if (res?.error) { toast.error(res.message); } else {
        toast.success(res.message || 'Request berhasil');
        setDowngradeOpen(false);
        fetchProfile();
      }
    } catch (e) { toast.error(e?.message || 'Gagal'); }
    setDowngrading(false);
  };

  if (loading) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
        <Grid container spacing={1.5}>{[...Array(4)].map((_, i) => <Grid item xs={6} sm={3} key={i}><Skeleton variant="rectangular" height={72} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
        <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 3 }} />
      </Stack>
    );
  }

  if (blocked) return <BlockedView message={blocked} />;

  const profile = data?.profile || {};
  const ss = data?.star_seller || {};
  const stats = data?.stats || {};
  const bal = data?.balances || {};
  const cfg = STATUS_CFG[ss.status] || STATUS_CFG.none;
  const isActive = ss.status === 'active';
  const isEligible = ss.status === 'eligible';
  const isPending = ss.status === 'pending_deposit';

  const logoUrl = logoBuffer ? `data:image/*;base64,${logoBuffer}` : profile.seller_logo?.startsWith('http') ? profile.seller_logo : profile.seller_logo ? `https://cdn.xoftware.shop/f/${profile.seller_logo}` : null;
  const bannerUrl = bannerBuffer ? `data:image/*;base64,${bannerBuffer}` : profile.seller_banner?.startsWith('http') ? profile.seller_banner : profile.seller_banner ? `https://cdn.xoftware.shop/f/${profile.seller_banner}` : null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* BANNER CARD */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5, position: 'relative' }}>
        <Box sx={{ height: { xs: 110, sm: 160 }, bgcolor: 'grey.100', position: 'relative', overflow: 'hidden' }}>
          {bannerUrl ? (
            <Box component="img" src={bannerUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
          )}
          {editMode && (
            <Tooltip title="Upload Banner">
              <IconButton component="label" sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                <CloudUpload sx={{ fontSize: 16 }} />
                <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; } setBannerBuffer(await fileToBase64(f)); }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <CardContent sx={{ position: 'relative', mt: -6, pb: '16px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar src={logoUrl} alt="" sx={{ width: 76, height: 76, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', bgcolor: 'grey.200', fontSize: 28 }} />
              {editMode && (
                <Tooltip title="Upload Logo">
                  <IconButton component="label" sx={{ position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, bgcolor: 'primary.main', color: '#fff', boxShadow: 2, '&:hover': { bgcolor: 'primary.dark' } }}>
                    <CloudUpload sx={{ fontSize: 13 }} />
                    <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1024 * 1024) { toast.error('Max 1MB'); return; } setLogoBuffer(await fileToBase64(f)); }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} noWrap sx={{ fontSize: { xs: 20, sm: 24 } }}>{profile.name || profile.username}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>@{profile.username} • Bergabung {dayjs(profile.joined_at).format('MMM YYYY')}</Typography>
            </Box>
            {editMode ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Simpan</Button>
                <Button size="small" variant="outlined" onClick={() => { setEditMode(false); setLogoBuffer(null); setBannerBuffer(null); fetchProfile(); }} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Batal</Button>
              </Stack>
            ) : (
              <Button size="small" variant="outlined" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => setEditMode(true)} sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Edit Profile</Button>
            )}
          </Stack>
          {editMode ? (
            <TextField size="small" multiline rows={2} value={editForm.seller_description} onChange={e => setEditForm({ ...editForm, seller_description: e.target.value })} fullWidth placeholder="Deskripsi toko Anda..." sx={{ mt: 1.5 }} />
          ) : (
            profile.seller_description && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6, fontSize: 13 }}>{profile.seller_description}</Typography>
          )}
        </CardContent>
      </Card>

      {/* STATUS & PROGRESS */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={5.5}>
          <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid', borderColor: isActive ? alpha('#10b981', 0.3) : 'divider' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={<Star sx={{ fontSize: 14 }} />}
                    sx={{ '& .MuiBadge-badge': { width: 22, height: 22, bgcolor: isActive ? '#10b981' : alpha('#6366f1', 0.1), color: isActive ? '#fff' : '#6366f1', borderRadius: '50%', display: 'grid', placeItems: 'center', border: isActive ? 'none' : '1.5px solid', borderColor: '#6366f1' } }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: isActive ? 'success.main' : 'grey.100' }}>
                      {isActive ? <Star sx={{ fontSize: 24 }} /> : <Storefront sx={{ fontSize: 24, color: 'grey.400' }} />}
                    </Avatar>
                  </Badge>
                  <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 22, borderRadius: 1.5 }} />
                </Stack>
                <Stack direction="row" spacing={0.8} sx={{ mt: 0.5 }}>
                  <Chip label={`WA: ${profile.allow_botwa ? '🟢' : '🔴'}`} size="small" variant="outlined" sx={{ fontSize: 9, height: 20 }} />
                  <Chip label={`TG: ${profile.allow_bottele ? '🟢' : '🔴'}`} size="small" variant="outlined" sx={{ fontSize: 9, height: 20 }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6.5}>
          <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid', borderColor: isActive ? alpha('#10b981', 0.3) : isEligible ? alpha('#6366f1', 0.3) : 'divider', background: isActive ? alpha('#10b981', 0.03) : 'transparent' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                <Star sx={{ fontSize: 16, color: isActive ? '#f5a623' : 'text.disabled' }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>{isActive ? 'Star Seller Aktif' : 'Progress Star Seller'}</Typography>
              </Stack>
              {isActive ? (
                <Stack spacing={1}>
                  <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 1.5, py: 0.5, '& .MuiAlert-icon': { fontSize: 16 } }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>Semua benefit aktif!</Typography>
                  </Alert>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Deposit terkunci: <b>{idr(ss.deposit_amount)}</b></Typography>
                  <Stack direction="row" spacing={0.8}>
                    <Button size="small" variant="outlined" color="error" startIcon={<Cancel sx={{ fontSize: 14 }} />} onClick={() => setDowngradeOpen(true)} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 11, flex: 1 }}>Berhenti</Button>
                    <Button size="small" variant="outlined" startIcon={<Gavel sx={{ fontSize: 14 }} />} onClick={() => setTermsOpen(true)} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 11 }}>S&K</Button>
                  </Stack>
                </Stack>
              ) : isPending ? (
                <Stack spacing={1.5}>
                  <Alert severity="warning" icon={<Schedule />} sx={{ borderRadius: 1.5, py: 0.5, '& .MuiAlert-icon': { fontSize: 16 } }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>Menunggu pembayaran deposit...</Typography>
                  </Alert>
                  <Button size="small" variant="outlined" startIcon={<Gavel sx={{ fontSize: 14 }} />} onClick={() => setTermsOpen(true)} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 11, mx: 'auto' }}>Lihat S&K</Button>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <ProgressBar value={stats.total_settlement} max={ss.revenue_required} label="Pendapatan" fmt={v => idr(v)} />
                  <ProgressBar value={ss.deposit_amount} max={ss.deposit_required} label="Deposit Jaminan" fmt={v => idr(v)} />
                  {isEligible && (
                    <Button fullWidth variant="contained" startIcon={payingDeposit ? <CircularProgress size={14} color="inherit" /> : <Shield sx={{ fontSize: 16 }} />} onClick={handlePayDeposit} disabled={payingDeposit}
                      sx={{ borderRadius: 2, py: 0.8, textTransform: 'none', fontWeight: 700, fontSize: 12, background: 'linear-gradient(90deg, #f5a623, #ff6b35)', '&:hover': { background: 'linear-gradient(90deg, #e6951a, #f05a2a)' } }}>
                      {payingDeposit ? 'Memproses...' : 'Bayar Deposit Rp 1.000.000'}
                    </Button>
                  )}
                  <Button size="small" variant="text" startIcon={<Gavel sx={{ fontSize: 13 }} />} onClick={() => setTermsOpen(true)} sx={{ textTransform: 'none', fontSize: 10, mx: 'auto' }}>Lihat Syarat & Ketentuan</Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* STATS */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { icon: <Inventory2 sx={{ fontSize: 18 }} />, label: 'Total Produk', value: stats.total_products?.toLocaleString() || '0', color: '#6366f1' },
          { icon: <Receipt sx={{ fontSize: 18 }} />, label: 'Total Transaksi', value: stats.total_buy_transactions?.toLocaleString() || '0', color: '#f59e0b' },
          { icon: <TrendingUp sx={{ fontSize: 18 }} />, label: 'Pendapatan', value: idr(stats.total_settlement || 0), color: '#10b981' },
          { icon: <People sx={{ fontSize: 18 }} />, label: 'Reseller Clone', value: stats.total_clones?.toLocaleString() || '0', color: '#8b5cf6' },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <MiniStatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* BALANCES */}
      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
            <AccountBalance sx={{ fontSize: 16, color: '#6366f1' }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>Saldo</Typography>
          </Stack>
          <Grid container spacing={1.5}>
            {[
              { label: 'Saldo Layanan', value: bal.balance, color: '#6366f1' },
              { label: 'Saldo Reseller', value: bal.reseller_saldo, color: '#10b981' },
              { label: 'Saldo PPOB', value: bal.bot_saldo, color: '#f59e0b' },
              { label: 'Saldo SMM', value: bal.smm_saldo, color: '#8b5cf6' },
            ].map((s, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(s.color, 0.04), border: `1px solid ${alpha(s.color, 0.12)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5 }}>{s.label}</Typography>
                  <Typography variant="subtitle2" fontWeight={700} color={s.color} sx={{ fontSize: 14 }}>{idr(s.value || 0)}</Typography>
                </Box>
              </Grid>
            ))}
            {isActive && (
              <Grid item xs={12}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha('#ef4444', 0.04), border: '1px solid', borderColor: alpha('#ef4444', 0.12) }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5 }}>🔒 Deposit Jaminan (Terkunci)</Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ fontSize: 14 }}>{idr(ss.deposit_amount || 0)}</Typography>
                    </Box>
                    <Chip label="TIDAK BISA DITARIK" size="small" color="error" variant="outlined" sx={{ fontSize: 8, fontWeight: 700, height: 20 }} />
                  </Stack>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* DEPOSIT HISTORY */}
      {data?.deposit_history?.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, fontSize: 13 }}>Riwayat Deposit Jaminan</Typography>
            <Stack spacing={1}>
              {data.deposit_history.map(item => {
                const typeClr = item.type === 'deposit' ? 'success' : item.type === 'withdrawal' ? 'warning' : 'error';
                const stClr = item.status === 'success' ? 'success' : item.status === 'processing' ? 'warning' : 'error';
                return (
                  <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#000', 0.02), border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Chip label={item.type.toUpperCase()} size="small" color={typeClr} variant="outlined" sx={{ fontSize: 8, fontWeight: 700, height: 18 }} />
                        <Chip label={item.status.toUpperCase()} size="small" color={stClr} sx={{ fontSize: 8, fontWeight: 600, height: 18 }} />
                      </Stack>
                      <Typography variant="subtitle2" fontWeight={700} color={item.type === 'deposit' ? 'success.main' : 'error.main'} sx={{ fontSize: 13 }}>
                        {item.type === 'deposit' ? '-' : '+'}{idr(item.amount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.3 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>{dayjs(item.createdAt).format('DD MMM YYYY HH:mm')}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{item.payment?.reff_id || '-'}</Typography>
                    </Stack>
                    {item.reason && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, fontStyle: 'italic', fontSize: 10 }}>{item.reason}</Typography>}
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
      <DowngradeDialog open={downgradeOpen} onClose={() => setDowngradeOpen(false)} onConfirm={handleDowngrade} loading={downgrading} />
    </Box>
  );
}