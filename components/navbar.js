class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.languageMap = {
      'ar': { text: 'العربية', alt: 'Arabic' },
      'en': { text: 'English', alt: 'English' },
      'tr': { text: 'Türkçe', alt: 'Turkish' },
      'ku': { text: 'Kurmanji', alt: 'Kurdish' }
    };
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
    const languageButton = this.shadowRoot.querySelector('.language-button');
    const mobileLanguageButton = this.shadowRoot.querySelector('.mobile-language-button');
    const languageMenu = this.shadowRoot.querySelector('.language-menu');
    const mobileLanguageMenu = this.shadowRoot.querySelector('.mobile-language-menu');
    const languageOptions = this.shadowRoot.querySelectorAll('.language-option');
    const mobileLanguageOptions = this.shadowRoot.querySelectorAll('.mobile-language-option');
    
    // Safely handle menu button click
    menuButton?.addEventListener('click', () => {
      navItems?.classList.toggle('show');
      menuButton.classList.toggle('active');
      navbar?.classList.toggle('menu-open');
    });

    const handleLanguageClick = (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      if (window.innerWidth <= 768) {
        mobileLanguageMenu?.classList.toggle('show');
      } else {
        languageMenu?.classList.toggle('show');
      }
    };

    // Safely add language button event listeners
    languageButton?.addEventListener('click', handleLanguageClick);
    mobileLanguageButton?.addEventListener('click', handleLanguageClick);

    const handleLanguageOptionClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lang = e.currentTarget.dataset.lang;
      const currentLangSpan = this.shadowRoot.querySelector('.current-language');
      const flagIcon = this.shadowRoot.querySelector('.language-button .flag-icon');
      const mobileFlagIcon = this.shadowRoot.querySelector('.mobile-language-button .flag-icon');
      
      // Update active state
      languageOptions.forEach(opt => opt.classList.remove('active'));
      mobileLanguageOptions.forEach(opt => opt.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      // Update button text and flag
      if (currentLangSpan) {
        currentLangSpan.textContent = this.languageMap[lang]?.text || this.languageMap['ar'].text;
      }
      if (flagIcon) {
        flagIcon.src = `/syofficial/assets/flags/${lang}.svg`;
        flagIcon.alt = this.languageMap[lang]?.alt || this.languageMap['ar'].alt;
      }
      if (mobileFlagIcon) {
        mobileFlagIcon.src = `/syofficial/assets/flags/${lang}.svg`;
        mobileFlagIcon.alt = this.languageMap[lang]?.alt || this.languageMap['ar'].alt;
      }
      
      // Close menus
      languageMenu.classList.remove('show');
      mobileLanguageMenu.classList.remove('show');
      
      // Dispatch custom event for language change
      this.dispatchEvent(new CustomEvent('languageChange', {
        detail: { lang },
        bubbles: true,
        composed: true
      }));

      // Call the global switchLanguage function if it exists
      if (window.switchLanguage) {
        window.switchLanguage(lang);
      } else {
        // Fallback if i18n.js is not loaded yet
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }
    };

    languageOptions.forEach(option => {
      option.addEventListener('click', handleLanguageOptionClick);
    });

    mobileLanguageOptions.forEach(option => {
      option.addEventListener('click', handleLanguageOptionClick);
    });

    // Close language menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.shadowRoot.contains(e.target)) {
        languageMenu?.classList.remove('show');
        mobileLanguageMenu?.classList.remove('show');
      }
    });

    // Update language button text based on current language
    const updateLanguageButton = () => {
      const currentLang = localStorage.getItem('preferredLanguage') || 'ar'; // Default to 'ar'
      const currentLangSpan = this.shadowRoot.querySelector('.current-language');
      const flagIcon = this.shadowRoot.querySelector('.language-button .flag-icon');
      if (currentLangSpan && flagIcon) {
        currentLangSpan.textContent = this.languageMap[currentLang]?.text || this.languageMap['ar'].text;
        flagIcon.src = `/syofficial/assets/flags/${currentLang}.svg`;
        flagIcon.alt = this.languageMap[currentLang]?.alt || this.languageMap['ar'].alt;
      }
      const languageOptions = this.shadowRoot.querySelectorAll('.language-option');
      languageOptions.forEach(option => {
        if (option.dataset.lang === currentLang) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });
    };

    // Listen for language changes from other components
    document.addEventListener('languageChanged', () => {
      updateLanguageButton();
    });

    // Initial update
    updateLanguageButton();

    // Check if i18n.js is loaded and update accordingly
    const checkI18nLoaded = setInterval(() => {
      if (window.switchLanguage) {
        clearInterval(checkI18nLoaded);
        // Ensure Arabic is set as default
        if (!localStorage.getItem('preferredLanguage')) {
          localStorage.setItem('preferredLanguage', 'ar');
          document.documentElement.lang = 'ar';
          document.documentElement.dir = 'rtl';
        }
        updateLanguageButton();
      }
    }, 100);
  }

  render() {
    const isSyofficialPage = window.location.pathname.includes('/syofficial');
    
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
        .language-dropdown {
          position: relative;
          display: inline-block;
        }
        .language-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1a1a;
          font-size: 0.95rem;
          transition: all 0.2s;
          font-family: "IBM Plex Sans Arabic", sans-serif;
        }
        .language-button:hover {
          background-color: #f3f4f6;
        }
        .language-button i {
          font-size: 1.1rem;
        }
        .language-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          display: none;
          min-width: 120px;
          z-index: 1000;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .language-menu.show {
          display: block;
          opacity: 1;
          transform: translateY(0);
        }
        .language-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #1a1a1a;
          text-decoration: none;
          font-family: "IBM Plex Sans Arabic", sans-serif;
        }
        .language-option:hover {
          background-color: #f3f4f6;
        }
        .language-option.active {
          background-color: #edf7ed;
          color: #2d4d3c;
          font-weight: 500;
        }
        .language-option i {
          font-size: 1.1rem;
        }
        .flag-icon {
          width: 20px;
          height: 15px;
          object-fit: cover;
          border-radius: 2px;
          margin-right: 0.5rem;
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
            position: relative;
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
          .mobile-language-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.5rem;
          }
          .mobile-language-button:hover {
            background-color: #f3f4f6;
          }
          .mobile-language-button .flag-icon {
            width: 24px;
            height: 18px;
            object-fit: cover;
            border-radius: 2px;
          }
          .mobile-language-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 0.5rem;
            display: none;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .mobile-language-menu.show {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            opacity: 1;
            transform: translateY(0);
          }
          .mobile-language-option {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s;
            background: none;
            border: none;
            width: 2.5rem;
            height: 2.5rem;
          }
          .mobile-language-option:hover {
            background-color: #f3f4f6;
          }
          .mobile-language-option.active {
            background-color: #edf7ed;
          }
          .mobile-language-option .flag-icon {
            width: 24px;
            height: 18px;
            object-fit: cover;
            border-radius: 2px;
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
          .language-dropdown {
            display: none;
          }
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
      <nav class="navbar">
        <div class="container">
          <div class="mobile-header">
            <div class="mobile-title"></div>
            <div class="mobile-actions">
              ${isSyofficialPage ? `
              <button class="mobile-language-button">
                <img src="/syofficial/assets/flags/${localStorage.getItem('preferredLanguage') || 'ar'}.svg" alt="Current language" class="flag-icon">
              </button>
              <div class="mobile-language-menu">
                <button class="mobile-language-option active" data-lang="ar">
                  <img src="/syofficial/assets/flags/ar.svg" alt="Arabic" class="flag-icon">
                </button>
                <button class="mobile-language-option" data-lang="en">
                  <img src="/syofficial/assets/flags/en.svg" alt="English" class="flag-icon">
                </button>
                <button class="mobile-language-option" data-lang="tr">
                  <img src="/syofficial/assets/flags/tr.svg" alt="Turkish" class="flag-icon">
                </button>
                <button class="mobile-language-option" data-lang="ku">
                  <img src="/syofficial/assets/flags/ku.svg" alt="Kurdish" class="flag-icon">
                </button>
              </div>
              ` : ''}
              <button class="menu-button">
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </div>
          <div class="nav-items">
            <a href="/" class="nav-item">
              <i class="fas fa-home" style="color: #2d4d3c;"></i>
              الرئيسية
            </a>
            <a target="_blank" href="https://forum.syrian.zone" class="nav-item">
              <i class="fas fa-comments" style="color:rgb(255, 0, 0);"></i>
              المنتدى
            </a>
            <a href="/tierlist" class="nav-item">
              <i class="fas fa-list-ol" style="color: #2d4d3c;"></i>
              تير ليست الوزراء
            </a>
            <a href="/compass" class="nav-item">
              <i class="fas fa-compass" style="color: #7fbfff;"></i>
              البوصلة السياسية
            </a>
            <a href="/syofficial" class="nav-item">
              <i class="fas fa-check-circle" style="color:rgb(0, 128, 255);"></i>
              الحسابات الرسمية السورية
            </a>
            <a target="_blank" href="https://github.com/SYCompass/Twitter-SVG-Syrian-Flag-Replacer/releases/tag/1.0.1" class="nav-item">
              <i class="fas fa-th" style="color: #ffbf7f;"></i>
              مبدل العلم
            </a>
            ${isSyofficialPage ? `
            <div class="language-dropdown">
              <button class="language-button">
                <img src="/syofficial/assets/flags/${localStorage.getItem('preferredLanguage') || 'ar'}.svg" alt="Current language" class="flag-icon">
                <span class="current-language">العربية</span>
                <i class="fas fa-chevron-down"></i>
              </button>
              <div class="language-menu">
                <a href="#" class="language-option active" data-lang="ar">
                  <img src="/syofficial/assets/flags/ar.svg" alt="Arabic" class="flag-icon">
                  العربية
                </a>
                <a href="#" class="language-option" data-lang="en">
                  <img src="/syofficial/assets/flags/en.svg" alt="English" class="flag-icon">
                  English
                </a>
                <a href="#" class="language-option" data-lang="tr">
                  <img src="/syofficial/assets/flags/tr.svg" alt="Turkish" class="flag-icon">
                  Türkçe
                </a>
                <a href="#" class="language-option" data-lang="ku">
                  <img src="/syofficial/assets/flags/ku.svg" alt="Kurdish" class="flag-icon">
                  Kurmanji
                </a>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar); 