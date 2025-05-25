class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keyStates = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false
        };
        
        // Mouse input
        this.mouse = {
            x: 0,
            y: 0,
            leftButton: false,
            rightButton: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(event) {
        this.keys[event.code] = true;
        this.updateKeyStates();
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
        this.updateKeyStates();
    }
    
    updateKeyStates() {
        this.keyStates.left = this.keys['ArrowLeft'] || this.keys['KeyA'];
        this.keyStates.right = this.keys['ArrowRight'] || this.keys['KeyD'];
        this.keyStates.up = this.keys['ArrowUp'] || this.keys['KeyW'];
        this.keyStates.down = this.keys['ArrowDown'] || this.keys['KeyS'];
        this.keyStates.jump = this.keys['Space'];
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }
    
    handleMouseDown(event) {
        if (event.button === 0) { // Left click
            this.mouse.leftButton = true;
        } else if (event.button === 2) { // Right click
            this.mouse.rightButton = true;
        }
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        if (event.button === 0) { // Left click
            this.mouse.leftButton = false;
        } else if (event.button === 2) { // Right click
            this.mouse.rightButton = false;
        }
        event.preventDefault();
    }
    
    isKeyPressed(key) {
        return this.keyStates[key] || false;
    }
    
    getMovementInput() {
        return {
            left: this.isKeyPressed('left'),
            right: this.isKeyPressed('right'),
            up: this.isKeyPressed('up'),
            down: this.isKeyPressed('down'),
            jump: this.isKeyPressed('jump')
        };
    }
    
    getMouseInput() {
        return {
            x: this.mouse.x,
            y: this.mouse.y,
            leftButton: this.mouse.leftButton,
            rightButton: this.mouse.rightButton
        };
    }
    
    // Get input as a normalized vector
    getMovementVector() {
        const input = this.getMovementInput();
        return {
            x: (input.right ? 1 : 0) - (input.left ? 1 : 0),
            y: (input.down ? 1 : 0) - (input.up ? 1 : 0),
            jump: input.jump
        };
    }
    
    // Check if any movement key is pressed
    hasMovementInput() {
        const input = this.getMovementInput();
        return input.left || input.right || input.up || input.down || input.jump;
    }
    
    // Reset all key states (useful for focus loss)
    reset() {
        this.keys = {};
        this.keyStates = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false
        };
        this.mouse.leftButton = false;
        this.mouse.rightButton = false;
    }
} 