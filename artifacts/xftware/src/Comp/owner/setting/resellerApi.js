import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton,
  Card, CardContent, Stack, Tooltip, Typography, alpha,
  TextField, InputAdornment, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, Pagination, Collapse
} from '@mui/material';
import {
  HubRounded, Refresh, AddRounded, DeleteOutlineRounded,
  EditOutlined, StorefrontRounded, CheckCircleOutlineRounded,
  SearchRounded, AccountBalanceWalletRounded,
  LocalMallRounded, ReceiptLongRounded, Info,
  KeyboardArrowDown, KeyboardArrowUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function ResellerApiSettingPage() {
  const [loading, setLoading] = useState(true);
  const [botInfo, setBotInfo] = useState(null);

  // Data Produk Terkoleksi
  const [collectedProducts, setCollectedProducts] = useState([]);
  const [loadingCollected, setLoadingCollected] = useState(false);
  const [expandedMainRows, setExpandedMainRows] = useState({});

  // Modal Collect Star Seller
  const [openModalCollect, setOpenModalCollect] = useState(false);
  const [searchMarket, setSearchMarket] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [collectingId, setCollectingId] = useState(null);
  const [marketPage, setMarketPage] = useState(1);
  const [marketTotalPages, setMarketTotalPages] = useState(1);
  const [marketTotal, setMarketTotal] = useState(0);
  const [expandedCollectRows, setExpandedCollectRows] = useState({});

  // Modal Edit Markup
  const [editMarkupItem, setEditMarkupItem] = useState(null);
  const [markupInput, setMarkupInput] = useState('0');
  const [savingMarkup, setSavingMarkup] = useState(false);

  // Toggle expand
  const toggleCollectExpand = (id) => {
    setExpandedCollectRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleMainExpand = (id) => {
    setExpandedMainRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Ambil data dasar bot (Saldo Reseller)
  const fetchBasicData = useCallback(async () => {
    try {
      const [resInfo, resSaldo] = await Promise.all([
        reqOwner({ action: 'getInformationBot' }).catch(() => null),
        reqOwner({ action: 'getResellerSaldoInfo' }).catch(() => null),
      ]);

      const rawSaldo = resSaldo?.data?.balance ?? resInfo?.data?.reseller_saldo ?? resInfo?.data?.resellerSaldo ?? 0;
      setBotInfo({
        resellerSaldo: Number(rawSaldo || 0),
        storeName: resInfo?.data?.store_name || resInfo?.data?.username || 'Bot Anda',
      });
    } catch {
      toast.error('Gagal mengambil data bot');
    }
  }, []);

  // Ambil produk yang di-collect
  const fetchCollected = useCallback(async () => {
    setLoadingCollected(true);
    try {
      const res = await reqOwner({ action: 'resellerApi.getCollectedProducts' });
      if (!res?.error) {
        setCollectedProducts(res?.data || []);
      } else {
        toast.error(res?.message || 'Gagal memuat katalog produk API');
      }
    } catch {
      toast.error('Gagal mengambil produk API');
    } finally {
      setLoadingCollected(false);
    }
  }, []);

  // Ambil katalog Star Seller untuk di-collect
  const fetchMarketplace = useCallback(async (keyword = '', page = 1) => {
    setLoadingMarket(true);
    try {
      const res = await reqOwner({
        action: 'resellerApi.getAvailableStarSellerProducts',
        search: keyword,
        page,
        limit: 20,
      });
      if (!res?.error) {
        setAvailableProducts(res?.data?.products || []);
        setMarketPage(res?.data?.page || 1);
        setMarketTotalPages(res?.data?.total_pages || 1);
        setMarketTotal(res?.data?.total || 0);
      } else {
        toast.error(res?.message || 'Gagal memuat katalog Star Seller');
      }
    } catch {
      toast.error('Koneksi bermasalah');
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBasicData();
      await fetchCollected();
      setLoading(false);
    })();
  }, [fetchBasicData, fetchCollected]);

  // Navigasi ke menu Info Reseller -> Transaksi Reseller
  const handleGoToResellerTransactions = () => {
    localStorage.setItem('owner', 'product');
    localStorage.setItem('owner-sub', 'reseller-info');
    window.history.pushState({ key: 'product', subKey: 'reseller-info' }, '', '#product-reseller-info');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { key: 'product', subKey: 'reseller-info' } }));
  };

  // Action: Collect Product
  const handleCollect = async (stockId) => {
    setCollectingId(stockId);
    try {
      const res = await reqOwner({
        action: 'resellerApi.collectProduct',
        stock_id: stockId,
        markup_price: 0,
      });
      if (!res?.error) {
        toast.success('Produk berhasil ditambahkan ke API!');
        await fetchCollected();
      } else {
        toast.error(res?.message || 'Gagal menambahkan produk');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menambahkan produk');
    } finally {
      setCollectingId(null);
    }
  };

  // Action: Simpan Markup
  const handleSaveMarkup = async () => {
    if (!editMarkupItem) return;
    const num = parseInt(markupInput.replace(/\D/g, ''), 10) || 0;
    if (num < 0) {
      toast.error('Markup tidak boleh minus');
      return;
    }

    setSavingMarkup(true);
    try {
      const res = await reqOwner({
        action: 'resellerApi.updateMarkup',
        id: editMarkupItem.id,
        collected_id: editMarkupItem.id,
        markup_price: num,
      });
      if (!res?.error) {
        toast.success('Markup berhasil diperbarui');
        setEditMarkupItem(null);
        await fetchCollected();
      } else {
        toast.error(res?.message || 'Gagal memperbarui markup');
      }
    } catch {
      toast.error('Gagal memperbarui markup');
    } finally {
      setSavingMarkup(false);
    }
  };

  // Action: Hapus dari Koleksi
  const handleRemove = async (collectedId, productTitle) => {
    if (!confirm(`Hapus "${productTitle}" dari katalog API Reseller Anda?`)) return;

    try {
      const res = await reqOwner({
        action: 'resellerApi.removeCollectedProduct',
        id: collectedId,
        collected_id: collectedId,
      });
      if (!res?.error) {
        toast.success('Produk dihapus dari API');
        await fetchCollected();
      } else {
        toast.error(res?.message || 'Gagal menghapus produk');
      }
    } catch {
      toast.error('Gagal menghapus produk');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Stack spacing={3} sx={{ pb: 4, width: '100%' }}>
        {/* Header Title */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <HubRounded sx={{ fontSize: 20, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>API Reseller</Typography>
            <Typography variant="caption" color="text.secondary">Kelola integrasi produk Host-to-Host dan katalog produk API</Typography>
          </Box>
        </Stack>

        {/* Documentation Alert Banner */}
        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            borderRadius: 3,
            bgcolor: alpha('#6366f1', 0.05),
            color: 'primary.main',
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.1),
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography variant="body2" fontWeight={600}>
              Butuh bantuan integrasi API Reseller? Pelajari selengkapnya di dokumentasi kami.
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={() => window.open('/docs/api-reseller', '_blank')}
              endIcon={<HiOutlineExternalLink />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2, boxShadow: 'none' }}
            >
              Dokumentasi
            </Button>
          </Stack>
        </Alert>

        {/* Saldo Reseller Card */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccountBalanceWalletRounded sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Saldo Reseller</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReceiptLongRounded sx={{ fontSize: 16 }} />}
                    onClick={handleGoToResellerTransactions}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Transaksi Reseller
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Refresh sx={{ fontSize: 16 }} />}
                    onClick={async () => {
                      await Promise.all([fetchBasicData(), fetchCollected()]);
                      toast.success('Data saldo & katalog berhasil disegarkan');
                    }}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Segarkan
                  </Button>
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Saldo deposit reseller yang digunakan untuk memproses pembelian produk Star Seller via API.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {formatRupiah(botInfo?.resellerSaldo)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Katalog Produk API Card */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocalMallRounded sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Katalog Produk API ({collectedProducts.length})
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Daftar produk Star Seller yang telah dikoleksi untuk dapat ditransaksikan melalui API Reseller.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => {
                  setOpenModalCollect(true);
                  fetchMarketplace(searchMarket);
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Tambah Produk
              </Button>
            </Stack>

            {loadingCollected ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Memuat katalog produk...
                </Typography>
              </Box>
            ) : collectedProducts.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                <StorefrontRounded sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Belum Ada Produk Dikoleksi
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 450, mx: 'auto' }}>
                  Koleksi produk dari Star Seller agar pembeli API Host-to-Host dapat melihat dan memesan produk melalui bot Anda.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={() => {
                    setOpenModalCollect(true);
                    fetchMarketplace(searchMarket);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Koleksi Produk Sekarang
                </Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Produk</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Star Seller</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Harga Modal</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Markup (Profit)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Harga API</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collectedProducts.map((row) => {
                      const stock = row.stock || {};
                      const markup = Number(row.markup_price || 0);
                      const hasVars = Boolean(stock.is_variation && Array.isArray(stock.variations) && stock.variations.length > 0);
                      const varPrices = hasVars ? stock.variations.map(v => Number(v.price || 0)).filter(pr => pr > 0) : [];
                      const minP = varPrices.length > 0 ? Math.min(...varPrices) : Number(stock.price || 0);
                      const maxP = varPrices.length > 0 ? Math.max(...varPrices) : Number(stock.price || 0);

                      const displayModal = hasVars && varPrices.length > 0
                        ? (minP === maxP ? formatRupiah(minP) : `${formatRupiah(minP)} - ${formatRupiah(maxP)}`)
                        : formatRupiah(stock.price);

                      const displayFinal = hasVars && varPrices.length > 0
                        ? (minP === maxP ? formatRupiah(minP + markup) : `${formatRupiah(minP + markup)} - ${formatRupiah(maxP + markup)}`)
                        : formatRupiah(Number(stock.price || 0) + markup);

                      const isExpanded = Boolean(expandedMainRows[row.id]);

                      return (
                        <React.Fragment key={row.id}>
                          <TableRow hover sx={{ '& > *': { borderBottom: isExpanded ? 'unset !important' : undefined } }}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {hasVars && (
                                  <IconButton size="small" onClick={() => toggleMainExpand(row.id)} sx={{ p: 0.25 }}>
                                    {isExpanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                                  </IconButton>
                                )}
                                <Box>
                                  <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                                    <Typography variant="body2" fontWeight={600}>
                                      {stock.title || `Produk #${row.stock_id}`}
                                    </Typography>
                                    {hasVars ? (
                                      <Chip
                                        size="small"
                                        label={`${stock.variations.length} Variasi`}
                                        color="primary"
                                        variant="outlined"
                                        onClick={() => toggleMainExpand(row.id)}
                                        sx={{ height: 18, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                      />
                                    ) : stock.is_variation ? (
                                      <Chip size="small" label="Variasi" sx={{ height: 18, fontSize: 10 }} />
                                    ) : null}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                    Kode: {stock.code || '-'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {stock.bot?.store_name || stock.bot?.name || stock.bot?.username || 'Star Seller'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {displayModal}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                color={markup > 0 ? 'success' : 'default'}
                                label={markup > 0 ? `+${formatRupiah(markup)}` : 'Rp 0'}
                                onClick={() => {
                                  setEditMarkupItem(row);
                                  setMarkupInput(String(markup));
                                }}
                                icon={<EditOutlined sx={{ fontSize: 14 }} />}
                                clickable
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {displayFinal}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Hapus dari API">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemove(row.id, stock.title)}
                                >
                                  <DeleteOutlineRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Variations Sub-Table in Main Table */}
                          {hasVars && (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ py: 0, px: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.02) }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ py: 1.5, pl: 4, pr: 2 }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                                      Detail Variasi &amp; Harga API (Markup: +{formatRupiah(markup)})
                                    </Typography>
                                    <Table size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                      <TableHead>
                                        <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Nama Variasi</TableCell>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Kode Variasi</TableCell>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }} align="right">Harga Modal</TableCell>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }} align="right">Harga API (+Markup)</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {stock.variations.map((v) => {
                                          const vModal = Number(v.price || 0);
                                          const vFinal = vModal + markup;
                                          return (
                                            <TableRow key={v.id}>
                                              <TableCell sx={{ fontSize: 12 }}>{v.title}</TableCell>
                                              <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{v.code}</TableCell>
                                              <TableCell sx={{ fontSize: 12, color: 'text.secondary' }} align="right">{formatRupiah(vModal)}</TableCell>
                                              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main' }} align="right">{formatRupiah(vFinal)}</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* MODAL: COLLECT PRODUK STAR SELLER */}
      <Dialog
        open={openModalCollect}
        onClose={() => setOpenModalCollect(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Pilih Produk Star Seller untuk Di-collect
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            placeholder="Cari produk Star Seller (nama, kode, atau toko)..."
            value={searchMarket}
            onChange={(e) => {
              const val = e.target.value;
              setSearchMarket(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setMarketPage(1);
                fetchMarketplace(searchMarket, 1);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => {
                      setMarketPage(1);
                      fetchMarketplace(searchMarket, 1);
                    }}
                    sx={{ textTransform: 'none', px: 1.5, fontWeight: 600 }}
                  >
                    Cari
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {loadingMarket ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : availableProducts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              Tidak ada produk Star Seller yang tersedia atau belum di-collect.
            </Typography>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Produk</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Star Seller</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Harga Modal</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableProducts.map((p) => {
                      const isCollected = collectedProducts.some((c) => c.stock_id === p.id);
                      const hasVars = Boolean(p.is_variation && Array.isArray(p.variations) && p.variations.length > 0);
                      const varPrices = hasVars ? p.variations.map(v => Number(v.price || 0)).filter(pr => pr > 0) : [];
                      const minP = varPrices.length > 0 ? Math.min(...varPrices) : (p.min_price || Number(p.price || 0));
                      const maxP = varPrices.length > 0 ? Math.max(...varPrices) : (p.max_price || Number(p.price || 0));
                      const displayPrice = hasVars && (varPrices.length > 0 || minP > 0)
                        ? (minP === maxP ? formatRupiah(minP) : `${formatRupiah(minP)} - ${formatRupiah(maxP)}`)
                        : p.is_variation
                          ? 'Belum ada variasi'
                          : formatRupiah(p.price);
                      const isExpanded = Boolean(expandedCollectRows[p.id]);

                      return (
                        <React.Fragment key={p.id}>
                          <TableRow hover sx={{ '& > *': { borderBottom: isExpanded ? 'unset !important' : undefined } }}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {hasVars && (
                                  <IconButton size="small" onClick={() => toggleCollectExpand(p.id)} sx={{ p: 0.25 }}>
                                    {isExpanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                                  </IconButton>
                                )}
                                <Box>
                                  <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                                    <Typography variant="body2" fontWeight={600}>{p.title}</Typography>
                                    {hasVars ? (
                                      <Chip
                                        size="small"
                                        label={`${p.variations.length} Variasi`}
                                        color="primary"
                                        variant="outlined"
                                        onClick={() => toggleCollectExpand(p.id)}
                                        sx={{ height: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                                      />
                                    ) : p.is_variation ? (
                                      <Chip size="small" label="Belum Ada Variasi" color="warning" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                                    ) : null}
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                    Kode: {p.code}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {p.bot?.store_name || p.bot?.name || p.bot?.username || 'Star Seller'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={hasVars && minP > 0 ? 'primary.main' : (!hasVars && p.is_variation ? 'text.secondary' : 'text.primary')}
                                sx={{ fontStyle: (!hasVars && p.is_variation) ? 'italic' : 'normal' }}
                              >
                                {displayPrice}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {isCollected ? (
                                <Chip
                                  size="small"
                                  icon={<CheckCircleOutlineRounded sx={{ fontSize: 14 }} />}
                                  label="Terkoleksi"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : p.is_variation && !hasVars ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled
                                  sx={{ textTransform: 'none', borderRadius: 2, fontSize: 11 }}
                                >
                                  Kosong
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={collectingId === p.id}
                                  onClick={() => handleCollect(p.id)}
                                  sx={{ textTransform: 'none', borderRadius: 2 }}
                                >
                                  {collectingId === p.id ? 'Memproses...' : 'Collect'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Expanded Variations Sub-Table in Modal */}
                          {hasVars && (
                            <TableRow>
                              <TableCell colSpan={4} sx={{ py: 0, px: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.02) }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ py: 1.5, pl: 4, pr: 2 }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                                      Daftar Variasi ({p.variations.length})
                                    </Typography>
                                    <Table size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                                      <TableHead>
                                        <TableRow sx={{ bgcolor: (t) => alpha(t.palette.action.hover, 0.5) }}>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Nama Variasi</TableCell>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>Kode Variasi</TableCell>
                                          <TableCell sx={{ fontSize: 11, fontWeight: 700 }} align="right">Harga Modal</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {p.variations.map((v) => (
                                          <TableRow key={v.id}>
                                            <TableCell sx={{ fontSize: 12 }}>{v.title}</TableCell>
                                            <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{v.code}</TableCell>
                                            <TableCell sx={{ fontSize: 12, fontWeight: 600 }} align="right">{formatRupiah(v.price)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination & Counter Section */}
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ pt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Menampilkan {availableProducts.length} dari {marketTotal} produk Star Seller
                </Typography>
                {marketTotalPages > 1 && (
                  <Pagination
                    count={marketTotalPages}
                    page={marketPage}
                    onChange={(e, val) => {
                      setMarketPage(val);
                      fetchMarketplace(searchMarket, val);
                    }}
                    color="primary"
                    size="small"
                    showFirstButton
                    showLastButton
                  />
                )}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModalCollect(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: EDIT MARKUP PROFIT */}
      <Dialog
        open={Boolean(editMarkupItem)}
        onClose={() => setEditMarkupItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Atur Margin Profit (Markup)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Produk: <b>{editMarkupItem?.stock?.title}</b>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Harga Modal: {formatRupiah(editMarkupItem?.stock?.price)}
          </Typography>

          <TextField
            label="Nilai Markup (Rp)"
            fullWidth
            size="small"
            value={markupInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setMarkupInput(val);
            }}
            helperText="Nilai tambahan yang akan menjadi profit Anda setiap ada transaksi API."
            InputProps={{
              startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
            }}
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 2, p: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Perkiraan Harga API:
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {formatRupiah(
                Number(editMarkupItem?.stock?.price || 0) + (parseInt(markupInput, 10) || 0)
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMarkupItem(null)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSaveMarkup}
            disabled={savingMarkup}
          >
            {savingMarkup ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
