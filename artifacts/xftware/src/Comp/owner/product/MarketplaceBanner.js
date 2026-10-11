/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  IconButton,
  Skeleton,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { reqOwner } from '@/lib/requestApi';

const AUTO_SLIDE_INTERVAL = 5000;
const SWIPE_CONFIDENCE_THRESHOLD = 8000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

export default function MarketplaceBanner() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const timerRef = useRef(null);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await reqOwner({ action: 'getMarketplaceBanners' });
      if (!res?.error && Array.isArray(res?.data)) {
        const now = new Date();
        const validBanners = res.data.filter((b) => !b.expired_at || new Date(b.expired_at) > now);
        setBanners(validBanners);
      }
    } catch (err) {
      console.error('[MarketplaceBanner] Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleNext = useCallback(() => {
    if (banners.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleDotClick = (idx) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Auto-sliding interval timer: pause on hover or touch
  useEffect(() => {
    if (banners.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isHovered, handleNext]);

  // Loading Skeleton matches exact responsive aspect ratios
  if (loading) {
    return (
      <Box sx={{ mb: 2.5, width: '100%' }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          sx={{
            width: '100%',
            aspectRatio: {
              xs: '16 / 7.5',
              sm: '16 / 6',
              md: '16 / 5',
              lg: '3.6 / 1',
            },
            minHeight: { xs: 125, sm: 155, md: 180 },
            maxHeight: { xs: 190, sm: 240, md: 280, lg: 320 },
            borderRadius: { xs: 2.5, sm: 3 },
          }}
        />
      </Box>
    );
  }

  // Jika tidak ada banner aktif, sembunyikan sepenuhnya
  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex] || banners[0];

  const handleBannerClick = () => {
    if (currentBanner?.target_url) {
      window.open(currentBanner.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: {
          xs: '16 / 7.5', // Mobile: ~2.1:1, proporsional agar teks promo tidak gepeng/terpotong
          sm: '16 / 6',   // Tablet: ~2.6:1
          md: '16 / 5',   // Desktop/Laptop: ~3.2:1
          lg: '3.6 / 1',  // Layar lebar: ~3.6:1
        },
        minHeight: { xs: 125, sm: 155, md: 180 },
        maxHeight: { xs: 190, sm: 240, md: 280, lg: 320 },
        borderRadius: { xs: 2.5, sm: 3 },
        overflow: 'hidden',
        mb: 2.5,
        backgroundColor:
          theme.palette.mode === 'dark' ? '#13131a' : '#eef2f6',
        border: `1px solid ${alpha(
          theme.palette.mode === 'dark'
            ? theme.palette.common.white
            : theme.palette.common.black,
          0.08
        )}`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 6px 24px rgba(0,0,0,0.45)'
            : '0 6px 20px rgba(99,102,241,0.09)',
        userSelect: 'none',
        touchAction: 'pan-y', // Memungkinkan scroll halaman vertikal sambil mendukung swipe horizontal
      }}
    >
      {/* Ambient Blurred Background (Menghindari ruang kosong jika rasio gambar sedikit berbeda) */}
      <Box
        component="img"
        src={currentBanner.image_url}
        alt=""
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: -12,
          width: 'calc(100% + 24px)',
          height: 'calc(100% + 24px)',
          objectFit: 'cover',
          filter: 'blur(20px) brightness(0.55)',
          transform: 'scale(1.15)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Banner Slide dengan Framer Motion & Touch Gesture Swipe */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentBanner.id || currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag={banners.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -SWIPE_CONFIDENCE_THRESHOLD || offset.x < -45) {
              handleNext();
            } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD || offset.x > 45) {
              handlePrev();
            }
          }}
          onClick={handleBannerClick}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            cursor: currentBanner.target_url ? 'pointer' : 'default',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Main Sharp Banner Image (Contain: tidak terpotong) */}
          <Box
            component="img"
            src={currentBanner.image_url}
            alt={currentBanner.title || 'Marketplace Banner'}
            title={currentBanner.title || undefined}
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              zIndex: 1,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Promo / Sponsor Chip Badge (Top-Right) */}
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span>PROMO</span>
            {currentBanner.target_url && (
              <OpenInNew sx={{ fontSize: '11px !important' }} />
            )}
          </Box>
        }
        size="small"
        sx={{
          position: 'absolute',
          top: { xs: 8, sm: 12 },
          right: { xs: 8, sm: 12 },
          zIndex: 3,
          fontSize: { xs: '0.62rem', sm: '0.68rem' },
          fontWeight: 800,
          height: { xs: 20, sm: 23 },
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          color: '#ffffff',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          letterSpacing: '0.6px',
        }}
      />

      {/* Navigation Controls (Hanya jika terdapat lebih dari 1 banner) */}
      {banners.length > 1 && (
        <>
          {/* Previous Button */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            sx={{
              position: 'absolute',
              top: '50%',
              left: { xs: 6, sm: 12 },
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
              backdropFilter: 'blur(6px)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
              },
              width: { xs: 28, sm: 34, md: 38 },
              height: { xs: 28, sm: 34, md: 38 },
              opacity: isHovered || isMobile || isTablet ? 0.9 : 0,
              transition: 'opacity 0.25s ease, background-color 0.2s',
            }}
            aria-label="Previous banner"
          >
            <ChevronLeft sx={{ fontSize: { xs: 18, sm: 22, md: 24 } }} />
          </IconButton>

          {/* Next Button */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            sx={{
              position: 'absolute',
              top: '50%',
              right: { xs: 6, sm: 12 },
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
              backdropFilter: 'blur(6px)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
              },
              width: { xs: 28, sm: 34, md: 38 },
              height: { xs: 28, sm: 34, md: 38 },
              opacity: isHovered || isMobile || isTablet ? 0.9 : 0,
              transition: 'opacity 0.25s ease, background-color 0.2s',
            }}
            aria-label="Next banner"
          >
            <ChevronRight sx={{ fontSize: { xs: 18, sm: 22, md: 24 } }} />
          </IconButton>

          {/* Dots / Pagination Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 6, sm: 10 },
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.6, sm: 0.8 },
              zIndex: 3,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.4, sm: 0.6 },
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {banners.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <Box
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(idx);
                  }}
                  sx={{
                    width: isActive ? { xs: 16, sm: 22 } : { xs: 6, sm: 7 },
                    height: { xs: 5, sm: 6 },
                    borderRadius: 3,
                    backgroundColor: isActive
                      ? theme.palette.primary.main
                      : 'rgba(255, 255, 255, 0.45)',
                    cursor: 'pointer',
                    transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: isActive
                        ? theme.palette.primary.main
                        : 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                />
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
