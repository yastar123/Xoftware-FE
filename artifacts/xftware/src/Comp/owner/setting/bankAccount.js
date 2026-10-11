import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Skeleton,
  Stack,
  Chip,
  Tooltip,
  alpha,
  Divider,
  Grid,
  InputAdornment,
  Collapse
} from '@mui/material';
import { Add, Delete, Verified, HourglassEmpty, Block, GppBad, AccountBalance, Shield, Security, Info, Refresh, Check, Close, CheckCircleOutline } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

function StatusChip({ row }) {
  const status = row.status || 'pending';
  const config = {
    verified: { color: 'success', icon: <Verified sx={{ fontSize: 14 }} />, label: 'Verified' },
    pending: { color: 'warning', icon: <HourglassEmpty sx={{ fontSize: 14 }} />, label: 'Pending' },
    rejected: { color: 'error', icon: <GppBad sx={{ fontSize: 14 }} />, label: 'Rejected' },
    inactive: { color: 'default', icon: <Block sx={{ fontSize: 14 }} />, label: 'Inactive' },
  };
  const c = config[status] || config.pending;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Chip size="small" color={c.color} label={c.label} icon={c.icon} sx={{ borderRadius: 1.5, fontWeight: 500, fontSize: 11 }} />
      {status === 'rejected' && row.reason && (
        <Tooltip title={row.reason} placement="top">
          <Typography variant="caption" color="error.main" sx={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', fontSize: '0.65rem' }}>
            {row.reason}
          </Typography>
        </Tooltip>
      )}
    </Stack>
  );
}

export default function SettingBankAccounts() {
  const [banks, setBanks] = useState([]);
  const [banklists, setBanklists] = useState([]);
  const [is2FA, setIs2FA] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [bank, setBank] = useState({ bank_id: '', name: '', rec: '', otpVerification: '', emailOtp: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inline confirmation state
  const [confirmAction, setConfirmAction] = useState({ id: null, type: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleBankChange = (val, key) => setBank(prev => ({ ...prev, [key]: val }));
  const resetForm = () => {
    setBank({ bank_id: '', name: '', rec: '', otpVerification: '', emailOtp: '' });
    setTimer(0);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bl, b, fa] = await Promise.all([
        reqOwner({ action: 'banklists' }), 
        reqOwner({ action: 'banks' }),
        reqOwner({ action: 'check2FA' })
      ]);
      setBanklists(bl?.data || []);
      setBanks(b?.data || []);
      if (!fa.error && fa.data) setIs2FA(fa.data.isTwoFA);
    } catch {
      toast.error('Gagal memuat data bank');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await reqOwner({ action: 'requestPinOtp' });
      if (res.error) toast.error(res.message);
      else {
        toast.success(res.message);
        setTimer(60);
      }
    } catch { toast.error('Gagal mengirim OTP'); }
    finally { setIsSendingOtp(false); }
  };

  const handleSubmit = async () => {
    if (is2FA && !bank.otpVerification) return toast.error('Kode Authenticator wajib diisi');
    if (!is2FA && !bank.emailOtp) return toast.error('Kode OTP Email wajib diisi');

    setIsSubmitting(true);
    try {
      const payload = { 
        action: 'addbank', 
        ...bank,
        ...(is2FA ? { otpVerification: bank.otpVerification } : { emailOtp: bank.emailOtp })
      };
      const res = await reqOwner(payload);
      if (res.error) { toast.error(res.message); return; }
      if (res.data && res.data.status === 'rejected') {
        toast.warn(`Bank ditambahkan tapi ditolak: ${res.data.reason || 'Data tidak valid'}`);
      } else {
        toast.success(res.message);
      }
      resetForm();
      fetchData();
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processConfirm = async (id, actionType) => {
    setConfirmLoading(true);
    try {
      const action = actionType === 'default' ? 'setdefaultbank' : 'delbank';
      const res = await reqOwner({ action, setid: id });
      if (res.error) toast.error(res.message);
      else {
        toast.success(res.message);
        fetchData();
      }
    } catch {
      toast.error('Gagal memproses');
    } finally {
      setConfirmLoading(false);
      setConfirmAction({ id: null, type: null });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const visibleBanks = banks.filter(d => !d.deleted);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex' }}>
          <AccountBalance sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>Rekening Bank</Typography>
          <Typography variant="body2" color="text.secondary">Kelola rekening untuk deposit dan penarikan saldo.</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Kolom Kiri: Form Tambah Bank */}
        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ borderRadius: 4, position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add sx={{ fontSize: 20, color: '#6366f1' }} />
                Tambah Rekening Baru
              </Typography>
              
              <TextField label="Nomor Rekening" size="small" fullWidth value={bank.rec} onChange={e => handleBankChange(e.target.value, 'rec')} />
              <TextField label="Atas Nama" size="small" fullWidth value={bank.name} onChange={e => handleBankChange(e.target.value, 'name')} />
              <FormControl fullWidth size="small">
                <InputLabel>Nama Bank</InputLabel>
                <Select value={bank.bank_id} label="Nama Bank" onChange={e => handleBankChange(e.target.value, 'bank_id')}>
                  <MenuItem value="">Pilih Bank</MenuItem>
                  {banklists.map((b, i) => <MenuItem key={i} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
              
              <Divider sx={{ my: 0.5 }} />
              
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                    <Shield sx={{ fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>Verifikasi Keamanan</Typography>
                  </Box>
                  <Chip
                    label={is2FA ? 'Authenticator' : 'Email OTP'}
                    size="small"
                    icon={is2FA ? <Security sx={{ fontSize: 13 }} /> : <Info sx={{ fontSize: 13 }} />}
                    sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 600, height: 26 }}
                  />
                </Stack>

                {is2FA ? (
                  <TextField
                    label="Kode Authenticator" value={bank.otpVerification} onChange={e => handleBankChange(e.target.value, 'otpVerification')}
                    fullWidth size="small" placeholder="6 digit kode"
                    inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Security sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                    }}
                  />
                ) : (
                  <Stack spacing={1.5}>
                    <TextField
                      label="Kode OTP Email" value={bank.emailOtp} onChange={e => handleBankChange(e.target.value, 'emailOtp')}
                      size="small" placeholder="6 digit kode" fullWidth
                      inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Info sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleRequestOtp}
                      disabled={timer > 0 || isSendingOtp}
                      size="small"
                      startIcon={isSendingOtp ? <CircularProgress size={16} color="inherit" /> : <Refresh sx={{ fontSize: 16 }} />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {isSendingOtp ? 'Mengirim...' : timer > 0 ? `Kirim ulang (${timer}s)` : 'Kirim Kode OTP'}
                    </Button>
                  </Stack>
                )}
              </Stack>
              
              <Button 
                variant="contained" 
                onClick={handleSubmit} 
                disabled={!(bank.rec && bank.name && bank.bank_id) || isSubmitting || (is2FA ? !bank.otpVerification : !bank.emailOtp)} 
                sx={{ borderRadius: 2, textTransform: 'none', py: 1, fontWeight: 700, mt: 1 }} 
                startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
              >
                Simpan Bank
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Kolom Kanan: Daftar Rekening */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={130} sx={{ borderRadius: 4 }} />
              ))
            ) : visibleBanks.length === 0 ? (
              <Card variant="outlined" sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">Belum ada rekening bank yang terdaftar.</Typography>
              </Card>
            ) : (
              <AnimatePresence>
                {visibleBanks.map((row) => {
                  const isConfirmingDelete = confirmAction.id === row.id && confirmAction.type === 'delete';
                  const isConfirmingDefault = confirmAction.id === row.id && confirmAction.type === 'default';

                  return (
                    <motion.div key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                      <Card 
                        variant={row.is_default ? 'elevation' : 'outlined'}
                        sx={{ 
                          borderRadius: 4, 
                          position: 'relative',
                          overflow: 'visible',
                          borderColor: row.is_default ? '#6366f1' : 'divider',
                          borderWidth: row.is_default ? 2 : 1,
                          borderStyle: 'solid',
                          boxShadow: row.is_default ? '0 8px 24px -4px rgba(99,102,241,0.15)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {row.is_default && (
                           <Box sx={{ position: 'absolute', top: -12, right: 16, bgcolor: '#fff', borderRadius: '50%', p: 0.2, zIndex: 2 }}>
                             <CheckCircleOutline sx={{ fontSize: 24, color: '#6366f1' }} />
                           </Box>
                        )}
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                            <Box>
                              <Typography variant="h6" fontWeight={800} sx={{ fontFamily: 'monospace', letterSpacing: '0.05em', color: row.is_default ? '#6366f1' : 'text.primary' }}>
                                {row.rek}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                                a.n. {row.name}
                              </Typography>
                            </Box>
                            <Stack alignItems="flex-end" spacing={1}>
                              <Chip 
                                size="small" 
                                label={row?.bank_list?.name || 'Unknown'} 
                                sx={{ borderRadius: 1.5, fontWeight: 700, bgcolor: alpha('#64748B', 0.1), color: '#475569' }} 
                              />
                              <StatusChip row={row} />
                            </Stack>
                          </Stack>

                          <Divider sx={{ my: 1.5 }} />

                          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                            {!row.is_default && (
                              <Collapse in={!isConfirmingDelete} orientation="horizontal">
                                {isConfirmingDefault ? (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Button size="small" color="inherit" onClick={() => setConfirmAction({ id: null, type: null })} sx={{ minWidth: 0, px: 1, borderRadius: 2 }}><Close sx={{ fontSize: 16 }} /></Button>
                                    <Button 
                                      size="small" variant="contained" color="primary" 
                                      onClick={() => processConfirm(row.id, 'default')} 
                                      disabled={confirmLoading}
                                      sx={{ borderRadius: 2, textTransform: 'none', px: 1.5 }}
                                    >
                                      {confirmLoading ? <CircularProgress size={14} color="inherit" /> : 'Set Utama'}
                                    </Button>
                                  </Stack>
                                ) : (
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => setConfirmAction({ id: row.id, type: 'default' })}
                                    sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}
                                  >
                                    Jadikan Utama
                                  </Button>
                                )}
                              </Collapse>
                            )}

                            <Collapse in={!isConfirmingDefault} orientation="horizontal">
                              {isConfirmingDelete ? (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Button size="small" color="inherit" onClick={() => setConfirmAction({ id: null, type: null })} sx={{ minWidth: 0, px: 1, borderRadius: 2 }}><Close sx={{ fontSize: 16 }} /></Button>
                                  <Button 
                                    size="small" variant="contained" color="error" 
                                    onClick={() => processConfirm(row.id, 'delete')} 
                                    disabled={confirmLoading}
                                    sx={{ borderRadius: 2, textTransform: 'none', px: 1.5 }}
                                  >
                                    {confirmLoading ? <CircularProgress size={14} color="inherit" /> : 'Hapus'}
                                  </Button>
                                </Stack>
                              ) : (
                                <IconButton 
                                  size="small" 
                                  onClick={() => setConfirmAction({ id: row.id, type: 'delete' })}
                                  sx={{ color: 'error.main', bgcolor: alpha('#d32f2f', 0.04), borderRadius: 2, '&:hover': { bgcolor: alpha('#d32f2f', 0.1) } }}
                                >
                                  <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Collapse>
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}