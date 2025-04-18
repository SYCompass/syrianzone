// script.js
document.addEventListener('DOMContentLoaded', () => {
    const governoratesGrid = document.getElementById('governorates-grid');
    const ministriesGrid = document.getElementById('ministries-grid');
    const publicFiguresGrid = document.getElementById('public_figures-grid');
    const otherGrid = document.getElementById('other-grid');
    const modal = document.getElementById('social-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.getElementById('close-modal-button');
    const closeModalButtonFooter = document.getElementById('close-modal-button-footer');
    const searchBar = document.getElementById('search-bar');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.data-section');
    const noResultsDiv = document.getElementById('no-results');

    let allData = { governorates: [], ministries: [], public_figures: [], other: [] }; // To store fetched data

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
            populateGrid(publicFiguresGrid, data.public_figures, 'public_figures');
            populateGrid(otherGrid, data.other, 'other');
            updateVisibility(); // Check if any sections should be hidden initially
        })
        .catch(error => {
            console.error('خطأ في جلب البيانات:', error);
            governoratesGrid.innerHTML = '<p class="text-red-500 col-span-full">خطأ في تحميل بيانات المحافظات.</p>';
            ministriesGrid.innerHTML = '<p class="text-red-500 col-span-full">خطأ في تحميل بيانات الوزارات.</p>';
            publicFiguresGrid.innerHTML = '<p class="text-red-500 col-span-full">خطأ في تحميل بيانات الشخصيات العامة.</p>';
            otherGrid.innerHTML = '<p class="text-red-500 col-span-full">خطأ في تحميل بيانات أخرى.</p>';
        });

    // --- Grid Population ---
    function populateGrid(gridElement, items, category) {
        gridElement.innerHTML = ''; // Clear existing items
        if (!items || items.length === 0) {
            return;
        }
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
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" style="aspect-ratio: 1/1;" onerror="this.onerror=null; this.src='images/placeholder.png';">
                </div>
                <div class="p-3 flex-grow flex flex-col items-center justify-center"> 
                    <span class="block text-center text-xl font-medium text-gray-600 leading-snug mt-1">${item.name_ar}</span>
                    <span class="block text-center text-sm font-medium text-gray-800 leading-snug">${item.name}</span>
                    ${item.description ? `<span class="block text-center text-xs text-gray-500 mt-1">${item.description}</span>` : ''}
                </div>
            `;

            // Add click listener for modal
            cell.addEventListener('click', () => openModal(item.id, category));
            gridElement.appendChild(cell);
        });
    }

    // --- Modal Handling ---
    function openModal(itemId, category) {
        const item = allData[category]?.find(i => i.id === itemId);
        if (!item) return;

        modalTitle.textContent = item.name_ar;
        modalBody.innerHTML = ''; // Clear previous links

        // Add description if available
        if (item.description) {
            const descriptionElement = document.createElement('p');
            descriptionElement.className = 'text-gray-600 text-center mb-4';
            descriptionElement.textContent = item.description;
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
            modalBody.innerHTML = '<p class="text-gray-500">لا توجد روابط لوسائل التواصل الاجتماعي متاحة.</p>';
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
            default: return 'fas fa-link';
        }
    }

    // Close modal listeners
    closeModalButton.addEventListener('click', closeModal);
    closeModalButtonFooter.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
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

        noResultsDiv.style.display = hasVisibleItems ? 'none' : 'block';
        if (!hasVisibleItems) {
            noResultsDiv.innerHTML = '<p class="text-gray-500 text-center">لا توجد نتائج مطابقة للبحث.</p>';
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

}); // End DOMContentLoaded