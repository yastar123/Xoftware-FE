import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, IconButton, Skeleton, Chip,
  Badge, Tooltip, Divider, useMediaQuery, useTheme, Button,
  alpha
} from '@mui/material';
import {
  ArrowBack, Settings, Telegram, Search, ChatBubbleOutline
} from '@mui/icons-material';
import SellerSessionList from './SellerSessionList';
import SellerChatArea from './SellerChatArea';
import SellerChatSettings from './SellerChatSettings';
import { useSellerChat } from '@/Hook/useSellerChat';
import { idr } from '@/lib/helper';

export default function SellerChatPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat' | 'settings'

  const chat = useSellerChat();
  
  // Handle initialization from redirect
  useEffect(() => {
    const initStockId = localStorage.getItem('initResellerChatStockId');
    if (initStockId) {
      const isCloned = localStorage.getItem('initResellerChatIsCloned') === 'true';
      let productData = null;
      try {
        const rawData = localStorage.getItem('initResellerChatProductData');
        if (rawData) productData = JSON.parse(rawData);
      } catch (e) {}
      
      localStorage.removeItem('initResellerChatStockId');
      localStorage.removeItem('initResellerChatIsCloned');
      localStorage.removeItem('initResellerChatProductData');
      
      // Delay slightly to ensure sessions are fetched before overriding
      setTimeout(() => {
        chat.initResellerChat(initStockId, isCloned, productData);
      }, 500);
    }
  }, [chat]);

  const handleBack = () => {
    if (showSettings) {
      setShowSettings(false);
    } else if (mobileView === 'chat') {
      setMobileView('list');
      chat.closeSession();
    } else {
      setMobileView('settings');
      setShowSettings(true);
    }
  };

  // Mobile: show list or chat
  const showList = !isMobile || mobileView === 'list';
  const showChat = !isMobile || mobileView === 'chat';
  const showSettingsPanel = showSettings || (!isMobile && showSettings);

  if (showSettings && isMobile) {
    return (
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => setShowSettings(false)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700}>Pengaturan Chat</Typography>
        </Stack>
        <SellerChatSettings />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2.5, py: 1.5,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'white', flexShrink: 0,
        }}
      >
        {isMobile && (
          <IconButton size="small" onClick={handleBack}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
        )}
        <Badge badgeContent={chat.totalUnread} color="error" max={99}>
          <ChatBubbleOutline sx={{ fontSize: 24, color: '#6366f1' }} />
        </Badge>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: 16 }}>
            Chat Reseller
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {chat.sessions.length} percakapan
          </Typography>
        </Box>
        <Tooltip title="Notifikasi Telegram (Opsional)">
          <IconButton
            size="small"
            onClick={() => isMobile ? setMobileView('settings') : setShowSettings(!showSettings)}
            sx={{
              color: showSettings ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: alpha('#6366f1', 0.08) },
            }}
          >
            <Settings sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Body */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel: Sessions */}
        {showList && (
          <Box
            sx={{
              width: { xs: '100%', md: showSettingsPanel ? 0 : 340 },
              borderRight: { md: '1px solid' },
              borderColor: { md: 'divider' },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: 'white',
            }}
          >
            <SellerSessionList
              chat={chat}
              onSelect={(session) => {
                chat.openSession(session);
                if (isMobile) setMobileView('chat');
              }}
            />
          </Box>
        )}

        {/* Right Panel: Settings or Chat */}
        {showChat && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: '#fafafa',
            }}
          >
            {showSettingsPanel ? (
              <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
                <SellerChatSettings />
              </Box>
            ) : chat.activeSession ? (
              <SellerChatArea chat={chat} />
            ) : (
              /* Empty State */
              <Box
                sx={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 80, height: 80, borderRadius: '50%',
                    bgcolor: 'grey.50', display: 'grid', placeItems: 'center', mb: 2,
                  }}
                >
                  <ChatBubbleOutline sx={{ fontSize: 36, color: 'grey.300' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                  Pilih percakapan
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, textAlign: 'center', maxWidth: 300 }}>
                  Pilih percakapan dari daftar di sebelah kiri untuk melihat dan membalas chat reseller
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}