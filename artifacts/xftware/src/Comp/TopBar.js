import React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Badge,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home,
  ShoppingBagOutlined,
  CompareArrowsOutlined,
  ConfirmationNumberOutlined,
  StarBorder,
  InfoOutlined,
  Person,
  QrCode,
  Notifications,
  Logout,
  Brightness4,
  Brightness7,
  WorkspacePremium,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { useThemeToggle } from "@/Context/ThemeContext";

export const DESKTOP_SIDEBAR_WIDTH = 272;

export default function TopBar({ title = "Home", sx, leftAction, rightAction }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();
  const owner = router.query?.owner;
  const base = owner ? `/${owner}` : "";

  const [open, setOpen] = React.useState(false); // for mobile drawer
  const [anchorAcc, setAnchorAcc] = React.useState(null);
  const { toggleColorMode } = useThemeToggle?.() || { toggleColorMode: () => {} };

  const navItems = [
    { label: "Rumah", icon: <Home />, href: `${base}` },
    { label: "Produk", icon: <ShoppingBagOutlined />, href: `${base}/produk` },
    { label: "Riwayat", icon: <CompareArrowsOutlined />, href: `${base}/riwayat` },
    { label: "Voucher", icon: <ConfirmationNumberOutlined />, href: `${base}/voucher` },
    { label: "Peringkat", icon: <StarBorder />, href: `${base}/rangking` },
    { label: "Tingkatkan Level", icon: <WorkspacePremium />, href: `${base}/upgrade-level` },
    { label: "Informasi", icon: <InfoOutlined />, href: `${base}/informasi` },
    { label: "Deposit", icon: <QrCode />, href: `${base}/deposit` },
  ];

  const current = router.asPath || "";
  const go = (href) => {
    if (href) router.push(href);
    setOpen(false);
  };

  // Shared Sidebar Content
  const SidebarContent = (
    <Box sx={{ width: DESKTOP_SIDEBAR_WIDTH, display: "flex", flexDirection: "column", height: "100%" }} role="presentation">
      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
          Navigasi
        </Typography>
      </Box>
      <Divider />
      <List sx={{ py: 0 }}>
        {navItems.map((it) => (
          <ListItemButton key={it.label} selected={current === it.href} onClick={() => go(it.href)} sx={{ borderRadius: 1, mx: 1, my: 0.5 }}>
            <ListItemIcon>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ px: 2, py: 1.5 }}>
        <FormControlLabel
          control={<Switch checked={theme.palette.mode === "dark"} onChange={toggleColorMode} />}
          label="Mode Gelap"
        />
      </Box>
    </Box>
  );

  // Helper: render array/single right actions
  const renderRightActions = () => {
    if (rightAction !== undefined) {
      const actions = Array.isArray(rightAction) ? rightAction : [rightAction];
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {actions.map((node, idx) => (
            <Box key={idx} sx={{ display: "flex", alignItems: "center" }}>
              {node}
            </Box>
          ))}
        </Box>
      );
    }
    // default right actions
    return (
      <>
        <IconButton color="inherit" onClick={() => router.push(`${base}/informasi`)}>
          <Badge color="error" variant="dot">
            <Notifications />
          </Badge>
        </IconButton>
        <IconButton color="inherit" onClick={(e) => setAnchorAcc(e.currentTarget)}>
          <Person />
        </IconButton>
      </>
    );
  };

  // Helper: render left action (custom kalau ada, kalau tidak: hamburger di mobile)
  const renderLeftAction = () => {
    if (leftAction !== undefined) return leftAction;
    if (!isDesktop) {
      return (
        <IconButton edge="start" onClick={() => setOpen(true)}>
          <MenuIcon />
        </IconButton>
      );
    }
    return null; // desktop: tidak tampil default kiri
  };

  return (
    <>
      {/* Top AppBar — shifts right on desktop to make room for the permanent sidebar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          ml: { md: `${DESKTOP_SIDEBAR_WIDTH}px` },
          width: { md: `calc(100% - ${DESKTOP_SIDEBAR_WIDTH}px)` },
          backdropFilter: "saturate(140%) blur(8px)",
          backgroundColor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)",
          color: theme.palette.mode === "dark" ? "rgba(186, 226, 229, 1)" : "rgba(0, 54, 46, 0.65)",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          ...sx,
        }}
      >
        <Toolbar>
          {/* LEFT */}
          {renderLeftAction()}

          {/* TITLE */}
          <Typography variant={isDesktop ? "h6" : "subtitle1"} fontWeight={700} sx={{ flexGrow: 1, px: 1, color: "inherit" }} noWrap>
            {title}
          </Typography>

          {/* RIGHT */}
          {renderRightActions()}

          {/* Account Menu (tetap aktif saat pakai default rightAction) */}
          <Menu
            anchorEl={anchorAcc}
            open={Boolean(anchorAcc)}
            onClose={() => setAnchorAcc(null)}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setAnchorAcc(null);
                go(`${base}/user`);
              }}
            >
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Akun Saya
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorAcc(null);
                toggleColorMode && toggleColorMode();
              }}
            >
              <ListItemIcon>{theme.palette.mode === "dark" ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}</ListItemIcon>
              Toggle Tema
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar: permanent on desktop, temporary on mobile */}
      {/* Desktop permanent */}
      <Drawer
        variant="permanent"
        open
        anchor="left"
        sx={{ display: { xs: "none", md: "block" } }}
        PaperProps={{
          sx: {
            width: DESKTOP_SIDEBAR_WIDTH,
            borderRight: (t) => `1px solid ${t.palette.divider}`,
            boxSizing: "border-box",
            pt: "64px", // keep content below AppBar
            backdropFilter: "saturate(140%) blur(8px)",
            backgroundColor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.7)",
          },
        }}
      >
        {SidebarContent}
      </Drawer>

      {/* Mobile temporary */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        anchor="left"
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" } }}
        PaperProps={{ sx: { width: DESKTOP_SIDEBAR_WIDTH } }}
      >
        {/* leave space for AppBar */}
        <Box sx={theme.mixins.toolbar} />
        {SidebarContent}
      </Drawer>
    </>
  );
}
