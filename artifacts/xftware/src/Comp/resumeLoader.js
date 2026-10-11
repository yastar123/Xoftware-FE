// components/ResumeLoader.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  "Menyiapkan pengalaman terbaik untuk Anda...",
  "Membangun koneksi aman ke server...",
  "Menyusun data dashboard Anda...",
  "Sesaat lagi, pintu Xoftware terbuka...",
  "Menghubungkan ke jaringan WebSocket...",
  "Hampir selesai, mohon tunggu sebentar..."
];

export default function ResumeLoader() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        color: 'white',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow */}
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(40px)',
          zIndex: 0
        }}
      />

      {/* Logo & Spinner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ position: 'relative', width: 100, height: 100, mb: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt="Logo"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))'
            }}
          />
          <CircularProgress
            size={120}
            thickness={1.5}
            sx={{
              position: 'absolute',
              top: -10,
              left: -10,
              color: '#6366f1',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
        </Box>
      </motion.div>

      {/* Animated Text Container */}
      <Box sx={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIdx}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="body1"
              sx={{
                color: alpha('#fff', 0.8),
                fontWeight: 500,
                textAlign: 'center',
                letterSpacing: 0.5,
                px: 3
              }}
            >
              {MESSAGES[msgIdx]}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Loading Dots */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, zIndex: 1 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              delay: i * 0.2 
            }}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#6366f1'
            }}
          />
        ))}
      </Box>

      {/* Branding Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          opacity: 0.2,
          zIndex: 1
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#fff', 
            fontSize: 10, 
            letterSpacing: 3, 
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          Xoftware Integrated Ecosystem
        </Typography>
      </Box>
    </Box>
  );
}

