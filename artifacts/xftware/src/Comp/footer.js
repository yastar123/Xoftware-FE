import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, Stack } from "@mui/material";
import { Facebook, Instagram, YouTube, LinkedIn, Twitter, Email, Phone, Place } from "@mui/icons-material";
import { motion } from 'framer-motion';

export default function FooterPage() {
  const year = new Date().getFullYear();

  const footerLinks = {
    solution: [
      { text: "E-Commerce Digital", link: "#services" },
      { text: "Automasi Chatbot", link: "#services" },
      { text: "Integrasi Pembayaran", link: "#services" },
      { text: "Sistem Afiliasi", link: "#services" },
    ],
    company: [
      { text: "Tentang Kami", link: "#about" },
      { text: "Keunggulan", link: "#keunggulan" },
      { text: "FAQ", link: "#faq" },
      { text: "Blog", link: "https://blog.xoftware.id" },
    ],
    legal: [
      { text: "Kebijakan Privasi", link: "/privacy" },
      { text: "Syarat & Ketentuan", link: "/terms" },
      { text: "Pengumpulan Data", link: "/save-cookie" },
    ]
  };

  return (
    <Box
      component="footer"
      sx={{
        background: (t) => t.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
        color: (t) => t.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
        pt: { xs: 10, md: 15 },
        pb: 4,
        position: 'relative',
        overflow: 'hidden',
        borderTop: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      {/* Background Decor */}
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #6366F108 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <Box sx={{ position: 'absolute', top: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #06B6D408 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={8}>
          {/* Brand Column */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box component="img" src="/icon.png" alt="XOFTWARE Logo" sx={{ width: 50, height: 50, borderRadius: 2 }} />
                <Typography variant="h5" fontWeight={900} sx={{ color: (t) => t.palette.mode === 'dark' ? '#fff' : '#0f172a', letterSpacing: -0.5 }}>
                  XOFTWARE<Box component="span" sx={{ color: '#6366F1' }}>.ID</Box>
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.8, maxWidth: 320 }}>
                Platform teknologi terdepan untuk ekosistem produk digital Indonesia. Kami menghadirkan solusi otomasi dan pembayaran yang aman, cerdas, dan terstandarisasi.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              {[
                { icon: <Instagram />, link: "https://instagram.com/xoftware_id" },
                { icon: <Twitter />, link: "#" },
                { icon: <LinkedIn />, link: "#" },
                { icon: <YouTube />, link: "#" },
              ].map((social, i) => (
                <IconButton
                  key={i}
                  component={Link}
                  href={social.link}
                  target="_blank"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: '#6366F1',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Links Columns */}
          <Grid item xs={12} md={8} lg={5}>
            <Grid container spacing={4}>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: (t) => t.palette.mode === 'dark' ? '#fff' : '#1e293b', mb: 3 }}>
                  Solusi
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.solution.map((link, i) => (
                    <Link key={i} href={link.link} underline="none" sx={{ color: 'inherit', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
                      {link.text}
                    </Link>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: (t) => t.palette.mode === 'dark' ? '#fff' : '#1e293b', mb: 3 }}>
                  Perusahaan
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.company.map((link, i) => (
                    <Link key={i} href={link.link} underline="none" sx={{ color: 'inherit', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
                      {link.text}
                    </Link>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: (t) => t.palette.mode === 'dark' ? '#fff' : '#1e293b', mb: 3 }}>
                  Legal
                </Typography>
                <Stack spacing={1.5}>
                  {footerLinks.legal.map((link, i) => (
                    <Link key={i} href={link.link} underline="none" sx={{ color: 'inherit', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
                      {link.text}
                    </Link>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          {/* Contact Column */}
          <Grid item xs={12} md={4} lg={3}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: (t) => t.palette.mode === 'dark' ? '#fff' : '#1e293b', mb: 3 }}>
              Hubungi Kami
            </Typography>
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Email sx={{ color: '#6366F1', fontSize: 20 }} />
                <Typography variant="body2">support@xoftware.id</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Phone sx={{ color: '#6366F1', fontSize: 20 }} />
                <Typography variant="body2">+62 813-7010-1295</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Place sx={{ color: '#6366F1', fontSize: 20 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  Jl. H. Imam Munandar No. 99 Bagan Batu, Rokan Hilir, Riau 28992
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            © {year} XOFTWARE DIGITAL INDONESIA. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Built for the digital future.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
