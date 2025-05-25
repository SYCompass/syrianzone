class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas);
        this.stage = new Stage();
        this.networkManager = new NetworkManager();
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Fixed timestep
        this.targetFPS = 60;
        this.fixedTimeStep = 1000 / this.targetFPS;
        this.accumulator = 0;
        
        // Game state
        this.gameState = {
            connectionStatus: 'Disconnected',
            playerCount: 0,
            fps: 0
        };
        
        // Bullets management
        this.bullets = [];
        this.lastMouseInput = null;
        
        this.setupEventListeners();
        this.setupNetworkCallbacks();
        this.init();
    }
    
    async init() {
        console.log('Initializing game...');
        
        // Load default stage
        await this.stage.createDefaultStage();
        
        // Update UI
        this.updateUI();
        
        console.log('Game initialized');
    }
    
    setupEventListeners() {
        // Connection buttons
        document.getElementById('createRoom').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('joinRoom').addEventListener('click', () => {
            this.joinRoom();
        });
        
        document.getElementById('connectBtn').addEventListener('click', () => {
            if (this.gameState.connectionStatus === 'Disconnected') {
                this.createRoom();
            } else {
                this.disconnect();
            }
        });
        
        // Handle window focus/blur
        window.addEventListener('blur', () => {
            this.inputHandler.reset();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupNetworkCallbacks() {
        this.networkManager.setCallbacks({
            onPlayerJoin: (player) => {
                console.log('Player joined:', player.name);
                this.updatePlayersList();
            },
            
            onPlayerLeave: (player) => {
                console.log('Player left:', player.name);
                this.updatePlayersList();
            },
            
            onPlayerUpdate: (player) => {
                // Player data is automatically updated in the network manager
            },
            
            onBulletReceived: (bulletData) => {
                // Create bullet from network data
                const bullet = Bullet.fromNetworkData(bulletData);
                this.bullets.push(bullet);
            },
            
            onConnectionStatusChange: (status, roomId) => {
                this.gameState.connectionStatus = status;
                if (roomId) {
                    document.getElementById('roomId').value = roomId;
                }
                this.updateUI();
            }
        });
    }
    
    async createRoom() {
        const playerName = prompt('Enter your name:') || 'Player';
        
        try {
            const roomId = await this.networkManager.createRoom(playerName);
            console.log('Room created:', roomId);
            
            // Start the game
            this.start();
            
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room. Please try again.');
        }
    }
    
    async joinRoom() {
        const roomId = document.getElementById('roomId').value.trim();
        const playerName = prompt('Enter your name:') || 'Player';
        
        if (!roomId) {
            alert('Please enter a room ID');
            return;
        }
        
        try {
            await this.networkManager.joinRoom(roomId, playerName);
            console.log('Joining room:', roomId);
            
            // Start the game
            this.start();
            
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. Please check the room ID and try again.');
        }
    }
    
    disconnect() {
        this.networkManager.disconnect();
        this.stop();
        this.updateUI();
        this.updatePlayersList();
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Fixed timestep update
        this.accumulator += this.deltaTime;
        
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Render
        this.render();
        
        // Update FPS
        this.updateFPS();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Get input
        const movementInput = this.inputHandler.getMovementInput();
        const mouseInput = this.inputHandler.getMouseInput();
        
        // Combine inputs
        const input = {
            ...movementInput,
            mouse: mouseInput
        };
        
        // Update local player
        const localPlayer = this.networkManager.getLocalPlayer();
        if (localPlayer) {
            localPlayer.update(input, this.stage.currentStage);
            
            // Handle shooting
            if (mouseInput.leftButton && !this.lastMouseInput?.leftButton) {
                const bulletData = localPlayer.shoot();
                if (bulletData) {
                    const bullet = new Bullet(
                        bulletData.x,
                        bulletData.y,
                        bulletData.angle,
                        null,
                        bulletData.ownerId,
                        bulletData.color
                    );
                    this.bullets.push(bullet);
                    
                    // Broadcast bullet to other players
                    this.networkManager.broadcastBullet(bullet.getNetworkData());
                }
            }
            
            // Broadcast player update to other players
            this.networkManager.broadcastPlayerUpdate();
        }
        
        // Update bullets
        this.updateBullets();
        
        // Update remote players (they update from network data)
        const remotePlayers = this.networkManager.getRemotePlayers();
        remotePlayers.forEach(player => {
            // Remote players don't need input, they update from network data
            // But we still need to apply physics for smooth interpolation
            player.update(null, this.stage.currentStage);
        });
        
        // Store last mouse input for edge detection
        this.lastMouseInput = { ...mouseInput };
        
        // Update game state
        this.gameState.playerCount = this.networkManager.getAllPlayers().length;
    }
    
    updateBullets() {
        // Update all bullets
        this.bullets.forEach(bullet => {
            bullet.update(this.stage.currentStage);
            
            // Check collision with players
            const allPlayers = this.networkManager.getAllPlayers();
            allPlayers.forEach(player => {
                if (bullet.checkPlayerCollision(player)) {
                    const isDead = player.takeDamage(bullet.damage);
                    bullet.active = false;
                    
                    if (isDead) {
                        // Respawn player
                        player.respawn(this.stage.currentStage);
                    }
                }
            });
        });
        
        // Remove inactive bullets
        this.bullets = this.bullets.filter(bullet => bullet.active);
    }
    
    render() {
        // Clear canvas
        this.renderer.clear();
        
        // Update camera (static)
        this.renderer.updateCamera();
        
        // Draw stage
        this.renderer.drawStage(this.stage.currentStage);
        
        // Draw all players
        const allPlayers = this.networkManager.getAllPlayers();
        allPlayers.forEach(player => {
            this.renderer.drawPlayer(player);
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.renderer.drawBullet(bullet);
        });
        
        // Draw UI
        this.renderer.drawUI(this.gameState);
    }
    
    updateFPS() {
        this.frameCount++;
        
        if (this.lastTime - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (this.lastTime - this.lastFpsUpdate));
            this.gameState.fps = this.fps;
            this.frameCount = 0;
            this.lastFpsUpdate = this.lastTime;
        }
    }
    
    updateUI() {
        // Update connection status
        const statusElement = document.getElementById('status');
        const connectBtn = document.getElementById('connectBtn');
        
        statusElement.textContent = this.gameState.connectionStatus;
        
        if (this.gameState.connectionStatus === 'Disconnected') {
            connectBtn.textContent = 'Connect';
            connectBtn.disabled = false;
        } else if (this.gameState.connectionStatus.includes('Connected') || 
                   this.gameState.connectionStatus.includes('Room Created')) {
            connectBtn.textContent = 'Disconnect';
            connectBtn.disabled = false;
        } else {
            connectBtn.textContent = 'Connecting...';
            connectBtn.disabled = true;
        }
    }
    
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        const allPlayers = this.networkManager.getAllPlayers();
        allPlayers.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            li.style.color = player.color;
            playersList.appendChild(li);
        });
    }
    
    handleResize() {
        // Keep canvas size fixed for consistent gameplay
        // In a more advanced version, you might want to scale the canvas
        console.log('Window resized');
    }
    
    // Public methods for external control
    getGameState() {
        return {
            ...this.gameState,
            players: this.networkManager.getAllPlayers(),
            stage: this.stage.currentStage
        };
    }
    
    setStage(stageData) {
        this.stage.setStageData(stageData);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    console.log('Game instance created and attached to window.game');
}); 