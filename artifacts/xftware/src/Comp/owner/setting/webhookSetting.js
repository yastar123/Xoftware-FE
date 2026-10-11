import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton,
  Card, CardContent, Stack, Tooltip, Typography, alpha,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Pagination, Collapse,
} from '@mui/material';
import {
  GraphicEq, Save, Refresh, Replay, History,
  Link as LinkIcon, ErrorOutline, CheckCircleOutline, AccessTime,
  ExpandMore, ExpandLess, Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

function safeStr(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function StatusChip({ status }) {
  const config = {
    pending: { color: 'warning', icon: <AccessTime sx={{ fontSize: 14 }} />, label: 'Pending' },
    success: { color: 'success', icon: <CheckCircleOutline sx={{ fontSize: 14 }} />, label: 'Success' },
    failed: { color: 'error', icon: <ErrorOutline sx={{ fontSize: 14 }} />, label: 'Failed' },
  };
  const c = config[status] || config.pending;
  return (
    <Chip 
      size="small" 
      color={c.color} 
      label={c.label} 
      icon={c.icon} 
      sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 11 }} 
    />
  );
}

function LogItem({ log, onRetry }) {
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async (e) => {
    e.stopPropagation();
    setRetrying(true);
    try {
      const res = await onRetry(log.id);
      if (!res?.error) {
        toast.success('Webhook dijadwalkan ulang');
      } else {
        toast.error(res?.message || 'Gagal merefresh');
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <>
      <TableRow 
        hover 
        onClick={() => setOpen(!open)} 
        sx={{ cursor: 'pointer', '& td': { fontSize: 13 } }}
      >
        <TableCell align="center">#{log.id}</TableCell>
        <TableCell align="center">
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {new Date(log.createdAt).toLocaleString('id-ID')}
            </Typography>
        </TableCell>
        <TableCell align="center">{log.channel || 'default'}</TableCell>
        <TableCell align="center"><StatusChip status={log.status} /></TableCell>
        <TableCell align="center">
           <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
             <IconButton size="small" onClick={() => setOpen(!open)}>
               {open ? <ExpandLess /> : <ExpandMore />}
             </IconButton>
             {log.status === 'failed' && (
               <Tooltip title="Klik untuk coba lagi">
                 <IconButton size="small" onClick={handleRetry} disabled={retrying} color="primary">
                   {retrying ? <CircularProgress size={16} /> : <Replay sx={{ fontSize: 16 }} />}
                 </IconButton>
               </Tooltip>
             )}
           </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, bgcolor: alpha('#000', 0.01), borderRadius: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">URL:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.url}</Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Payload:</Typography>
                        <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'auto', maxHeight: 200 }}>
                            <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(log.payload, null, 2)}</pre>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">Response:</Typography>
                        <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'auto', maxHeight: 200 }}>
                            <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(log.response_body, null, 2) || 'No response'}</pre>
                        </Box>
                    </Grid>
                </Grid>
                {log.error_msg && (
                   <Alert severity="error" sx={{ borderRadius: 2 }}>{log.error_msg}</Alert>
                )}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Simple Grid for the collapse
const Grid = ({ children, container, item, xs, md, spacing }) => {
    if (container) return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: spacing || 0 }}>{children}</Box>;
    if (item) return <Box sx={{ flex: { xs: '1 1 100%', md: md ? `1 1 calc(${md/12*100}% - 16px)` : '1 1 auto' } }}>{children}</Box>;
    return children;
};

export default function WebhookSettingPage() {
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getWebhook' });
      if (!res?.error) {
        setWebhookUrl(safeStr(res?.data?.webhook_url));
      }
      await fetchLogs(1);
    } catch {
      toast.error('Gagal memuat konfigurasi webhook');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = useCallback(async (p) => {
    setIsRefreshing(true);
    try {
      const res = await reqOwner({ action: 'monitoringWebhook', limit, offset: (p - 1) * limit });
      if (!res?.error) {
        setLogs(res?.data?.list || []);
        setTotal(res?.data?.total || 0);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWebhook = async () => {
    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        toast.error('URL harus dimulai dengan http:// atau https://');
        return;
    }
    setIsSaving(true);
    try {
      const res = await reqOwner({ action: 'setWebhook', url: webhookUrl });
      if (!res?.error) {
        toast.success('Webhook URL berhasil diperbarui');
      } else {
        toast.error(res?.message || 'Gagal menyimpan URL');
      }
    } catch {
      toast.error('Gagal menyimpan URL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async (logId) => {
    const res = await reqOwner({ action: 'retryWebhook', logId });
    if (!res?.error) {
        fetchLogs(page);
    }
    return res;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
            <GraphicEq sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Webhook</Typography>
            <Typography variant="caption" color="text.secondary">Kelola URL Webhook dan pantau riwayat notifikasi sistem</Typography>
          </Box>
        </Stack>

        {/* Configuration */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LinkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={700}>Webhook Configuration</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                URL ini akan dipanggil setiap kali ada event penting (seperti pembayaran sukses).
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://domain-anda.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                  onClick={handleSaveWebhook}
                  disabled={isSaving || !webhookUrl.trim()}
                  sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}
                >
                  Simpan
                </Button>
              </Box>

              <Alert severity="info" size="small" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                  Gunakan Webhook Monitoring di bawah untuk melihat payload dan mendebug integrasi Anda.
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Monitoring Logs */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <History sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Webhook Monitoring</Typography>
                </Stack>
                <Button 
                   size="small" 
                   variant="outlined" 
                   startIcon={isRefreshing ? <CircularProgress size={12} /> : <Refresh />} 
                   onClick={() => fetchLogs(page)}
                   disabled={isRefreshing}
                   sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                >
                  Refresh Logs
                </Button>
              </Stack>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                      <TableCell align="center">ID</TableCell>
                      <TableCell align="center">Waktu</TableCell>
                      <TableCell align="center">Channel</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Detail</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.disabled">Tidak ada log webhook.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <LogItem key={log.id} log={log} onRetry={handleRetry} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {total > limit && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                  <Pagination 
                    count={Math.ceil(total / limit)} 
                    page={page} 
                    onChange={(_, p) => { setPage(p); fetchLogs(p); }} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </motion.div>
  );
}
