class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    this.highlightActivePage();
  }

  highlightActivePage() {
    const currentPath = window.location.pathname;
    const navItems = this.shadowRoot.querySelectorAll('.nav-item');
    const mobileTitle = this.shadowRoot.querySelector('.mobile-title');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if ((href === '/' && currentPath === '/') || (href !== '/' && currentPath.startsWith(href))) {
        item.classList.add('active');
        if (mobileTitle) {
          mobileTitle.innerHTML = item.innerHTML;
        }
      }
    });
  }

  addEventListeners() {
    const menuButton = this.shadowRoot.querySelector('.menu-button');
    const navItems = this.shadowRoot.querySelector('.nav-items');
    const navbar = this.shadowRoot.querySelector('.navbar');
    
    menuButton?.addEventListener('click', () => {
      navItems.classList.toggle('show');
      menuButton.classList.toggle('active');
      navbar.classList.toggle('menu-open');
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "IBM Plex Sans Arabic", sans-serif;
          direction: rtl;
        }
        .navbar {
          background-color: white;
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
          color: #1a1a1a;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .nav-item:hover {
          background-color: #f3f4f6;
        }
        .nav-item.active {
          background-color: #edf7ed;
          color: #2d4d3c;
          font-weight: 500;
        }
        .nav-item i {
          margin-left: 0.5rem;
          font-size: 1.1rem;
        }
        .menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: #1a1a1a;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
        }
        .menu-button:hover {
          background-color: #f3f4f6;
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
          }
          :host {
            margin-bottom: 4rem;
          }
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.25rem;
          }
          .mobile-title {
            display: flex;
            align-items: center;
            font-weight: 500;
            color: #2d4d3c;
            font-size: 1rem;
          }
          .mobile-title i {
            margin-left: 0.5rem;
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
            background-color: white;
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
            background-color: #edf7ed;
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
            <div class="mobile-title"></div>
            <button class="menu-button">
              <i class="fas fa-bars"></i>
            </button>
          </div>
          <div class="nav-items">
            <a href="/" class="nav-item">
              <i class="fas fa-home" style="color: #2d4d3c;"></i>
              الرئيسية
            </a>
            <a href="/tierlist" class="nav-item">
              <i class="fas fa-list-ol" style="color: #2d4d3c;"></i>
              تير ليست الوزراء
            </a>
            <a href="/bingo" class="nav-item">
              <i class="fas fa-flag" style="color: #807fff;"></i>
              بينغو موسى العمر
            </a>
            <a href="/compass" class="nav-item">
              <i class="fas fa-compass" style="color: #7fbfff;"></i>
              البوصلة السياسية
            </a>
            <a href="/syofficial" class="nav-item">
              <i class="fas fa-check-circle" style="color: #7fbfff;"></i>
              الحسابات الرسمية السورية
            </a>
            <a target="_blank" href="https://github.com/SYCompass/Twitter-SVG-Syrian-Flag-Replacer/releases/tag/1.0.1" class="nav-item">
              <i class="fas fa-th" style="color: #ffbf7f;"></i>
              مبدل العلم
            </a>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar); 