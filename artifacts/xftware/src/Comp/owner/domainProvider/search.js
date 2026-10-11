import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Card, CardContent, Grid, Divider
} from '@mui/material';
import { Search, Payment, CheckCircle, Cancel, HelpOutline } from '@mui/icons-material';
import { useSocket } from '@/Context/SocketContext';
import { reqOwner } from '@/lib/requestApi';

export default function SearchDomain({ setOnResumeReady }) {
  const { socket } = useSocket();
  const [pricings, setPricings] = useState({});

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Register Modal (Checkout Flow)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [checkoutDomain, setCheckoutDomain] = useState(null);
  const [duration, setDuration] = useState(1);
  const [regLoading, setRegLoading] = useState(false);

  const fetchPricings = async () => {
    if (!socket) return;
    try {
      const res = await reqOwner({ action: 'domain.reseller.pricings' });
      if (!res?.error) {
        const data = res.data;
        const pricingMap = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            const priceFor1Year = item.pricings?.find(p => p.duration === 1)?.register_price || 0;
            if (priceFor1Year > 0) pricingMap[item.tld] = priceFor1Year;
          });
        }
        setPricings(pricingMap);
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchPricings();
    if (setOnResumeReady) {
      setOnResumeReady(() => {
        fetchPricings();
      });
    }
  }, [socket]);

  const handleSearch = async () => {
    if (!searchInput) return;
    const baseName = searchInput.split('.')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!baseName) return alert("Nama domain tidak valid.");
    if (Object.keys(pricings).length === 0) return alert("Daftar harga domain belum tersedia atau sistem sedang dalam perbaikan. Mohon muat ulang halaman.");

    const results = Object.keys(pricings).map(tld => ({
      domain: `${baseName}${tld}`,
      tld: tld,
      price: pricings[tld],
      status: 'loading' // idle, loading, available, unavailable, error
    }));
    setSearchResults(results);

    const updatedResults = await Promise.all(results.map(async (item) => {
      try {
        const res = await reqOwner({ action: 'domain.reseller.check', domain: item.domain });
        if (!res?.error && res.data?.available) {
          return { ...item, status: 'available' };
        } else {
          return { ...item, status: 'unavailable' };
        }
      } catch (e) {
        return { ...item, status: 'error' };
      }
    }));
    setSearchResults(updatedResults);
  };

  const calculatePrice = (price, yrs) => {
    return price ? price * yrs : 0;
  };

  const handleProceedRegister = async () => {
    if (!checkoutDomain) return;
    setRegLoading(true);

    try {
      const res = await reqOwner({
        action: 'domain.reseller.register',
        domain_name: checkoutDomain.domain,
        duration: parseInt(duration)
      });
      setRegLoading(false);

      if (!res?.error) {
        setRegisterModalOpen(false);
        const data = res.data;
        if (data && data.redirect) {
          window.open(data.redirect, '_blank');
        } else {
          alert(res.message || 'Sukses');
        }
      } else {
        alert("Pendaftaran gagal: " + res?.message);
      }
    } catch (e) {
      setRegLoading(false);
      alert("Pendaftaran gagal: " + e?.message);
    }
  };

  const openCheckout = (item) => {
    setCheckoutDomain(item);
    setDuration(1);
    setRegisterModalOpen(true);
  };

  return (
    <Box>
      {/* HERO DOMAIN SEARCH */}
      <Paper elevation={0} sx={{
        p: { xs: 4, md: 6 },
        mb: 4,
        borderRadius: 4,
        bgcolor: 'primary.main',
        color: 'white',
        backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #115293 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />

        <Typography variant="h4" fontWeight="800" mb={1} position="relative">Temukan Nama Domain Sempurna Anda</Typography>
        <Typography variant="subtitle1" mb={4} opacity={0.9} position="relative">Bangun identitas online Anda dengan domain profesional dan terpercaya.</Typography>

        <Box
          sx={{
            display: 'flex',
            maxWidth: 600,
            mx: 'auto',
            bgcolor: 'white',
            borderRadius: 8,
            p: 0.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            position: 'relative'
          }}
        >
          <TextField
            fullWidth
            placeholder="Ketik nama domain..."
            variant="outlined"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
              bgcolor: 'white',
              borderRadius: 8
            }}
          />
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={!searchInput}
            onClick={handleSearch}
            sx={{ px: 4, borderRadius: 6, fontWeight: 'bold' }}
            startIcon={<Search />}
          >
            Cari
          </Button>
        </Box>
      </Paper>

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Hasil Pencarian untuk &quot;{searchInput.split('.')[0]}&quot;
          </Typography>
          <Grid container spacing={2}>
            {searchResults.map((item, index) => (
              <Grid item xs={12} md={6} lg={4} key={item.domain}>
                <Card sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: item.status === 'available' ? 'success.main' : item.status === 'unavailable' ? 'error.main' : 'grey.300',
                  bgcolor: item.status === 'available' ? '#e8f5e9' : item.status === 'unavailable' ? '#ffebee' : '#fff',
                  transition: '0.2s',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                        {item.domain}
                      </Typography>
                      {item.status === 'idle' && <HelpOutline color="action" />}
                      {item.status === 'loading' && <CircularProgress size={20} />}
                      {item.status === 'available' && <CheckCircle color="success" />}
                      {item.status === 'unavailable' && <Cancel color="error" />}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Harga / Tahun</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                          Rp{item.price.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        {item.status === 'idle' || item.status === 'error' ? (
                          <Typography variant="body2" color="error" fontWeight="bold">
                            Gagal Memeriksa
                          </Typography>
                        ) : item.status === 'available' ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => openCheckout(item)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                          >
                            Beli
                          </Button>
                        ) : item.status === 'unavailable' ? (
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            disabled
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                          >
                            Tidak Tersedia
                          </Button>
                        ) : (
                          <Button disabled size="small" variant="outlined" sx={{ borderRadius: 2 }}>Mengecek...</Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Register / Checkout Modal */}
      <Dialog open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Konfirmasi Pembelian</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" fontWeight="bold" align="center" color="primary" mb={2}>
            {checkoutDomain?.domain}
          </Typography>
          <Typography variant="body2" mb={3} color="textSecondary" align="center">
            Anda akan dialihkan ke halaman pembayaran otomatis untuk menyelesaikan transaksi ini.
          </Typography>

          <Box bgcolor="grey.100" p={2} borderRadius={2}>
            <Typography variant="subtitle2" mb={1} color="textSecondary">Pilih Durasi Pendaftaran:</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  size="small"
                  fullWidth
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#fff' } }}
                >
                  <option value={1}>1 Tahun</option>
                  <option value={2}>2 Tahun</option>
                  <option value={3}>3 Tahun</option>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" fontWeight="bold" align="right" color="success.main">
                  Rp{checkoutDomain ? calculatePrice(checkoutDomain.price, duration).toLocaleString() : 0}
                </Typography>
              </Grid>
            </Grid>
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRegisterModalOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color="success"
            fullWidth
            disabled={regLoading}
            onClick={handleProceedRegister}
            startIcon={regLoading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
          >
            {regLoading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
