import React from 'react';
import {
  Box, Container, Stack, Typography, List, ListItemButton, ListItemIcon, 
  ListItemText, Divider, IconButton, useTheme, useMediaQuery, alpha,
  Drawer, Breadcrumbs, Link as MuiLink
} from '@mui/material';
import {
  Menu as MenuIcon, Home, Rocket, Key, Gavel, 
  ChevronRight, ArrowBack, Search, Book, Brightness4, Brightness7, Hub, Inventory2
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import FooterPage from '@/Comp/footer';
import { useThemeToggle } from "@/Context/ThemeContext";

const SIDEBAR_WIDTH = 280;

export default function DocsLayout({ children, title = "Dokumentasi", activeId }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { toggleColorMode } = useThemeToggle?.() || { toggleColorMode: () => {} };

  const menuItems = [
    { id: 'index', label: 'Overview', icon: <Book />, href: '/docs' },
    { id: 'api-product', label: 'API Produk', icon: <Inventory2 />, href: '/docs/api-product' },
    { id: 'api-reseller', label: 'API Reseller', icon: <Hub />, href: '/docs/api-reseller' },
    { id: 'ketentuan', label: 'Ketentuan API', icon: <Gavel />, href: '/docs/ketentuan' },
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const SidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          onClick={() => router.push('/')}
          sx={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <Box 
            component="img"
            src="/icon.png"
            alt="Xoftware Logo"
            sx={{ 
              width: 34,
              height: 34,
              borderRadius: 1.5, 
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            Docs
          </Typography>
        </Stack>
        <IconButton onClick={toggleColorMode} size="small" color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ opacity: 0.6 }} />

      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          Menu Utama
        </Typography>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => router.push(item.href)}
            selected={activeId === item.id}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
              },
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, transition: '0.2s' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ variant: 'body2', fontWeight: activeId === item.id ? 700 : 500 }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1)
        }}>
          <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 0.5, display: 'block' }}>
            Butuh bantuan?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tim support kami siap membantu integrasi Anda 24/7.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Head>
        <title>{`${title} | Xoftware Official Docs`}</title>
      </Head>

      {/* Mobile AppBar */}
      {!isDesktop && (
        <Box sx={{ 
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
          bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(12px)',
          borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <IconButton onClick={handleDrawerToggle} size="small">
            <MenuIcon />
          </IconButton>
          <Stack direction="row" alignItems="center" spacing={1} onClick={() => router.push('/')} sx={{ cursor: 'pointer' }}>
            <Box
              component="img"
              src="/icon.png"
              alt="Xoftware Logo"
              sx={{ width: 24, height: 24, borderRadius: 0.8, objectFit: 'contain' }}
            />
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
              Xoftware Docs
            </Typography>
          </Stack>
          <Box sx={{ width: 32 }} />
        </Box>
      )}

      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: isDesktop ? 'none' : '20px 0 40px rgba(0,0,0,0.05)'
            },
          }}
        >
          {SidebarContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg" sx={{ 
          pt: { xs: 10, md: 6 }, 
          pb: 12, 
          flexGrow: 1,
          px: { xs: 2, md: 6 },
          minWidth: 0,
          maxWidth: '100vw'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Breadcrumbs */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <IconButton 
                size="small" 
                onClick={() => router.push('/')}
                sx={{ bgcolor: 'background.paper', boxShadow: (t) => t.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}
              >
                <ArrowBack sx={{ fontSize: 16 }} />
              </IconButton>
              <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 14 }} />}>
                <MuiLink underline="hover" color="inherit" href="/" sx={{ fontSize: 13, fontWeight: 500 }}>
                  Home
                </MuiLink>
                <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>
                  Docs
                </Typography>
              </Breadcrumbs>
            </Stack>

            {children}
          </motion.div>
        </Container>
        
        <FooterPage />
      </Box>
    </Box>
  );
}
