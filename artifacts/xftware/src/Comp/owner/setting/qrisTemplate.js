import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress, Divider,
  FormControlLabel, IconButton, Stack, Switch, TextField, Typography, alpha, Tooltip, Alert
} from '@mui/material';
import {
  QrCode, CloudUpload, Save, Refresh, ColorLens, CheckCircle, Info, Lock, Settings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';

export default function QrisTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Image states
  const [imageUrl, setImageUrl] = useState(''); // Current preview URL (CDN or base64)
  const [uploadBase64, setUploadBase64] = useState(''); // Base64 if newly uploaded
  const [naturalWidth, setNaturalWidth] = useState(800);
  const [naturalHeight, setNaturalHeight] = useState(800);

  // QR box coordinates (in natural image pixels)
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [w, setW] = useState(200);
  const [h, setH] = useState(200);
  const [color, setColor] = useState('#000000');
  const [lockSquare, setLockSquare] = useState(true);

  // Rendered preview scale tracking
  const [renderedWidth, setRenderedWidth] = useState(0);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Fetch initial configuration from database
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'getQrisTemplate' });
      if (!res?.error) {
        const d = res.data || {};
        setEnabled(!!d.qris_template_enabled);
        setImageUrl(d.qris_template_image_url || '');
        setX(Number(d.qris_template_x) || 0);
        setY(Number(d.qris_template_y) || 0);
        setW(Number(d.qris_template_w) || 200);
        setH(Number(d.qris_template_h) || 200);
        setColor(d.qris_template_color || '#000000');
        setUploadBase64('');
      } else {
        toast.error(res?.message || 'Gagal mengambil data template QRIS');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update scale factor when preview container is resized
  const updateRenderedDimensions = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setRenderedWidth(rect.width);
      setRenderedHeight(rect.height);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateRenderedDimensions);
    return () => window.removeEventListener('resize', updateRenderedDimensions);
  }, []);

  // Handle uploader
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Berkas harus berupa gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setUploadBase64(base64);
      setImageUrl(base64);

      // Determine natural sizes
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);

        // Reset coordinate defaults nicely based on image dimensions
        const defaultW = Math.min(200, Math.round(img.naturalWidth / 4));
        setW(defaultW);
        setH(defaultW);
        setX(Math.round((img.naturalWidth - defaultW) / 2));
        setY(Math.round((img.naturalHeight - defaultW) / 2));
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      setNaturalWidth(imageRef.current.naturalWidth || 800);
      setNaturalHeight(imageRef.current.naturalHeight || 800);
      updateRenderedDimensions();
    }
  };

  // Convert natural sizes to screen sizes
  const scaleX = renderedWidth ? naturalWidth / renderedWidth : 1;
  const scaleY = renderedHeight ? naturalHeight / renderedHeight : 1;

  const renderedX = renderedWidth ? x / scaleX : 0;
  const renderedY = renderedHeight ? y / scaleY : 0;
  const renderedW = renderedWidth ? w / scaleX : 100;
  const renderedH = renderedHeight ? h / scaleY : 100;

  // Interactivity handlers for drag & resize
  const handleDragStart = (e) => {
    e.preventDefault();
    const startClientX = e.clientX || (e.touches && e.touches[0].clientX);
    const startClientY = e.clientY || (e.touches && e.touches[0].clientY);
    const startX = x;
    const startY = y;

    const handleDragMove = (moveEvent) => {
      const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const clientY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);

      const deltaX = (clientX - startClientX) * scaleX;
      const deltaY = (clientY - startClientY) * scaleY;

      let newX = Math.round(startX + deltaX);
      let newY = Math.round(startY + deltaY);

      // Bound checks
      newX = Math.max(0, Math.min(naturalWidth - w, newX));
      newY = Math.max(0, Math.min(naturalHeight - h, newY));

      setX(newX);
      setY(newY);
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startClientX = e.clientX || (e.touches && e.touches[0].clientX);
    const startClientY = e.clientY || (e.touches && e.touches[0].clientY);
    const startW = w;
    const startH = h;

    const handleResizeMove = (moveEvent) => {
      const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const clientY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);

      let deltaX = (clientX - startClientX) * scaleX;
      let deltaY = (clientY - startClientY) * scaleY;

      let newW = Math.round(startW + deltaX);
      let newH = Math.round(startH + deltaY);

      if (lockSquare) {
        // Force square by using the larger/average delta
        const maxDelta = Math.max(deltaX, deltaY);
        newW = Math.round(startW + maxDelta);
        newH = newW;
      }

      // Constraints check
      newW = Math.max(40, Math.min(naturalWidth - x, newW));
      newH = Math.max(40, Math.min(naturalHeight - y, newH));

      if (lockSquare) {
        newH = newW;
      }

      setW(newW);
      setH(newH);
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  };

  // Submit configuration
  const handleSave = async () => {
    if (!imageUrl) {
      toast.error('Unggah gambar template terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        enabled,
        x,
        y,
        w,
        h,
        color,
      };
      if (uploadBase64) {
        payload.image = uploadBase64;
      }
      const res = await reqOwner({ action: 'saveQrisTemplate', ...payload });
      if (!res?.error) {
        toast.success('Template QRIS berhasil disimpan');
        // Fetch fresh data to reset base64 upload buffer state
        const d = res.data || {};
        setEnabled(!!d.qris_template_enabled);
        setImageUrl(d.qris_template_image_url || '');
        setX(Number(d.qris_template_x) || 0);
        setY(Number(d.qris_template_y) || 0);
        setW(Number(d.qris_template_w) || 200);
        setH(Number(d.qris_template_h) || 200);
        setColor(d.qris_template_color || '#000000');
        setUploadBase64('');
      } else {
        toast.error(res?.message || 'Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal memproses penyimpanan');
    } finally {
      setSaving(false);
    }
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
            <QrCode sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Kustomisasi Template QRIS</Typography>
            <Typography variant="caption" color="text.secondary">
              Atur background template, posisi, warna, dan ukuran QR code yang akan dikirimkan ke pelanggan di WhatsApp dan Telegram
            </Typography>
          </Box>
        </Stack>

        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            borderRadius: 3,
            bgcolor: alpha('#6366f1', 0.05),
            color: 'primary.main',
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.1)
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Geser (drag) dan sesuaikan ukuran (resize) kotak QR code di bawah ini secara langsung sesuai dengan layout template gambar Anda.
          </Typography>
        </Alert>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1.7fr 1fr' }} gap={3} alignItems="flex-start">

          {/* Canvas Area */}
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: alpha('#000', 0.02), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>Pratinjau Layout</Typography>
              <Typography variant="caption" color="text.secondary">
                Ukuran Asli: {naturalWidth}x{naturalHeight} px
              </Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', bgcolor: '#F1F5F9' }}>
              {imageUrl ? (
                <Box
                  ref={containerRef}
                  sx={{
                    position: 'relative',
                    maxWidth: '100%',
                    boxShadow: 4,
                    borderRadius: 1,
                    overflow: 'hidden',
                    lineHeight: 0
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Template QRIS Background"
                    onLoad={handleImageLoad}
                    style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block' }}
                  />

                  {/* Interaktive QR Box Overlay */}
                  <div
                    onTouchStart={handleDragStart}
                    onMouseDown={handleDragStart}
                    style={{
                      position: 'absolute',
                      left: `${renderedX}px`,
                      top: `${renderedY}px`,
                      width: `${renderedW}px`,
                      height: `${renderedH}px`,
                      border: `3px dashed ${color}`,
                      backgroundColor: alpha(color, 0.15),
                      cursor: 'move',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      userSelect: 'none',
                      touchAction: 'none'
                    }}
                  >
                    <Box sx={{ textAlign: 'center', p: 1, pointerEvents: 'none' }}>
                      <QrCode sx={{ fontSize: Math.max(16, renderedW / 3.5), color: color, opacity: 0.8 }} />
                      <Typography
                        variant="caption"
                        sx={{
                          display: renderedW > 60 ? 'block' : 'none',
                          color: color,
                          fontWeight: 700,
                          fontSize: Math.max(7, Math.min(10, renderedW / 12)),
                          textShadow: '1px 1px 1px #fff'
                        }}
                      >
                        QRIS CODE
                      </Typography>
                    </Box>

                    {/* Resize Handle (Bottom-Right) */}
                    <div
                      onMouseDown={handleResizeStart}
                      onTouchStart={handleResizeStart}
                      style={{
                        position: 'absolute',
                        right: '-5px',
                        bottom: '-5px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#6366f1',
                        border: '2px solid #ffffff',
                        borderRadius: '50%',
                        cursor: 'se-resize',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        touchAction: 'none'
                      }}
                    />
                  </div>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: alpha('#fff', 0.6),
                    gap: 1.5,
                    p: 3,
                    textAlign: 'center'
                  }}
                >
                  <CloudUpload sx={{ fontSize: 44, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.secondary">
                    Belum ada background template yang diunggah. Unggah gambar background Anda terlebih dahulu.
                  </Typography>
                  <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Unggah Gambar
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </Button>
                </Box>
              )}
            </Box>
          </Card>

          {/* Form Settings Area */}
          <Stack spacing={3}>
            {/* Template Status / Activation */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>Status & Aksi</Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>Aktifkan Desain Template</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Kirim QRIS menggunakan gambar background kustom ini
                        </Typography>
                      </Box>
                    }
                  />

                  <Divider />

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1 }}
                    >
                      Simpan Desain
                    </Button>
                    <Tooltip title="Reset ke setelan tersimpan">
                      <IconButton
                        variant="outlined"
                        onClick={fetchData}
                        disabled={saving}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: alpha('#000', 0.02)
                        }}
                      >
                        <Refresh sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Position Controls */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Settings sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Ukuran & Letak QR Code</Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
                    Nilai di bawah ini otomatis terupdate saat Anda menggeser atau memperbesar kotak QR di kanvas.
                  </Typography>

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <TextField
                      label="Posisi X (Piksel)"
                      size="small"
                      type="number"
                      value={x}
                      onChange={(e) => setX(Math.max(0, Math.min(naturalWidth - w, Number(e.target.value) || 0)))}
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                    <TextField
                      label="Posisi Y (Piksel)"
                      size="small"
                      type="number"
                      value={y}
                      onChange={(e) => setY(Math.max(0, Math.min(naturalHeight - h, Number(e.target.value) || 0)))}
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                    <TextField
                      label="Lebar QR Code (W)"
                      size="small"
                      type="number"
                      value={w}
                      onChange={(e) => {
                        const newW = Math.max(40, Math.min(naturalWidth - x, Number(e.target.value) || 0));
                        setW(newW);
                        if (lockSquare) setH(newW);
                      }}
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                    <TextField
                      label="Tinggi QR Code (H)"
                      size="small"
                      type="number"
                      value={h}
                      disabled={lockSquare}
                      onChange={(e) => setH(Math.max(40, Math.min(naturalHeight - y, Number(e.target.value) || 0)))}
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={lockSquare}
                        onChange={(e) => {
                          setLockSquare(e.target.checked);
                          if (e.target.checked) setH(w);
                        }}
                        color="primary"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Kunci Aspek Rasio Kotak (Saran: Selalu aktifkan agar QR tetap presisi)
                      </Typography>
                    }
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Color & Image Uploader Controls */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                  <Typography variant="subtitle1" fontWeight={700}>Aset & Warna QRIS</Typography>

                  {/* Color picker */}
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={1}>
                      <ColorLens sx={{ fontSize: 16 }} /> Warna Barcode QRIS
                    </Typography>
                    <Box display="flex" gap={1.5} alignItems="center">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: 'none',
                          padding: '0',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          backgroundColor: 'transparent'
                        }}
                      />
                      <TextField
                        size="small"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#000000"
                        InputProps={{
                          sx: { borderRadius: 2, fontFamily: 'monospace' }
                        }}
                      />
                    </Box>
                  </Stack>

                  <Divider />

                  {/* Image Uploader */}
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={600}>Ganti Background Template</Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      sx={{ textTransform: 'none', borderRadius: 2, py: 1 }}
                    >
                      Unggah File Baru
                      <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Rekomendasi format: PNG, JPG (Maks. 2MB)
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </motion.div>
  );
}
