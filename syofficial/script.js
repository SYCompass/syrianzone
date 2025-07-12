// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let allData = { governorates: [], ministries: [], ministers: [], public_figures: [], other: [], syndicates: [], universities: [], embassies: [] };
    let isTableView = false;
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'ar';
    let currentFilter = 'all';
    let currentSearchTerm = '';
    let currentModalId = null;
    let currentModalCategory = null;

    // --- DOM Elements ---
    const governoratesGrid = document.getElementById('governorates-grid');
    const ministriesGrid = document.getElementById('ministries-grid');
    const ministersGrid = document.getElementById('ministers-grid');
    const publicFiguresGrid = document.getElementById('public_figures-grid');
    const otherGrid = document.getElementById('other-grid');
    const syndicatesGrid = document.getElementById('syndicates-grid');
    const universitiesGrid = document.getElementById('universities-grid');
    const embassiesGrid = document.getElementById('embassies-grid');
    const modal = document.getElementById('social-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.getElementById('close-modal-button');
    const closeModalButtonFooter = document.getElementById('close-modal-button-footer');
    const searchBar = document.getElementById('search-bar');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.data-section');
    const noResultsDiv = document.getElementById('no-results');
    const viewToggle = document.getElementById('view-toggle');
    const contentSections = document.getElementById('content-sections');
    const tableView = document.getElementById('table-view');
    const tableBody = document.getElementById('table-body');

    // --- Configuration ---
    const CONFIG = {
        GOOGLE_SHEETS: {
            CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAtwovmqnk0722ikCNL1RAeoEWyJ2tec3L0-sGHe-0kbmKs0ZPOIyCxOP4e74ndkPooauvG9ZeLTWT/pub?output=csv',
            MAX_RETRIES: 3,
            RETRY_DELAY: 1000, // 1 second
            CACHE_DURATION: 30 * 60 * 1000 // 30 minutes
        },
        ERROR_MESSAGES: {
            FETCH_FAILED: 'فشل في جلب البيانات',
            NETWORK_ERROR: 'خطأ في الاتصال بالشبكة',
            CSV_ERROR: 'خطأ في تحميل ملف البيانات',
            PARSE_ERROR: 'خطأ في تحليل البيانات',
            REDIRECT_ERROR: 'خطأ في الوصول إلى البيانات',
            EMPTY_DATA: 'لا توجد بيانات متاحة'
        }
    };

    // --- Utility Functions ---
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showLoading() { /* Can be implemented to show a spinner */ }
    function hideLoading() { /* Can be implemented to hide a spinner */ }

    function showError(message) {
        console.error('Error:', message);
        // This could be expanded to show a toast notification
    }

    // --- Caching ---
    function getCachedData() {
        try {
            const cached = localStorage.getItem('syrian_official_data_cache');
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CONFIG.GOOGLE_SHEETS.CACHE_DURATION) {
                return data;
            }
            localStorage.removeItem('syrian_official_data_cache');
            return null;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    }

    function cacheData(data) {
        try {
            const cacheItem = { data, timestamp: Date.now() };
            localStorage.setItem('syrian_official_data_cache', JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Cache write error:', error);
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

    // --- Data Transformation ---
    function convertCSVToStructuredData(csvData) {
        const structuredData = { governorates: [], ministries: [], ministers: [], public_figures: [], other: [], syndicates: [], universities: [], embassies: [] };
        const socialPlatforms = ['Facebook URL', 'Instagram URL', 'LinkedIn URL', 'Telegram URL', 'Telegram URL (Secondary)', 'Twitter/X URL', 'Website URL', 'WhatsApp URL', 'YouTube URL'];

        csvData.forEach(row => {
            const category = row['Category']?.toLowerCase().trim();
            if (!category) {
                console.warn('Row has no category, skipping:', row);
                return;
            }

            const item = {
                id: row['ID'] || '',
                name: row['Name (English)'] || '',
                name_ar: row['Name (Arabic)'] || '',
                description: row['Description (English)'] || '',
                description_ar: row['Description (Arabic)'] || '',
                image: row['Image Path'] || '',
                socials: {}
            };

            socialPlatforms.forEach(platform => {
                const url = row[platform];
                if (url && url.trim()) {
                    let key = platform.toLowerCase().replace(' url', '').replace(' (secondary)', '').replace('twitter/x', 'twitter');
                    item.socials[key] = url.trim();
                }
            });

            const categoryKey = category.replace(/\s+/g, '_');
            if (structuredData.hasOwnProperty(categoryKey)) {
                structuredData[categoryKey].push(item);
            } else {
                console.warn(`Unknown category "${category}" for row:`, row);
            }
        });
        return structuredData;
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
                if (csvText.trim().toLowerCase().startsWith('<html')) throw new Error('Received HTML redirect instead of CSV data');
                
                return parseCSV(csvText);
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);
                if (attempt < MAX_RETRIES) await delay(RETRY_DELAY * attempt);
            }
        }
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts: ${lastError.message}`);
    }

    // --- UI Population ---
    function populateAllGrids() {
        populateGrid(governoratesGrid, allData.governorates, 'governorates');
        populateGrid(ministriesGrid, allData.ministries, 'ministries');
        populateGrid(ministersGrid, allData.ministers, 'ministers');
        populateGrid(publicFiguresGrid, allData.public_figures, 'public_figures');
        populateGrid(otherGrid, allData.other, 'other');
        populateGrid(syndicatesGrid, allData.syndicates, 'syndicates');
        populateGrid(universitiesGrid, allData.universities, 'universities');
        populateGrid(embassiesGrid, allData.embassies, 'embassies');
    }

    function populateGrid(gridElement, items, category) {
        if (!gridElement) return;
        gridElement.innerHTML = '';
        if (!items || items.length === 0) return;

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.01 });

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const cell = document.createElement('div');
            cell.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer flex flex-col';
            cell.dataset.id = item.id;
            cell.dataset.category = category;
            cell.dataset.name = item.name.toLowerCase();
            cell.dataset.name_ar = item.name_ar.toLowerCase();
            cell.innerHTML = `
                <div class="w-full bg-gray-200"> 
                    <img data-src="${item.image}" alt="${currentLanguage === 'ar' ? item.name_ar : item.name}" class="w-full h-full object-cover" style="aspect-ratio: 1/1;" onerror="this.onerror=null; this.src='images/placeholder.png';">
                </div>
                <div class="p-3 flex-grow flex flex-col items-center justify-center"> 
                    <span class="block text-center text-xl font-medium text-gray-600 leading-snug mt-1">${currentLanguage === 'ar' ? item.name_ar : item.name}</span>
                    ${item.description ? `<span class="block text-center text-xs text-gray-500 mt-1">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</span>` : ''}
                </div>`;
            cell.addEventListener('click', () => openModal(item.id, category));
            const img = cell.querySelector('img');
            imageObserver.observe(img);
            fragment.appendChild(cell);
        });
        gridElement.appendChild(fragment);
    }

    function populateTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const sectionConfig = [
            { key: 'governorates', i18n: 'sections.governorates' },
            { key: 'ministries', i18n: 'sections.ministries' },
            { key: 'ministers', i18n: 'sections.ministers' },
            { key: 'public_figures', i18n: 'sections.public_figures' },
            { key: 'syndicates', i18n: 'sections.syndicates' },
            { key: 'universities', i18n: 'sections.universities' },
            { key: 'embassies', i18n: 'sections.embassies' },
            { key: 'other', i18n: 'sections.other' }
        ];

        const fragment = document.createDocumentFragment();
        sectionConfig.forEach(section => {
            const items = allData[section.key];
            if (!items || items.length === 0) return;

            const headerRow = document.createElement('tr');
            headerRow.className = 'bg-gray-100';
            headerRow.innerHTML = `<td colspan="3" class="px-6 py-3 text-sm font-semibold text-gray-900"><span data-i18n="${section.i18n}">${section.key}</span></td>`;
            fragment.appendChild(headerRow);

            items.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 flex flex-col sm:table-row border-b border-gray-200 sm:border-0';
                row.dataset.name = item.name.toLowerCase();
                row.dataset.name_ar = item.name_ar.toLowerCase();
                row.dataset.category = section.key;

                const socialLinksHTML = item.socials && Object.keys(item.socials).length > 0 ?
                    Object.entries(item.socials).map(([platform, link]) => `
                        <a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors">
                            <i class="${getSocialIcon(platform)} fa-fw text-blue-600"></i>
                            <span class="text-xs text-gray-700 mr-1">${platform}</span>
                        </a>`).join('') :
                    `<span class="text-sm text-gray-500" data-i18n="table.noLinks">No Links</span>`;

                row.innerHTML = `
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.name">Name</div>
                        <div class="text-sm font-medium text-gray-900" data-name="${item.name}" data-name-ar="${item.name_ar}">${currentLanguage === 'ar' ? item.name_ar : item.name}</div>
                    </td>
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.description">Description</div>
                        <div class="text-sm text-gray-500" data-desc="${item.description}" data-desc-ar="${item.description_ar || item.description}">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</div>
                    </td>
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.socialLinks">Social Links</div>
                        <div class="flex flex-wrap gap-2">${socialLinksHTML}</div>
                    </td>`;
                fragment.appendChild(row);
            });
        });
        tableBody.appendChild(fragment);
    }

    // --- UI Updates ---
    function updatePageLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('preferredLanguage', currentLanguage);
        
        if (isTableView) {
            populateTable(); // Re-populates with new language
        } else {
            populateAllGrids(); // Re-populates with new language
        }

        // Update modal if it's open
        if (!modal.classList.contains('pointer-events-none')) {
            const currentItem = allData[currentModalCategory]?.find(i => i.id === currentModalId);
            if (currentItem) {
                modalTitle.textContent = currentLanguage === 'ar' ? currentItem.name_ar : currentItem.name;
                const descriptionElement = modalBody.querySelector('p');
                if (descriptionElement && currentItem.description) {
                    descriptionElement.textContent = currentLanguage === 'ar' ? (currentItem.description_ar || currentItem.description) : currentItem.description;
                }
            }
        }
        
        // General UI text update
        if (typeof translations !== 'undefined' && translations[currentLanguage]) {
            const langData = translations[currentLanguage];
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const value = getNestedValue(langData, key);
                if (value) element.textContent = value;
            });
        }
    }

    function filterAndSearch() {
        currentSearchTerm = searchBar.value.toLowerCase().trim();
        let hasVisibleItems = false;

        if (isTableView) {
            tableBody.querySelectorAll('tr[data-category]').forEach(row => {
                const matchesSearch = row.dataset.name.includes(currentSearchTerm) || row.dataset.name_ar.includes(currentSearchTerm);
                const matchesFilter = currentFilter === 'all' || currentFilter === row.dataset.category;
                const isVisible = matchesSearch && matchesFilter;
                row.style.display = isVisible ? '' : 'none';
                if (isVisible) hasVisibleItems = true;
            });
            // Also toggle section headers based on filter
            tableBody.querySelectorAll('tr:not([data-category])').forEach(headerRow => {
                 const sectionKey = headerRow.querySelector('span')?.getAttribute('data-i18n')?.split('.')[1];
                 if(sectionKey) {
                    headerRow.style.display = (currentFilter === 'all' || currentFilter === sectionKey) ? '' : 'none';
                 }
            });
        } else {
            sections.forEach(section => {
                const category = section.dataset.category;
                let sectionHasVisibleItems = false;
                const isSectionVisibleByFilter = currentFilter === 'all' || currentFilter === category;
                
                section.querySelectorAll('div[data-category]').forEach(item => {
                    const matchesSearch = item.dataset.name.includes(currentSearchTerm) || item.dataset.name_ar.includes(currentSearchTerm);
                    const isVisible = isSectionVisibleByFilter && matchesSearch;
                    item.style.display = isVisible ? 'flex' : 'none';
                    if (isVisible) sectionHasVisibleItems = true;
                });

                section.style.display = sectionHasVisibleItems ? 'block' : 'none';
                if (sectionHasVisibleItems) hasVisibleItems = true;
            });
        }

        noResultsDiv.style.display = hasVisibleItems ? 'none' : 'block';
        if (!hasVisibleItems) {
            const noResultsElement = noResultsDiv.querySelector('[data-i18n]');
            const key = noResultsElement.getAttribute('data-i18n');
            const langData = (typeof translations !== 'undefined') ? translations[currentLanguage] : null;
            noResultsElement.textContent = getNestedValue(langData, key) || 'No results found.';
        }
    }

    // --- Modal ---
    function openModal(itemId, category) {
        currentModalId = itemId;
        currentModalCategory = category;
        const item = allData[category]?.find(i => i.id === itemId);
        if (!item) return;

        modalTitle.textContent = currentLanguage === 'ar' ? item.name_ar : item.name;
        modalBody.innerHTML = ''; 

        if (item.description) {
            const p = document.createElement('p');
            p.className = 'text-gray-600 text-center mb-4';
            p.textContent = currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description;
            modalBody.appendChild(p);
        }

        if (item.socials && Object.keys(item.socials).length > 0) {
            Object.entries(item.socials).forEach(([platform, link]) => {
                const a = document.createElement('a');
                a.href = link;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'flex items-center space-x-3 p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors';
                a.innerHTML = `
                    <i class="${getSocialIcon(platform)} fa-fw text-xl text-blue-600"></i>
                    <span class="text-gray-800 capitalize">${platform}</span>
                    <i class="fas fa-external-link-alt text-gray-400 ml-auto text-xs"></i>`;
                modalBody.appendChild(a);
            });
        } else {
            modalBody.innerHTML = `<p class="text-gray-500" data-i18n="modal.noSocialLinks">No social media links available.</p>`;
        }

        document.body.classList.add('modal-active');
        modal.classList.remove('opacity-0', 'pointer-events-none');
    }

    function closeModal() {
        document.body.classList.remove('modal-active');
        modal.classList.add('opacity-0', 'pointer-events-none');
    }

    function getSocialIcon(platform) {
        const icons = {
            facebook: 'fab fa-facebook', twitter: 'fab fa-twitter', instagram: 'fab fa-instagram',
            telegram: 'fab fa-telegram', linkedin: 'fab fa-linkedin', youtube: 'fab fa-youtube',
            whatsapp: 'fab fa-whatsapp', website: 'fas fa-globe'
        };
        return icons[platform.toLowerCase()] || 'fas fa-link';
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        viewToggle.addEventListener('click', () => {
            isTableView = !isTableView;
            contentSections.classList.toggle('hidden', isTableView);
            tableView.classList.toggle('hidden', !isTableView);
            viewToggle.innerHTML = isTableView ? `<i class="fas fa-th-large"></i><span data-i18n="view.grid">Grid View</span>` : `<i class="fas fa-table"></i><span data-i18n="view.table">Table View</span>`;
            if (isTableView) populateTable();
            updatePageLanguage(currentLanguage);
        });

        searchBar.addEventListener('input', filterAndSearch);

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('bg-blue-500', 'text-white'));
                button.classList.add('bg-blue-500', 'text-white');
                currentFilter = button.dataset.filter;
                filterAndSearch();
            });
        });

        closeModalButton.addEventListener('click', closeModal);
        closeModalButtonFooter.addEventListener('click', closeModal);
        modal.addEventListener('click', e => e.target === modal && closeModal());
        document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
        document.addEventListener('languageChange', e => updatePageLanguage(e.detail.lang));
    }

    // --- Initialization ---
    async function init() {
        setupEventListeners();
        showLoading();
        try {
            const cachedData = getCachedData();
            if (cachedData) {
                allData = cachedData;
            } else {
                const csvData = await fetchFromGoogleSheets();
                allData = convertCSVToStructuredData(csvData);
                cacheData(allData);
            }
            populateAllGrids();
            updatePageLanguage(currentLanguage);
            filterAndSearch();
        } catch (error) {
            console.error('Initialization failed:', error);
            showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED);
            // Show error message in all grids
            const errorMessage = `<p class="text-red-500 col-span-full">${error.message}</p>`;
            [governoratesGrid, ministriesGrid, ministersGrid, publicFiguresGrid, otherGrid, syndicatesGrid, universitiesGrid, embassiesGrid].forEach(grid => {
                if (grid) grid.innerHTML = errorMessage;
            });
        } finally {
            hideLoading();
        }
    }

    init();
});