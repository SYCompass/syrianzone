// Syrian Zone Websites Section - Main Script
document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let allWebsites = [];
    let userFavorites = [];
    let defaultFavorites = [];
    let currentFilter = 'all';
    let currentSearchTerm = '';
    let longPressTimer = null;
    let longPressDelay = 500; // 500ms for long press

    // --- DOM Elements ---
    const searchBar = document.getElementById('search-bar');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const favoritesGrid = document.getElementById('favorites-grid');
    const websiteSections = document.getElementById('website-sections');
    const noResults = document.getElementById('no-results');
    const loading = document.getElementById('loading');
    const longPressModal = document.getElementById('long-press-modal');
    const closeModal = document.getElementById('close-modal');

    // --- Configuration ---
    const CONFIG = {
        GOOGLE_SHEETS: {
            CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ75gH_aGaduB9njP71UkkMzbQm48bShuq_YWeMT1Y8AhzpxWj5uNak9mL0lPt3O8_Jgu3u8F-vmai/pub?output=csv',
            MAX_RETRIES: 3,
            RETRY_DELAY: 1000,
            CACHE_DURATION: 30 * 60 * 1000 // 30 minutes
        },
        STORAGE_KEYS: {
            USER_FAVORITES: 'syrian_zone_user_favorites',
            LAST_VISIT: 'syrian_zone_last_visit'
        }
    };

    // --- Utility Functions ---
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showLoading() {
        loading.classList.remove('hidden');
        noResults.classList.add('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
    }

    function showNoResults() {
        noResults.classList.remove('hidden');
    }

    function hideNoResults() {
        noResults.classList.add('hidden');
    }

    function generateWebsiteId(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain.split('.')[0];
        } catch {
            return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        }
    }

    function getWebsiteIcon(website) {
        // Try to get favicon from the website
        const domain = new URL(website.url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    function getWebsiteTypeIcon(type) {
        const typeIcons = {
            'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ': 'fas fa-newspaper',
            'موقع تعريفي بشركة أو بخدمة أو بمبادرة': 'fas fa-building',
            'مدونة شخصية (فرد واحد)': 'fas fa-user'
        };
        return typeIcons[type] || 'fas fa-globe';
    }

    // --- Data Management ---
    function loadDefaultFavorites() {
        return fetch('./default-favorites.json')
            .then(response => response.json())
            .then(data => {
                defaultFavorites = data.defaultFavorites;
                return defaultFavorites;
            })
            .catch(error => {
                console.warn('Could not load default favorites:', error);
                return [];
            });
    }

    function loadUserFavorites() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_FAVORITES);
            userFavorites = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Could not load user favorites:', error);
            userFavorites = [];
        }
    }

    function saveUserFavorites() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_FAVORITES, JSON.stringify(userFavorites));
        } catch (error) {
            console.warn('Could not save user favorites:', error);
        }
    }

    function isFavorite(websiteId) {
        return userFavorites.includes(websiteId);
    }

    function addToFavorites(websiteId) {
        if (!userFavorites.includes(websiteId)) {
            userFavorites.push(websiteId);
            saveUserFavorites();
            return true;
        }
        return false;
    }

    function removeFromFavorites(websiteId) {
        const index = userFavorites.indexOf(websiteId);
        if (index > -1) {
            userFavorites.splice(index, 1);
            saveUserFavorites();
            return true;
        }
        return false;
    }

    function toggleFavorite(websiteId) {
        if (isFavorite(websiteId)) {
            removeFromFavorites(websiteId);
            return false;
        } else {
            addToFavorites(websiteId);
            return true;
        }
    }

    // --- CSV Parsing ---
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    function parseCSV(csvText) {
        try {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                
                const values = parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] ? values[index].trim() : '';
                    });
                    data.push(row);
                }
            }
            return data;
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }

    function convertCSVToWebsites(csvData) {
        return csvData.map(row => ({
            id: generateWebsiteId(row['رابط الموقع']),
            name: row['اسم الموقع'] || '',
            url: row['رابط الموقع'] || '',
            type: row['نوع الموقع'] || '',
            description: row['توصيف الموقع'] || ''
        })).filter(website => website.url && website.name);
    }

    // --- Data Fetching ---
    async function fetchFromGoogleSheets() {
        const { CSV_URL, MAX_RETRIES, RETRY_DELAY } = CONFIG.GOOGLE_SHEETS;
        let lastError;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(CSV_URL, { redirect: 'follow' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const csvText = await response.text();
                if (!csvText || !csvText.trim()) throw new Error('Empty CSV data received');
                if (csvText.trim().toLowerCase().startsWith('<html')) {
                    throw new Error('Received HTML redirect instead of CSV data');
                }
                
                return parseCSV(csvText);
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);
                if (attempt < MAX_RETRIES) await delay(RETRY_DELAY * attempt);
            }
        }
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts: ${lastError.message}`);
    }

    // --- UI Rendering ---
    function createWebsiteIcon(website) {
        const icon = document.createElement('div');
        icon.className = `website-icon ${isFavorite(website.id) ? 'favorite' : ''}`;
        icon.dataset.id = website.id;
        icon.dataset.type = website.type;
        icon.dataset.name = website.name.toLowerCase();
        icon.dataset.description = website.description.toLowerCase();

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';
        
        // Try to load favicon, fallback to type icon
        const img = document.createElement('img');
        img.src = getWebsiteIcon(website);
        img.alt = website.name;
        img.className = 'w-full h-full object-cover rounded-lg';
        img.onerror = () => {
            // Fallback to FontAwesome icon
            iconContainer.innerHTML = `<i class="${getWebsiteTypeIcon(website.type)} text-white text-2xl"></i>`;
        };
        
        iconContainer.appendChild(img);

        const name = document.createElement('div');
        name.className = 'website-name';
        name.textContent = website.name;

        icon.appendChild(iconContainer);
        icon.appendChild(name);

        return icon;
    }

    function populateFavoritesGrid() {
        favoritesGrid.innerHTML = '';
        
        const favoriteWebsites = allWebsites.filter(website => isFavorite(website.id));
        
        if (favoriteWebsites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="col-span-full empty-state">
                    <i class="fas fa-star"></i>
                    <p>لا توجد مواقع مفضلة</p>
                    <p class="text-sm">اضغط مطولاً على أيقونة لإضافتها للمفضلة</p>
                </div>
            `;
            return;
        }

        favoriteWebsites.forEach(website => {
            const icon = createWebsiteIcon(website);
            setupWebsiteIconEvents(icon, website);
            favoritesGrid.appendChild(icon);
        });
    }

    function populateWebsitesGrid() {
        websiteSections.innerHTML = '';
        
        // Group websites by type
        const websitesByType = {};
        allWebsites.forEach(website => {
            if (!websitesByType[website.type]) {
                websitesByType[website.type] = [];
            }
            websitesByType[website.type].push(website);
        });

        // Create sections for each type
        Object.entries(websitesByType).forEach(([type, websites]) => {
            const section = document.createElement('div');
            section.className = 'website-section mb-8';
            section.dataset.type = type;
            
            // Create section header
            const header = document.createElement('h2');
            header.className = 'text-2xl font-semibold text-gray-800 mb-4 flex items-center';
            
            // Add icon based on type
            const icon = document.createElement('i');
            icon.className = `${getWebsiteTypeIcon(type)} text-[var(--sz-color-primary)] ml-2 text-xl`;
            header.appendChild(icon);
            
            // Add type name
            const typeName = document.createElement('span');
            typeName.textContent = getTypeDisplayName(type);
            header.appendChild(typeName);
            
            section.appendChild(header);
            
            // Create grid for websites in this section
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4';
            grid.dataset.type = type;
            
            // Add websites to this section's grid
            websites.forEach(website => {
                const icon = createWebsiteIcon(website);
                setupWebsiteIconEvents(icon, website);
                grid.appendChild(icon);
            });
            
            section.appendChild(grid);
            websiteSections.appendChild(section);
        });
    }

    function getTypeDisplayName(type) {
        const typeNames = {
            'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ': 'المدونات والمواقع الإخبارية',
            'موقع تعريفي بشركة أو بخدمة أو بمبادرة': 'المواقع التعريفية',
            'مدونة شخصية (فرد واحد)': 'المدونات الشخصية'
        };
        return typeNames[type] || type;
    }

    function setupWebsiteIconEvents(icon, website) {
        let pressTimer;
        let isLongPress = false;

        // Click to open website
        icon.addEventListener('click', (e) => {
            if (!isLongPress) {
                window.open(website.url, '_blank');
            }
        });

        // Long press to toggle favorite
        icon.addEventListener('mousedown', () => {
            pressTimer = setTimeout(() => {
                isLongPress = true;
                icon.classList.add('long-press');
                
                const wasFavorite = isFavorite(website.id);
                const isNowFavorite = toggleFavorite(website.id);
                
                if (isNowFavorite) {
                    icon.classList.add('favorite');
                    showToast(`${website.name} أضيف للمفضلة`, 'success');
                } else {
                    icon.classList.remove('favorite');
                    showToast(`${website.name} أزيل من المفضلة`, 'info');
                }
                
                populateFavoritesGrid();
                filterAndSearch();
            }, longPressDelay);
        });

        icon.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
            setTimeout(() => {
                icon.classList.remove('long-press');
                isLongPress = false;
            }, 100);
        });

        icon.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
            icon.classList.remove('long-press');
            isLongPress = false;
        });

        // Touch events for mobile
        icon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(() => {
                isLongPress = true;
                icon.classList.add('long-press');
                
                const wasFavorite = isFavorite(website.id);
                const isNowFavorite = toggleFavorite(website.id);
                
                if (isNowFavorite) {
                    icon.classList.add('favorite');
                    showToast(`${website.name} أضيف للمفضلة`, 'success');
                } else {
                    icon.classList.remove('favorite');
                    showToast(`${website.name} أزيل من المفضلة`, 'info');
                }
                
                populateFavoritesGrid();
                filterAndSearch();
            }, longPressDelay);
        });

        icon.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(pressTimer);
            setTimeout(() => {
                icon.classList.remove('long-press');
                isLongPress = false;
            }, 100);
        });
    }

    // --- Filtering and Search ---
    function filterAndSearch() {
        const searchTerm = searchBar.value.toLowerCase().trim();
        currentSearchTerm = searchTerm;
        
        let hasVisibleItems = false;
        const allIcons = [...favoritesGrid.querySelectorAll('.website-icon'), ...websiteSections.querySelectorAll('.website-section .grid .website-icon')];
        
        allIcons.forEach(icon => {
            const matchesSearch = icon.dataset.name.includes(searchTerm) || 
                                icon.dataset.description.includes(searchTerm);
            const matchesFilter = currentFilter === 'all' || 
                                icon.dataset.type === currentFilter;
            
            const isVisible = matchesSearch && matchesFilter;
            icon.style.display = isVisible ? 'flex' : 'none';
            
            if (isVisible) hasVisibleItems = true;
        });

        // Update favorites section visibility
        const favoriteIcons = favoritesGrid.querySelectorAll('.website-icon');
        const hasVisibleFavorites = Array.from(favoriteIcons).some(icon => 
            icon.style.display !== 'none'
        );
        
        if (hasVisibleFavorites) {
            favoritesGrid.parentElement.style.display = 'block';
        } else {
            favoritesGrid.parentElement.style.display = 'none';
        }

        // Update section visibility based on filter
        const sections = websiteSections.querySelectorAll('.website-section');
        sections.forEach(section => {
            const sectionType = section.dataset.type;
            const sectionIcons = section.querySelectorAll('.website-icon');
            const hasVisibleIcons = Array.from(sectionIcons).some(icon => 
                icon.style.display !== 'none'
            );
            
            // Show/hide sections based on filter and search
            if (currentFilter === 'all' || sectionType === currentFilter) {
                section.style.display = hasVisibleIcons ? 'block' : 'none';
            } else {
                section.style.display = 'none';
            }
        });

        // Show/hide no results
        if (hasVisibleItems) {
            hideNoResults();
        } else {
            showNoResults();
        }
    }

    // --- Toast Notifications ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform translate-x-full transition-transform duration-300`;
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        toast.classList.add(colors[type] || colors.info);
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Search
        searchBar.addEventListener('input', filterAndSearch);
        
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active state from all buttons
                filterButtons.forEach(btn => {
                    btn.classList.remove('active', 'bg-sz-color-primary', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                });
                
                // Add active state to clicked button
                button.classList.remove('bg-gray-200', 'text-gray-700');
                button.classList.add('active', 'bg-sz-color-primary', 'text-white');
                
                currentFilter = button.dataset.filter;
                filterAndSearch();
            });
        });

        // Long press modal
        closeModal.addEventListener('click', () => {
            longPressModal.classList.add('hidden');
        });

        longPressModal.addEventListener('click', (e) => {
            if (e.target === longPressModal) {
                longPressModal.classList.add('hidden');
            }
        });

        // Show long press instructions on first visit
        const lastVisit = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_VISIT);
        if (!lastVisit) {
            setTimeout(() => {
                longPressModal.classList.remove('hidden');
                localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VISIT, Date.now().toString());
            }, 2000);
        }
    }

    // --- Initialization ---
    async function init() {
        setupEventListeners();
        loadUserFavorites();
        
        try {
            showLoading();
            
            // Load default favorites first
            await loadDefaultFavorites();
            
            // Try to fetch from Google Sheets
            try {
                const csvData = await fetchFromGoogleSheets();
                allWebsites = convertCSVToWebsites(csvData);
            } catch (error) {
                console.warn('Could not fetch from Google Sheets, using sample data:', error);
                // Fallback to sample data
                allWebsites = [
                    {
                        id: 'syrmh',
                        name: 'التاريخ السوري المعاصر',
                        url: 'https://syrmh.com',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'موقعي ارشيفي لوثائق من تاريخ سوريا المعاصر'
                    },
                    {
                        id: 'poetspub',
                        name: 'حانة الشعراء',
                        url: 'https://poetspub.com',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'موقع ثقافي أدبي'
                    },
                    {
                        id: 'syrianmemory',
                        name: 'الذاكرة السورية',
                        url: 'https://syrianmemory.org/',
                        type: 'موقع تعريفي بشركة أو بخدمة أو بمبادرة',
                        description: 'أرشيف يوم بيوم عن الثورة السوريه'
                    },
                    {
                        id: 'syrevarch',
                        name: 'أرشيف الثورة السورية',
                        url: 'https://syrevarch.com/',
                        type: 'موقع تعريفي بشركة أو بخدمة أو بمبادرة',
                        description: 'أرشيف الثورة السورية'
                    },
                    {
                        id: 'radyf',
                        name: 'رديف',
                        url: 'https://radyf.com',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'موقع عن السينما والتصوير'
                    },
                    {
                        id: 'arageek',
                        name: 'أراجيك',
                        url: 'https://arageek.com',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'مجلة ثقافية اجتماعية تقنية'
                    },
                    {
                        id: 'sakat3sh',
                        name: 'سكطعش كيدس',
                        url: 'https://kids.sakat3sh.com/',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'قصص اطفال هادفة لرفع القيم التربوية والاخلاقية عن الطفل العربي'
                    },
                    {
                        id: 'sotour',
                        name: 'سطور سوريا',
                        url: 'https://sotour.net/',
                        type: 'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ',
                        description: 'مدونات ومقالات سياسية واجتماعية متعلقة بالشأن العام السوري'
                    },
                    {
                        id: 'salehram',
                        name: 'Home of a SysEng and Cloud Nerd',
                        url: 'https://salehram.com',
                        type: 'مدونة شخصية (فرد واحد)',
                        description: 'موقع تقني يهتم بمواضيع و تقنيات الحوسبة السحابية و يركز على Google Cloud مع عرض دورات تدريبية حول نفس المواضيع و التقنيات'
                    }
                ];
            }

            // Populate grids
            populateFavoritesGrid();
            populateWebsitesGrid();
            
            // Apply initial filter
            filterAndSearch();
            
        } catch (error) {
            console.error('Initialization failed:', error);
            showToast('فشل في تحميل البيانات', 'error');
        } finally {
            hideLoading();
        }
    }

    // Start the application
    init();
});
