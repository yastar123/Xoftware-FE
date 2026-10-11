import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Stack, MenuItem, Typography, InputAdornment } from '@mui/material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { generateRandomCode, idr } from '@/lib/helper';

export default function EditVoucherForm({ id = null, onDone }) {
  const isEdit = !!id;
  const [data, setData] = useState({
    title: '',
    code: '',
    type: 'percent',
    discount: '',
    max_discount: '',
    min_purchase: '',
    max_claim: '',
    expired: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    reqOwner({ action: 'getVoucherById', id }).then(res => {
      if (!res.error) {
        const d = res.data;
        setData({
          ...data,
          ...d,
          expired: d.expired?.slice(0, 10) || '',
        });
      } else toast.error(res.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setLoading(true);
    const res = await reqOwner({
      action: isEdit ? 'updateVoucher' : 'addVoucher',
      id,
      ...data,
    });
    if (!res.error) {
      toast.success('Voucher berhasil disimpan');
      onDone?.();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Yakin hapus voucher ini?')) return;
    const res = await reqOwner({ action: 'delVoucher', id });
    if (!res.error) {
      toast.success('Voucher berhasil dihapus');
      onDone?.();
    } else toast.error(res.message);
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        {isEdit ? 'Edit Voucher' : 'Tambah Voucher'}
      </Typography>

      <Stack spacing={2}>
        <TextField label="Judul" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} fullWidth required />
        <TextField
          label="Kode"
          value={data.code}
          onChange={e => setData({ ...data, code: e.target.value })}
          fullWidth
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setData(prev => ({
                      ...prev,
                      code: generateRandomCode(),
                    }))
                  }
                  sx={{ px: 1.5, py: 0.5, fontSize: 12 }}
                >
                  Acak
                </Button>
              </InputAdornment>
            ),
          }}
        />
        <TextField select label="Tipe" value={data.type} onChange={e => setData({ ...data, type: e.target.value })}>
          <MenuItem value="percent">Persen</MenuItem>
          <MenuItem value="amount">Potongan</MenuItem>
        </TextField>

        <TextField label={data.type === 'percent' ? 'Diskon (%)' : 'Diskon (Nominal)'} type="number" value={data.discount} onChange={e => setData({ ...data, discount: +e.target.value })} fullWidth />

        {data.type === 'percent' && <TextField label="Max Nominal Diskon" type="number" value={data.max_discount} onChange={e => setData({ ...data, max_discount: +e.target.value })} fullWidth />}

        <TextField label="Min. Pembelian" type="number" value={data.min_purchase} onChange={e => setData({ ...data, min_purchase: +e.target.value })} fullWidth />
        <TextField label="Max User Klaim" type="number" value={data.max_claim} onChange={e => setData({ ...data, max_claim: +e.target.value })} fullWidth />
        <TextField label="Expired" type="date" value={data.expired} onChange={e => setData({ ...data, expired: e.target.value })} InputLabelProps={{ shrink: true }} />

        <Stack direction="row" spacing={2}>
          <Button variant="contained" fullWidth onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Voucher'}
          </Button>
          <Button variant="outlined" fullWidth onClick={onDone}>
            Batal
          </Button>
        </Stack>

        {isEdit && (
          <Button variant="text" color="error" onClick={handleDelete}>
            Hapus Voucher
          </Button>
        )}
      </Stack>
    </Box>
  );
}
