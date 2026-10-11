// pages/index.js
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';

const REDIRECT_BASE = 'https://web.xoftware.id';
const REDIRECT_SECONDS = 10;

export async function getServerSideProps({ query }) {
  // Validasi sesuai file kamu: owner harus diawali "user"
  let owner = query.owner || '';
  if (!owner.startsWith('user')) return { notFound: true };
  let clearOwner = owner.slice(4);

  return { props: { clearOwner } };
}

export default function Index({ clearOwner }) {
  const router = useRouter();
  const [left, setLeft] = useState(REDIRECT_SECONDS); // detik tersisa
  const targetUrl = useMemo(() => `${REDIRECT_BASE}/${encodeURIComponent(clearOwner)}`, [clearOwner]);

  // Auto redirect + countdown
  useEffect(() => {
    const t0 = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const remain = Math.max(0, REDIRECT_SECONDS - Math.floor(elapsed));
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(tick);
        window.location.assign(targetUrl);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [targetUrl]);

  // Progress untuk visual feedback
  const progress = useMemo(
    () => ((REDIRECT_SECONDS - left) / REDIRECT_SECONDS) * 100,
    [left]
  );

  return (
    <>
      <Head>
        <title>Redirecting…</title>
        <meta name="robots" content="noindex,nofollow" />
        {/* Fallback meta-refresh (jika JS mati) */}
        <meta httpEquiv="refresh" content={`${REDIRECT_SECONDS};url=${targetUrl}`} />
        {/* Sedikit optimisasi koneksi */}
        <link rel="preconnect" href={REDIRECT_BASE} crossOrigin="" />
        <link rel="dns-prefetch" href={REDIRECT_BASE} />
      </Head>

      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          // === Background multi-gradient elegan (soft) ===
          // Radial glows + conic sheen + base gradient
          backgroundImage: `
            radial-gradient(1200px 600px at 15% 10%, rgba(0,255,200,0.08), transparent 60%),
            radial-gradient(900px 500px at 85% 20%, rgba(255,0,200,0.06), transparent 60%),
            radial-gradient(1000px 700px at 50% 120%, rgba(255,255,255,0.04), transparent 70%),
            linear-gradient(135deg, #0b0e14 0%, #111724 45%, #1a2236 100%)
          `,
        }}
      >
        {/* Subtle overlay pattern (garis tipis sangat soft) */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.12,
            backgroundImage: `
              repeating-linear-gradient(60deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 36px),
              repeating-linear-gradient(-60deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 36px)
            `,
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 10 } }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <CardContent sx={{ p: { xs: 3.5, md: 5 } }}>
              <Stack spacing={3}>
                <Stack spacing={0.5}>
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)' }}
                  >
                    Redirect
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: 'white',
                    }}
                  >
                    Mengarahkan ke tujuan…
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    Kamu akan diarahkan ke{' '}
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {targetUrl}
                    </Box>{' '}
                    dalam <Box component="span" sx={{ fontWeight: 700 }}>{left}</Box> detik.
                  </Typography>
                </Stack>

                <Box aria-live="polite" aria-atomic="true">
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background:
                          'linear-gradient(90deg, rgba(0,255,200,0.8), rgba(120,180,255,0.9))',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.65)' }}
                  >
                    Auto redirect dalam {left}s — klik tombol jika ingin langsung.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5}>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => (window.location.href = targetUrl)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.5,
                      background:
                        'linear-gradient(90deg, rgba(0,255,200,0.9), rgba(120,180,255,0.95))',
                      boxShadow: '0 10px 30px rgba(0,200,200,0.15)',
                      '&:hover': {
                        boxShadow: '0 12px 36px rgba(0,200,200,0.22)',
                      },
                    }}
                  >
                    Pindah sekarang
                  </Button>

                  <Button
                    size="large"
                    variant="outlined"
                    onClick={() => navigator.clipboard?.writeText(targetUrl)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2.25,
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.4)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    Salin tautan
                  </Button>
                </Stack>

                {/* Fallback untuk non-JS */}
                <noscript>
                  <Typography sx={{ mt: 1.5 }}>
                    JavaScript nonaktif. Klik{' '}
                    <a href={targetUrl} style={{ textDecoration: 'underline', color: '#9bdcff' }}>
                      di sini
                    </a>{' '}
                    untuk melanjutkan.
                  </Typography>
                </noscript>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
}
