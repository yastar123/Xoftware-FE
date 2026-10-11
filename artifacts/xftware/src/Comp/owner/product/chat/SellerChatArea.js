import React, { useMemo } from 'react';
import {
  Box, Typography, Stack, IconButton, Chip, alpha, Divider, Button
} from '@mui/material';
import {
  Storefront, ArrowBack, Info, Close, Send
} from '@mui/icons-material';
import ChatBubble, { DateSeparator, LoadMoreButton } from './ChatBubble';
import ChatInput from './ChatInput';
import ChatImagePreview from './ChatImagePreview';
import { idr } from '@/lib/helper';

export default function SellerChatArea({ chat }) {
  const { activeSession, messages, messagesLoading, sending, uploading, hasMore, loadingMore, replyTo, previewImage,
    messagesEndRef, messagesContainerRef, loadMoreMessages, sendMessage, uploadImage, setReplyTo, setPreviewImage, closeSession } = chat;

  // For seller: to_seller = incoming (left), to_reseller = outgoing (right)
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    for (const msg of messages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msgDate, rawDate: msg.createdAt });
      }
      groups.push({ type: 'message', message: msg });
    }
    return groups;
  }, [messages]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleUpload = async (file, caption) => {
    const url = await uploadImage(file);
    if (url) await sendMessage(caption || null, 'image', url);
  };

  if (!activeSession) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton size="small" onClick={closeSession} sx={{ display: { md: 'none' } }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: alpha('#6366f1', 0.1), display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Storefront sx={{ fontSize: 18, color: '#6366f1' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: 14 }}>
                  {activeSession.peerName || (activeSession.role === 'seller' ? (activeSession.reseller?.name || 'Reseller') : (activeSession.seller?.name || 'Seller'))}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {activeSession.role === 'seller'
                    ? (activeSession.peerUsername ? `@${activeSession.peerUsername}` : 'Reseller')
                    : (activeSession.peerLabel || 'Seller')}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>

        {/* Product Context */}
        {activeSession.tempProductContext ? (
          <Box sx={{
            mt: 1,
            p: 1.75,
            borderRadius: 2.5,
            bgcolor: alpha('#6366f1', 0.05),
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.15),
            position: 'relative',
          }}>
            {/* Close Button */}
            <IconButton
              size="small"
              onClick={() => {
                chat.openSession({ ...activeSession, tempProductContext: null });
              }}
              sx={{ position: 'absolute', top: 6, right: 6, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>

            <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9 }}>
              Info Produk Yang Ditanyakan
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: 12, color: 'text.primary', mb: 0.25 }}>
                  {activeSession.tempProductContext.title}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, py: 0.15, borderRadius: 0.5, color: 'text.secondary', fontSize: 9 }}>
                  Kode: {activeSession.tempProductContext.code}
                </Typography>

                {!activeSession.tempProductContext.is_variation ? (
                  <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mt: 0.5, fontSize: 11 }}>
                    Harga: {idr(activeSession.tempProductContext.price)}
                  </Typography>
                ) : activeSession.tempProductContext.variations?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5, fontSize: 9 }}>
                      Variasi:
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {activeSession.tempProductContext.variations.map((v, i) => (
                        <Chip
                          key={i}
                          label={`${v.title} (${idr(v.price)})`}
                          size="small"
                          sx={{
                            fontSize: 8,
                            height: 16,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<Send sx={{ fontSize: 10 }} />}
                onClick={() => {
                  const ctx = activeSession.tempProductContext;
                  let formattedMsg = `Halo, saya ingin bertanya tentang produk ini:\n\n` +
                    `📦 *Nama*: ${ctx.title}\n` +
                    `🏷️ *Kode*: ${ctx.code}\n`;

                  if (ctx.is_variation && ctx.variations?.length > 0) {
                    formattedMsg += `\n*Pilihan Variasi*:\n` +
                      ctx.variations.map(v => `• ${v.title} - ${idr(v.price)} (${v.code})`).join('\n');
                  } else {
                    formattedMsg += `💵 *Harga*: ${idr(ctx.price)}\n`;
                  }

                  sendMessage(formattedMsg);
                  chat.openSession({ ...activeSession, tempProductContext: null });
                }}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontSize: 10,
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                Kirim Info Produk
              </Button>
            </Stack>
          </Box>
        ) : activeSession.product && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.04), border: '1px solid', borderColor: alpha('#6366f1', 0.1) }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {activeSession.product.thumbnail && (
                <Box component="img" src={activeSession.product.thumbnail?.startsWith('http') ? activeSession.product.thumbnail : `https://cdn.xoftware.id/f/${activeSession.product.thumbnail}`} alt=""
                  sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: 12 }}>{activeSession.product.title}</Typography>
                {activeSession.peerName && (
                  <Typography variant="caption" color="primary.main" fontWeight={500} sx={{ fontSize: 9, display: 'block' }}>
                    {activeSession.role === 'seller' ? 'Dari' : 'Ke'} {activeSession.peerName}
                  </Typography>
                )}
                {activeSession.product.code && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontFamily: 'monospace' }}>{activeSession.product.code}</Typography>
                )}
              </Box>
              <Chip label="Produk" size="small" sx={{ fontSize: 9, height: 18, ml: 'auto', flexShrink: 0 }} />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Messages */}
      <Box ref={messagesContainerRef} sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 } }}>
        {messagesLoading ? (
          <Stack spacing={2} p={2}>{[...Array(5)].map((_, i) => <Box key={i} sx={{ height: 48, borderRadius: 2, bgcolor: 'grey.100' }} />)}</Stack>
        ) : messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Belum ada pesan</Typography>
            <Typography variant="caption" color="text.disabled">Kirim pesan untuk memulai percakapan</Typography>
          </Box>
        ) : (
          <>
            {hasMore && <LoadMoreButton onClick={loadMoreMessages} loading={loadingMore} />}
            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') return <DateSeparator key={`d-${idx}`} date={formatDate(item.rawDate)} />;
              // Direction depends on session role
              const role = activeSession?.role || 'seller';
              let displayDirection;
              if (role === 'seller') {
                // Seller view: to_seller = from reseller = LEFT, to_reseller = from seller = RIGHT
                displayDirection = item.message.direction === 'to_seller' ? 'incoming' : 'outgoing';
              } else {
                // Reseller view: to_seller = from reseller (me) = RIGHT, to_reseller = from seller = LEFT
                displayDirection = item.message.direction === 'to_seller' ? 'outgoing' : 'incoming';
              }
              const modifiedMsg = { ...item.message, direction: displayDirection };
              return <ChatBubble key={item.message.id} message={modifiedMsg} messages={messages} onReply={setReplyTo} onImageClick={setPreviewImage} />;
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input */}
      <ChatInput onSend={sendMessage} onUpload={handleUpload} uploading={uploading} sending={sending} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} disabled={false} />

      {/* Image Preview */}
      <ChatImagePreview open={!!previewImage} image={previewImage} onClose={() => setPreviewImage(null)} />
    </Box>
  );
}