import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Boxes,
  Bot,
  CalendarDays,
  CalendarRange,
  Clock3,
  Download,
  ExternalLink,
  Globe2,
  HandCoins,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Megaphone,
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

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Product", icon: Package },
  { label: "User", icon: Users },
  { label: "Transaksi", icon: Receipt },
  { label: "Unduh Data", icon: Download },
  { label: "Tarik Penghasilan", icon: HandCoins },
  { label: "Bot", icon: Bot },
  { label: "PPOB", icon: Smartphone },
  { label: "SMM", icon: ShareIcon },
  { label: "Web App", icon: Settings2 },
  { label: "Layanan Domain", icon: Globe2 },
  { label: "Ticket", icon: Ticket },
  { label: "Pengaturan", icon: Settings2 },
];

function ShareIcon() {
  return <ArrowLeftRight aria-hidden="true" />;
}

const announcementSeed: Announcement[] = [
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

const metricGroups = {
  saldo: [
    { title: "Saldo Tersedia", value: "Rp 8.472.500", icon: WalletIcon },
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

function WalletIcon() {
  return <HandCoins aria-hidden="true" />;
}

const dailyLine = "26,119 86,92 146,106 206,61 266,78 326,42 386,56 446,26 506,38";
const monthlyLine = "26,104 126,81 226,96 326,52 426,67 526,29";

export function Current() {
  const [metricTab, setMetricTab] = useState<keyof typeof metricGroups>("saldo");
  const [range, setRange] = useState<"daily" | "monthly">("daily");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [announcements, setAnnouncements] = useState(announcementSeed);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const unread = announcements.filter((item) => !item.is_read).length;
  const markRead = () => {
    if (!selected) return;
    setAnnouncements((items) =>
      items.map((item) => (item.id === selected.id ? { ...item, is_read: true } : item)),
    );
    setSelected({ ...selected, is_read: true });
  };

  return (
    <div className={`xoft-current${isDark ? " is-dark" : ""}`}>
      <header className="xoc-topbar">
        <button
          className="xoc-icon-button xoc-menu-toggle"
          aria-label="Buka menu samping"
          onClick={() => {
            if (window.matchMedia("(max-width: 560px)").matches) setMobileOpen(true);
            else setCollapsed((value) => !value);
          }}
        >
          <Menu size={18} />
        </button>
        <div className="xoc-brand"><span className="xoc-mark">X</span><span>Xoftware</span></div>
        <span className="xoc-pagetitle">{activePage}</span>
        <div className="xoc-top-actions">
          <span className="xoc-top-clock">{clock} WIB</span>
          <button className="xoc-icon-button" aria-label="Ganti tema" onClick={() => setIsDark((value) => !value)}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="xoc-icon-button" aria-label="Buka pengumuman" onClick={() => document.getElementById("xoc-announcement-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            <Bell size={17} />
          </button>
          <span className="xoc-avatar" aria-label="Akun owner">U</span>
        </div>
      </header>
      {mobileOpen && <button className="xoc-mobile-backdrop" aria-label="Tutup menu samping" onClick={() => setMobileOpen(false)} />}
      <aside className={`xoc-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`} aria-label="Navigasi owner">
        <div className="xoc-nav-caption">Workspace</div>
        <nav className="xoc-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="xoc-nav-button"
              aria-current={activePage === label ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              onClick={() => {
                setActivePage(label);
                setMobileOpen(false);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className={`xoc-content${collapsed ? " is-collapsed" : ""}`}>
        <section className="xoc-welcome">
          <p className="xoc-kicker">PUSAT KENDALI / OWNER</p>
          <h1>Halo Owner</h1>
          <p>“Kesuksesan bukan soal keberuntungan, tapi soal konsistensi.”</p>
          <p>Waktu sekarang: <strong>{clock} WIB</strong></p>
        </section>

        <div className="xoc-workspace">
          <div className="xoc-stack">
            <section className="xoc-card" aria-label="Ringkasan dashboard">
              <div className="xoc-card-body">
                <div className="xoc-tabs" role="tablist" aria-label="Pilih ringkasan dashboard">
                  {(["saldo", "produk", "pendapatan"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`xoc-tab${metricTab === tab ? " is-active" : ""}`}
                      role="tab"
                      aria-selected={metricTab === tab}
                      onClick={() => setMetricTab(tab)}
                    >
                      {tab === "saldo" ? "Saldo" : tab === "produk" ? "Produk" : "Pendapatan"}
                    </button>
                  ))}
                </div>
                <div className="xoc-stat-grid">
                  {metricGroups[metricTab].map(({ title, value, icon: Icon }) => (
                    <article className="xoc-stat" key={title}>
                      <span className="xoc-stat-icon"><Icon aria-hidden="true" /></span>
                      <span>
                        <span className="xoc-stat-label">{title}</span>
                        <span className="xoc-stat-value">{value}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="xoc-chart-title">
              <div className="xoc-section-heading">
                <h2 id="xoc-chart-title">{range === "daily" ? "Grafik Harian (7 Hari)" : "Grafik Bulanan (3 Bulan)"}</h2>
                <div className="xoc-tabs" role="tablist" aria-label="Rentang grafik transaksi">
                  <button className={`xoc-range${range === "daily" ? " is-active" : ""}`} role="tab" aria-selected={range === "daily"} onClick={() => setRange("daily")}>7 Hari</button>
                  <button className={`xoc-range${range === "monthly" ? " is-active" : ""}`} role="tab" aria-selected={range === "monthly"} onClick={() => setRange("monthly")}>3 Bulan</button>
                </div>
              </div>
              <div className="xoc-card xoc-card-body">
                <svg className="xoc-chart-svg" viewBox="0 0 560 220" role="img" aria-label={`Grafik transaksi ${range === "daily" ? "7 hari" : "3 bulan"}: berhasil, pending, gagal`}>
                  {[35, 80, 125, 170].map((y) => <line key={y} x1="20" y1={y} x2="540" y2={y} stroke="#e9eaf1" strokeDasharray="3 5" />)}
                  <polyline points={range === "daily" ? dailyLine : monthlyLine} fill="none" stroke="#575bd0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={range === "daily" ? "26,157 86,145 146,151 206,126 266,143 326,118 386,128 446,111 506,121" : "26,154 126,137 226,146 326,128 426,136 526,112"} fill="none" stroke="#d19a48" strokeWidth="2.5" strokeLinecap="round" />
                  <polyline points={range === "daily" ? "26,184 86,179 146,188 206,176 266,184 326,171 386,178 446,168 506,175" : "26,188 126,179 226,185 326,173 426,179 526,169"} fill="none" stroke="#c96b73" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="xoc-chart-legend">Berhasil · Pending · Gagal</div>
              </div>
            </section>

            <section aria-labelledby="xoc-public-title">
              <div className="xoc-section-heading"><h2 id="xoc-public-title">Halaman Publik</h2></div>
              <div className="xoc-card xoc-card-body">
                <a className="xoc-public-link" href="https://ruangdigital.xoft.store" target="_blank" rel="noreferrer">
                  <Globe2 size={15} /> ruangdigital.xoft.store <ExternalLinkIcon />
                </a>
              </div>
            </section>
          </div>

          <aside className="xoc-card" id="xoc-announcement-panel" aria-labelledby="xoc-ann-title">
            <div className="xoc-card-body">
              <div className="xoc-section-heading">
                <h2 id="xoc-ann-title"><Megaphone size={16} /> Pengumuman</h2>
                {unread > 0 && <span className="xoc-unread-count">{unread} belum dibaca</span>}
              </div>
              {announcements.length ? (
                <>
                  <div className="xoc-announcement-list">
                    {announcements.map((item) => (
                      <button className="xoc-announcement" key={item.id} onClick={() => setSelected(item)}>
                        <span className="xoc-ann-title">{item.title}</span>
                        <span className="xoc-ann-date">{item.createdAt}</span>
                        {!item.is_read && <span className="xoc-unread">Belum dibaca</span>}
                      </button>
                    ))}
                  </div>
                  <p className="xoc-hint">Pilih judul untuk melihat detail</p>
                </>
              ) : <div className="xoc-empty">Belum ada pengumuman.</div>}
            </div>
          </aside>
        </div>
      </main>
      <span className="xo-preview-label">DATA CONTOH · CURRENT</span>

      {selected && (
        <div className="xoc-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="xoc-dialog" role="dialog" aria-modal="true" aria-labelledby="xoc-dialog-title">
            <div className="xoc-dialog-head">
              <h2 id="xoc-dialog-title">{selected.title}</h2>
              <button className="xoc-icon-button" aria-label="Tutup detail" onClick={() => setSelected(null)}><X size={17} /></button>
            </div>
            <div className="xoc-dialog-copy">{selected.message}</div>
            <div className="xoc-dialog-actions">
              {!selected.is_read && <button className="xoc-action primary" onClick={markRead}>Tandai sudah dibaca</button>}
              <button className="xoc-action" onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ExternalLinkIcon() {
  return <ExternalLink size={14} aria-hidden="true" />;
}
