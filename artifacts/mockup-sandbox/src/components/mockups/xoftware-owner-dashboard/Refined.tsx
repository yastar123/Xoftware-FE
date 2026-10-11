import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Boxes,
  Bot,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Globe2,
  HandCoins,
  LayoutDashboard,
  LockKeyhole,
  Megaphone,
  Menu,
  Moon,
  Package,
  Receipt,
  Settings2,
  Smartphone,
  Sun,
  Ticket,
  Users,
  X,
} from "lucide-react";
import "./_group.css";

type Announcement = {
  id: number;
  title: string;
  createdAt: string;
  message: string;
  is_read: boolean;
};

type Metric = { title: string; value: string; icon: typeof HandCoins };
type MetricTab = "saldo" | "produk" | "pendapatan";
type GraphRange = "daily" | "monthly";

const navigation = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "product", label: "Product", icon: Package },
  { key: "user", label: "User", icon: Users },
  { key: "transaction", label: "Transaksi", icon: Receipt },
  { key: "unduh-data", label: "Unduh Data", icon: Download },
  { key: "withdraw", label: "Tarik Penghasilan", icon: HandCoins },
  { key: "bot", label: "Bot", icon: Bot },
  { key: "ppob", label: "PPOB", icon: Smartphone },
  { key: "smm", label: "SMM", icon: ChartNoAxesCombined },
  { key: "webapp", label: "Pengaturan Web App", icon: Settings2 },
  { key: "domain-provider", label: "Layanan Domain", icon: Globe2 },
  { key: "ticket", label: "Ticket", icon: Ticket },
  { key: "setting", label: "Pengaturan", icon: Settings2 },
];

const metrics: Record<MetricTab, Metric[]> = {
  saldo: [
    { title: "Saldo Tersedia", value: "Rp 8.472.500", icon: HandCoins },
    { title: "Saldo Pending", value: "Rp 684.000", icon: Clock3 },
    { title: "Saldo Terkunci", value: "Rp 125.000", icon: LockKeyhole },
    { title: "Saldo Keluar", value: "Rp 2.150.000", icon: ArrowDownToLine },
  ],
  produk: [
    { title: "Jumlah Produk", value: "128", icon: Boxes },
    { title: "Jumlah Transaksi", value: "1.284", icon: ArrowLeftRight },
  ],
  pendapatan: [
    { title: "Pendapatan Harian", value: "Rp 1.248.500", icon: CalendarDays },
    { title: "Pendapatan Bulanan", value: "Rp 24.876.000", icon: CalendarRange },
  ],
};

const sampleAnnouncements: Announcement[] = [
  {
    id: 101,
    title: "Pembaruan proses pencairan saldo",
    createdAt: "18 Jun 2025 · 09.20 WIB",
    message:
      "Jadwal pemrosesan pencairan diperbarui. Permintaan yang masuk sebelum pukul 15.00 WIB diproses pada hari kerja yang sama.",
    is_read: false,
  },
  {
    id: 102,
    title: "Pemeliharaan sistem transaksi",
    createdAt: "16 Jun 2025 · 14.05 WIB",
    message:
      "Pemeliharaan terjadwal dilakukan pada 22 Juni pukul 01.00–02.00 WIB. Beberapa transaksi dapat mengalami jeda singkat.",
    is_read: true,
  },
  {
    id: 103,
    title: "Informasi verifikasi rekening",
    createdAt: "12 Jun 2025 · 11.32 WIB",
    message:
      "Pastikan nama pemilik rekening sesuai dengan data akun sebelum mengajukan pencairan saldo.",
    is_read: true,
  },
];

const dailyChart = {
  labels: ["12 Jun", "13 Jun", "14 Jun", "15 Jun", "16 Jun", "17 Jun", "18 Jun"],
  success: "32,139 108,106 184,117 260,68 336,84 412,48 488,63 564,34",
  pending: "32,174 108,157 184,164 260,139 336,151 412,126 488,138 564,116",
  failed: "32,195 108,188 184,197 260,182 336,191 412,178 488,184 564,171",
};

const monthlyChart = {
  labels: ["Apr", "Mei", "Jun"],
  success: "70,135 230,101 390,111 550,41",
  pending: "70,170 230,153 390,161 550,126",
  failed: "70,194 230,185 390,191 550,174",
};

async function requestOwner(action: "getAllAnnouncements"): Promise<{ data: Announcement[] }>;
async function requestOwner(action: "getAnnouncement", id: number): Promise<{ data: Announcement | undefined }>;
async function requestOwner(action: "setReadAnnouncements", id: number): Promise<{ data: { id: number | undefined; is_read: true } }>;
async function requestOwner(
  action: "getAllAnnouncements" | "getAnnouncement" | "setReadAnnouncements",
  id?: number,
): Promise<{ data: Announcement[] | Announcement | { id: number | undefined; is_read: true } | undefined }> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  if (action === "getAllAnnouncements") return { data: sampleAnnouncements.map((item) => ({ ...item })) };
  if (action === "getAnnouncement") return { data: sampleAnnouncements.find((item) => item.id === id) };
  return { data: { id, is_read: true } };
}

function formatClock() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function OperationsChart({ range }: { range: GraphRange }) {
  const data = range === "daily" ? dailyChart : monthlyChart;
  const ticks = range === "daily" ? data.labels : data.labels;
  const positions =
    range === "daily" ? [32, 108, 184, 260, 336, 412, 488, 564] : [70, 230, 390, 550];

  return (
    <div className="xor-chart-wrap">
      <svg className="xor-chart" viewBox="0 0 596 224" role="img" aria-label={`Ringkasan transaksi ${range === "daily" ? "7 hari" : "3 bulan"} untuk transaksi berhasil, pending, dan gagal`}>
        {[34, 78, 122, 166].map((y) => <line key={y} x1="26" y1={y} x2="578" y2={y} stroke="#e9eaf0" strokeDasharray="3 5" />)}
        <polyline points={data.success} fill="none" stroke="#555ac4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={data.pending} fill="none" stroke="#d4a354" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={data.failed} fill="none" stroke="#c56f78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {ticks.map((tick, index) => {
          const x = range === "daily" ? positions[index + 1] : positions[index];
          return <text key={tick} x={x} y="207" fill="#9094a5" fontSize="9" textAnchor="middle">{tick}</text>;
        })}
      </svg>
      <div className="xor-legend" aria-hidden="true">
        <span><i style={{ background: "#555ac4" }} />Berhasil</span>
        <span><i style={{ background: "#d4a354" }} />Pending</span>
        <span><i style={{ background: "#c56f78" }} />Gagal</span>
      </div>
    </div>
  );
}

export function Refined() {
  const [metricTab, setMetricTab] = useState<MetricTab>("saldo");
  const [graphRange, setGraphRange] = useState<GraphRange>("daily");
  const [collapsed, setCollapsed] = useState(() => window.matchMedia("(max-width: 820px)").matches);
  const [railHovered, setRailHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeKey, setActiveKey] = useState("dashboard");
  const [activeLabel, setActiveLabel] = useState("Dashboard");
  const [clock, setClock] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementState, setAnnouncementState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [toast, setToast] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const unreadCount = useMemo(() => announcements.filter((item) => !item.is_read).length, [announcements]);
  const expanded = !collapsed || railHovered;

  useEffect(() => {
    const update = () => setClock(formatClock());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAnnouncements = async () => {
      try {
        const response = await requestOwner("getAllAnnouncements");
        if (cancelled) return;
        setAnnouncements(response.data);
        setAnnouncementState(response.data.length ? "ready" : "empty");
      } catch {
        if (!cancelled) setAnnouncementState("error");
      }
    };
    void loadAnnouncements();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selected) {
      closeButtonRef.current?.focus();
      const handleDialogKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setSelected(null);
        if (event.key === "Tab" && dialogRef.current) {
          const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      };
      window.addEventListener("keydown", handleDialogKey);
      return () => window.removeEventListener("keydown", handleDialogKey);
    }
    openerRef.current?.focus();
    return undefined;
  }, [selected?.id]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openAnnouncement = async (item: Announcement, event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    try {
      const response = await requestOwner("getAnnouncement", item.id);
      setSelected({ ...(response.data || item), is_read: item.is_read });
    } catch {
      setToast("Detail pengumuman belum dapat dimuat.");
    }
  };

  const markAsRead = async () => {
    if (!selected?.id) return;
    try {
      await requestOwner("setReadAnnouncements", selected.id);
      setAnnouncements((items) => items.map((item) => item.id === selected.id ? { ...item, is_read: true } : item));
      setSelected((item) => item ? { ...item, is_read: true } : item);
      setToast("Pengumuman ditandai sudah dibaca.");
    } catch {
      setToast("Pengumuman belum dapat diperbarui.");
    }
  };

  const selectNavigation = (key: string, label: string) => {
    setActiveKey(key);
    setActiveLabel(label);
    setMobileOpen(false);
  };

  const openSidebar = () => {
    if (window.matchMedia("(max-width: 560px)").matches) setMobileOpen(true);
    else setCollapsed((value) => !value);
  };

  return (
    <div className={`xoft-refined${isDark ? " is-dark" : ""}`}>
      <header className="xor-appbar">
        <button className="xor-toggle" aria-label={mobileOpen ? "Tutup menu samping" : "Buka atau ciutkan menu samping"} aria-expanded={mobileOpen || !collapsed} onClick={openSidebar}>
          <Menu size={18} />
        </button>
        <div className="xor-wordmark" aria-label="Xoftware Owner panel">
          <span className="xor-mark">X</span>
          <span><strong>Xoftware</strong><small>Owner panel</small></span>
        </div>
        <span className="xor-divider" />
        <span className="xor-page-name">{activeLabel}</span>
        <div className="xor-top-spacer" />
        <span className="xor-clock">{clock} WIB</span>
        <button className="xor-round-button" aria-label="Ganti tema terang atau gelap" onClick={() => setIsDark((value) => !value)}>
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="xor-round-button" aria-label="Lihat pengumuman" onClick={() => document.getElementById("xor-announcements")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          <Bell size={17} />
        </button>
        <button className="xor-user" aria-label="Buka menu akun" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}>U</button>
        {accountOpen && (
          <div className="xor-account-menu">
            <strong>Owner</strong>
            <span>Menu akun</span>
            <button onClick={() => { setAccountOpen(false); setToast("Keluar tersedia saat membuka aplikasi owner."); }}>Keluar</button>
          </div>
        )}
      </header>

      {mobileOpen && <button className="xor-mobile-backdrop" aria-label="Tutup menu samping" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`xor-sidebar${!expanded ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Navigasi owner"
        onMouseEnter={() => { if (collapsed && !window.matchMedia("(max-width: 820px)").matches) setRailHovered(true); }}
        onMouseLeave={() => setRailHovered(false)}
        onFocus={() => { if (collapsed && !window.matchMedia("(max-width: 820px)").matches) setRailHovered(true); }}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setRailHovered(false); }}
      >
        <div className="xor-workspace-label">Workspace</div>
        <nav className="xor-nav">
          {navigation.map(({ key, label, icon: Icon }, index) => (
            <Fragment key={key}>
            {index === 6 && <div className="xor-nav-separator" aria-hidden="true" />}
            <button
                type="button"
                title={!expanded ? label : undefined}
                aria-label={!expanded ? label : undefined}
                aria-current={activeKey === key ? "page" : undefined}
                onClick={() => selectNavigation(key, label)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            </Fragment>
          ))}
        </nav>
        <div className="xor-sidebar-foot">Xoftware · Owner workspace</div>
      </aside>

      <main className={`xor-content${!expanded ? " is-collapsed" : ""}`}>
        <div className="xor-heading-row">
          <div>
            <p className="xor-eyebrow"><span className="xor-live-dot" /> Pusat kendali / owner</p>
            <h1>Halo Owner</h1>
            <p>Ringkasan operasional akun dan transaksi Anda.</p>
          </div>
          <span className="xor-time">Waktu sekarang<br /><strong>{clock} WIB</strong></span>
        </div>

        <div className="xor-layout">
          <div className="xor-primary">
            <section className="xor-panel" aria-labelledby="xor-metrics-title">
              <div className="xor-panel-inner">
                <div className="xor-panel-header">
                  <div>
                    <h2 className="xor-panel-title" id="xor-metrics-title">Ringkasan operasional</h2>
                    <p className="xor-panel-caption">Pantau posisi saldo, produk, dan pendapatan.</p>
                  </div>
                </div>
                <div className="xor-tablist" role="tablist" aria-label="Pilih ringkasan dashboard">
                  {(["saldo", "produk", "pendapatan"] as const).map((tab) => (
                    <button key={tab} role="tab" aria-selected={metricTab === tab} onClick={() => setMetricTab(tab)}>
                      {tab === "saldo" ? "Saldo" : tab === "produk" ? "Produk" : "Pendapatan"}
                    </button>
                  ))}
                </div>
                <div className="xor-metrics" role="tabpanel">
                  {metrics[metricTab].map(({ title, value, icon: Icon }) => (
                    <article className="xor-metric" key={title}>
                      <span className="xor-metric-icon"><Icon aria-hidden="true" /></span>
                      <span>
                        <span className="xor-metric-label">{title}</span>
                        <span className="xor-metric-value">{value}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="xor-public" aria-label="Halaman publik">
              <span className="xor-public-copy">
                <strong>Halaman Publik</strong>
                <small>Etalase digital Anda</small>
              </span>
              <a className="xor-public-link" href="https://ruangdigital.xoft.store" target="_blank" rel="noreferrer">
                ruangdigital.xoft.store <ExternalLink aria-hidden="true" />
              </a>
            </section>

            <section className="xor-panel" aria-labelledby="xor-graph-title">
              <div className="xor-panel-inner">
                <div className="xor-graph-header">
                  <div>
                    <h2 className="xor-panel-title" id="xor-graph-title">{graphRange === "daily" ? "Grafik Harian" : "Grafik Bulanan"}</h2>
                    <p className="xor-panel-caption">Pergerakan status transaksi</p>
                  </div>
                  <div className="xor-ranges" role="group" aria-label="Rentang grafik transaksi">
                    <button aria-pressed={graphRange === "daily"} onClick={() => setGraphRange("daily")}>7 Hari</button>
                    <button aria-pressed={graphRange === "monthly"} onClick={() => setGraphRange("monthly")}>3 Bulan</button>
                  </div>
                </div>
                <OperationsChart range={graphRange} />
              </div>
            </section>
          </div>

          <aside className="xor-side-column">
            <section className="xor-panel" id="xor-announcements" aria-labelledby="xor-ann-title">
              <div className="xor-panel-inner">
                <div className="xor-panel-header">
                  <div className="xor-ann-head">
                    <span className="xor-ann-icon"><Megaphone aria-hidden="true" /></span>
                    <span>
                      <h2 className="xor-panel-title" id="xor-ann-title">Pengumuman</h2>
                      <p className="xor-panel-caption">Informasi terbaru platform</p>
                    </span>
                  </div>
                  {unreadCount > 0 && <span className="xor-unread-count">{unreadCount} belum dibaca</span>}
                </div>
                {announcementState === "loading" ? (
                  <div className="xor-skeleton" aria-label="Memuat pengumuman" aria-busy="true"><span /><span /><span /></div>
                ) : announcementState === "error" ? (
                  <div className="xor-error" role="alert">Gagal memuat pengumuman. Silakan coba lagi nanti.</div>
                ) : announcementState === "empty" || announcements.length === 0 ? (
                  <div className="xor-empty">Belum ada pengumuman.<br />Informasi baru akan muncul di sini.</div>
                ) : (
                  <>
                    <div className="xor-ann-list">
                      {announcements.map((item) => (
                        <button
                          className={`xor-announcement${item.is_read ? " is-read" : ""}`}
                          key={item.id}
                          onClick={(event) => { void openAnnouncement(item, event); }}
                        >
                          <span className={`xor-ann-dot${item.is_read ? " is-read" : ""}`} />
                          <span className="xor-ann-copy">
                            <span className="xor-ann-title">{item.title}</span>
                            <span className="xor-ann-date">{item.createdAt}</span>
                            {!item.is_read && <span className="xor-ann-status">Belum dibaca</span>}
                          </span>
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <p className="xor-ann-foot">Pilih judul untuk membaca detail pengumuman.</p>
                  </>
                )}
              </div>
            </section>
            <div className="xor-status-note">
              <ShieldIcon />
              <span>Ringkasan ini mengikuti data akun Anda. Nilai demo hanya tampil di pratinjau desain.</span>
            </div>
            <div className="xor-status-note">
              <ChartNoAxesCombined aria-hidden="true" />
              <span>Grafik menampilkan transaksi berhasil, pending, dan gagal sesuai rentang pilihan.</span>
            </div>
          </aside>
        </div>
      </main>
      <span className="xo-preview-label">DATA CONTOH · REFINED</span>

      {selected && (
        <div className="xor-dialog-cover" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="xor-dialog" role="dialog" aria-modal="true" aria-labelledby="xor-dialog-title" ref={dialogRef}>
            <div className="xor-dialog-header">
              <span>
                <h2 id="xor-dialog-title">{selected.title}</h2>
                <p>{selected.createdAt}</p>
              </span>
              <button className="xor-round-button" aria-label="Tutup detail" ref={closeButtonRef} onClick={() => setSelected(null)}><X size={17} /></button>
            </div>
            <div className="xor-dialog-content">{selected.message || "-"}</div>
            <div className="xor-dialog-actions">
              {!selected.is_read && <button className="xor-action primary" onClick={() => void markAsRead()}><Check size={14} /> Tandai sudah dibaca</button>}
              <button className="xor-action" onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="xor-toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}

function ShieldIcon() {
  return <LockKeyhole aria-hidden="true" />;
}
