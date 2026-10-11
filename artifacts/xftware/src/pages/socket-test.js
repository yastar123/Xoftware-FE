import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Stack, CircularProgress } from '@mui/material';
import { useSocket } from '@/Context/SocketContext';
import { reqOwner } from '@/lib/requestApi';

export default function SocketTestPage() {
  const { connected, socket } = useSocket();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transport, setTransport] = useState('Checking...');

  useEffect(() => {
    if (!socket) return;
    
    const updateTransport = () => {
        setTransport(socket.io.engine.transport.name);
    };

    socket.io.engine.on('upgrade', updateTransport);
    updateTransport();

    return () => {
        socket.io.engine.off('upgrade', updateTransport);
    };
  }, [socket]);

  const testAction = async () => {
    setLoading(true);
    setResult(null);
    try {
      // reqOwner sekarang otomatis pakai socket jika terkoneksi
      const res = await reqOwner({ action: 'check' });
      setResult(res);
    } catch (err) {
      setResult({ error: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight="bold">Socket.IO Test Page</Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: connected ? 'success.main' : 'error.main' 
              }} 
            />
            <Typography>Status: {connected ? 'Connected' : 'Disconnected'}</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Current Transport: <strong>{transport}</strong>
          </Typography>

          <Button 
            variant="contained" 
            onClick={testAction} 
            disabled={loading || !connected}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Test action: check (via Socket)'}
          </Button>

          {result && (
            <Box mt={2}>
              <Typography variant="subtitle2">Response Result:</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', overflow: 'auto', maxHeight: 300 }}>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </Paper>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Halaman ini digunakan untuk memverifikasi apakah reqOwner secara otomatis beralih menggunakan Socket.IO ketika koneksi tersedia.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
