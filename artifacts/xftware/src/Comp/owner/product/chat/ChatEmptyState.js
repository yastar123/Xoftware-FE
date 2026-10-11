import React from 'react';
import {
  Box, Typography, Stack, Divider
} from '@mui/material';
import {
  ChatBubbleOutline, Storefront
} from '@mui/icons-material';
import { idr } from '@/lib/helper';

export default function ChatEmptyState({ productInfo, sellerInfo }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'grey.50',
          display: 'grid',
          placeItems: 'center',
          mb: 2,
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 36, color: 'grey.300' }} />
      </Box>
      
      <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
        Mulai percakapan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 280 }}>
        Tanyakan tentang produk kepada seller sebelum mengambil
      </Typography>
      
      {productInfo && (
        <Box
          sx={{
            width: '100%',
            maxWidth: 320,
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {productInfo.thumbnail && (
              <Box
                component="img"
                src={productInfo.thumbnail?.startsWith('http') ? productInfo.thumbnail : `https://cdn.xoftware.id/f/${productInfo.thumbnail}`}
                alt=""
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <Box sx={{ textAlign: 'left', minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {productInfo.title}
              </Typography>
              {productInfo.price > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Mulai {idr(productInfo.price)}
                </Typography>
              )}
              {sellerInfo && (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Storefront sx={{ fontSize: 12 }} />
                  {sellerInfo.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
}