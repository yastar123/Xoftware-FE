import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, CircularProgress, Chip, Tabs, Tab, Alert,
  Card, CardContent, Stack, Divider, List, ListItemButton, alpha, Paper
} from '@mui/material';
import { Delete, Add, Dns, Storage, Refresh, Language, ChevronLeft, Autorenew, Payment } from '@mui/icons-material';
import { useSocket } from '@/Context/SocketContext';
import { reqOwner } from '@/lib/requestApi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

function StatusChip({ status }) {
  const color = status === 'active' ? 'success' : status === 'expired' ? 'error' : 'warning';
  return (
    <Chip label={status} color={color} size="small"
      sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'capitalize', fontSize: 11 }} />
  );
}

function formatDate(val) {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Left: Domain List ────────────────────────────────────────────────────────
function DomainListPanel({ domains, loading, selected, onSelect, onRefresh }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Domain Saya</Typography>
          <IconButton size="small" onClick={onRefresh} title="Refresh"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <Refresh sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : domains.length === 0 ? (
          <Box py={6} textAlign="center">
            <Language sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Belum ada domain</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {domains.map((row) => {
              const isSelected = selected?.id === row.id;
              const isExpired = row.status === 'expired';
              return (
                <ListItemButton key={row.id} selected={isSelected} onClick={() => onSelect(row)}
                  sx={{
                    px: 2.5, py: 1.5, gap: 1.5, transition: 'all 0.15s',
                    '&:hover': { bgcolor: alpha('#6366f1', 0.04) },
                    '&.Mui-selected': { bgcolor: alpha('#6366f1', 0.09), borderLeft: '3px solid #6366f1' },
                    '&.Mui-selected:hover': { bgcolor: alpha('#6366f1', 0.13) },
                  }}>
                  <Language sx={{ color: isSelected ? '#6366f1' : 'text.secondary', fontSize: 22, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap sx={{ fontSize: 13.5 }}>{row.domain}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
                      <StatusChip status={row.status} />
                      <Typography variant="caption" color={isExpired ? 'error' : 'text.secondary'}>
                        Exp: {formatDate(row.expiry_date)}
                      </Typography>
                    </Stack>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}

// ─── Right: Domain Detail ─────────────────────────────────────────────────────
function DomainDetailPanel({ domain, pricings, onBack, onRenewSuccess }) {
  const [activeTab, setActiveTab] = useState(0);

  // DNS state
  const [dnsRecords, setDnsRecords] = useState([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [newDns, setNewDns] = useState({ name: '', type: 'A', content: '', ttl: '14400' });

  // NS state
  const [currentNs, setCurrentNs] = useState([]);
  const [nsLoading, setNsLoading] = useState(false);
  const [nsInputs, setNsInputs] = useState(['', '']);
  const [nsSaving, setNsSaving] = useState(false);
  const [nsMessage, setNsMessage] = useState(null);

  // Renew state
  const [renewDuration, setRenewDuration] = useState(1);
  const [renewLoading, setRenewLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setDnsRecords([]);
    setCurrentNs([]);
    setNsMessage(null);
    setRenewDuration(1);
    fetchDns();
    fetchNs();
  }, [domain?.id]);

  const fetchDns = async () => {
    if (!domain) return;
    setDnsLoading(true);
    const res = await reqOwner({ action: 'domain.reseller.dns.list', domain: domain.domain });
    setDnsLoading(false);
    if (!res?.error) {
      const data = res.data;
      setDnsRecords(Array.isArray(data) ? data : (data?.rows || []));
    } else toast.error(res.message || 'Gagal memuat DNS');
  };

  const fetchNs = async () => {
    if (!domain) return;
    setNsLoading(true);
    const res = await reqOwner({ action: 'domain.reseller.nameservers.get', domain: domain.domain });
    setNsLoading(false);
    if (!res?.error) {
      const ns = Array.isArray(res.data) ? res.data : [];
      setCurrentNs(ns);
      const inputs = [...ns];
      while (inputs.length < 2) inputs.push('');
      setNsInputs(inputs);
    }
  };

  const handleAddDns = async () => {
    const recordName = newDns.name.trim() || '@';
    if (!newDns.content) return toast.error('Content/Value wajib diisi');
    
    setDnsLoading(true);
    const payload = { ...newDns, name: recordName };
    const res = await reqOwner({ action: 'domain.reseller.dns.add', domain: domain.domain, record: payload });
    if (!res?.error) {
      setNewDns({ name: '', type: 'A', content: '', ttl: '14400' });
      fetchDns();
      toast.success('DNS Record berhasil ditambahkan');
    } else {
      setDnsLoading(false);
      toast.error(res.message);
    }
  };

  const handleDeleteDns = async (recordId) => {
    if (!confirm('Hapus DNS Record ini?')) return;
    setDnsLoading(true);
    const res = await reqOwner({ action: 'domain.reseller.dns.delete', domain: domain.domain, recordId });
    if (!res?.error) { fetchDns(); toast.success('Record dihapus'); }
    else { setDnsLoading(false); toast.error(res.message); }
  };

  const handleSaveNs = async () => {
    const filtered = nsInputs.map(n => n.trim()).filter(Boolean);
    if (filtered.length < 2) { setNsMessage({ type: 'error', text: 'Minimal 2 nameserver wajib diisi.' }); return; }
    setNsSaving(true);
    setNsMessage(null);
    const res = await reqOwner({ action: 'domain.reseller.nameservers.update', domain: domain.domain, nameservers: filtered });
    setNsSaving(false);
    if (!res?.error) {
      setCurrentNs(filtered);
      setNsMessage({ type: 'success', text: 'Nameserver berhasil disimpan. Tunggu 24–48 jam untuk propagasi.' });
      toast.success('Nameserver diperbarui');
    } else {
      setNsMessage({ type: 'error', text: res.message || 'Gagal update nameserver.' });
    }
  };

  const calculatePrice = (yrs) => {
    const tld = '.' + domain.domain.split('.').slice(1).join('.');
    const price = pricings[tld];
    return price ? price * yrs : 0;
  };

  const handleRenew = async () => {
    const price = calculatePrice(renewDuration);
    if (!confirm(`Perpanjang ${domain.domain} selama ${renewDuration} tahun${price > 0 ? ` seharga Rp${price.toLocaleString()}` : ''}?`)) return;
    setRenewLoading(true);
    const res = await reqOwner({ action: 'domain.reseller.renew', domain: domain.domain, duration: parseInt(renewDuration) });
    setRenewLoading(false);
    if (!res?.error) {
      toast.success(res.message || 'Permintaan perpanjangan berhasil');
      if (res.data?.redirect) window.open(res.data.redirect, '_blank');
      if (onRenewSuccess) onRenewSuccess();
    } else {
      toast.error(res.message || 'Gagal memperpanjang domain');
    }
  };

  if (!domain) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
        height="100%" gap={2}>
        <Dns sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography color="text.secondary">Klik domain di sebelah kiri</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {onBack && (
            <IconButton size="small" onClick={onBack}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, display: { md: 'none' } }}>
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>{domain.domain}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mt={0.25}>
              <StatusChip status={domain.status} />
              <Typography variant="caption" color="text.secondary">Daftar: {formatDate(domain.registration_date)}</Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">Exp: {formatDate(domain.expiry_date)}</Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2, minHeight: 42 }}
        TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}>
        <Tab icon={<Dns sx={{ fontSize: 15 }} />} iconPosition="start" label="DNS Records"
          sx={{ textTransform: 'none', minHeight: 42, fontSize: 13, fontWeight: 600 }} />
        <Tab icon={<Storage sx={{ fontSize: 15 }} />} iconPosition="start" label="Nameserver"
          sx={{ textTransform: 'none', minHeight: 42, fontSize: 13, fontWeight: 600 }} />
        <Tab icon={<Autorenew sx={{ fontSize: 15 }} />} iconPosition="start" label="Perpanjang"
          sx={{ textTransform: 'none', minHeight: 42, fontSize: 13, fontWeight: 600 }} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
        <AnimatePresence mode="wait">

          {/* ── Tab DNS ── */}
          {activeTab === 0 && (
            <motion.div key="dns" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Tambah Record</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-end' }} flexWrap="wrap">
                    <TextField select SelectProps={{ native: true }} size="small" label="Type"
                      value={newDns.type} onChange={e => setNewDns({ ...newDns, type: e.target.value })}
                      sx={{ minWidth: 85 }}>
                      {['A', 'CNAME', 'TXT', 'MX', 'NS', 'AAAA'].map(t => <option key={t} value={t}>{t}</option>)}
                    </TextField>
                    <TextField size="small" label="Name / Host" sx={{ minWidth: 140 }}
                      placeholder="@"
                      value={newDns.name} onChange={e => setNewDns({ ...newDns, name: e.target.value })} />
                    <TextField size="small" label="Content / Value" sx={{ flex: 1, minWidth: 180 }}
                      value={newDns.content} onChange={e => setNewDns({ ...newDns, content: e.target.value })} />
                    <Button variant="contained" onClick={handleAddDns} disabled={dnsLoading}
                      startIcon={<Add />} sx={{ borderRadius: 1.5, textTransform: 'none', whiteSpace: 'nowrap' }}>
                      Tambah
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                  {dnsRecords.length} RECORD
                </Typography>
                <IconButton size="small" onClick={fetchDns} disabled={dnsLoading} sx={{ borderRadius: 1.5 }}>
                  <Refresh sx={{ fontSize: 15 }} />
                </IconButton>
              </Stack>

              {dnsLoading && dnsRecords.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : dnsRecords.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">Belum ada record.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Content</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dnsRecords.map(rec => (
                        <TableRow key={rec.id} hover>
                          <TableCell>
                            <Chip label={rec.type} size="small" variant="outlined"
                              sx={{ borderRadius: 1, fontSize: 11, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontFamily: 'monospace' }}>{rec.name}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-all', fontSize: 12, color: 'text.secondary', maxWidth: 260 }}>
                            {rec.content}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" disabled={dnsLoading}
                              onClick={() => handleDeleteDns(rec.id)}>
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </motion.div>
          )}

          {/* ── Tab Nameserver ── */}
          {activeTab === 1 && (
            <motion.div key="ns" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>
                Ganti NS ke provider lain. Propagasi membutuhkan waktu 24–48 jam.
              </Alert>

              {nsLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : (
                <>
                  {currentNs.length > 0 && (
                    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: alpha('#6366f1', 0.03) }}>
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
                          NAMESERVER AKTIF
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                          {currentNs.map((ns, i) => (
                            <Chip key={i} label={ns} size="small" variant="outlined" color="primary"
                              sx={{ borderRadius: 1.5, fontFamily: 'monospace', fontSize: 12 }} />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}

                  <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Ubah Nameserver</Typography>
                      <Stack spacing={1}>
                        {nsInputs.map((ns, i) => (
                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20, textAlign: 'right' }}>
                              {i + 1}.
                            </Typography>
                            <TextField fullWidth size="small"
                              placeholder={`Nameserver ${i + 1}`}
                              value={ns}
                              onChange={e => {
                                const updated = [...nsInputs];
                                updated[i] = e.target.value;
                                setNsInputs(updated);
                              }}
                              inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                            />
                            {nsInputs.length > 2 && (
                              <IconButton size="small" color="error"
                                onClick={() => setNsInputs(nsInputs.filter((_, idx) => idx !== i))}>
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                      </Stack>
                      <Button size="small" startIcon={<Add />} onClick={() => setNsInputs([...nsInputs, ''])}
                        sx={{ mt: 1.5, borderRadius: 1.5, textTransform: 'none', fontSize: 12 }}>
                        Tambah Nameserver
                      </Button>
                    </CardContent>
                  </Card>

                  {nsMessage && (
                    <Alert severity={nsMessage.type} sx={{ mb: 2, borderRadius: 2 }}>{nsMessage.text}</Alert>
                  )}

                  <Box display="flex" justifyContent="flex-end">
                    <Button variant="contained" onClick={handleSaveNs} disabled={nsSaving}
                      startIcon={nsSaving ? <CircularProgress size={15} color="inherit" /> : <Storage />}
                      sx={{ borderRadius: 1.5, textTransform: 'none', px: 3 }}>
                      {nsSaving ? 'Menyimpan...' : 'Simpan Nameserver'}
                    </Button>
                  </Box>
                </>
              )}
            </motion.div>
          )}

          {/* ── Tab Perpanjang ── */}
          {activeTab === 2 && (
            <motion.div key="renew" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Perpanjang {domain.domain}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2.5}>
                    Setelah konfirmasi, kamu akan diarahkan ke halaman pembayaran.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <TextField select SelectProps={{ native: true }} size="small" label="Durasi"
                      value={renewDuration} onChange={e => setRenewDuration(e.target.value)}
                      sx={{ minWidth: 160 }}>
                      <option value={1}>1 Tahun</option>
                      <option value={2}>2 Tahun</option>
                      <option value={3}>3 Tahun</option>
                    </TextField>

                    <Box sx={{ flex: 1 }}>
                      {calculatePrice(renewDuration) > 0 ? (
                        <Typography variant="h6" fontWeight={700} color="primary">
                          Rp{calculatePrice(renewDuration).toLocaleString('id-ID')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Box>

                    <Button variant="contained" color="success" onClick={handleRenew} disabled={renewLoading}
                      startIcon={renewLoading ? <CircularProgress size={16} color="inherit" /> : <Payment />}
                      sx={{ borderRadius: 1.5, textTransform: 'none', px: 3 }}>
                      {renewLoading ? 'Memproses...' : 'Bayar Perpanjangan'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManageDomain({ setOnResumeReady }) {
  const { socket } = useSocket();
  const [domains, setDomains] = useState([]);
  const [pricings, setPricings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    const res = await reqOwner({ action: 'domain.reseller.list' });
    setLoading(false);
    if (!res?.error) {
      const data = res.data;
      setDomains(Array.isArray(data) ? data : (data?.rows || []));
    } else setDomains([]);
  };

  const fetchPricings = async () => {
    const res = await reqOwner({ action: 'domain.reseller.pricings' });
    if (!res?.error && Array.isArray(res.data)) {
      const map = {};
      res.data.forEach(item => {
        const p = item.pricings?.find(p => p.duration === 1)?.renewal_price || 0;
        if (p > 0) map[item.tld] = p;
      });
      setPricings(map);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchPricings();
    if (setOnResumeReady) setOnResumeReady(() => { fetchDomains(); fetchPricings(); });
  }, [socket]);

  const handleSelect = (domain) => {
    setSelectedDomain(domain);
    setMobileShowDetail(true);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2 }}>
      {/* Left Panel */}
      <Card elevation={2} sx={{
        borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        display: { xs: mobileShowDetail ? 'none' : 'flex', md: 'flex' },
      }}>
        <DomainListPanel
          domains={domains} loading={loading}
          selected={selectedDomain} onSelect={handleSelect}
          onRefresh={fetchDomains}
        />
      </Card>

      {/* Right Panel */}
      <Card elevation={2} sx={{
        borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        display: { xs: mobileShowDetail ? 'flex' : 'none', md: 'flex' },
      }}>
        <DomainDetailPanel
          domain={selectedDomain}
          pricings={pricings}
          onBack={() => setMobileShowDetail(false)}
          onRenewSuccess={fetchDomains}
        />
      </Card>
    </Box>
  );
}
