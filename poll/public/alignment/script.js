class PoliticalCompassGenerator {
  constructor() {
    this.canvas = document.getElementById('compassCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dots = [];
    this.selectedDot = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    // Default colors for compass quadrants
    this.colors = {
      topLeft: '#4CAF50',
      topRight: '#2196F3',
      bottomLeft: '#FF9800',
      bottomRight: '#9C27B0'
    };

    // Default axis labels
    this.axes = {
      left: 'اقتصادي',
      right: 'ليبرالي',
      top: 'محافظ',
      bottom: 'تقدمي'
    };

    this.init();
    this.loadFromStorage();
  }

  init() {
    this.setupEventListeners();
    this.drawCompass();
    this.updateDotsList();
  }

  setupEventListeners() {
    // Canvas events for dot placement and interaction
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

    // Axis input events
    document.getElementById('leftAxis').addEventListener('input', () => this.updateAxis('left'));
    document.getElementById('rightAxis').addEventListener('input', () => this.updateAxis('right'));
    document.getElementById('topAxis').addEventListener('input', () => this.updateAxis('top'));
    document.getElementById('bottomAxis').addEventListener('input', () => this.updateAxis('bottom'));

    // Color input events
    document.getElementById('colorTopLeft').addEventListener('input', () => this.updateColor('topLeft'));
    document.getElementById('colorTopRight').addEventListener('input', () => this.updateColor('topRight'));
    document.getElementById('colorBottomLeft').addEventListener('input', () => this.updateColor('bottomLeft'));
    document.getElementById('colorBottomRight').addEventListener('input', () => this.updateColor('bottomRight'));

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => this.exportCompass());

    // Export format selection
    document.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', () => this.selectExportFormat(option.dataset.format));
    });

    // Dots list delegation for edit/delete buttons
    document.getElementById('dotsList').addEventListener('click', (e) => {
      if (e.target.classList.contains('dot-btn')) {
        const action = e.target.dataset.action;
        const index = parseInt(e.target.dataset.index);
        this.handleDotAction(action, index);
      }
    });
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  handleCanvasClick(e) {
    if (this.isDragging) return;

    const coords = this.getCanvasCoordinates(e);

    // Check if clicking on existing dot
    const clickedDot = this.dots.find(dot => {
      const distance = Math.sqrt((dot.x - coords.x) ** 2 + (dot.y - coords.y) ** 2);
      return distance <= 10; // Dot radius
    });

    if (clickedDot) {
      this.selectedDot = clickedDot;
      this.showDotEditor(clickedDot);
    } else {
      // Add new dot
      this.addDot(coords.x, coords.y);
    }
  }

  handleMouseDown(e) {
    const coords = this.getCanvasCoordinates(e);

    // Find dot under cursor
    this.selectedDot = this.dots.find(dot => {
      const distance = Math.sqrt((dot.x - coords.x) ** 2 + (dot.y - coords.y) ** 2);
      return distance <= 10;
    });

    if (this.selectedDot) {
      this.isDragging = true;
      this.dragOffset.x = coords.x - this.selectedDot.x;
      this.dragOffset.y = coords.y - this.selectedDot.y;
    }
  }

  handleMouseMove(e) {
    if (this.isDragging && this.selectedDot) {
      const coords = this.getCanvasCoordinates(e);
      this.selectedDot.x = coords.x - this.dragOffset.x;
      this.selectedDot.y = coords.y - this.dragOffset.y;
      this.drawCompass();
    }
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.saveToStorage();
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.handleMouseDown(mouseEvent);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    this.handleMouseMove(mouseEvent);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.handleMouseUp();
  }

  drawCompass() {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const quadrantSize = Math.min(centerX, centerY);

    this.ctx.clearRect(0, 0, width, height);

    // Draw quadrants
    this.ctx.fillStyle = this.colors.topLeft;
    this.ctx.fillRect(0, 0, centerX, centerY);

    this.ctx.fillStyle = this.colors.topRight;
    this.ctx.fillRect(centerX, 0, centerX, centerY);

    this.ctx.fillStyle = this.colors.bottomLeft;
    this.ctx.fillRect(0, centerY, centerX, centerY);

    this.ctx.fillStyle = this.colors.bottomRight;
    this.ctx.fillRect(centerX, centerY, centerX, centerY);

    // Draw grid lines
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);

    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, height);
    this.ctx.stroke();

    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(width, centerY);
    this.ctx.stroke();

    // Draw axes labels
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px "IBM Plex Sans Arabic", Arial, sans-serif';
    this.ctx.textAlign = 'center';

    // Left axis
    this.ctx.fillText(this.axes.left, centerX - quadrantSize / 2, centerY - 10);

    // Right axis
    this.ctx.fillText(this.axes.right, centerX + quadrantSize / 2, centerY - 10);

    // Top axis
    this.ctx.save();
    this.ctx.translate(centerX + 10, centerY - quadrantSize / 2);
    this.ctx.rotate(Math.PI / 2);
    this.ctx.fillText(this.axes.top, 0, 0);
    this.ctx.restore();

    // Bottom axis
    this.ctx.save();
    this.ctx.translate(centerX + 10, centerY + quadrantSize / 2);
    this.ctx.rotate(Math.PI / 2);
    this.ctx.fillText(this.axes.bottom, 0, 0);
    this.ctx.restore();

    // Draw dots
    this.dots.forEach((dot, index) => {
      this.ctx.fillStyle = dot.color;
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, 10, 0, 2 * Math.PI);
      this.ctx.fill();

      // Draw dot border
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw dot label if provided
      if (dot.name) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px "IBM Plex Sans Arabic", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(dot.name, dot.x, dot.y - 20);
      }
    });
  }

  addDot(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#orange', '#purple'];
    const color = colors[this.dots.length % colors.length];

    const dot = {
      x,
      y,
      color,
      name: `نقطة ${this.dots.length + 1}`,
      id: Date.now() + Math.random()
    };

    this.dots.push(dot);
    this.saveToStorage();
    this.drawCompass();
    this.updateDotsList();
    this.showDotEditor(dot);
  }

  showDotEditor(dot) {
    // Simple prompt for editing dot name
    const newName = prompt('أدخل اسم النقطة:', dot.name);
    if (newName !== null) {
      dot.name = newName;
      this.saveToStorage();
      this.drawCompass();
      this.updateDotsList();
    }
  }

  updateDotsList() {
    const dotsList = document.getElementById('dotsList');

    if (this.dots.length === 0) {
      dotsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">لا توجد نقاط مضافة. انقر على البوصلة لإضافة نقطة.</p>';
      return;
    }

    dotsList.innerHTML = this.dots.map((dot, index) => `
      <div class="dot-item">
        <div class="dot-color" style="background-color: ${dot.color}"></div>
        <input type="text" class="dot-input" value="${dot.name}" data-index="${index}">
        <div class="dot-actions">
          <button class="dot-btn" data-action="edit" data-index="${index}" title="تعديل">
            <i class="fas fa-edit"></i>
          </button>
          <button class="dot-btn" data-action="delete" data-index="${index}" title="حذف">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for dot name inputs
    dotsList.querySelectorAll('.dot-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.dots[index].name = e.target.value;
        this.saveToStorage();
        this.drawCompass();
      });
    });
  }

  handleDotAction(action, index) {
    if (action === 'edit') {
      this.showDotEditor(this.dots[index]);
    } else if (action === 'delete') {
      if (confirm('هل أنت متأكد من حذف هذه النقطة؟')) {
        this.dots.splice(index, 1);
        this.saveToStorage();
        this.drawCompass();
        this.updateDotsList();
      }
    }
  }

  updateAxis(axis) {
    const element = document.getElementById(`${axis}Axis`);
    if (element) {
      this.axes[axis] = element.value;
      this.saveToStorage();
      this.drawCompass();
    }
  }

  updateColor(quadrant) {
    const element = document.getElementById(`color${quadrant.charAt(0).toUpperCase() + quadrant.slice(1)}`);
    if (element) {
      this.colors[quadrant] = element.value;
      this.saveToStorage();
      this.drawCompass();
    }
  }

  selectExportFormat(format) {
    document.querySelectorAll('.export-option').forEach(option => {
      option.classList.remove('active');
    });
    document.querySelector(`[data-format="${format}"]`).classList.add('active');
  }

  exportCompass() {
    const format = document.querySelector('.export-option.active')?.dataset.format || 'png';

    switch (format) {
      case 'png':
        this.exportAsPNG();
        break;
      case 'jpg':
        this.exportAsJPG();
        break;
      case 'svg':
        this.exportAsSVG();
        break;
    }
  }

  exportAsPNG() {
    const link = document.createElement('a');
    link.download = 'political-compass.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  exportAsJPG() {
    const link = document.createElement('a');
    link.download = 'political-compass.jpg';
    link.href = this.canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  }

  exportAsSVG() {
    // Create SVG representation
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Add quadrants
    svg += `<rect x="0" y="0" width="${centerX}" height="${centerY}" fill="${this.colors.topLeft}"/>`;
    svg += `<rect x="${centerX}" y="0" width="${centerX}" height="${centerY}" fill="${this.colors.topRight}"/>`;
    svg += `<rect x="0" y="${centerY}" width="${centerX}" height="${centerY}" fill="${this.colors.bottomLeft}"/>`;
    svg += `<rect x="${centerX}" y="${centerY}" width="${centerX}" height="${centerY}" fill="${this.colors.bottomRight}"/>`;

    // Add grid lines
    svg += `<line x1="${centerX}" y1="0" x2="${centerX}" y2="${height}" stroke="#ffffff" stroke-width="2"/>`;
    svg += `<line x1="0" y1="${centerY}" x2="${width}" y2="${centerY}" stroke="#ffffff" stroke-width="2"/>`;

    // Add axes labels
    svg += `<text x="${centerX - 100}" y="${centerY - 10}" fill="#ffffff" font-family="IBM Plex Sans Arabic, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${this.axes.left}</text>`;
    svg += `<text x="${centerX + 100}" y="${centerY - 10}" fill="#ffffff" font-family="IBM Plex Sans Arabic, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${this.axes.right}</text>`;
    svg += `<text x="${centerX + 10}" y="${centerY - 100}" fill="#ffffff" font-family="IBM Plex Sans Arabic, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" transform="rotate(90 ${centerX + 10} ${centerY - 100})">${this.axes.top}</text>`;
    svg += `<text x="${centerX + 10}" y="${centerY + 100}" fill="#ffffff" font-family="IBM Plex Sans Arabic, Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" transform="rotate(90 ${centerX + 10} ${centerY + 100})">${this.axes.bottom}</text>`;

    // Add dots
    this.dots.forEach(dot => {
      svg += `<circle cx="${dot.x}" cy="${dot.y}" r="10" fill="${dot.color}" stroke="#ffffff" stroke-width="2"/>`;
      if (dot.name) {
        svg += `<text x="${dot.x}" y="${dot.y - 20}" fill="#ffffff" font-family="IBM Plex Sans Arabic, Arial, sans-serif" font-size="12" text-anchor="middle">${dot.name}</text>`;
      }
    });

    svg += '</svg>';

    // Download SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'political-compass.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  saveToStorage() {
    const data = {
      dots: this.dots,
      colors: this.colors,
      axes: this.axes
    };
    localStorage.setItem('politicalCompass', JSON.stringify(data));
  }

  loadFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem('politicalCompass'));
      if (data) {
        if (data.dots) this.dots = data.dots;
        if (data.colors) this.colors = data.colors;
        if (data.axes) this.axes = data.axes;

        // Update UI elements
        document.getElementById('leftAxis').value = this.axes.left;
        document.getElementById('rightAxis').value = this.axes.right;
        document.getElementById('topAxis').value = this.axes.top;
        document.getElementById('bottomAxis').value = this.axes.bottom;

        document.getElementById('colorTopLeft').value = this.colors.topLeft;
        document.getElementById('colorTopRight').value = this.colors.topRight;
        document.getElementById('colorBottomLeft').value = this.colors.bottomLeft;
        document.getElementById('colorBottomRight').value = this.colors.bottomRight;
      }
    } catch (e) {
      console.error('Error loading from storage:', e);
    }
  }
}

// Initialize the compass generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PoliticalCompassGenerator();
});
