class Stage {
    constructor() {
        this.currentStage = null;
        this.tileSize = 32;
        this.width = 25;
        this.height = 19;
    }
    
    async loadStage(stageName) {
        try {
            const response = await fetch(`stages/${stageName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load stage: ${stageName}`);
            }
            
            const stageData = await response.json();
            this.currentStage = this.validateStage(stageData);
            return this.currentStage;
        } catch (error) {
            console.warn(`Could not load stage ${stageName}, using default:`, error);
            return this.createDefaultStage();
        }
    }
    
    validateStage(stageData) {
        // Ensure required properties exist
        const stage = {
            width: stageData.width || 25,
            height: stageData.height || 19,
            tileSize: stageData.tileSize || 32,
            spawn: stageData.spawn || [2, 16],
            tiles: stageData.tiles || []
        };
        
        // Validate tiles array
        if (!Array.isArray(stage.tiles) || stage.tiles.length === 0) {
            console.warn('Invalid tiles array, creating default');
            stage.tiles = this.createDefaultTiles(stage.width, stage.height);
        }
        
        // Ensure all rows have correct length
        for (let i = 0; i < stage.tiles.length; i++) {
            if (!Array.isArray(stage.tiles[i]) || stage.tiles[i].length !== stage.width) {
                stage.tiles[i] = new Array(stage.width).fill(0);
            }
        }
        
        // Ensure correct number of rows
        while (stage.tiles.length < stage.height) {
            stage.tiles.push(new Array(stage.width).fill(0));
        }
        
        return stage;
    }
    
    createDefaultStage() {
        const stage = {
            width: 25,
            height: 19,
            tileSize: 32,
            spawn: [2, 16],
            tiles: this.createDefaultTiles(25, 19)
        };
        
        this.currentStage = stage;
        return stage;
    }
    
    createDefaultTiles(width, height) {
        const tiles = [];
        
        // Create empty stage
        for (let row = 0; row < height; row++) {
            tiles[row] = new Array(width).fill(0);
        }
        
        // Add ground
        for (let col = 0; col < width; col++) {
            tiles[height - 1][col] = 1; // Bottom row
        }
        
        // Add some platforms
        for (let col = 5; col < 10; col++) {
            tiles[height - 5][col] = 1; // Platform 1
        }
        
        for (let col = 15; col < 20; col++) {
            tiles[height - 8][col] = 1; // Platform 2
        }
        
        for (let col = 8; col < 13; col++) {
            tiles[height - 11][col] = 1; // Platform 3
        }
        
        // Add walls
        for (let row = 0; row < height; row++) {
            tiles[row][0] = 1; // Left wall
            tiles[row][width - 1] = 1; // Right wall
        }
        
        // Add spawn point marker (optional visual)
        tiles[16][2] = 2; // Spawn point
        
        return tiles;
    }
    
    getTileAt(x, y) {
        if (!this.currentStage) return 0;
        
        const col = Math.floor(x / this.currentStage.tileSize);
        const row = Math.floor(y / this.currentStage.tileSize);
        
        if (row < 0 || row >= this.currentStage.tiles.length ||
            col < 0 || col >= this.currentStage.tiles[0].length) {
            return 0; // Empty space outside bounds
        }
        
        return this.currentStage.tiles[row][col];
    }
    
    isSolidTile(tileType) {
        return tileType === 1; // Only type 1 is solid
    }
    
    isSpawnPoint(tileType) {
        return tileType === 2;
    }
    
    getSpawnPosition() {
        if (!this.currentStage || !this.currentStage.spawn) {
            return { x: 100, y: 100 };
        }
        
        return {
            x: this.currentStage.spawn[0] * this.currentStage.tileSize,
            y: this.currentStage.spawn[1] * this.currentStage.tileSize
        };
    }
    
    getRandomSpawnPosition() {
        // Find all spawn points in the stage
        const spawnPoints = [];
        
        if (this.currentStage && this.currentStage.tiles) {
            for (let row = 0; row < this.currentStage.tiles.length; row++) {
                for (let col = 0; col < this.currentStage.tiles[row].length; col++) {
                    if (this.currentStage.tiles[row][col] === 2) {
                        spawnPoints.push({
                            x: col * this.currentStage.tileSize,
                            y: row * this.currentStage.tileSize
                        });
                    }
                }
            }
        }
        
        // If no spawn points found, use default
        if (spawnPoints.length === 0) {
            return this.getSpawnPosition();
        }
        
        // Return random spawn point
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
    
    getStageBounds() {
        if (!this.currentStage) {
            return { width: 800, height: 608 };
        }
        
        return {
            width: this.currentStage.width * this.currentStage.tileSize,
            height: this.currentStage.height * this.currentStage.tileSize
        };
    }
    
    // Check if position is within stage bounds
    isInBounds(x, y) {
        const bounds = this.getStageBounds();
        return x >= 0 && x < bounds.width && y >= 0 && y < bounds.height;
    }
    
    // Get stage data for networking
    getStageData() {
        return this.currentStage;
    }
    
    // Set stage from network data
    setStageData(stageData) {
        this.currentStage = this.validateStage(stageData);
    }
} 