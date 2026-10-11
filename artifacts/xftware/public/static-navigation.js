(() => {
  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'Layanan', href: '#services' },
    { label: 'Keunggulan', href: '#keunggulan' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Tentang kami', href: '#about' },
    { label: 'Kontak', href: '#contact' },
    { label: 'Blog', href: 'https://blog.xoftware.id' },
    { label: 'Login', href: '/login' },
  ];

  const navigate = (href) => {
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        history.replaceState(null, '', href);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    window.location.assign(href);
  };

  const header = document.querySelector('header.MuiAppBar-root');
  if (header) {
    header.querySelectorAll('p.MuiTypography-root').forEach((item) => {
      const navItem = menuItems.find(
        ({ label }) => label.toLowerCase() === item.textContent.trim().toLowerCase(),
      );
      if (!navItem) return;

      item.setAttribute('role', 'link');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', navItem.label);
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => navigate(navItem.href));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(navItem.href);
        }
      });
    });
  }

  const hamburger = [...document.querySelectorAll('#__next div')].find((element) => {
    const lines = [...element.children];
    return (
      lines.length === 3 &&
      lines.every(
        (line) => line.style.position === 'absolute' && line.style.height === '3px',
      )
    );
  });

  if (hamburger) {
    hamburger.classList.add('xoftware-hamburger');
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');
    hamburger.setAttribute('aria-label', 'Buka menu navigasi');
    hamburger.setAttribute('aria-expanded', 'false');
    [...hamburger.children].forEach((line, index) => {
      line.style.top = `${index * 10}px`;
    });

    const menu = document.createElement('nav');
    menu.className = 'xoftware-mobile-menu';
    menu.setAttribute('aria-label', 'Navigasi utama');
    menu.style.display = 'none';

    menuItems.forEach(({ label, href }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.addEventListener('click', (event) => {
        if (href.startsWith('#')) {
          event.preventDefault();
          navigate(href);
        }
        closeMenu();
      });
      menu.append(link);
    });

    document.body.append(menu);

    const closeMenu = () => {
      menu.style.display = 'none';
      hamburger.classList.remove('xoftware-hamburger-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Buka menu navigasi');
      document.body.style.overflow = '';
    };

    const toggleMenu = () => {
      const isOpen = hamburger.getAttribute('aria-expanded') !== 'true';
      menu.style.display = isOpen ? 'flex' : 'none';
      hamburger.classList.toggle('xoftware-hamburger-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute(
        'aria-label',
        isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi',
      );
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
      }
    });
    menu.addEventListener('click', (event) => {
      if (event.target === menu) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const faqRows = [...document.querySelectorAll('.MuiAccordion-root')].filter((row) =>
    row.querySelector('.MuiAccordionSummary-root'),
  );

  const setFaqOpen = (row, open) => {
    const summary = row.querySelector('.MuiAccordionSummary-root');
    const collapse = row.querySelector('.MuiCollapse-root');
    if (!summary || !collapse) return;

    summary.setAttribute('aria-expanded', String(open));
    row.classList.toggle('Mui-expanded', open);
    collapse.classList.toggle('MuiCollapse-hidden', !open);
    collapse.style.height = open ? 'auto' : '0px';
    collapse.style.visibility = open ? 'visible' : 'hidden';
  };

  faqRows.forEach((row) => {
    const summary = row.querySelector('.MuiAccordionSummary-root');
    summary?.addEventListener('click', () => {
      setFaqOpen(row, summary.getAttribute('aria-expanded') !== 'true');
    });
  });

  const faqSearch = document.querySelector('input[placeholder="Cari pertanyaan..."]');
  if (faqSearch instanceof HTMLInputElement && faqRows.length > 0) {
    faqSearch.addEventListener('input', () => {
      const query = faqSearch.value.trim().toLowerCase();
      faqRows.forEach((row) => {
        const matches = row.textContent.toLowerCase().includes(query);
        row.style.display = matches ? '' : 'none';
        if (!matches) setFaqOpen(row, false);
      });
    });
  }

  const expandButton = [...document.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === 'Expand All',
  );
  if (expandButton && faqRows.length > 0) {
    expandButton.addEventListener('click', () => {
      const visibleRows = faqRows.filter((row) => row.style.display !== 'none');
      const shouldExpand = !visibleRows.every(
        (row) => row.querySelector('.MuiAccordionSummary-root')?.getAttribute('aria-expanded') === 'true',
      );
      visibleRows.forEach((row) => setFaqOpen(row, shouldExpand));
      expandButton.textContent = shouldExpand ? 'Collapse' : 'Expand All';
    });
  }

  const buttonActions = {
    'Daftar Sekarang': '/register',
    'Mulai Gratis Sekarang': '/register',
    'Lihat Layanan': '#services',
    'Tentang Kami': '#about',
    'Hubungi Sales Kami': 'https://wa.me/6281370101295',
  };

  document.querySelectorAll('#__next button').forEach((button) => {
    const href = buttonActions[button.textContent.trim()];
    if (!href) return;
    button.addEventListener('click', () => navigate(href));
  });

  const styles = document.createElement('style');
  styles.textContent = `
    .xoftware-hamburger {
      cursor: pointer !important;
      touch-action: manipulation;
    }
    .xoftware-hamburger > div {
      transition: top .25s ease, transform .25s ease, opacity .2s ease;
      transform-origin: center;
    }
    .xoftware-hamburger-open > div:nth-child(1) {
      top: 10px !important;
      transform: rotate(45deg);
      background: #0f172a !important;
    }
    .xoftware-hamburger-open > div:nth-child(2) {
      opacity: 0 !important;
    }
    .xoftware-hamburger-open > div:nth-child(3) {
      top: 10px !important;
      transform: rotate(-45deg);
      background: #0f172a !important;
    }
    .xoftware-mobile-menu {
      position: fixed;
      inset: 0;
      z-index: 1190;
      box-sizing: border-box;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 14px;
      padding: 80px 24px 32px;
      overflow-y: auto;
      background: #fff;
    }
    .xoftware-mobile-menu a {
      color: #0f172a;
      font: 600 1.35rem/1.4 Inter, sans-serif;
      text-decoration: none;
      cursor: pointer;
    }
    .xoftware-mobile-menu a:hover,
    header.MuiAppBar-root [role="link"]:focus-visible {
      color: #6366f1;
      outline-color: #6366f1;
    }
    @media (min-width: 900px) {
      .xoftware-mobile-menu { display: none !important; }
    }
  `;
  document.head.append(styles);
})();
