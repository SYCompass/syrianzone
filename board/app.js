document.addEventListener('DOMContentLoaded', function() {
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

    // Function to load markdown files from a directory
    async function loadMarkdownFiles(directory) {
        try {
            // Fetch the file map from data.json
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to load data.json');
            const filesMap = await response.json();

            // Get the list of files for the specified directory
            const fileList = filesMap[directory] || [];

            const files = await Promise.all(
                fileList.map(async (filename) => {
                    try {
                        const response = await fetch(`${directory}/${filename}`);
                        if (!response.ok) throw new Error(`Failed to load ${filename}`);
                        const content = await response.text();
                        
                        // Extract title from the first line (assuming it's a heading)
                        const title = content.split('\n')[0].replace(/^#\s*/, '');
                        
                        return {
                            id: filename.replace('.md', ''),
                            title: title,
                            content: content
                        };
                    } catch (error) {
                        console.error(`Error loading ${filename}:`, error);
                        return null;
                    }
                })
            );

            // Filter out any failed loads
            return files.filter(file => file !== null);
        } catch (error) {
            console.error('Error loading markdown files:', error);
            return [];
        }
    }

    // Function to create a card element
    function createCard(title, content, id, status) {
        const card = document.createElement('div');
        card.className = 'card bg-white p-4 rounded shadow mb-4 cursor-pointer hover:shadow-md transition';
        card.dataset.id = id;
        card.dataset.status = status;
        
        const lines = content.split('\n');
        const previewContent = lines.slice(1).join('\n').substring(0, 100);
        
        const cardContent = `
            <h4 class="font-semibold mb-2">${title}</h4>
            <p class="text-sm text-gray-600">${previewContent}${content.length > 100 ? '...' : ''}</p>
        `;
        
        card.innerHTML = cardContent;
        
        card.addEventListener('click', () => showCardDetails(title, content));
        
        return card;
    }

    // Function to show card details in modal
    function showCardDetails(title, content) {
        modalTitle.textContent = title;
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
        modalElement.addEventListener('click', function(event) {
            if (event.target === modalElement) {
                closeModal();
            }
        });
    }

    // Function to load and display cards for each column
    async function loadBoard() {
        const columns = {
            'todo': {
                container: document.getElementById('todo-cards'),
                title: 'المهام المطلوبة'
            },
            'in-progress': {
                container: document.getElementById('in-progress-cards'),
                title: 'قيد التنفيذ'
            },
            'done': {
                container: document.getElementById('done-cards'),
                title: 'مكتمل'
            }
        };

        for (const [status, { container, title }] of Object.entries(columns)) {
            const files = await loadMarkdownFiles(status);
            
            if (files.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        لا توجد ${title} حالياً
                    </div>
                `;
                continue;
            }
            
            files.forEach(file => {
                const card = createCard(file.title, file.content, file.id, status);
                container.appendChild(card);
            });
        }
    }

    // Load the board when the page loads
    loadBoard();
}); 