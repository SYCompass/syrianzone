// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let allData = { governorates: [], ministries: [], ministers: [], public_figures: [], other: [], syndicates: [], universities: [], embassies: [] };
    let viewToggle = null;
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'ar';
    let currentFilter = 'all';
    let currentSearchTerm = '';

    // --- DOM Elements ---
    const governoratesGrid = document.getElementById('governorates-grid');
    const ministriesGrid = document.getElementById('ministries-grid');
    const ministersGrid = document.getElementById('ministers-grid');
    const publicFiguresGrid = document.getElementById('public_figures-grid');
    const otherGrid = document.getElementById('other-grid');
    const syndicatesGrid = document.getElementById('syndicates-grid');
    const universitiesGrid = document.getElementById('universities-grid');
    const embassiesGrid = document.getElementById('embassies-grid');
    const searchBar = document.getElementById('search-bar');
    const clearSearch = document.getElementById('clearSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const clearFilters = document.getElementById('clearFilters');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCount = document.getElementById('resultsCount');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.data-section');
    const noResultsDiv = document.getElementById('no-results');
    // ViewToggle will be initialized after DOM elements are ready
    const contentSections = document.getElementById('content-sections');
    const tableView = document.getElementById('table-view');
    const tableBody = document.getElementById('table-body');

    // --- Configuration ---
    const CONFIG = {
        GOOGLE_SHEETS: {
            CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAtwovmqnk0722ikCNL1RAeoEWyJ2tec3L0-sGHe-0kbmKs0ZPOIyCxOP4e74ndkPooauvG9ZeLTWT/pub?gid=0&single=true&output=csv',
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
    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    function showLoading() { /* spinner */ }
    function hideLoading() { /* spinner */ }
    function showError(message) { console.error('Error:', message); }

    // --- Caching ---
    function getCachedData() {
        const cache = window.SZ?.cache?.createCache('syofficial');
        return cache?.get('data') || null;
    }
    function cacheData(data) {
        const cache = window.SZ?.cache?.createCache('syofficial');
        cache?.set('data', data, CONFIG.GOOGLE_SHEETS.CACHE_DURATION);
    }

    // --- CSV Parsing ---
    function parseCSV(csvText) { return window.SZ.csv.parseCSVToObjects(csvText); }

    // --- Data Transformation ---
    function convertCSVToStructuredData(csvData) {
        const structuredData = { governorates: [], ministries: [], ministers: [], public_figures: [], other: [], syndicates: [], universities: [], embassies: [] };
        const socialPlatforms = ['Facebook URL', 'Instagram URL', 'LinkedIn URL', 'Telegram URL', 'Telegram URL (Secondary)', 'Twitter/X URL', 'Website URL', 'WhatsApp URL', 'YouTube URL'];
        csvData.forEach(row => {
            const category = row['Category']?.toLowerCase().trim();
            if (!category) return;
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
            if (structuredData.hasOwnProperty(categoryKey)) structuredData[categoryKey].push(item);
        });
        return structuredData;
    }

    // --- Data Fetching ---
    async function fetchFromGoogleSheets() {
        const { CSV_URL, MAX_RETRIES } = CONFIG.GOOGLE_SHEETS;
        const res = await window.SZ.http.fetchWithRetry(CSV_URL, { retries: MAX_RETRIES });
        return parseCSV(res.text);
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
            cell.className = 'bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col';
            cell.dataset.id = item.id;
            cell.dataset.category = category;
            cell.dataset.name = item.name.toLowerCase();
            cell.dataset.name_ar = item.name_ar.toLowerCase();
            let socialIconsHTML = '';
            if (item.socials && Object.keys(item.socials).length > 0) {
                socialIconsHTML = `<div class="social-icons">`;
                Object.entries(item.socials).forEach(([platform, link]) => {
                    socialIconsHTML += `
                        <a href="${link}" target="_blank" rel="noopener noreferrer" 
                           class="social-icon" data-tooltip="${platform.charAt(0).toUpperCase() + platform.slice(1)}"
                           onclick="event.stopPropagation()">
                            <i class="${getSocialIcon(platform)}"></i>
                        </a>`;
                });
                socialIconsHTML += `</div>`;
            }
            cell.innerHTML = `
                <div class="w-full bg-gray-200"> 
                    <img data-src="/syofficial/${item.image}" alt="${currentLanguage === 'ar' ? item.name_ar : item.name}" class="w-full h-full object-cover" style="aspect-ratio: 1/1;" onerror="this.onerror=null; this.src='images/placeholder.png';">
                </div>
                <div class="p-3 flex-grow flex flex-col items-center justify-center"> 
                    <span class="block text-center text-xl font-medium text-gray-600 leading-snug mt-1">${currentLanguage === 'ar' ? item.name_ar : item.name}</span>
                    ${item.description ? `<span class="block text-center text-xs text-gray-500 mt-1">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</span>` : ''}
                    ${socialIconsHTML}
                </div>`;
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
            headerRow.className = '';
            headerRow.style.backgroundColor = 'var(--bg-secondary)';
            headerRow.innerHTML = `<td colspan="3" class="px-6 py-3 text-sm font-semibold" style="color: var(--text-primary);"><span data-i18n="${section.i18n}">${section.key}</span></td>`;
            fragment.appendChild(headerRow);
            items.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'table-row-hover flex flex-col sm:table-row border-b sm:border-0';
                row.style.borderColor = 'var(--border-color)';
                row.dataset.name = item.name.toLowerCase();
                row.dataset.name_ar = item.name_ar.toLowerCase();
                row.dataset.category = section.key;
                const socialLinksHTML = item.socials && Object.keys(item.socials).length > 0 ?
                    Object.entries(item.socials).map(([platform, link]) => `
                        <a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2 py-1 transition-colors" style="border-radius: var(--radius); background-color: var(--bg-secondary); color: var(--text-primary);">
                            <i class="${getSocialIcon(platform)} fa-fw" style="color: var(--sz-color-primary);"></i>
                            <span class="text-xs mr-1" style="color: var(--text-secondary);">${platform}</span>
                        </a>`).join('') :
                    `<span class="text-sm" style="color: var(--text-secondary);" data-i18n="table.noLinks">No Links</span>`;
                row.innerHTML = `
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs sm:hidden mb-1" style="color: var(--text-secondary);" data-i18n="table.name">Name</div>
                        <div class="text-sm font-medium" style="color: var(--text-primary);" data-name="${item.name}" data-name-ar="${item.name_ar}">${currentLanguage === 'ar' ? item.name_ar : item.name}</div>
                    </td>
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs sm:hidden mb-1" style="color: var(--text-secondary);" data-i18n="table.description">Description</div>
                        <div class="text-sm" style="color: var(--text-secondary);" data-desc="${item.description}" data-desc-ar="${item.description_ar || item.description}">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</div>
                    </td>
                    <td class="px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell">
                        <div class="text-xs sm:hidden mb-1" style="color: var(--text-secondary);" data-i18n="table.socialLinks">Social Links</div>
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
        if (viewToggle && viewToggle.getCurrentView() === 'table') { populateTable(); } else { populateAllGrids(); }
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
        const categoryFilterValue = categoryFilter.value;
        
        // Show/hide clear search button
        clearSearch.style.display = currentSearchTerm ? 'block' : 'none';
        
        let hasVisibleItems = false;
        let totalVisibleItems = 0;
        
        if (viewToggle && viewToggle.getCurrentView() === 'table') {
            tableBody.querySelectorAll('tr[data-category]').forEach(row => {
                const matchesSearch = !currentSearchTerm || 
                    row.dataset.name.includes(currentSearchTerm) || 
                    row.dataset.name_ar.includes(currentSearchTerm);
                const matchesFilter = !categoryFilterValue || categoryFilterValue === row.dataset.category;
                const isVisible = matchesSearch && matchesFilter;
                row.style.display = isVisible ? '' : 'none';
                if (isVisible) {
                    hasVisibleItems = true;
                    totalVisibleItems++;
                }
            });
            tableBody.querySelectorAll('tr:not([data-category])').forEach(headerRow => {
                 const sectionKey = headerRow.querySelector('span')?.getAttribute('data-i18n')?.split('.')[1];
                 if(sectionKey) {
                    headerRow.style.display = (!categoryFilterValue || categoryFilterValue === sectionKey) ? '' : 'none';
                 }
            });
        } else {
            sections.forEach(section => {
                const category = section.dataset.category;
                let sectionHasVisibleItems = false;
                const isSectionVisibleByFilter = !categoryFilterValue || categoryFilterValue === category;
                
                section.querySelectorAll('div[data-category]').forEach(item => {
                    const matchesSearch = !currentSearchTerm || 
                        item.dataset.name.includes(currentSearchTerm) || 
                        item.dataset.name_ar.includes(currentSearchTerm);
                    const isVisible = isSectionVisibleByFilter && matchesSearch;
                    item.style.display = isVisible ? 'flex' : 'none';
                    if (isVisible) {
                        sectionHasVisibleItems = true;
                        totalVisibleItems++;
                    }
                });
                section.style.display = sectionHasVisibleItems ? 'block' : 'none';
                if (sectionHasVisibleItems) hasVisibleItems = true;
            });
        }
        
        // Update results count
        updateResultsCount(totalVisibleItems);
        
        // Show/hide no results
        noResultsDiv.style.display = hasVisibleItems ? 'none' : 'block';
        if (!hasVisibleItems) {
            const noResultsElement = noResultsDiv.querySelector('p[data-i18n]');
            if (noResultsElement) {
                const key = noResultsElement.getAttribute('data-i18n');
                const langData = (typeof translations !== 'undefined') ? translations[currentLanguage] : null;
                noResultsElement.textContent = getNestedValue(langData, key) || 'جرب تعديل كلمات البحث أو الفلاتر.';
            }
        }
    }
    
    // Update results count display
    function updateResultsCount(count) {
        if (resultsCount) {
            resultsCount.textContent = count === 0 ? 'لم يتم العثور على حسابات رسمية' : 
                `عرض ${count} حساب رسمي`;
        }
    }
    
    // Handle search input with debouncing
    function handleSearch() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
            filterAndSearch();
        }, 300);
    }
    
    // Clear search functionality
    function clearSearchInput() {
        searchBar.value = '';
        clearSearch.style.display = 'none';
        filterAndSearch();
    }
    
    // Clear all filters
    function clearAllFilters() {
        searchBar.value = '';
        categoryFilter.value = '';
        clearSearch.style.display = 'none';
        filterAndSearch();
    }
    
    // Apply sorting
    function applySorting() {
        const sortBy = sortSelect.value;
        
        if (viewToggle && viewToggle.getCurrentView() === 'table') {
            // Sort table rows
            const tableBody = document.getElementById('table-body');
            if (!tableBody) return;
            
            const rows = Array.from(tableBody.querySelectorAll('tr[data-category]'));
            
            rows.sort((a, b) => {
                let aValue, bValue;
                
                switch (sortBy) {
                    case 'name':
                        aValue = currentLanguage === 'ar' ? a.dataset.name_ar : a.dataset.name;
                        bValue = currentLanguage === 'ar' ? b.dataset.name_ar : b.dataset.name;
                        return aValue.localeCompare(bValue);
                    case 'name-desc':
                        aValue = currentLanguage === 'ar' ? a.dataset.name_ar : a.dataset.name;
                        bValue = currentLanguage === 'ar' ? b.dataset.name_ar : b.dataset.name;
                        return bValue.localeCompare(aValue);
                    case 'category':
                        return a.dataset.category.localeCompare(b.dataset.category);
                    default:
                        return 0;
                }
            });
            
            // Re-append sorted rows
            rows.forEach(row => tableBody.appendChild(row));
        } else {
            // For grid view, re-populate with sorted data
            const sortedData = {};
            Object.keys(allData).forEach(category => {
                sortedData[category] = [...allData[category]].sort((a, b) => {
                    let aValue, bValue;
                    
                    switch (sortBy) {
                        case 'name':
                            aValue = currentLanguage === 'ar' ? a.name_ar : a.name;
                            bValue = currentLanguage === 'ar' ? b.name_ar : b.name;
                            return aValue.localeCompare(bValue);
                        case 'name-desc':
                            aValue = currentLanguage === 'ar' ? a.name_ar : a.name;
                            bValue = currentLanguage === 'ar' ? b.name_ar : b.name;
                            return bValue.localeCompare(aValue);
                        case 'category':
                            return 0; // No sorting needed by category in grid view
                        default:
                            return 0;
                    }
                });
            });
            
            // Temporarily store sorted data and repopulate
            const originalData = allData;
            allData = sortedData;
            populateAllGrids();
            allData = originalData; // Restore original data
        }
        
        // Re-apply filters after sorting
        filterAndSearch();
    }
    
    let searchTimeout;

    function getSocialIcon(platform) {
        const icons = {
            facebook: 'fab fa-facebook', twitter: 'fab fa-twitter', instagram: 'fab fa-instagram',
            telegram: 'fab fa-telegram', linkedin: 'fab fa-linkedin', youtube: 'fab fa-youtube',
            whatsapp: 'fab fa-whatsapp', website: 'fas fa-globe'
        };
        return icons[platform.toLowerCase()] || 'fas fa-link';
    }

    // --- Language Switcher ---
    function setupLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lang = button.dataset.lang;
                langButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                updatePageLanguage(lang);
                if (window.switchLanguage) { window.switchLanguage(lang); }
            });
        });
        const currentLangButton = document.querySelector(`.lang-btn[data-lang="${currentLanguage}"]`);
        if (currentLangButton) {
            langButtons.forEach(btn => btn.classList.remove('active'));
            currentLangButton.classList.add('active');
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Initialize ViewToggle component
        viewToggle = new window.SZ.ViewToggle({
            tableViewBtn: '#tableViewBtn',
            gridViewBtn: '#gridViewBtn', 
            tableContainer: '#table-view',
            gridContainer: '#content-sections',
            storageKey: 'syofficial-view-preference',
            onViewChange: (view) => {
                if (view === 'table') {
                    populateTable();
                } else {
                    populateAllGrids();
                }
                // Re-apply current filters after view change
                filterAndSearch();
            }
        });
        // Enhanced search functionality
        searchBar.addEventListener('input', handleSearch);
        
        // Clear search button
        if (clearSearch) {
            clearSearch.addEventListener('click', clearSearchInput);
        }
        
        // Category filter
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterAndSearch);
        }
        
        // Clear filters button
        if (clearFilters) {
            clearFilters.addEventListener('click', clearAllFilters);
        }
        
        // Sort functionality
        if (sortSelect) {
            sortSelect.addEventListener('change', applySorting);
        }
        
        // Filter buttons - unified approach
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update button states
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update category filter and trigger main filtering
                const category = button.dataset.category;
                if (categoryFilter) {
                    categoryFilter.value = category;
                    categoryFilter.dispatchEvent(new Event('change'));
                }
            });
        });
        document.addEventListener('languageChange', e => updatePageLanguage(e.detail.lang));
    }

    // --- Initialization ---
    async function init() {
        setupEventListeners();
        setupLanguageSwitcher();
        showLoading();
        try {
            const cachedData = getCachedData();
            if (cachedData) {
                allData = cachedData;
            } else {
                const loader = async () => {
                    const csvRows = await fetchFromGoogleSheets();
                    return convertCSVToStructuredData(csvRows);
                };
                allData = await window.SZ.offline.runWithOfflineRetry(loader, {
                    onError: () => showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED)
                });
                cacheData(allData);
            }
            populateAllGrids();
            updatePageLanguage(currentLanguage);
            
            // Initialize results count and apply initial filter
            const totalItems = Object.values(allData).reduce((sum, category) => sum + category.length, 0);
            updateResultsCount(totalItems);
            filterAndSearch();
        } catch (error) {
            console.error('Initialization failed:', error);
            showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED);
            const errorMessage = `<p class="text-red-500 col-span-full">${error.message}</p>`;
            [governoratesGrid, ministriesGrid, ministersGrid, publicFiguresGrid, otherGrid, syndicatesGrid, universitiesGrid, embassiesGrid].forEach(grid => {
                if (grid) grid.innerHTML = errorMessage;
            });
        } finally {
            hideLoading();
        }
    }

    // Back to top functionality is now handled by the back-to-top component

    init();
});