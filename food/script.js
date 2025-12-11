// Syrian Recipes - Main JavaScript
class SyrianRecipes {
    constructor() {
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadRecipes();
    }
    
    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            cityFilter: document.getElementById('cityFilter'),
            difficultyFilter: document.getElementById('difficultyFilter'),
            contributorFilter: document.getElementById('contributorFilter'),
            clearFilters: document.getElementById('clearFilters'),
            sortSelect: document.getElementById('sortSelect'),
            resultsCount: document.getElementById('resultsCount'),
            recipesGrid: document.getElementById('recipesGrid'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            noResults: document.getElementById('noResults'),
            loadMoreContainer: document.getElementById('loadMoreContainer'),
            loadMoreBtn: document.getElementById('loadMoreBtn'),
            retryButton: document.getElementById('retryButton'),
            recipeModal: document.getElementById('recipeModal'),
            closeModal: document.getElementById('closeModal'),
            modalContent: document.getElementById('modalContent')
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
        
        this.elements.difficultyFilter.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.contributorFilter.addEventListener('change', () => {
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
            this.loadRecipes();
        });
        
        // Modal functionality
        this.elements.closeModal.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.elements.recipeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.recipeModal) {
                this.closeModal();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.recipeModal.classList.contains('open')) {
                this.closeModal();
            }
        });
    }
    
    // Convert Google Drive URL to direct image URL (or return local path as-is)
    convertGoogleDriveUrl(url) {
        if (!url) {
            return url;
        }
        
        // If it's already a local path, return as-is
        if (url.startsWith('/') || url.startsWith('./')) {
            return url;
        }
        
        // If it's a Google Drive URL, convert it
        if (url.includes('drive.google.com')) {
            // Extract file ID from URL
            const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                const fileId = match[1];
                return `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
        }
        
        return url;
    }
    
    // Load recipes from JSON file
    async loadRecipes() {
        try {
            this.showLoading();
            this.hideError();

            const response = await fetch('/food/recipes.json');
            if (!response.ok) {
                throw new Error('Failed to fetch recipes');
            }

            const data = await response.json();
            this.recipes = data;
            
            this.setupFilters();
            this.clearAllFilters();
            this.displayRecipes();
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showError(error?.message || CONFIG.ERROR_MESSAGES.FETCH_FAILED);
        } finally {
            this.hideLoading();
        }
    }
    
    // Setup filter options
    setupFilters() {
        const cities = [...new Set(this.recipes.map(r => r.city_region).filter(Boolean))];
        const difficulties = [...new Set(this.recipes.map(r => r.difficulty).filter(Boolean))];
        const contributors = [...new Set(this.recipes.map(r => r.contributor_info).filter(Boolean))];
        
        this.populateFilter(this.elements.cityFilter, cities);
        this.populateFilter(this.elements.difficultyFilter, difficulties);
        this.populateFilter(this.elements.contributorFilter, contributors);
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
        const difficultyFilter = this.elements.difficultyFilter.value;
        const contributorFilter = this.elements.contributorFilter.value;
        
        this.filteredRecipes = this.recipes.filter(recipe => {
            // Search filter
            const searchMatch = !searchTerm || 
                recipe.dish_name?.toLowerCase().includes(searchTerm) ||
                recipe.city_region?.toLowerCase().includes(searchTerm) ||
                recipe.contributor_info?.toLowerCase().includes(searchTerm) ||
                recipe.time_needed?.toLowerCase().includes(searchTerm) ||
                recipe.servings?.toLowerCase().includes(searchTerm) ||
                this.searchInIngredients(recipe.ingredients, searchTerm) ||
                this.searchInSteps(recipe.steps, searchTerm);
            
            // City filter
            const cityMatch = !cityFilter || recipe.city_region === cityFilter;
            
            // Difficulty filter
            const difficultyMatch = !difficultyFilter || recipe.difficulty === difficultyFilter;
            
            // Contributor filter
            const contributorMatch = !contributorFilter || recipe.contributor_info === contributorFilter;
            
            return searchMatch && cityMatch && difficultyMatch && contributorMatch;
        });
        
        this.currentPage = 1;
        this.applySorting();
        this.displayRecipes();
    }
    
    // Search in ingredients (handles both object and array)
    searchInIngredients(ingredients, searchTerm) {
        if (!ingredients) return false;
        
        if (Array.isArray(ingredients)) {
            return ingredients.some(ing => ing.toLowerCase().includes(searchTerm));
        } else if (typeof ingredients === 'object') {
            return Object.values(ingredients).some(arr => 
                Array.isArray(arr) && arr.some(ing => ing.toLowerCase().includes(searchTerm))
            );
        }
        
        return false;
    }
    
    // Search in steps (handles both object and array)
    searchInSteps(steps, searchTerm) {
        if (!steps) return false;
        
        if (Array.isArray(steps)) {
            return steps.some(step => step.toLowerCase().includes(searchTerm));
        } else if (typeof steps === 'object') {
            return Object.values(steps).some(arr => 
                Array.isArray(arr) && arr.some(step => step.toLowerCase().includes(searchTerm))
            );
        }
        
        return false;
    }
    
    // Apply sorting
    applySorting() {
        const sortBy = this.elements.sortSelect.value;
        
        this.filteredRecipes.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.dish_name?.toLowerCase() || '';
                    bValue = b.dish_name?.toLowerCase() || '';
                    return aValue.localeCompare(bValue);
                    
                case 'name-desc':
                    aValue = a.dish_name?.toLowerCase() || '';
                    bValue = b.dish_name?.toLowerCase() || '';
                    return bValue.localeCompare(aValue);
                    
                case 'difficulty':
                    const difficultyOrder = { 'سهلة جداً': 1, 'سهلة': 2, 'متوسطة': 3, 'صعبة': 4, 'صعبة جداً': 5 };
                    aValue = difficultyOrder[a.difficulty] || 99;
                    bValue = difficultyOrder[b.difficulty] || 99;
                    return aValue - bValue;
                    
                case 'city':
                    aValue = a.city_region?.toLowerCase() || '';
                    bValue = b.city_region?.toLowerCase() || '';
                    return aValue.localeCompare(bValue);
                    
                case 'time':
                    // Simple comparison - could be improved
                    aValue = a.time_needed || '';
                    bValue = b.time_needed || '';
                    return aValue.localeCompare(bValue);
                    
                default:
                    return 0;
            }
        });
        
        this.displayRecipes();
    }
    
    // Display recipes
    displayRecipes() {
        const startIndex = (this.currentPage - 1) * CONFIG.APP.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.APP.ITEMS_PER_PAGE;
        const recipesToShow = this.filteredRecipes.slice(startIndex, endIndex);
        
        // Update results count
        this.updateResultsCount();
        
        // Show/hide no results message
        if (this.filteredRecipes.length === 0) {
            this.showNoResults();
            return;
        } else {
            this.hideNoResults();
        }
        
        // Clear grid if it's the first page
        if (this.currentPage === 1) {
            this.elements.recipesGrid.innerHTML = '';
        }
        
        // Add recipe cards
        recipesToShow.forEach(recipe => {
            const card = this.createRecipeCard(recipe);
            this.elements.recipesGrid.appendChild(card);
        });
        
        // Show/hide load more button
        this.elements.loadMoreContainer.style.display = 
            endIndex < this.filteredRecipes.length ? 'block' : 'none';
    }
    
    // Create recipe card
    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.addEventListener('click', () => {
            this.openModal(recipe);
        });
        
        const imageUrl = this.convertGoogleDriveUrl(recipe.image_url);
        const difficultyBadge = this.getDifficultyBadge(recipe.difficulty);
        
        card.innerHTML = `
            <div class="recipe-card-image-container">
                <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(recipe.dish_name)}" class="recipe-card-image" onerror="this.src='/assets/placeholder.jpg'">
                ${difficultyBadge}
            </div>
            <div class="recipe-card-content">
                <h3 class="recipe-card-title">${this.escapeHtml(recipe.dish_name)}</h3>
                <div class="recipe-card-meta">
                    ${recipe.city_region ? `<span class="recipe-card-city"><i class="fas fa-map-marker-alt ml-1"></i>${this.escapeHtml(recipe.city_region)}</span>` : ''}
                    ${recipe.contributor_info ? `<span class="recipe-card-contributor"><i class="fas fa-user ml-1"></i>${this.escapeHtml(recipe.contributor_info)}</span>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Get difficulty badge HTML
    getDifficultyBadge(difficulty) {
        if (!difficulty) return '';
        
        const difficultyClasses = {
            'سهلة جداً': 'difficulty-easy',
            'سهلة': 'difficulty-easy',
            'متوسطة': 'difficulty-medium',
            'صعبة': 'difficulty-hard',
            'صعبة جداً': 'difficulty-hard'
        };
        
        const className = difficultyClasses[difficulty] || 'difficulty-medium';
        
        return `<span class="difficulty-badge ${className}">${this.escapeHtml(difficulty)}</span>`;
    }
    
    // Open modal with recipe details
    openModal(recipe) {
        const imageUrl = this.convertGoogleDriveUrl(recipe.image_url);
        
        // Build ingredients HTML
        const ingredientsHtml = this.buildIngredientsHtml(recipe.ingredients);
        
        // Build steps HTML
        const stepsHtml = this.buildStepsHtml(recipe.steps);
        
        // Build summary cards
        const summaryCards = `
            <div class="recipe-summary-cards">
                <div class="summary-card">
                    <div class="summary-card-label">المساهم</div>
                    <div class="summary-card-value">${recipe.contributor_info ? this.escapeHtml(recipe.contributor_info) : 'غير محدد'}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-label">الصعوبة</div>
                    <div class="summary-card-value">${this.getDifficultyBadge(recipe.difficulty)}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-label">الكمية</div>
                    <div class="summary-card-value">${recipe.servings ? this.escapeHtml(recipe.servings) : 'غير محدد'}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-label">الوقت</div>
                    <div class="summary-card-value">${recipe.time_needed ? this.escapeHtml(recipe.time_needed) : 'غير محدد'}</div>
                </div>
            </div>
        `;
        
        // Update modal title
        const modalTitle = document.getElementById('recipeModalTitle');
        if (modalTitle) {
            modalTitle.textContent = this.escapeHtml(recipe.dish_name);
        }
        
        this.elements.modalContent.innerHTML = `
            <div class="recipe-modal-image-container">
                <img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(recipe.dish_name)}" class="recipe-modal-image" onerror="this.src='/assets/placeholder.jpg'">
                <div class="recipe-modal-title-section">
                    <h2 class="recipe-modal-title">${this.escapeHtml(recipe.dish_name)}</h2>
                    ${recipe.city_region ? `<p class="recipe-modal-city">${this.escapeHtml(recipe.city_region)}</p>` : ''}
                </div>
            </div>
            ${summaryCards}
            <div class="recipe-modal-sections">
                <div class="recipe-section">
                    <h3 class="recipe-section-title">
                        <i class="fas fa-shopping-basket ml-2"></i>
                        المكونات
                    </h3>
                    ${ingredientsHtml}
                </div>
                <div class="recipe-section">
                    <h3 class="recipe-section-title">
                        <i class="fas fa-check-circle ml-2"></i>
                        طريقة التحضير
                    </h3>
                    ${stepsHtml}
                </div>
            </div>
        `;
        
        this.elements.recipeModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    // Build ingredients HTML (handles both object and array)
    buildIngredientsHtml(ingredients) {
        if (!ingredients) return '<p>لا توجد مكونات محددة</p>';
        
        if (Array.isArray(ingredients)) {
            return `<ul class="recipe-list">${ingredients.map(ing => `<li>${this.escapeHtml(ing)}</li>`).join('')}</ul>`;
        } else if (typeof ingredients === 'object') {
            let html = '';
            Object.entries(ingredients).forEach(([section, items]) => {
                if (Array.isArray(items)) {
                    html += `<div class="recipe-subsection"><h4 class="recipe-subsection-title">${this.escapeHtml(section)}</h4><ul class="recipe-list">${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul></div>`;
                }
            });
            return html;
        }
        
        return '<p>لا توجد مكونات محددة</p>';
    }
    
    // Build steps HTML (handles both object and array)
    buildStepsHtml(steps) {
        if (!steps) return '<p>لا توجد خطوات محددة</p>';
        
        if (Array.isArray(steps)) {
            return `<ul class="recipe-list">${steps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}</ul>`;
        } else if (typeof steps === 'object') {
            let html = '';
            Object.entries(steps).forEach(([section, stepItems]) => {
                if (Array.isArray(stepItems)) {
                    html += `<div class="recipe-subsection"><h4 class="recipe-subsection-title">${this.escapeHtml(section)}</h4><ul class="recipe-list">${stepItems.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}</ul></div>`;
                }
            });
            return html;
        }
        
        return '<p>لا توجد خطوات محددة</p>';
    }
    
    // Close modal
    closeModal() {
        this.elements.recipeModal.classList.remove('open');
        document.body.style.overflow = '';
    }
    
    // Update results count
    updateResultsCount() {
        const total = this.filteredRecipes.length;
        const showing = Math.min(this.currentPage * CONFIG.APP.ITEMS_PER_PAGE, total);
        
        this.elements.resultsCount.textContent = 
            total === 0 ? 'لم يتم العثور على وصفات' : 
            `عرض ${showing} من أصل ${total} وصفة`;
    }
    
    // Load more recipes
    loadMore() {
        this.currentPage++;
        this.displayRecipes();
        
        // Scroll to show new content
        const lastCard = this.elements.recipesGrid.lastElementChild;
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
        this.elements.cityFilter.value = '';
        this.elements.difficultyFilter.value = '';
        this.elements.contributorFilter.value = '';
        this.applyFilters();
    }
    
    // Clear all filters and search (used on initial load)
    clearAllFilters() {
        this.elements.searchInput.value = '';
        this.elements.cityFilter.value = '';
        this.elements.difficultyFilter.value = '';
        this.elements.contributorFilter.value = '';
        this.elements.sortSelect.value = 'name';
        this.elements.clearSearch.style.display = 'none';
        this.currentPage = 1;
        
        // Set filtered recipes to all recipes and apply sorting
        this.filteredRecipes = [...this.recipes];
        this.applySorting();
    }
    
    // Show loading state
    showLoading() {
        this.isLoading = true;
        this.elements.loadingSpinner.style.display = 'flex';
        this.elements.recipesGrid.style.display = 'none';
    }
    
    // Hide loading state
    hideLoading() {
        this.isLoading = false;
        this.elements.loadingSpinner.style.display = 'none';
        this.elements.recipesGrid.style.display = 'grid';
    }
    
    // Show error message
    showError(message) {
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.style.display = 'flex';
        this.elements.recipesGrid.style.display = 'none';
    }
    
    // Hide error message
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }
    
    // Show no results message
    showNoResults() {
        this.elements.noResults.style.display = 'flex';
        this.elements.loadMoreContainer.style.display = 'none';
        this.elements.recipesGrid.style.display = 'none';
    }
    
    // Hide no results message
    hideNoResults() {
        this.elements.noResults.style.display = 'none';
        this.elements.recipesGrid.style.display = 'grid';
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SyrianRecipes();
});
