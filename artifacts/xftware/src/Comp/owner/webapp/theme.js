import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Grid, Stack, Button, Popover, Paper, Divider,
} from '@mui/material';
import { SketchPicker } from 'react-color';
import { reqOwner } from '@/lib/requestApi';
import { Palette } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Config from '@/config';
import { toast } from 'react-toastify';

export default function SettingTheme({ onThemeSaved }) {
  const [colors, setColors] = useState({});
  const [authUrl, setAuthUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const [themeRes, authRes] = await Promise.all([
          reqOwner({ action: 'getThemeWebsite' }),
          reqOwner({ action: 'dash.auth' })
        ]);
        
        const data = themeRes?.data || {};
        const merged = { ...Config.themeColor };
        for (const k of Object.keys(Config.themeColor)) {
          if (data[k] && typeof data[k] === 'string') {
            merged[k] = data[k];
          }
        }
        setColors(merged);

        if (authRes?.data?.url) {
          setAuthUrl(authRes.data.url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleClick = (event, key) => {
    setAnchorEl(event.currentTarget);
    setActiveKey(key);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveKey(null);
  };

  const handleChange = val => {
    if (activeKey && val?.hex) {
      setColors(prev => ({ ...prev, [activeKey]: val.hex }));
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      if (Object.keys(colors).length > 0) {
        isInitialMount.current = false;
      }
      return;
    }

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await reqOwner({ action: 'setThemeWebsite', ...colors });
        // Call onThemeSaved so parent can refresh iframe
        if (onThemeSaved) onThemeSaved();
      } catch (err) {
        console.error('Gagal auto-save tema:', err);
      } finally {
        setSaving(false);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  // Handle Submit logic removed since it is now auto-saved.

  const colorItems = Object.entries(colors);

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Pengaturan Warna Tema
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sesuaikan palet warna dengan identitas *brand* toko Anda.
        </Typography>
      </motion.div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <Typography color="text.disabled">Memuat data...</Typography>
        </Box>
      ) : (
        <Box>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <Grid container spacing={2}>
                {colorItems.map(([key, value]) => (
                  <Grid item xs={6} sm={4} md={3} key={key}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Box
                        onClick={e => handleClick(e, key)}
                        sx={{
                          bgcolor: value,
                          height: 60,
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          border: '2px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            border: '2px solid rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            px: 1,
                            fontWeight: 700,
                            textShadow: '0px 1px 4px rgba(0,0,0,0.4)',
                            fontSize: 12,
                          }}
                        >
                          {key}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            opacity: 0.8,
                            fontWeight: 500,
                            textShadow: '0px 1px 4px rgba(0,0,0,0.4)',
                            fontSize: 10,
                          }}
                        >
                          {value.toUpperCase()}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

            </motion.div>
        </Box>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Palette sx={{ fontSize: 18, color: '#6366f1' }} />
            <Typography variant="subtitle2" fontWeight={700}>
              {activeKey}
            </Typography>
          </Stack>
          <SketchPicker
            color={colors[activeKey] || '#000000'}
            onChange={handleChange}
            disableAlpha
          />
        </Box>
      </Popover>
    </Box>
  );
}