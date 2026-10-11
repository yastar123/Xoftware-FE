import React from "react";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from "@mui/material";
import {
  Home,
  Person,
  ShoppingBagOutlined,
  CompareArrowsOutlined,
} from "@mui/icons-material";
import { useRouter } from "next/router";

export function MobileBottomBar() {
  const theme = useTheme();
  const router = useRouter();
  const owner = router.query?.owner;

  // base path utk multi-tenant; kosong => root "/"
  const base = owner ? `/${owner}` : "/";

  // helper normalisasi path (hapus dupe slash, hapus trailing slash kecuali "/")
  const norm = (p) => {
    if (!p) return "/";
    let r = p.replace(/\/+/g, "/");
    if (!r.startsWith("/")) r = "/" + r;
    if (r !== "/" && r.endsWith("/")) r = r.slice(0, -1);
    return r;
  };

  const items = [
    { label: "Home", icon: <Home />, href: base },
    { label: "Product", icon: <ShoppingBagOutlined />, href: `${base}/produk` },
    { label: "Riwayat", icon: <CompareArrowsOutlined />, href: `${base}/riwayat` },
    { label: "Akun", icon: <Person />, href: `${base}/user` },
  ].map((it) => ({ ...it, href: norm(it.href) }));

  // path sekarang tanpa query/hash
  const pathNow = norm(String(router.asPath || "").split(/[?#]/)[0]);

  // pilih match dengan prefix TERPANJANG (hindari stuck di Home)
  let currentIndex = 0;
  let bestLen = -1;
  items.forEach((it, idx) => {
    const href = it.href;
    const exact = pathNow === href;
    const prefix =
      href !== "/" && (pathNow.startsWith(href + "/")); // boundary aman utk nested
    if (exact || prefix) {
      const len = href.length;
      if (len > bestLen) {
        bestLen = len;
        currentIndex = idx;
      }
    }
  });

  const handleChange = (_e, idx) => {
    const target = items[idx];
    if (target?.href && target.href !== pathNow) router.push(target.href);
  };

  return (
    <AppBar
      component={Paper}
      elevation={8}
      position="fixed"
      sx={{
        left: 0,
        right: 0,
        bottom: 0,
        top: "auto",
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        backdropFilter: "saturate(180%) blur(10px)",
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(10,10,10,0.55)"
            : "rgba(255,255,255,0.75)",
        pb: "max(env(safe-area-inset-bottom), 6px)",
      }}
    >
      <BottomNavigation
        showLabels
        value={currentIndex}
        onChange={handleChange}
        sx={{
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            padding: "6px 8px",
            color: theme.palette.text.secondary,
          },
          "& .Mui-selected": {
            color: theme.palette.secondary.main,
          },
        }}
      >
        {items.map((it) => (
          <BottomNavigationAction
            key={it.label}
            label={it.label}
            icon={it.icon}
          />
        ))}
      </BottomNavigation>
    </AppBar>
  );
}

export default MobileBottomBar;
