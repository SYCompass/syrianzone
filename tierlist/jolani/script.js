document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.item');
    const dropzones = document.querySelectorAll('.dropzone');
    const saveButton = document.getElementById('save-button');
    const tiersContainer = document.getElementById('tiers-container'); // The original visible container
    const tierListApp = document.querySelector('.tier-list-app'); // Get the main app container

    let draggedItem = null; // For Desktop Drag and Drop
    let selectedItemForMobile = null; // For Mobile Click/Tap interaction

    // --- Helper Function to Clear Mobile Selection ---
    function clearMobileSelection() {
        if (selectedItemForMobile) {
            selectedItemForMobile.classList.remove('item-selected');
            selectedItemForMobile = null;
            console.log("Mobile selection cleared");
        }
    }

    // --- Mobile Click/Tap Logic ---

    // Add click listener to each item for selection
    items.forEach(item => {
        item.addEventListener('click', (event) => {
            if (item.classList.contains('dragging')) {
                return;
            }
            console.log(`Item clicked: ${item.dataset.id}`);
            if (selectedItemForMobile === item) {
                clearMobileSelection();
            } else {
                clearMobileSelection();
                selectedItemForMobile = item;
                item.classList.add('item-selected');
                console.log(`Item selected for mobile: ${item.dataset.id}`);
            }
            event.stopPropagation();
        });
    });

    // Add click listener to each dropzone for placing the selected item
    dropzones.forEach(zone => {
        zone.addEventListener('click', (event) => {
            if (selectedItemForMobile && !event.target.closest('.item')) {
                console.log(`Dropzone clicked: ${zone.id || 'item-bank'} for item ${selectedItemForMobile.dataset.id}`);
                zone.appendChild(selectedItemForMobile);
                clearMobileSelection();
            } else if (selectedItemForMobile && event.target.closest('.item')) {
                 console.log("Clicked on an item within the dropzone, handling via item click listener.");
            } else {
                console.log(`Dropzone clicked (${zone.id || 'item-bank'}), but no item selected.`);
            }
        });
    });


    // --- Desktop Drag and Drop Logic ---

    items.forEach(item => {
        item.addEventListener('dragstart', (event) => {
            clearMobileSelection();
            draggedItem = item;
            setTimeout(() => { item.classList.add('dragging'); }, 0);
            event.dataTransfer.setData('text/plain', item.dataset.id);
            event.dataTransfer.effectAllowed = 'move';
            console.log(`Drag Start: ${item.dataset.id}`);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                if (draggedItem) {
                    draggedItem.classList.remove('dragging');
                }
                draggedItem = null;
                console.log("Drag End");
                dropzones.forEach(zone => zone.classList.remove('drag-over'));
            }, 0);
        });
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
             if (draggedItem && zone !== draggedItem.parentNode) {
                 zone.classList.add('drag-over');
             }
            event.dataTransfer.dropEffect = 'move';
        });

        zone.addEventListener('dragenter', (event) => {
            event.preventDefault();
            if (draggedItem && zone !== draggedItem.parentNode) {
                 zone.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (event) => {
            if (event.target === zone || !zone.contains(event.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', (event) => {
            event.preventDefault();
            zone.classList.remove('drag-over');
            if (draggedItem) {
                if (draggedItem.parentNode !== zone) {
                    console.log(`Dropped (D&D): ${draggedItem.dataset.id} into ${zone.id || 'item-bank'}`);
                    zone.appendChild(draggedItem);
                } else {
                     console.log(`Dropped (D&D) back into same zone: ${zone.id || 'item-bank'}`);
                }
                 if (draggedItem) { // Ensure draggedItem still exists before removing class
                    draggedItem.classList.remove('dragging');
                 }
                 clearMobileSelection();
            } else {
                console.log("Drop event fired but no active dragged item.");
            }
        });
    });

    // --- Save as Image Logic (Modified to force width) ---

    saveButton.addEventListener('click', () => {
        console.log("Save button clicked - preparing forced width capture");
        // Clear any active selections visually
        clearMobileSelection();

        // Get the max-width from the CSS (or set a default)
        const maxWidthStyle = window.getComputedStyle(tierListApp).maxWidth;
        const targetWidth = maxWidthStyle && maxWidthStyle !== 'none' ? maxWidthStyle : '1000px'; // Default to 1000px if max-width isn't set
        console.log(`Target capture width: ${targetWidth}`);

        // 1. Clone the node
        const cloneContainer = tiersContainer.cloneNode(true);

        // 2. Style the clone for off-screen rendering at target width
        cloneContainer.style.position = 'absolute';
        cloneContainer.style.left = '-9999px'; // Position off-screen
        cloneContainer.style.top = '0px';
        cloneContainer.style.width = targetWidth; // Force the width
        cloneContainer.style.height = 'auto'; // Let height adjust
        cloneContainer.style.display = 'block'; // Ensure it's a block element
        cloneContainer.style.backgroundColor = '#ffffff'; // Ensure background for capture
        cloneContainer.style.padding = window.getComputedStyle(tiersContainer).padding; // Copy padding
        cloneContainer.style.boxShadow = 'none'; // Remove shadow for capture

        // Remove dashed borders from dropzones *within the clone*
        cloneContainer.querySelectorAll('.dropzone').forEach(zone => {
            zone.style.border = '1px solid #eee'; // Use a faint solid border instead of dashed for capture
            zone.style.backgroundColor = '#fdfdfd'; // Slightly off-white background for zones in capture
        });
         // Ensure items within the clone are styled correctly if needed (usually inherited)
         // Ensure each item has a fixed height and inner padding for reliable rendering
cloneContainer.querySelectorAll('.item').forEach(item => {
    item.style.width = '100px';
    item.style.height = '160px';
    item.style.padding = '5px';
    item.style.boxSizing = 'border-box';
    item.style.border = '1px solid #ddd';
    item.style.borderRadius = '4px';
    item.style.backgroundColor = '#ffffff';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.justifyContent = 'normal';
    item.style.alignItems = 'center';
    item.style.overflow = 'hidden';
  
    const img = item.querySelector('img');
    if (img) {
      img.style.width = '95px';
      img.style.height = '95px';
      img.style.objectFit = 'cover';
      img.style.marginBottom = '5px';
      img.style.userSelect = 'none';
      img.style.pointerEvents = 'none';
    }
  
    const p = item.querySelector('p');
    if (p) {
      p.style.fontSize = '0.75rem'; // Tailwind's text-xs
      p.style.lineHeight = '1.2';
      p.style.margin = '0';
      p.style.textAlign = 'center';
      p.style.overflow = 'visible';
      p.style.textOverflow = 'ellipsis';
      p.style.whiteSpace = 'normal';
      p.style.wordBreak = 'break-word';
      p.style.maxHeight = '4em'; // Make room for 2 lines
    }
  });
  
        // 3. Append the clone to the body
        document.body.appendChild(cloneContainer);
        console.log("Off-screen clone created and styled.");

        // 4. Capture the clone
        document.fonts.ready.then(() => {html2canvas(cloneContainer, {
            backgroundColor: "#ffffff",
            logging: true,
            useCORS: true,
            width: parseInt(targetWidth),
            windowWidth: parseInt(targetWidth),
            scrollX: 0,
            scrollY: 0,
            allowTaint: false,
            scale: 2, // Increase resolution
            imageTimeout: 2000 // Add delay for image rendering
          }).then(canvas => {
            console.log("Canvas generated from clone");

            // Create a link element
            const link = document.createElement('a');
            link.download = 'tier-list.png';
            link.href = canvas.toDataURL('image/png');

            // Trigger the download
            link.click();
            console.log("Download triggered");

        }).catch(error => {
             console.error('Error generating canvas:', error);
             alert('Sorry, something went wrong while saving the image.');
        }).finally(() => {
            // 5. IMPORTANT: Remove the clone from the DOM regardless of success/failure
            if (document.body.contains(cloneContainer)) {
                document.body.removeChild(cloneContainer);
                console.log("Off-screen clone removed.");
            }
        });
    });
});
    // --- Initial Setup ---
    items.forEach(item => item.classList.remove('item-selected', 'dragging'));
    console.log("Tier list app initialized.");
});
