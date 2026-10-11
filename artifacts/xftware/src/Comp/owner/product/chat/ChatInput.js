import React, { useState, useRef } from 'react';
import {
  Box, TextField, IconButton, Stack, Chip, alpha, Tooltip, CircularProgress,
  Typography
} from '@mui/material';
import {
  Send, Image, Close, AttachFile
} from '@mui/icons-material';
import { fileToBase64 } from '@/lib/helper';

const QUICK_REPLIES = [
  'Stok apa saja yang tersedia?',
  'Minimal order berapa?',
  'Apakah ada garansi?',
  'Bisa request akun khusus?',
  'Berapa lama proses delivery?',
];

export default function ChatInput({ 
  onSend, 
  onUpload, 
  uploading, 
  sending, 
  replyTo, 
  onCancelReply,
  disabled 
}) {
  const [text, setText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBase64, setPreviewBase64] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  
  const handleSend = () => {
    if (previewFile && previewBase64) {
      // Send image
      onUpload?.(previewFile, text || null);
      setPreviewFile(null);
      setPreviewBase64(null);
      setText('');
      setShowQuickReplies(false);
    } else if (text.trim()) {
      onSend?.(text.trim());
      setText('');
      setShowQuickReplies(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !uploading && !disabled) handleSend();
    }
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type?.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    
    const base64 = await fileToBase64(file);
    setPreviewFile(file);
    setPreviewBase64(base64);
    e.target.value = '';
  };
  
  const handleQuickReply = (msg) => {
    setText(msg);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };
  
  const canSend = (text.trim() || previewFile) && !sending && !uploading && !disabled;

  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        pt: replyTo ? 1 : 0.5,
        pb: 1.5,
      }}
    >
      {/* Reply Preview */}
      {replyTo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.light',
            bgcolor: alpha('#6366f1', 0.04),
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: 'primary.main' }}>
              Membalas pesan Seller
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: 11,
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {replyTo.message_type === 'image' 
                ? '📎 Gambar' 
                : (replyTo.content || '').substring(0, 80)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
      
      {/* Image Preview */}
      {previewBase64 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            p: 1,
            borderRadius: 2,
            bgcolor: alpha('#000', 0.03),
          }}
        >
          <Box
            component="img"
            src={`data:image/*;base64,${previewBase64}`}
            alt="preview"
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              objectFit: 'cover',
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontSize: 12 }}>
              {previewFile?.name || 'Gambar'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {(previewFile?.size / 1024).toFixed(1)} KB
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { setPreviewFile(null); setPreviewBase64(null); }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}
      
      {/* Quick Replies */}
      {showQuickReplies && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            mb: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 0 },
          }}
        >
          {QUICK_REPLIES.map((msg) => (
            <Chip
              key={msg}
              label={msg}
              size="small"
              variant="outlined"
              onClick={() => handleQuickReply(msg)}
              sx={{
                fontSize: 11,
                height: 28,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha('#6366f1', 0.08), borderColor: 'primary.light' },
              }}
            />
          ))}
        </Stack>
      )}
      
      {/* Input Area */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="Lampirkan gambar" arrow>
            <IconButton
              size="small"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || disabled}
              sx={{ color: 'text.secondary' }}
            >
              {uploading ? <CircularProgress size={18} /> : <Image sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Pesan cepat" arrow>
            <IconButton
              size="small"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              disabled={disabled}
              sx={{
                color: showQuickReplies ? 'primary.main' : 'text.secondary',
              }}
            >
              <AttachFile sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileSelect}
        />
        
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={disabled ? 'Seller offline...' : 'Ketik pesan...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: 14,
              lineHeight: 1.5,
              py: 0.5,
            },
          }}
          InputProps={{
            endAdornment: canSend ? (
              <IconButton
                size="small"
                onClick={handleSend}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': { bgcolor: 'primary.dark' },
                  transition: 'all 0.15s',
                }}
              >
                <Send sx={{ fontSize: 16 }} />
              </IconButton>
            ) : null,
          }}
        />
      </Stack>
    </Box>
  );
}