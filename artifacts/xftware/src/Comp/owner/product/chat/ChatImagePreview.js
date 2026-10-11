import React from 'react';
import {
  Dialog, IconButton, Box
} from '@mui/material';
import { Close } from '@mui/icons-material';

export default function ChatImagePreview({ open, image, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.95)',
          borderRadius: 0,
          m: 0,
          width: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 9999,
          bgcolor: 'rgba(255,255,255,0.1)',
          color: 'white',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
        }}
      >
        <Close />
      </IconButton>
      <Box
        component="img"
        src={image}
        alt=""
        sx={{
          maxWidth: '95vw',
          maxHeight: '95vh',
          objectFit: 'contain',
          borderRadius: 1,
        }}
        onClick={onClose}
      />
    </Dialog>
  );
}