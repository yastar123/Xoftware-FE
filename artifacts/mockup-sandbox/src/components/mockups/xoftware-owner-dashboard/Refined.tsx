import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Bot,
  Boxes,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Filter,
  Globe2,
  HandCoins,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  Menu,
  Moon,
  Package,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sun,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import "./_group.css";
import "./Refined.css";

type Announcement = {
  id: number;
  title: string;
  category: "Sistem" | "Operasional" | "Kebijakan";
  createdAt: string;
  message: string;
  is_read: boolean;
};

type Transaction = {
  id: string;
  customer: string;
  product: string;
  category: "Game" | "Cloud & Web" | "Voucher" | "PPOB";
  amount: number;
  method: "QRIS Instant" | "Saldo Reseller" | "Transfer Bank";
  status: "Berhasil" | "Pending" | "Diproses";
  time: string;
};

type MetricTab = "all" | "saldo" | "produk" | "pendapatan";
type GraphRange = "7d" | "30d" | "3m";

type ChartPoint = {
  label: string;
  success: number;
  pending: number;
  failed: number;
  totalRevenue: number;
};

const chartDataSets: Record<GraphRange, ChartPoint[]> = {
  "7d": [
    { label: "12 Okt", success: 168, pending: 14, failed: 2, totalRevenue: 1845000 },
    { label: "13 Okt", success: 195, pending: 18, failed: 3, totalRevenue: 2150000 },
    { label: "14 Okt", success: 182, pending: 12, failed: 1, totalRevenue: 1980000 },
    { label: "15 Okt", success: 240, pending: 25, failed: 4, totalRevenue: 2840000 },
    { label: "16 Okt", success: 220, pending: 19, failed: 2, totalRevenue: 2490000 },
    { label: "17 Okt", success: 275, pending: 22, failed: 3, totalRevenue: 3120000 },
    { label: "18 Okt", success: 294, pending: 16, failed: 2, totalRevenue: 3450000 },
  ],
  "30d": [
    { label: "Mgg 1", success: 1120, pending: 95, failed: 18, totalRevenue: 12450000 },
    { label: "Mgg 2", success: 1340, pending: 110, failed: 14, totalRevenue: 15820000 },
    { label: "Mgg 3", success: 1560, pending: 125, failed: 20, totalRevenue: 18900000 },
    { label: "Mgg 4", success: 1810, pending: 140, failed: 16, totalRevenue: 22150000 },
  ],
  "3m": [
    { label: "Agustus", success: 4890, pending: 380, failed: 64, totalRevenue: 58400000 },
    { label: "September", success: 5640, pending: 410, failed: 52, totalRevenue: 69200000 },
    { label: "Oktober", success: 6420, pending: 460, failed: 58, totalRevenue: 81500000 },
  ],
};

const navigationSections = [
  {
    title: "Utama",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Live" },
      { key: "product", label: "Manajemen Produk", icon: Package, count: "128" },
      { key: "user", label: "Data Pengguna", icon: Users, count: "842" },
      { key: "transaction", label: "Transaksi", icon: Receipt, count: "1.284" },
    ],
  },
  {
    title: "Keuangan & Kas",
    items: [
      { key: "withdraw", label: "Tarik Penghasilan", icon: HandCoins },
      { key: "mutation", label: "Mutasi Saldo", icon: ArrowLeftRight },
      { key: "unduh-data", label: "Unduh Laporan", icon: Download },
    ],
  },
  {
    title: "Layanan & Otomasi",
    items: [
      { key: "bot", label: "Bot WhatsApp & TG", icon: Bot, badge: "Aktif" },
      { key: "ppob", label: "Produk PPOB", icon: Smartphone },
      { key: "smm", label: "Layanan SMM", icon: TrendingUp },
      { key: "domain-provider", label: "Kelola Domain", icon: Globe2 },
    ],
  },
  {
    title: "Konfigurasi & Bantuan",
    items: [
      { key: "webapp", label: "Pengaturan Web App", icon: Settings2 },
      { key: "ticket", label: "Tiket Bantuan", icon: Ticket, count: "2" },
      { key: "setting", label: "Pengaturan Toko", icon: ShieldCheck },
    ],
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: 101,
    title: "Pembaruan proses pencairan saldo instan",
    category: "Operasional",
    createdAt: "18 Okt 2026 · 09.20 WIB",
    message:
      "Jadwal pemrosesan pencairan saldo kini didukung sistem real-time payout otomatis ke seluruh bank nasional dan e-wallet. Permintaan withdraw diproses dalam waktu kurang dari 5 menit tanpa jeda operasional.",
    is_read: false,
  },
  {
    id: 102,
    title: "Peningkatan keamanan gateway QRIS Statis & Dinamis",
    category: "Sistem",
    createdAt: "16 Okt 2026 · 14.05 WIB",
    message:
      "Protokol webhook QRIS telah ditingkatkan dengan verifikasi tanda tangan HMAC-SHA256. Notifikasi pembayaran otomatis terverifikasi dengan tingkat latensi sub-detik untuk memastikan pesanan pembeli langsung aktif.",
    is_read: false,
  },
  {
    id: 103,
    title: "Kebijakan verifikasi identitas rekening tujuan",
    category: "Kebijakan",
    createdAt: "12 Okt 2026 · 11.32 WIB",
    message:
      "Untuk perlindungan dana pemilik toko, pastikan nama pemilik rekening penarikan sesuai dengan identitas legal akun yang terdaftar. Penarikan ke rekening pihak ketiga memerlukan konfirmasi verifikasi 2FA.",
    is_read: true,
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "TRX-94821",
    customer: "Rian Ramadhan",
    product: "Mobile Legends 86 Diamonds",
    category: "Game",
    amount: 22500,
    method: "QRIS Instant",
    status: "Berhasil",
    time: "2 menit lalu",
  },
  {
    id: "TRX-94820",
    customer: "Dina Astuti",
    product: "Domain .id 1 Tahun + SSL",
    category: "Cloud & Web",
    amount: 245000,
    method: "Transfer Bank",
    status: "Berhasil",
    time: "14 menit lalu",
  },
  {
    id: "TRX-94819",
    customer: "Budi Santoso",
    product: "Voucher Canva Pro Edu 1 Thn",
    category: "Voucher",
    amount: 35000,
    method: "Saldo Reseller",
    status: "Berhasil",
    time: "38 menit lalu",
  },
  {
    id: "TRX-94818",
    customer: "Andi Saputra",
    product: "Pulsa Telkomsel 50.000 Reguler",
    category: "PPOB",
    amount: 51200,
    method: "QRIS Instant",
    status: "Diproses",
    time: "45 menit lalu",
  },
  {
    id: "TRX-94817",
    customer: "Mega Fitri",
    product: "Instagram Followers Real Indo 1K",
    category: "Voucher",
    amount: 75000,
    method: "QRIS Instant",
    status: "Pending",
    time: "1 jam lalu",
  },
  {
    id: "TRX-94816",
    customer: "Hendra Wijaya",
    product: "Steam Wallet Code IDR 120.000",
    category: "Game",
    amount: 132000,
    method: "Saldo Reseller",
    status: "Berhasil",
    time: "2 jam lalu",
  },
];

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatClock() {
  const date = new Date();
  return date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateHeader() {
  const date = new Date();
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Refined() {
  const [metricTab, setMetricTab] = useState<MetricTab>("all");
  const [graphRange, setGraphRange] = useState<GraphRange>("7d");
  const [collapsed, setCollapsed] = useState(() => window.matchMedia("(max-width: 860px)").matches);
  const [railHovered, setRailHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("xoftware_theme") === "dark";
    }
    return false;
  });
  const [activeKey, setActiveKey] = useState("dashboard");
  const [activeLabel, setActiveLabel] = useState("Dashboard");
  const [clock, setClock] = useState("");
  const [dateHeader, setDateHeader] = useState("");

  // Financial state (dynamic simulation)
  const [saldoTersedia, setSaldoTersedia] = useState(8472500);
  const [saldoPending, setSaldoPending] = useState(684000);
  const [saldoTerkunci] = useState(125000);
  const [saldoKeluar, setSaldoKeluar] = useState(2150000);
  const [pendapatanBulanan] = useState(24876000);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [trxStatusFilter, setTrxStatusFilter] = useState<"Semua" | "Berhasil" | "Pending" | "Diproses">("Semua");
  const [trxSearchQuery, setTrxSearchQuery] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Modals & Drawers
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("500000");
  const [withdrawBank, setWithdrawBank] = useState("BCA");
  const [withdrawAccount, setWithdrawAccount] = useState("8920194821");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Chart interactivity
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Feedback toast
  const [toast, setToast] = useState("");

  const unreadCount = useMemo(() => announcements.filter((item) => !item.is_read).length, [announcements]);
  const expanded = !collapsed || railHovered;

  // Persist dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("xoftware_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("xoftware_theme", "light");
    }
  }, [isDark]);

  // Real-time clock
  useEffect(() => {
    const update = () => {
      setClock(formatClock());
      setDateHeader(formatDateHeader());
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowWithdrawModal(false);
        setSelectedAnnouncement(null);
        setSelectedTrx(null);
        setShowQrModal(false);
        setShowSearchModal(false);
        setShowNotificationMenu(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyStoreLink = () => {
    const url = "https://ruangdigital.xoft.store";
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToast("Tautan etalase digital berhasil disalin!");
      }).catch(() => {
        setToast("Tautan: " + url);
      });
    } else {
      setToast("Tautan: " + url);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 50000) {
      setToast("Minimal penarikan saldo adalah Rp 50.000");
      return;
    }
    if (amount > saldoTersedia) {
      setToast("Saldo tersedia tidak mencukupi untuk penarikan ini");
      return;
    }

    setWithdrawSubmitting(true);
    window.setTimeout(() => {
      setSaldoTersedia((prev) => prev - amount);
      setSaldoKeluar((prev) => prev + amount);
      setWithdrawSubmitting(false);
      setShowWithdrawModal(false);

      const newTrx: Transaction = {
        id: `WD-${Date.now().toString().slice(-6)}`,
        customer: "Owner Xoftware",
        product: `Pencairan Dana ke ${withdrawBank} (${withdrawAccount})`,
        category: "Cloud & Web",
        amount,
        method: "Transfer Bank",
        status: "Diproses",
        time: "Baru saja",
      };
      setTransactions((prev) => [newTrx, ...prev]);
      setToast(`Permintaan tarik saldo ${formatIdr(amount)} ke ${withdrawBank} berhasil dikirim!`);
    }, 700);
  };

  const markAnnouncementRead = (id: number) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
    if (selectedAnnouncement && selectedAnnouncement.id === id) {
      setSelectedAnnouncement((prev) => (prev ? { ...prev, is_read: true } : null));
    }
    setToast("Pengumuman ditandai telah dibaca.");
  };

  const markAllAnnouncementsRead = () => {
    setAnnouncements((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setToast("Semua pengumuman ditandai telah dibaca.");
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchStatus = trxStatusFilter === "Semua" || trx.status === trxStatusFilter;
      const matchSearch =
        trxSearchQuery === "" ||
        trx.id.toLowerCase().includes(trxSearchQuery.toLowerCase()) ||
        trx.customer.toLowerCase().includes(trxSearchQuery.toLowerCase()) ||
        trx.product.toLowerCase().includes(trxSearchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [transactions, trxStatusFilter, trxSearchQuery]);

  // SVG Chart calculation
  const currentChartData = chartDataSets[graphRange];
  const maxVal = Math.max(...currentChartData.map((d) => d.success + d.pending + 30));

  // Compute SVG polyline points
  const chartWidth = 640;
  const chartHeight = 210;
  const paddingX = 40;
  const paddingY = 25;

  const pointsSuccess = currentChartData.map((d, index) => {
    const x = paddingX + (index / (currentChartData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.success / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, data: d };
  });

  const pointsPending = currentChartData.map((d, index) => {
    const x = paddingX + (index / (currentChartData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.pending / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, data: d };
  });

  const polylineSuccess = pointsSuccess.map((p) => `${p.x},${p.y}`).join(" ");
  const polylinePending = pointsPending.map((p) => `${p.x},${p.y}`).join(" ");

  const areaSuccess = `${pointsSuccess[0].x},${chartHeight - paddingY} ` +
    polylineSuccess +
    ` ${pointsSuccess[pointsSuccess.length - 1].x},${chartHeight - paddingY}`;

  return (
    <div className={`xoft-refined${isDark ? " is-dark" : ""}`}>
      {/* 3-ZONE APPBAR (Anti-slop Top Bar Contract) */}
      <header className="xor-appbar">
        {/* Zone 1: Brand title & rail toggle */}
        <div className="xor-zone-brand">
          <button
            className="xor-toggle"
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka atau ciutkan menu samping"}
            aria-expanded={mobileOpen || !collapsed}
            onClick={() => {
              if (window.matchMedia("(max-width: 640px)").matches) {
                setMobileOpen((prev) => !prev);
              } else {
                setCollapsed((prev) => !prev);
              }
            }}
          >
            <Menu size={18} />
          </button>
          <div className="xor-wordmark" aria-label="Xoftware Owner Console">
            <span className="xor-mark">X</span>
            <div className="xor-brand-text">
              <strong>Xoftware</strong>
              <small>Owner Console</small>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation breadcrumb trail & Live clock */}
        <div className="xor-zone-nav">
          <span className="xor-crumb-root">Owner</span>
          <span className="xor-crumb-sep">/</span>
          <span className="xor-crumb-current">{activeLabel}</span>
          <span className="xor-crumb-sep">·</span>
          <span className="xor-clock-pill">
            <span className="xor-clock-dot" />
            <span className="font-mono tabular-nums">{clock} WIB</span>
          </span>
        </div>

        {/* Zone 3: Actions (Search, Notification, Theme, Profile) */}
        <div className="xor-zone-actions">
          <button
            className="xor-search-trigger"
            aria-label="Cari fitur dan data (Ctrl+K)"
            onClick={() => setShowSearchModal(true)}
          >
            <Search size={15} />
            <span className="xor-search-text">Cari...</span>
            <kbd className="xor-search-kbd">⌘K</kbd>
          </button>

          <button
            className="xor-round-button"
            aria-label="Ganti tema terang atau gelap"
            title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
            onClick={() => setIsDark((prev) => !prev)}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="xor-relative-wrap">
            <button
              className="xor-round-button"
              aria-label="Pemberitahuan dan pengumuman"
              onClick={() => setShowNotificationMenu((prev) => !prev)}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="xor-bell-dot" />}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotificationMenu && (
              <div className="xor-popover-menu" role="menu">
                <div className="xor-popover-header">
                  <div>
                    <h3 className="xor-popover-title">Pemberitahuan</h3>
                    <p className="xor-popover-sub">
                      {unreadCount > 0 ? `${unreadCount} pengumuman baru` : "Semua sudah dibaca"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="xor-link-btn"
                      onClick={() => {
                        markAllAnnouncementsRead();
                        setShowNotificationMenu(false);
                      }}
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <div className="xor-popover-list">
                  {announcements.map((item) => (
                    <button
                      key={item.id}
                      className={`xor-popover-item${!item.is_read ? " is-unread" : ""}`}
                      onClick={() => {
                        setSelectedAnnouncement(item);
                        setShowNotificationMenu(false);
                      }}
                    >
                      <div className="xor-popover-item-title">{item.title}</div>
                      <div className="xor-popover-item-date">{item.createdAt}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="xor-profile-badge" title="Owner Utama - Toko Aktif">
            <span className="xor-user-avatar">OW</span>
            <div className="xor-user-info hidden md:flex">
              <span className="xor-user-name">Owner Digital</span>
              <span className="xor-user-role">Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <button
          className="xor-mobile-backdrop"
          aria-label="Tutup menu samping"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (Collapsible 246px -> 72px) */}
      <aside
        className={`xor-sidebar${!expanded ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Navigasi Owner"
        onMouseEnter={() => {
          if (collapsed && !window.matchMedia("(max-width: 860px)").matches) {
            setRailHovered(true);
          }
        }}
        onMouseLeave={() => setRailHovered(false)}
      >
        <div className="xor-sidebar-scroll">
          {navigationSections.map((section) => (
            <div key={section.title} className="xor-nav-group">
              <div className="xor-workspace-label">{section.title}</div>
              <nav className="xor-nav">
                {section.items.map(({ key, label, icon: Icon, badge, count }) => {
                  const isActive = activeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`xor-nav-button${isActive ? " is-active" : ""}`}
                      title={!expanded ? label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        setActiveKey(key);
                        setActiveLabel(label);
                        setMobileOpen(false);
                      }}
                    >
                      <Icon className="xor-nav-icon shrink-0" size={18} aria-hidden="true" />
                      <span className="xor-nav-label truncate">{label}</span>
                      {badge && expanded && <span className="xor-nav-badge">{badge}</span>}
                      {count && expanded && <span className="xor-nav-count">{count}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="xor-sidebar-footer">
          <div className="xor-sidebar-foot-card">
            <div className="xor-foot-status">
              <span className="xor-foot-dot" />
              <span>Sistem Normal</span>
            </div>
            <p className="xor-foot-version">Xoftware v3.4 · Cloud Ready</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className={`xor-content${!expanded ? " is-collapsed" : ""}`}>
        {/* BANNER GREETING & STORE SHOWCASE STRIP */}
        <div className="xor-header-grid">
          <div className="xor-greeting-card">
            <div className="xor-greeting-content">
              <div className="xor-eyebrow-row">
                <span className="xor-tag-live">Pusat Kendali Bisnis</span>
                <span className="xor-eyebrow-sep">·</span>
                <span className="xor-eyebrow-text">{dateHeader}</span>
              </div>
              <h1 className="xor-hero-title">Halo Owner Xoftware</h1>
              <p className="xor-hero-quote">
                “Konsistensi dalam eksekusi adalah fondasi pertumbuhan digital yang berkelanjutan.”
              </p>
            </div>

            <div className="xor-quick-kpi">
              <div className="xor-kpi-item">
                <span className="xor-kpi-label">Status Store</span>
                <span className="xor-kpi-val text-emerald-600 dark:text-emerald-400">Buka 24 Jam</span>
              </div>
              <div className="xor-kpi-divider" />
              <div className="xor-kpi-item">
                <span className="xor-kpi-label">Gateway QRIS</span>
                <span className="xor-kpi-val font-mono tabular-nums">Online (99.9%)</span>
              </div>
            </div>
          </div>

          {/* PUBLIC STORE CARD */}
          <div className="xor-public-store-card">
            <div className="xor-public-header">
              <div className="xor-public-title-wrap">
                <Globe2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="xor-public-title">Etalase Digital Publik</h3>
                  <p className="xor-public-sub">Toko online aktif Anda untuk pembeli</p>
                </div>
              </div>
              <button
                className="xor-qr-btn"
                title="Tampilkan QRIS Toko"
                aria-label="Tampilkan QRIS Toko"
                onClick={() => setShowQrModal(true)}
              >
                <QrCode size={16} />
              </button>
            </div>

            <div className="xor-public-url-box">
              <span className="xor-url-text font-mono truncate">ruangdigital.xoft.store</span>
              <button
                className="xor-copy-btn"
                title="Salin alamat toko"
                aria-label="Salin alamat toko"
                onClick={copyStoreLink}
              >
                <Copy size={14} />
              </button>
            </div>

            <div className="xor-public-actions">
              <a
                href="https://ruangdigital.xoft.store"
                target="_blank"
                rel="noreferrer"
                className="xor-visit-btn"
              >
                <span>Buka Toko</span>
                <ExternalLink size={13} />
              </a>
              <button
                className="xor-withdraw-trigger-btn"
                onClick={() => setShowWithdrawModal(true)}
              >
                <Wallet size={14} />
                <span>Tarik Saldo</span>
              </button>
            </div>
          </div>
        </div>

        {/* METRICS & FINANCIAL STRIP */}
        <section className="xor-metrics-section" aria-labelledby="xor-metrics-heading">
          <div className="xor-section-header">
            <div>
              <h2 id="xor-metrics-heading" className="xor-section-title">
                Ringkasan Keuangan & Operasional
              </h2>
              <p className="xor-section-sub">
                Arus kas riil, inventaris produk digital, dan volume settlement
              </p>
            </div>

            {/* Segmented Filter Control */}
            <div className="xor-segment-bar" role="tablist" aria-label="Filter Metrik">
              <button
                role="tab"
                aria-selected={metricTab === "all"}
                className={`xor-segment-btn${metricTab === "all" ? " is-active" : ""}`}
                onClick={() => setMetricTab("all")}
              >
                Semua
              </button>
              <button
                role="tab"
                aria-selected={metricTab === "saldo"}
                className={`xor-segment-btn${metricTab === "saldo" ? " is-active" : ""}`}
                onClick={() => setMetricTab("saldo")}
              >
                Saldo Kas
              </button>
              <button
                role="tab"
                aria-selected={metricTab === "pendapatan"}
                className={`xor-segment-btn${metricTab === "pendapatan" ? " is-active" : ""}`}
                onClick={() => setMetricTab("pendapatan")}
              >
                Pendapatan
              </button>
              <button
                role="tab"
                aria-selected={metricTab === "produk"}
                className={`xor-segment-btn${metricTab === "produk" ? " is-active" : ""}`}
                onClick={() => setMetricTab("produk")}
              >
                Produk
              </button>
            </div>
          </div>

          <div className="xor-metric-grid">
            {/* Metric Card 1: Saldo Tersedia */}
            {(metricTab === "all" || metricTab === "saldo") && (
              <article className="xor-metric-card">
                <div className="xor-metric-top">
                  <span className="xor-metric-icon bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <HandCoins size={20} />
                  </span>
                  <span className="xor-metric-trend text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={13} />
                    <span>+14.2%</span>
                  </span>
                </div>
                <div className="xor-metric-body">
                  <span className="xor-metric-title">Saldo Tersedia</span>
                  <span className="xor-metric-val font-mono tabular-nums">
                    {formatIdr(saldoTersedia)}
                  </span>
                  <div className="xor-metric-meta">
                    <span>Dapat ditarik seketika</span>
                    <button
                      className="xor-metric-action"
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      Tarik Dana
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Metric Card 2: Pendapatan Bulan Ini */}
            {(metricTab === "all" || metricTab === "pendapatan") && (
              <article className="xor-metric-card">
                <div className="xor-metric-top">
                  <span className="xor-metric-icon bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CalendarRange size={20} />
                  </span>
                  <span className="xor-metric-trend text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={13} />
                    <span>+18.5% mom</span>
                  </span>
                </div>
                <div className="xor-metric-body">
                  <span className="xor-metric-title">Pendapatan Bulan Ini</span>
                  <span className="xor-metric-val font-mono tabular-nums">
                    {formatIdr(pendapatanBulanan)}
                  </span>
                  <div className="xor-metric-meta">
                    <span>Rata-rata {formatIdr(829200)}/hari</span>
                  </div>
                </div>
              </article>
            )}

            {/* Metric Card 3: Saldo Pending */}
            {(metricTab === "all" || metricTab === "saldo") && (
              <article className="xor-metric-card">
                <div className="xor-metric-top">
                  <span className="xor-metric-icon bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Clock3 size={20} />
                  </span>
                  <span className="xor-metric-status-tag">Menunggu Kliring</span>
                </div>
                <div className="xor-metric-body">
                  <span className="xor-metric-title">Saldo Pending (Settlement)</span>
                  <span className="xor-metric-val font-mono tabular-nums">
                    {formatIdr(saldoPending)}
                  </span>
                  <div className="xor-metric-meta">
                    <span>Masuk ke saldo tersedia pukul 23:59</span>
                  </div>
                </div>
              </article>
            )}

            {/* Metric Card 4: Total Transaksi */}
            {(metricTab === "all" || metricTab === "produk") && (
              <article className="xor-metric-card">
                <div className="xor-metric-top">
                  <span className="xor-metric-icon bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <Receipt size={20} />
                  </span>
                  <span className="xor-metric-trend text-blue-600 dark:text-blue-400">
                    <span>98.6% Sukses</span>
                  </span>
                </div>
                <div className="xor-metric-body">
                  <span className="xor-metric-title">Total Transaksi Selesai</span>
                  <span className="xor-metric-val font-mono tabular-nums">1.284 Pesanan</span>
                  <div className="xor-metric-meta">
                    <span>12 transaksi dalam antrean</span>
                  </div>
                </div>
              </article>
            )}
          </div>

          {/* Secondary Quick Metrics Row */}
          <div className="xor-secondary-strip">
            <div className="xor-secondary-item">
              <span className="xor-sec-label">Saldo Terkunci (Escrow)</span>
              <span className="xor-sec-val font-mono tabular-nums">{formatIdr(saldoTerkunci)}</span>
            </div>
            <div className="xor-sec-sep" />
            <div className="xor-secondary-item">
              <span className="xor-sec-label">Total Payout Ditarik</span>
              <span className="xor-sec-val font-mono tabular-nums">{formatIdr(saldoKeluar)}</span>
            </div>
            <div className="xor-sec-sep" />
            <div className="xor-secondary-item">
              <span className="xor-sec-label">Katalog Produk Aktif</span>
              <span className="xor-sec-val font-mono tabular-nums">128 SKU</span>
            </div>
            <div className="xor-sec-sep" />
            <div className="xor-secondary-item">
              <span className="xor-sec-label">Pendapatan Hari Ini</span>
              <span className="xor-sec-val font-mono tabular-nums">{formatIdr(1248500)}</span>
            </div>
          </div>
        </section>

        {/* 2-COLUMN VIEWPORT: CHART & ANNOUNCEMENTS */}
        <div className="xor-twocolumn-grid">
          {/* LEFT: INTERACTIVE OPERATIONS CHART */}
          <section className="xor-chart-section" aria-labelledby="xor-chart-heading">
            <div className="xor-chart-header">
              <div>
                <h2 id="xor-chart-heading" className="xor-section-title">
                  Analisis Arus Transaksi & Settlement
                </h2>
                <p className="xor-section-sub">
                  Volume transaksi berhasil versus pending berdasarkan rentang waktu
                </p>
              </div>

              <div className="xor-chart-ranges" role="group" aria-label="Rentang Waktu">
                <button
                  className={`xor-range-btn${graphRange === "7d" ? " is-active" : ""}`}
                  onClick={() => setGraphRange("7d")}
                >
                  7 Hari
                </button>
                <button
                  className={`xor-range-btn${graphRange === "30d" ? " is-active" : ""}`}
                  onClick={() => setGraphRange("30d")}
                >
                  30 Hari
                </button>
                <button
                  className={`xor-range-btn${graphRange === "3m" ? " is-active" : ""}`}
                  onClick={() => setGraphRange("3m")}
                >
                  3 Bulan
                </button>
              </div>
            </div>

            {/* KPI Summary strip over chart */}
            <div className="xor-chart-kpi-bar">
              <div className="xor-ckpi-item">
                <span className="xor-ckpi-sub">Total Omset Periode</span>
                <span className="xor-ckpi-num font-mono tabular-nums">
                  {formatIdr(
                    currentChartData.reduce((acc, curr) => acc + curr.totalRevenue, 0)
                  )}
                </span>
              </div>
              <div className="xor-ckpi-item">
                <span className="xor-ckpi-sub">Total Transaksi</span>
                <span className="xor-ckpi-num font-mono tabular-nums">
                  {currentChartData.reduce((acc, curr) => acc + curr.success, 0)} Berhasil
                </span>
              </div>
              <div className="xor-ckpi-item">
                <span className="xor-ckpi-sub">Tingkat Keberhasilan</span>
                <span className="xor-ckpi-num font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  98.6%
                </span>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="xor-svg-container">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="xor-svg-canvas"
                role="img"
                aria-label="Grafik pergerakan status transaksi"
              >
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2);
                  return (
                    <line
                      key={ratio}
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      className="xor-grid-line"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area under curve */}
                <polygon points={areaSuccess} fill="url(#successGrad)" />

                {/* Polyline Pending */}
                <polyline
                  points={polylinePending}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Polyline Success */}
                <polyline
                  points={polylineSuccess}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {pointsSuccess.map((pt, idx) => (
                  <g
                    key={idx}
                    className="xor-node-group cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPointIndex === idx ? 6 : 4}
                      className="xor-chart-dot fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="xor-chart-label font-mono text-[10px]"
                    >
                      {pt.data.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Floating Tooltip when point hovered */}
              {hoveredPointIndex !== null && (
                <div
                  className="xor-chart-tooltip"
                  style={{
                    left: `${(pointsSuccess[hoveredPointIndex].x / chartWidth) * 100}%`,
                    top: `${(pointsSuccess[hoveredPointIndex].y / chartHeight) * 100}%`,
                  }}
                >
                  <div className="xor-tip-date">{currentChartData[hoveredPointIndex].label}</div>
                  <div className="xor-tip-rev font-mono">
                    {formatIdr(currentChartData[hoveredPointIndex].totalRevenue)}
                  </div>
                  <div className="xor-tip-row text-indigo-600 dark:text-indigo-400">
                    <span>Berhasil:</span>
                    <strong className="font-mono tabular-nums">{currentChartData[hoveredPointIndex].success}</strong>
                  </div>
                  <div className="xor-tip-row text-amber-600 dark:text-amber-400">
                    <span>Pending:</span>
                    <strong className="font-mono tabular-nums">{currentChartData[hoveredPointIndex].pending}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="xor-chart-legend">
              <span className="xor-leg-item">
                <i className="bg-indigo-600 dark:bg-indigo-400" />
                <span>Transaksi Berhasil</span>
              </span>
              <span className="xor-leg-item">
                <i className="bg-amber-500" />
                <span>Transaksi Pending</span>
              </span>
              <span className="xor-leg-hint text-xs text-slate-500 dark:text-slate-400">
                Arahkan kursor pada titik grafik untuk rincian harian
              </span>
            </div>
          </section>

          {/* RIGHT: ANNOUNCEMENTS & OPERATIONAL NOTICES */}
          <aside className="xor-ann-section" aria-labelledby="xor-ann-heading">
            <div className="xor-ann-header">
              <div className="xor-ann-title-wrap">
                <span className="xor-ann-icon-badge">
                  <Megaphone size={16} />
                </span>
                <div>
                  <h2 id="xor-ann-heading" className="xor-section-title">
                    Pengumuman Platform
                  </h2>
                  <p className="xor-section-sub">Informasi resmi operasional & pembaruan</p>
                </div>
              </div>
              {unreadCount > 0 && (
                <span className="xor-badge-unread">{unreadCount} Belum Dibaca</span>
              )}
            </div>

            <div className="xor-ann-list">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className={`xor-ann-card${!item.is_read ? " is-unread" : ""}`}
                  onClick={() => setSelectedAnnouncement(item)}
                >
                  <div className="xor-ann-meta">
                    <span className="xor-ann-category">{item.category}</span>
                    <span className="xor-ann-dot-sep">·</span>
                    <span className="xor-ann-date font-mono">{item.createdAt}</span>
                    {!item.is_read && <span className="xor-ann-new-pill">Baru</span>}
                  </div>
                  <h3 className="xor-ann-title">{item.title}</h3>
                  <p className="xor-ann-snippet line-clamp-2">{item.message}</p>
                  <div className="xor-ann-foot">
                    <span>Baca selengkapnya</span>
                    <ChevronRight size={14} />
                  </div>
                </article>
              ))}
            </div>

            <div className="xor-support-banner">
              <div className="xor-supp-icon">
                <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="xor-supp-content">
                <strong>Bantuan Prioritas Pemilik Toko</strong>
                <p>Kendala transaksi dapat dilaporkan melalui Tiket Bantuan 24/7</p>
              </div>
              <button
                className="xor-supp-btn"
                onClick={() => {
                  setActiveKey("ticket");
                  setActiveLabel("Tiket Bantuan");
                }}
              >
                Buat Tiket
              </button>
            </div>
          </aside>
        </div>

        {/* RECENT TRANSACTIONS TABLE (Real-time Audit & Order Management) */}
        <section className="xor-transactions-section" aria-labelledby="xor-trx-heading">
          <div className="xor-trx-header">
            <div>
              <h2 id="xor-trx-heading" className="xor-section-title">
                Aktivitas Transaksi Terbaru
              </h2>
              <p className="xor-section-sub">
                Daftar pesanan masuk dan status pembayaran terkini
              </p>
            </div>

            <div className="xor-trx-controls">
              {/* Search in table */}
              <div className="xor-input-wrap">
                <Search size={14} className="xor-input-icon" />
                <input
                  type="text"
                  placeholder="Cari ID, pembeli, produk..."
                  value={trxSearchQuery}
                  onChange={(e) => setTrxSearchQuery(e.target.value)}
                  className="xor-search-input"
                />
              </div>

              {/* Status filter tabs */}
              <div className="xor-trx-filters">
                {(["Semua", "Berhasil", "Diproses", "Pending"] as const).map((st) => (
                  <button
                    key={st}
                    className={`xor-filter-btn${trxStatusFilter === st ? " is-active" : ""}`}
                    onClick={() => setTrxStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="xor-table-container">
            <table className="xor-table">
              <thead>
                <tr>
                  <th>ID Transaksi</th>
                  <th>Pelanggan</th>
                  <th>Produk / Layanan</th>
                  <th>Metode Bayar</th>
                  <th className="text-right">Nominal</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                      {trx.id}
                    </td>
                    <td className="font-medium text-slate-900 dark:text-slate-100">
                      {trx.customer}
                    </td>
                    <td>
                      <div className="xor-table-prod">
                        <span>{trx.product}</span>
                        <span className="xor-table-category">{trx.category}</span>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{trx.method}</td>
                    <td className="text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {formatIdr(trx.amount)}
                    </td>
                    <td>
                      <span
                        className={`xor-status-tag status-${trx.status.toLowerCase()}`}
                      >
                        {trx.status === "Berhasil" && <CheckCircle2 size={12} />}
                        {trx.status === "Diproses" && <RefreshCw size={12} className="animate-spin" />}
                        {trx.status === "Pending" && <Clock3 size={12} />}
                        <span>{trx.status}</span>
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {trx.time}
                    </td>
                    <td className="text-right">
                      <button
                        className="xor-detail-btn"
                        onClick={() => setSelectedTrx(trx)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      Tidak ada transaksi yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL 1: WITHDRAW / TARIK DANA */}
      {showWithdrawModal && (
        <div
          className="xor-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWithdrawModal(false);
          }}
        >
          <div className="xor-modal-card" role="dialog" aria-modal="true">
            <div className="xor-modal-header">
              <div>
                <h3 className="xor-modal-title">Tarik Saldo Instan</h3>
                <p className="xor-modal-sub">
                  Pencairan saldo ke rekening bank nasional / e-wallet
                </p>
              </div>
              <button
                className="xor-close-btn"
                onClick={() => setShowWithdrawModal(false)}
                aria-label="Tutup form penarikan"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="xor-modal-form">
              <div className="xor-balance-summary">
                <span>Saldo Dapat Ditarik Saat Ini</span>
                <strong className="font-mono tabular-nums">{formatIdr(saldoTersedia)}</strong>
              </div>

              <div className="xor-form-group">
                <label className="xor-form-label">Nominal Penarikan (Rp)</label>
                <div className="xor-form-input-wrap">
                  <span className="xor-input-prefix">Rp</span>
                  <input
                    type="number"
                    min="50000"
                    max={saldoTersedia}
                    step="10000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="xor-form-input font-mono tabular-nums"
                  />
                </div>
                <div className="xor-quick-amounts">
                  {[250000, 500000, 1000000, 2500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="xor-chip-btn"
                      onClick={() => setWithdrawAmount(String(Math.min(amt, saldoTersedia)))}
                    >
                      {formatIdr(amt)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="xor-chip-btn"
                    onClick={() => setWithdrawAmount(String(saldoTersedia))}
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>

              <div className="xor-grid-two">
                <div className="xor-form-group">
                  <label className="xor-form-label">Bank / E-Wallet Tujuan</label>
                  <select
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    className="xor-form-select"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="SeaBank">SeaBank</option>
                    <option value="GoPay">GoPay (0813-7010-1295)</option>
                    <option value="DANA">DANA (0813-7010-1295)</option>
                  </select>
                </div>

                <div className="xor-form-group">
                  <label className="xor-form-label">Nomor Rekening</label>
                  <input
                    type="text"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    required
                    className="xor-form-input font-mono"
                  />
                </div>
              </div>

              <div className="xor-payout-notice">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Bebas biaya admin (Promo Xoftware Payout). Dana masuk ke rekening dalam 1-5 menit.
                </span>
              </div>

              <div className="xor-modal-footer">
                <button
                  type="button"
                  className="xor-btn-secondary"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawSubmitting || Number(withdrawAmount) > saldoTersedia}
                  className="xor-btn-primary"
                >
                  {withdrawSubmitting ? "Memproses Pencairan..." : "Konfirmasi Tarik Dana"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PENGUMUMAN */}
      {selectedAnnouncement && (
        <div
          className="xor-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAnnouncement(null);
          }}
        >
          <div className="xor-modal-card max-w-xl" role="dialog" aria-modal="true">
            <div className="xor-modal-header">
              <div>
                <span className="xor-modal-kicker">{selectedAnnouncement.category}</span>
                <h3 className="xor-modal-title">{selectedAnnouncement.title}</h3>
                <p className="xor-modal-sub font-mono">{selectedAnnouncement.createdAt}</p>
              </div>
              <button
                className="xor-close-btn"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Tutup detail pengumuman"
              >
                <X size={18} />
              </button>
            </div>

            <div className="xor-modal-body prose dark:prose-invert">
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                {selectedAnnouncement.message}
              </p>
            </div>

            <div className="xor-modal-footer justify-between">
              {!selectedAnnouncement.is_read ? (
                <button
                  type="button"
                  className="xor-btn-primary"
                  onClick={() => markAnnouncementRead(selectedAnnouncement.id)}
                >
                  <Check size={14} />
                  <span>Tandai Sudah Dibaca</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Check size={14} /> Telah Dibaca
                </span>
              )}
              <button
                type="button"
                className="xor-btn-secondary"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INVOICE / DETAIL TRANSAKSI */}
      {selectedTrx && (
        <div
          className="xor-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTrx(null);
          }}
        >
          <div className="xor-modal-card max-w-md" role="dialog" aria-modal="true">
            <div className="xor-modal-header">
              <div>
                <h3 className="xor-modal-title">Rincian Transaksi</h3>
                <p className="xor-modal-sub font-mono">{selectedTrx.id}</p>
              </div>
              <button
                className="xor-close-btn"
                onClick={() => setSelectedTrx(null)}
                aria-label="Tutup detail transaksi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="xor-invoice-receipt">
              <div className="xor-inv-row">
                <span className="xor-inv-label">Pelanggan</span>
                <span className="xor-inv-val font-semibold">{selectedTrx.customer}</span>
              </div>
              <div className="xor-inv-row">
                <span className="xor-inv-label">Produk / Layanan</span>
                <span className="xor-inv-val">{selectedTrx.product}</span>
              </div>
              <div className="xor-inv-row">
                <span className="xor-inv-label">Kategori</span>
                <span className="xor-inv-val">{selectedTrx.category}</span>
              </div>
              <div className="xor-inv-row">
                <span className="xor-inv-label">Metode Pembayaran</span>
                <span className="xor-inv-val">{selectedTrx.method}</span>
              </div>
              <div className="xor-inv-row">
                <span className="xor-inv-label">Waktu Transaksi</span>
                <span className="xor-inv-val font-mono">{selectedTrx.time}</span>
              </div>
              <div className="xor-inv-divider" />
              <div className="xor-inv-row font-bold text-base">
                <span>Total Bayar</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {formatIdr(selectedTrx.amount)}
                </span>
              </div>
              <div className="xor-inv-row">
                <span className="xor-inv-label">Status Penyelesaian</span>
                <span className={`xor-status-tag status-${selectedTrx.status.toLowerCase()}`}>
                  {selectedTrx.status}
                </span>
              </div>
            </div>

            <div className="xor-modal-footer">
              <button
                type="button"
                className="xor-btn-secondary"
                onClick={() => {
                  setToast(`Struk untuk ${selectedTrx.id} dicetak`);
                  setSelectedTrx(null);
                }}
              >
                <Download size={14} />
                <span>Unduh Bukti Transaksi</span>
              </button>
              <button
                type="button"
                className="xor-btn-primary"
                onClick={() => setSelectedTrx(null)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QRIS ETALASE TOKO */}
      {showQrModal && (
        <div
          className="xor-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQrModal(false);
          }}
        >
          <div className="xor-modal-card max-w-sm text-center" role="dialog" aria-modal="true">
            <div className="xor-modal-header text-left">
              <div>
                <h3 className="xor-modal-title">QRIS Resmi Toko Digital</h3>
                <p className="xor-modal-sub">Scan untuk bayar atau kunjungi toko</p>
              </div>
              <button
                className="xor-close-btn"
                onClick={() => setShowQrModal(false)}
                aria-label="Tutup QRIS modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="xor-qr-display-box">
              <div className="xor-qr-frame">
                <QrCode size={180} className="mx-auto text-slate-900" />
              </div>
              <div className="xor-qr-meta">
                <strong>NMID: ID1020394829102</strong>
                <p>XOFTWARE / RUANG DIGITAL STORE</p>
              </div>
            </div>

            <div className="xor-modal-footer justify-center">
              <button
                type="button"
                className="xor-btn-primary w-full"
                onClick={() => {
                  setToast("QRIS Toko siap diunduh");
                  setShowQrModal(false);
                }}
              >
                <Download size={14} />
                <span>Unduh Gambar QRIS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: GLOBAL SEARCH (CTRL+K) */}
      {showSearchModal && (
        <div
          className="xor-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSearchModal(false);
          }}
        >
          <div className="xor-modal-card max-w-lg" role="dialog" aria-modal="true">
            <div className="xor-search-modal-header">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Cari menu, transaksi, atau bantuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="xor-search-modal-input"
              />
              <button
                className="xor-close-btn"
                onClick={() => setShowSearchModal(false)}
                aria-label="Tutup pencarian"
              >
                <X size={18} />
              </button>
            </div>

            <div className="xor-search-modal-results">
              <div className="xor-search-category">Pintasan Cepat</div>
              <button
                className="xor-search-item"
                onClick={() => {
                  setShowWithdrawModal(true);
                  setShowSearchModal(false);
                }}
              >
                <HandCoins size={16} />
                <span>Tarik Saldo Instan</span>
              </button>
              <button
                className="xor-search-item"
                onClick={() => {
                  setShowQrModal(true);
                  setShowSearchModal(false);
                }}
              >
                <QrCode size={16} />
                <span>Tampilkan QRIS Toko</span>
              </button>
              <button
                className="xor-search-item"
                onClick={() => {
                  setActiveKey("product");
                  setActiveLabel("Manajemen Produk");
                  setShowSearchModal(false);
                }}
              >
                <Package size={16} />
                <span>Manajemen Produk (128 SKU)</span>
              </button>
              <button
                className="xor-search-item"
                onClick={() => {
                  setActiveKey("transaction");
                  setActiveLabel("Transaksi");
                  setShowSearchModal(false);
                }}
              >
                <Receipt size={16} />
                <span>Riwayat Transaksi (1.284 Data)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="xor-toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
