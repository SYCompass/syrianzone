// Syrian Hotels Directory - Main JavaScript
class SyrianHotels {
    constructor() {
        this.hotels = [];
        this.filteredHotels = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.searchTimeout = null;
        this.currentView = this.getDefaultView(); // Responsive default view
        
        this.initializeElements();
        this.bindEvents();
        this.loadHotels();
    }
    
    // Get default view based on screen size
    getDefaultView() {
        if (window.innerWidth < 768) {
            return 'grid'; // Mobile: grid view
        } else {
            return 'table'; // Tablet and desktop: table view
        }
    }
    
    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            cityFilter: document.getElementById('cityFilter'),
            styleFilter: document.getElementById('styleFilter'),
            clearFilters: document.getElementById('clearFilters'),
            sortSelect: document.getElementById('sortSelect'),
            resultsCount: document.getElementById('resultsCount'),
            hotelsGrid: document.getElementById('hotelsGrid'),
            hotelsTable: document.getElementById('hotelsTable'),
            hotelsTableBody: document.getElementById('hotelsTableBody'),
            tableViewBtn: document.getElementById('tableViewBtn'),
            gridViewBtn: document.getElementById('gridViewBtn'),
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
        this.elements.cityFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.styleFilter.addEventListener('change', () => {
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
            this.loadHotels();
        });
        
        // Back to top functionality
        this.elements.backToTop.addEventListener('click', () => {
            this.scrollToTop();
        });
        
        // Scroll event for back to top button
        window.addEventListener('scroll', () => {
            this.toggleBackToTop();
        });
        
        // Window resize event for responsive view switching
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // View toggle functionality
        this.elements.tableViewBtn.addEventListener('click', () => {
            this.switchView('table');
        });
        
        this.elements.gridViewBtn.addEventListener('click', () => {
            this.switchView('grid');
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    
    // Load hotels from Google Sheets or CSV
    async loadHotels() {
        try {
            this.showLoading();
            this.hideError();
            
            // Check cache first
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.hotels = cachedData;
                this.setupFilters();
                this.clearAllFilters();
                this.initializeView();
                this.displayHotels();
                return;
            }
            
            // Check if CSV URL is configured and not the default placeholder
            if (!CONFIG.GOOGLE_SHEETS.CSV_URL || CONFIG.GOOGLE_SHEETS.CSV_URL === 'YOUR_GOOGLE_SHEETS_CSV_URL_HERE') {
                this.hotels = this.getSampleData();
            } else {
                // Fetch from Google Sheets
                const data = await this.fetchFromGoogleSheets();
                this.hotels = this.processData(data);
            }
            
            // Cache the data
            this.cacheData(this.hotels);
            
            // Setup filters and display
            this.setupFilters();
            this.clearAllFilters();
            this.initializeView();
            this.displayHotels();
            
        } catch (error) {
            console.error('Error loading hotels:', error);
            
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
    
    // Initialize view based on screen size
    initializeView() {
        const defaultView = this.getDefaultView();
        this.switchView(defaultView);
    }
    
    // Get sample data for testing
    getSampleData() {
        return [
            {
                'Hotel': 'Beit Al Wali',
                'City': 'Damascus',
                'Style': 'Damascene architectural style',
                'Phone Number': '+963 11 543 6666',
                'Phone Number 2': '+963 11 543 6667',
                'Phone Number 3': '',
                'Website': 'https://www.beitalwali.com',
                'Website 2': 'https://www.beitalwali.com/booking',
                'Website 3': '',
                'Instagram': '@beitalwali',
                'Facebook': 'BeitAlWaliHotel',
                'X Twitter': '',
                'location': 'G867+JMR، Bab Touma Main Road, Boolad, Damascus, Syria',
                'Map Embed': '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.123456789!2d36.2765!3d33.5138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDMwJzQ5LjciTiAzNsKwMTYnMzUuNCJF!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus" width="100%" height="200" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
                'Description': 'A beautiful traditional Damascene hotel in the heart of Old Damascus',
                'Amenities': 'WiFi,Air Conditioning,Restaurant,24/7 Reception',
                'Rating': '4.5',
                'Price Range': '$$$'
            },
            {
                'Hotel': 'Talisman 2',
                'City': 'Damascus',
                'Style': 'Damascene architectural style',
                'Phone Number': '+963 988 900 900',
                'Phone Number 2': '',
                'Phone Number 3': '',
                'Website': 'https://www.instagram.com/talismanhotels/?hl=en',
                'Website 2': '',
                'Website 3': '',
                'Instagram': '@talismanhotels',
                'Facebook': 'TalismanHotels',
                'X Twitter': '',
                'location': 'Al Ameen Street, Old Damascus',
                'Map Embed': '',
                'Description': 'Historic hotel with traditional architecture',
                'Amenities': 'WiFi,Air Conditioning,Restaurant,Bar',
                'Rating': '4.2',
                'Price Range': '$$$'
            },
            {
                'Hotel': 'Four Seasons',
                'City': 'Damascus',
                'Style': 'Modern',
                'Phone Number': '011-3391000',
                'Phone Number 2': '',
                'Phone Number 3': '',
                'Website': 'https://www.instagram.com/four_seasons_damascus_hotel/?hl=en',
                'Website 2': '',
                'Website 3': '',
                'Instagram': '@four_seasons_damascus_hotel',
                'Facebook': 'FourSeasonsDamascus',
                'X Twitter': '',
                'location': 'Shukri Al Qwatli Avenue, Damascus',
                'Map Embed': '',
                'Description': 'Luxury international hotel chain',
                'Amenities': 'WiFi,Air Conditioning,Restaurant,Spa,Pool,Gym',
                'Rating': '5.0',
                'Price Range': '$$$$'
            }
        ];
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
                    const hotel = {};
                    headers.forEach((header, index) => {
                        hotel[header] = row[index] || '';
                    });
                    data.push(hotel);
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
        return rawData.filter(hotel => 
            hotel[CONFIG.COLUMNS.HOTEL_NAME] && 
            hotel[CONFIG.COLUMNS.HOTEL_NAME].trim()
        );
    }
    
    // Setup filter options
    setupFilters() {
        const cities = [...new Set(this.hotels.map(h => h[CONFIG.COLUMNS.CITY]).filter(Boolean))];
        const styles = [...new Set(this.hotels.map(h => h[CONFIG.COLUMNS.STYLE]).filter(Boolean))];
        
        this.populateFilter(this.elements.cityFilter, cities);
        this.populateFilter(this.elements.styleFilter, styles);
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
        const cityFilter = this.elements.cityFilter.value;
        const styleFilter = this.elements.styleFilter.value;
        
        this.filteredHotels = this.hotels.filter(hotel => {
            // Search filter - search in all relevant columns
            const searchMatch = !searchTerm || 
                hotel[CONFIG.COLUMNS.HOTEL_NAME]?.toLowerCase().includes(searchTerm) ||
                hotel[CONFIG.COLUMNS.CITY]?.toLowerCase().includes(searchTerm) ||
                hotel[CONFIG.COLUMNS.STYLE]?.toLowerCase().includes(searchTerm) ||
                hotel[CONFIG.COLUMNS.DESCRIPTION]?.toLowerCase().includes(searchTerm) ||
                hotel[CONFIG.COLUMNS.AMENITIES]?.toLowerCase().includes(searchTerm) ||
                hotel[CONFIG.COLUMNS.LOCATION]?.toLowerCase().includes(searchTerm);
            
            // City filter
            const cityMatch = !cityFilter || hotel[CONFIG.COLUMNS.CITY] === cityFilter;
            
            // Style filter
            const styleMatch = !styleFilter || hotel[CONFIG.COLUMNS.STYLE] === styleFilter;
            
            return searchMatch && cityMatch && styleMatch;
        });
        
        this.currentPage = 1;
        this.applySorting();
        this.displayHotels();
    }
    
    // Apply sorting
    applySorting() {
        const sortBy = this.elements.sortSelect.value;
        
        this.filteredHotels.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a[CONFIG.COLUMNS.HOTEL_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.HOTEL_NAME].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'name-desc':
                    aValue = a[CONFIG.COLUMNS.HOTEL_NAME].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.HOTEL_NAME].toLowerCase();
                    return bValue.localeCompare(aValue);
                    
                case 'city':
                    aValue = a[CONFIG.COLUMNS.CITY].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.CITY].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                case 'style':
                    aValue = a[CONFIG.COLUMNS.STYLE].toLowerCase();
                    bValue = b[CONFIG.COLUMNS.STYLE].toLowerCase();
                    return aValue.localeCompare(bValue);
                    
                default:
                    return 0;
            }
        });
        
        this.displayHotels();
    }
    
    // Handle window resize
    handleResize() {
        const newDefaultView = this.getDefaultView();
        
        // Only switch if the current view doesn't match the new default
        // and we're not in the middle of loading
        if (newDefaultView !== this.currentView && !this.isLoading) {
            this.switchView(newDefaultView);
        }
    }
    
    // Switch between table and grid view
    switchView(view) {
        this.currentView = view;
        
        // Update button states
        this.elements.tableViewBtn.classList.toggle('active', view === 'table');
        this.elements.gridViewBtn.classList.toggle('active', view === 'grid');
        
        // Show/hide appropriate containers
        this.elements.hotelsTable.style.display = view === 'table' ? 'block' : 'none';
        this.elements.hotelsGrid.style.display = view === 'grid' ? 'grid' : 'none';
        
        // Refresh the display
        this.displayHotels();
    }
    
    // Display hotels
    displayHotels() {
        const startIndex = (this.currentPage - 1) * CONFIG.APP.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.APP.ITEMS_PER_PAGE;
        const hotelsToShow = this.filteredHotels.slice(startIndex, endIndex);
        
        // Update results count
        this.updateResultsCount();
        
        // Show/hide no results message
        if (this.filteredHotels.length === 0) {
            this.showNoResults();
            return;
        } else {
            this.hideNoResults();
        }
        
        // Clear containers if it's the first page
        if (this.currentPage === 1) {
            this.elements.hotelsGrid.innerHTML = '';
            this.elements.hotelsTableBody.innerHTML = '';
        }
        
        // Add hotels based on current view
        if (this.currentView === 'table') {
            this.displayHotelsTable(hotelsToShow);
        } else {
            this.displayHotelsGrid(hotelsToShow);
        }
        
        // Show/hide load more button
        this.elements.loadMoreContainer.style.display = 
            endIndex < this.filteredHotels.length ? 'block' : 'none';
    }
    
    // Display hotels in table format
    displayHotelsTable(hotelsToShow) {
        hotelsToShow.forEach(hotel => {
            const row = this.createHotelTableRow(hotel);
            this.elements.hotelsTableBody.appendChild(row);
        });
    }
    
    // Display hotels in grid format
    displayHotelsGrid(hotelsToShow) {
        hotelsToShow.forEach(hotel => {
            const card = this.createHotelCard(hotel);
            this.elements.hotelsGrid.appendChild(card);
        });
    }
    
    // Create hotel card
    createHotelCard(hotel) {
        const card = document.createElement('div');
        card.className = 'rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow';
        
        const location = this.formatLocation(hotel);
        const contactInfo = this.createContactInfo(hotel);
        const socialLinks = this.createSocialLinks(hotel);
        const mapEmbed = this.createMapEmbed(hotel);
        
        card.innerHTML = `
            <div class="hotel-card p-6 bg-white rounded-lg shadow-sm">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${this.escapeHtml(hotel[CONFIG.COLUMNS.HOTEL_NAME])}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${hotel[CONFIG.COLUMNS.STYLE] ? 
                            `<span class="style-badge">${this.escapeHtml(hotel[CONFIG.COLUMNS.STYLE])}</span>` : ''}
                        ${hotel[CONFIG.COLUMNS.CITY] ? 
                            `<span class="city-badge">${this.escapeHtml(hotel[CONFIG.COLUMNS.CITY])}</span>` : ''}
                        ${hotel[CONFIG.COLUMNS.PRICE_RANGE] ? 
                            `<span class="city-badge">${this.escapeHtml(hotel[CONFIG.COLUMNS.PRICE_RANGE])}</span>` : ''}
                    </div>
                </div>
                
                ${hotel[CONFIG.COLUMNS.DESCRIPTION] ? 
                    `<p class="text-gray-600 leading-relaxed mb-4">${this.escapeHtml(hotel[CONFIG.COLUMNS.DESCRIPTION])}</p>` : ''}
                
                <div class="space-y-3">
                    ${location ? `<div class="flex items-center text-sm text-gray-600">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-map-marker-alt text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span>${location}</span>
                    </div>` : ''}
                    
                    ${hotel[CONFIG.COLUMNS.AMENITIES] ? `<div class="flex items-center text-sm text-gray-600">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-star text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span>المرافق: ${this.formatAmenities(hotel[CONFIG.COLUMNS.AMENITIES])}</span>
                    </div>` : ''}
                    
                    ${contactInfo}
                </div>
                
                ${socialLinks ? `<div class="flex gap-2 pt-4 border-t mt-4">${socialLinks}</div>` : ''}
                
                ${mapEmbed}
            </div>
        `;
        
        return card;
    }
    
    // Create hotel table row
    createHotelTableRow(hotel) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Hotel name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'px-6 py-4';
        nameCell.innerHTML = `
            <div class="hotel-name-cell">${this.escapeHtml(hotel[CONFIG.COLUMNS.HOTEL_NAME])}</div>
            ${hotel[CONFIG.COLUMNS.DESCRIPTION] ? 
                `<div class="text-sm text-gray-600 mt-1">${this.escapeHtml(hotel[CONFIG.COLUMNS.DESCRIPTION])}</div>` : ''}
        `;
        
        // City cell
        const cityCell = document.createElement('td');
        cityCell.className = 'px-6 py-4';
        cityCell.innerHTML = hotel[CONFIG.COLUMNS.CITY] ? 
            `<span class="hotel-badge">${this.escapeHtml(hotel[CONFIG.COLUMNS.CITY])}</span>` : '';
        
        // Style cell
        const styleCell = document.createElement('td');
        styleCell.className = 'px-6 py-4';
        styleCell.innerHTML = hotel[CONFIG.COLUMNS.STYLE] ? 
            `<span class="hotel-badge primary">${this.escapeHtml(hotel[CONFIG.COLUMNS.STYLE])}</span>` : '';
        
        // Contact cell
        const contactCell = document.createElement('td');
        contactCell.className = 'px-6 py-4';
        const phones = [
            hotel[CONFIG.COLUMNS.PHONE_1],
            hotel[CONFIG.COLUMNS.PHONE_2],
            hotel[CONFIG.COLUMNS.PHONE_3]
        ].filter(Boolean);
        
        const websites = [
            hotel[CONFIG.COLUMNS.WEBSITE_1],
            hotel[CONFIG.COLUMNS.WEBSITE_2],
            hotel[CONFIG.COLUMNS.WEBSITE_3]
        ].filter(Boolean);
        
        let contactHtml = '';
        if (phones.length > 0) {
            contactHtml += `<div class="hotel-contact-cell">`;
            phones.forEach(phone => {
                contactHtml += `<div class="hotel-contact-item">
                    <a href="tel:${this.escapeHtml(phone)}" dir="ltr">${this.escapeHtml(phone)}</a>
                </div>`;
            });
            contactHtml += `</div>`;
        }
        
        if (websites.length > 0) {
            contactHtml += `<div class="hotel-contact-cell mt-2">`;
            websites.forEach(website => {
                contactHtml += `<div class="hotel-contact-item">
                    <a href="${this.escapeHtml(website)}" target="_blank" rel="noopener" class="website-link">
                        <i class="fas fa-globe ml-1"></i> زيارة الموقع
                    </a>
                </div>`;
            });
            contactHtml += `</div>`;
        }
        
        contactCell.innerHTML = contactHtml;
        
        // Location cell
        const locationCell = document.createElement('td');
        locationCell.className = 'px-6 py-4';
        locationCell.innerHTML = hotel[CONFIG.COLUMNS.LOCATION] ? 
            `<div class="text-sm text-gray-600">${this.escapeHtml(hotel[CONFIG.COLUMNS.LOCATION])}</div>` : '';
        
        // Social links cell
        const socialCell = document.createElement('td');
        socialCell.className = 'px-6 py-4';
        const socialLinks = this.createTableSocialLinks(hotel);
        socialCell.innerHTML = socialLinks;
        
        // Append all cells to row
        row.appendChild(nameCell);
        row.appendChild(cityCell);
        row.appendChild(styleCell);
        row.appendChild(contactCell);
        row.appendChild(locationCell);
        row.appendChild(socialCell);
        
        return row;
    }
    
    // Create social links for table view
    createTableSocialLinks(hotel) {
        const links = [];
        
        // Instagram
        if (hotel[CONFIG.COLUMNS.INSTAGRAM]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.instagram.baseUrl, hotel[CONFIG.COLUMNS.INSTAGRAM]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-instagram ml-1"></i> زيارة صفحة الانستغرام
                </a>
            `);
        }
        
        // Facebook
        if (hotel[CONFIG.COLUMNS.FACEBOOK]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.facebook.baseUrl, hotel[CONFIG.COLUMNS.FACEBOOK]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-facebook ml-1"></i> زيارة صفحة الفيسبوك
                </a>
            `);
        }
        
        // X (Twitter)
        if (hotel[CONFIG.COLUMNS.X_TWITTER]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.x_twitter.baseUrl, hotel[CONFIG.COLUMNS.X_TWITTER]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-x-twitter ml-1"></i> زيارة صفحة X
                </a>
            `);
        }
        
        return links.length > 0 ? `<div class="hotel-social-text-links">${links.join('')}</div>` : '';
    }
    
    // Format location string
    formatLocation(hotel) {
        return hotel[CONFIG.COLUMNS.LOCATION] || null;
    }
    
    // Create contact information section
    createContactInfo(hotel) {
        const contacts = [];
        
        // Phone numbers
        const phones = [
            hotel[CONFIG.COLUMNS.PHONE_1],
            hotel[CONFIG.COLUMNS.PHONE_2],
            hotel[CONFIG.COLUMNS.PHONE_3]
        ].filter(Boolean);
        
        if (phones.length > 0) {
            contacts.push(`
                <div class="contact-group">
                    <div class="flex items-center text-sm text-gray-600 mb-1">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-phone text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span class="font-medium">الهاتف:</span>
                    </div>
                    ${phones.map(phone => `
                        <div class="contact-item">
                            <a href="tel:${this.escapeHtml(phone)}" class="text-blue-600 hover:underline" dir="ltr">
                                ${this.escapeHtml(phone)}
                            </a>
                        </div>
                    `).join('')}
                </div>
            `);
        }
        
        // Websites
        const websites = [
            hotel[CONFIG.COLUMNS.WEBSITE_1],
            hotel[CONFIG.COLUMNS.WEBSITE_2],
            hotel[CONFIG.COLUMNS.WEBSITE_3]
        ].filter(Boolean);
        
        if (websites.length > 0) {
            contacts.push(`
                <div class="contact-group">
                    <div class="flex items-center text-sm text-gray-600 mb-1">
                        <div class="w-5 flex justify-center ml-2">
                            <i class="fas fa-globe text-[var(--sz-color-primary)]"></i>
                        </div>
                        <span class="font-medium">الموقع الإلكتروني:</span>
                    </div>
                    ${websites.map(website => `
                        <div class="contact-item">
                            <a href="${this.escapeHtml(website)}" target="_blank" rel="noopener" class="text-blue-600 hover:underline website-link">
                                <i class="fas fa-globe ml-1"></i> زيارة الموقع
                            </a>
                        </div>
                    `).join('')}
                </div>
            `);
        }
        
        return contacts.join('');
    }
    
    // Create social media links
    createSocialLinks(hotel) {
        const links = [];
        
        // Instagram
        if (hotel[CONFIG.COLUMNS.INSTAGRAM]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.instagram.baseUrl, hotel[CONFIG.COLUMNS.INSTAGRAM]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-instagram ml-1"></i> زيارة صفحة الانستغرام
                </a>
            `);
        }
        
        // Facebook
        if (hotel[CONFIG.COLUMNS.FACEBOOK]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.facebook.baseUrl, hotel[CONFIG.COLUMNS.FACEBOOK]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-facebook ml-1"></i> زيارة صفحة الفيسبوك
                </a>
            `);
        }
        
        // X (Twitter)
        if (hotel[CONFIG.COLUMNS.X_TWITTER]) {
            const url = this.formatSocialUrl(CONFIG.SOCIAL_PLATFORMS.x_twitter.baseUrl, hotel[CONFIG.COLUMNS.X_TWITTER]);
            links.push(`
                <a href="${url}" target="_blank" rel="noopener" class="social-text-link">
                    <i class="fab fa-x-twitter ml-1"></i> زيارة صفحة X
                </a>
            `);
        }
        
        return links.join('');
    }
    
    // Get social platform display name
    getSocialPlatformName(column) {
        const nameMap = {
            'instagram': 'إنستغرام',
            'facebook': 'فيسبوك',
            'x_twitter': 'X (تويتر)',
            'website': 'الموقع الإلكتروني'
        };
        return nameMap[column] || 'رابط خارجي';
    }
    
    // Format amenities as comma-separated list
    formatAmenities(amenities) {
        if (!amenities) return '';
        
        const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
        return this.escapeHtml(amenitiesArray.join('، '));
    }
    
    // Format social media URL
    formatSocialUrl(baseUrl, account) {
        // Remove @ symbol if present
        const cleanAccount = account.replace(/^@/, '');
        return baseUrl + cleanAccount;
    }
    
    // Create map embed
    createMapEmbed(hotel) {
        const mapEmbed = hotel[CONFIG.COLUMNS.MAP_EMBED];
        if (!mapEmbed || !CONFIG.FEATURES.ENABLE_MAP_EMBEDS) return '';
        
        return `
            <div class="mt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">الموقع على الخريطة:</h4>
                <div class="map-embed">${mapEmbed}</div>
            </div>
        `;
    }
    
    // Update results count
    updateResultsCount() {
        const total = this.filteredHotels.length;
        const showing = Math.min(this.currentPage * CONFIG.APP.ITEMS_PER_PAGE, total);
        
        this.elements.resultsCount.textContent = 
            total === 0 ? 'لم يتم العثور على فنادق' : 
            `عرض ${showing} من أصل ${total} فندق`;
    }
    
    // Load more hotels
    loadMore() {
        this.currentPage++;
        this.displayHotels();
        
        // Scroll to show new content
        const lastElement = this.currentView === 'table' ? 
            this.elements.hotelsTableBody.lastElementChild : 
            this.elements.hotelsGrid.lastElementChild;
        if (lastElement) {
            lastElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        this.elements.cityFilter.value = '';
        this.elements.styleFilter.value = '';
        this.applyFilters();
    }
    
    // Clear all filters and search (used on initial load)
    clearAllFilters() {
        this.elements.searchInput.value = '';
        this.elements.cityFilter.value = '';
        this.elements.styleFilter.value = '';
        this.elements.sortSelect.value = 'name';
        this.elements.clearSearch.style.display = 'none';
        this.currentPage = 1;
        
        // Set filtered hotels to all hotels and apply sorting
        this.filteredHotels = [...this.hotels];
        this.applySorting();
    }
    
    // Show loading state
    showLoading() {
        this.isLoading = true;
        this.elements.loadingSpinner.style.display = 'block';
        this.elements.hotelsGrid.style.display = 'none';
        this.elements.hotelsTable.style.display = 'none';
    }
    
    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        this.elements.loadingSpinner.style.display = 'none';
        if (this.currentView === 'table') {
            this.elements.hotelsTable.style.display = 'block';
        } else {
            this.elements.hotelsGrid.style.display = 'grid';
        }
    }
    
    // Show error message
    showError(message) {
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.hotelsGrid.style.display = 'none';
        this.elements.hotelsTable.style.display = 'none';
    }
    
    // Hide error message
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }
    
    // Show no results message
    showNoResults() {
        this.elements.noResults.style.display = 'block';
        this.elements.hotelsGrid.style.display = 'none';
        this.elements.hotelsTable.style.display = 'none';
        this.elements.loadMoreContainer.style.display = 'none';
    }
    
    // Hide no results message
    hideNoResults() {
        this.elements.noResults.style.display = 'none';
        if (this.currentView === 'table') {
            this.elements.hotelsTable.style.display = 'block';
        } else {
            this.elements.hotelsGrid.style.display = 'grid';
        }
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
                } else {
                    this.clearCache();
                }
            }
        } catch (error) {
            console.warn('Failed to retrieve cached data:', error);
        }
        
        return null;
    }
    
    // Clear cache
    clearCache() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHED_DATA);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP);
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
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
    new SyrianHotels();
});
