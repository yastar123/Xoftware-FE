import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, alpha,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { motion } from 'framer-motion';
import { Language, Add, Refresh, Delete, Info, ContentCopy, Build } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

const MotionCard = motion(Card);

function formatDateTimeID(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function normalizeDomainInput(v) {
  let s = String(v ?? '').trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '');
  s = s.replace(/\/+$/, '');
  return s;
}

function statusColor(status) {
  switch (String(status || '').toLowerCase()) {
    case 'installed': return 'success';
    case 'installing': return 'info';
    case 'pending': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
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

function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.35 }}>
      <Typography sx={{ width: 140, color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
      <Typography sx={{ flex: 1, fontSize: 13 }}>{value}</Typography>
    </Stack>
  );
}

export default function OwnerWebAppDomainPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [setOpen, setSetOpen] = useState(false);
  const [unsetOpen, setUnsetOpen] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  const [domainMode, setDomainMode] = useState('internal');
  const [ownedDomains, setOwnedDomains] = useState([]);
  const [selectedBaseDomain, setSelectedBaseDomain] = useState('');
  const [subDomainInput, setSubDomainInput] = useState('@');
  const [ownedLoading, setOwnedLoading] = useState(false);

  const serverIp = row?.server_ip || '107.172.107.35';

  const dnsHint = useMemo(() => ({ type: 'A', name: '@', ip: serverIp, ttl: '14400' }), [serverIp]);

  const fetchDomain = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'webapp.domain.get' });
      if (res?.error) throw new Error(res?.message || 'Gagal memuat domain');
      setRow(res?.data ?? null);
      setDomainInput(res?.data?.domain || '');
    } catch { setRow(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDomain(); }, []);

  const openSetDialog = async () => {
    setSetOpen(true);
    setDomainMode('internal');
    setOwnedLoading(true);
    try {
      const res = await reqOwner({ action: 'domain.reseller.list' });
      const domains = Array.isArray(res?.data) ? res.data : (res?.data?.rows || []);
      setOwnedDomains(domains);
      if (domains.length > 0) setSelectedBaseDomain(domains[0].domain);
    } catch {
      setOwnedDomains([]);
    } finally {
      setOwnedLoading(false);
    }
  };

  const submitSet = async () => {
    let payload = {};
    if (domainMode === 'internal') {
      const sub = (subDomainInput || '').trim();
      const base = selectedBaseDomain;
      const finalDomain = (sub && sub !== '@') ? `${sub}.${base}` : base;
      if (!finalDomain) return toast.error('Domain tidak valid');
      payload = { domain: finalDomain, auto_dns: true, base_domain: base, sub_domain: sub || '@' };
    } else {
      const domain = normalizeDomainInput(domainInput);
      if (!domain) return toast.error('Domain wajib diisi');
      if (domain.length < 4) return toast.error('Domain terlalu pendek');
      payload = { domain };
    }

    setSaving(true);
    try {
      const res = await reqOwner({ action: 'webapp.domain.set', ...payload });
      if (res?.error) throw new Error(res?.message || 'Gagal menyimpan domain');
      setSetOpen(false);
      setRow(res?.data ?? null);
      if (res?.data?.domain) setDomainInput(res.data.domain);
      toast.success(res?.message || 'Domain disimpan');
    } catch (e) { toast.error(e?.message || 'Gagal menyimpan domain'); }
    finally { setSaving(false); }
  };

  const runVerify = async () => {
    setVerifying(true);
    try {
      const res = await reqOwner({ action: 'webapp.domain.verify' });
      if (res?.error) throw new Error(res?.message || 'Gagal verifikasi domain');
      setRow(res?.data ?? null);
      toast.success('Verifikasi selesai');
    } catch (e) { toast.error(e?.message || 'Gagal verifikasi domain'); }
    finally { setVerifying(false); }
  };

  const confirmUnset = async () => {
    setDeleting(true);
    try {
      const res = await reqOwner({ action: 'webapp.domain.unset' });
      if (res?.error) throw new Error(res?.message || 'Gagal menghapus domain');
      setUnsetOpen(false);
      setRow(null);
      setDomainInput('');
      toast.success(res?.message || 'Domain dihapus');
    } catch (e) { toast.error(e?.message || 'Gagal menghapus domain'); }
    finally { setDeleting(false); }
  };

  const runInstall = async () => {
    setInstalling(true);
    try {
      const res = await reqOwner({ action: 'webapp.domain.install' });
      if (res?.error) throw new Error(res?.message || 'Gagal instalasi domain');
      setInstallOpen(false);
      setRow(prev => ({ ...prev, status: 'installing' }));
      toast.success(res?.message || 'Instalasi domain telah dimulai');
    } catch (e) { toast.error(e?.message || 'Gagal instalasi domain'); }
    finally { setInstalling(false); }
  };

  const summaryChips = useMemo(() => {
    if (!row) return [];
    return [
      { key: 'status', label: `Status: ${row.status || 'unknown'}`, color: statusColor(row.status) },
      { key: 'verified', label: row.verified_https ? 'HTTPS: Verified' : 'HTTPS: Not verified', color: row.verified_https ? 'success' : 'default' },
    ];
  }, [row]);

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Custom Domain WebApp</Typography>
            <Typography variant="caption" color="text.secondary">Atur domain khusus untuk WebApp kamu.</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchDomain} disabled={loading || saving || verifying || deleting} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={row?.domain ? 'Ubah Domain' : 'Set Domain'}>
              <IconButton onClick={openSetDialog} disabled={loading || saving || verifying || deleting} sx={{ borderRadius: 2, backgroundColor: '#6366f1', color: '#fff', '&:hover': { backgroundColor: '#4f46e5' } }}>
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hapus Domain">
              <span>
                <IconButton
                  onClick={() => setUnsetOpen(true)}
                  disabled={loading || !row?.domain || saving || verifying || deleting}
                  sx={{ borderRadius: 2, color: 'error.main', border: '1px solid rgba(211,47,47,0.25)', '&:hover': { bgcolor: alpha('#ef4444', 0.08) } }}
                >
                  <Delete sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </motion.div>

      <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', flexShrink: 0 }}>
                  <Language sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} noWrap sx={{ fontSize: 15 }}>{row?.domain || 'Belum ada domain'}</Typography>
                  <Typography variant="caption" color="text.secondary">Terakhir diperbarui: {row?.updatedAt ? formatDateTimeID(row.updatedAt) : '-'}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained" size="small" color="primary"
                    onClick={() => setInstallOpen(true)}
                    disabled={!row?.domain || verifying || saving || deleting || installing || row?.status === 'installed' || row?.status === 'installing'}
                    startIcon={installing ? <CircularProgress size={14} color="inherit" /> : <Build sx={{ fontSize: 14 }} />}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {installing ? 'Installing...' : 'Install'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={runVerify} disabled={!row?.domain || verifying || saving || deleting || installing} startIcon={verifying ? <CircularProgress size={14} color="inherit" /> : null} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    {verifying ? 'Verifying...' : 'Verify'}
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summaryChips.length ? summaryChips.map(c => <Chip key={c.key} label={c.label} color={c.color} variant={c.key === 'status' ? 'filled' : 'outlined'} size="small" />) : <Chip label="Status: -" variant="outlined" size="small" />}
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch' }}>
                <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
                  <CardContent>
                    <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: 14 }}>Status & Jadwal</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                      {row?.status === 'pending' ? 'Domain Anda telah masuk ke dalam antrean instalasi otomatis yang diproses setiap 5 menit. Harap pastikan konfigurasi DNS Anda sudah benar.'
                        : row?.status === 'installing' ? 'Sistem sedang memproses instalasi domain Anda. Proses ini biasanya selesai dalam beberapa menit.'
                          : row?.status === 'installed' ? 'Selamat! Domain Anda telah berhasil terpasang dan siap digunakan.'
                            : row?.status === 'error' ? 'Terjadi kendala saat proses instalasi. Mohon periksa kembali konfigurasi DNS Anda atau hubungi dukungan teknis.'
                              : 'Silakan atur domain Anda untuk memulai proses integrasi otomatis.'}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Row label="Requested" value={row?.requested_at ? formatDateTimeID(row.requested_at) : '-'} />
                    <Row label="Last Verified" value={row?.last_verified_at ? formatDateTimeID(row.last_verified_at) : '-'} />
                    {row?.domain && <>
                      <Row label="HTTP Code" value={row.http_code || '-'} />
                      <Row label="HTTPS Code" value={row.https_code || '-'} />
                    </>}
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography fontWeight={700} sx={{ fontSize: 14 }}>DNS Setting</Typography>
                      <Chip size="small" label="Required" color="warning" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 13 }}>
                      Agar domain dapat terhubung ke WebApp, set DNS pada provider domain sesuai konfigurasi di bawah.
                    </Typography>

                    <Box sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.10)', overflow: 'hidden', bgcolor: alpha('#000', 0.015) }}>
                      <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: alpha('#000', 0.03) }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', flexShrink: 0 }}>
                            <Info sx={{ fontSize: 16 }} />
                          </Box>
                          <Box>
                            <Typography fontWeight={700} sx={{ lineHeight: 1.15, fontSize: 13 }}>DNS Record (A)</Typography>
                            <Typography variant="caption" color="text.secondary">Set DNS pada provider domain kamu sesuai tabel berikut.</Typography>
                          </Box>
                        </Stack>
                        <Button size="small" variant="outlined" startIcon={<ContentCopy sx={{ fontSize: 14 }} />} onClick={() => navigator.clipboard?.writeText(`Type\tNama\tIP\tTTL\nA\t@\t${serverIp}\t14400`)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                          Copy
                        </Button>
                      </Box>
                      <Divider />
                      <Box sx={{ px: 1.5, py: 1.25 }}>
                        <TableContainer sx={{ overflowX: 'auto', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', bgcolor: 'white' }}>
                          <Table size="small" sx={{ minWidth: 680, '& th': { fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }, '& td': { whiteSpace: 'nowrap', fontSize: 13 } }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Nama</TableCell>
                                <TableCell>IP</TableCell>
                                <TableCell>TTL</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow hover>
                                <TableCell><Chip label="A" size="small" variant="outlined" /></TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>@</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{serverIp}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace' }}>14400</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>

                    <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        Setelah DNS tersimpan, propagasi bisa memakan waktu kurang lebih 24 jam. Jika HTTPS belum aktif setelah instalasi, klik <b>Verify</b> untuk mengecek status HTTPS domain.
                      </Typography>
                    </Alert>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Tips: Jika menggunakan subdomain (mis. <b>app.domain.com</b>), record-nya tetap <b>A</b> dengan nama <b>app</b>.
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {row?.last_error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: 14 }}>Last Error</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{row.last_error}</Typography>
                </Alert>
              )}
            </Stack>
          )}
        </CardContent>
      </MotionCard>

      <Dialog open={setOpen} onClose={saving ? undefined : () => setSetOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{row?.domain ? 'Ubah Domain WebApp' : 'Set Domain WebApp'}</DialogTitle>
        <DialogContent>
          <Tabs value={domainMode} onChange={(_, v) => setDomainMode(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Domain Aktif" value="internal" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label="Domain Eksternal" value="external" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          {domainMode === 'internal' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Pilih domain yang sudah Anda beli di sistem ini. Setup DNS (Record A) akan diatur <b>secara otomatis</b>.
              </Alert>
              {ownedLoading ? (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
              ) : ownedDomains.length === 0 ? (
                <Typography variant="body2" color="error">Anda belum memiliki domain aktif di sistem ini.</Typography>
              ) : (
                <Stack spacing={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Pilih Domain Utama</InputLabel>
                    <Select value={selectedBaseDomain} label="Pilih Domain Utama" onChange={e => setSelectedBaseDomain(e.target.value)}>
                      {ownedDomains.map(d => <MenuItem key={d.domain} value={d.domain}>{d.domain}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField 
                    label="Subdomain / Host (opsional)" 
                    fullWidth size="small" 
                    value={subDomainInput} 
                    onChange={e => setSubDomainInput(e.target.value)} 
                    helperText="Gunakan @ untuk domain utama, atau ketik nama host (misal: app, store, dll)"
                  />
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Domain WebApp nantinya:</Typography>
                    <Typography fontWeight={700} sx={{ mt: 0.5 }}>
                      {subDomainInput && subDomainInput !== '@' ? `${subDomainInput}.${selectedBaseDomain}` : selectedBaseDomain}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          )}

          {domainMode === 'external' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Masukkan domain dari provider luar (tanpa <b>https://</b>). Anda harus mengatur DNS manual setelah ini.
              </Alert>
              <TextField label="Domain" fullWidth size="small" value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="example.com" sx={{ mt: 1 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { if (saving) return; setSetOpen(false); }} sx={{ borderRadius: 2, textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={submitSet} disabled={saving || (domainMode === 'internal' && !selectedBaseDomain)} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={unsetOpen}
        title="Hapus Domain?"
        message={`Domain "${row?.domain || '-'}" akan dihapus dari konfigurasi WebApp kamu.`}
        onConfirm={confirmUnset}
        onCancel={() => setUnsetOpen(false)}
        loading={deleting}
      />

      <ConfirmDialog
        open={installOpen}
        title="Instalasi Domain"
        message={`Mulai proses instalasi domain "${row?.domain}"?

Pastikan DNS Record (A) sudah diset dengan benar agar proses instalasi SSL/HTTPS tidak gagal.`}
        confirmText="Instal Sekarang"
        confirmColor="primary"
        onConfirm={runInstall}
        onCancel={() => setInstallOpen(false)}
        loading={installing}
      />
    </Box>
  );
}