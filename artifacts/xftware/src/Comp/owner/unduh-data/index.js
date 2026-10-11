import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Grid,
  Chip,
  IconButton,
  Pagination,
  CircularProgress,
  Tooltip as MuiTooltip,
  Card,
  CardContent,
  Stack,
  alpha,
  Tabs,
  Tab,
  TableContainer
} from "@mui/material";
import {
  MdRefresh,
  MdDownload,
  MdHistory,
  MdCloudDownload,
  MdOutlineFilePresent,
  MdPayments,
  MdMoneyOff,
  MdPhoneAndroid,
  MdShare,
  MdAccountBalance,
  MdReceiptLong,
  MdInventory2
} from "react-icons/md";
import { reqOwner } from "@/lib/requestApi";
import { idr, dateParse } from "@/lib/helper";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const typeConfig = {
  PAYMENT: { label: "Transaksi", icon: <MdPayments />, color: "#6366F1" },
  WITHDRAW: { label: "Withdraw", icon: <MdMoneyOff />, color: "#EC4899" },
  PPOB: { label: "PPOB", icon: <MdPhoneAndroid />, color: "#F59E0B" },
  SMM: { label: "SMM", icon: <MdShare />, color: "#10B981" },
  MUTASI_QRIS: { label: "Mutasi QRIS", icon: <MdAccountBalance />, color: "#06B6D4" },
  MUTATION: { label: "Mutasi User", icon: <MdReceiptLong />, color: "#8B5CF6" },
  RECAP_PRODUCT: { label: "Produk", icon: <MdInventory2 />, color: "#F43F5E" }
};

const RecapDataOwner = () => {
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]);
  const [activeTab, setActiveTab] = useState("PAYMENT");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchRecaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: "getRecapData" }); // Ambil semua metadata rekap
      if (!res.error) {
        setAllData(res.data.rows || []);
      }
    } catch (err) {
      toast.error("Gagal mengambil riwayat rekap");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecaps();
  }, [fetchRecaps]);

  const filteredData = useMemo(() => {
    const filtered = allData.filter(item => item.type === activeTab);
    return {
      rows: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length
    };
  }, [allData, activeTab, page, limit]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const renderSkeleton = () => [...Array(5)].map((_, i) => (
    <TableRow key={`sk-${i}`}>
      {Array(5).fill(0).map((_, idx) => (
        <TableCell key={idx} align="center"><CircularProgress size={14} /></TableCell>
      ))}
    </TableRow>
  ));

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box
          sx={{
            mb: 4, p: 3, borderRadius: 3,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            color: 'white', boxShadow: 3,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>Pusat Unduh Data 📂</Typography>
            <Typography fontSize={14} mt={1}>Laporan transaksi Anda yang telah diarsipkan dan di bukukan.</Typography>
          </Box>
          <MdCloudDownload size={48} style={{ opacity: 0.3 }} />
        </Box>
      </motion.div>

      {/* Unique Grid Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, bgcolor: alpha('#6366F1', 0.03), p: 1 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': { gap: 1 }
          }}
        >
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <Tab
              key={key}
              value={key}
              icon={cfg.icon}
              iconPosition="start"
              label={cfg.label}
              sx={{
                minHeight: 48,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.2s',
                color: '#64748B',
                '&.Mui-selected': {
                  bgcolor: cfg.color,
                  color: 'white',
                  boxShadow: `0 4px 12px ${alpha(cfg.color, 0.4)}`
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: alpha(cfg.color, 0.1),
                  color: cfg.color
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700} color="#1E293B">
            Riwayat {typeConfig[activeTab].label}
          </Typography>
          <IconButton onClick={fetchRecaps} color="primary" disabled={loading}>
            <MdRefresh />
          </IconButton>
        </Stack>

        <TableContainer component={Card} sx={{ borderRadius: 3, overflow: 'auto', border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: alpha('#6366f1', 0.04),
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  py: 2,
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }
              }}>
                <TableCell align="center">Nama Laporan</TableCell>
                <TableCell align="center">Periode</TableCell>
                <TableCell align="center">Volume Data</TableCell>
                <TableCell align="center">Total Nominal</TableCell>
                <TableCell align="center">Waktu Pembuatan</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? renderSkeleton() : filteredData.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <MdOutlineFilePresent size={48} color="#CBD5E1" />
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Belum ada arsip untuk kategori <b>{typeConfig[activeTab].label}</b>.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: alpha('#6366f1', 0.02) }, '& td': { py: 1.5, borderBottomColor: alpha('#000', 0.04) } }}>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.period === "annual" ? `TAHUN ${row.year}` : `BLN ${row.month} / ${row.year}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 10,
                          borderRadius: 1,
                          bgcolor: row.period === 'annual' ? alpha('#EC4899', 0.1) : alpha('#6366F1', 0.1),
                          color: row.period === 'annual' ? '#DB2777' : '#4338CA'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500}>{row.total_rows.toLocaleString()} baris</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700} color="primary">{idr(row.total_amount)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">{dateParse(row.createdAt)} WIB</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<MdDownload />}
                        onClick={() => window.open(row.url, "_blank")}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          bgcolor: typeConfig[activeTab].color,
                          '&:hover': { bgcolor: alpha(typeConfig[activeTab].color, 0.8) }
                        }}
                      >
                        Download CSV
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredData.total > limit && (
          <Stack direction="row" justifyContent="center" mt={2}>
            <Pagination
              count={Math.ceil(filteredData.total / limit)}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Stack>
        )}
      </Stack>

      <Box mt={5}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: alpha('#4F46E5', 0.02), borderStyle: 'dashed' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MdHistory size={32} color="#4F46E5" style={{ opacity: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Integritas Data</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Data yang diarsipkan adalah data final yang sudah melewati masa sanggah (3 bulan).
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: alpha('#10B981', 0.02), borderStyle: 'dashed' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MdCloudDownload size={32} color="#10B981" style={{ opacity: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Format CSV</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gunakan Microsoft Excel atau Google Sheets untuk membuka file CSV ini untuk pembukuan.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RecapDataOwner;
