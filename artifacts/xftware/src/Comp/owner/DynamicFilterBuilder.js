import React, { useState } from 'react';
import { Box, Stack, Button, IconButton, FormControl, Select, MenuItem, TextField, Popover, Card, CardContent, Typography, alpha } from '@mui/material';
import { Add, Delete, FilterList } from '@mui/icons-material';
import { DateRangePicker } from 'react-date-range';
import dayjs from 'dayjs';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css';

const FILTER_OPS = {
  text: [
    { value: 'equals', label: 'Sama dengan' },
    { value: 'contains', label: 'Mengandung kata' },
  ],
  number: [
    { value: 'equals', label: 'Sama dengan' },
    { value: 'gt', label: 'Lebih besar' },
    { value: 'lt', label: 'Lebih kecil' },
  ],
  select: [
    { value: 'equals', label: 'Sama dengan' }
  ],
  dateRange: [
    { value: 'between', label: 'Diantara' }
  ]
};

export default function DynamicFilterBuilder({ filters, setFilters, onSearch, loading, filterFields }) {
  const handleAdd = () => {
    const firstField = filterFields[0];
    const initialValue = firstField.type === 'dateRange' 
      ? [dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'), dayjs().endOf('day').format('YYYY-MM-DDTHH:mm')] 
      : (firstField.type === 'select' ? firstField.options[0] : '');
    
    setFilters([...filters, { 
      id: Date.now(), 
      field: firstField.value, 
      op: FILTER_OPS[firstField.type][0].value, 
      value: initialValue 
    }]);
  };

  const handleRemove = (id) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const handleChange = (id, key, val) => {
    setFilters(filters.map(f => {
      if (f.id === id) {
        const newF = { ...f, [key]: val };
        if (key === 'field') {
          const fieldConf = filterFields.find(x => x.value === val);
          newF.op = FILTER_OPS[fieldConf.type][0].value;
          newF.value = fieldConf.type === 'dateRange' 
            ? [dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'), dayjs().endOf('day').format('YYYY-MM-DDTHH:mm')] 
            : (fieldConf.type === 'select' ? fieldConf.options[0] : '');
        }
        return newF;
      }
      return f;
    }));
  };

  return (
    <Card sx={{ width: '100%', mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ width: '100%' }}>
          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <Stack spacing={1.5}>
              {filters.map((f) => (
                <FilterRow
                  key={f.id}
                  filter={f}
                  filterFields={filterFields}
                  onChange={(k, v) => handleChange(f.id, k, v)}
                  onRemove={() => handleRemove(f.id)}
                  canRemove={filters.length > 1}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={2} mt={2}>
              <Button variant="outlined" size="small" onClick={handleAdd} startIcon={<Add />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Tambah Kondisi
              </Button>
            </Stack>
          </Box>
          <Box sx={{ pl: { xs: 0, sm: 2 }, borderLeft: { xs: 'none', sm: '1px solid' }, pt: { xs: 2, sm: 0 }, borderTop: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', minWidth: { xs: '100%', sm: 200 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onSearch} 
              disabled={loading} 
              fullWidth 
              startIcon={<FilterList />}
              sx={{ borderRadius: 2, textTransform: 'none', py: 1, fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
            >
              Terapkan Filter
            </Button>
            <Typography variant="caption" color="text.secondary" textAlign="center" mt={1}>
              {filters.length} kondisi aktif
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FilterRow({ filter, filterFields, onChange, onRemove, canRemove }) {
  const fieldConf = filterFields.find(x => x.value === filter.field) || filterFields[0];
  const ops = FILTER_OPS[fieldConf.type] || FILTER_OPS.text;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleDateSelect = (ranges) => {
    const s = dayjs(ranges.selection.startDate).format('YYYY-MM-DDTHH:mm');
    const e = dayjs(ranges.selection.endDate).format('YYYY-MM-DDTHH:mm');
    onChange('value', [s, e]);
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select value={filter.field} onChange={e => onChange('field', e.target.value)} sx={{ borderRadius: 2 }}>
          {filterFields.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select value={filter.op} onChange={e => onChange('op', e.target.value)} sx={{ borderRadius: 2 }}>
          {ops.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </Select>
      </FormControl>

      {fieldConf.type === 'select' && (
        <FormControl size="small" sx={{ minWidth: 180, flexGrow: 1 }}>
          <Select value={filter.value} onChange={e => onChange('value', e.target.value)} sx={{ borderRadius: 2 }}>
            {fieldConf.options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
        </FormControl>
      )}

      {(fieldConf.type === 'text' || fieldConf.type === 'number') && (
        <TextField
          size="small"
          placeholder="Masukkan Kata Kunci"
          value={filter.value}
          onChange={e => onChange('value', e.target.value)}
          sx={{ minWidth: 180, flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}

      {fieldConf.type === 'dateRange' && (
        <>
          <TextField
            size="small"
            placeholder="Pilih Tanggal"
            value={Array.isArray(filter.value) ? `${dayjs(filter.value[0]).format('DD/MM/YYYY')} - ${dayjs(filter.value[1]).format('DD/MM/YYYY')}` : ''}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 220, flexGrow: 1, cursor: 'pointer', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Box p={2}>
              <DateRangePicker
                ranges={[{
                  startDate: filter.value?.[0] ? dayjs(filter.value[0]).toDate() : new Date(),
                  endDate: filter.value?.[1] ? dayjs(filter.value[1]).toDate() : new Date(),
                  key: 'selection'
                }]}
                onChange={handleDateSelect}
                months={2}
                direction="horizontal"
              />
              <Stack direction="row" justifyContent="flex-end" mt={1}>
                <Button onClick={() => setAnchorEl(null)} variant="contained" size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Tutup</Button>
              </Stack>
            </Box>
          </Popover>
        </>
      )}

      {canRemove && (
        <IconButton size="small" color="error" onClick={onRemove} sx={{ bgcolor: alpha('#ef4444', 0.1), '&:hover': { bgcolor: alpha('#ef4444', 0.2) } }}>
          <Delete fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}
