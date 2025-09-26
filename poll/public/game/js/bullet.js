class Bullet {
    constructor(x, y, angle, speed, ownerId, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed || 12;
        this.ownerId = ownerId;
        this.color = color || '#FFD700';
        
        // Calculate velocity components
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        // Bullet properties
        this.width = 4;
        this.height = 2;
        this.damage = 10;
        this.maxDistance = 600; // Maximum travel distance
        this.distanceTraveled = 0;
        this.active = true;
        
        // Visual properties
        this.trail = [];
        this.maxTrailLength = 8;
        
        // Network properties
        this.id = this.generateId();
        this.timestamp = Date.now();
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    update(stage) {
        if (!this.active) return;
        
        // Store previous position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Track distance traveled
        this.distanceTraveled += this.speed;
        
        // Check if bullet has traveled too far
        if (this.distanceTraveled > this.maxDistance) {
            this.active = false;
            return;
        }
        
        // Check collision with stage
        if (this.checkStageCollision(stage)) {
            this.active = false;
            return;
        }
        
        // Check bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.active = false;
        }
    }
    
    checkStageCollision(stage) {
        if (!stage || !stage.tiles) return false;
        
        const tileSize = stage.tileSize || 32;
        const col = Math.floor(this.x / tileSize);
        const row = Math.floor(this.y / tileSize);
        
        if (row >= 0 && row < stage.tiles.length && 
            col >= 0 && col < stage.tiles[0].length) {
            return stage.tiles[row][col] === 1; // Hit solid tile
        }
        
        return false;
    }
    
    checkPlayerCollision(player) {
        if (!this.active || player.id === this.ownerId) return false;
        
        return this.x >= player.x && 
               this.x <= player.x + player.width &&
               this.y >= player.y && 
               this.y <= player.y + player.height;
    }
    
    // Get serializable data for networking
    getNetworkData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            angle: this.angle,
            ownerId: this.ownerId,
            color: this.color,
            active: this.active,
            timestamp: this.timestamp
        };
    }
    
    // Create from network data
    static fromNetworkData(data) {
        const bullet = new Bullet(data.x, data.y, data.angle, null, data.ownerId, data.color);
        bullet.id = data.id;
        bullet.vx = data.vx;
        bullet.vy = data.vy;
        bullet.active = data.active;
        bullet.timestamp = data.timestamp;
        return bullet;
    }
} 