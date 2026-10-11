import { Alert, Box, Button, Chip, CircularProgress, Divider, Stack, TextField, Typography, ToggleButton, ToggleButtonGroup, Card, CardContent, alpha, InputAdornment, Tooltip, Grid, Tabs, Tab } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { WhatsApp, Save, FiberNew, PlayArrow, Stop, ContentCopy, Settings, Info, NotificationsActive } from '@mui/icons-material';
import WaChannelNotifPage from './waChannelNotif';

function nowTime() {
  const d = new Date();
  return d.toLocaleString();
}

function safeStr(v) {
  return typeof v === 'string' ? v : '';
}

function normalizeCsv(input) {
  return safeStr(input).split(',').map(s => s.trim()).filter(Boolean).join(',');
}

function parseCsvToArray(input) {
  return normalizeCsv(input).split(',').map(s => s.trim()).filter(Boolean);
}

function isValidJidList(csv) {
  const arr = parseCsvToArray(csv);
  return arr.every(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid'));
}

function levelToColor(level) {
  if (level === 'error') return 'error.main';
  if (level === 'warn') return 'warning.main';
  if (level === 'success') return 'success.main';
  return 'text.secondary';
}

async function tryGenerateQrDataUrl(code) {
  try {
    const mod = await import('qrcode');
    const QRCode = mod?.default || mod;
    if (!QRCode?.toDataURL) return null;
    return await QRCode.toDataURL(code, { margin: 1, width: 280 });
  } catch {
    return null;
  }
}

function CodeBoxes({ code }) {
  const chars = safeStr(code).replace(/\s+/g, '').split('');
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {chars.map((ch, idx) => (
        <Box
          key={idx}
          sx={{
            width: 34,
            height: 44,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 18,
            fontWeight: 700,
            userSelect: 'none',
          }}
        >
          {ch || ' '}
        </Box>
      ))}
    </Box>
  );
}

export default function BotWhatsAppConfig() {
  const [loading, setLoading] = useState(false);
  const LS_ACTION_KEY = 'wabot_action';
  const LS_QR_KEY = 'wabot_qr';
  const LS_PAIRING_MODE_KEY = 'wabot_pairing_mode';

  const readLS = (k, fallback = '') => {
    try {
      const v = window.localStorage.getItem(k);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  };

  const writeLS = (k, v) => {
    try {
      if (v === undefined || v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, String(v));
    } catch {}
  };

  const [persistedAction, setPersistedAction] = useState(() => readLS(LS_ACTION_KEY, 'stop'));
  const [persistedQr, setPersistedQr] = useState(() => readLS(LS_QR_KEY, ''));
  const [mainTab, setMainTab] = useState('config');

  const [allowWA, setAllowWA] = useState(true);
  const [session, setSession] = useState('');
  const [form, setForm] = useState({
    botNumber: '',
    ownerNumber: '',
    adminNumber: '',
    isPublic: false,
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [conn, setConn] = useState(null);
  const [pairingMode, setPairingMode] = useState(() => {
    const v = readLS(LS_PAIRING_MODE_KEY, 'qr');
    return v === 'phone' ? 'phone' : 'qr';
  });
  const [pairing, setPairing] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrGenError, setQrGenError] = useState(false);
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);
  const lastConnSnapshotRef = useRef(null);
  const seenEventIdsRef = useRef(new Set());

  useEffect(() => { writeLS(LS_ACTION_KEY, persistedAction || 'stop'); }, [persistedAction]);
  useEffect(() => { writeLS(LS_QR_KEY, persistedQr || ''); }, [persistedQr]);
  useEffect(() => { writeLS(LS_PAIRING_MODE_KEY, pairingMode || 'qr'); }, [pairingMode]);

  useEffect(() => {
    const onStorage = e => {
      if (!e?.key) return;
      if (e.key === LS_ACTION_KEY) setPersistedAction(readLS(LS_ACTION_KEY, 'stop'));
      if (e.key === LS_QR_KEY) setPersistedQr(readLS(LS_QR_KEY, ''));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const appendLog = (level, message) => {
    setLogs(prev => {
      const next = [...prev, { ts: nowTime(), level, message: typeof message === 'string' ? message : JSON.stringify(message) }];
      return next.length > 300 ? next.slice(next.length - 300) : next;
    });
  };

  const scrollToBottom = () => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [logs]);

  const canSaveSetting = useMemo(() => {
    if (!safeStr(form.botNumber).trim()) return false;
    if (!isValidJidList(form.ownerNumber || '')) return false;
    if (!isValidJidList(form.adminNumber || '')) return false;
    return true;
  }, [form]);

  const canCreate = useMemo(() => canSaveSetting && !session, [canSaveSetting, session]);
  const canNewConnection = useMemo(() => !loading, [loading]);
  const isPairingState = useMemo(() => conn?.conn_state === 'pairing', [conn]);

  const fetchBotInfo = async () => {
    try {
      const res = await reqOwner({ action: 'getInformationBot' });
      if (res?.error) {
        appendLog('error', `getInformationBot: ${res?.message || 'error'}`);
        return toast.error(res?.message || 'Gagal mengambil informasi bot');
      }
      const data = res?.data || {};
      setAllowWA(!!data.allowWhatsAppBot);
      setSession(data.session || '');
      if (!formInitialized) {
        setForm({ ownerNumber: (data.ownerNumber || []).join(','), adminNumber: (data.adminNumber || []).join(','), botNumber: (data.botNumber || '').replace('@s.whatsapp.net', ''), isPublic: !!data.isPublic });
        setFormInitialized(true);
      }
      appendLog('info', `Info bot dimuat. session=${data.session ? 'ada' : 'kosong'}`);
    } catch (e) {
      appendLog('error', `getInformationBot exception: ${String(e)}`);
      toast.error('Gagal mengambil informasi bot');
    }
  };

  const fetchConnection = async (opts = {}) => {
    if (!session) return;
    try {
      const res = await reqOwner({ action: 'wabot.connection.get' });
      if (res?.error) {
        appendLog('error', `wabot.connection.get: ${res?.message || 'error'}`);
        if (!opts?.silentToast) toast.error(res?.message || 'Gagal cek koneksi');
        return;
      }
      const data = res?.data || null;
      setConn(data);
      if (data?.conn_state === 'new') {
        if (typeof setPersistedAction === 'function') setPersistedAction('stop');
        try { localStorage.setItem('wabot_action', 'stop'); } catch {}
      }
      const maybeCode = data?.pairing_code || data?.pairing?.code || data?.qr || data?.qr_code || '';
      if (maybeCode) {
        if (typeof setPersistedQr === 'function') setPersistedQr(maybeCode);
        try { localStorage.setItem('wabot_qr', maybeCode); } catch {}
      }
      const snapshot = { conn_state: data?.conn_state || '-', logged_in: !!data?.logged_in, connected: !!data?.connected };
      const prev = lastConnSnapshotRef.current;
      const changed = !prev || prev.conn_state !== snapshot.conn_state || prev.logged_in !== snapshot.logged_in || prev.connected !== snapshot.connected;
      if (changed) {
        appendLog('info', `connection changed -> state=${snapshot.conn_state} | logged=${snapshot.logged_in} | connected=${snapshot.connected}`);
        lastConnSnapshotRef.current = snapshot;
      }
      const events = Array.isArray(data?.recent_events) ? data.recent_events : [];
      const start = Math.max(0, events.length - 30);
      for (let i = start; i < events.length; i++) {
        const ev = events[i];
        const evId = ev?.id || ev?.event_id || ev?.ts || ev?.created_at || ev?.timestamp || `${ev?.event_type || 'unknown'}-${i}`;
        if (!seenEventIdsRef.current.has(evId)) {
          seenEventIdsRef.current.add(evId);
          const extra = ev?.message || ev?.detail || ev?.reason || '';
          appendLog('info', `event: ${ev?.event_type || 'unknown'}${extra ? ` | ${safeStr(extra)}` : ''}`);
        }
      }
    } catch (e) {
      appendLog('error', `wabot.connection.get exception: ${String(e)}`);
      if (!opts?.silentToast) toast.error('Gagal cek koneksi');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBotInfo(); }, []);

  useEffect(() => {
    setConn(null);
    setPairing(null);
    setQrDataUrl(null);
    lastConnSnapshotRef.current = null;
    seenEventIdsRef.current = new Set();
    if (session) fetchConnection({ silentToast: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const ms = isPairingState ? 2000 : 8000;
    const t = setInterval(() => fetchConnection({ silentToast: true }), ms);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPairingState]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const code = safeStr(persistedQr || pairing?.code);
      setQrGenError(false);
      if (!code) { setQrDataUrl(null); return; }
      if (code.length < 13) return;
      const url = await tryGenerateQrDataUrl(code);
      if (!mounted) return;
      setQrDataUrl(url);
      if (!url) setQrGenError(true);
    })();
    return () => { mounted = false; };
  }, [persistedQr, pairing?.code, pairing?.type, pairingMode]);

  const handleChange = field => e => {
    const value = e?.target?.value ?? e;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSetting = async () => {
    setLoading(true);
    setFormInitialized(true);
    try {
      const payload = {
        action: 'updateInformationBot',
        botNumber: form.botNumber,
        ownerNumber: parseCsvToArray(form.ownerNumber),
        adminNumber: parseCsvToArray(form.adminNumber),
        isPublic: !!form.isPublic,
      };
      const res = await reqOwner(payload);
      if (res?.error) {
        appendLog('error', `updateInformationBot: ${res?.message || 'error'}`);
        toast.error(res?.message || 'Gagal update konfigurasi');
      } else {
        appendLog('success', 'Setting disimpan.');
        toast.success(res?.message || 'Berhasil update konfigurasi bot');
        await fetchBotInfo();
      }
    } catch (e) {
      appendLog('error', `updateInformationBot exception: ${String(e)}`);
      toast.error('Gagal update informasi bot');
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    appendLog('info', 'Mencoba create WA Bot...');
    try {
      const res = await reqOwner({ action: 'wabot.create' });
      if (res?.error) {
        appendLog('error', `wabot.create: ${res?.message || 'error'}`);
        toast.error(res?.message || 'Gagal create bot');
        return;
      }
      appendLog('success', 'Bot berhasil dibuat. Mengambil info terbaru...');
      toast.success(res?.message || 'Bot berhasil dibuat');
      await fetchBotInfo();
      await fetchConnection({ silentToast: true });
    } catch (e) {
      appendLog('error', `wabot.create exception: ${String(e)}`);
      toast.error('Gagal create bot');
    } finally { setLoading(false); }
  };

  const handleNewConnection = async () => {
    if (conn.logged_in && !confirm('Perhatian, anda mengetuk tombol New, maka bot anda akan berhenti, session di hapus, dan di lakukan pairing ulang!\nApakah anda yakin ingin melakukannya?')) return;
    setPersistedAction('stop');
    setPersistedQr('');
    setLoading(true);
    appendLog('info', 'Request NEW connection...');
    try {
      const res = await reqOwner({ action: 'wabot.connection.new' });
      if (res?.error) {
        appendLog('error', `wabot.connection.new: ${res?.message || 'error'}`);
        toast.error(res?.message || 'Gagal membuat koneksi baru');
        return;
      }
      appendLog('success', 'NEW connection requested.');
      toast.success(res?.message || 'Berhasil request new connection');
      await fetchConnection({ silentToast: true });
    } catch (e) {
      appendLog('error', `wabot.connection.new exception: ${String(e)}`);
      toast.error('Gagal membuat koneksi baru');
    } finally { setLoading(false); }
  };

  const handleStartPairing = async () => {
    if (!session) return;
    setPersistedAction('start');
    setLoading(true);
    const mode = pairingMode === 'phone' ? 'phone' : 'qr';
    appendLog('info', `Start pairing (${mode})...`);
    try {
      const res = await reqOwner({ action: conn?.logged_in ? 'wabot.start' : mode === 'phone' ? 'wabot.pairing.phone' : 'wabot.pairing.qr' });
      if (res?.error) {
        appendLog('warn', `wabot.start: ${res?.message || 'error'}`);
      } else {
        appendLog('success', 'Bot service start requested.');
      }
      if (conn?.logged_in) {
        toast.success('Bot di start');
      } else {
        const data = res?.data || {};
        const nextPairing = { type: mode, code: data?.code || data?.pairing_code, event: data.event };
        setPairing(nextPairing);
        if (data?.code || data?.pairing_code) setPersistedQr(data.code || data.pairing_code);
        appendLog('success', `start: OK (event=${data.event || '-'})`);
        toast.success('Pairing dimulai');
      }
      await fetchConnection({ silentToast: true });
    } catch (e) {
      appendLog('error', `pairing exception: ${String(e)}`);
      toast.error('Gagal memulai pairing');
    } finally { setLoading(false); }
  };

  const handleStop = async () => {
    setPersistedAction('stop');
    setLoading(true);
    appendLog('info', 'Stop bot...');
    try {
      const res = await reqOwner({ action: 'wabot.stop' });
      if (res?.error) {
        appendLog('error', `wabot.stop: ${res?.message || 'error'}`);
        toast.error(res?.message || 'Gagal stop bot');
        return;
      }
      appendLog('success', 'Bot berhasil di-stop.');
      toast.success(res?.message || 'Bot di-stop');
      await fetchConnection({ silentToast: true });
    } catch (e) {
      appendLog('error', `wabot.stop exception: ${String(e)}`);
      toast.error('Gagal stop bot');
    } finally { setLoading(false); }
  };

  if (!allowWA) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400, gap: 2 }}>
        <WhatsApp sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography color="text.disabled">Bot tidak diaktifkan untuk WhatsApp.</Typography>
      </Stack>
    );
  }

  const isActionStart = persistedAction === 'start';
  const startDisabled = !session || loading || conn?.conn_state === 'new' || isActionStart;
  const stopDisabled = !session || loading || !isActionStart;
  const effectiveCode = persistedQr || pairing?.code || '';
  const effectiveType = pairing?.type || (pairingMode === 'phone' ? 'phone' : 'qr');

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <WhatsApp sx={{ fontSize: 32, color: '#6366f1' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>Bot WhatsApp</Typography>
          <Typography variant="body2" color="text.secondary">Konfigurasi koneksi dan pairing session bot WhatsApp Anda.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-end">
          <Chip label={session ? `Session: ${session}` : 'Session: -'} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 600 }} />
          <Chip label={`State: ${conn?.conn_state || '-'}`} size="small" color={conn?.connected ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 600 }} />
          <Chip label={`Logged: ${conn?.logged_in ? 'Ya' : 'Tidak'}`} size="small" color={conn?.logged_in ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 600 }} />
        </Stack>
      </Stack>

      <Tabs
        value={mainTab}
        onChange={(e, v) => setMainTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          maxWidth: '100%',
          width: '100%',
          minWidth: 0,
          '& .MuiTabs-scroller': {
            overflowX: 'auto !important',
          },
          '& .MuiTab-root': {
            whiteSpace: 'nowrap',
            fontSize: { xs: 12.5, sm: 14 },
            px: { xs: 1.5, sm: 2 },
          },
        }}
      >
        <Tab icon={<Settings fontSize="small" />} iconPosition="start" label="Pengaturan & Pairing" value="config" />
        <Tab icon={<NotificationsActive fontSize="small" />} iconPosition="start" label="Notifikasi Saluran & Grup" value="channelNotif" />
      </Tabs>

      {mainTab === 'config' && (
        <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Pengaturan Bot */}
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>Pengaturan Detail Bot</Typography>
                
                <Stack spacing={2.5}>
                  <TextField
                    label="Nomor Bot (contoh: 628xxxx)"
                    value={form.botNumber}
                    onChange={handleChange('botNumber')}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><WhatsApp sx={{ fontSize: 20, color: 'text.disabled' }} /></InputAdornment> }}
                  />
                  <TextField
                    label="Owner JID (pisahkan dengan koma)"
                    value={form.ownerNumber || ''}
                    onChange={e => handleChange('ownerNumber')(e)}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    helperText="Harus diakhiri @s.whatsapp.net atau @lid"
                    error={!isValidJidList(form.ownerNumber || '')}
                  />
                  <TextField
                    label="Admin JID (pisahkan dengan koma)"
                    value={form.adminNumber || ''}
                    onChange={e => handleChange('adminNumber')(e)}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    helperText="Harus diakhiri @s.whatsapp.net atau @lid"
                    error={!isValidJidList(form.adminNumber || '')}
                  />
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Untuk owner/admin JID harus diakhiri dengan <b>@s.whatsapp.net</b> atau <b>@lid</b>. Buang spasi agar nomor terbaca.
                  </Alert>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="contained"
                      disabled={loading || !canSaveSetting}
                      onClick={handleSaveSetting}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4, py: 1.2 }}
                    >
                      Simpan Pengaturan
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#f8f9fc', 0.5), boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Sistem Logs</Typography>
                <Box
                  ref={logRef}
                  sx={{
                    height: 260,
                    overflow: 'auto',
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#ffffff',
                  }}
                >
                  {logs.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>Belum ada log.</Typography>
                  ) : logs.map((l, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ color: 'text.disabled', minWidth: 160, flexShrink: 0 }}>[{l.ts}]</Box>
                      <Box sx={{ color: levelToColor(l.level), fontWeight: 700, minWidth: 72 }}>{l.level.toUpperCase()}</Box>
                      <Box sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.message}</Box>
                    </Box>
                  ))}
                </Box>
                {conn?.recent_events?.length ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Recent events:</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {conn.recent_events.slice(0, 10).map((ev, idx) => (
                        <Chip key={idx} size="small" label={ev.event_type} variant="outlined" sx={{ fontSize: 10, height: 20, borderRadius: 1.5 }} />
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'relative', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)', height: '100%', minHeight: 500 }}>
            {!session && (
              <Box
                sx={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
                  bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: 4, px: 3, textAlign: 'center',
                }}
              >
                <Alert severity="warning" sx={{ borderRadius: 2 }}>Pastikan Anda telah mengisi dan menyimpan <b>Pengaturan Detail Bot</b> di sebelah kiri sebelum membuat session.</Alert>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={loading || !canCreate}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FiberNew />}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
                >
                  Create Session Baru
                </Button>
              </Box>
            )}

            <Box sx={{ opacity: !session ? 0.3 : 1, pointerEvents: !session ? 'none' : 'auto', p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                 <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), display: 'flex' }}><Settings sx={{ color: '#6366f1' }} /></Box>
                 <Typography variant="h6" fontWeight={700}>Aksi & Kontrol Koneksi</Typography>
              </Stack>
              
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                 Selalu <b>Simpan Pengaturan</b> sebelum menjalankan (Start) bot.
              </Alert>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Metode Pairing</Typography>
              <ToggleButtonGroup
                value={pairingMode}
                exclusive
                onChange={(_, v) => v && setPairingMode(v)}
                size="small"
                disabled={!session}
                fullWidth
                sx={{ mb: 3, '& .MuiToggleButton-root': { borderRadius: 2, textTransform: 'none', fontWeight: 600 } }}
              >
                <ToggleButton value="qr">Pairing QR Code</ToggleButton>
                <ToggleButton value="phone">Pairing No. HP</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Kontrol Bot</Typography>
              <Grid container spacing={1} sx={{ mb: 4 }}>
                <Grid item xs={4}>
                  <Tooltip title="Buat koneksi baru (Hapus session)">
                    <span>
                      <Button fullWidth size="small" variant="outlined" color="warning" onClick={handleNewConnection} disabled={loading || !canNewConnection} startIcon={<FiberNew sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, textTransform: 'none', py: 1, fontWeight: 700 }}>New</Button>
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Mulai / Pairing">
                    <span>
                      <Button fullWidth size="small" variant="contained" color="success" onClick={handleStartPairing} disabled={startDisabled} startIcon={<PlayArrow sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, textTransform: 'none', py: 1, boxShadow: 'none', fontWeight: 700 }}>Start</Button>
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs={4}>
                  <Tooltip title="Hentikan bot">
                    <span>
                      <Button fullWidth size="small" variant="outlined" color="error" onClick={handleStop} disabled={loading || !session || stopDisabled} startIcon={<Stop sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, textTransform: 'none', py: 1, fontWeight: 700 }}>Stop</Button>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Output Pairing</Typography>
              {!session ? (
                <Typography variant="body2" color="text.secondary">Buat session dulu (Create) sebelum melakukan pairing.</Typography>
              ) : effectiveCode ? (
                <Stack spacing={2} sx={{ flex: 1 }}>
                  {effectiveType === 'qr' && (
                    <Box sx={{ width: '100%', maxWidth: 280, aspectRatio: '1/1', mx: 'auto', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      {qrDataUrl ? (
                        <Box component="img" src={qrDataUrl} alt="QR Code" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : qrGenError ? (
                        <Box sx={{ p: 2 }}><Alert severity="warning" sx={{ borderRadius: 2 }}>Gagal generate QR image, reload atau Klik tombol new</Alert></Box>
                      ) : (
                        <Stack spacing={1} alignItems="center"><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Menyiapkan QR Code...</Typography></Stack>
                      )}
                    </Box>
                  )}
                  {effectiveType === 'phone' && (
                    <Stack spacing={2}>
                      <Alert severity="success" sx={{ borderRadius: 2 }}>Masukkan pairing code di WhatsApp (Linked devices → Link with phone number), lalu tunggu status berubah menjadi connected.</Alert>
                      {effectiveCode.length > 9 ? (
                        <Typography variant="caption" color="error">Tidak ada pairing code!</Typography>
                      ) : <CodeBoxes code={effectiveCode} />}
                      <Button size="small" variant="outlined" startIcon={<ContentCopy sx={{ fontSize: 16 }} />} onClick={() => { navigator.clipboard?.writeText(effectiveCode || ''); toast.success('Code disalin'); }} sx={{ borderRadius: 2, textTransform: 'none', width: 'fit-content', fontWeight: 600, py: 1, px: 2 }}>Salin Code</Button>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 120, bgcolor: alpha('#000', 0.02), borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ px: 2 }}>Klik <b>Start</b> untuk meminta pairing ({pairingMode === 'phone' ? 'Phone' : 'QR'}).</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      )}

      {mainTab === 'channelNotif' && <WaChannelNotifPage />}
    </Box>
  );
}