// Syrian Political Organizations Directory - Main JavaScript
class SyrianPoliticalOrganizations {
    constructor() {
        this.organizations = [];
        this.filteredOrganizations = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadOrganizations();
    }
    
    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            categoryFilter: document.getElementById('categoryFilter'),
            countryFilter: document.getElementById('countryFilter'),
            cityFilter: document.getElementById('cityFilter'),
            langFilter: document.getElementById('langFilter'),
            clearFilters: document.getElementById('clearFilters'),
            sortSelect: document.getElementById('sortSelect'),
            resultsCount: document.getElementById('resultsCount'),
            organizationsGrid: document.getElementById('initiativesGrid'),
            organizationsTable: document.getElementById('organizationsTable'),
            organizationsTableBody: document.getElementById('organizationsTableBody'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            noResults: document.getElementById('noResults'),
            loadMoreContainer: document.getElementById('loadMoreContainer'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            retryButton: document.getElementById('retryButton'),
            // backToTop: removed - handled by component
        };
        
        // Initialize ViewToggle component
        this.viewToggle = new window.SZ.ViewToggle({
            tableViewBtn: '#tableViewBtn',
            gridViewBtn: '#gridViewBtn',
            tableContainer: '#organizationsTable',
            gridContainer: '#initiativesGrid',
            storageKey: 'party-view-preference',
            onViewChange: (view) => {
                this.currentView = view;
                this.displayOrganizations();
            }
        });
        
        this.currentView = this.viewToggle.getCurrentView();
    }
    
    // Bind event listeners
    bindEvents() {
        // Search functionality
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.clearSearch.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Filter functionality
        this.elements.categoryFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.countryFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.cityFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.langFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.clearFilters.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Sort functionality
        this.elements.sortSelect.addEventListener('change', () => {
            this.applySorting();
        });
        
        // Load more functionality
        this.elements.loadMoreBtn.addEventListener('click', () => {
            this.loadMore();
        });
        
        // Retry functionality
        this.elements.retryButton.addEventListener('click', () => {
            this.loadOrganizations();
        });
        
        // Back to top functionality is now handled by the back-to-top component
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    
    // Load organizations from Google Sheets
    async loadOrganizations() {
        try {
            this.showLoading();
            this.hideError();

            const cache = window.SZ?.cache?.createCache('party') || null;
            const cachedData = cache?.get('organizations') || null;
            if (cachedData) {
                this.organizations = cachedData;
                this.setupFilters();
                this.clearAllFilters();
                this.displayOrganizations();
                return;
            }

            const loader = async () => {
                const { CSV_URL, MAX_RETRIES } = CONFIG.GOOGLE_SHEETS;
                const res = await window.SZ.http.fetchWithRetry(CSV_URL, { retries: MAX_RETRIES });
                const rows = window.SZ.csv.parseCSVToObjects(res.text);
                return rows;
            };

            const data = await window.SZ.offline.runWithOfflineRetry(loader, {
                onError: () => this.showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED)
            });

            this.organizations = this.processData(data);
            cache?.set('organizations', this.organizations, CONFIG.GOOGLE_SHEETS.CACHE_DURATION);

            this.setupFilters();
            this.clearAllFilters();
            this.displayOrganizations();
        } catch (error) {
            console.error('Error loading organizations:', error);
            this.showError(error?.message || CONFIG.ERROR_MESSAGES.FETCH_FAILED);
        } finally {
            this.hideLoading();
        }
    }
    
    // Fetch data from Google Sheets CSV export
    async fetchFromGoogleSheets() {
        const { CSV_URL, MAX_RETRIES } = CONFIG.GOOGLE_SHEETS;
        const res = await window.SZ.http.fetchWithRetry(CSV_URL, { retries: MAX_RETRIES });
        return window.SZ.csv.parseCSVToObjects(res.text);
    }
    
    // Parse CSV text into array of objects
    parseCSV(csvText) {
        return window.SZ.csv.parseCSVToObjects(csvText);
    }
    
    // Parse a single CSV row, handling quoted fields
    parseCSVRow(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        return result;
    }
    
    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Process raw data from CSV
    processData(rawData) {
        return rawData.filter(organization => 
            organization[CONFIG.COLUMNS.INITIATIVE_NAME] && 
            organization[CONFIG.COLUMNS.INITIATIVE_NAME].trim()
        );
    }
    
    // Setup filter options
    setupFilters() {
        const categories = [...new Set(this.organizations.map(o => o[CONFIG.COLUMNS.CATEGORY]).filter(Boolean))];
        const countries = [...new Set(this.organizations.map(o => o[CONFIG.COLUMNS.COUNTRY]).filter(Boolean))];
        const cities = [...new Set(this.organizations.map(o => o[CONFIG.COLUMNS.CITY]).filter(Boolean))];
        const languages = [...new Set(this.organizations.map(o => o[CONFIG.COLUMNS.LANG]).filter(Boolean))];
        
        this.populateFilter(this.elements.categoryFilter, categories);
        this.populateFilter(this.elements.countryFilter, countries);
        this.populateFilter(this.elements.cityFilter, cities);
        this.populateFilter(this.elements.langFilter, languages);
    }
    
    // Populate filter dropdown
    populateFilter(selectElement, options) {
        // Clear existing options except the first one
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }
        
        // Add new options
        options.sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }
    
    // Handle search functionality
    handleSearch(searchTerm) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Show/hide clear search button
        this.elements.clearSearch.style.display = searchTerm ? 'block' : 'none';
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, CONFIG.APP.SEARCH_DEBOUNCE);
    }
    
    // Apply filters and search
    applyFilters() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const categoryFilter = this.elements.categoryFilter.value;
        const countryFilter = this.elements.countryFilter.value;
        const cityFilter = this.elements.cityFilter.value;
        const langFilter = this.elements.langFilter.value;
        
        this.filteredOrganizations = this.organizations.filter(organization => {
            // Search filter - search in all relevant columns
            const searchMatch = !searchTerm || 
                organization[CONFIG.COLUMNS.INITIATIVE_NAME]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.CATEGORY]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.COUNTRY]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.CITY]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.DESCRIPTION]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.POLITICAL_LEANINGS]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.MVP_MEMBERS]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.WEBSITE]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.MANIFESTO_LINK]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.EMAIL]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.PHONE]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.LANG]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.X_ACCOUNT]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.INSTAGRAM_ACCOUNT]?.toLowerCase().includes(searchTerm) ||
                organization[CONFIG.COLUMNS.FACEBOOK_ACCOUNT]?.toLowerCase().includes(searchTerm);
            
            // Category filter
            const categoryMatch = !categoryFilter || organization[CONFIG.COLUMNS.CATEGORY] === categoryFilter;
            
            // Country filter
            const countryMatch = !countryFilter || organization[CONFIG.COLUMNS.COUNTRY] === countryFilter;
            
            // City filter
            const cityMatch = !cityFilter || organization[CONFIG.COLUMNS.CITY] === cityFilter;
            
            // Language filter
            const langMatch = !langFilter || organization[CONFIG.COLUMNS.LANG] === langFilter;
            
            return searchMatch && categoryMatch && countryMatch && cityMatch && langMatch;
        });
        
        this.currentPage = 1;
        this.applySorting();
        this.displayOrganizations();
    }
    
    // Apply sorting
    applySorting() {
        const sortBy = this.elements.sortSelect.value;
        
        this.filteredOrganizations.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'name-desc':
                    aValue = a[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.INITIATIVE_NAME].toLowerCase();
                    return bValue.localeCompare(aValue);
                    
                case 'category':
                    aValue = a[CONFIG.COLUMNS.CATEGORY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.CATEGORY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'country':
                    aValue = a[CONFIG.COLUMNS.COUNTRY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.COUNTRY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'city':
                    aValue = a[CONFIG.COLUMNS.CITY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.CITY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                default:
                    return 0;
            }
        });
        
        this.displayOrganizations();
    }
    
    // Display organizations
    displayOrganizations() {
        const startIndex = (this.currentPage - 1) * CONFIG.APP.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.APP.ITEMS_PER_PAGE;
        const organizationsToShow = this.filteredOrganizations.slice(startIndex, endIndex);
        
        // Update results count
        this.updateResultsCount();
        
        // Show/hide no results message
        if (this.filteredOrganizations.length === 0) {
            this.showNoResults();
            return;
        } else {
            this.hideNoResults();
        }
        
        // Display based on current view
        if (this.currentView === 'table') {
            this.displayOrganizationsTable(organizationsToShow);
        } else {
            this.displayOrganizationsGrid(organizationsToShow);
        }
        
        // Show/hide load more button
        this.elements.loadMoreContainer.style.display = 
            endIndex < this.filteredOrganizations.length ? 'block' : 'none';
    }
    
    // Display organizations in grid format
    displayOrganizationsGrid(organizationsToShow) {
        // Clear grid if it's the first page
        if (this.currentPage === 1) {
            this.elements.organizationsGrid.innerHTML = '';
        }
        
        // Add organization cards
        organizationsToShow.forEach(organization => {
            const card = this.createOrganizationCard(organization);
            this.elements.organizationsGrid.appendChild(card);
        });
    }
    
    // Display organizations in table format
    displayOrganizationsTable(organizationsToShow) {
        // Clear table if it's the first page
        if (this.currentPage === 1) {
            this.elements.organizationsTableBody.innerHTML = '';
        }
        
        // Add organization rows
        organizationsToShow.forEach(organization => {
            const row = this.createOrganizationTableRow(organization);
            this.elements.organizationsTableBody.appendChild(row);
        });
    }
    
    // Create organization card
    createOrganizationCard(organization) {
        const card = document.createElement('div');
        card.className = 'bg-white shadow-sm hover:shadow-md transition-shadow';
        
        const location = this.formatLocation(organization);
        const socialLinks = this.createSocialLinks(organization);
        
        card.innerHTML = `
            <div class="org-card p-6 shadow-sm">
                <div class="mb-4">
                    <h3 class="text-xl font-bold mb-2" style="color: var(--text-primary);">${this.escapeHtml(organization[CONFIG.COLUMNS.INITIATIVE_NAME])}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${organization[CONFIG.COLUMNS.CATEGORY] ? 
                            `<span class="type-badge">${this.escapeHtml(organization[CONFIG.COLUMNS.CATEGORY])}</span>` : ''}
                        ${this.createPoliticalLeaningsTags(organization[CONFIG.COLUMNS.POLITICAL_LEANINGS])}
                    </div>
                </div>
                
                ${organization[CONFIG.COLUMNS.DESCRIPTION] ? 
                    `<p class="leading-relaxed mb-4" style="color: var(--text-secondary);">${this.escapeHtml(organization[CONFIG.COLUMNS.DESCRIPTION])}</p>` : ''}
                
                <div class="space-y-3">
                    ${location ? `<div class="flex items-center text-sm" style="color: var(--text-secondary);">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-map-marker-alt text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span>${location}</span>
                    </div>` : ''}
                    
                    ${organization[CONFIG.COLUMNS.MVP_MEMBERS] ? `<div class="flex items-center text-sm" style="color: var(--text-secondary);">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-users text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span>أعضاء بارزون: ${this.formatMVPMembers(organization[CONFIG.COLUMNS.MVP_MEMBERS])}</span>
                    </div>` : ''}
                    
                    ${organization[CONFIG.COLUMNS.WEBSITE] ? `
                        <div class="flex items-center text-sm">
                            <div class="w-5 flex justify-center ml-2">
                                <i class="fas fa-globe text-[var(--sz-color-primary)]"></i>
                            </div>
                            <a href="${this.escapeHtml(organization[CONFIG.COLUMNS.WEBSITE])}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                                زيارة الموقع الإلكتروني
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.MANIFESTO_LINK] ? `
                        <div class="flex items-center text-sm">
                            <div class="w-5 flex justify-center ml-2">
                                <i class="fas fa-file-alt text-[var(--sz-color-primary)]"></i>
                            </div>
                            <a href="${this.escapeHtml(organization[CONFIG.COLUMNS.MANIFESTO_LINK])}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                                البيان التأسيسي
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.EMAIL] ? `
                        <div class="flex items-center text-sm">
                            <div class="w-5 flex justify-center ml-2">
                                <i class="fas fa-envelope text-[var(--sz-color-primary)]"></i>
                            </div>
                            <a href="mailto:${this.escapeHtml(organization[CONFIG.COLUMNS.EMAIL])}" class="text-blue-600 hover:underline">
                                ${this.escapeHtml(organization[CONFIG.COLUMNS.EMAIL])}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.PHONE] ? `
                        <div class="flex items-center text-sm">
                            <div class="w-5 flex justify-center ml-2">
                                <i class="fas fa-phone text-[var(--sz-color-primary)]"></i>
                            </div>
                            <a href="tel:${this.escapeHtml(organization[CONFIG.COLUMNS.PHONE])}" class="text-blue-600 hover:underline">
                                ${this.escapeHtml(organization[CONFIG.COLUMNS.PHONE])}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.LANG] ? `<div class="flex items-center text-sm" style="color: var(--text-secondary);">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-language text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span>اللغة: ${this.getLanguageName(organization[CONFIG.COLUMNS.LANG])}</span>
                    </div>` : ''}
                </div>
                
                ${socialLinks ? `<div class="flex gap-2 pt-4 border-t mt-4">${socialLinks}</div>` : ''}
            </div>
        `;
        
        return card;
    }
    
    // Create organization table row
    createOrganizationTableRow(organization) {
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        
        // Organization name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4';
        nameCell.innerHTML = `
            <div class="font-semibold" style="color: var(--text-primary);">${this.escapeHtml(organization[CONFIG.COLUMNS.INITIATIVE_NAME])}</div>
            ${organization[CONFIG.COLUMNS.DESCRIPTION] ? 
                `<div class="text-sm mt-1" style="color: var(--text-secondary);">${this.escapeHtml(organization[CONFIG.COLUMNS.DESCRIPTION])}</div>` : ''}
        `;
        
        // Type cell
        const typeCell = document.createElement('td');
        typeCell.className = 'px-6 py-4';
        typeCell.innerHTML = organization[CONFIG.COLUMNS.CATEGORY] ? 
            `<span class="type-badge">${this.escapeHtml(organization[CONFIG.COLUMNS.CATEGORY])}</span>` : '';
        
        // Country cell
        const countryCell = document.createElement('td');
        countryCell.className = 'px-6 py-4';
        countryCell.innerHTML = organization[CONFIG.COLUMNS.COUNTRY] ? 
            `<span class="text-sm" style="color: var(--text-primary);">${this.escapeHtml(organization[CONFIG.COLUMNS.COUNTRY])}</span>` : '';
        
        // City cell
        const cityCell = document.createElement('td');
        cityCell.className = 'px-6 py-4';
        cityCell.innerHTML = organization[CONFIG.COLUMNS.CITY] ? 
            `<span class="text-sm" style="color: var(--text-primary);">${this.escapeHtml(organization[CONFIG.COLUMNS.CITY])}</span>` : '';
        
        // Links cell
        const linksCell = document.createElement('td');
        linksCell.className = 'px-6 py-4';
        const links = [];
        
        if (organization[CONFIG.COLUMNS.WEBSITE]) {
            links.push(`<a href="${this.escapeHtml(organization[CONFIG.COLUMNS.WEBSITE])}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fas fa-globe mr-1"></i>الموقع</a>`);
        }
        
        if (organization[CONFIG.COLUMNS.MANIFESTO_LINK]) {
            links.push(`<a href="${this.escapeHtml(organization[CONFIG.COLUMNS.MANIFESTO_LINK])}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fas fa-file-alt mr-1"></i>البيان</a>`);
        }
        
        // Add social media links
        const socialLinks = this.createTableSocialLinks(organization);
        if (socialLinks) {
            links.push(socialLinks);
        }
        
        linksCell.innerHTML = `<div class="flex flex-col space-y-1">${links.join('')}</div>`;
        
        // Append all cells to row
        row.appendChild(nameCell);
        row.appendChild(typeCell);
        row.appendChild(countryCell);
        row.appendChild(cityCell);
        row.appendChild(linksCell);
        
        return row;
    }
    
    // Create social links for table view
    createTableSocialLinks(organization) {
        const links = [];
        
        if (organization[CONFIG.COLUMNS.FACEBOOK]) {
            const url = window.SZ.social.format('facebook', organization[CONFIG.COLUMNS.FACEBOOK]);
            links.push(`<a href="${url}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fab fa-facebook mr-1"></i>فيسبوك</a>`);
        }
        
        if (organization[CONFIG.COLUMNS.TWITTER]) {
            const url = window.SZ.social.format('x', organization[CONFIG.COLUMNS.TWITTER]);
            links.push(`<a href="${url}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fab fa-x-twitter mr-1"></i>X</a>`);
        }
        
        if (organization[CONFIG.COLUMNS.INSTAGRAM]) {
            const url = window.SZ.social.format('instagram', organization[CONFIG.COLUMNS.INSTAGRAM]);
            links.push(`<a href="${url}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fab fa-instagram mr-1"></i>إنستغرام</a>`);
        }
        
        if (organization[CONFIG.COLUMNS.TELEGRAM]) {
            const url = window.SZ.social.format('telegram', organization[CONFIG.COLUMNS.TELEGRAM]);
            links.push(`<a href="${url}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fab fa-telegram mr-1"></i>تلغرام</a>`);
        }
        
        if (organization[CONFIG.COLUMNS.YOUTUBE]) {
            const url = window.SZ.social.format('youtube', organization[CONFIG.COLUMNS.YOUTUBE]);
            links.push(`<a href="${url}" target="_blank" rel="noopener" class="text-sm hover:underline" style="color: var(--sz-color-primary);"><i class="fab fa-youtube mr-1"></i>يوتيوب</a>`);
        }
        
        return links.join(' ');
    }
    
    // Format location string
    formatLocation(organization) {
        const parts = [
            organization[CONFIG.COLUMNS.CITY],
            organization[CONFIG.COLUMNS.COUNTRY]
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : null;
    }
    
    // Create social media links
    createSocialLinks(organization) {
        const links = [];
        
        Object.entries(CONFIG.SOCIAL_PLATFORMS).forEach(([column]) => {
            const account = organization[column];
            if (account) {
                const url = window.SZ.social.format(column, account);
                const iconName = this.getFontAwesomeIconName(column);
                links.push(`
                    <a href="${url}" target="_blank" rel="noopener" 
                       class="social-link bg-gray-200 hover:bg-[var(--sz-color-accent)] hover:text-white transition-colors" 
                       title="${this.getSocialPlatformName(column)}">
                        <i class="${iconName}"></i>
                    </a>
                `);
            }
        });
        
        return links.join('');
    }
    
    // Get Font Awesome icon name for social platforms
    getFontAwesomeIconName(column) {
        const iconMap = {
            'social - x': 'fab fa-x-twitter',
            'social - insta': 'fab fa-instagram',
            'social - fb': 'fab fa-facebook'
        };
        return iconMap[column] || 'fas fa-external-link-alt';
    }
    
    // Get social platform display name
    getSocialPlatformName(column) {
        const nameMap = {
            'social - x': 'X (تويتر)',
            'social - insta': 'إنستغرام',
            'social - fb': 'فيسبوك'
        };
        return nameMap[column] || 'رابط خارجي';
    }
    
    // Create political leanings tags
    createPoliticalLeaningsTags(leanings) {
        if (!leanings) return '';
        
        const leaningsArray = leanings.split('|').map(l => l.trim()).filter(l => l);
        if (leaningsArray.length === 0) return '';
        
        return leaningsArray.map(leaning => 
            `<span class="political-badge">${this.escapeHtml(leaning)}</span>`
        ).join('');
    }
    
    // Format MVP members as comma-separated list
    formatMVPMembers(members) {
        if (!members) return '';
        
        const membersArray = members.split('|').map(m => m.trim()).filter(m => m);
        return this.escapeHtml(membersArray.join('، '));
    }
    
    // Get language display name
    getLanguageName(langCode) {
        const languageMap = {
            'AR': 'العربية',
            'EN': 'English',
            'KU': 'Kurdish',
            'TR': 'Turkish'
        };
        return languageMap[langCode] || langCode;
    }
    
    // Format social media URL
    formatSocialUrl(baseUrl, account) {
        // Remove @ symbol if present
        const cleanAccount = account.replace(/^@/, '');
        return baseUrl + cleanAccount;
    }
    
    // Update results count
    updateResultsCount() {
        const total = this.filteredOrganizations.length;
        const showing = Math.min(this.currentPage * CONFIG.APP.ITEMS_PER_PAGE, total);
        
        this.elements.resultsCount.textContent = 
            total === 0 ? 'لم يتم العثور على منظمات سياسية' : 
            `عرض ${showing} من أصل ${total} منظمة سياسية`;
    }
    
    // Load more organizations
    loadMore() {
        this.currentPage++;
        this.displayOrganizations();
        
        // Scroll to show new content
        const lastCard = this.elements.organizationsGrid.lastElementChild;
        if (lastCard) {
            lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Clear search
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.clearSearch.style.display = 'none';
        this.applyFilters();
    }
    
    // Clear filters
    clearFilters() {
        this.elements.categoryFilter.value = '';
        this.elements.countryFilter.value = '';
        this.elements.cityFilter.value = '';
        this.applyFilters();
    }
    
    // Clear all filters and search (used on initial load)
    clearAllFilters() {
        this.elements.searchInput.value = '';
        this.elements.categoryFilter.value = '';
        this.elements.countryFilter.value = '';
        this.elements.cityFilter.value = '';
        this.elements.langFilter.value = '';
        this.elements.sortSelect.value = 'name';
        this.elements.clearSearch.style.display = 'none';
        this.currentPage = 1;
        
        // Set filtered organizations to all organizations and apply sorting
        this.filteredOrganizations = [...this.organizations];
        this.applySorting();
    }
    
    // Show loading state
    showLoading() {
        this.isLoading = true;
        this.elements.loadingSpinner.style.display = 'block';
        this.elements.organizationsGrid.style.display = 'none';
    }
    
    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.organizationsGrid.style.display = 'grid';
    }
    
    // Show error message
    showError(message) {
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.organizationsGrid.style.display = 'none';
    }
    
    // Hide error message
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }
    
    // Show no results message
    showNoResults() {
        this.elements.noResults.style.display = 'block';
        this.elements.organizationsGrid.style.display = 'none';
        this.elements.loadMoreContainer.style.display = 'none';
    }
    
    // Hide no results message
    hideNoResults() {
        this.elements.noResults.style.display = 'none';
        this.elements.organizationsGrid.style.display = 'grid';
    }
    
    // Cache data in localStorage
    cacheData(data) {
        if (!CONFIG.FEATURES.ENABLE_CACHING) return;
        
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHED_DATA, JSON.stringify(data));
            localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }
    
    // Get cached data
    getCachedData() {
        if (!CONFIG.FEATURES.ENABLE_CACHING) return null;
        
        try {
            const cachedData = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHED_DATA);
            const timestamp = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP);
            
            if (cachedData && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < CONFIG.GOOGLE_SHEETS.CACHE_DURATION) {
                    return JSON.parse(cachedData);
                }
            }
        } catch (error) {
            console.warn('Failed to retrieve cached data:', error);
        }
        
        return null;
    }
    
    // Back to top functionality moved to component
    
    // Handle keyboard navigation
    handleKeyboardNavigation(event) {
        // Escape key to clear search
        if (event.key === 'Escape' && document.activeElement === this.elements.searchInput) {
            this.clearSearch();
            this.elements.searchInput.blur();
        }
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SyrianPoliticalOrganizations();
}); 