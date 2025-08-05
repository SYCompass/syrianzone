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
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            noResults: document.getElementById('noResults'),
            loadMoreContainer: document.getElementById('loadMoreContainer'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            retryButton: document.getElementById('retryButton'),
            backToTop: document.getElementById('backToTop')
        };
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
        
        // Back to top functionality
        this.elements.backToTop.addEventListener('click', () => {
            this.scrollToTop();
        });
        
        // Scroll event for back to top button
        window.addEventListener('scroll', () => {
            this.toggleBackToTop();
        });
        
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
            
            // Check cache first
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.organizations = cachedData;
                this.setupFilters();
                this.clearAllFilters();
                this.displayOrganizations();
                return;
            }
            
            // Fetch from Google Sheets
            const data = await this.fetchFromGoogleSheets();
            this.organizations = this.processData(data);
            
            // Cache the data
            this.cacheData(this.organizations);
            
            // Setup filters and display
            this.setupFilters();
            this.clearAllFilters();
            this.displayOrganizations();
            
        } catch (error) {
            console.error('Error loading organizations:', error);
            
            // Show specific error messages based on error type
            if (error.message.includes('CSV parsing error')) {
                this.showError(CONFIG.ERROR_MESSAGES.PARSE_ERROR);
            } else if (error.message.includes('HTML redirect')) {
                this.showError(CONFIG.ERROR_MESSAGES.REDIRECT_ERROR);
            } else if (error.message.includes('HTTP error')) {
                this.showError(CONFIG.ERROR_MESSAGES.CSV_ERROR);
            } else if (error.message.includes('Network')) {
                this.showError(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            } else {
                this.showError(CONFIG.ERROR_MESSAGES.FETCH_FAILED);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    // Fetch data from Google Sheets CSV export
    async fetchFromGoogleSheets() {
        const { CSV_URL, MAX_RETRIES, RETRY_DELAY } = CONFIG.GOOGLE_SHEETS;
        
        let lastError;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(CSV_URL, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/csv, text/plain, */*',
                        'Cache-Control': 'no-cache'
                    },
                    redirect: 'follow'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const csvText = await response.text();
                
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('Empty CSV data received');
                }
                
                // Check if we received HTML instead of CSV (redirect page)
                if (csvText.trim().toLowerCase().startsWith('<html') || 
                    csvText.includes('<title>') || 
                    csvText.includes('temporary redirect')) {
                    throw new Error('Received HTML redirect instead of CSV data');
                }
                
                // Debug: Log first few lines of CSV
                console.log('CSV Preview:', csvText.split('\n').slice(0, 3).join('\n'));
                
                return this.parseCSV(csvText);
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < MAX_RETRIES) {
                    await this.delay(RETRY_DELAY * attempt); // Exponential backoff
                }
            }
        }
        
        throw new Error(`Failed to fetch data after ${MAX_RETRIES} attempts: ${lastError.message}`);
    }
    
    // Parse CSV text into array of objects
    parseCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('CSV must have at least a header row and one data row');
            }
            
            // Parse headers
            const headers = this.parseCSVRow(lines[0]);
            
            // Parse data rows
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const row = this.parseCSVRow(lines[i]);
                if (row.length > 0 && row[0]) { // Skip empty rows
                    const initiative = {};
                    headers.forEach((header, index) => {
                        initiative[header] = row[index] || '';
                    });
                    data.push(initiative);
                }
            }
            
            return data;
            
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
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
        
        // Clear grid if it's the first page
        if (this.currentPage === 1) {
            this.elements.organizationsGrid.innerHTML = '';
        }
        
        // Add organization cards
        organizationsToShow.forEach(organization => {
            const card = this.createOrganizationCard(organization);
            this.elements.organizationsGrid.appendChild(card);
        });
        
        // Show/hide load more button
        this.elements.loadMoreContainer.style.display = 
            endIndex < this.filteredOrganizations.length ? 'block' : 'none';
    }
    
    // Create organization card
    createOrganizationCard(organization) {
        const card = document.createElement('div');
        card.className = 'rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow';
        
        const location = this.formatLocation(organization);
        const socialLinks = this.createSocialLinks(organization);
        
        card.innerHTML = `
            <div class="org-card p-6 bg-white rounded-lg shadow-sm">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${this.escapeHtml(organization[CONFIG.COLUMNS.INITIATIVE_NAME])}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${organization[CONFIG.COLUMNS.CATEGORY] ? 
                            `<span class="type-badge">${this.escapeHtml(organization[CONFIG.COLUMNS.CATEGORY])}</span>` : ''}
                        ${this.createPoliticalLeaningsTags(organization[CONFIG.COLUMNS.POLITICAL_LEANINGS])}
                    </div>
                </div>
                
                ${organization[CONFIG.COLUMNS.DESCRIPTION] ? 
                    `<p class="text-gray-600 leading-relaxed mb-4">${this.escapeHtml(organization[CONFIG.COLUMNS.DESCRIPTION])}</p>` : ''}
                
                <div class="space-y-3">
                    ${location ? `<div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-map-marker-alt ml-2 text-green-600"></i>
                        <span>${location}</span>
                    </div>` : ''}
                    
                    ${organization[CONFIG.COLUMNS.MVP_MEMBERS] ? `<div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-users ml-2 text-green-600"></i>
                        <span>أعضاء بارزون: ${this.formatMVPMembers(organization[CONFIG.COLUMNS.MVP_MEMBERS])}</span>
                    </div>` : ''}
                    
                    ${organization[CONFIG.COLUMNS.WEBSITE] ? `
                        <div class="flex items-center text-sm">
                            <i class="fas fa-globe ml-2 text-green-600"></i>
                            <a href="${this.escapeHtml(organization[CONFIG.COLUMNS.WEBSITE])}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                                زيارة الموقع الإلكتروني
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.MANIFESTO_LINK] ? `
                        <div class="flex items-center text-sm">
                            <i class="fas fa-file-alt ml-2 text-green-600"></i>
                            <a href="${this.escapeHtml(organization[CONFIG.COLUMNS.MANIFESTO_LINK])}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                                البيان التأسيسي
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.EMAIL] ? `
                        <div class="flex items-center text-sm">
                            <i class="fas fa-envelope ml-2 text-green-600"></i>
                            <a href="mailto:${this.escapeHtml(organization[CONFIG.COLUMNS.EMAIL])}" class="text-blue-600 hover:underline">
                                ${this.escapeHtml(organization[CONFIG.COLUMNS.EMAIL])}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.PHONE] ? `
                        <div class="flex items-center text-sm">
                            <i class="fas fa-phone ml-2 text-green-600"></i>
                            <a href="tel:${this.escapeHtml(organization[CONFIG.COLUMNS.PHONE])}" class="text-blue-600 hover:underline">
                                ${this.escapeHtml(organization[CONFIG.COLUMNS.PHONE])}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${organization[CONFIG.COLUMNS.LANG] ? `<div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-language ml-2 text-green-600"></i>
                        <span>اللغة: ${this.getLanguageName(organization[CONFIG.COLUMNS.LANG])}</span>
                    </div>` : ''}
                </div>
                
                ${socialLinks ? `<div class="flex gap-2 pt-4 border-t mt-4">${socialLinks}</div>` : ''}
            </div>
        `;
        
        return card;
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
        
        Object.entries(CONFIG.SOCIAL_PLATFORMS).forEach(([column, platform]) => {
            const account = organization[column];
            if (account) {
                const url = this.formatSocialUrl(platform.baseUrl, account);
                const iconName = this.getFontAwesomeIconName(column);
                links.push(`
                    <a href="${url}" target="_blank" rel="noopener" 
                       class="social-link bg-gray-200 hover:bg-red-600 hover:text-white transition-colors" 
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
    
    // Toggle back to top button
    toggleBackToTop() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.elements.backToTop.style.display = scrollTop > 300 ? 'block' : 'none';
    }
    
    // Scroll to top
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
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