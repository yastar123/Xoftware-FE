import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent, DialogTitle, DialogActions,
  TextField, CircularProgress, Stack, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, InputAdornment, alpha, Card, CardContent,
  Chip, IconButton, Tooltip,
} from '@mui/material';
import { Lock, Shield, VerifiedUser, PinDrop, FiberPin, Info, Delete, Refresh, Security } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

function PinDots({ value, maxLength = 6 }) {
  const dots = [];
  for (let i = 0; i < maxLength; i++) {
    const filled = i < value.length;
    dots.push(
      <Box
        key={i}
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: filled ? '#6366f1' : alpha('#000', 0.08),
          transition: 'all 0.15s ease',
          transform: filled ? 'scale(1.1)' : 'scale(1)',
        }}
      />
    );
  }
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', py: 0.5 }}>
      {dots}
    </Box>
  );
}

function StepIndicator({ step, label, active }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>
      <Box
        sx={{
          width: 28, height: 28, borderRadius: '50%',
          bgcolor: active ? '#6366f1' : alpha('#000', 0.06),
          color: active ? '#fff' : 'text.disabled',
          display: 'grid', placeItems: 'center',
          fontSize: 13, fontWeight: 700,
          transition: 'all 0.2s',
        }}
      >
        {step}
      </Box>
      <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400, fontSize: 13, color: active ? 'text.primary' : 'text.secondary' }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default function SettingSecurityPin() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [is2FA, setIs2FA] = useState(false);
  const [mode, setMode] = useState('set');
  const [pinData, setPinData] = useState({ oldPin: '', newPin: '', confirmPin: '', otpVerification: '', emailOtp: '' });
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await reqOwner({ action: 'check2FA' });
      if (!res.error && res.data) setIs2FA(res.data.isTwoFA);
    } catch {} finally { setIsLoading(false); }
  };

  const handleOpen = (m) => {
    setOpen(true);
    fetchStatus();
    setMode(m || 'set');
    setPinData({ oldPin: '', newPin: '', confirmPin: '', otpVerification: '', emailOtp: '' });
    setTimer(0);
  };

  const handleClose = () => {
    setOpen(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['oldPin', 'newPin', 'confirmPin', 'emailOtp', 'otpVerification'].includes(name)) {
      if (value && !/^\d+$/.test(value)) return;
    }
    setPinData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearPin = (field) => setPinData(prev => ({ ...prev, [field]: '' }));

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setPinData(prev => ({ ...prev, oldPin: '', newPin: '', confirmPin: '' }));
  };

  const handleRequestOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await reqOwner({ action: 'requestPinOtp' });
      if (res.error) toast.error(res.message);
      else {
        toast.success(res.message);
        setTimer(60);
        intervalRef.current = setInterval(() => {
          setTimer(prev => { if (prev <= 1) { clearInterval(intervalRef.current); return 0; } return prev - 1; });
        }, 1000);
      }
    } catch { toast.error('Gagal mengirim OTP'); }
    finally { setIsSendingOtp(false); }
  };

  const pinMatch = pinData.newPin && pinData.confirmPin && pinData.newPin === pinData.confirmPin;
  const pinLength = pinData.newPin.length;
  const pinValid = pinLength >= 4 && pinLength <= 6;

  const handleSubmit = async () => {
    if (mode === 'reset' && !pinData.oldPin) return toast.error('PIN Lama wajib diisi');
    if (!pinData.newPin) return toast.error('PIN Baru wajib diisi');
    if (!pinValid) return toast.error('PIN harus 4-6 digit');
    if (!pinMatch) return toast.error('Konfirmasi PIN tidak cocok');
    if (is2FA && !pinData.otpVerification) return toast.error('Kode Authenticator wajib diisi');
    if (!is2FA && !pinData.emailOtp) return toast.error('Kode OTP Email wajib diisi');

    setIsSubmitting(true);
    try {
      const action = mode === 'set' ? 'setPin' : 'resetPin';
      const payload = {
        action, newPin: pinData.newPin, confirmPin: pinData.confirmPin,
        ...(is2FA ? { otpVerification: pinData.otpVerification } : { emailOtp: pinData.emailOtp }),
        ...(mode === 'reset' ? { oldPin: pinData.oldPin } : {}),
      };
      const res = await reqOwner(payload);
      if (res.error) toast.error(res.message);
      else { toast.success(res.message); handleClose(); }
    } catch { toast.error('Terjadi kesalahan sistem'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ height: 6, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)' }} />
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box sx={{ p: 1.8, borderRadius: 3, bgcolor: alpha('#6366f1', 0.06), color: '#6366f1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <FiberPin sx={{ fontSize: 36 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>PIN Keamanan Withdraw</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                Tambahkan lapisan keamanan ekstra untuk penarikan saldo. PIN bersifat rahasia dan hanya Anda yang mengetahuinya.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip icon={<Shield sx={{ fontSize: 14 }} />} label="Enkripsi Aman" size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, borderColor: alpha('#10b981', 0.3), color: '#10b981' }} />
                <Chip icon={<Lock sx={{ fontSize: 14 }} />} label="4-6 Digit" size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, borderColor: alpha('#6366f1', 0.3), color: '#6366f1' }} />
                <Chip icon={<Security sx={{ fontSize: 14 }} />} label="Verifikasi 2FA/OTP" size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, borderColor: alpha('#f59e0b', 0.3), color: '#f59e0b' }} />
              </Stack>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => handleOpen('set')}
              startIcon={<PinDrop sx={{ fontSize: 18 }} />}
              sx={{
                flex: 1, borderRadius: 2, py: 1.4, textTransform: 'none', fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.35)' },
              }}
            >
              Buat PIN Baru
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleOpen('reset')}
              startIcon={<Lock sx={{ fontSize: 18 }} />}
              sx={{ flex: 1, borderRadius: 2, py: 1.4, textTransform: 'none', fontWeight: 600, borderColor: alpha('#000', 0.12) }}
            >
              Ubah PIN
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={isSubmitting ? undefined : handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)' }} />
        <DialogTitle sx={{ fontWeight: 700, pt: 3, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
              <PinDrop sx={{ fontSize: 22 }} />
            </Box>
            {mode === 'set' ? 'Buat PIN Withdraw' : 'Ubah PIN Withdraw'}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
          ) : (
            <Stack spacing={2.5} sx={{ pt: 0.5 }}>
              <Stack direction="row" spacing={3} sx={{ px: 2, py: 2, borderRadius: 2, bgcolor: alpha('#6366f1', 0.03), border: '1px solid', borderColor: alpha('#6366f1', 0.08) }}>
                <StepIndicator step={1} label="Masukkan PIN" active />
                <Box sx={{ flex: 1, height: 1, bgcolor: alpha('#000', 0.06), borderRadius: 1, alignSelf: 'center' }} />
                <StepIndicator step={2} label="Verifikasi" active={pinData.newPin.length >= 4} />
                <Box sx={{ flex: 1, height: 1, bgcolor: alpha('#000', 0.06), borderRadius: 1, alignSelf: 'center' }} />
                <StepIndicator step={3} label="Simpan" active={false} />
              </Stack>

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>Tindakan</FormLabel>
                <RadioGroup row value={mode} onChange={handleModeChange}>
                  <Card
                    variant="outlined"
                    onClick={() => handleModeChange({ target: { value: 'set' } })}
                    sx={{
                      flex: 1, mr: 1, cursor: 'pointer', borderRadius: 2,
                      borderColor: mode === 'set' ? '#6366f1' : 'divider',
                      borderWidth: mode === 'set' ? 2 : 1,
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: mode === 'set' ? '#6366f1' : alpha('#6366f1', 0.3) },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Radio size="small" value="set" checked={mode === 'set'} sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>Buat PIN Baru</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Untuk akun yang belum memiliki PIN</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  <Card
                    variant="outlined"
                    onClick={() => handleModeChange({ target: { value: 'reset' } })}
                    sx={{
                      flex: 1, cursor: 'pointer', borderRadius: 2,
                      borderColor: mode === 'reset' ? '#6366f1' : 'divider',
                      borderWidth: mode === 'reset' ? 2 : 1,
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: mode === 'reset' ? '#6366f1' : alpha('#6366f1', 0.3) },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Radio size="small" value="reset" checked={mode === 'reset'} sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>Ubah PIN</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Ganti PIN yang sudah ada</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>

              <Box sx={{ px: 2, py: 2, borderRadius: 2.5, bgcolor: alpha('#6366f1', 0.02), border: '1px solid', borderColor: alpha('#6366f1', 0.06) }}>
                <AnimatePresence mode="wait">
                  <motion.div key={mode} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>
                    {mode === 'reset' && (
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: 13 }}>PIN Lama</Typography>
                        </Stack>
                        <TextField
                          name="oldPin" type="password" value={pinData.oldPin} onChange={handleChange}
                          fullWidth size="small" placeholder="Masukkan PIN lama Anda"
                          inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 16 }} /></InputAdornment>,
                            endAdornment: pinData.oldPin ? <InputAdornment position="end"><IconButton size="small" onClick={() => handleClearPin('oldPin')} sx={{ color: 'text.disabled' }}><Delete sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null,
                          }}
                        />
                      </Stack>
                    )}

                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PinDrop sx={{ fontSize: 16, color: '#6366f1' }} />
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: 13 }}>PIN Baru</Typography>
                        <Box sx={{ flex: 1 }} />
                        {pinData.newPin && (
                          <Typography variant="caption" sx={{ color: pinValid ? 'success.main' : 'warning.main', fontWeight: 600, fontSize: 11 }}>
                            {pinLength}/6 digit
                          </Typography>
                        )}
                      </Stack>
                      <PinDots value={pinData.newPin} maxLength={6} />
                      <TextField
                        name="newPin" type="password" value={pinData.newPin} onChange={handleChange}
                        fullWidth size="small" placeholder="Masukkan 4-6 digit PIN baru"
                        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                        InputProps={{
                          endAdornment: pinData.newPin ? <InputAdornment position="end"><IconButton size="small" onClick={() => handleClearPin('newPin')} sx={{ color: 'text.disabled' }}><Delete sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null,
                        }}
                      />
                    </Stack>

                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <VerifiedUser sx={{ fontSize: 16, color: pinMatch ? '#10b981' : 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: 13 }}>Konfirmasi PIN</Typography>
                        {pinMatch && <Chip label="Cocok" size="small" color="success" sx={{ height: 20, fontSize: 10, borderRadius: 1 }} />}
                        {pinData.confirmPin && !pinMatch && <Chip label="Tidak cocok" size="small" color="error" sx={{ height: 20, fontSize: 10, borderRadius: 1 }} />}
                      </Stack>
                      <PinDots value={pinData.confirmPin} maxLength={6} />
                      <TextField
                        name="confirmPin" type="password" value={pinData.confirmPin} onChange={handleChange}
                        fullWidth size="small" placeholder="Ulangi PIN baru Anda"
                        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                        InputProps={{
                          endAdornment: pinData.confirmPin ? <InputAdornment position="end"><IconButton size="small" onClick={() => handleClearPin('confirmPin')} sx={{ color: 'text.disabled' }}><Delete sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null,
                        }}
                        error={pinData.confirmPin.length > 0 && !pinMatch}
                      />
                    </Stack>
                  </motion.div>
                </AnimatePresence>
              </Box>

              <Card variant="outlined" sx={{ borderRadius: 3, borderColor: alpha('#6366f1', 0.12), bgcolor: alpha('#f8f9fc', 0.5) }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                      <Shield sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>Verifikasi Keamanan</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {is2FA ? 'Masukkan kode dari Google Authenticator' : 'Kirim kode OTP ke email terdaftar'}
                      </Typography>
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
                      label="Kode Authenticator" name="otpVerification" value={pinData.otpVerification} onChange={handleChange}
                      fullWidth size="small" placeholder="6 digit kode"
                      inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Security sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                      }}
                    />
                  ) : (
                    <Stack spacing={1.5}>
                      <TextField
                        label="Kode OTP Email" name="emailOtp" value={pinData.emailOtp} onChange={handleChange}
                        size="small" placeholder="6 digit kode"
                        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Info sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                        }}
                      />
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          variant="outlined"
                          onClick={handleRequestOtp}
                          disabled={timer > 0 || isSendingOtp}
                          startIcon={isSendingOtp ? <CircularProgress size={16} color="inherit" /> : timer > 0 ? null : <Refresh sx={{ fontSize: 16 }} />}
                          sx={{
                            borderRadius: 2, minWidth: 140, flexShrink: 0,
                            textTransform: 'none', fontSize: 13, fontWeight: 600,
                            borderColor: alpha('#6366f1', 0.3),
                            '&:hover': { borderColor: '#6366f1', bgcolor: alpha('#6366f1', 0.04) },
                          }}
                        >
                          {isSendingOtp ? 'Mengirim...' : timer > 0 ? `Kirim ulang (${timer}s)` : 'Kirim Kode'}
                        </Button>
                        {timer > 0 && (
                          <Tooltip title="Sisa waktu">
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: alpha('#6366f1', 0.08), display: 'grid', placeItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{timer}</Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={handleClose} disabled={isSubmitting} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || !pinData.newPin || !pinValid || !pinMatch}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <VerifiedUser sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              '&:hover': { boxShadow: '0 6px 16px rgba(99,102,241,0.35)' },
              '&.Mui-disabled': { background: alpha('#000', 0.12), boxShadow: 'none' },
            }}
          >
            {isSubmitting ? 'Memproses...' : 'Simpan PIN'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}