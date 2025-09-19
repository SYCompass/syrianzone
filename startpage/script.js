// Startpage JavaScript - SyrianZone
class Startpage {
    constructor() {
        this.settings = this.loadSettings();
        this.weatherWorkerUrl = 'https://syrianzone.hade-alahmad1.workers.dev/'; 
        this.currentLanguage = this.settings.language || 'ar';
        this.isEditMode = false;
        this.init();
    }
        init() {
        this.setupEventListeners();
        this.applyTheme();
        this.applyLanguage();
        this.loadCustomLinks();
        this.updateWeatherDisplay();
        this.setupSearchEngine();
        this.initClock();
        this.checkDonationReminder();
    }

    // Settings Management
    loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            language: 'ar', // Default to Arabic
            searchEngine: 'duckduckgo',
            customSearchUrl: '',
            weather: {
                locationType: 'governorate',
                governorate: 'damascus',
                coordinates: {
                    lat: 33.5138,
                    lon: 36.2765
                }
            },
            clockFormat: '12',
            customLinks: {
                row1: []
            },
            donationReminder: {
                enabled: true,
                lastDismissed: null,
                currentlyShowing: false,
                firstShownAt: null
            }
        };

        const savedSettings = localStorage.getItem('startpage-settings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('startpage-settings', JSON.stringify(this.settings));
    }

    // Theme Management
    applyTheme() {
        if (window.SZ?.theme) {
            window.SZ.theme.apply(this.settings.theme);
        } else {
            document.documentElement.setAttribute('data-theme', this.settings.theme);
        }
        this.updateThemeIcon();
    }

    cycleTheme() {
    const themes = window.SZ?.theme?.themes || ['light', 'dark', 'dark-blue', 'dark-purple', 'dark-green', 'high-contrast'];
    const currentIndex = themes.indexOf(this.settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.settings.theme = themes[nextIndex];
    if (window.SZ?.theme) {
        window.SZ.theme.set(this.settings.theme);
    }
    this.applyTheme();
    this.saveSettings();
    }

    setTheme(theme) {
    this.settings.theme = theme;
    if (window.SZ?.theme) {
        window.SZ.theme.set(theme);
    }
    this.applyTheme();
    this.saveSettings();
    }


    initClock() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
}

updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('clockTime');
    const dateElement = document.getElementById('clockDate');
    
    if (!timeElement || !dateElement) return;
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let period = '';
    
    if (this.settings.clockFormat === '12') {
        period = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
    }
    
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');    
    timeElement.textContent = `${hours}:${minutes}${period}`;
    
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const locale = this.currentLanguage === 'ar' ? 'ar-SY' : 'en-US';
    dateElement.textContent = now.toLocaleDateString(locale, dateOptions);
}

    // Donation Reminder System
    checkDonationReminder() {
        if (!this.settings.donationReminder.enabled) return;

        const now = new Date();
        
        // If currently showing, check if 24 hours passed since first shown
        if (this.settings.donationReminder.currentlyShowing) {
            const firstShownAt = this.settings.donationReminder.firstShownAt ? new Date(this.settings.donationReminder.firstShownAt) : null;
            if (firstShownAt && (now.getTime() - firstShownAt.getTime()) > (24 * 60 * 60 * 1000)) {
                this.hideDonationNotification();
            } else {
                this.showDonationReminder(); 
            }
            return;
        }

        // Check if we should show new reminder (never dismissed or new month)
        const lastDismissed = this.settings.donationReminder.lastDismissed ? new Date(this.settings.donationReminder.lastDismissed) : null;
        if (!lastDismissed || this.isNewMonth(now, lastDismissed)) {
            this.showDonationReminder();
        }
    }

    isNewMonth(now, lastDismissed) {
        return (now.getFullYear() * 12 + now.getMonth()) > (lastDismissed.getFullYear() * 12 + lastDismissed.getMonth());
    }

    showDonationReminder() {
        // Add animation to the donation link
        const donationLink = document.querySelector('a[href*="syrfund.gov.sy"]');
        if (donationLink) {
            donationLink.classList.add('donation-highlight');
        }

        // Show notification
        this.createDonationNotification();
        
        if (!this.settings.donationReminder.currentlyShowing) {
            this.settings.donationReminder.firstShownAt = new Date().toISOString();
        }
        this.settings.donationReminder.currentlyShowing = true;
        this.saveSettings();
    }

    createDonationNotification() {
        if (document.querySelector('.donation-notification')) return;
        
        const lang = languages[this.currentLanguage];
        const notification = document.createElement('div');
        notification.className = 'donation-notification fade-in';
        notification.innerHTML = `
            <div class="donation-notification-content">
                <i class="fas fa-hand-holding-heart link-icon"></i>
                <div class="donation-notification-text">
                    <strong>${lang.donationReminder?.title || 'Support Syria'}</strong>
                    <p>${lang.donationReminder?.message || 'Your donation helps rebuild Syria. Every contribution makes a difference.'}</p>
                </div>
                <button class="donation-notification-close" onclick="startpage.closeDonationNotification()">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);
    }

    closeDonationNotification() {
        this.hideDonationNotification();
    }

    hideDonationNotification() {
        // Remove notification and animation
        const notification = document.querySelector('.donation-notification');
        const donationLink = document.querySelector('a[href*="syrfund.gov.sy"]');
        
        if (notification) notification.remove();
        if (donationLink) donationLink.classList.remove('donation-highlight');
        
        this.settings.donationReminder.currentlyShowing = false;
        this.settings.donationReminder.firstShownAt = null;
        this.settings.donationReminder.lastDismissed = new Date().toISOString();
        
        this.saveSettings();
    }

    updateDonationNotificationText() {
        const notification = document.querySelector('.donation-notification');
        if (!notification) return;

        const lang = languages[this.currentLanguage];
        if (!lang?.donationReminder) return;

        const titleElement = notification.querySelector('.donation-notification-text strong');
        const messageElement = notification.querySelector('.donation-notification-text p');

        if (titleElement) {
            titleElement.textContent = lang.donationReminder.title;
        }
        if (messageElement) {
            messageElement.textContent = lang.donationReminder.message;
        }
    }

    updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        const icons = {
            'light': '☀️',
            'dark': '🌙',
            'dark-blue': '💙',
            'dark-purple': '💜',
            'dark-green': '💚',
            'high-contrast': '⚡'
        };
        themeIcon.textContent = icons[this.settings.theme] || '🌙';
    }
}

    // Language Management
    applyLanguage() {
        document.documentElement.setAttribute('lang', this.currentLanguage);
        document.body.setAttribute('dir', this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
        this.updateLanguageIcon();
        this.translatePage();
        // Update edit button text if exists
        const editBtn = document.getElementById('editLinksBtn');
        const lang = languages[this.currentLanguage];
        if (editBtn && lang) {
            editBtn.textContent = this.isEditMode ? (lang.done || 'Done') : (lang.edit || 'Edit');
        }
        // Update add link modal labels/buttons
        this.translateAddLinkModal();
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.settings.language = this.currentLanguage;
        this.applyLanguage();
        this.saveSettings();
    }

    updateLanguageIcon() {
        const languageFlag = document.getElementById('languageFlag');
        if (languageFlag) {
            languageFlag.src = this.currentLanguage === 'ar' ? '/assets/ar.svg' : '/assets/en.svg';
            languageFlag.alt = this.currentLanguage === 'ar' ? 'Arabic' : 'English';
        }
    }

    translatePage() {
        const lang = languages[this.currentLanguage];
        if (!lang) return;

        // Update About button
        const aboutBtn = document.getElementById('aboutBtn');
        if (aboutBtn) {
            aboutBtn.textContent = lang.about;
        }

        // Update About modal title and close button
        const aboutModalTitle = document.querySelector('#aboutModal h3');
        if (aboutModalTitle) {
            aboutModalTitle.textContent = aboutModalTitle.getAttribute(`data-${this.currentLanguage}`);
        }

        const closeAboutModal = document.getElementById('closeAboutModal');
        if (closeAboutModal) {
            closeAboutModal.textContent = closeAboutModal.getAttribute(`data-${this.currentLanguage}`);
        }

        // Update search placeholder
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = lang.searchPlaceholder;
        }

        // Update search button
        const searchButton = document.querySelector('.search-button');
        if (searchButton) {
            searchButton.textContent = lang.searchButton;
        }

        // Update custom search URL placeholder
        const customSearchUrl = document.getElementById('customSearchUrl');
        if (customSearchUrl) {
            customSearchUrl.placeholder = lang.customSearchUrl;
        }

        // Update search engine options
        const searchEngine = document.getElementById('searchEngine');
        if (searchEngine) {
            const options = searchEngine.options;
            for (let i = 0; i < options.length; i++) {
                const value = options[i].value;
                if (lang.searchEngines[value]) {
                    options[i].textContent = lang.searchEngines[value];
                }
            }
        }

        // Update link section titles
        const quickLinksTitle = document.querySelector('.preset-links h3');
        if (quickLinksTitle) {
            quickLinksTitle.textContent = lang.quickLinks;
        }

        const customLinksTitle = document.querySelectorAll('.custom-links h3')[0];
        if (customLinksTitle) {
            customLinksTitle.textContent = lang.customLinks;
        }

        const moreLinksTitle = document.querySelectorAll('.custom-links h3')[1];
        if (moreLinksTitle) {
            moreLinksTitle.textContent = lang.moreLinks;
        }

        // Update preset link texts
        this.updatePresetLinkTexts(lang);

        // Update weather loading text
        const weatherLoading = document.querySelector('.weather-loading');
        if (weatherLoading) {
            weatherLoading.textContent = lang.weatherLoading;
        }

        // Update settings panel
        this.translateSettingsPanel(lang);

        // Update custom links action buttons
        const addCustomLinkBtn = document.getElementById('addCustomLinkBtn');
        if (addCustomLinkBtn) {
            addCustomLinkBtn.textContent = lang.addNewLink;
        }
        const editLinksBtn = document.getElementById('editLinksBtn');
        if (editLinksBtn) {
            editLinksBtn.textContent = this.isEditMode ? (lang.done || 'Done') : (lang.edit || 'Edit');
        }
    }

    updatePresetLinkTexts(lang) {
        const presetLinks = document.getElementById('presetLinks');
        if (!presetLinks) return;

        const linkItems = presetLinks.querySelectorAll('.link-item');
        linkItems.forEach((item, index) => {
            const linkText = item.querySelector('.link-text');
            if (linkText) {
                switch (index) {
                    case 0: // Official Accounts
                        linkText.textContent = lang.officialAccounts;
                        break;
                    case 1: // Visual Identity
                        linkText.textContent = lang.visualIdentity;
                        break;
                    case 2: // Party Guide
                        linkText.textContent = lang.partyGuide;
                        break;
                    case 3: // Minister Tierlist
                        linkText.textContent = lang.ministerTierlist;
                        break;
                    case 4: // House of Representatives
                        linkText.textContent = lang.house;
                        break;
                    case 5: // Political Compass
                        linkText.textContent = lang.politicalCompass;
                        break;
                    case 6: // Syrian Websites
                        linkText.textContent = lang.syrianWebsites;
                        break;
                    case 7: // Flag Replacer
                        linkText.textContent = lang.flagReplacer;
                        break;
                    case 8: // Forum
                        linkText.textContent = lang.forum;
                        break;
                }
            }
        });
    }

    translateSettingsPanel(lang) {
        const themeSettingsTitle = document.querySelector('.setting-group h4');
        if (themeSettingsTitle && themeSettingsTitle.textContent.includes('Theme')) {
            themeSettingsTitle.textContent = lang.themeSettings;
        }

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            const options = themeSelect.options;
            for (let i = 0; i < options.length; i++) {
                const value = options[i].value;
                if (lang.themes[value]) {
                    options[i].textContent = lang.themes[value];
                }
            }
        }

         const clockSettingsTitle = Array.from(document.querySelectorAll('.setting-group h4'))
        .find(el => el.textContent.includes('Clock'));
    if (clockSettingsTitle) {
        clockSettingsTitle.textContent = lang.clockSettings;
    }
    
    const clockFormatLabel = document.querySelector('label[for="clockFormat"]');
    if (clockFormatLabel) {
        clockFormatLabel.textContent = lang.timeFormat;
    }
    
    const clockFormatSelect = document.getElementById('clockFormat');
    if (clockFormatSelect) {
        clockFormatSelect.options[0].textContent = lang.format12;
        clockFormatSelect.options[1].textContent = lang.format24;
    }
        // Update settings panel titles
        const settingsTitle = document.querySelector('.settings-header h3');
        if (settingsTitle) {
            settingsTitle.textContent = lang.settings;
        }

        // Update weather settings
        const weatherSettingsTitle = document.querySelector('.setting-group h4');
        if (weatherSettingsTitle) {
            weatherSettingsTitle.textContent = lang.weatherSettings;
        }

        // Update location type labels
        const locationTypeLabel = document.querySelector('label[for="locationType"]');
        if (locationTypeLabel) {
            locationTypeLabel.textContent = lang.locationType;
        }

        // Update location type options
        const locationTypeSelect = document.getElementById('locationType');
        if (locationTypeSelect) {
            const options = locationTypeSelect.options;
            options[0].textContent = lang.governorate;
            options[1].textContent = lang.customCoordinates;
        }

        // Update governorate label
        const governorateLabel = document.querySelector('label[for="governorate"]');
        if (governorateLabel) {
            governorateLabel.textContent = lang.governorateLabel;
        }

        // Update governorate options
        const governorateSelect = document.getElementById('governorate');
        if (governorateSelect) {
            const options = governorateSelect.options;
            for (let i = 0; i < options.length; i++) {
                const value = options[i].value;
                if (lang.governorates[value]) {
                    options[i].textContent = lang.governorates[value];
                }
            }
        }

        // Update coordinate labels
        const latitudeLabel = document.querySelector('label[for="latitude"]');
        if (latitudeLabel) {
            latitudeLabel.textContent = lang.latitude;
        }

        const longitudeLabel = document.querySelector('label[for="longitude"]');
        if (longitudeLabel) {
            longitudeLabel.textContent = lang.longitude;
        }

        // Update custom links section
        const customLinksTitle = document.querySelectorAll('.setting-group h4')[1];
        if (customLinksTitle) {
            customLinksTitle.textContent = lang.customLinks;
        }

        const addLinkBtn = document.getElementById('addLinkBtn');
        if (addLinkBtn) {
            addLinkBtn.textContent = lang.addNewLink;
        }

        // Update data management section
        const dataManagementTitle = document.querySelectorAll('.setting-group h4')[2];
        if (dataManagementTitle) {
            dataManagementTitle.textContent = lang.dataManagement;
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.textContent = lang.exportSettings;
        }

        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.textContent = lang.importSettings;
        }

        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.textContent = lang.resetToDefaults;
        }

        // donation settings section
        const donationSettingsTitle = Array.from(document.querySelectorAll('.setting-group h4'))
            .find(el => el.textContent.includes('Donation') || el.textContent.includes('إعدادات التبرع'));
        if (donationSettingsTitle && lang.donationReminder) {
            donationSettingsTitle.textContent = lang.donationReminder.sectionTitle;
        }

        const donationReminderLabel = document.querySelector('.donation-reminder-label');
        if (donationReminderLabel && lang.donationReminder) {
            donationReminderLabel.textContent = lang.donationReminder.settingLabel;
        }

        const donationDescription = document.querySelector('.setting-description');
        if (donationDescription && lang.donationReminder) {
            donationDescription.textContent = lang.donationReminder.settingDescription;
        }

        // Update notification text if currently visible
        this.updateDonationNotificationText();
    }

    // Search Engine Management
    setupSearchEngine() {
        const searchEngineSelect = document.getElementById('searchEngine');
        const customSearchInput = document.getElementById('customSearchUrl');
        
        if (searchEngineSelect) {
            searchEngineSelect.value = this.settings.searchEngine;
        }
        
        if (customSearchInput) {
            customSearchInput.value = this.settings.customSearchUrl;
            customSearchInput.style.display = this.settings.searchEngine === 'custom' ? 'block' : 'none';
        }
    }

    getSearchUrl(query) {
        const searchEngines = {
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            searx: `https://searx.be/?q=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            custom: this.settings.customSearchUrl.replace('{query}', encodeURIComponent(query))
        };

        return searchEngines[this.settings.searchEngine] || searchEngines.duckduckgo;
    }

    // Weather Management
    async updateWeatherDisplay() {
        const weatherContent = document.getElementById('weatherContent');
        if (!weatherContent) return;

        try {
            const weatherData = await this.fetchWeather();
            this.displayWeather(weatherData);
        } catch (error) {
            console.error('Weather fetch error:', error);
            weatherContent.innerHTML = '<div class="weather-error">Weather unavailable</div>';
        }
    }

// Inside your Startpage class

async fetchWeather() {
    let coordinates;
    
    if (this.settings.weather.locationType === 'governorate') {
        coordinates = this.getGovernorateCoordinates(this.settings.weather.governorate);
    } else {
        coordinates = this.settings.weather.coordinates;
    }

    const url = `${this.weatherWorkerUrl}?lat=${coordinates.lat}&lon=${coordinates.lon}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Weather API request failed');
    }
    
    return await response.json();
}
    getGovernorateCoordinates(governorate) {
        const coordinates = {
            damascus: { lat: 33.5138, lon: 36.2765 },
            aleppo: { lat: 36.2021, lon: 37.1343 },
            homs: { lat: 34.7268, lon: 36.7233 },
            hama: { lat: 35.1313, lon: 36.7578 },
            latakia: { lat: 35.5407, lon: 35.7826 },
            tartus: { lat: 34.8950, lon: 35.8867 },
            'deir-ez-zor': { lat: 35.3333, lon: 40.1500 },
            idlib: { lat: 35.9333, lon: 36.6333 },
            daraa: { lat: 32.6189, lon: 36.1021 },
            quneitra: { lat: 33.1253, lon: 35.8247 },
            sweida: { lat: 32.7083, lon: 36.5667 },
            'rural-damascus': { lat: 33.5138, lon: 36.2765 }
        };
        
        return coordinates[governorate] || coordinates.damascus;
    }

    displayWeather(weatherData) {
        const weatherContent = document.getElementById('weatherContent');
        if (!weatherContent) return;

        const temp = Math.round(weatherData.main.temp);
        const description = weatherData.weather[0].description;
        const humidity = weatherData.main.humidity;
        const windSpeed = Math.round(weatherData.wind.speed * 3.6); // Convert m/s to km/h
        const cityName = weatherData.name;

        const weatherIcon = this.getWeatherIcon(weatherData.weather[0].id);
        const lang = languages[this.currentLanguage];

        // Translate weather description
        const translatedDescription = lang.weatherDescriptions[description.toLowerCase()] || description;
        
        weatherContent.innerHTML = `
            <div class="weather-info fade-in">
                <div class="weather-main">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span class="weather-icon">${weatherIcon}</span>
                        <div>
                            <div class="weather-temp">${temp}${lang.weatherUnits.celsius}</div>
                            <div style="color: var(--text-secondary); font-size: 1.1rem;">${translatedDescription}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">${cityName}</div>
                        </div>
                    </div>
                    <div class="weather-details">
                        <div class="weather-detail">
                            <div class="weather-detail-label">${lang.weatherHumidity}</div>
                            <div class="weather-detail-value">${humidity}%</div>
                        </div>
                        <div class="weather-detail">
                            <div class="weather-detail-label">${lang.weatherWind}</div>
                            <div class="weather-detail-value">${windSpeed} ${lang.weatherUnits.kmh}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getWeatherIcon(weatherId) {
        // Weather condition codes from OpenWeatherMap
        if (weatherId >= 200 && weatherId < 300) return '⛈️'; // Thunderstorm
        if (weatherId >= 300 && weatherId < 400) return '🌧️'; // Drizzle
        if (weatherId >= 500 && weatherId < 600) return '🌧️'; // Rain
        if (weatherId >= 600 && weatherId < 700) return '❄️'; // Snow
        if (weatherId >= 700 && weatherId < 800) return '🌫️'; // Atmosphere
        if (weatherId === 800) return '☀️'; // Clear
        if (weatherId === 801) return '🌤️'; // Few clouds
        if (weatherId === 802) return '⛅'; // Scattered clouds
        if (weatherId >= 803 && weatherId < 900) return '☁️'; // Cloudy
        return '🌤️'; // Default
    }

    // Custom Links Management
    loadCustomLinks() {
        this.renderCustomLinks('customLinksRow1', this.settings.customLinks.row1);
        this.updateCustomLinksList();
    }

    renderCustomLinks(containerId, links) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        container.classList.toggle('edit-mode', this.isEditMode);
        
        if (links.length === 0) {
            const lang = languages[this.currentLanguage];
            container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-style: italic;">${lang.noCustomLinks}</div>`;
            return;
        }

        links.forEach((link, index) => {
            const linkElement = this.createLinkElement(link, index);
            container.appendChild(linkElement);
        });
    }



createLinkElement(link, index) {
    const linkElement = document.createElement('a');
    linkElement.href = this.isEditMode ? 'javascript:void(0)' : link.url;
    linkElement.className = 'link-item';
    linkElement.target = '_blank';
    linkElement.rel = 'noopener';
    
    Object.assign(linkElement.style, {
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        minHeight: 'auto',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    });
    
    linkElement.addEventListener('mouseenter', () => {
        linkElement.style.transform = 'translateY(-2px)';
        linkElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    linkElement.addEventListener('mouseleave', () => {
        linkElement.style.transform = 'translateY(0)';
        linkElement.style.boxShadow = 'var(--shadow)';
    });
    
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;';
    
    // Extract hostname for favicon
    let hostname = '';
    try {
        const url = new URL(link.url);
        hostname = url.hostname;
    } catch (error) {
        console.warn('Invalid URL for custom link:', link.url);
        hostname = '';
    }
    
    const faviconImg = document.createElement('img');
    faviconImg.style.cssText = 'width: 24px; height: 24px; border-radius: 4px; display: block;';
    faviconImg.alt = `${link.name} favicon`;
    
    const fallbackIcon = document.createElement('span');
    fallbackIcon.textContent = link.icon || '🔗';
    fallbackIcon.style.cssText = 'font-size: 20px; display: none; line-height: 1;';
    
    const faviconSources = [
        `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`,
        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
        `https://${hostname}/favicon.ico`
    ];
    
    let currentSourceIndex = 0;
    
    const tryNextSource = () => {
        if (currentSourceIndex < faviconSources.length) {
            faviconImg.src = faviconSources[currentSourceIndex];
            currentSourceIndex++;
        } else {
            faviconImg.style.display = 'none';
            fallbackIcon.style.display = 'block';
        }
    };
    
    faviconImg.addEventListener('error', tryNextSource);
    
    tryNextSource();
    
    if (!hostname) {
        faviconImg.style.display = 'none';
        fallbackIcon.style.display = 'block';
    }
    
    iconContainer.appendChild(faviconImg);
    iconContainer.appendChild(fallbackIcon);
    
    const textElement = document.createElement('span');
    textElement.textContent = link.name;
    textElement.style.cssText = 'color: var(--text-primary); font-weight: 500; font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    
    linkElement.appendChild(iconContainer);
    linkElement.appendChild(textElement);
    
    if (this.isEditMode) {
        linkElement.addEventListener('click', (e) => e.preventDefault());
        const removeBtn = document.createElement('button');
        removeBtn.className = 'link-remove-btn';
        removeBtn.setAttribute('aria-label', 'Remove link');
        removeBtn.textContent = '✕';
        removeBtn.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 12px; margin-left: auto; padding: 4px 6px; flex-shrink: 0;';
        
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeCustomLink(index);
        });
        
        removeBtn.addEventListener('mouseenter', () => {
            removeBtn.style.background = 'var(--accent-color)';
            removeBtn.style.color = 'white';
        });
        
        removeBtn.addEventListener('mouseleave', () => {
            removeBtn.style.background = 'var(--bg-primary)';
            removeBtn.style.color = 'var(--text-secondary)';
        });
        
        linkElement.appendChild(removeBtn);
    }
    
    return linkElement;
}

    addCustomLink() {
        this.openAddLinkModal();
    }

    removeCustomLink(linkIndex) {
        this.settings.customLinks.row1.splice(linkIndex, 1);
        
        this.saveSettings();
        this.loadCustomLinks();
    }

    updateCustomLinksList() {
        const container = document.getElementById('customLinksList');
        if (!container) return;

        container.innerHTML = '';
        
        const lang = languages[this.currentLanguage];
        
        // Custom Links Row
        if (this.settings.customLinks.row1.length > 0) {
            const rowHeader = document.createElement('h5');
            rowHeader.textContent = lang.rowHeaders.custom;
            rowHeader.style.marginTop = '15px';
            container.appendChild(rowHeader);
            
            this.settings.customLinks.row1.forEach((link, index) => {
                const linkItem = this.createCustomLinkItem(link, index);
                container.appendChild(linkItem);
            });
        }
    }

    createCustomLinkItem(link, index) {
        const item = document.createElement('div');
        item.className = 'custom-link-item';
        
        item.innerHTML = `
            <input type="text" value="${link.name}" placeholder="Link name" readonly>
            <input type="text" value="${link.url}" placeholder="Link URL" readonly>
            <button class="remove-link-btn" onclick="startpage.removeCustomLink(${index})">Remove</button>
        `;
        
        return item;
    }

    // Settings Panel Management
    openSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            this.populateSettingsPanel();
            settingsPanel.classList.add('open');
        }
    }

    closeSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.remove('open');
        }
    }



    // Add Link Modal
    openAddLinkModal() {
        const modal = document.getElementById('addLinkModal');
        if (!modal) return;
        // Reset inputs
        const nameInput = document.getElementById('linkNameInput');
        const urlInput = document.getElementById('linkUrlInput');
        const iconInput = document.getElementById('linkIconInput');
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        if (iconInput) iconInput.value = '';
        this.translateAddLinkModal();
        modal.classList.add('open');
    }

    closeAddLinkModal() {
        const modal = document.getElementById('addLinkModal');
        if (!modal) return;
        modal.classList.remove('open');
    }

    translateAddLinkModal() {
        const lang = languages[this.currentLanguage];
        const title = document.getElementById('addLinkModalTitle');
        const nameLabel = document.getElementById('linkNameLabel');
        const urlLabel = document.getElementById('linkUrlLabel');
        const iconLabel = document.getElementById('linkIconLabel');
        const saveBtn = document.getElementById('saveAddLinkBtn');
        const cancelBtn = document.getElementById('cancelAddLinkBtn');
        if (title && lang.addLinkModalTitle) title.textContent = lang.addLinkModalTitle;
        if (nameLabel && lang.linkName) nameLabel.textContent = lang.linkName;
        if (urlLabel && lang.linkUrl) urlLabel.textContent = lang.linkUrl;
        if (iconLabel && lang.linkIconOptional) iconLabel.textContent = lang.linkIconOptional;
        if (saveBtn && lang.save) saveBtn.textContent = lang.save;
        if (cancelBtn && lang.cancel) cancelBtn.textContent = lang.cancel;
    }

    saveAddLinkFromModal() {
        const nameInput = document.getElementById('linkNameInput');
        const urlInput = document.getElementById('linkUrlInput');
        const iconInput = document.getElementById('linkIconInput');
        if (!nameInput || !urlInput || !iconInput) return;

        const name = (nameInput.value || '').trim();
        let url = (urlInput.value || '').trim();
        const icon = (iconInput.value || '').trim() || '🔗';

        if (!name || !url) return;
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        const newLink = { name, url, icon };

        if (this.settings.customLinks.row1.length < 8) {
            this.settings.customLinks.row1.push(newLink);
        } else {
            alert('Custom links row is full!');
            return;
        }

        this.saveSettings();
        this.loadCustomLinks();
        this.closeAddLinkModal();
    }

    toggleEditLinks() {
        this.isEditMode = !this.isEditMode;
        const editBtn = document.getElementById('editLinksBtn');
        const lang = languages[this.currentLanguage];
        if (editBtn) {
            editBtn.textContent = this.isEditMode ? (lang.done || 'Done') : (lang.edit || 'Edit');
        }
        this.renderCustomLinks('customLinksRow1', this.settings.customLinks.row1);
    }

    // About Modal
	openAboutModal() {
		const modal = document.getElementById('aboutModal');
		if (!modal) return;
		this.loadAboutContent();
		modal.classList.add('open');
	}

	closeAboutModal() {
		const modal = document.getElementById('aboutModal');
		if (!modal) return;
		modal.classList.remove('open');
	}

    async loadAboutContent() {
        const aboutContent = document.getElementById('aboutContent');
        if (!aboutContent) {
            console.error('About content element not found');
            return;
        }

        console.log('About content element found, setting initial content');

        // Show loading message while content loads
        aboutContent.innerHTML = `
            <div style="text-align: center; color: var(--text-primary); padding: 20px;">
                <h2 style="color: var(--accent-color);">Loading...</h2>
                <p>جاري التحميل...</p>
            </div>
        `;

        console.log('Initial content set, aboutContent.innerHTML length:', aboutContent.innerHTML.length);

        try {
            const response = await fetch('../README.md');
            if (!response.ok) {
                throw new Error('Failed to load README content');
            }
            
            const markdownContent = await response.text();
            const htmlContent = this.convertMarkdownToHtml(markdownContent);
            aboutContent.innerHTML = htmlContent;
        } catch (error) {
            console.error('Error loading about content:', error);
            aboutContent.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <p>Unable to load README content.</p>
                    <p>Please check the README.md file.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }

    convertMarkdownToHtml(markdown) {
        // Simple markdown to HTML conversion
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
            
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|o]|<li>)(.*$)/gim, '<p>$1</p>')
            
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[h|u|o]|<li>)/g, '$1')
            .replace(/(<\/[h|u|o]|<\/li>)<\/p>/g, '$1');

        return html;
    }

    // Weather Settings Modal
    openWeatherSettings() {
        console.log('Opening weather settings...');
        const modal = document.getElementById('weatherModal');
        if (modal) {
            this.populateWeatherModal();
            modal.classList.add('open');
            console.log('Weather modal opened successfully');
        } else {
            console.error('Weather modal not found');
        }
    }

    closeWeatherModal() {
        const modal = document.getElementById('weatherModal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    populateWeatherModal() {
        const locationType = document.getElementById('modalLocationType');
        const governorate = document.getElementById('modalGovernorate');
        const latitude = document.getElementById('modalLatitude');
        const longitude = document.getElementById('modalLongitude');
        
        if (locationType) locationType.value = this.settings.weather.locationType;
        if (governorate) governorate.value = this.settings.weather.governorate;
        if (latitude) latitude.value = this.settings.weather.coordinates.lat;
        if (longitude) longitude.value = this.settings.weather.coordinates.lon;
        
        this.toggleModalLocationSettings();
    }

    populateSettingsPanel() {
        const locationType = document.getElementById('locationType');
        const governorate = document.getElementById('governorate');
        const latitude = document.getElementById('latitude');
        const longitude = document.getElementById('longitude');
        const themeSelect = document.getElementById('themeSelect');
        const clockFormat = document.getElementById('clockFormat');
        if (clockFormat) {
        clockFormat.value = this.settings.clockFormat;
        }
        if (themeSelect) {
        themeSelect.value = this.settings.theme;
        }
        
        if (locationType) locationType.value = this.settings.weather.locationType;
        if (governorate) governorate.value = this.settings.weather.governorate;
        if (latitude) latitude.value = this.settings.weather.coordinates.lat;
        if (longitude) longitude.value = this.settings.weather.coordinates.lon;
        
        this.toggleLocationSettings();
    }

    toggleModalLocationSettings() {
        const locationType = document.getElementById('modalLocationType');
        const governorateSetting = document.getElementById('modalGovernorateSetting');
        const coordinatesSetting = document.getElementById('modalCoordinatesSetting');
        
        if (locationType && governorateSetting && coordinatesSetting) {
            if (locationType.value === 'governorate') {
                governorateSetting.style.display = 'block';
                coordinatesSetting.style.display = 'none';
            } else {
                governorateSetting.style.display = 'none';
                coordinatesSetting.style.display = 'block';
            }
        }
    }

    saveWeatherSettings() {
        const locationType = document.getElementById('modalLocationType');
        const governorate = document.getElementById('modalGovernorate');
        const latitude = document.getElementById('modalLatitude');
        const longitude = document.getElementById('modalLongitude');
        
        if (locationType && governorate && latitude && longitude) {
            this.settings.weather.locationType = locationType.value;
            this.settings.weather.governorate = governorate.value;
            this.settings.weather.coordinates.lat = parseFloat(latitude.value) || 33.5138;
            this.settings.weather.coordinates.lon = parseFloat(longitude.value) || 36.2765;
            
            this.saveSettings();
            this.updateWeatherDisplay();
            this.closeWeatherModal();
        }
    }

    saveWeatherSettingsFromPanel() {
        const locationType = document.getElementById('locationType');
        const governorate = document.getElementById('governorate');
        const latitude = document.getElementById('latitude');
        const longitude = document.getElementById('longitude');
        
        if (locationType && governorate && latitude && longitude) {
            this.settings.weather.locationType = locationType.value;
            this.settings.weather.governorate = governorate.value;
            this.settings.weather.coordinates.lat = parseFloat(latitude.value) || 33.5138;
            this.settings.weather.coordinates.lon = parseFloat(longitude.value) || 36.2765;
            
            this.saveSettings();
            this.updateWeatherDisplay();
        }
    }

    // Data Management
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'startpage-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importSettings() {
        const fileInput = document.getElementById('importFile');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...importedSettings };
                this.saveSettings();
                this.applyTheme();
                this.setupSearchEngine();
                this.loadCustomLinks();
                this.updateWeatherDisplay();
                
                alert('Settings imported successfully!');
            } catch (error) {
                alert('Error importing settings. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            localStorage.removeItem('startpage-settings');
            this.settings = this.loadSettings();
            this.applyTheme();
            this.setupSearchEngine();
            this.loadCustomLinks();
            this.updateWeatherDisplay();
            alert('Settings reset to defaults!');
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // About button
        const aboutBtn = document.getElementById('aboutBtn');
        if (aboutBtn) {
            console.log('About button found, adding event listener');
            aboutBtn.addEventListener('click', (e) => {
                console.log('About button clicked!');
                e.preventDefault();
                this.openAboutModal();
            });
        } else {
            console.error('About button not found');
        }

        const clockFormat = document.getElementById('clockFormat');
        if (clockFormat) {
        clockFormat.value = this.settings.clockFormat;
        clockFormat.addEventListener('change', (e) => {
            this.settings.clockFormat = e.target.value;
            this.saveSettings();
            this.updateClock(); 
        });
    }

    // Donation reminder toggle
    const donationReminderToggle = document.getElementById('donationReminderToggle');
    if (donationReminderToggle) {
        donationReminderToggle.checked = this.settings.donationReminder.enabled;
        donationReminderToggle.addEventListener('change', (e) => {
            this.settings.donationReminder.enabled = e.target.checked;
            
            // If disabled while showing, hide the notification
            if (!e.target.checked && this.settings.donationReminder.currentlyShowing) {
                this.closeDonationNotification();
            }
            
            this.saveSettings();
        });
    }

        // Language toggle
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => this.toggleLanguage());
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
        themeToggle.addEventListener('click', () => this.cycleTheme());
        }

        // Search form
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Search engine selector
        const searchEngine = document.getElementById('searchEngine');
        if (searchEngine) {
            searchEngine.addEventListener('change', (e) => this.handleSearchEngineChange(e));
        }

        // Settings panel
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettings = document.getElementById('closeSettings');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.closeSettings());
        }

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
        });
}

        // About modal controls
        const closeAboutModal = document.getElementById('closeAboutModal');
        if (closeAboutModal) {
            closeAboutModal.addEventListener('click', () => this.closeAboutModal());
        }

        // Weather modal controls
        const closeWeatherModal = document.getElementById('closeWeatherModal');
        const saveWeatherBtn = document.getElementById('saveWeatherBtn');
        const cancelWeatherBtn = document.getElementById('cancelWeatherBtn');
        
        if (closeWeatherModal) {
            closeWeatherModal.addEventListener('click', () => this.closeWeatherModal());
        }
        if (saveWeatherBtn) {
            saveWeatherBtn.addEventListener('click', () => this.saveWeatherSettings());
        }
        if (cancelWeatherBtn) {
            cancelWeatherBtn.addEventListener('click', () => this.closeWeatherModal());
        }

        // Settings panel location type change
        const locationType = document.getElementById('locationType');
        if (locationType) {
            locationType.addEventListener('change', () => this.toggleLocationSettings());
        }

        // Settings panel governorate and coordinates
        const governorate = document.getElementById('governorate');
        const latitude = document.getElementById('latitude');
        const longitude = document.getElementById('longitude');
        
        if (governorate) {
            governorate.addEventListener('change', () => this.saveWeatherSettingsFromPanel());
        }
        if (latitude) {
            latitude.addEventListener('change', () => this.saveWeatherSettingsFromPanel());
        }
        if (longitude) {
            longitude.addEventListener('change', () => this.saveWeatherSettingsFromPanel());
        }

        // Modal location type change
        const modalLocationType = document.getElementById('modalLocationType');
        if (modalLocationType) {
            modalLocationType.addEventListener('change', () => this.toggleModalLocationSettings());
        }

        // Data management buttons
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const resetBtn = document.getElementById('resetBtn');
        const addLinkBtn = document.getElementById('addLinkBtn');
        const addCustomLinkBtn = document.getElementById('addCustomLinkBtn');
        const editLinksBtn = document.getElementById('editLinksBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => this.addCustomLink());
        }
        if (addCustomLinkBtn) {
            addCustomLinkBtn.addEventListener('click', () => this.openAddLinkModal());
        }
        if (editLinksBtn) {
            editLinksBtn.addEventListener('click', () => this.toggleEditLinks());
        }

        // File import
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // Click outside settings panel to close
        document.addEventListener('click', (e) => {
            const settingsPanel = document.getElementById('settingsPanel');
            const settingsBtn = document.getElementById('settingsBtn');
            
            if (settingsPanel && settingsPanel.classList.contains('open') && 
                !settingsPanel.contains(e.target) && 
                !settingsBtn.contains(e.target)) {
                this.closeSettings();
            }
        });

		// Click overlay to close modals (only when clicking the overlay itself)
		document.addEventListener('click', (e) => {
            const weatherModal = document.getElementById('weatherModal');
            const aboutModal = document.getElementById('aboutModal');
            const addLinkModal = document.getElementById('addLinkModal');
            
			if (weatherModal && weatherModal.classList.contains('open') &&
				weatherModal.contains(e.target) &&
				!weatherModal.querySelector('.modal-content').contains(e.target)) {
                this.closeWeatherModal();
            }
            
			if (aboutModal && aboutModal.classList.contains('open') &&
				aboutModal.contains(e.target) &&
				!aboutModal.querySelector('.modal-content').contains(e.target)) {
                this.closeAboutModal();
            }

            if (addLinkModal && addLinkModal.classList.contains('open') &&
                addLinkModal.contains(e.target) &&
                !addLinkModal.querySelector('.modal-content').contains(e.target)) {
                this.closeAddLinkModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('searchInput')?.focus();
                        break;
                    case ',':
                        e.preventDefault();
                        this.openSettings();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeSettings();
                this.closeWeatherModal();
                this.closeAboutModal();
                this.closeAddLinkModal();
            }
        });

        // Add link modal buttons
        const closeAddLinkModal = document.getElementById('closeAddLinkModal');
        const saveAddLinkBtn = document.getElementById('saveAddLinkBtn');
        const cancelAddLinkBtn = document.getElementById('cancelAddLinkBtn');
        if (closeAddLinkModal) closeAddLinkModal.addEventListener('click', () => this.closeAddLinkModal());
        if (cancelAddLinkBtn) cancelAddLinkBtn.addEventListener('click', () => this.closeAddLinkModal());
        if (saveAddLinkBtn) saveAddLinkBtn.addEventListener('click', () => this.saveAddLinkFromModal());
    }

    // Event Handlers
    handleSearch(e) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim()) {
            const searchUrl = this.getSearchUrl(searchInput.value.trim());
            window.open(searchUrl, '_blank');
            searchInput.value = '';
        }
    }

    handleSearchEngineChange(e) {
        this.settings.searchEngine = e.target.value;
        this.settings.customSearchUrl = '';
        
        const customSearchInput = document.getElementById('customSearchUrl');
        if (customSearchInput) {
            customSearchInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
            customSearchInput.value = '';
        }
        
        this.saveSettings();
    }

    toggleLocationSettings() {
        const locationType = document.getElementById('locationType');
        const governorateSetting = document.getElementById('governorateSetting');
        const coordinatesSetting = document.getElementById('coordinatesSetting');
        
        if (locationType && governorateSetting && coordinatesSetting) {
            if (locationType.value === 'governorate') {
                governorateSetting.style.display = 'block';
                coordinatesSetting.style.display = 'none';
            } else {
                governorateSetting.style.display = 'none';
                coordinatesSetting.style.display = 'block';
            }
        }
    }
}

// Initialize the startpage when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.startpage = new Startpage();
});

// Auto-refresh weather every 30 minutes
setInterval(() => {
    if (window.startpage) {
        window.startpage.updateWeatherDisplay();
    }
}, 30 * 60 * 1000);
