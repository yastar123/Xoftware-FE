import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Pagination, Button
} from '@mui/material';
import { useSocket } from '@/Context/SocketContext';
import { reqOwner } from '@/lib/requestApi';

export default function BillingDomain({ setOnResumeReady }) {
  const { socket } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async (targetPage = page) => {
    if (!socket) return;
    setLoading(true);

    try {
      const res = await reqOwner({ 
        action: 'domain.reseller.transaction.list', 
        page: targetPage, limit: 20, search, status: statusFilter, start_date: startDate, end_date: endDate 
      });
      setLoading(false);
      if (!res?.error) {
        const data = res.data;
        const list = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
        setTransactions(list);
        if (data?.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        setTransactions([]);
      }
    } catch (e) {
      setLoading(false);
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
    if (setOnResumeReady) {
      setOnResumeReady(() => {
        fetchTransactions();
      });
    }
  }, [socket]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
        <Typography variant="h5" fontWeight="bold">Histori Transaksi Domain</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField 
            size="small" 
            label="Cari Domain / Reff ID" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            sx={{ minWidth: 200 }} 
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
              <MenuItem value="all">Semua</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed_vendor">Failed Vendor</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
          <TextField 
            size="small" 
            type="date" 
            label="Start Date" 
            InputLabelProps={{ shrink: true }} 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
          <TextField 
            size="small" 
            type="date" 
            label="End Date" 
            InputLabelProps={{ shrink: true }} 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
          <Button variant="contained" onClick={() => { setPage(1); fetchTransactions(1); }} disabled={loading}>
            Cari
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tanggal</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Reff ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Domain</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Tipe</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Durasi</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>Belum ada histori transaksi.</TableCell>
              </TableRow>
            ) : (
              transactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{row.reff_id}</TableCell>
                  <TableCell fontWeight="500">{row.domain}</TableCell>
                  <TableCell>{row.action === 'register' ? 'Register' : 'Renew'}</TableCell>
                  <TableCell>{row.duration} Tahun</TableCell>
                  <TableCell>Rp{row.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      color={
                        row.status === 'success' ? 'success' : 
                        row.status === 'failed_vendor' ? 'error' : 
                        row.status === 'refunded' ? 'warning' : 'default'
                      } 
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack mt={3} direction="row" justifyContent="center">
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={(e, val) => { setPage(val); fetchTransactions(val); }} 
          color="primary" 
          disabled={loading}
        />
      </Stack>
    </Box>
  );
}
