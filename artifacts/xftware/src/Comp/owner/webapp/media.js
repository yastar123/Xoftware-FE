import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Stack, Button, Grid, Card, CardMedia,
  IconButton, Divider, alpha, Tooltip,
} from '@mui/material';
import { Upload, Refresh, Delete, Image as ImageIcon, PhotoLibrary } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

const MotionCard = motion(Card);

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

function ImageSection({ title, subtitle, icon, loadDataFn, uploadFn, removeFn, resetFn, onUpdate }) {
  const [urls, setUrls] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const loadData = async () => {
    const res = await loadDataFn();
    setUrls(res.data || []);
    setPreviews([]);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleUpload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);

    const nextPreviews = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPreviews(prev => [...prev, ...nextPreviews]);

    for (const { file } of nextPreviews) {
      try {
        const base64 = await fileToBase64(file);
        const uploadRes = await reqOwner({ action: 'uploadImage', thumbnailBuffer: base64 });
        if (!uploadRes.error) {
          const res = await uploadFn(uploadRes.data);
          if (res?.error) {
            toast.error(res?.message || 'Gagal menyimpan gambar ke database');
          } else {
            toast.success(res?.message || 'Berhasil mengunggah gambar');
            if (onUpdate) onUpdate();
          }
        } else {
          toast.error(uploadRes?.message || 'Gagal upload');
        }
      } catch (err) {
        toast.error(`Gagal mengunggah gambar: ${err?.message || ''}`);
      }
    }
    await loadData();
    e.target.value = null;
  };

  const handleRemove = async url => {
    await removeFn(url);
    if (onUpdate) onUpdate();
    loadData();
  };

  const handleReset = async () => {
    await resetFn();
    if (onUpdate) onUpdate();
    loadData();
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ p: 0.6, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.08), color: '#6366f1', display: 'grid', placeItems: 'center' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button
          variant="contained" size="small" startIcon={<Upload />}
          onClick={() => fileRef.current?.click()}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Upload
        </Button>
        <Button
          variant="outlined" size="small" startIcon={<Refresh />}
          onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Reset
        </Button>
        <input type="file" hidden ref={fileRef} accept="image/*" multiple onChange={handleUpload} />
      </Stack>

      {previews.length > 0 && (
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {previews.map(({ previewUrl }, idx) => (
            <Grid item xs={6} sm={4} md={3} key={`pv-${idx}`}>
              <MotionCard
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}
              >
                <CardMedia component="img" height="150" image={previewUrl} sx={{ objectFit: 'cover', opacity: loading ? 0.5 : 1 }} />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading && <Typography color="white" fontSize={12} fontWeight={600}>Uploading...</Typography>}
                </Box>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      )}

      {urls.length === 0 && !loading && (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 4, textAlign: 'center', mb: 2 }}>
          <ImageIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 0.5 }} />
          <Typography color="text.disabled" variant="body2">Belum ada gambar</Typography>
        </Card>
      )}

      <Grid container spacing={1.5}>
        <AnimatePresence>
          {urls.map((url, idx) => (
            <Grid item xs={6} sm={4} md={3} key={idx}>
              <MotionCard
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                whileHover={{y: -4}}
                sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              >
                <CardMedia
                  component="img"
                  height="auto"
                  image={url}
                  sx={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                  onError={e => { e.target.onerror = null; e.target.src = '/image-fallback-error.png'; }}
                />
                <Tooltip title="Hapus">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(url)}
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      bgcolor: 'rgba(255,255,255,0.85)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Delete sx={{ fontSize: 16, color: 'error.main' }} />
                  </IconButton>
                </Tooltip>
              </MotionCard>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
    </Box>
  );
}

export default function MediaSection({ onUpdate }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <PhotoLibrary sx={{ fontSize: 24, color: '#6366f1' }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Media Website</Typography>
          <Typography variant="caption" color="text.secondary">Kelola banner dan foto profil default</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ImageSection
            title="Banner Website"
            subtitle="Gambar banner yang ditampilkan di halaman utama"
            icon={<ImageIcon sx={{ fontSize: 18 }} />}
            loadDataFn={() => reqOwner({ action: 'getBannerWebsite' })}
            uploadFn={url => reqOwner({ action: 'updateBannerWebsite', banner: url })}
            removeFn={url => reqOwner({ action: 'removeBannerWebsite', url })}
            resetFn={() => reqOwner({ action: 'resetBannerWebsite' })}
            onUpdate={onUpdate}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ImageSection
            title="Foto Profil Default"
            subtitle="Gambar default untuk profil pengguna"
            icon={<PhotoLibrary sx={{ fontSize: 18 }} />}
            loadDataFn={() => reqOwner({ action: 'getProfileDefault' })}
            uploadFn={url => reqOwner({ action: 'addSingleProfileDefault', url })}
            removeFn={url => reqOwner({ action: 'removeProfileDefault', url })}
            resetFn={() => reqOwner({ action: 'resetProfileDefault' })}
            onUpdate={onUpdate}
          />
        </Grid>
      </Grid>
    </Box>
  );
}