import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Stack, TextField, CircularProgress, Button, Paper, Divider } from '@mui/material';
import { CloudUpload, Save } from '@mui/icons-material';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    let result = reader.result;
    if (result.includes(',')) result = result.split(',')[1];
    resolve(result);
  };
  reader.onerror = reject;
});

export default function SettingManifest({ onUpdate }) {
  const [data, setData] = useState({ manifest_name: '', manifest_short_name: '', manifest_icon: {} });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await reqOwner({ action: 'getManifestWebsite' });
      if (res?.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await reqOwner({ action: 'setManifestWebsite', ...data });
      if (res?.error) {
        toast.error(res?.message || 'Gagal menyimpan pengaturan');
      } else {
        toast.success(res?.message || 'Pengaturan berhasil disimpan');
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // reset input so the same file can be selected again if needed
    e.target.value = null;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await reqOwner({ action: 'uploadManifestIcon', thumbnailBuffer: base64 });
      if (res?.error) {
        toast.error(res?.message || 'Gagal mengunggah logo');
      } else {
        toast.success(res?.message || 'Logo berhasil diunggah');
        setData(prev => ({ ...prev, manifest_icon: res.data }));
        // Automatically save the updated manifest
        await reqOwner({ action: 'setManifestWebsite', ...data, manifest_icon: res.data });
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: t => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper', overflow: 'hidden' }}>
          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight={700}>Identitas Website</Typography>
            <Typography variant="body2" color="text.secondary">
              Atur nama toko, logo, dan ikon aplikasi website Anda.
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField
                label="Nama Toko"
                name="manifest_name"
                value={data.manifest_name}
                onChange={handleChange}
                placeholder="Contoh: Toko Saya"
                fullWidth
                size="small"
                helperText="Nama utama toko yang tampil pada judul website."
              />

              <TextField
                label="Nama Singkat"
                name="manifest_short_name"
                value={data.manifest_short_name}
                onChange={handleChange}
                placeholder="Contoh: TokoSaya"
                fullWidth
                size="small"
                helperText="Nama pendek untuk menu samping dan layar ponsel."
              />

              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Logo & Ikon</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Gunakan gambar persegi (1:1), format PNG atau JPG.
                </Typography>
                <Stack direction="row" alignItems="flex-start" spacing={3}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 3,
                      border: '2px dashed #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: '#f9f9f9',
                      position: 'relative'
                    }}
                  >
                    {data.manifest_icon?.any_192 ? (
                      <img
                        src={data.manifest_icon.any_192}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Belum ada logo</Typography>
                    )}
                    {uploading && (
                      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </Box>
                  <Box>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={handleUploadClick}
                      disabled={uploading}
                    >
                      {uploading ? 'Mengunggah...' : 'Pilih Logo'}
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                      Maksimal 2MB
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box display="flex" justifyContent="flex-end" pt={2}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving || uploading}
                  sx={{ textTransform: 'none', px: 3 }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Box>
            </Stack>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
}
