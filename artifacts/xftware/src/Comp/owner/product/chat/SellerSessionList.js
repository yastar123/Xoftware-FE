import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Stack, TextField, InputAdornment,
  Skeleton, Divider, Chip, alpha, Tabs, Tab
} from '@mui/material';
import {
  Search, Storefront, ShoppingCart
} from '@mui/icons-material';
import { useDebounce } from '@/Hook/debouncingState';
import { idr } from '@/lib/helper';

export default function SellerSessionList({ chat, onSelect }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'seller' | 'reseller'
  const debounceSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let list = chat.sessions;
    
    // Filter by tab
    if (tab !== 'all') {
      list = list.filter(s => s.role === tab);
    }
    
    if (!debounceSearch) return list;
    const q = debounceSearch.toLowerCase();
    return list.filter(s =>
      s.peerName?.toLowerCase().includes(q) ||
      s.reseller?.name?.toLowerCase().includes(q) ||
      s.seller?.name?.toLowerCase().includes(q) ||
      s.product?.title?.toLowerCase().includes(q) ||
      s.lastMessage?.content?.toLowerCase().includes(q)
    );
  }, [chat.sessions, debounceSearch, tab]);

  const sellerCount = useMemo(() => chat.sessions.filter(s => s.role === 'seller').length, [chat.sessions]);
  const resellerCount = useMemo(() => chat.sessions.filter(s => s.role === 'reseller').length, [chat.sessions]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (chat.sessionsLoading) {
    return (
      <Box sx={{ p: 1.5 }}>
        {[...Array(8)].map((_, i) => (
          <Stack key={i} direction="row" spacing={1.5} sx={{ p: 1.5, mb: 0.5 }}>
            <Skeleton variant="circular" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="80%" height={13} sx={{ mt: 0.5 }} />
            </Box>
          </Stack>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <TextField
          placeholder="Cari percakapan..."
          size="small"
          fullWidth
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              fontSize: 13,
              bgcolor: 'grey.50',
              '& fieldset': { border: 'none' },
              '&:hover fieldset': { border: 'none' },
              '&.Mui-focused fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          px: 1,
          '& .MuiTab-root': { minHeight: 36, fontSize: 11, fontWeight: 600, textTransform: 'none', py: 0 },
          '& .MuiTabs-indicator': { height: 2 },
        }}
      >
        <Tab value="all" label={`Semua (${chat.sessions.length})`} />
        <Tab value="seller" label={`Masuk (${sellerCount})`} />
        <Tab value="reseller" label={`Keluar (${resellerCount})`} />
      </Tabs>

      <Divider />

      {/* Session List */}
      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 } }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Storefront sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
              {chat.sessions.length === 0 ? 'Belum ada percakapan' : 'Tidak ditemukan'}
            </Typography>
          </Box>
        ) : (
          filtered.map((session) => {
            const isActive = chat.activeSession?.sessionId === session.sessionId;
            const isSeller = session.role === 'seller';
            const accentColor = isSeller ? '#6366f1' : '#10b981';
            
            // Determine "isFromSelf" for last message
            const lastMsgIsFromSelf = session.lastMessage?.isFromSelf 
              ?? session.lastMessage?.isFromSeller 
              ?? false;
            
            return (
              <Box
                key={session.sessionId}
                onClick={() => onSelect(session)}
                sx={{
                  display: 'flex',
                  gap: 1.25,
                  p: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  bgcolor: isActive ? alpha(accentColor, 0.06) : 'transparent',
                  borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                  '&:hover': { bgcolor: isActive ? alpha(accentColor, 0.06) : alpha('#000', 0.02) },
                }}
              >
                {/* Avatar */}
                <Box
                  sx={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    bgcolor: isActive ? alpha(accentColor, 0.12) : 'grey.100',
                    display: 'grid', placeItems: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {session.product?.thumbnail ? (
                    <Box
                      component="img"
                      src={session.product.thumbnail?.startsWith('http') ? session.product.thumbnail : `https://cdn.xoftware.id/f/${session.product.thumbnail}`}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Storefront sx={{ fontSize: 22, color: isActive ? accentColor : 'grey.400' }} />
                  )}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: 13 }}>
                        {session.peerName || (isSeller ? 'Reseller' : 'Seller')}
                      </Typography>
                      <Chip
                        label={isSeller ? '↓ Masuk' : '↑ Keluar'}
                        size="small"
                        sx={{
                          fontSize: 8, height: 16, fontWeight: 700,
                          bgcolor: alpha(accentColor, 0.1),
                          color: accentColor,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, flexShrink: 0, ml: 1 }}>
                      {formatTime(session.lastMessageAt)}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: 12, display: 'block', mt: 0.25 }}
                  >
                    {session.product?.title || 'Produk tidak ditemukan'}
                  </Typography>

                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.25 }}>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        fontSize: 11,
                        flex: 1,
                        color: lastMsgIsFromSelf ? 'text.disabled' : 'text.primary',
                        fontStyle: lastMsgIsFromSelf ? 'italic' : 'normal',
                      }}
                    >
                      {lastMsgIsFromSelf && session.lastMessage?.content !== 'SESSION_INIT' && 'Anda: '}
                      {session.lastMessage?.content === 'SESSION_INIT' ? 'Belum ada pesan' : (session.lastMessage?.content || '-')}
                    </Typography>
                    {session.unreadCount > 0 && (
                      <Chip
                        label={session.unreadCount > 99 ? '99+' : session.unreadCount}
                        size="small"
                        sx={{
                          fontSize: 10, height: 20, minWidth: 20,
                          fontWeight: 700, flexShrink: 0, ml: 1,
                          bgcolor: accentColor, color: 'white',
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}