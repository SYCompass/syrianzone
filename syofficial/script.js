// script.js
document.addEventListener('DOMContentLoaded', () => {
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

    let isTableView = false; // Set default to false for grid view
    let allData = { governorates: [], ministries: [], ministers: [], public_figures: [], other: [], syndicates: [], universities: [], embassies: [] }; // To store fetched data
    let currentLanguage = localStorage.getItem('preferredLanguage') || 'ar'; // Get language from localStorage or default to 'ar'

    // --- View Toggle Handling ---
    viewToggle.addEventListener('click', () => {
        isTableView = !isTableView;
        if (isTableView) {
            contentSections.classList.add('hidden');
            tableView.classList.remove('hidden');
            viewToggle.innerHTML = `<i class="fas fa-th-large"></i><span data-i18n="view.grid">Grid View</span>`;
            if (allData && Object.keys(allData).length > 0) {
                populateTable();
            }
        } else {
            contentSections.classList.remove('hidden');
            tableView.classList.add('hidden');
            viewToggle.innerHTML = `<i class="fas fa-table"></i><span data-i18n="view.table">عرض الجدول</span>`;
        }
        // Update translations without triggering a full page update
        const lang = translations[currentLanguage];
        if (lang) {
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const value = getNestedValue(lang, key);
                if (value) {
                    element.textContent = value;
                }
            });
        }
    });

    // Set initial state
    contentSections.classList.remove('hidden');
    tableView.classList.add('hidden');
    viewToggle.innerHTML = `<i class="fas fa-table"></i><span data-i18n="view.table">عرض الجدول</span>`;

    // --- Table Population ---
    function populateTable() {
        if (!tableBody) return;

        // Clear existing content
        tableBody.innerHTML = '';

        // Define section order and titles
        const sections = [
            { key: 'governorates', i18n: 'sections.governorates' },
            { key: 'ministries', i18n: 'sections.ministries' },
            { key: 'ministers', i18n: 'sections.ministers' },
            { key: 'public_figures', i18n: 'sections.public_figures' },
            { key: 'syndicates', i18n: 'sections.syndicates' },
            { key: 'universities', i18n: 'sections.universities' },
            { key: 'embassies', i18n: 'sections.embassies' },
            { key: 'other', i18n: 'sections.other' }
        ];

        // Create a document fragment to batch DOM updates
        const fragment = document.createDocumentFragment();

        sections.forEach(section => {
            const items = allData[section.key];
            if (!items || items.length === 0) return;

            // Add section header
            const headerRow = document.createElement('tr');
            headerRow.className = 'bg-gray-100';
            headerRow.innerHTML = `
                <td colspan="3" class="px-6 py-3 text-sm font-semibold text-gray-900">
                    <span data-i18n="${section.i18n}">${section.key}</span>
                </td>
            `;
            fragment.appendChild(headerRow);

            // Add items for this section
            items.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 flex flex-col sm:table-row border-b border-gray-200 sm:border-0';
                row.dataset.name = item.name.toLowerCase();
                row.dataset.name_ar = item.name_ar.toLowerCase();
                row.dataset.category = section.key;

                const nameCell = document.createElement('td');
                nameCell.className = 'px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell';
                nameCell.innerHTML = `
                    <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.name">Name</div>
                    <div class="text-sm font-medium text-gray-900" data-name="${item.name}" data-name-ar="${item.name_ar}">${currentLanguage === 'ar' ? item.name_ar : item.name}</div>
                `;

                const descCell = document.createElement('td');
                descCell.className = 'px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell';
                descCell.innerHTML = `
                    <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.description">Description</div>
                    <div class="text-sm text-gray-500" data-desc="${item.description}" data-desc-ar="${item.description_ar || item.description}">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</div>
                `;

                const linksCell = document.createElement('td');
                linksCell.className = 'px-6 py-4 sm:whitespace-nowrap flex flex-col sm:table-cell';

                let socialLinksHTML = '';
                if (item.socials && Object.keys(item.socials).length > 0) {
                    socialLinksHTML = Object.entries(item.socials)
                        .map(([platform, link]) => `
                            <a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors">
                                <i class="${getSocialIcon(platform)} fa-fw text-blue-600"></i>
                                <span class="text-xs text-gray-700 mr-1">${platform}</span>
                            </a>
                        `).join('');
                } else {
                    socialLinksHTML = `<span class="text-sm text-gray-500" data-i18n="table.noLinks">No Links</span>`;
                }

                linksCell.innerHTML = `
                    <div class="text-xs text-gray-500 sm:hidden mb-1" data-i18n="table.socialLinks">Social Links</div>
                    <div class="flex flex-wrap gap-2">${socialLinksHTML}</div>
                `;

                row.appendChild(nameCell);
                row.appendChild(descCell);
                row.appendChild(linksCell);
                fragment.appendChild(row);
            });
        });

        // Append all rows at once
        tableBody.appendChild(fragment);
    }

    // --- Data Fetching ---
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`خطأ في الاتصال! الحالة: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allData = data; // Store data globally within this scope
            // Initial population of grids
            populateGrid(governoratesGrid, data.governorates, 'governorates');
            populateGrid(ministriesGrid, data.ministries, 'ministries');
            populateGrid(ministersGrid, data.ministers, 'ministers');
            populateGrid(publicFiguresGrid, data.public_figures, 'public_figures');
            populateGrid(otherGrid, data.other, 'other');
            populateGrid(syndicatesGrid, data.syndicates, 'syndicates');
            populateGrid(universitiesGrid, data.universities, 'universities');
            populateGrid(embassiesGrid, data.embassies, 'embassies');
            updateVisibility(); // Check if any sections should be hidden initially
        })
        .catch(error => {
            console.error('خطأ في جلب البيانات:', error);
            governoratesGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات المحافظات.</p>`;
            ministriesGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات الوزارات.</p>`;
            ministersGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات الوزراء.</p>`;
            publicFiguresGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات الشخصيات العامة.</p>`;
            otherGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات أخرى.</p>`;
            syndicatesGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات النقابات.</p>`;
            universitiesGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات الجامعات.</p>`;
            embassiesGrid.innerHTML = `<p class="text-red-500 col-span-full" data-i18n="app.error.loading">خطأ في تحميل بيانات السفارات.</p>`;
        });

    // --- Grid Population ---
    function populateGrid(gridElement, items, category) {
        gridElement.innerHTML = ''; // Clear existing items
        if (!items || items.length === 0) {
            return;
        }

        // Create Intersection Observer for lazy loading
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.onload = () => {
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                    };
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        items.forEach(item => {
            const cell = document.createElement('div');
            // --- CARD STYLING ---
            cell.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer flex flex-col';
            cell.dataset.id = item.id;
            cell.dataset.category = category;
            cell.dataset.name = item.name.toLowerCase();
            cell.dataset.name_ar = item.name_ar.toLowerCase();

            // --- CARD CONTENT ---
            cell.innerHTML = `
                <div class="w-full bg-gray-200"> 
                    <img data-src="${item.image}" alt="${currentLanguage === 'ar' ? item.name_ar : item.name}" class="w-full h-full object-cover lazy" style="aspect-ratio: 1/1;" onerror="this.onerror=null; this.src='images/placeholder.png';">
                </div>
                <div class="p-3 flex-grow flex flex-col items-center justify-center"> 
                    <span class="block text-center text-xl font-medium text-gray-600 leading-snug mt-1">${currentLanguage === 'ar' ? item.name_ar : item.name}</span>
                    ${item.description ? `<span class="block text-center text-xs text-gray-500 mt-1">${currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description}</span>` : ''}
                </div>
            `;

            // Add click listener for modal
            cell.addEventListener('click', () => openModal(item.id, category));

            // Observe the image for lazy loading
            const img = cell.querySelector('img');
            imageObserver.observe(img);

            gridElement.appendChild(cell);
        });
    }

    // --- Modal Handling ---
    function openModal(itemId, category) {
        currentModalId = itemId;
        currentModalCategory = category;
        const item = allData[category]?.find(i => i.id === itemId);
        if (!item) return;

        modalTitle.textContent = currentLanguage === 'ar' ? item.name_ar : item.name;
        modalBody.innerHTML = ''; // Clear previous links

        // Add description if available
        if (item.description) {
            const descriptionElement = document.createElement('p');
            descriptionElement.className = 'text-gray-600 text-center mb-4';
            descriptionElement.textContent = currentLanguage === 'ar' ? (item.description_ar || item.description) : item.description;
            modalBody.appendChild(descriptionElement);
        }

        if (item.socials && Object.keys(item.socials).length > 0) {
            Object.entries(item.socials).forEach(([platform, link]) => {
                const iconClass = getSocialIcon(platform);
                const linkElement = document.createElement('a');
                linkElement.href = link;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.className = 'flex items-center space-x-3 p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors';
                linkElement.innerHTML = `
                    <i class="${iconClass} fa-fw text-xl text-blue-600"></i>
                    <span class="text-gray-800 capitalize">${platform}</span>
                    <i class="fas fa-external-link-alt text-gray-400 ml-auto text-xs"></i>
                `;
                modalBody.appendChild(linkElement);
            });
        } else {
            modalBody.innerHTML = `<p class="text-gray-500" data-i18n="modal.noSocialLinks">لا توجد روابط لوسائل التواصل الاجتماعي متاحة.</p>`;
        }

        // Show modal with transitions
        document.body.classList.add('modal-active');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.querySelector('.modal-content').classList.remove('-translate-y-10');
    }

    function closeModal() {
        document.body.classList.remove('modal-active');
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('-translate-y-10');
        setTimeout(() => {
            modal.classList.add('pointer-events-none');
        }, 300);
    }

    // Helper to get Font Awesome icons
    function getSocialIcon(platform) {
        switch (platform.toLowerCase()) {
            case 'facebook': return 'fab fa-facebook';
            case 'twitter': return 'fab fa-twitter';
            case 'instagram': return 'fab fa-instagram';
            case 'telegram': return 'fab fa-telegram';
            case 'linkedin': return 'fab fa-linkedin';
            case 'youtube': return 'fab fa-youtube';
            case 'whatsapp': return 'fab fa-whatsapp';
            case 'linkedin': return 'fab fa-linkedin';
            case 'website': return 'fas fa-globe';
            default: return 'fas fa-link';
        }
    }

    // Close modal listeners
    closeModalButton.addEventListener('click', closeModal);
    closeModalButtonFooter.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
            closeModal();
        }
    });

    // --- Filtering and Searching ---
    let currentFilter = 'all';
    let currentSearchTerm = '';

    function filterAndSearch() {
        currentSearchTerm = searchBar.value.toLowerCase().trim();
        let hasVisibleItems = false;

        if (isTableView) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                if (row.classList.contains('bg-gray-100')) {
                    // This is a section header row
                    const sectionKey = row.querySelector('span').getAttribute('data-i18n').split('.')[1];
                    const matchesFilter = currentFilter === 'all' || currentFilter === sectionKey;
                    row.style.display = matchesFilter ? '' : 'none';
                    return;
                }

                const itemName = row.dataset.name;
                const itemNameAr = row.dataset.name_ar;
                const category = row.dataset.category;
                const matchesSearch = itemName.includes(currentSearchTerm) || itemNameAr.includes(currentSearchTerm);
                const matchesFilter = currentFilter === 'all' || currentFilter === category;

                if (matchesSearch && matchesFilter) {
                    row.style.display = '';
                    hasVisibleItems = true;
                } else {
                    row.style.display = 'none';
                }
            });
        } else {
            sections.forEach(section => {
                const category = section.dataset.category;
                const grid = section.querySelector('div[id$="-grid"]');
                const items = grid.querySelectorAll('div[data-category]');
                let sectionHasVisibleItems = false;

                const isSectionVisible = currentFilter === 'all' || currentFilter === category;

                if (isSectionVisible) {
                    section.style.display = 'block';

                    items.forEach(item => {
                        const itemName = item.dataset.name;
                        const itemNameAr = item.dataset.name_ar;
                        const matchesSearch = itemName.includes(currentSearchTerm) || itemNameAr.includes(currentSearchTerm);

                        if (matchesSearch) {
                            item.style.display = 'flex';
                            sectionHasVisibleItems = true;
                            hasVisibleItems = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                } else {
                    section.style.display = 'none';
                }
            });
        }

        noResultsDiv.style.display = hasVisibleItems ? 'none' : 'block';
        if (!hasVisibleItems) {
            noResultsDiv.innerHTML = '<p class="text-gray-500 text-center" data-i18n="search.noResults">No results found.</p>';
            // Update the no results message with current language
            const lang = translations[currentLanguage];
            if (lang) {
                const noResultsElement = noResultsDiv.querySelector('[data-i18n]');
                const key = noResultsElement.getAttribute('data-i18n');
                const value = getNestedValue(lang, key);
                if (value) {
                    noResultsElement.textContent = value;
                }
            }
        }
    }

    function updateVisibility() {
        filterAndSearch();
    }

    // Search bar listener (instant filtering)
    searchBar.addEventListener('input', filterAndSearch);

    // Filter button listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white', 'active');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            button.classList.add('bg-blue-500', 'text-white', 'active');
            button.classList.remove('bg-gray-200', 'text-gray-700');

            currentFilter = button.dataset.filter;
            filterAndSearch();
        });
    });

    // Function to update page language
    function updatePageLanguage() {
        currentLanguage = localStorage.getItem('preferredLanguage') || 'ar';

        // Update table view if active
        if (isTableView && allData && Object.keys(allData).length > 0) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const nameCell = row.querySelector('td:first-child');
                const descCell = row.querySelector('td:nth-child(2)');
                const nameDiv = nameCell.querySelector('.text-sm');
                const descDiv = descCell.querySelector('.text-sm');

                if (nameDiv && descDiv) {
                    const itemName = nameDiv.dataset.name;
                    const itemNameAr = nameDiv.dataset.nameAr;
                    const itemDesc = descDiv.dataset.desc;
                    const itemDescAr = descDiv.dataset.descAr;

                    nameDiv.textContent = currentLanguage === 'ar' ? itemNameAr : itemName;
                    descDiv.textContent = currentLanguage === 'ar' ? (itemDescAr || itemDesc) : itemDesc;
                }
            });
        }

        // Update grid views
        populateGrid(governoratesGrid, allData.governorates, 'governorates');
        populateGrid(ministriesGrid, allData.ministries, 'ministries');
        populateGrid(ministersGrid, allData.ministers, 'ministers');
        populateGrid(publicFiguresGrid, allData.public_figures, 'public_figures');
        populateGrid(otherGrid, allData.other, 'other');
        populateGrid(syndicatesGrid, allData.syndicates, 'syndicates');
        populateGrid(universitiesGrid, allData.universities, 'universities');
        populateGrid(embassiesGrid, allData.embassies, 'embassies');

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
    }

    // Listen for language changes
    document.addEventListener('languageChange', (event) => {
        currentLanguage = event.detail.lang;
        localStorage.setItem('preferredLanguage', currentLanguage);
        updatePageLanguage();
    });

    // Initial language setup
    updatePageLanguage();

    // Store current modal state
    let currentModalId = null;
    let currentModalCategory = null;

    // Helper function to get nested object values
    function getNestedValue(obj, path) {
        return path.split('.').reduce((o, p) => o?.[p], obj);
    }

}); // End DOMContentLoaded