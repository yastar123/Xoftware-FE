import React, { useState } from 'react';
import {
  Box, Typography, Stack, IconButton, Tooltip, alpha, Chip
} from '@mui/material';
import {
  Reply, Image as ImageIcon, Check, CheckCircle,
  ArrowDownward
} from '@mui/icons-material';
import { idr } from '@/lib/helper';

function ReplyPreview({ message, messages }) {
  if (!message?.reply_to_chat_id) return null;
  const repliedMsg = messages.find(m => m.id === message.reply_to_chat_id);
  if (!repliedMsg) return null;
  
  const isOwnReply = repliedMsg.direction === 'to_seller' || repliedMsg.direction === 'outgoing';
  
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        mb: 0.75,
        borderLeft: `3px solid ${isOwnReply ? '#6366f1' : '#9ca3af'}`,
        bgcolor: alpha(isOwnReply ? '#6366f1' : '#000', 0.04),
        borderRadius: '0 6px 6px 0',
        maxWidth: '85%',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color: isOwnReply ? 'primary.main' : 'text.secondary',
          display: 'block',
          mb: 0.25,
        }}
      >
        {isOwnReply ? 'Anda' : 'Seller'}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {repliedMsg.message_type === 'image' 
          ? '📎 Mengirim gambar' 
          : (repliedMsg.content || '').substring(0, 100)}
      </Typography>
    </Box>
  );
}

export default function ChatBubble({ message, messages, onReply, onImageClick }) {
  if (message?.message_type === 'system' || message?.content === 'SESSION_INIT') {
    return null;
  }
  const isOwn = message.direction === 'to_seller' || message.direction === 'outgoing';
  const isImage = message.message_type === 'image';
  const isTemp = message._isTemp;
  
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        mb: 1.5,
        px: 1.5,
      }}
    >
      {/* Reply Preview */}
      <ReplyPreview message={message} messages={messages} />
      
      {/* Bubble */}
      <Box
        sx={{
          maxWidth: { xs: '85%', sm: '70%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Main Bubble Content */}
        <Box
          sx={{
            px: isImage ? 0.5 : 2,
            py: isImage ? 0.5 : 1.25,
            borderRadius: isOwn
              ? '16px 4px 16px 16px'
              : '4px 16px 16px 16px',
            bgcolor: isOwn ? '#6366f1' : '#f3f4f6',
            color: isOwn ? '#fff' : '#1f2937',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            opacity: isTemp ? 0.7 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          {/* Text Content */}
          {!isImage && message.content && (
            <Typography
              variant="body2"
              sx={{
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </Typography>
          )}
          
          {/* Image Content */}
          {isImage && message.file_url && (
            <Box
              onClick={() => onImageClick?.(message.file_url)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                overflow: 'hidden',
                maxWidth: 280,
                '&:hover': { opacity: 0.9 },
                transition: 'opacity 0.2s',
              }}
            >
              <Box
                component="img"
                src={message.file_url}
                alt=""
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 300,
                  objectFit: 'contain',
                  display: 'block',
                  bgcolor: 'grey.100',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                      <Typography variant="caption" color="grey.500">Gagal memuat gambar</Typography>
                    </Box>
                  `;
                }}
              />
              {message.content && (
                <Box sx={{ px: 1.5, py: 1, bgcolor: isOwn ? alpha('#000', 0.1) : 'white' }}>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 12, color: isOwn ? 'rgba(255,255,255,0.9)' : 'text.primary' }}
                  >
                    {message.content}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
        
        {/* Meta: Time + Status + Actions */}
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ mt: 0.25, px: 0.5 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: 10,
              color: 'text.disabled',
            }}
          >
            {formatTime(message.createdAt)}
          </Typography>
          
          {/* Read Status */}
          {isOwn && !isTemp && (
            isOwn ? (
              message.is_read ? (
                <CheckCircle sx={{ fontSize: 12, color: '#6366f1' }} />
              ) : (
                <Check sx={{ fontSize: 12, color: 'text.disabled' }} />
              )
            ) : null
          )}
          
          {/* Sending indicator */}
          {isTemp && (
            <Typography
              variant="caption"
              sx={{ fontSize: 10, color: 'text.disabled', fontStyle: 'italic' }}
            >
              Mengirim...
            </Typography>
          )}
          
          {/* Reply Button */}
          {!isTemp && (
            <Tooltip title="Balas" arrow>
              <IconButton
                size="small"
                onClick={() => onReply?.(message)}
                sx={{
                  width: 22,
                  height: 22,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                  '.MuiBox-root:hover > &': { opacity: 1 },
                  '&:hover': { opacity: 1, bgcolor: alpha('#000', 0.04) },
                }}
              >
                <Reply sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export function DateSeparator({ date }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 1.5,
        px: 2,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 0.5,
          borderRadius: 10,
          bgcolor: alpha('#000', 0.05),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          {date}
        </Typography>
      </Box>
    </Box>
  );
}

export function LoadMoreButton({ onClick, loading }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
      {loading ? (
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
          Memuat pesan lama...
        </Typography>
      ) : (
        <Chip
          icon={<ArrowDownward sx={{ fontSize: 14 }} />}
          label="Muat lebih banyak"
          size="small"
          variant="outlined"
          onClick={onClick}
          sx={{
            fontSize: 11,
            height: 26,
            cursor: 'pointer',
            '&:hover': { bgcolor: alpha('#000', 0.04) },
          }}
        />
      )}
    </Box>
  );
}