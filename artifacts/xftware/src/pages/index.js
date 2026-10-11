// pages/index.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Button, Box, Typography, Container, Stack, AppBar, Toolbar, List, ListItem, ListItemText, Divider, Grid, Paper, Chip, Link as MuiLink, Tooltip, IconButton, TextField, InputAdornment, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { FaWhatsapp, FaShieldAlt, FaUsersCog, FaCloudUploadAlt, FaChartBar, FaGlobeAsia, FaRocket, FaRegistered } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { useRouter } from 'next/router';
import { CheckCircleRounded, PeopleAlt, ShoppingCart } from '@mui/icons-material';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import FooterPage from '@/Comp/footer';
import Config from '@/config';

const floatShape = keyframes`
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-15px) scale(1.05); }
  100% { transform: translateY(0px) scale(1); }
`;

const Blob = ({ color, size, top, left, delay = 0, duration = 20 }) => (
  <Box
    component={motion.div}
    animate={{
      x: [0, 30, -30, 0],
      y: [0, -50, 50, 0],
      scale: [1, 1.2, 0.8, 1],
      rotate: [0, 90, 180, 360],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    sx={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(60px)',
      opacity: 0.6,
      zIndex: 0,
      pointerEvents: 'none',
    }}
  />
);
const ACCENT = '#6366F1';

// Util kecil buat copy to clipboard
const copy = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch { }
};

const ServiceCard = React.memo(function ServiceCard({ icon, title, items, accent = '#6366F1', ctaLabel, onCtaClick }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        height: '100%',
        position: 'relative',
        borderRadius: 5,
        p: '1px', // Border gradient
        background: `linear-gradient(135deg, ${accent}33, transparent 50%, ${accent}11)`,
        '&:hover .glow': { opacity: 0.6 },
      }}
    >
      {/* Hover Glow Effect */}
      <Box
        className="glow"
        sx={{
          position: 'absolute',
          inset: -20,
          background: `radial-gradient(circle at center, ${accent}22, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.4s ease',
          filter: 'blur(20px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: 5,
          p: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.5)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Decor Circle */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `${accent}08`,
            zIndex: -1,
          }}
        />

        <Box sx={{ mb: 3 }}>
          <Box
            component={motion.div}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#fff',
              boxShadow: `0 8px 20px ${accent}44`,
              mb: 2.5,
            }}
          >
            {React.cloneElement(icon, { size: 30 })}
          </Box>

          <Typography variant="h5" fontWeight={800} sx={{ mb: 1, color: '#1e293b', letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: accent,
              opacity: 0.3,
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <List disablePadding>
            {items.map((content, idx) => (
              <ListItem
                key={idx}
                disableGutters
                sx={{
                  alignItems: 'flex-start',
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    mt: 0.8,
                    mr: 1.5,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: accent,
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                />
                <ListItemText
                  primary={content}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { color: '#475569', lineHeight: 1.7, fontWeight: 500 },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {ctaLabel && (
          <Box mt={4}>
            <Button
              onClick={onCtaClick}
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                backgroundColor: accent,
                boxShadow: `0 10px 20px ${accent}33`,
                '&:hover': {
                  backgroundColor: accent,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 25px ${accent}44`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              {ctaLabel}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
});

const AdvCard = React.memo(function AdvCard({ icon, title, desc, accent = '#6366F1' }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      sx={{
        height: '100%',
        position: 'relative',
        p: '1.5px', // Border glow
        borderRadius: 4,
        overflow: 'hidden',
        '&:hover .bg-glow': { transform: 'scale(1.2)', opacity: 0.15 },
        '&:hover .icon-box': { transform: 'rotate(10deg) scale(1.1)' },
      }}
    >
      {/* Animated Gradient Border Loop */}
      <Box
        component={motion.div}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          inset: '-50%',
          background: `conic-gradient(from 0deg, transparent, ${accent}, transparent 40%, transparent)`,
          zIndex: 0,
          opacity: 0.3,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          height: '100%',
          background: '#fff',
          borderRadius: 4,
          p: 4,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        {/* Subtle Inner Glow Loop */}
        <Box
          className="bg-glow"
          component={motion.div}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
            opacity: 0.05,
            zIndex: -1,
            transition: 'all 0.4s ease',
          }}
        />

        <Box
          className="icon-box"
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: `${accent}12`,
            color: accent,
            mb: 3,
            transition: 'transform 0.3s ease',
            position: 'relative',
          }}
        >
          {React.cloneElement(icon, { size: 32 })}
          {/* Pulsing rings */}
          <Box
            component={motion.div}
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${accent}`,
            }}
          />
        </Box>

        <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 1.5, lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem' }}>
          {desc}
        </Typography>
      </Box>
    </Box>
  );
});

const BASE_FAQS = [
  {
    q: 'Apa itu XOFTWARE DIGITAL INDONESIA?',
    a: 'Perusahaan enabler penjualan produk digital: kami sediakan platform, integrasi pembayaran, otomasi WhatsApp/Telegram, afiliasi, serta analitik penjualan real-time.',
  },
  {
    q: 'Layanan apa saja yang disediakan?',
    a: 'E-Commerce khusus produk digital (CMS), otomasi WhatsApp/Telegram, integrasi pembayaran lokal (QRIS, transfer bank, e-wallet), pengiriman otomatis, afiliasi/reseller, dan dashboard analitik.',
  },
  {
    q: 'Apakah mendukung pembayaran lokal di Indonesia?',
    a: 'Ya. Kami integrasikan QRIS, transfer bank, dan dompet digital populer. Order dapat diproses otomatis setelah pembayaran sukses tervalidasi.',
  },
  {
    q: 'Bagaimana keamanan produk digital saya?',
    a: 'Kami menerapkan fitur anti-pembajakan & kontrol akses. Data diproteksi di level aplikasi dan infrastruktur, meminimalkan kebocoran & misuse.',
  },
  {
    q: 'Bisa otomatisasi penjualan via WhatsApp dan Telegram?',
    a: 'Bisa. Kami sediakan alur otomasi end-to-end untuk katalog, stok, checkout, sampai fulfilment langsung di chat.',
  },
  {
    q: 'Apakah ada program afiliasi/reseller?',
    a: 'Ada. Sistem afiliasi terintegrasi untuk reseller & influencer, lengkap dengan pelacakan performa dan payout.',
  },
  {
    q: 'Apakah ada dashboard analitik?',
    a: 'Ada. Dashboard real-time untuk memantau pendapatan, perilaku pelanggan, dan performa produk, sehingga keputusan bisa data-driven.',
  },
  {
    q: 'Bagaimana proses onboarding & support?',
    a: 'Tim kami bantu dari setup, migrasi, kustomisasi fitur, hingga troubleshooting. Dukungan berkelanjutan saat go-to-market.',
  },
  {
    q: 'Skalanya bisa sampai enterprise?',
    a: 'Bisa. Arsitektur kami siap scale dari seller individu hingga perusahaan dengan ribuan produk & transaksi tinggi.',
  },
  {
    q: 'Bagaimana skema biaya?',
    a: 'Transparan & fleksibel. Kami sesuaikan paket dengan kebutuhan fitur dan skala transaksi. Hubungi kami untuk proposal.',
  },
];

function buildFaqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };
}

function FAQSection({ id = 'faq', accent = '#6366F1' }) {
  const [query, setQuery] = React.useState('');
  const [expandedAll, setExpandedAll] = React.useState(false);

  const faqs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BASE_FAQS;
    return BASE_FAQS.filter(({ q: _q, a }) => (_q + ' ' + a).toLowerCase().includes(q));
  }, [query]);

  return (
    <Box
      id={id}
      sx={{
        position: 'relative',
        py: { xs: 12, md: 15 },
        px: 2,
        background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
        overflow: 'hidden',
      }}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(BASE_FAQS)) }} />
      </Head>

      {/* Background Decor */}
      <Box sx={{ position: 'absolute', top: '10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`, filter: 'blur(80px)' }} />

      <Container sx={{ position: 'relative', zIndex: 1, maxWidth: 'md' }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: accent, fontWeight: 800, letterSpacing: 2, mb: 1, display: 'block' }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a', mb: 2, fontSize: { xs: '2.2rem', md: '3rem' } }}>
            Butuh Jawaban Cepat?
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
            Kami telah merangkum beberapa hal yang sering ditanyakan pelanggan kami.
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          sx={{
            display: 'flex',
            gap: 2,
            mb: 6,
            p: 1.5,
            borderRadius: 4,
            background: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
          }}
        >
          <TextField
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari pertanyaan..."
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: accent, ml: 1, mr: 1 }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant={expandedAll ? 'outlined' : 'contained'}
            onClick={() => setExpandedAll(v => !v)}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              backgroundColor: expandedAll ? 'transparent' : accent,
              borderColor: accent,
              color: expandedAll ? accent : '#fff',
              '&:hover': { backgroundColor: expandedAll ? 'transparent' : accent, opacity: 0.9 },
            }}
          >
            {expandedAll ? 'Collapse' : 'Expand All'}
          </Button>
        </Box>

        <Box>
          {faqs.map((item, idx) => (
            <Accordion
              key={idx}
              disableGutters
              expanded={expandedAll ? true : undefined}
              sx={{
                mb: 2,
                borderRadius: '16px !important',
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  borderColor: accent,
                  boxShadow: `0 10px 25px ${accent}11`,
                  transform: 'scale(1.01)',
                },
              }}
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon sx={{ color: accent }} />}
                sx={{ px: 3, py: 1, '& .MuiAccordionSummary-content': { my: 1 } }}
              >
                <Typography fontWeight={700} sx={{ color: '#1e293b' }}>{item.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Divider sx={{ mb: 2, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}

          {faqs.length === 0 && (
            <Box textAlign="center" py={10}>
              <Typography variant="h6" color="text.secondary">
                Hasil tidak ditemukan.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

// Badge untuk highlights kecil
function BadgePill({ children }) {
  return (
    <Box
      component={motion.span}
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={{
        fontSize: '0.78rem',
        fontWeight: 700,
        px: 1.25,
        py: 0.6,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </Box>
  );
}

// Stat badge dengan micro-animation
function StatBadge({ icon, label, value }) {
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        width: { xs: '100%', sm: 'auto' },
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        p: 2,
        minWidth: 240,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function ChipHero({ children }) {
  return (
    <Box
      component={motion.span}
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      sx={{
        fontSize: '0.78rem',
        fontWeight: 700,
        px: 1.25,
        py: 0.6,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {children}
    </Box>
  );
}

function PillarCard({ icon, title, desc, accent = '#6366F1' }) {
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        p: 4,
        borderRadius: 5,
        background: '#fff',
        border: '1px solid #f1f5f9',
        height: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: accent,
          boxShadow: `0 20px 40px ${accent}11`,
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
          color: '#fff',
          boxShadow: `0 8px 16px ${accent}33`,
          mb: 3,
        }}
      >
        {React.cloneElement(icon, { size: 28 })}
      </Box>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1, color: '#1e293b' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8 }}>
        {desc}
      </Typography>
    </Box>
  );
}

/** ReadMore: clamp paragraf panjang + toggle */
function ReadMore({ children, maxLines = 5 }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Box>
      <Typography
        variant="body1"
        sx={{
          whiteSpace: 'pre-line',
          lineHeight: 1.8,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: open ? 'unset' : maxLines,
          overflow: 'hidden',
        }}
      >
        {children}
      </Typography>

      <Box mt={2} display="flex" justifyContent="center">
        <Button onClick={() => setOpen(v => !v)} size="small" variant="text" endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {open ? 'Sembunyikan' : 'Selengkapnya'}
        </Button>
      </Box>
    </Box>
  );
}

// Artistic Section Dividers (Subtle Blending & Balanced)
const SectionDivider = ({ type = 'wave', color = '#fff', flip = false, opacity = 1 }) => {
  const containerStyle = {
    position: 'absolute',
    [flip ? 'top' : 'bottom']: -1,
    left: 0,
    width: '100%',
    lineHeight: 0,
    zIndex: 2,
    transform: flip ? 'rotate(180deg)' : 'none',
    pointerEvents: 'none',
  };

  if (type === 'wave') {
    return (
      <Box sx={containerStyle}>
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          <motion.path
            animate={{
              d: [
                "M0 30L48 35C96 40 192 50 288 51.7C384 53.3 480 46.7 576 40C672 33.3 768 26.7 864 28.3C960 30 1056 40 1152 41.7C1248 43.3 1344 36.7 1392 33.3L1440 30V120H0V30Z",
                "M0 40L48 38C96 36 192 32 288 33C384 34 480 40 576 45C672 50 768 54 864 53C960 52 1056 46 1152 44C1248 42 1344 44 1392 45L1440 46V120H0V40Z"
              ]
            }}
            transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            fill={color} fillOpacity={0.05 * opacity}
          />
          <motion.path
            animate={{
              d: [
                "M0 60L48 58.3C96 56.7 192 53.3 288 51.7C384 50 480 50 576 53.3C672 56.7 768 63.3 864 63.3C960 63.3 1056 56.7 1152 53.3C1248 50 1344 50 1392 50L1440 50V120H0V60Z",
                "M0 50L48 52C96 54 192 58 288 57C384 56 480 50 576 45C672 40 768 36 864 36C960 36 1056 42 1152 44C1248 46 1344 44 1392 43L1440 42V120H0V50Z"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 1 }}
            fill={color} fillOpacity={0.1 * opacity}
          />
          <motion.path
            animate={{
              d: [
                "M0 90L48 85C96 80 192 70 288 66.7C384 63.3 480 66.7 576 71.7C672 76.7 768 83.3 864 81.7C960 80 1056 70 1152 65C1248 60 1344 60 1392 60L1440 60V120H0V90Z",
                "M0 80L48 82C96 84 192 88 288 89C384 90 480 88 576 85C672 82 768 78 864 77C960 76 1056 78 1152 80C1248 82 1344 80 1392 79L1440 78V120H0V80Z"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 2 }}
            fill={color} fillOpacity={0.9 * opacity}
          />
        </svg>
      </Box>
    );
  }

  if (type === 'slant') {
    return (
      <Box sx={containerStyle}>
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          <motion.path
            animate={{ d: ["M0 120L1440 20V120H0Z", "M0 120L1440 40V120H0Z"] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            fill={color} fillOpacity={0.05 * opacity}
          />
          <motion.path
            animate={{ d: ["M0 120L1440 60V120H0Z", "M0 120L1440 50V120H0Z"] }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 1 }}
            fill={color} fillOpacity={0.1 * opacity}
          />
          <path d="M0 120L1440 100V120H0Z" fill={color} fillOpacity={0.9 * opacity} />
        </svg>
      </Box>
    );
  }

  if (type === 'curve') {
    return (
      <Box sx={containerStyle}>
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          <motion.path
            animate={{ d: ["M0 120C480 40 960 40 1440 120V120H0Z", "M0 120C480 20 960 60 1440 120V120H0Z"] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            fill={color} fillOpacity={0.05 * opacity}
          />
          <motion.path
            animate={{ d: ["M0 120C480 80 960 80 1440 120V120H0Z", "M0 120C480 60 960 100 1440 120V120H0Z"] }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 0.5 }}
            fill={color} fillOpacity={0.1 * opacity}
          />
          <path d="M0 120C480 100 960 100 1440 120V120H0Z" fill={color} fillOpacity={0.9 * opacity} />
        </svg>
      </Box>
    );
  }

  return null;
};

export default function HomePage() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>XOFTWARE Digital Indonesia – Platform Penjualan Produk Digital Terpadu</title>
        <meta name="description" content="XOFTWARE DIGITAL INDONESIA: jembatan antara penjual & pembeli produk digital. E-commerce digital, automasi WhatsApp/Telegram, integrasi pembayaran lokal, afiliasi, dan analitik real-time." />
      </Head>

      <Navbar />

      {/* Hero / Company Intro */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 15, md: 20 },
          pb: { xs: 15, md: 25 },
          px: 2,
          textAlign: 'center',
          background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
          color: 'white',
        }}
        id="home"
      >
        <SectionDivider type="wave" color="#f8fafc" />
        {/* Animated Background Blobs */}
        <Blob color="#4F46E5" size={400} top="-10%" left="-5%" delay={0} duration={25} />
        <Blob color="#06B6D4" size={350} top="40%" left="80%" delay={2} duration={30} />
        <Blob color="#8B5CF6" size={300} top="70%" left="10%" delay={5} duration={22} />
        <Blob color="#6366F1" size={250} top="10%" left="60%" delay={3} duration={28} />

        {/* Grid Pattern Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Container sx={{ position: 'relative', zIndex: 1, maxWidth: 'lg' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
              alignItems: 'center',
              gap: { xs: 4, md: 6 },
            }}
          >
            {/* LEFT */}
            <Box>
              <Typography variant="h3" fontWeight={800} mb={1.5}>
                XOFTWARE DIGITAL INDONESIA
              </Typography>

              {/* Tagline pendek (2–3 baris max) */}
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.95,
                  maxWidth: 760,
                }}
              >
                Kami menyediakan platform yang dilengkapi dengan pembayaran Qris dan sistem otomatisasi penuh untuk memudahkan penjual (seller) dalam memasarkan dan menjual produk digital mereka.
              </Typography>

              {/* Bullet value props singkat */}
              <Box mt={2} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <ChipHero>Integrasi Pembayaran</ChipHero>
                <ChipHero>Automasi WA/Telegram</ChipHero>
                <ChipHero>Anti-Pembajakan</ChipHero>
                <ChipHero>Affiliate/Reseller</ChipHero>
                <ChipHero>Dashboard Penjualan</ChipHero>
              </Box>

              {/* CTAs */}
              <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" color="inherit" onClick={() => router.push('/register')} startIcon={<FaRegistered size={18} />}>
                  Daftar Sekarang
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => document?.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}>
                  Lihat Layanan
                </Button>
                <Button color="inherit" onClick={() => document?.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>
                  Tentang Kami
                </Button>
              </Box>

              {/* Stats (tetep ada) */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 5 }}>
                <StatBadge icon={<ShoppingCart sx={{ fontSize: 28 }} />} label="Total Transaksi" value="1.7jt+" />
                <StatBadge icon={<PeopleAlt sx={{ fontSize: 28 }} />} label="Total User" value="1.1jt+" />
              </Box>
            </Box>

            {/* RIGHT: gambar (desktop) */}
            <Box component={motion.div} whileHover={{ y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}>
              <Box
                component="img"
                src="/jumbotron-image.png"
                alt="XOFTWARE platform illustration"
                sx={{
                  width: '100%',
                  maxWidth: 520,
                  borderRadius: 2,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: -20,
                  borderRadius: 2.5,
                  background: 'radial-gradient(400px 220px at 60% 110%, rgba(255,255,255,0.15), transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Services */}
      <Box id="services" sx={{ py: { xs: 12, md: 18 }, px: 2, bgcolor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
        <SectionDivider type="slant" color="#0f172a" />
        {/* Background Decorative Elements */}
        <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #6366F111 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <Box sx={{ position: 'absolute', bottom: '5%', left: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #06B6D411 0%, transparent 70%)', filter: 'blur(50px)' }} />

        <Container sx={{ position: 'relative', zIndex: 1, maxWidth: 'lg' }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
            <Typography
              variant="overline"
              sx={{
                color: ACCENT,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                display: 'block',
                mb: 1,
              }}
            >
              Our Solutions
            </Typography>
            <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a', mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
              Layanan Unggulan Kami
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
              Solusi cerdas dan terintegrasi untuk membantu bisnis digital Anda tumbuh lebih cepat dan aman.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* E-Commerce Platform Khusus Digital */}
            <Grid item xs={12} md={6}>
              <ServiceCard
                accent="#6366F1"
                icon={<FaCloudUploadAlt />}
                title="E-Commerce Platform Digital"
                items={[
                  'CMS yang dioptimalkan khusus untuk produk virtual dan lisensi.',
                  'Manajemen stok otomatis dan pengiriman instan.',
                  'Mendukung berbagai kategori: Topup, Pulsa, Kursus, hingga Software.',
                ]}
              />
            </Grid>

            {/* Automasi WA/Telegram + Keamanan */}
            <Grid item xs={12} md={6}>
              <ServiceCard
                accent="#8B5CF6"
                icon={<FaUsersCog />}
                title="Automasi Chat & Keamanan"
                items={[
                  'Bot WhatsApp & Telegram untuk transaksi otomatis 24/7.',
                  'Fitur anti-pembajakan tingkat lanjut untuk melindungi aset Anda.',
                  'Notifikasi real-time langsung ke perangkat pelanggan.',
                ]}
              />
            </Grid>

            {/* Pembayaran & Distribusi */}
            <Grid item xs={12} md={6}>
              <ServiceCard
                accent="#06B6D4"
                icon={<FaGlobeAsia />}
                title="Pembayaran & Distribusi"
                items={[
                  'Integrasi QRIS, Virtual Account, dan E-Wallet lokal terlengkap.',
                  'Sistem settlement otomatis yang cepat dan transparan.',
                  'Jangkauan distribusi produk ke pasar lokal maupun global.',
                ]}
              />
            </Grid>

            {/* Marketing, Afiliasi, Analytics */}
            <Grid item xs={12} md={6}>
              <ServiceCard
                accent="#F43F5E"
                icon={<FaChartBar />}
                title="Marketing & Business Insight"
                items={[
                  'Sistem Afiliasi & Reseller terintegrasi untuk mendongkrak penjualan.',
                  'Dashboard Analitik real-time untuk memantau performa bisnis.',
                  'Konsultasi strategi harga dan peluncuran produk.',
                ]}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        id="keunggulan"
        sx={{
          py: { xs: 15, md: 20 },
          px: 2,
          color: 'white',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SectionDivider type="curve" color="#fff" />
        <Box
          component={motion.div}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, #6366F115 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />

        <Container sx={{ maxWidth: 'lg', position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: '#818cf8', fontWeight: 800, letterSpacing: 3, mb: 1, display: 'block' }}>
              Why Choose Us
            </Typography>
            <Typography variant="h3" fontWeight={900} sx={{ mb: 2 }}>
              Keunggulan Kompetitif
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 700, mx: 'auto', fontSize: '1.1rem' }}>
              Kami menghadirkan infrastruktur terbaik untuk memastikan bisnis digital Anda beroperasi dengan performa maksimal dan keamanan tanpa kompromi.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <AdvCard accent="#6366F1" icon={<FaShieldAlt />} title="Fokus pada Keamanan" desc="Keamanan data & produk jadi prioritas utama kami untuk ketenangan Anda." />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvCard accent="#10B981" icon={<FaUsersCog />} title="Customer-Centric" desc="Solusi dibangun berdasarkan feedback nyata dari kebutuhan penjual." />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvCard accent="#F59E0B" icon={<FaRocket />} title="Dukungan Penuh" desc="Bantuan teknis 24/7 untuk memastikan operasional Anda lancar." />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvCard accent="#EC4899" icon={<FaGlobeAsia />} title="Skalabilitas" desc="Infrastruktur yang siap berkembang seiring pertumbuhan bisnis Anda." />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <FAQSection id="faq" accent="#6366F1" />
      <Box sx={{ position: 'relative' }}>
        <SectionDivider type="curve" color="#fff" />
      </Box>

      {/* Tentang Kami */}
      <Box
        id="about"
        sx={{
          py: { xs: 12, md: 15 },
          px: 2,
          color: '#0f172a',
          background: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Decor */}
        <Box sx={{ position: 'absolute', top: '10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #6366F108 0%, transparent 70%)', filter: 'blur(100px)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: ACCENT, fontWeight: 800, letterSpacing: 2, mb: 1, display: 'block' }}>
              Our Story
            </Typography>
            <Typography variant="h3" fontWeight={900} sx={{ mb: 2, fontSize: { xs: '2.2rem', md: '3rem' } }}>
              Tentang Kami
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
              Membangun masa depan ekonomi digital Indonesia melalui inovasi dan integrasi tanpa batas.
            </Typography>
          </Box>

          {/* Top summary with 3 pillars */}
          <Grid container spacing={3} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
              <PillarCard icon={<AutoAwesomeRoundedIcon />} title="Platform Terpadu" desc="Solusi dari hosting hingga transaksi akhir yang siap pakai dalam satu ekosistem." accent="#6366F1" />
            </Grid>
            <Grid item xs={12} md={4}>
              <PillarCard icon={<SecurityRoundedIcon />} title="Keamanan Berlapis" desc="Proteksi aset digital tingkat tinggi dengan sistem anti-pembajakan termutakhir." accent="#6366F1" />
            </Grid>
            <Grid item xs={12} md={4}>
              <PillarCard icon={<InsightsRoundedIcon />} title="Keputusan Berbasis Data" desc="Analitik real-time yang mendalam untuk memandu strategi pertumbuhan bisnis Anda." accent="#6366F1" />
            </Grid>
          </Grid>

          {/* Long copy in a pretty card + ReadMore */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            sx={{
              p: '1px',
              borderRadius: 5,
              background: `linear-gradient(135deg, ${ACCENT}33, transparent 50%, ${ACCENT}11)`,
              maxWidth: 1000,
              mx: 'auto',
            }}
          >
            <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 5, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, justifyContent: 'center' }}>
                <Chip label="Tech Enabler" size="small" sx={{ fontWeight: 700, bgcolor: `${ACCENT}11`, color: ACCENT }} />
                <Chip label="Digital Solution" size="small" sx={{ fontWeight: 700, bgcolor: `${ACCENT}11`, color: ACCENT }} />
                <Chip label="Innovation Hub" size="small" sx={{ fontWeight: 700, bgcolor: `${ACCENT}11`, color: ACCENT }} />
              </Box>

              <ReadMore maxLines={4}>
                {`XOFTWARE DIGITAL INDONESIA didirikan dengan semangat untuk menjembatani kesenjangan antara produk digital berkualitas tinggi dan pasar yang luas. Kami bukan sekadar perusahaan teknologi, melainkan mitra strategis bagi para kreator dan bisnis digital.

                Kami memahami tantangan dalam mendistribusikan karya digital, mulai dari masalah hosting yang stabil, integrasi pembayaran yang rumit, hingga risiko keamanan. Itulah mengapa kami hadir dengan infrastruktur lengkap—mencakup sistem pembayaran terintegrasi, otomasi chat, hingga analitik bisnis yang cerdas.

                Fokus kami adalah mempermudah setiap proses operasional, sehingga Anda dapat mencurahkan energi sepenuhnya pada inovasi dan penjualan produk. Bersama XOFTWARE, masa depan bisnis digital Anda ada dalam kendali yang aman dan terautomasi.`}
              </ReadMore>
            </Box>
          </Box>
        </Container>
        <SectionDivider type="wave" color="#4f46e5" />
      </Box>

      {/* CTA Section - Ready to Scale? */}
      <Box
        sx={{
          py: { xs: 10, md: 15 },
          px: 2,
          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Decor */}
        <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(80px)' }} />
        <Box sx={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(60px)' }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight={900} sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            Siap untuk Melipatgandakan Penjualan Anda?
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, opacity: 0.9, fontWeight: 400 }}>
            Bergabunglah dengan ribuan seller lainnya yang telah sukses mengotomatisasi bisnis digital mereka bersama XOFTWARE.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/register')}
              sx={{
                bgcolor: '#fff',
                color: '#6366F1',
                px: 6,
                py: 2,
                borderRadius: 3,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'none',
                '&:hover': { bgcolor: '#f8fafc', transform: 'translateY(-3px)' },
                transition: 'all 0.3s ease',
              }}
            >
              Mulai Gratis Sekarang
            </Button>
            <Button
              variant="outlined"
              size="large"
              component="a"
              href="https://wa.me/6281370101295"
              target="_blank"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
                px: 6,
                py: 2,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1.1rem',
                textTransform: 'none',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)', transform: 'translateY(-3px)' },
                transition: 'all 0.3s ease',
              }}
            >
              Hubungi Sales Kami
            </Button>
          </Stack>
        </Container>
        <SectionDivider type="slant" color="#0f172a" />
      </Box>

      {/* Footer */}
      {/* <Box
        component={motion.footer}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        sx={{
          pt: 6,
          pb: 6,
          px: 4,
          mt: 0,
          color: "black",
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid #e5e7eb',
          background: 'linear-gradient(to top right, #eef2ff, #fdfbff)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: '-60px', left: '-60px', width: 200, height: 200, bgcolor: '#0b264ec0', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-60px', right: '-60px', width: 200, height: 200, bgcolor: '#4557a1c0', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: '30%', left: '40%', width: 100, height: 100, bgcolor: '#253a56b6', borderRadius: '40% 60% 60% 40%', filter: 'blur(60px)', zIndex: 0 }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 4 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <img src="/favicon.ico" alt="Xoftware" width={40} />
              <Typography variant="h6" fontWeight={700} color="primary">
                Xoftware
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Xoftware.id - PT. Xoftware Digital Indonesia. All Rights Reserved.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={600} mb={1}>Navigasi</Typography>
            {['Beranda', 'Layanan', 'Keunggulan', 'Kontak'].map((item, i) => (
              <Typography key={i} variant="body2" color="text.secondary">{item}</Typography>
            ))}
          </Box>

          <Box>
            <Typography fontWeight={600} mb={1}>Kontak</Typography>
            <Typography variant="body2" color="text.secondary">support@xoftware.id</Typography>
            <Typography variant="body2" color="text.secondary">+62 813-7010-1295</Typography>
          </Box>
        </Box>
      </Box> */}
      <FooterPage />
    </>
  );
}

const Hamburger = ({ isOpen, toggle, backgroundColor }) => {
  const lineStyle = {
    height: 3,
    background: isOpen ? '#000' : backgroundColor || '#000',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
    left: 0,
  };

  return (
    <Box onClick={toggle} sx={{ width: 30, height: 24, position: 'relative', cursor: 'pointer', zIndex: 1000 }}>
      <motion.div animate={isOpen ? { rotate: 45, top: 10 } : { rotate: 0, top: 0 }} transition={{ duration: 0.3 }} style={{ ...lineStyle }} />
      <motion.div animate={isOpen ? { opacity: 0 } : { opacity: 1, top: 10 }} transition={{ duration: 0.3 }} style={{ ...lineStyle, width: 22 }} />
      <motion.div animate={isOpen ? { rotate: -45, top: 10 } : { rotate: 0, top: 20 }} transition={{ duration: 0.3 }} style={{ ...lineStyle }} />
    </Box>
  );
};

const menuList = [
  { name: 'Home', ref: '#home' },
  { name: 'Layanan', ref: '#services' },
  { name: 'Keunggulan', ref: '#keunggulan' },
  { name: 'FAQ', ref: '#faq' },
  { name: 'Tentang kami', ref: '#about' },
  { name: 'Kontak', ref: '#contact' },
  { name: 'Blog', ref: Config.NEXT_PUBLIC_BLOG },
  { name: 'Login', ref: '/login' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <Box>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          borderBottom: isScrolled ? '1px solid #eee' : 'none',
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box component="img" src="/icon.png" alt="Logo" sx={{ width: 40, height: 40, borderRadius: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Typography fontWeight={900} color={isScrolled ? '#0f172a' : '#fff'} sx={{ letterSpacing: -0.5, fontSize: '1.2rem' }}>
              XOFTWARE<Box component="span" sx={{ color: '#6366F1' }}>.ID</Box>
            </Typography>
          </Stack>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
            {menuList.map((item, index) => (
              <Typography
                key={index}
                sx={{ cursor: 'pointer', color: isScrolled ? '#1a0033' : '#fff', fontWeight: 500, '&:hover': { opacity: 0.8 } }}
                onClick={() => {
                  const target = item.ref.startsWith('/') ? false : document.querySelector(item.ref);
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                  else router.push(item.ref);
                }}
              >
                {item.name}
              </Typography>
            ))}
          </Box>

          {/* Hamburger */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Hamburger isOpen={isOpen} toggle={toggleMenu} backgroundColor={isScrolled ? '#1a0033' : '#fff'} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              backgroundColor: '#fff',
              zIndex: 800,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem',
            }}
          >
            {menuList.map((item, i) => (
              <motion.div
                key={i}
                onClick={() => {
                  setIsOpen(false);
                  const target = item.ref.startsWith('/') ? false : document.querySelector(item.ref);
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                  else router.push(item.ref);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.35, ease: 'easeOut' }}
                style={{ fontSize: '1.5rem', margin: '12px 0', cursor: 'pointer' }}
              >
                {item.name}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
