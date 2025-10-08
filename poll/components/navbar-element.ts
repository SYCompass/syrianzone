const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "") as string;

class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    this.highlightActivePage();
    // Sync theme from document to shadow host so CSS variables update
    const apply = () => {
      const isDark = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.shadowRoot?.host.classList.toggle('dark', isDark);
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // @ts-ignore
    this._mo = mo;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', apply);
    // @ts-ignore
    this._mql = mql;
  }

  highlightActivePage() {
    const currentPath = window.location.pathname;
    const navItems = this.shadowRoot!.querySelectorAll('.nav-item');
    const mobileTitle = this.shadowRoot!.querySelector('.mobile-title');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && ((href === '/' && currentPath === '/') || (href !== '/' && currentPath.startsWith(href)))) {
        item.classList.add('active');
        if (mobileTitle) {
          (mobileTitle as HTMLElement).innerHTML = (item as HTMLElement).innerHTML;
        }
      }
    });
  }

  addEventListeners() {
    const menuButton = this.shadowRoot!.querySelector('.menu-button');
    const navItems = this.shadowRoot!.querySelector('.nav-items');
    const navbar = this.shadowRoot!.querySelector('.navbar');
    
    // Safely handle menu button click
    menuButton?.addEventListener('click', () => {
      navItems?.classList.toggle('show');
      menuButton.classList.toggle('active');
      navbar?.classList.toggle('menu-open');
    });
  }

  render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "IBM Plex Sans Arabic", sans-serif;
          direction: rtl;
          --sz-color-ink: #0f172a;
          --sz-color-surface: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          :host {
            --sz-color-ink: #e5e7eb;
            --sz-color-surface: #0D1315;
          }
        }
        .navbar {
          background-color: var(--sz-color-surface);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid color-mix(in oklab, var(--sz-color-ink) 10%, transparent);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1000;
        }
        .navbar.menu-open {
          box-shadow: none;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.5rem 1rem;
        }
        .nav-items {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .nav-item {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--sz-color-ink);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .nav-item:hover {
          background-color: color-mix(in oklab, var(--sz-color-ink) 5%, transparent);
        }
        .nav-item.active {
          background-color: color-mix(in oklab, #556A4E 12%, var(--sz-color-surface));
          color: #556A4E;
          font-weight: 500;
        }
        .nav-item i {
          margin-left: 0.5rem;
          font-size: 1.1rem;
          color: currentColor;
        }
        .nav-item.forum-link i {
          color: #A73F46 !important;
        }
        .menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: var(--sz-color-ink);
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
        }
        .menu-button:hover {
          background-color: color-mix(in oklab, var(--sz-color-ink) 5%, transparent);
        }
        .menu-button i {
          font-size: 1.25rem;
        }
        .mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .navbar {
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            z-index: 1000;
          }
          .navbar-spacer {
            padding-top: 3rem;
          }
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.25rem;
            position: relative;
          }
                  .mobile-title {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: var(--sz-color-primary);
          font-size: 1rem;
        }
        .mobile-title i {
          margin-left: 0.5rem;
        }
        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--sz-color-primary);
          font-weight: 600;
          font-size: 1.1rem;
        }
        .logo img {
          height: 2rem;
          width: auto;
          margin-left: 0.5rem;
        }
        .desktop-logo {
          display: none;
        }
        @media (min-width: 769px) {
          .desktop-logo {
            display: flex;
            align-items: center;
            margin-left: 1rem;
          }
          .mobile-title {
            display: none;
          }
        }
          .mobile-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
          }
          .menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nav-items {
            display: none;
            flex-direction: column;
            gap: 0.25rem;
            position: absolute;
            top: 100%;
            right: 0;
            left: 0;
            background-color: var(--sz-color-surface);
            padding: 0.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .nav-items.show {
            display: flex;
          }
          .nav-item {
            padding: 0.75rem;
            width: 100%;
            justify-content: flex-start;
            border-radius: 0.375rem;
          }
          .nav-item.active {
            background-color: color-mix(in oklab, #556A4E 12%, var(--sz-color-surface));
          }
          .container {
            padding: 0 0.5rem;
          }
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
      <nav class="navbar">
        <div class="container">
          <div class="mobile-header">
            <a href="https://syrian.zone" class="logo">
              <picture>
                <source media="(prefers-color-scheme: dark)" srcset="${BASE}/assets/logo-darkmode.svg">
                <img src="${BASE}/assets/logo-lightmode.svg" alt="Syrian Zone">
              </picture>
            </a>
            <div class="mobile-actions">
              <button class="menu-button">
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </div>
          <div class="nav-items">
            <div class="desktop-logo">
              <a href="https://syrian.zone" class="logo">
                <picture>
                  <source media="(prefers-color-scheme: dark)" srcset="${BASE}/assets/logo-darkmode.svg">
                  <img src="${BASE}/assets/logo-lightmode.svg" alt="Syrian Zone" style="height: 50px;">
                </picture>
              </a>
            </div>

            <a href="/syofficial" class="nav-item">
              <i class="fas fa-check-circle"></i>
              الحسابات الرسمية 
            </a>
            <a href="/syid" class="nav-item">
              <i class="fas fa-palette"></i>
              الهوية البصرية 
            </a>
            <a href="/party" class="nav-item">
              <i class="fas fa-users"></i>
              دليل الأحزاب
            </a>
            <a href="/tierlist" class="nav-item">
              <i class="fas fa-list-ol"></i>
              تير ليست الحكومة
            </a>
            <a href="/house" class="nav-item">
              <i class="fas fa-landmark"></i>
              المجلس التشريعي
            </a>
            <a href="/compass" class="nav-item">
              <i class="fas fa-compass"></i>
              البوصلة السياسية
            </a>
            <a href="/sites" class="nav-item">
              <i class="fas fa-globe"></i>
              المواقع السورية
            </a>
            <a href="/syrian-contributors" class="nav-item">
              <i class="fas fa-code"></i>
              المساهمون السوريون
            </a>
            <a target="_blank" href="https://github.com/SYCompass/Twitter-SVG-Syrian-Flag-Replacer/releases/tag/1.0.1" class="nav-item">
              <img src="${BASE}/flag-replacer/1f1f8-1f1fe.svg" alt="Flag Replacer" style="height: 1.1rem; width: 1.1rem; margin-left: 0.5rem;">
              مبدل العلم
            </a>
            <a target="_blank" href="https://wrraq.com" class="nav-item forum-link">
              <i class="fas fa-comments"></i>
              المنتدى
            </a>
          </div>
        </div>
      </nav>
      <div class="navbar-spacer"></div>
    `;
  }
}

if (!customElements.get('nav-bar')) {
  customElements.define('nav-bar', NavBar);
}


export {};
