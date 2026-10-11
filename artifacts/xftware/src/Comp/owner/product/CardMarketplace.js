import {
  Box, Typography, Card, CardContent, Chip, Button,
  Tooltip, alpha, Stack, Popover, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  ContentCopy, Check, Info, ChevronRight,
  Storefront, Visibility, Inventory2,
  Chat as Chat2, Gavel, Description as DescIcon
} from '@mui/icons-material';
import { idr } from '@/lib/helper';

// ─── PRODUCT PREVIEW DIALOG ──────────────────────────────────────────
export function ProductPreviewDialog({ open, onClose, product }) {
  if (!product) return null;
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex' }}>
          <Info sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: 16 }}>Detail Produk</Typography>
        <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
          <ChevronRight sx={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={3}>
           <Box>
             <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                Deskripsi
             </Typography>
             <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6, bgcolor: 'grey.50', p: 1.5, borderRadius: 2 }}>
                {product.desc || 'Tidak ada deskripsi'}
             </Typography>
           </Box>
           <Box>
             <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Gavel sx={{ fontSize: 18, color: 'text.secondary' }} />
                Syarat & Ketentuan
             </Typography>
             <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6, bgcolor: alpha('#f59e0b', 0.04), p: 1.5, borderRadius: 2, border: '1px solid', borderColor: alpha('#f59e0b', 0.1) }}>
                {product.snk || 'Tidak ada SNK khusus'}
             </Typography>
           </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── CHIP VARIASI SUMMARY ───────────────────────────────────────────
export function VariationSummaryChip({ total, cloned, available, onClick }) {
  return (
    <Chip
      icon={<Storefront sx={{ fontSize: 12 }} />}
      label={`${total} variasi`}
      size="small"
      color="primary"
      variant="outlined"
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      sx={{
        fontSize: 10,
        height: 22,
        fontWeight: 600,
        cursor: 'pointer',
        '&:hover': { bgcolor: alpha('#6366f1', 0.08) },
        transition: 'all 0.15s',
      }}
    />
  );
}

// ─── POPOVER DETAIL VARIASI ────────────────────────────────────────
export function VariationPopover({ anchorEl, open, onClose, variations }) {
  const cloned = variations.filter(v => v.is_cloned);
  const available = variations.filter(v => !v.is_cloned);
  const prices = variations.map(v => v.price).filter(Boolean);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2.5,
            mt: 0.5,
            minWidth: 260,
            maxWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }
      }}
      disablePortal
    >
      <Box sx={{ p: 1.5 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>
            Detail Variasi
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ width: 24, height: 24 }}>
            <ChevronRight sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {/* Price Range */}
        {prices.length > 0 && (
          <Box sx={{ mb: 1.5, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: alpha('#6366f1', 0.04) }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              Range Harga
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: 14, color: '#6366f1' }}>
              {minPrice === maxPrice ? idr(minPrice) : `${idr(minPrice)} - ${idr(maxPrice)}`}
            </Typography>
          </Box>
        )}

        {/* Stats */}
        <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, display: 'block' }}>Total</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: 14 }}>{variations.length}</Typography>
          </Box>
          <Box sx={{ flex: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: alpha('#10b981', 0.06), textAlign: 'center' }}>
            <Typography variant="caption" color="success.main" sx={{ fontSize: 9, display: 'block' }}>Diambil</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: 14, color: 'success.main' }}>{cloned.length}</Typography>
          </Box>
          <Box sx={{ flex: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: alpha('#3b82f6', 0.06), textAlign: 'center' }}>
            <Typography variant="caption" color="info.main" sx={{ fontSize: 9, display: 'block' }}>Tersedia</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: 14, color: 'info.main' }}>{available.length}</Typography>
          </Box>
        </Stack>

        {/* Variation List */}
        <Box sx={{ maxHeight: 160, overflow: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 } }}>
          {variations.map((v, i) => (
            <React.Fragment key={v.id}>
              {i > 0 && <Divider sx={{ my: 0.5, borderColor: alpha('#000', 0.04) }} />}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.4, px: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    bgcolor: v.is_cloned ? '#10b981' : '#e5e7eb'
                  }} />
                  <Typography variant="body2" noWrap sx={{ fontSize: 12, fontWeight: 500 }}>
                    {v.title}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                    {idr(v.price)}
                  </Typography>
                  {v.is_cloned && (
                    <Check sx={{ fontSize: 14, color: 'success.main' }} />
                  )}
                </Stack>
              </Stack>
            </React.Fragment>
          ))}
        </Box>

        {/* Footer Hint */}
        {available.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: 10, textAlign: 'center', fontStyle: 'italic' }}>
            Klik Kelola Produk untuk mengambil variasi baru
          </Typography>
        )}
      </Box>
    </Popover>
  );
}

import React, { useState } from 'react';

// ... (ProductPreviewDialog component already added above)

export function OptimizedProductCard({ product, onAction, onChat }) {
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const variations = product.variations || [];
  const isVariation = product.is_variation;
  const isCloned = product.is_cloned;
  
  const varStats = {
    total: variations.length,
    cloned: variations.filter(v => v.is_cloned).length,
    available: variations.filter(v => !v.is_cloned).length,
  };
  
  const allCloned = isVariation && varStats.total > 0 && varStats.available === 0;
  const prices = variations.map(v => v.price).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  // Hitung total stok
  const totalStock = isVariation 
    ? variations.reduce((sum, v) => sum + (v.remaining_stock || 0), 0)
    : (product.remaining_stock || 0);
  
  const disabled = (isCloned && !isVariation) || allCloned;
  
  const getButtonText = () => {
    if (isCloned && !isVariation) return 'Sudah Diambil';
    if (allCloned) return 'Lengkap';
    if (isVariation) return 'Kelola Produk';
    return 'Ambil';
  };

  const getButtonProps = () => {
    if (disabled) {
      return {
        variant: 'outlined',
        color: 'success',
        startIcon: <Check sx={{ fontSize: 14 }} />,
        disabled: true,
      };
    }
    return {
      variant: 'contained',
      color: 'primary',
      startIcon: <ContentCopy sx={{ fontSize: 14 }} />,
    };
  };

  return (
    <>
      <Card
        onClick={() => !disabled && onAction?.(product)}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          cursor: disabled ? 'default' : 'pointer',
          border: isCloned ? '2px solid' : '2px solid transparent',
          borderColor: isCloned ? alpha('#10b981', 0.4) : 'transparent',
          opacity: disabled ? 0.75 : 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': !disabled ? {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.15)',
          } : {},
        }}
      >
        {/* Thumbnail Section */}
        <Box sx={{
          height: 140,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}>
          {product.thumbnail ? (
            <Box
              component="img"
              src={product.thumbnail?.startsWith('http') ? product.thumbnail : `https://cdn.xoftware.id/f/${product.thumbnail}`}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <Storefront sx={{ fontSize: 48, color: 'grey.300' }} />
          )}

          {/* ─── TOP BADGES: Variasi (kiri) & Stok (kanan) ─── */}
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            right: 8, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 2,
            gap: 0.5,
          }}>
            {/* KIRI: Badge Variasi */}
            {isVariation && varStats.total > 0 ? (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip
                  icon={<Storefront sx={{ fontSize: 13 }} />}
                  label={`${varStats.total} variasi`}
                  size="small"
                  sx={{
                    fontSize: 10,
                    height: 26,
                    fontWeight: 700,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(6px)',
                    color: '#6366f1',
                    border: '1px solid',
                    borderColor: alpha('#6366f1', 0.25),
                    '& .MuiChip-icon': { 
                      color: '#6366f1',
                      ml: 0.5,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(true);
                  }}
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(6px)',
                    color: '#6366f1',
                    border: '1px solid',
                    borderColor: alpha('#6366f1', 0.25),
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <Info sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            ) : (
              /* Spacer agar stok tetap di kanan */
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(true);
                  }}
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(6px)',
                    color: '#6366f1',
                    border: '1px solid',
                    borderColor: alpha('#6366f1', 0.25),
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <Info sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            )}

            {/* KANAN: Badge Stok */}
            <Chip
              icon={<Inventory2 sx={{ fontSize: 13 }} />}
              label={`${totalStock}`}
              size="small"
              sx={{
                fontSize: 10,
                height: 26,
                fontWeight: 700,
                bgcolor: totalStock > 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                backdropFilter: 'blur(6px)',
                color: '#fff',
                border: 'none',
                '& .MuiChip-icon': { 
                  color: '#fff',
                  ml: 0.5,
                },
              }}
            />
          </Box>

          {/* Bottom: Price Overlay (untuk produk variasi) */}
          {isVariation && prices.length > 0 && (
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              px: 1.5,
              py: 0.75,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
              zIndex: 1,
            }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', fontSize: 13 }}>
                {minPrice === maxPrice ? idr(minPrice) : `${idr(minPrice)} - ${idr(maxPrice)}`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Content Section */}
        <CardContent sx={{
          p: 1.5,
          pb: '14px !important',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}>
          {/* Title */}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{ fontSize: 13, lineHeight: 1.3 }}
          >
            {product.title}
          </Typography>

          {/* Seller Name [NEW] */}
          {product.seller_name && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Storefront sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10, fontWeight: 500 }}>
                {product.seller_name}
              </Typography>
            </Stack>
          )}

          {/* Price / Variation Info */}
          {isVariation ? (
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
              {varStats.available > 0 && (
                <Chip
                  label={`${varStats.available} baru`}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{
                    fontSize: 10,
                    height: 20,
                    fontWeight: 600,
                    borderColor: alpha('#3b82f6', 0.4),
                    color: '#3b82f6',
                  }}
                />
              )}
              
              {varStats.cloned > 0 && (
                <Chip
                  label={`${varStats.cloned} diambil`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{
                    fontSize: 10,
                    height: 20,
                    fontWeight: 600,
                    borderColor: alpha('#10b981', 0.4),
                    color: '#10b981',
                  }}
                />
              )}

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverAnchor(e.currentTarget);
                }}
                sx={{
                  width: 20,
                  height: 20,
                  ml: 'auto',
                  color: 'text.disabled',
                  '&:hover': { color: 'primary.main', bgcolor: alpha('#6366f1', 0.08) },
                  transition: 'all 0.15s',
                }}
              >
                <Visibility sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>
          ) : (
            <Typography variant="body2" fontWeight={700} sx={{ color: '#6366f1', fontSize: 14 }}>
              {idr(product.price)}
            </Typography>
          )}
          
          <Box sx={{ flex: 1 }} />
          
          {/* Action Buttons */}
          <Stack direction="row" spacing={0.75}>
            <Tooltip title="Tanya seller" arrow>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  onChat?.(product);
                }}
                startIcon={<Chat2 sx={{ fontSize: 14 }} />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: 11,
                  py: 0.5,
                  fontWeight: 600,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  flex: disabled ? 0 : undefined,
                  minWidth: disabled ? 0 : 'auto',
                  display: disabled ? 'none' : 'flex',
                  '&:hover': {
                    borderColor: 'primary.light',
                    color: 'primary.main',
                    bgcolor: alpha('#6366f1', 0.04),
                  },
                }}
              >
                Chat
              </Button>
            </Tooltip>
            <Button
              size="small"
              fullWidth
              {...getButtonProps()}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onAction?.(product);
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: 11,
                py: 0.5,
                fontWeight: 600,
                letterSpacing: '0.02em',
                ...(disabled && {
                  bgcolor: alpha('#10b981', 0.08),
                  borderColor: alpha('#10b981', 0.3),
                  color: '#10b981',
                }),
              }}
            >
              {getButtonText()}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Popover */}
      <VariationPopover
        anchorEl={popoverAnchor}
        open={Boolean(popoverAnchor)}
        onClose={() => setPopoverAnchor(null)}
        variations={variations}
      />

      {/* Product Preview Dialog [NEW] */}
      <ProductPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        product={product}
      />
    </>
  );
}