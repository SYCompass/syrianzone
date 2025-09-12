// Syrian Zone Websites Section - Main Script
document.addEventListener('DOMContentLoaded', () => {
    // --- App State ---
    let allWebsites = [];
    let currentFilter = 'all';
    let currentSearchTerm = '';
    let searchTimeout;
    let viewToggle = null;
    let currentView = 'grid';

    // --- DOM Elements ---
    const searchBar = document.getElementById('search-bar');
    const clearSearch = document.getElementById('clearSearch');
    const typeFilter = document.getElementById('typeFilter');
    const clearFilters = document.getElementById('clearFilters');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCount = document.getElementById('resultsCount');
    const filterButtonsContainer = document.getElementById('filter-buttons'); // Legacy - may not exist
    const websiteSections = document.getElementById('website-sections');
    const websitesTable = document.getElementById('websitesTable');
    const websitesTableBody = document.getElementById('websitesTableBody');
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
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    // Use shared CSV utility
    function parseCSV(csvText) { return window.SZ.csv.parseCSVToObjects(csvText); }

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
        const { CSV_URL, MAX_RETRIES } = CONFIG.GOOGLE_SHEETS;
        const res = await window.SZ.http.fetchWithRetry(CSV_URL, { retries: MAX_RETRIES });
        return parseCSV(res.text);
    }

    // --- UI Rendering ---
    function createWebsiteIcon(website) {
        const icon = document.createElement('div');
        icon.className = 'website-icon';
        icon.dataset.id = website.id;
        icon.dataset.type = website.type;
        icon.dataset.name = website.name.toLowerCase();
        icon.dataset.description = website.description.toLowerCase();
        icon.dataset.url = website.url.toLowerCase();

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
    
    // Display websites in the current view (grid or table)
    function displayWebsites() {
        if (currentView === 'table') {
            populateWebsitesTable();
        } else {
            populateWebsitesGrid();
        }
    }
    
    // Populate websites in table format
    function populateWebsitesTable() {
        websitesTableBody.innerHTML = '';
        
        // Filter and sort websites for table view
        let filteredWebsites = allWebsites;
        
        // Apply search filter
        if (currentSearchTerm) {
            filteredWebsites = filteredWebsites.filter(website => 
                website.name.toLowerCase().includes(currentSearchTerm) ||
                website.description.toLowerCase().includes(currentSearchTerm) ||
                website.url.toLowerCase().includes(currentSearchTerm) ||
                website.type.toLowerCase().includes(currentSearchTerm)
            );
        }
        
        // Apply type filter
        if (currentFilter !== 'all') {
            filteredWebsites = filteredWebsites.filter(website => website.type === currentFilter);
        }
        
        // Sort websites
        const sortBy = sortSelect.value;
        filteredWebsites.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });
        
        // Create table rows
        filteredWebsites.forEach(website => {
            const row = createWebsiteTableRow(website);
            websitesTableBody.appendChild(row);
        });
        
        // Update results count
        updateResultsCount(filteredWebsites.length);
        
        // Show/hide no results
        if (filteredWebsites.length === 0) {
            showNoResults();
        } else {
            hideNoResults();
        }
    }
    
    // Create website table row
    function createWebsiteTableRow(website) {
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.dataset.type = website.type;
        
        // Website name cell (no icon in table mode)
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4';
        nameCell.innerHTML = `
            <div class="font-semibold" style="color: var(--text-primary);">${escapeHtml(website.name)}</div>
        `;
        
        // Description cell
        const descCell = document.createElement('td');
        descCell.className = 'px-6 py-4';
        descCell.innerHTML = `<div class="text-sm max-w-xs truncate" style="color: var(--text-secondary);" title="${escapeHtml(website.description)}">${escapeHtml(website.description || 'لا يوجد وصف')}</div>`;
        
        // Type cell with sharp corners pill
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-4';
        typeCell.innerHTML = `<span class="type-badge">${escapeHtml(getTypeDisplayName(website.type))}</span>`;
        
        // Link cell
        const linkCell = document.createElement('td');
        linkCell.className = 'px-6 py-4';
        linkCell.innerHTML = `<a href="${escapeHtml(website.url)}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fas fa-external-link-alt mr-1"></i>زيارة الموقع</a>`;
        
        // Append all cells to row
        row.appendChild(nameCell);
        row.appendChild(descCell);
        row.appendChild(typeCell);
        row.appendChild(linkCell);
        
        return row;
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

    // --- Dynamic Filter Generation ---
    function extractUniqueCategories(websites) {
        const categories = new Set();
        websites.forEach(website => {
            if (website.type && website.type.trim()) {
                categories.add(website.type.trim());
            }
        });
        return Array.from(categories);
    }
    
    // Populate type filter dropdown
    function populateTypeFilter(categories) {
        if (!typeFilter) return;
        
        // Clear existing options except the first one
        while (typeFilter.children.length > 1) {
            typeFilter.removeChild(typeFilter.lastChild);
        }
        
        // Sort categories by type order
        const sortedCategories = categories.sort((a, b) => {
            return getTypeOrder(a) - getTypeOrder(b);
        });
        
        // Add category options
        sortedCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = getTypeDisplayName(category);
            typeFilter.appendChild(option);
        });
    }

    function generateFilterButtons(categories) {
        // Skip filter button generation if container doesn't exist
        if (!filterButtonsContainer) {
            return;
        }
        
        // Clear existing buttons
        filterButtonsContainer.innerHTML = '';
        
        // Add "All" button first
        const allButton = createFilterButton('', 'الكل', true);
        filterButtonsContainer.appendChild(allButton);
        
        // Sort categories by type order
        const sortedCategories = categories.sort((a, b) => {
            return getTypeOrder(a) - getTypeOrder(b);
        });
        
        // Add category buttons
        sortedCategories.forEach(category => {
            const displayName = getTypeDisplayName(category);
            const button = createFilterButton(category, displayName, false);
            filterButtonsContainer.appendChild(button);
        });
        
        // Re-setup event listeners for new buttons
        setupFilterButtonEvents();
    }

    function createFilterButton(filterValue, displayName, isActive) {
        const button = document.createElement('button');
        button.className = `filter-btn search-filter-button ${isActive ? 'active' : ''}`;
        button.dataset.type = filterValue;
        button.textContent = displayName;
        return button;
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
        const typeFilterValue = typeFilter ? typeFilter.value : '';
        currentSearchTerm = searchTerm;
        currentFilter = typeFilterValue || 'all';
        
        // Show/hide clear search button
        if (clearSearch) {
            clearSearch.style.display = searchTerm ? 'block' : 'none';
        }
        
        let hasVisibleItems = false;
        let totalVisibleItems = 0;
        
        if (currentView === 'table') {
            // Handle table view filtering
            populateWebsitesTable(); // This already applies search and filter
            const visibleRows = websitesTableBody.querySelectorAll('tr[data-type]:not([style*="display: none"])');
            totalVisibleItems = visibleRows.length;
            hasVisibleItems = totalVisibleItems > 0;
        } else {
            // Handle grid view filtering
            const allIcons = websiteSections.querySelectorAll('.website-section .grid .website-icon');
            
            allIcons.forEach(icon => {
                const matchesSearch = !searchTerm || 
                    icon.dataset.name.includes(searchTerm) || 
                    icon.dataset.description.includes(searchTerm) ||
                    (icon.dataset.url && icon.dataset.url.includes(searchTerm));
                const matchesFilter = !typeFilterValue || icon.dataset.type === typeFilterValue;
                
                const isVisible = matchesSearch && matchesFilter;
                icon.style.display = isVisible ? 'flex' : 'none';
                
                if (isVisible) {
                    hasVisibleItems = true;
                    totalVisibleItems++;
                }
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
                if (!typeFilterValue || sectionType === typeFilterValue) {
                    section.style.display = hasVisibleIcons ? 'block' : 'none';
                } else {
                    section.style.display = 'none';
                }
            });
        }

        // Update results count
        updateResultsCount(totalVisibleItems);

        // Show/hide no results
        if (hasVisibleItems) {
            hideNoResults();
        } else {
            showNoResults();
        }
    }
    
    // Update results count display
    function updateResultsCount(count) {
        if (resultsCount) {
            resultsCount.textContent = count === 0 ? 'لم يتم العثور على مواقع سورية' : 
                `عرض ${count} موقع سوري`;
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
        if (searchBar) {
            searchBar.value = '';
        }
        if (clearSearch) {
            clearSearch.style.display = 'none';
        }
        filterAndSearch();
    }
    
    // Clear all filters
    function clearAllFilters() {
        if (searchBar) {
            searchBar.value = '';
        }
        if (typeFilter) {
            typeFilter.value = '';
        }
        if (clearSearch) {
            clearSearch.style.display = 'none';
        }
        filterAndSearch();
    }
    
    // Apply sorting
    function applySorting() {
        if (!sortSelect) return;
        
        const sortBy = sortSelect.value;
        
        if (currentView === 'table') {
            // For table view, just trigger filterAndSearch which calls populateWebsitesTable with sorting
            filterAndSearch();
        } else {
            // For grid view, sort icons within each section
            const allSections = Array.from(websiteSections.querySelectorAll('.website-section'));
            
            allSections.forEach(section => {
                const grid = section.querySelector('.grid');
                if (!grid) return;
                
                const icons = Array.from(grid.querySelectorAll('.website-icon'));
                
                icons.sort((a, b) => {
                    let aValue, bValue;
                    
                    switch (sortBy) {
                        case 'name':
                            aValue = a.dataset.name.toLowerCase();
                            bValue = b.dataset.name.toLowerCase();
                            return aValue.localeCompare(bValue);
                            
                        case 'name-desc':
                            aValue = a.dataset.name.toLowerCase();
                            bValue = b.dataset.name.toLowerCase();
                            return bValue.localeCompare(aValue);
                            
                        case 'type':
                            aValue = a.dataset.type.toLowerCase();
                            bValue = b.dataset.type.toLowerCase();
                            return aValue.localeCompare(bValue);
                            
                        default:
                            return 0;
                    }
                });
                
                // Re-append sorted icons to grid
                grid.innerHTML = '';
                icons.forEach(icon => grid.appendChild(icon));
            });
            
            // Re-apply filters after sorting
            filterAndSearch();
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Enhanced search functionality
        if (searchBar) {
            searchBar.addEventListener('input', handleSearch);
        }
        
        // Clear search button
        if (clearSearch) {
            clearSearch.addEventListener('click', clearSearchInput);
        }
        
        // Type filter
        if (typeFilter) {
            typeFilter.addEventListener('change', filterAndSearch);
        }
        
        // Clear filters button
        if (clearFilters) {
            clearFilters.addEventListener('click', clearAllFilters);
        }
        
        // Sort functionality
        if (sortSelect) {
            sortSelect.addEventListener('change', applySorting);
        }
    }

    function setupFilterButtonEvents() {
        // Set up unified filter button event handling
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update button states
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update type filter and trigger main filtering
                const type = button.dataset.type;
                if (typeFilter) {
                    typeFilter.value = type;
                    typeFilter.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    // --- Initialization ---
    async function init() {
        setupEventListeners();
        
        // Initialize ViewToggle component
        viewToggle = new window.SZ.ViewToggle({
            tableViewBtn: '#tableViewBtn',
            gridViewBtn: '#gridViewBtn',
            tableContainer: '#websitesTable',
            gridContainer: '#website-sections',
            storageKey: 'sites-view-preference',
            onViewChange: (view) => {
                currentView = view;
                displayWebsites();
                // Re-apply current filters after view change
                filterAndSearch();
            }
        });
        
        currentView = viewToggle.getCurrentView();
        
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

            // Generate dynamic filter buttons and populate type filter based on available categories
            const categories = extractUniqueCategories(allWebsites);
            generateFilterButtons(categories);
            populateTypeFilter(categories);
            
            // Display websites in current view
            displayWebsites();
            
            // Initialize results count and apply initial filter
            updateResultsCount(allWebsites.length);
            filterAndSearch();
            
        } catch (error) {
            console.error('Initialization failed:', error);
        } finally {
            hideLoading();
        }
    }

    // --- Back to Top Functionality is now handled by the back-to-top component ---

    // Start the application
    init();
});
