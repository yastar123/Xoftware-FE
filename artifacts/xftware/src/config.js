import {
  AccountBalanceWallet,
  AdminPanelSettingsOutlined,
  SettingsInputSvideoOutlined,
  Assessment,
  AutoAwesomeOutlined,
  BalanceOutlined,
  BuildOutlined,
  Dashboard,
  DeveloperMode,
  History,
  Instagram,
  Lock,
  MonetizationOn,
  MultipleStop,
  PrecisionManufacturing,
  Savings,
  Settings,
  ShoppingCart,
  TwoWheelerOutlined,
  PeopleSharp,
  PeopleAltTwoTone,
  SettingsInputComponent,
  QrCodeScannerOutlined,
  ProductionQuantityLimitsOutlined,
  PermDeviceInformation,
  SupportAgent,
  GraphicEq,
  Announcement,
  LaptopMac,
  DomainAdd,
  Category,
  // Rounded icon variants for iconMap
  DashboardRounded,
  StoreRounded,
  PeopleAltRounded,
  ReceiptLongRounded,
  SyncAltRounded,
  PaymentsRounded,
  PhoneAndroidRounded,
  ShareRounded,
  LanguageRounded,
  SupportAgentRounded,
  SettingsRounded,
  ConfirmationNumberRounded,
  LayersRounded,
  BarChartRounded,
  AnalyticsRounded,
  PeopleRounded,
  QrCodeRounded,
  AccountBalanceRounded,
  InfoRounded,
  PaletteRounded,
  PhotoLibraryRounded,
  ContactPageRounded,
  PaymentRounded,
  CampaignRounded,
  DomainRounded,
  EmailRounded,
  LockRounded,
  CreditCardRounded,
  NotificationsRounded,
  StorefrontRounded,
  SmartToyRounded,
  VpnKeyRounded,
  // Non-Rounded fallbacks
  Store,
  PeopleAlt,
  ReceiptLong,
  SyncAlt,
  Payments,
  SmartToy,
  PhoneAndroid,
  Share,
  Language,
  ConfirmationNumber,
  Layers,
  BarChart,
  Analytics,
  People,
  QrCode,
  AccountBalance,
  Info,
  Palette,
  PhotoLibrary,
  ContactPage,
  Payment,
  Campaign,
  Domain,
  Email,
  CreditCard,
  Notifications,
  Storefront,
  Pin,
  Inventory2,
  StoreMallDirectory,
  WorkspacePremium,
  FileDownloadRounded,
  SearchRounded,
  StarRounded,
  SupervisorAccountRounded,
  WorkspacePremiumRounded,
} from '@mui/icons-material';
import { FaBlog, FaWhatsapp } from 'react-icons/fa';
import { TbBrandTelegram as IconBrandTelegram } from 'react-icons/tb';

export const iconMap = {
  DashboardRounded,
  StoreRounded,
  PeopleAltRounded,
  ReceiptLongRounded,
  SyncAltRounded,
  PaymentsRounded,
  SmartToyRounded,
  PhoneAndroidRounded,
  ShareRounded,
  LanguageRounded,
  SupportAgentRounded,
  SettingsRounded,
  ConfirmationNumberRounded,
  LayersRounded,
  BarChartRounded,
  AnalyticsRounded,
  PeopleRounded,
  QrCodeRounded,
  AccountBalanceRounded,
  InfoRounded,
  PaletteRounded,
  PhotoLibraryRounded,
  ContactPageRounded,
  PaymentRounded,
  CampaignRounded,
  DomainRounded,
  EmailRounded,
  LockRounded,
  CreditCardRounded,
  NotificationsRounded,
  StorefrontRounded,
  Category,
  Settings,
  VpnKeyRounded,
  FileDownloadRounded,
  SearchRounded,
  StarRounded,
  SupervisorAccountRounded,
  WorkspacePremiumRounded,
  // non-Rounded fallbacks
  Dashboard,
  Store,
  PeopleAlt,
  ReceiptLong,
  SyncAlt,
  Payments,
  SmartToy,
  PhoneAndroid,
  Share,
  Language,
  SupportAgent: SupportAgent,
  ConfirmationNumber,
  Layers,
  BarChart,
  Analytics,
  People,
  QrCode,
  AccountBalance,
  Info,
  Palette,
  PhotoLibrary,
  ContactPage,
  Payment,
  Campaign,
  Domain,
  DomainAdd,
  Email,
  Lock,
  Pin,
  CreditCard,
  Notifications,
  Storefront,
  StarRounded,
  // custom
  FaWhatsapp,
  TelegramIcon: IconBrandTelegram,
};

export function resolveIcon(name) {
  if (!name) return null;
  return iconMap[name] || iconMap[name.replace('Rounded', '')] || null;
}

const Config = {
  NEXT_PUBLIC_API: 'https://backend-s2.xoftware.id',
  NEXT_PUBLIC_CDN: 'https://cdn.xoftware.id',
  NEXT_PUBLIC_BLOG: 'https://blog.xoftware.id',
  NEXT_PUBLIC_DOMAIN: 'https://xoftware.id',
  siteKeyTurnStile: '0x4AAAAAACVdTwKK2g0m69oE',
  defaultLogoWText: '/icon-text.png',
  defaultBanner: '/banner.jpg',
  defaultThumbnailProduct: '/default-thumb.jpeg',
  docLink: '/docs',

  // Text for text
  homeMenuBar: [
    { title: 'Home', link: '/' },
    { title: 'Login', link: '/login' },
    { title: 'About', link: '/about-business' },
    { title: 'Term Of Us', link: '/term-of-us' },
  ],
  homeBanner: '/banner-home.png',
  homeDescBanner:
    'Xoftware is a cutting-edge platform designed to streamline the sale of digital products and premium applications. With seamless support for WhatsApp and Telegram bots, we provide an all-in-one service that includes a customizable website and integrated merchant systems. Experience the perfect blend of automation, convenience, and reliability tailored to boost your business success.',
  homeButtonBanner: ['JOIN PARTNERS', 'https://wa.me/6281370101295'],
  footerInformation: [
    {
      key: 'email',
      value: 'support.xoftwareid@gmail.com',
    },
    {
      key: 'phone',
      value: '+62 813 7010-1295',
    },
  ],
  homeJoinButton: 'https://wa.me/6281370101295',
  footerData: [
    {
      title: 'Explore',
      items: [
        { label: 'Home', link: '/' },
        { label: 'Login', link: '/login' },
        { label: 'Term of Use', link: '/term-of-us' },
      ],
    },
    {
      title: 'Information',
      items: [
        { label: 'About Business', link: '/about-business' },
        { label: 'Contact', link: 'https://wa.me/6281370101295' },
      ],
    },
  ],

  menuItemsOwner: [
    { key: 'dashboard', label: 'Dashboard', icon: 'DashboardRounded' },
    {
      key: 'product', label: 'Product', icon: 'StoreRounded', children: [
        { key: 'product-list', label: 'Manajemen Produk', icon: 'Inventory2' },
        { key: 'voucher-list', label: 'Daftar Voucher', icon: 'ConfirmationNumberRounded' },
        { key: 'product-level', label: 'Level Harga', icon: 'LayersRounded' },
        { key: 'recap-dashboard', label: 'Rekap Dashboard', icon: 'AnalyticsRounded' },
        { key: 'reseller-info', label: 'Manajemen Reseller', icon: 'SupervisorAccountRounded' },
        { key: 'seller-profile', label: 'Profile Star Seller', icon: 'WorkspacePremiumRounded' },
      ]
    },
    {
      key: 'user', label: 'User', icon: 'PeopleAltRounded', children: [
        { key: 'user-info', label: 'Informasi', icon: 'InfoRounded' },
        { key: 'user-mutation', label: 'Mutasi Saldo', icon: 'SyncAltRounded' },
      ]
    },
    {
      key: 'transaction', label: 'Transaksi', icon: 'ReceiptLongRounded', children: [
        { key: 'qris-pay', label: 'QRIS', icon: 'QrCodeRounded' },
        { key: 'mutation-pay', label: 'Mutasi QRIS', icon: 'AccountBalanceRounded' },
      ]
    },
    { key: 'unduh-data', label: 'Unduh Data', icon: 'FileDownloadRounded' },
    { key: 'withdraw', label: 'Tarik Penghasilan', icon: 'PaymentsRounded' },
    {
      key: 'bot', label: 'Bot', icon: 'SmartToyRounded', children: [
        { key: 'layanan', label: 'Info Layanan', icon: 'InfoRounded' },
        { key: 'bot-wa', label: 'Bot WhatsApp', icon: 'FaWhatsapp' },
        { key: 'bot-telegram', label: 'Bot Telegram', icon: 'TelegramIcon' },
      ]
    },
    {
      key: 'ppob', label: 'PPOB', icon: 'PhoneAndroidRounded', children: [
        { key: 'ppob-info', label: 'Information', icon: 'InfoRounded' },
        { key: 'ppob-pay', label: 'Transaction', icon: 'PhoneAndroidRounded' },
        { key: 'ppob-categories', label: 'Kategori', icon: 'Category' },
        { key: 'ppob-operators', label: 'Operator', icon: 'ViewList' },
        { key: 'ppob-vendor-preview', label: 'Preview Vendor', icon: 'FaEye' },
      ]
    },
    {
      key: 'smm', label: 'SMM', icon: 'ShareRounded', children: [
        { key: 'smm-info', label: 'Info SMM', icon: 'InfoRounded' },
        { key: 'smm-pay', label: 'SMM', icon: 'ShareRounded' },
        { key: 'smm-vendor-kategori', label: 'Kategori Service', icon: 'Category' },
        { key: 'smm-vendor-list', label: 'List Service', icon: 'SettingsIconMui' },
      ]
    },
    {
      key: 'webapp', label: 'Pengaturan Web App', icon: 'SettingsInputComponent'
    },
    {
      key: 'domain-provider', label: 'Layanan Domain', icon: 'DomainAdd', children: [
        { key: 'cari', label: 'Cari Domain', icon: 'SearchRounded' },
        { key: 'manage', label: 'Domain Aktif', icon: 'DomainRounded' },
        { key: 'billing', label: 'Billing & Transaksi', icon: 'ReceiptLongRounded' },
      ]
    },
    { key: 'ticket', label: 'Ticket', icon: 'SupportAgentRounded' },
    {
      key: 'setting', label: 'Pengaturan', icon: 'SettingsRounded', children: [
        { key: 'account-security', label: 'Akun & Keamanan', icon: 'SupervisorAccountRounded' },
        { key: 'payment-finance', label: 'Pembayaran & Keuangan', icon: 'AccountBalanceRounded' },
        { key: 'notification', label: 'Notifikasi', icon: 'NotificationsRounded' },
        { key: 'integration-api', label: 'Integrasi & API', icon: 'WorkspacePremiumRounded' },
      ]
    },
  ],

  // Footer
  footerDesc: 'Xoftware Shop is the ultimate solution for selling digital products and premium applications. Established in 2020, we’ve been helping businesses succeed in the digital marketplace.',
  // eslint-disable-next-line react/jsx-key
  footerSocialMedia: [[<Instagram />, '#']],
  footerPageFollow: [
    ['Home', '/'],
    ['About Information', '/about-business'],
    ['Term Of Us', '/term-of-us'],
  ],
  footerAboutMe: [
    ['Contact WhatsApp', 'https://wa.me/6281370101295'],
    ['Report Bugs', 'https://forms.gle/6TQKiTzLzUNkHPPu9'],
  ],

  themeColor: {
    primary: '#6366F1',
    secondary: '#64748B',
    backgroundLight: '#F8FAFC',
    backgroundDark: '#0F172A',
    paperLight: '#FFFFFF',
    paperDark: '#1E293B',
    textLight: '#0F172A',
    textDark: '#F1F5F9',
    customColor: '#6366F1',
  },
  cookies: `Kami menggunakan cookie dan teknologi serupa untuk membantu Situs berfungsi dengan baik, meningkatkan keamanan, serta memahami bagaimana layanan digunakan.

Apa itu cookie?
Cookie adalah file teks kecil yang disimpan pada perangkat Anda (misalnya browser) saat Anda mengakses Situs. Cookie membantu mengingat preferensi dan aktivitas tertentu.

Jenis cookie yang kami gunakan
a. Cookie yang sangat diperlukan (Strictly Necessary): Dibutuhkan agar Situs dapat berjalan, termasuk fitur keamanan dan manajemen sesi.
b. Cookie fungsional (Functional): Mengingat preferensi seperti pilihan bahasa atau pengaturan tampilan.
c. Cookie analitik (Analytics): Membantu kami memahami penggunaan Situs (misalnya halaman yang sering dibuka) untuk peningkatan layanan.
d. Cookie pihak ketiga (Third-Party): Beberapa layanan terintegrasi (misalnya analitik, keamanan, atau integrasi layanan) dapat menempatkan cookie sesuai kebijakan mereka.

Cara cookie dikumpulkan
Cookie dapat dikumpulkan saat Anda:
a. Mengunjungi halaman di Situs;
b. Login atau menggunakan fitur yang membutuhkan sesi;
c. Mengisi formulir atau melakukan interaksi di halaman;
d. Menggunakan layanan yang memuat komponen pihak ketiga (misalnya script analitik atau keamanan).

Data apa yang dapat diproses melalui cookie?
Tergantung jenis cookie, informasi yang dapat diproses mencakup:
a. Identitas sesi (session ID), status login, dan pengaturan preferensi;
b. Informasi teknis seperti tipe perangkat, browser, alamat IP (dapat diproses sesuai kebutuhan keamanan);
c. Aktivitas penggunaan secara agregat untuk analitik.

Pengelolaan & persetujuan cookie
Anda dapat mengatur cookie melalui pengaturan browser untuk:
a. Menolak semua cookie atau sebagian cookie;
b. Menghapus cookie yang sudah tersimpan;
c. Mengaktifkan notifikasi saat cookie dipasang.
Perlu diketahui, menonaktifkan cookie tertentu dapat memengaruhi fungsi dan pengalaman penggunaan Situs.

Perubahan kebijakan
Kami dapat memperbarui Kebijakan Cookie ini dari waktu ke waktu. Perubahan akan ditampilkan pada halaman ini.`,
  privacy: `
DEFINISI  
Sepanjang tidak didefinisikan lain sebagaimana di bawah ini, maka setiap istilah yang telah diberikan definisi dalam Syarat Penggunaan akan berlaku pula atas Kebijakan Privasi ini:  
“Aplikasi” berarti piranti lunak dan/atau situs portal yang dikembangkan oleh PT Xoftware Digital Indonesia untuk (i) menyediakan Layanan kepada Pengguna; (ii) memungkinkan Pengguna menemukan layanan yang disediakan oleh pihak ketiga; dan/atau fungsi lainnya yang diperlukan untuk mendukung ekosistem Layanan.  
“Informasi Pribadi” berarti seluruh data pribadi yang diberikan Pengguna melalui Aplikasi, termasuk namun tidak terbatas pada nama, alamat, tanggal lahir, nomor identifikasi, nomor telepon, alamat email, serta dokumen dan/atau data lainnya yang dapat mengidentifikasi Anda sebagai Pengguna.  
“Kami” berarti PT Xoftware Digital Indonesia yang mengoperasikan Aplikasi dan/atau layanan yang terhubung dengan domain xoftware.id.  
“Pengguna” berarti setiap orang atau institusi yang terdaftar menggunakan layanan dan jasa yang disediakan oleh Kami melalui Aplikasi.  

PENGUMPULAN INFORMASI PRIBADI  
Kami menyadari bahwa Informasi Pribadi yang Kami dapatkan dari Anda bersifat rahasia. Untuk itu, melindungi privasi Anda merupakan prioritas bagi Kami. Kami memegang teguh komitmen untuk menjaga kerahasiaan dan keamanan Informasi Pribadi yang Anda berikan.  
Kami mengumpulkan Informasi Pribadi Anda saat menggunakan Aplikasi agar dapat menjalankan fungsi Aplikasi dengan baik saat Anda menggunakan Layanan. Informasi Pribadi hanya akan digunakan untuk kepentingan yang terkait dengan Layanan pada Aplikasi dan/atau situs yang berada dalam pengelolaan Kami, termasuk namun tidak terbatas pada domain xoftware.id.  

PENGGUNAAN INFORMASI PRIBADI  
Pada saat mendaftar pada Aplikasi, Anda akan diminta untuk mengisi data pribadi yang merupakan Informasi Pribadi Anda sesuai Kebijakan Privasi yang berlaku. Dengan demikian Anda harus menyadari bahwa Anda telah menyetujui untuk memberikan Informasi Pribadi kepada Kami.  
Kami dapat mengungkapkan Informasi Pribadi Anda sepanjang diwajibkan secara hukum, atau diperlukan untuk tunduk pada ketentuan peraturan perundang‑undangan, atau permintaan instansi pemerintah yang berwenang.  
Informasi Pribadi Anda digunakan untuk memberikan Layanan sebagai berikut:  
a. Untuk menganalisa pola penggunaan Aplikasi oleh Anda;  
b. Untuk memungkinkan Kami menyampaikan informasi terkait produk terbaru dan layanan mendatang yang akan Kami berikan; dan  
c. Untuk meningkatkan kualitas pelayanan Kami kepada Anda.  

KEAMANAN  
Kami akan memberlakukan upaya dan usaha terbaik Kami untuk melindungi dan mengamankan data dan Informasi Pribadi Anda.  
Kami tidak akan memberikan akses terhadap data dan Informasi Pribadi kepada pihak lain selain regulator dan/atau berdasarkan perintah pengadilan, aparat/instansi yang berwenang (antara lain dalam rangka untuk mencegah dan memberantas tindak pidana pencucian uang dan/atau penipuan), kecuali sebagaimana diizinkan oleh peraturan perundang‑undangan yang berlaku.  

PERUBAHAN KEBIJAKAN PRIVASI  
Kami berhak untuk mengubah Kebijakan Privasi yang berlaku ke depannya dengan atau tanpa pemberitahuan kepada Anda sebelumnya. Silakan memeriksa Kebijakan Privasi secara berkala untuk mengetahui versi yang terbaru. Kami akan mengupayakan untuk memberikan notifikasi terkait perubahan tersebut kepada Anda melalui pesan sembulan atau pop‑up atau banner dalam Layanan dan/atau melalui Aplikasi/situs yang Kami operasikan.  

AKSES INFORMASI PRIBADI  
Anda dapat mengajukan permohonan untuk mengubah Informasi Pribadi yang telah Anda berikan kepada Kami dengan menghubungi Kami melalui sarana kontak yang Kami sediakan pada Aplikasi atau situs xoftware.id.  
Untuk pengajuan perubahan Informasi Pribadi dapat Kami lakukan dengan ketentuan sebagai berikut:  
a. Anda wajib memberikan pernyataan alasan perubahan Informasi Pribadi; dan  
b. Sepanjang tidak melanggar ketentuan hukum Indonesia yang terkait dengan penyimpanan dokumen perusahaan serta ketentuan perundang‑undangan lain yang berlaku.  

UMUM  
Kebijakan Privasi ini diatur oleh dan ditafsirkan menurut hukum Negara Republik Indonesia. Anda dan PT Xoftware Digital Indonesia setuju bahwa setiap dan semua perselisihan yang timbul sehubungan dengan Kebijakan Privasi ini akan diselesaikan menurut ketentuan yang dimaksud dalam Syarat Penggunaan yang berlaku pada Aplikasi dan/atau situs Kami.  

PENGAKUAN DAN PERSETUJUAN  
Dengan menggunakan Aplikasi dan/atau mengakses layanan Kami, termasuk yang tersedia melalui domain xoftware.id, Anda mengakui bahwa Anda telah membaca dan memahami Kebijakan Privasi Kami dan sepakat terhadap perolehan/pengumpulan, pengolahan/penganalisisan, penyimpanan, penampilan/pengumuman/pengiriman/penyebarluasan, serta perubahan Informasi Pribadi Anda yang tata caranya sesuai dengan peraturan perundang‑undangan yang secara khusus mengatur hal ini.  

PERTANYAAN & INFORMASI KONTAK  
Layanan ini disediakan oleh PT Xoftware Digital Indonesia, beralamat di Jl. H. Imam Munandar No. 99 Bagan Batu, Kec. Bagan Sinembah, Kabupaten Rokan Hilir, Riau 28992.  
Silakan hubungi Kami jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini. Anda dapat menghubungi Kami dengan mengirimkan surat menyurat ke alamat tersebut di atas atau melalui sarana kontak yang Kami cantumkan pada situs xoftware.id dan/atau Aplikasi Kami.
`,
  term: `Dalam menggunakan layanan PT Xoftware Digital Indonesia (“Kami”), Pengguna (“Anda”) setuju dan mengikatkan diri untuk mematuhi Syarat & Ketentuan (“Syarat”) sebagai berikut:  

Syarat ini mengatur dan berlaku untuk akses dan penggunaan aplikasi dan/atau layanan yang dioperasikan oleh PT Xoftware Digital Indonesia, termasuk situs yang terhubung dengan domain xoftware.id (“Situs”) serta aplikasi mobile (“Aplikasi”). Situs dan Aplikasi secara kolektif disebut sebagai “Layanan”.  

DENGAN MENGKLIK TOMBOL PENDAFTARAN PADA SITUS ATAU DENGAN MENGUNDUH, MEMASANG, MENGAKSES, ATAU MENGGUNAKAN APLIKASI ATAU LAYANAN, ANDA MENYATAKAN BAHWA ANDA TELAH MEMBACA, MEMAHAMI, DAN MENYETUJUI UNTUK TERIKAT OLEH SYARAT INI, TERMASUK KEBIJAKAN PRIVASI YANG MENJADI SATU KESATUAN DENGAN SYARAT INI.  

Anda sebelumnya mengakui dan menyetujui bahwa:  
1. Aplikasi dilisensikan, bukan dijual, kepada Anda, dan Anda hanya dapat menggunakan Layanan sesuai dengan yang tercantum dalam Syarat ini;  
2. Saat pertama kali membuat akun dalam Layanan, Kami dapat meminta nomor ponsel dan/atau alamat email Anda untuk memverifikasi akun Anda, dan biaya dari operator jaringan seluler atau penyedia layanan internet Anda (jika ada) sepenuhnya menjadi tanggung jawab Anda;  
3. Penggunaan Layanan dapat dikenakan syarat dan ketentuan dari pihak ketiga yang terpisah dari Layanan Kami, termasuk namun tidak terbatas pada syarat dan ketentuan layanan data, SMS, MMS, dan biaya lain dari operator atau penyedia jasa, yang seluruhnya menjadi tanggung jawab Anda; dan  
4. Layanan disediakan “sebagaimana adanya” tanpa jaminan apa pun selain yang secara tegas dinyatakan dalam Syarat ini dan peraturan perundang‑undangan yang berlaku.  

PENGGUNAAN LAYANAN  
Berdasarkan Syarat ini (termasuk namun tidak terbatas pada kepatuhan Anda terhadap Syarat), Anda memiliki hak terbatas, non‑eksklusif, tidak dapat dipindahtangankan, tidak dapat disublisensikan, dan dapat dibatalkan, untuk mengunduh dan menginstal salinan Aplikasi dari penyedia layanan yang sah (seperti Apple App Store atau Google Play Store) pada perangkat Anda, serta untuk mengakses dan menggunakan Layanan, dalam setiap hal hanya untuk penggunaan pribadi atau penggunaan yang diizinkan menurut perjanjian Anda dengan Kami.  

Anda tidak diperbolehkan untuk:  
(i) menyalin, memodifikasi, atau membuat karya turunan dari Layanan (atau bagian daripadanya) untuk tujuan apa pun;  
(ii) mendistribusikan, menampilkan secara umum, melakukan secara umum, memindahtangankan, menjual, mensublisensikan, meminjamkan, menyewakan atau menyediakan Layanan (atau bagian daripadanya) kepada pihak ketiga;  
(iii) mendekompilasi, melakukan reverse‑engineer, membongkar, mengintervensi, atau mengelakkan Layanan (atau bagian daripadanya), termasuk tanpa batasan mekanisme keamanan atau kontrol akses; atau  
(iv) menggunakan Layanan (atau bagian daripadanya) dengan cara yang melanggar hukum, untuk tujuan melanggar hukum, atau melakukan tindakan di luar maksud yang diatur dalam Syarat ini.  

Layanan Kami dapat berubah sewaktu‑waktu dan/atau Kami dapat menghentikan (secara permanen atau sementara) penyediaan Layanan (atau fitur dalam Layanan), tanpa pemberitahuan sebelumnya kepada Anda, sepanjang diizinkan oleh peraturan perundang‑undangan. Layanan Kami juga dapat memuat iklan, yang mungkin ditargetkan berdasarkan konten atau informasi pada Layanan, permintaan yang dilakukan melalui Layanan, atau informasi lain yang relevan. Jenis dan tingkat iklan pada Layanan dapat berubah dari waktu ke waktu. Dengan menggunakan Layanan, Anda setuju bahwa Kami dan/atau mitra pihak ketiga Kami dapat menempatkan iklan sehubungan dengan penggunaan Layanan oleh Anda.  

Fitur‑fitur tertentu dalam Layanan Kami dapat dikenakan syarat dan ketentuan tambahan, yang akan dilekatkan pada fitur tersebut. Syarat dan ketentuan tambahan tersebut merupakan satu kesatuan dan bagian yang tidak terpisahkan dari Syarat ini.  

Dalam rangka mengunduh Aplikasi, Anda mungkin diminta oleh pihak ketiga penyedia layanan (misalnya Apple Inc. atau Google) untuk membuat akun. Anda bertanggung jawab untuk menjaga keamanan setiap login, kata sandi, atau kredensial lain yang Anda gunakan untuk mengakses akun pada penyedia tersebut. Akses dan penggunaan akun apa pun pada penyedia layanan berada di bawah syarat, ketentuan, dan kebijakan, termasuk kebijakan privasi, dari masing‑masing penyedia layanan, dan Kami tidak bertanggung jawab atas tindakan atau kelalaian mereka.  

PEMBUATAN AKUN  
Untuk mengakses dan menggunakan Layanan tertentu, Anda harus mendaftar dan membuat akun (“Akun”). Dengan membuat Akun, Anda menyatakan bahwa Anda telah berusia cukup menurut hukum untuk mengikatkan diri dalam suatu perjanjian, bukan merupakan pihak yang dilarang menerima Layanan berdasarkan hukum Republik Indonesia atau yurisdiksi lain yang berlaku, dan tidak pernah sebelumnya ditangguhkan atau dihapus sebagai pengguna Layanan.  

Saat membuat Akun, Anda dapat diminta memberikan alamat email, nomor ponsel, serta informasi pribadi lainnya, dan membuat nama pengguna (username) serta kata sandi. Kami berhak menghapus atau menolak nama pengguna yang menurut penilaian Kami tidak pantas, menyesatkan, melanggar hak pihak lain, atau digunakan untuk menyamar sebagai pihak lain.  

Anda setuju untuk memberikan dan selalu memperbarui informasi Akun yang akurat, terkini, dan lengkap. Apabila Anda mengubah atau menonaktifkan nomor ponsel atau alamat email yang terhubung dengan Akun, Anda wajib segera memperbaruinya agar tidak menimbulkan risiko penyalahgunaan oleh pihak lain.  

Anda tidak diperbolehkan untuk:  
– memberikan informasi pribadi palsu atau membuat Akun untuk orang lain tanpa izin yang sah;  
– menggunakan nama pengguna yang merupakan milik pihak lain dengan maksud meniru pihak tersebut;  
– menggunakan nama pengguna yang tunduk pada hak pihak lain tanpa otorisasi yang tepat; atau  
– menggunakan atau menghubungkan instrumen pembayaran milik pihak lain ke dalam Aplikasi tanpa kuasa yang sah.  

Kami berhak menangguhkan atau menghentikan Akun Anda apabila informasi yang diberikan terbukti tidak akurat, palsu, atau menyesatkan, atau apabila terdapat pelanggaran terhadap Syarat ini. Anda bertanggung jawab atas kerahasiaan kata sandi dan segala aktivitas yang terjadi melalui Akun Anda. Jika Anda mengetahui atau menduga bahwa Akun Anda tidak lagi aman, Anda wajib segera memberitahu Kami melalui sarana kontak yang Kami sediakan.  

PEMBAYARAN  
Akses ke Layanan, atau fitur tertentu dalam Layanan, mungkin mengharuskan Anda membayar biaya kepada Kami dan/atau kepada penyedia layanan lain yang relevan. Ketentuan tarif, cara pembayaran, serta konsekuensi keterlambatan atau kegagalan pembayaran akan dijelaskan dalam ketentuan tersendiri di Layanan. Apabila Anda memiliki pertanyaan terkait pembayaran, Anda dapat menghubungi layanan bantuan Kami melalui informasi kontak yang tersedia pada Situs atau Aplikasi.  

KEBIJAKAN HAK CIPTA  
Kami tidak mengizinkan kegiatan pelanggaran hak cipta atau hak kekayaan intelektual lainnya dalam Layanan. Kami akan menghapus atau membatasi akses terhadap konten yang dilaporkan secara layak sebagai pelanggaran hak kekayaan intelektual milik pihak lain. Jika Anda adalah pemilik hak cipta atau kuasanya dan meyakini bahwa konten di Layanan melanggar hak Anda, Anda dapat mengajukan pemberitahuan tertulis kepada Kami yang berisi, antara lain:  
– deskripsi karya berhak cipta yang Anda klaim dilanggar;  
– uraian lokasi konten yang melanggar di dalam Layanan;  
– data kontak Anda (alamat, nomor telepon, dan alamat email); dan  
– pernyataan bahwa informasi yang Anda sampaikan benar dan bahwa Anda adalah pemilik hak cipta atau berwenang bertindak atas nama pemilik.  

KEGIATAN TIDAK SAH  
Layanan Kami hanya dapat digunakan untuk tujuan yang sah menurut hukum. Anda setuju untuk tidak menggunakan Layanan untuk, antara lain:  
– mengakses atau mengunduh konten menggunakan cara otomatis yang tidak diizinkan;  
– mengganggu sistem, server, atau jaringan Kami (misalnya dengan mengunggah virus atau kode berbahaya);  
– mengumpulkan data pengguna lain tanpa izin;  
– melakukan spam, penipuan, atau tindakan melawan hukum lainnya; atau  
– mengganggu kenyamanan pengguna lain dalam menggunakan Layanan.  

Kami berhak menyelidiki dugaan pelanggaran dan mengambil langkah yang diperlukan, termasuk bekerja sama dengan penegak hukum apabila diperlukan.  

GANTI RUGI  
Anda setuju untuk mengganti kerugian dan membebaskan PT Xoftware Digital Indonesia beserta direksi, karyawan, dan afiliasinya dari segala klaim, tuntutan, kerugian, atau biaya (termasuk biaya penasihat hukum yang wajar) yang timbul dari:  
(i) penggunaan Layanan oleh Anda;  
(ii) pelanggaran Anda terhadap Syarat ini atau hukum yang berlaku; atau  
(iii) pelanggaran Anda terhadap hak pihak ketiga.  

SITUS PIHAK KETIGA  
Layanan dapat memuat tautan ke situs atau layanan pihak ketiga. Tautan tersebut hanya disediakan untuk kemudahan Anda. Kami tidak mengendalikan dan tidak bertanggung jawab atas konten, kebijakan, atau praktik situs pihak ketiga tersebut. Segala akses dan penggunaan situs pihak ketiga sepenuhnya menjadi risiko Anda sendiri.  

PERUBAHAN ATAS SYARAT  
Kami berhak mengubah Syarat ini sewaktu‑waktu. Syarat yang diperbarui akan dipublikasikan pada Situs dan/atau Aplikasi. Jika perubahan secara material mempengaruhi hak dan kewajiban Anda, Kami akan berupaya memberikan pemberitahuan melalui mekanisme yang wajar (misalnya notifikasi di Aplikasi, email, atau bentuk lainnya). Penggunaan terus‑menerus atas Layanan setelah Syarat diperbarui dianggap sebagai persetujuan Anda atas perubahan tersebut.  

KEPEMILIKAN  
Layanan (termasuk namun tidak terbatas pada Aplikasi, situs, dan seluruh konten di dalamnya) dilindungi oleh hak cipta, merek dagang, dan hukum lain yang berlaku di Republik Indonesia. Kecuali secara tegas diatur lain, seluruh hak atas Layanan adalah milik PT Xoftware Digital Indonesia atau pemberi lisensinya. Anda tidak diperkenankan menggunakan aset kekayaan intelektual Kami tanpa izin tertulis terlebih dahulu.  

PENGHENTIAN  
Kami dapat menghentikan sementara atau secara permanen akses Anda ke Layanan apabila Anda melanggar Syarat ini atau apabila Kami mendeteksi aktivitas yang mencurigakan atau melawan hukum pada Akun Anda. Anda juga dapat mengajukan permintaan penghapusan Akun dengan menghubungi Kami. Sepanjang diizinkan hukum, Kami tetap dapat menyimpan data tertentu (misalnya data transaksi) untuk keperluan pembukuan, kepatuhan hukum, atau analisis internal, namun akan mematuhi ketentuan perlindungan data pribadi yang berlaku.  

SANGGAHAN  
Layanan disediakan “sebagaimana adanya” dan “sebagaimana tersedia”. Sepanjang diizinkan oleh hukum, Kami tidak memberikan jaminan tersurat maupun tersirat bahwa Layanan akan selalu bebas kesalahan, aman, atau memenuhi seluruh kebutuhan spesifik Anda. Anda menanggung seluruh risiko atas penggunaan Layanan.  

PEMBATASAN TANGGUNG JAWAB  
Sepanjang diizinkan oleh hukum yang berlaku, tanggung jawab Kami kepada Anda terbatas pada kerugian langsung yang dapat dibuktikan dan secara nyata disebabkan oleh kesalahan Kami. Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau kehilangan keuntungan, data, maupun goodwill yang timbul dari atau sehubungan dengan penggunaan Layanan.  

PENGECUALIAN  
Jika hukum di wilayah tertentu tidak mengizinkan pembatasan atau pengecualian tanggung jawab tertentu, maka bagian dari ketentuan pembatasan tersebut dapat tidak berlaku bagi Anda sejauh dilarang oleh hukum, namun ketentuan lain tetap berlaku sepenuhnya.  

UMUM  
Syarat ini diatur oleh dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Jika ada ketentuan dalam Syarat yang dinyatakan tidak sah atau tidak dapat dilaksanakan, ketentuan lainnya akan tetap berlaku. Syarat ini merupakan keseluruhan perjanjian antara Anda dan PT Xoftware Digital Indonesia terkait penggunaan Layanan dan menggantikan seluruh perjanjian sebelumnya yang berkaitan dengan hal yang sama.  

RESOLUSI SENGKETA DAN ARBITRASE  
Setiap sengketa yang timbul dari atau sehubungan dengan Syarat ini terlebih dahulu akan diupayakan penyelesaiannya secara musyawarah. Jika dalam jangka waktu yang wajar penyelesaian secara musyawarah tidak tercapai, sengketa akan diselesaikan melalui mekanisme arbitrase atau pengadilan yang berwenang di wilayah hukum Republik Indonesia, sesuai pilihan Kami dan sepanjang diizinkan oleh hukum yang berlaku.  

MENYETUJUI KOMUNIKASI ELEKTRONIK  
Dengan menggunakan Layanan, Anda setuju untuk menerima komunikasi dalam bentuk elektronik dari Kami, baik melalui email, notifikasi di Aplikasi, maupun sarana elektronik lain, sepanjang diizinkan peraturan perundang‑undangan.  

PERTANYAAN & INFORMASI KONTAK  
Layanan ini disediakan oleh PT Xoftware Digital Indonesia, beralamat di Jl. H. Imam Munandar No. 99 Bagan Batu, Kec. Bagan Sinembah, Kabupaten Rokan Hilir, Riau 28992. Silakan hubungi Kami jika Anda memiliki pertanyaan tentang Syarat ini. Anda dapat menghubungi Kami dengan mengirimkan surat menyurat ke alamat tersebut atau melalui sarana kontak yang disediakan pada situs xoftware.id dan/atau Aplikasi Kami.`,
};

export default Config;

export const emptyTrxCountGraph = [
  {
    date: '2025-01-01',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-02',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-03',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-04',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-05',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-06',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-07',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-08',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-09',
    pending: 0,
    success: 0,
    failed: 0,
  },
  {
    date: '2025-01-10',
    pending: 0,
    success: 0,
    failed: 0,
  },
];
export const emptySettle = [
  {
    date: '2025-01-01',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-02',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-03',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-04',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-05',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-06',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-07',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-08',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-09',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
  {
    date: '2025-01-10',
    unsettle: 0,
    settle: 0,
    error: 0,
  },
];
