import React, { useEffect, useRef, useMemo } from 'react';
import {
  Box, Drawer, Typography, Stack, IconButton, Divider,
  Button, alpha, Chip, Skeleton, useMediaQuery, useTheme,
  AppBar, Toolbar
} from '@mui/material';
import {
  Close, Storefront, Send, ArrowBack,
  CheckCircle, Info
} from '@mui/icons-material';
import ChatBubble, { DateSeparator, LoadMoreButton } from './ChatBubble';
import ChatInput from './ChatInput';
import ChatEmptyState from './ChatEmptyState';
import ChatImagePreview from './ChatImagePreview';
import { idr } from '@/lib/helper';

const DRAWER_WIDTH = 400;

export default function ResellerChatDrawer({ chat }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    isOpen, initializing, sending, uploading,
    messages, hasMore, loadingMore,
    sellerInfo, productInfo, isAlreadyCloned, clonedProductId, providerStockId,
    replyTo, previewImage,
    messagesEndRef, messagesContainerRef,
    closeChat, sendMessage, loadMoreMessages, uploadImage,
    setReplyTo, setPreviewImage, scrollToBottom,
  } = chat;
  
  // Group messages by date
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

  // Auto scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);
  
  // Handle image send
  const handleUpload = async (file, caption) => {
    const url = await uploadImage(file);
    if (url) {
      await sendMessage(caption || null, 'image', url);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#fafafa',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {isMobile && (
            <IconButton size="small" onClick={closeChat}>
              <ArrowBack />
            </IconButton>
          )}
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: alpha('#6366f1', 0.1),
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Storefront sx={{ fontSize: 18, color: '#6366f1' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: 14 }}>
                  {sellerInfo?.name || 'Seller'}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', display: 'block' }}>
                  {sellerInfo?.username ? `@${sellerInfo.username}` : 'Supplier'} • Online
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          <IconButton size="small" onClick={closeChat}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
        
        {/* Product Context */}
        {productInfo && (
          <Box
            sx={{
              mt: 1.25,
              p: 1.25,
              borderRadius: 2.5,
              bgcolor: alpha('#6366f1', 0.04),
              border: '1px solid',
              borderColor: alpha('#6366f1', 0.1),
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              {productInfo.thumbnail && (
                <Box
                  component="img"
                  src={productInfo.thumbnail?.startsWith('http') ? productInfo.thumbnail : `https://cdn.xoftware.id/f/${productInfo.thumbnail}`}
                  alt=""
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: 13 }}>
                  {productInfo.title}
                </Typography>
                {sellerInfo?.name && (
                  <Typography variant="caption" color="primary.main" fontWeight={500} sx={{ fontSize: 10, display: 'block' }}>
                    Oleh {sellerInfo.name}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.25 }}>
                  {productInfo.price > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                      Mulai {idr(productInfo.price)}
                    </Typography>
                  )}
                  {isAlreadyCloned && (
                    <Chip
                      label="Sudah Diambil"
                      size="small"
                      color="success"
                      sx={{ fontSize: 9, height: 18, fontWeight: 600 }}
                      icon={<CheckCircle sx={{ fontSize: 10 }} />}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
      
      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
        }}
      >
        {initializing ? (
          <Stack spacing={2} p={2}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : messages.length === 0 ? (
          <ChatEmptyState productInfo={productInfo} sellerInfo={sellerInfo} />
        ) : (
          <>
            {/* Load More */}
            {hasMore && (
              <LoadMoreButton onClick={loadMoreMessages} loading={loadingMore} />
            )}
            
            {/* Messages */}
            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSeparator key={`date-${idx}`} date={formatDate(item.rawDate)} />;
              }
              return (
                <ChatBubble
                  key={item.message.id}
                  message={item.message}
                  messages={messages}
                  onReply={setReplyTo}
                  onImageClick={setPreviewImage}
                />
              );
            })}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      {/* Input Area */}
      <ChatInput
        onSend={sendMessage}
        onUpload={handleUpload}
        uploading={uploading}
        sending={sending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={initializing}
      />
    </Box>
  );

  // Mobile: Full screen
  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: theme.zIndex.drawer + 10,
          bgcolor: '#fafafa',
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        {drawerContent}
      </Box>
    );
  }

  // Desktop: Drawer
  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={closeChat}
        PaperProps={{
          sx: {
            width: DRAWER_WIDTH,
            maxWidth: '100vw',
            p: 0,
            m: 0,
            borderRadius: 0,
          }
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          }
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Image Preview */}
      <ChatImagePreview
        open={!!previewImage}
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}