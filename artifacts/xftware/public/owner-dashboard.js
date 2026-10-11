(() => {
  if (!/^\/owner(?:\/|\.html)?$/.test(window.location.pathname)) return;

  const iconMarkup = {
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
    product: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    'product-list': '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    'voucher-list': '<path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M13 8v2m0 4v2"/>',
    'product-level': '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    'recap-dashboard': '<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/>',
    'reseller-info': '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    'seller-profile': '<path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01L3.27 9.35l6.03-.88L12 3Z"/>',
    user: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 8v6m-3-3h6"/>',
    'user-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    'user-mutation': '<path d="M17 3l4 4-4 4"/><path d="M3 7h18M7 21l-4-4 4-4"/><path d="M21 17H3"/>',
    transaction: '<path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
    'qris-pay': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zm4 4h3v3h-3zm0-4h3"/>',
    'mutation-pay': '<path d="M3 7h18v13H3z"/><path d="M3 11h18M7 16h4"/><path d="M7 7V4h13"/>',
    'unduh-data': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5m-5 5V3"/>',
    withdraw: '<path d="M3 7h18v13H3z"/><path d="M3 11h18m-4 4h-3"/><path d="M12 3v6m-3-3 3-3 3 3"/>',
    bot: '<path d="M12 3v3m-7 4h14v10H5z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 17h6M3 12v3m18-3v3"/>',
    layanan: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    'bot-wa': '<path d="M20 11.5a7.5 7.5 0 0 1-11.1 6.6L4 19l.9-4.6A7.5 7.5 0 1 1 20 11.5Z"/><path d="M9 9c.4 2 2 3.7 4 4l1-1 2 1c-.4 1.6-1.5 2.2-2.8 2-2.7-.5-5.2-3-5.7-5.7-.2-1.3.4-2.4 2-2.8l1 2-1.5 1.5Z"/>',
    'bot-telegram': '<path d="m22 3-7 18-4-8-8-4 19-6Z"/><path d="m11 13 5-5"/>',
    ppob: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
    'ppob-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    'ppob-pay': '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
    'ppob-categories': '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    'ppob-operators': '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="2.5" cy="6" r=".5"/><circle cx="2.5" cy="12" r=".5"/><circle cx="2.5" cy="18" r=".5"/>',
    'ppob-vendor-preview': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    smm: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/>',
    'smm-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    'smm-pay': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/>',
    'smm-vendor-kategori': '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    'smm-vendor-list': '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="2.5" cy="6" r=".5"/><circle cx="2.5" cy="12" r=".5"/><circle cx="2.5" cy="18" r=".5"/>',
    webapp: '<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3"/><path d="M2 14h4m4-6h4m4 8h4"/>',
    'domain-provider': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/>',
    cari: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    manage: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/>',
    billing: '<path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
    ticket: '<path d="M3 8a3 3 0 0 0 0 6v4h18v-4a3 3 0 0 1 0-6V4H3v4Z"/><path d="M13 6v2m0 4v2m0 4v1"/>',
    setting: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1A7 7 0 0 1 7 13l-1.8-.3V10l1.8-.3a7 7 0 0 1 .6-1.6L6.2 6.7l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7L19 6.7l-1.4 1.4a7 7 0 0 1 .6 1.6l1.8.3v2.7l-1.8.3a7 7 0 0 1-.6 2Z"/>',
    'account-security': '<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/>',
    'payment-finance': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/>',
    notification: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',
    'integration-api': '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-7-2 6"/>',
    fallback: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  };

  const labels = {
    dashboard: 'Dashboard',
    product: 'Product',
    'product-list': 'Manajemen Produk',
    'voucher-list': 'Daftar Voucher',
    'product-level': 'Level Harga',
    'recap-dashboard': 'Rekap Dashboard',
    'reseller-info': 'Manajemen Reseller',
    'seller-profile': 'Profile Star Seller',
    user: 'User',
    'user-info': 'Informasi',
    'user-mutation': 'Mutasi Saldo',
    transaction: 'Transaksi',
    'qris-pay': 'QRIS',
    'mutation-pay': 'Mutasi QRIS',
    'unduh-data': 'Unduh Data',
    withdraw: 'Tarik Penghasilan',
    bot: 'Bot',
    layanan: 'Info Layanan',
    'bot-wa': 'Bot WhatsApp',
    'bot-telegram': 'Bot Telegram',
    ppob: 'PPOB',
    'ppob-info': 'Information',
    'ppob-pay': 'Transaction',
    'ppob-categories': 'Kategori',
    'ppob-operators': 'Operator',
    'ppob-vendor-preview': 'Preview Vendor',
    smm: 'SMM',
    'smm-info': 'Info SMM',
    'smm-pay': 'SMM',
    'smm-vendor-kategori': 'Kategori Service',
    'smm-vendor-list': 'List Service',
    webapp: 'Pengaturan Web App',
    'domain-provider': 'Layanan Domain',
    cari: 'Cari Domain',
    manage: 'Domain Aktif',
    billing: 'Billing & Transaksi',
    ticket: 'Ticket',
    setting: 'Pengaturan',
    'account-security': 'Akun & Keamanan',
    'payment-finance': 'Pembayaran & Keuangan',
    notification: 'Notifikasi',
    'integration-api': 'Integrasi & API',
  };

  const svgNamespace = 'http://www.w3.org/2000/svg';
  let sidebarPinned = true;

  function makeIcon(key) {
    const icon = document.createElementNS(svgNamespace, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.classList.add('owner-nav-icon');
    icon.innerHTML = iconMarkup[key] || iconMarkup.fallback;
    return icon;
  }

  function getMenuKey(element) {
    const token = [...element.classList].find(name => name.startsWith('tour-step-'));
    return token?.slice('tour-step-'.length) || '';
  }

  function getSidebarRail(menuItem) {
    const isDesktop = window.matchMedia('(min-width: 900px)').matches;
    let candidate = menuItem.parentElement;
    while (candidate && candidate !== document.body) {
      const style = window.getComputedStyle(candidate);
      const bounds = candidate.getBoundingClientRect();
      if (
        style.position === 'fixed' &&
        bounds.left <= 2 &&
        (!isDesktop || bounds.left >= -bounds.width - 2) &&
        bounds.height >= window.innerHeight * 0.7 &&
        bounds.width <= 360
      ) {
        return candidate;
      }
      candidate = candidate.parentElement;
    }
    return null;
  }

  function getMainContent() {
    const main = document.querySelector('#__next main');
    if (main) return main;

    return [...document.querySelectorAll('#__next [style]')].find(element => {
      const margin = Number.parseFloat(window.getComputedStyle(element).marginLeft);
      return Number.isFinite(margin) && margin >= 72 && element.children.length > 0;
    }) || null;
  }

  function syncTheme(rail) {
    const surface = rail.firstElementChild || rail;
    const background = window.getComputedStyle(surface).backgroundColor;
    const values = background.match(/[\d.]+/g)?.map(Number);
    if (!values || values.length < 3) return;
    const [red, green, blue] = values;
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
    document.body.classList.toggle('owner-console-dark', brightness < 110);
  }

  function syncMainLayout() {
    const desktop = window.matchMedia('(min-width: 900px)').matches;
    const offset = desktop ? (sidebarPinned ? '264px' : '76px') : '0px';
    if (document.body.style.getPropertyValue('--owner-main-offset') !== offset) {
      document.body.style.setProperty('--owner-main-offset', offset);
    }
    const pinned = String(desktop && sidebarPinned);
    if (document.body.dataset.ownerSidebarPinned !== pinned) {
      document.body.dataset.ownerSidebarPinned = pinned;
    }
  }

  function enhanceMenuItem(element, rail) {
    const key = getMenuKey(element);
    if (!key || key === 'hamburger') return;

    element.classList.add('owner-nav-item');
    if (['product-list', 'voucher-list', 'product-level', 'recap-dashboard', 'reseller-info', 'seller-profile', 'user-info', 'user-mutation', 'qris-pay', 'mutation-pay', 'layanan', 'bot-wa', 'bot-telegram', 'ppob-info', 'ppob-pay', 'ppob-categories', 'ppob-operators', 'ppob-vendor-preview', 'smm-info', 'smm-pay', 'smm-vendor-kategori', 'smm-vendor-list', 'cari', 'manage', 'billing', 'account-security', 'payment-finance', 'notification', 'integration-api'].includes(key)) {
      element.classList.add('owner-nav-child');
    }

    const menuLabel = labels[key] || element.textContent.trim().replace(/\s+/g, ' ');
    if (menuLabel) {
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', menuLabel);
      element.setAttribute('title', menuLabel);
    }

    const labelElement = [...element.children].find(child =>
      child.matches('.MuiTypography-root') || (child.textContent.trim() && !child.querySelector('svg')),
    );
    if (labelElement) labelElement.classList.add('owner-nav-label');

    const existingIcon = element.querySelector('svg');
    let iconHost = existingIcon?.parentElement;
    if (!iconHost) {
      iconHost = [...element.children].find(child => !child.textContent.trim()) || null;
    }
    if (!iconHost) {
      iconHost = document.createElement('span');
      element.insertBefore(iconHost, element.firstChild);
    }

    iconHost.classList.add('owner-nav-icon-wrap');
    [...element.children]
      .filter(child => child !== iconHost && child.querySelector('svg'))
      .forEach(child => child.classList.add('owner-nav-trailing-icon'));
    const currentKey = element.dataset.ownerIconKey;
    if (currentKey !== key) {
      iconHost.replaceChildren(makeIcon(key));
      element.dataset.ownerIconKey = key;
    }

    const activeFill = window.getComputedStyle(element).backgroundColor;
    const activeChannels = activeFill.match(/[\d.]+/g)?.map(Number);
    const activeAlpha =
      activeChannels?.length === 4 ? activeChannels[3] : activeFill === 'transparent' ? 0 : 1;
    const isAccentFill =
      activeChannels?.length >= 3 &&
      activeChannels[2] > activeChannels[0] + 35 &&
      activeChannels[2] > activeChannels[1] + 30;
    if (
      element.classList.contains('Mui-selected') ||
      element.getAttribute('aria-selected') === 'true' ||
      (activeAlpha > 0.04 && isAccentFill)
    ) {
      element.setAttribute('aria-current', 'page');
    } else {
      element.removeAttribute('aria-current');
    }

    if (!element.dataset.ownerKeyboardBound) {
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          element.click();
        }
      });
      element.dataset.ownerKeyboardBound = 'true';
    }
  }

  function enhanceDashboardContent() {
    const headings = [...document.querySelectorAll('#__next .MuiTypography-root')];
    const greeting = headings.find(element => element.textContent.includes('Halo Owner'));
    if (!greeting) return;

    let welcome = greeting;
    while (welcome && welcome !== document.body) {
      if (window.getComputedStyle(welcome).backgroundImage.includes('linear-gradient')) {
        welcome.classList.add('owner-welcome');
        break;
      }
      welcome = welcome.parentElement;
    }
    document.body.classList.add('owner-dashboard-active');
    if (greeting.textContent.trim() !== 'Halo Owner') {
      greeting.textContent = 'Halo Owner';
    }
    document.querySelectorAll('#__next .owner-welcome .MuiTypography-root').forEach(element => {
      const cleanText = element.textContent
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (element.textContent !== cleanText) element.textContent = cleanText;
    });
    document.querySelectorAll('#__next .owner-announcements .MuiChip-label').forEach(element => {
      if (element.textContent.trim() === 'Unread') element.textContent = 'Belum dibaca';
    });

    const announcement = [...document.querySelectorAll('#__next .MuiCard-root')]
      .find(card => card.textContent.includes('Pengumuman'));
    if (announcement) {
      announcement.classList.add('owner-announcements');
      let dashboardGrid = announcement.parentElement;
      while (dashboardGrid && dashboardGrid !== document.body) {
        const text = dashboardGrid.textContent;
        if (
          window.getComputedStyle(dashboardGrid).display === 'grid' &&
          text.includes('Saldo') &&
          text.includes('Pengumuman')
        ) {
          dashboardGrid.classList.add('owner-dashboard-layout');
          break;
        }
        dashboardGrid = dashboardGrid.parentElement;
      }
    }

    const metricTabs = [...document.querySelectorAll('#__next .MuiButton-root')]
      .filter(button => ['Saldo', 'Produk', 'Pendapatan'].includes(button.textContent.trim()));
    if (metricTabs.length === 3) {
      const tabList = metricTabs[0].parentElement;
      tabList.classList.add('owner-metric-tabs');
      tabList.setAttribute('role', 'tablist');
      tabList.setAttribute('aria-label', 'Pilih ringkasan dashboard');
      metricTabs.forEach(button => {
        button.setAttribute('role', 'tab');
        button.setAttribute(
          'aria-selected',
          String(button.classList.contains('MuiButton-contained')),
        );
      });
      bindTabKeyboard(metricTabs);
      const panel = metricTabs[0].closest('.MuiCard-root');
      if (panel) {
        panel.classList.add('owner-metric-panel');
        panel.querySelectorAll('.MuiCard-root').forEach(card => {
          if (card !== panel) card.classList.add('owner-stat-card');
        });
      }
    }

    const chartTitle = headings.find(element =>
      /Grafik (Harian|Bulanan)/.test(element.textContent),
    );
    if (chartTitle) {
      let chartCard = null;
      let chartSection = chartTitle.parentElement;
      while (chartSection && !chartCard) {
        chartCard = chartSection.querySelector('.MuiCard-root');
        chartSection = chartSection.parentElement;
      }
      chartCard?.classList.add('owner-chart-card');

      const chartTabButtons = [...document.querySelectorAll('#__next .MuiButton-root')]
        .filter(button => ['7 Hari', '3 Bulan'].includes(button.textContent.trim()));
      if (chartTabButtons.length === 2) {
        const tabList = chartTabButtons[0].parentElement;
        tabList.classList.add('owner-chart-tabs');
        tabList.setAttribute('role', 'tablist');
        tabList.setAttribute('aria-label', 'Rentang grafik transaksi');
        chartTabButtons.forEach(button => {
          button.setAttribute('role', 'tab');
          button.setAttribute(
            'aria-selected',
            String(button.classList.contains('MuiButton-contained')),
          );
        });
        bindTabKeyboard(chartTabButtons);
      }
    }
  }

  function bindTabKeyboard(buttons) {
    buttons.forEach((button, index) => {
      button.setAttribute('tabindex', button.classList.contains('MuiButton-contained') ? '0' : '-1');
      if (button.dataset.ownerTabKeyboardBound) return;
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        const next = buttons[nextIndex];
        next?.focus();
        next?.click();
      });
      button.dataset.ownerTabKeyboardBound = 'true';
    });
  }

  function enhanceOwnerDashboard() {
    const menuItems = [...document.querySelectorAll('#__next [class*="tour-step-"]')]
      .filter(element => getMenuKey(element) !== 'hamburger');
    if (!menuItems.length) return;

    const rail = getSidebarRail(menuItems[0]);
    if (!rail) return;

    const main = getMainContent();
    const desktop = window.matchMedia('(min-width: 900px)').matches;
    if (!rail.classList.contains('owner-sidebar-rail')) {
      sidebarPinned = desktop && (
        main
          ? Number.parseFloat(window.getComputedStyle(main).marginLeft) >= 200
          : rail.getBoundingClientRect().width >= 200
      );
      rail.classList.add('owner-sidebar-rail');
      rail.dataset.ownerPinned = String(sidebarPinned);
    }

    if (desktop && !rail.dataset.ownerHoverBound) {
      rail.addEventListener('mouseenter', event => {
        if (!sidebarPinned && event.clientY > 56) {
          document.body.classList.add('owner-rail-hovered');
        }
      });
      rail.addEventListener('mousemove', event => {
        if (!sidebarPinned) {
          document.body.classList.toggle('owner-rail-hovered', event.clientY > 56);
        }
      });
      rail.addEventListener('mouseleave', () => {
        document.body.classList.remove('owner-rail-hovered');
      });
      rail.addEventListener('focusin', () => {
        if (!sidebarPinned) {
          document.body.classList.add('owner-rail-hovered');
        }
      });
      rail.addEventListener('focusout', event => {
        if (!rail.contains(event.relatedTarget)) {
          document.body.classList.remove('owner-rail-hovered');
        }
      });
      rail.dataset.ownerHoverBound = 'true';
    }
    if (!desktop) document.body.classList.remove('owner-rail-hovered');

    const sidebarBackdrop = rail.previousElementSibling;
    if (sidebarBackdrop?.classList.contains('MuiBackdrop-root') && desktop) {
      sidebarBackdrop.classList.add('owner-sidebar-backdrop');
    }
    rail.classList.toggle('owner-sidebar-mobile', !desktop);
    if (!desktop) {
      const mobileOpen = Boolean(
        sidebarBackdrop?.classList.contains('MuiBackdrop-root') &&
        !sidebarBackdrop.classList.contains('MuiBackdrop-invisible') &&
        window.getComputedStyle(sidebarBackdrop).visibility !== 'hidden',
      );
      const drawerLeft = mobileOpen ? '0px' : '-100%';
      if (rail.style.getPropertyValue('--owner-mobile-left') !== drawerLeft) {
        rail.style.setProperty('--owner-mobile-left', drawerLeft);
      }
    } else {
      rail.style.removeProperty('--owner-mobile-left');
    }

    if (main && !main.classList.contains('owner-main')) {
      main.classList.add('owner-main');
    }

    document.body.classList.add('owner-console');
    syncMainLayout();
    syncTheme(rail);
    menuItems.forEach(element => enhanceMenuItem(element, rail));
    enhanceDashboardContent();

    const appBarButtons = document.querySelectorAll('.MuiAppBar-root button');
    const sidebarToggle = appBarButtons[0];
    if (sidebarToggle && desktop) {
      sidebarToggle.setAttribute('aria-label', 'Buka atau ciutkan menu samping');
      sidebarToggle.setAttribute('aria-expanded', String(sidebarPinned));

      if (!document.documentElement.dataset.ownerSidebarToggleBound) {
        document.addEventListener('click', event => {
          const clickedButton = event.target instanceof Element
            ? event.target.closest('.MuiAppBar-root button')
            : null;
          const appBar = clickedButton?.closest('.MuiAppBar-root');
          if (
            !clickedButton ||
            clickedButton !== appBar?.querySelector('button') ||
            !window.matchMedia('(min-width: 900px)').matches
          ) {
            return;
          }

          const currentRail = document.querySelector('#__next .owner-sidebar-rail');
          if (!currentRail) return;

          event.preventDefault();
          event.stopPropagation();
          sidebarPinned = !sidebarPinned;
          currentRail.dataset.ownerPinned = String(sidebarPinned);
          clickedButton.setAttribute('aria-expanded', String(sidebarPinned));
          document.body.classList.remove('owner-rail-hovered');
          syncMainLayout();
        }, true);
        document.documentElement.dataset.ownerSidebarToggleBound = 'true';
      }
    } else if (sidebarToggle && !desktop) {
      sidebarToggle.setAttribute('aria-label', 'Buka menu samping');
    }
    const themeToggle = appBarButtons[1];
    if (themeToggle && !themeToggle.dataset.ownerThemeBound) {
      themeToggle.setAttribute('aria-label', 'Ganti tema terang atau gelap');
      themeToggle.addEventListener('click', () => window.setTimeout(() => syncTheme(rail), 80));
      themeToggle.dataset.ownerThemeBound = 'true';
    }
  }

  let scheduled = false;
  function scheduleEnhancement() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhanceOwnerDashboard();
    });
  }

  const observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });
  window.addEventListener('resize', scheduleEnhancement, { passive: true });
  scheduleEnhancement();
})();
