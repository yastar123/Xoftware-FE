import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, IconButton, Typography,
  useTheme, useMediaQuery, Avatar, Backdrop, Menu, MenuItem,
} from '@mui/material';
import {
  MenuRounded, ExpandMoreRounded, LightModeRounded, DarkModeRounded,
  AppsRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveIcon } from '@/config';
import { useThemeToggle } from '@/Context/ThemeContext';
import SafeImage from '@/Comp/SafeImage';

export default function Sidebar({
  menuItems = [],
  activeKey,
  activeSubKey,
  onMenuClick,
  localStorageKey,
  onLogout,
  mobileOpenProp,
  setMobileOpenProp,
  sidebarOpenProp,
  setSidebarOpenProp,
  ownerVariant = false,
}) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = mobileOpenProp !== undefined ? mobileOpenProp : internalMobileOpen;
  const setMobileOpen = setMobileOpenProp || setInternalMobileOpen;
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);
  const sidebarOpen = sidebarOpenProp !== undefined ? sidebarOpenProp : internalSidebarOpen;
  const setSidebarOpen = setSidebarOpenProp || setInternalSidebarOpen;
  const [expandedKeys, setExpandedKeys] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(`${localStorageKey}-expanded`) || '[]');
    } catch {
      return [];
    }
  });
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const { toggleColorMode, mode } = useThemeToggle();
  const theme = useTheme();
  const isDark = mode === 'dark';
  const isDesktop = useMediaQuery('(min-width:900px)');

  const sidebarBg = isDark ? '#0F172A' : '#F8FAFC';
  const appBarBg = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)';
  const borderColor = isDark ? '#1E293B' : '#E2E8F0';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const activeColor = isDark ? '#A5B4FC' : '#4338CA';
  const activeBorder = isDark ? '#818cf8' : '#6366f1';
  const visuallyOpen = sidebarOpen || isHovered;
  const sidebarWidth = visuallyOpen ? 264 : 76;

  // Persist expanded keys
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${localStorageKey}-expanded`, JSON.stringify(expandedKeys));
  }, [expandedKeys, localStorageKey]);

  // Auto-expand parent of active key
  useEffect(() => {
    if (activeKey) {
      setExpandedKeys(prev =>
        prev.includes(activeKey) ? prev : [...prev, activeKey]
      );
    }
  }, [activeKey]);

  const handleParentClick = useCallback((key, hasChildren, firstChild) => {
    if (!hasChildren) {
      onMenuClick(key, null);
      setMobileOpen(false);
      return;
    }
    // If already active+expanded → collapse
    if (activeKey === key && expandedKeys.includes(key)) {
      setExpandedKeys(prev => prev.filter(k => k !== key));
    } else {
      setExpandedKeys(prev => prev.includes(key) ? prev : [...prev, key]);
      if (firstChild) {
        onMenuClick(key, firstChild.key);
        setMobileOpen(false);
      }
    }
  }, [activeKey, expandedKeys, onMenuClick]);

  const handleChildClick = useCallback((parentKey, childKey) => {
    onMenuClick(parentKey, childKey);
    setMobileOpen(false);
  }, [onMenuClick]);

  // Build page title
  const activeItem = menuItems.find(m => m.key === activeKey);
  const activeChild = activeItem?.children?.find(c => c.key === activeSubKey);
  const pageTitle = activeChild
    ? `${activeItem.label} / ${activeChild.label}`
    : (activeItem?.label || '');

  const scrollbarSx = {
    overflowY: 'auto',
    '&::-webkit-scrollbar': { width: '4px' },
    '&::-webkit-scrollbar-thumb': {
      bgcolor: 'rgba(99,102,241,0.3)',
      borderRadius: '2px',
      '&:hover': { bgcolor: 'rgba(99,102,241,0.5)' },
    },
    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
  };

  const sidebarContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: sidebarBg,
      width: '100%',
      borderRight: `1px solid ${borderColor}`,
      boxShadow: ownerVariant ? '8px 0 28px rgba(15,23,42,0.06)' : 'none',
      ...scrollbarSx,
    }}>
      {/* Logo */}
      <Box sx={{
        height: 72,
        px: visuallyOpen ? 2.5 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: visuallyOpen ? 'flex-start' : 'center',
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}>
        <Box sx={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: 'rgba(99,102,241,0.12)',
          color: activeColor,
          fontWeight: 800,
          fontSize: 18,
        }}>X</Box>
        {visuallyOpen && (
          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: isDark ? '#F8FAFC' : '#172554', lineHeight: 1.1 }}>Xoftware</Typography>
            <Typography sx={{ mt: 0.35, fontSize: 10, color: textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>Owner panel</Typography>
          </Box>
        )}
      </Box>

      {/* Menu items */}
      <Box sx={{ px: visuallyOpen ? 1.5 : 1, py: 2, flexGrow: 1 }}>
        {visuallyOpen && (
          <Typography sx={{ px: 1.5, pb: 1, color: textSecondary, fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Workspace
          </Typography>
        )}
        {menuItems.map(item => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const isActive = activeKey === item.key;
          const hasActiveChild = hasChildren && item.children.some(c => c.key === activeSubKey && activeKey === item.key);
          const isExpanded = expandedKeys.includes(item.key);
          const highlight = isActive || hasActiveChild;
          const IconComp = resolveIcon(item.icon) || AppsRounded;

          return (
            <React.Fragment key={item.key}>
              {/* Parent item */}
              <Box
                className={`tour-step-${item.key}`}
                onClick={() => handleParentClick(item.key, hasChildren, hasChildren ? item.children[0] : null)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: visuallyOpen ? 'flex-start' : 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 44,
                  pl: visuallyOpen ? 2 : 0,
                  pr: visuallyOpen ? 1.5 : 0,
                  borderRadius: '8px',
                  mb: 0.5,
                  cursor: 'pointer',
                  bgcolor: highlight ? 'rgba(99,102,241,0.10)' : 'transparent',
                  borderLeft: highlight
                    ? `3px solid ${activeBorder}`
                    : '3px solid transparent',
                  color: highlight ? activeColor : textSecondary,
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                }}
              >
                {IconComp && (
                  <Box sx={{
                    width: 32,
                    mr: visuallyOpen ? 1.5 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComp style={{ fontSize: 20 }} />
                  </Box>
                )}
                <Typography sx={{
                  display: visuallyOpen ? 'block' : 'none',
                  flexGrow: 1,
                  fontSize: 14,
                  fontWeight: highlight ? 600 : 500,
                  color: 'inherit',
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </Typography>
                {hasChildren && (
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <ExpandMoreRounded sx={{ fontSize: 18, color: 'inherit' }} />
                  </motion.div>
                )}
              </Box>

              {/* Children */}
              {hasChildren && visuallyOpen && (
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="children"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {item.children.map(child => {
                        const childIsActive = activeSubKey === child.key && activeKey === item.key;
                        const ChildIcon = resolveIcon(child.icon) || AppsRounded;
                        return (
                          <Box
                            key={child.key}
                            className={`tour-step-${child.key}`}
                            onClick={() => handleChildClick(item.key, child.key)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              height: 38,
                              pl: 6,
                              pr: 1.5,
                              borderRadius: '8px',
                              mb: 0.25,
                              cursor: 'pointer',
                              bgcolor: childIsActive ? 'rgba(99,102,241,0.10)' : 'transparent',
                              color: childIsActive ? activeColor : textSecondary,
                              transition: 'all 0.2s ease',
                              '&:hover': { bgcolor: 'rgba(99,102,241,0.04)' },
                            }}
                          >
                            {ChildIcon ? (
                              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <ChildIcon style={{ fontSize: 18 }} />
                              </Box>
                            ) : (
                              <Box sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: childIsActive ? activeBorder : textSecondary,
                                mr: 1.5,
                                flexShrink: 0,
                              }} />
                            )}
                            <Typography sx={{
                              fontSize: 13,
                              fontWeight: childIsActive ? 600 : 400,
                              color: 'inherit',
                            }}>
                              {child.label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          height: 56,
          backdropFilter: 'blur(8px)',
          bgcolor: appBarBg,
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: ownerVariant ? '0 8px 30px rgba(15,23,42,0.06)' : 'none',
          color: isDark ? '#F1F5F9' : '#0F172A',
        }}
      >
        <Toolbar variant="dense" sx={{ height: 56, minHeight: 56, px: 2, gap: 1 }}>
          {/* Hamburger — mobile only */}
          {!isDesktop && (
            <IconButton className="tour-step-hamburger" size="small" onClick={() => setMobileOpen(true)} edge="start">
              <MenuRounded sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />
            </IconButton>
          )}
          {/* Sidebar toggle — desktop only */}
          {isDesktop && (
            <IconButton size="small" onClick={() => setSidebarOpen(!sidebarOpen)} edge="start">
              <MenuRounded sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />
            </IconButton>
          )}
          <Box sx={{ cursor: 'pointer' }} onClick={() => { window.location.href = '/'; }}>
            <SafeImage src="/Logo-nama.png" alt="xoftware" width={100} height={30} />
          </Box>
          {/* Page title */}
          <Typography variant="body2" sx={{
            ml: isDesktop ? 0 : 1,
            fontWeight: 500,
            color: textSecondary,
            flexShrink: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {pageTitle}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Dark mode toggle */}
          <IconButton size="small" onClick={toggleColorMode}>
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="dark"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex' }}
                >
                  <LightModeRounded sx={{ fontSize: 20, color: '#F59E0B' }} />
                </motion.div>
              ) : (
                <motion.div
                  key="light"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex' }}
                >
                  <DarkModeRounded sx={{ fontSize: 20, color: '#818CF8' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </IconButton>

          {/* Avatar */}
          <IconButton size="small" onClick={e => setAvatarAnchor(e.currentTarget)} sx={{ p: 0, ml: 0.5 }}>
            <Avatar sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              fontSize: 14,
              fontWeight: 600,
            }}>
              U
            </Avatar>
          </IconButton>
          <Menu
            open={Boolean(avatarAnchor)}
            anchorEl={avatarAnchor}
            onClose={() => setAvatarAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {onLogout && (
              <MenuItem onClick={() => { setAvatarAnchor(null); onLogout(); }}>
                Logout
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Desktop sidebar — fixed left */}
      {isDesktop && (
        <>
          <Box
              onMouseEnter={event => setIsHovered(event.clientY > 56)}
              onMouseMove={event => setIsHovered(event.clientY > 56)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: sidebarWidth,
              height: '100vh',
              zIndex: theme.zIndex.drawer,
              transform: 'translateX(0)',
              transition: 'width 0.25s ease',
              overflow: 'hidden',
            }}
          >
            {sidebarContent}
          </Box>
        </>
      )}

      {/* Mobile sidebar + backdrop */}
      {!isDesktop && (
        <>
          <Backdrop
            open={mobileOpen}
            onClick={() => setMobileOpen(false)}
            sx={{ zIndex: theme.zIndex.drawer - 1 }}
          />
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: mobileOpen ? 0 : '-100%',
            width: '85%',
            maxWidth: 320,
            height: '100vh',
            zIndex: theme.zIndex.drawer,
            boxShadow: 4,
            transition: 'left 0.25s ease',
          }}>
            {sidebarContent}
          </Box>
        </>
      )}
    </>
  );
}
