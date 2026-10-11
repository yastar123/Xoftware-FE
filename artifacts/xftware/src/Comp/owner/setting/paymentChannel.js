import { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Skeleton, CircularProgress, alpha, Stack, Grid, Alert, Chip } from '@mui/material';
import { Payment, CheckCircleOutline, Save, Info } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

export default function SettingPaymentChannel() {
  const [channelList, setChannelList] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [initialChannelId, setInitialChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const [channelRes, myChannelRes] = await Promise.all([reqOwner({ action: 'channels' }), reqOwner({ action: 'mychannel' })]);
      setChannelList(channelRes?.data || []);
      const activeId = myChannelRes?.data?.payment_config?.id || '';
      setSelectedChannelId(activeId);
      setInitialChannelId(activeId);
    } catch {
      toast.error('Gagal memuat data channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChannel = async () => {
    setIsSaving(true);
    try {
      const res = await reqOwner({ action: 'setchannel', _id: selectedChannelId });
      if (res.error) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
        setInitialChannelId(selectedChannelId); // Update initial state after saving
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => { fetchChannels(); }, []);

  const hasChanges = selectedChannelId !== initialChannelId;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex' }}>
            <Payment sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Payment Channel</Typography>
            <Typography variant="body2" color="text.secondary">Pilih dan kelola metode pembayaran utama untuk sistem Anda.</Typography>
          </Box>
        </Stack>
        
        <Button 
          variant="contained" 
          onClick={handleSaveChannel} 
          disabled={isLoading || isSaving || !hasChanges} 
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />} 
          sx={{ 
            borderRadius: 2, px: 4, py: 1.2, textTransform: 'none', fontWeight: 700,
            boxShadow: hasChanges ? '0 4px 14px 0 rgba(99,102,241,0.39)' : 'none'
          }}
        >
          Simpan Pilihan
        </Button>
      </Stack>

      <Alert severity="info" icon={<Info />} sx={{ mb: 4, borderRadius: 2 }}>
        Pilih salah satu kotak di bawah ini untuk mengatur Payment Channel yang aktif, lalu klik <b>Simpan Pilihan</b>.
      </Alert>

      {isLoading ? (
        <Grid container spacing={3}>
           {[...Array(6)].map((_, i) => (
             <Grid item xs={12} sm={6} md={4} key={i}>
               <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
             </Grid>
           ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {channelList.map((channel) => {
            const isSelected = selectedChannelId === channel.id;
            const isMainten = channel.is_mainten;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={channel.id}>
                <Card
                  variant={isSelected ? 'outlined' : 'elevation'}
                  onClick={() => !isMainten && setSelectedChannelId(channel.id)}
                  sx={{
                    height: '100%',
                    borderColor: isSelected ? '#6366f1' : 'divider',
                    borderWidth: 2,
                    borderStyle: 'solid',
                    cursor: isMainten ? 'not-allowed' : 'pointer',
                    borderRadius: 4,
                    boxShadow: isSelected ? '0 8px 24px -4px rgba(99,102,241,0.2)' : '0 4px 20px -10px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'visible',
                    opacity: isMainten ? 0.6 : 1,
                    '&:hover': { 
                      borderColor: isMainten ? 'divider' : (isSelected ? '#6366f1' : alpha('#6366f1', 0.4)), 
                      transform: isMainten ? 'none' : 'translateY(-3px)',
                      boxShadow: isMainten ? 'none' : '0 8px 24px -4px rgba(99,102,241,0.15)'
                    },
                  }}
                >
                  {isSelected && (
                     <Box sx={{ position: 'absolute', top: -12, right: -12, bgcolor: '#fff', borderRadius: '50%', p: 0.2, zIndex: 2 }}>
                       <CheckCircleOutline sx={{ fontSize: 28, color: '#6366f1' }} />
                     </Box>
                  )}
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: isSelected ? '#6366f1' : 'text.primary' }}>
                        {channel.code_alias}
                      </Typography>
                      {isMainten && (
                        <Chip label="Maintenance" size="small" color="error" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5, height: 22, '& .MuiChip-label': { px: 1 } }} />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, lineHeight: 1.6 }}>
                      {channel.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}