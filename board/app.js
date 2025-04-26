document.addEventListener('DOMContentLoaded', function () {
    // Initialize marked with options
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Select Modal Elements
    const modalElement = document.getElementById('cardModal');
    const modalTitle = document.getElementById('cardModalTitle');
    const modalContent = document.getElementById('cardModalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Function to create a card element
    function createCard(issueData, status) {
        const card = document.createElement('div');
        card.className = 'card bg-white p-4 rounded shadow mb-4 cursor-pointer hover:shadow-md transition flex flex-col justify-between';
        card.dir = 'rtl';
        card.dataset.id = issueData.id; // Use issue ID
        card.dataset.status = status;

        const title = issueData.title;
        const content = issueData.body || ''; // Use body as content, fallback to empty string

        // --- Labels --- 
        let labelsHtml = '';
        if (issueData.labels && issueData.labels.length > 0) {
            labelsHtml = '<div class="flex flex-wrap gap-1 mb-2 justify-start">';
            issueData.labels.forEach(label => {
                const bgColor = `#${label.color}`;
                const textColor = parseInt(label.color, 16) > 0xffffff / 2 ? '#000000' : '#ffffff';
                labelsHtml += `<span class="text-xs font-semibold px-2 py-0.5 rounded" style="background-color: ${bgColor}; color: ${textColor};">${label.name}</span>`;
            });
            labelsHtml += '</div>';
        } else {
            labelsHtml = '<div class="mb-2 h-5"></div>'; // Placeholder
        }

        // --- Assignee --- 
        let assigneeHtml = '';
        if (issueData.assignee) {
            assigneeHtml = `
                <div class="flex items-center">
                    <span class="text-xs text-gray-500 ml-1 font-medium">المسؤول:</span>
                    <span class="text-xs text-gray-500 ml-1">${issueData.assignee.login}</span> 
                    <img src="${issueData.assignee.avatar_url}" alt="${issueData.assignee.login}" class="w-5 h-5 rounded-full">
                </div>
            `;
        } else {
            assigneeHtml = `
                <div class="flex items-center">
                    <span class="text-xs text-gray-500 ml-1">لم يتم تعيين مسؤول</span>
                    <i class="fas fa-user-slash text-gray-500 ml-1"></i>
                </div>
            `
        }

        // --- Dates (Formatted in Arabic - Syrian Locale) --- 
        const dateFormatter = new Intl.DateTimeFormat('ar-SY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const createdAtDate = new Date(issueData.created_at);
        const updatedAtDate = new Date(issueData.updated_at);

        const createdAtFormatted = dateFormatter.format(createdAtDate);
        const updatedAtFormatted = dateFormatter.format(updatedAtDate);

        let datesHtml = `<div class="text-xs text-gray-400">تاريخ الإنشاء: ${createdAtFormatted}`;
        if (createdAtDate.getTime() !== updatedAtDate.getTime()) {
            datesHtml += ` | آخر تحديث: ${updatedAtFormatted}`;
        }
        datesHtml += `</div>`;


        // Combine card content (RTL layout)
        const cardContent = `
            <div class="text-right"> 
                <h4 class="font-semibold mb-2">${title}</h4>
                ${labelsHtml} 
            </div>
            <div class="flex items-center justify-between mt-2"> 
                ${assigneeHtml}
                ${datesHtml} 
            </div>
        `;

        card.innerHTML = cardContent;

        // Pass title and full body content to the modal display function
        card.addEventListener('click', () => showCardDetails(title, content));

        return card;
    }

    // Function to show card details in modal
    function showCardDetails(title, content) {
        modalTitle.textContent = title;
        // Parse the body content as Markdown
        modalContent.innerHTML = marked.parse(content);

        modalElement.classList.remove('hidden');
        modalElement.classList.add('flex');
    }

    // Function to close the modal
    function closeModal() {
        modalElement.classList.add('hidden');
        modalElement.classList.remove('flex');
    }

    // Add event listener to the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Add event listener to the modal overlay (optional: close when clicking outside the content)
    if (modalElement) {
        modalElement.addEventListener('click', function (event) {
            if (event.target === modalElement) {
                closeModal();
            }
        });
    }

    // Function to load and display cards for each column
    async function loadBoard() {
        // Define columns matching the keys in board.json and map to containers/titles
        const columnConfig = {
            'todo': {
                container: document.getElementById('todo-cards'),
                title: 'المهام المطلوبة'
            },
            'inProgress': { // Key updated to match board.json
                container: document.getElementById('in-progress-cards'),
                title: 'قيد التنفيذ'
            },
            'done': {
                container: document.getElementById('done-cards'),
                title: 'مكتمل'
            }
        };

        try {
            // Fetch the entire board data from board.json
            const response = await fetch('board.json'); // Updated path
            if (!response.ok) throw new Error('Failed to load /board.json');
            const boardData = await response.json();

            // Process each column defined in columnConfig
            for (const [statusKey, { container, title }] of Object.entries(columnConfig)) {
                // Clear existing content
                container.innerHTML = '';

                // Get the issues for the current status from boardData
                const issues = boardData[statusKey] || [];

                if (issues.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-gray-500 py-4">
                            لا توجد ${title} حالياً
                        </div>
                    `;
                } else {
                    // Create and append cards for each issue
                    issues.forEach(issue => {
                        // Pass the whole issue object to createCard
                        const card = createCard(issue, statusKey);
                        container.appendChild(card);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading board data:', error);
            // Optionally display an error message in the UI
            Object.values(columnConfig).forEach(({ container }) => {
                container.innerHTML = `<div class="text-center text-red-500 py-4">Failed to load board data.</div>`;
            });
        }
    }

    // Load the board when the page loads
    loadBoard();
}); 