// Syrian Zone Websites Section - Main Script
document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let allWebsites = [];
    let currentFilter = 'all';
    let currentSearchTerm = '';

    // --- DOM Elements ---
    const searchBar = document.getElementById('search-bar');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const websiteSections = document.getElementById('website-sections');
    const noResults = document.getElementById('no-results');
    const loading = document.getElementById('loading');

    // --- Configuration ---
    const CONFIG = {
        GOOGLE_SHEETS: {
            CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTCrz7GpfTDmtgKipQd3IqyMPle1ehoG77VO2SQRDqKC9zRRKO3FDI60VoYhA_XqlzoKQ6gZDrIuIjL/pub?output=csv',
            MAX_RETRIES: 3,
            RETRY_DELAY: 1000,
            CACHE_DURATION: 30 * 60 * 1000 // 30 minutes
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
        icon.className = 'website-icon';
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

        // Sort sections by type order (personal blogs first)
        const sortedTypes = Object.keys(websitesByType).sort((a, b) => {
            return getTypeOrder(a) - getTypeOrder(b);
        });

        // Create sections for each type in order
        sortedTypes.forEach(type => {
            const websites = websitesByType[type];
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

    function getTypeOrder(type) {
        const order = {
            'مدونة شخصية (فرد واحد)': 1,
            'موقع تعريفي بشركة أو بخدمة أو بمبادرة': 2,
            'مدونة جماعية أو مجلة إلكترونيّة أو موقع إخباريّ': 3
        };
        return order[type] || 4; // Default order for unknown types
    }

    function setupWebsiteIconEvents(icon, website) {
        // Click to open website
        icon.addEventListener('click', () => {
            window.open(website.url, '_blank');
        });
    }

    // --- Filtering and Search ---
    function filterAndSearch() {
        const searchTerm = searchBar.value.toLowerCase().trim();
        currentSearchTerm = searchTerm;
        
        let hasVisibleItems = false;
        const allIcons = websiteSections.querySelectorAll('.website-section .grid .website-icon');
        
        allIcons.forEach(icon => {
            const matchesSearch = icon.dataset.name.includes(searchTerm) || 
                                icon.dataset.description.includes(searchTerm);
            const matchesFilter = currentFilter === 'all' || 
                                icon.dataset.type === currentFilter;
            
            const isVisible = matchesSearch && matchesFilter;
            icon.style.display = isVisible ? 'flex' : 'none';
            
            if (isVisible) hasVisibleItems = true;
        });

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
    }

    // --- Initialization ---
    async function init() {
        setupEventListeners();
        
        try {
            showLoading();
            
            // Try to fetch from Google Sheets
            try {
                const csvData = await fetchFromGoogleSheets();
                allWebsites = convertCSVToWebsites(csvData);
            } catch (error) {
                console.warn('Could not fetch from Google Sheets, using sample data:', error);
                // Fallback to sample data
                allWebsites = [
                    {
                        id: 'salehram',
                        name: 'Home of a SysEng and Cloud Nerd',
                        url: 'https://salehram.com',
                        type: 'مدونة شخصية (فرد واحد)',
                        description: 'موقع تقني يهتم بمواضيع و تقنيات الحوسبة السحابية و يركز على Google Cloud مع عرض دورات تدريبية حول نفس المواضيع و التقنيات'
                    },
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
                    }
                ];
            }

            // Populate websites grid
            populateWebsitesGrid();
            
            // Apply initial filter
            filterAndSearch();
            
        } catch (error) {
            console.error('Initialization failed:', error);
        } finally {
            hideLoading();
        }
    }

    // Start the application
    init();
});
