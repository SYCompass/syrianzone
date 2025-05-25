class Player {
    constructor(x, y, name, color) {
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        
        // Velocity
        this.vx = 0;
        this.vy = 0;
        
        // Physics constants
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.moveSpeed = 6; // Slightly faster movement
        this.friction = 0.85; // Less friction for more responsive movement
        this.maxFallSpeed = 15;
        
        // State
        this.onGround = false;
        this.canJump = true;
        this.jumpCooldown = 0;
        
        // Double jump system
        this.jumpCount = 0;
        this.maxJumps = 2; // Ground jump + 1 air jump
        this.doubleJumpPower = -12; // Slightly weaker than ground jump
        
        // Wall sliding system
        this.onWall = false;
        this.wallDirection = 0; // -1 for left wall, 1 for right wall
        this.wallSlideSpeed = 2; // Speed when sliding down wall
        this.wallJumpPower = -14; // Wall jump strength
        this.wallJumpHorizontal = 8; // Horizontal push from wall jump
        
        // Visual properties
        this.name = name || 'Player';
        this.color = color || this.generateRandomColor();
        
        // Network properties
        this.id = this.generateId();
        this.lastUpdate = Date.now();
        
        // Visual effects
        this.particles = [];
        this.lastDoubleJump = 0;
        
        // Shooting system
        this.gun = {
            angle: 0,
            lastShot: 0,
            fireRate: 200, // milliseconds between shots
            muzzleFlash: 0
        };
        this.health = 100;
        this.maxHealth = 100;
    }
    
    generateRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    update(input, stage) {
        // Handle input
        this.handleInput(input);
        
        // Apply physics
        this.applyPhysics();
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Handle collisions
        this.handleCollisions(stage);
        
        // Update cooldowns
        if (this.jumpCooldown > 0) {
            this.jumpCooldown--;
        }
        
        // Update gun effects
        if (this.gun.muzzleFlash > 0) {
            this.gun.muzzleFlash--;
        }
        
        // Keep player in bounds
        this.constrainToBounds(stage);
        
        this.lastUpdate = Date.now();
        
        // Update particles
        this.updateParticles();
    }
    
    updateGunAngle(mouse) {
        // Calculate angle from player center to mouse position
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        
        this.gun.angle = Math.atan2(
            mouse.y - playerCenterY,
            mouse.x - playerCenterX
        );
    }
    
    canShoot() {
        const now = Date.now();
        return now - this.gun.lastShot >= this.gun.fireRate;
    }
    
    shoot() {
        if (!this.canShoot()) return null;
        
        const now = Date.now();
        this.gun.lastShot = now;
        this.gun.muzzleFlash = 5; // frames
        
        // Calculate gun barrel position
        const gunLength = 20;
        const gunX = this.x + this.width / 2 + Math.cos(this.gun.angle) * gunLength;
        const gunY = this.y + this.height / 2 + Math.sin(this.gun.angle) * gunLength;
        
        // Create bullet
        return {
            x: gunX,
            y: gunY,
            angle: this.gun.angle,
            ownerId: this.id,
            color: this.color
        };
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        
        // Create damage particles
        this.createDamageParticles();
        
        return this.health <= 0; // Return true if player is dead
    }
    
    createDamageParticles() {
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                maxLife: 20,
                color: '#FF0000' // Red for damage
            });
        }
    }
    
    createDoubleJumpParticles() {
        // Create small particles around the player for double jump effect
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30, // frames
                maxLife: 30,
                color: this.color
            });
        }
        this.lastDoubleJump = Date.now();
    }
    
    createWallJumpParticles() {
        // Create particles that spray away from the wall
        const particleCount = 12;
        const wallSide = this.wallDirection > 0 ? this.x : this.x + this.width;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: wallSide + (Math.random() - 0.5) * 10,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                vx: -this.wallDirection * (2 + Math.random() * 3), // Spray away from wall
                vy: (Math.random() - 0.5) * 6,
                life: 40, // frames
                maxLife: 40,
                color: '#FFD700' // Gold color for wall jump
            });
        }
    }
    
    updateParticles() {
        // Update and remove expired particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vy += 0.1; // Gravity on particles
            return particle.life > 0;
        });
    }
    
    handleInput(input) {
        if (!input) return;
        
        // Handle mouse input for gun aiming
        if (input.mouse) {
            this.updateGunAngle(input.mouse);
        }
        
        // Horizontal movement
        const acceleration = 0.3; // Increased acceleration for more responsive movement
        if (input.left) {
            this.vx -= this.moveSpeed * acceleration;
        }
        if (input.right) {
            this.vx += this.moveSpeed * acceleration;
        }
        
        // Jumping with double jump and wall jump support
        if (input.jump && this.canJump && this.jumpCooldown <= 0) {
            if (this.onGround && this.jumpCount === 0) {
                // Ground jump
                this.vy = this.jumpPower;
                this.onGround = false;
                this.jumpCount = 1;
                this.canJump = false;
                this.jumpCooldown = 10; // Prevent rapid jumping
            } else if (this.onWall && !this.onGround) {
                // Wall jump
                this.vy = this.wallJumpPower;
                this.vx = -this.wallDirection * this.wallJumpHorizontal; // Jump away from wall
                this.onWall = false;
                this.wallDirection = 0;
                this.jumpCount = 1; // Reset to allow one more air jump
                this.canJump = false;
                this.jumpCooldown = 15; // Slightly longer cooldown for wall jumps
                this.createWallJumpParticles();
            } else if (!this.onGround && this.jumpCount < this.maxJumps) {
                // Double jump (air jump)
                this.vy = this.doubleJumpPower;
                this.jumpCount = 2;
                this.canJump = false;
                this.jumpCooldown = 10; // Prevent rapid jumping
                this.createDoubleJumpParticles();
            }
        }
        
        // Reset jump when key is released
        if (!input.jump) {
            this.canJump = true;
        }
    }
    
    applyPhysics() {
        // Apply gravity (reduced when on wall)
        if (this.onWall && this.vy > 0) {
            // Wall sliding - slower fall speed
            this.vy += this.gravity * 0.3; // Reduced gravity when sliding
            if (this.vy > this.wallSlideSpeed) {
                this.vy = this.wallSlideSpeed;
            }
        } else {
            // Normal gravity
            this.vy += this.gravity;
            
            // Limit fall speed
            if (this.vy > this.maxFallSpeed) {
                this.vy = this.maxFallSpeed;
            }
        }
        
        // Apply friction to horizontal movement
        this.vx *= this.friction;
        
        // Stop very small movements
        if (Math.abs(this.vx) < 0.1) {
            this.vx = 0;
        }
        
        // Limit horizontal speed
        const maxSpeed = this.moveSpeed;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
    }
    
    handleCollisions(stage) {
        if (!stage || !stage.tiles) return;
        
        const tileSize = stage.tileSize || 32;
        this.onGround = false;
        this.onWall = false;
        this.wallDirection = 0;
        
        // Get player bounds
        const left = Math.floor(this.x / tileSize);
        const right = Math.floor((this.x + this.width) / tileSize);
        const top = Math.floor(this.y / tileSize);
        const bottom = Math.floor((this.y + this.height) / tileSize);
        
        // Check collisions with solid tiles
        for (let row = Math.max(0, top - 1); row <= Math.min(stage.tiles.length - 1, bottom + 1); row++) {
            for (let col = Math.max(0, left - 1); col <= Math.min(stage.tiles[0].length - 1, right + 1); col++) {
                if (stage.tiles[row] && stage.tiles[row][col] === 1) { // Solid tile
                    const tileX = col * tileSize;
                    const tileY = row * tileSize;
                    
                    if (this.intersects(tileX, tileY, tileSize, tileSize)) {
                        this.resolveCollision(tileX, tileY, tileSize, tileSize, stage);
                    }
                }
            }
        }
        
        // Additional ground check for smoother movement
        this.checkGroundBelow(stage);
        
        // Reset jump count when landing on ground or grabbing wall
        if (this.onGround || this.onWall) {
            this.jumpCount = 0;
        }
    }
    
    checkGroundBelow(stage) {
        if (!stage || !stage.tiles) return;
        
        const tileSize = stage.tileSize || 32;
        const groundCheckDistance = 4; // pixels below player to check
        
        // Check tiles just below the player for ground detection
        const leftCol = Math.floor((this.x + 2) / tileSize); // Slight inset from edges
        const rightCol = Math.floor((this.x + this.width - 2) / tileSize);
        const belowRow = Math.floor((this.y + this.height + groundCheckDistance) / tileSize);
        
        // If we're close to ground and falling slowly, snap to ground
        for (let col = leftCol; col <= rightCol; col++) {
            if (belowRow >= 0 && belowRow < stage.tiles.length && 
                col >= 0 && col < stage.tiles[0].length) {
                if (stage.tiles[belowRow] && stage.tiles[belowRow][col] === 1) {
                    const tileY = belowRow * tileSize;
                    const distanceToGround = tileY - (this.y + this.height);
                    
                    // If we're very close to ground and falling slowly, snap to it
                    if (distanceToGround <= groundCheckDistance && this.vy >= 0 && this.vy <= 3) {
                        this.y = tileY - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        return;
                    }
                }
            }
        }
    }
    
    intersects(x, y, width, height) {
        // Use a slightly smaller collision box at the bottom for smoother movement
        const collisionTolerance = 2; // pixels
        return this.x < x + width &&
               this.x + this.width > x &&
               this.y < y + height &&
               this.y + this.height - collisionTolerance > y;
    }
    
    resolveCollision(tileX, tileY, tileWidth, tileHeight, stage) {
        // Calculate overlap on each axis
        const overlapX = Math.min(this.x + this.width - tileX, tileX + tileWidth - this.x);
        const overlapY = Math.min(this.y + this.height - tileY, tileY + tileHeight - this.y);
        
        // Resolve collision on the axis with smaller overlap
        if (overlapX < overlapY) {
            // Horizontal collision (wall)
            if (this.x < tileX) {
                // Hit wall from left
                this.x = tileX - this.width;
                this.vx = 0;
                
                // Check if we can grab the wall (falling, not on ground, and no ground directly below)
                if (this.vy > 0 && !this.onGround && !this.hasGroundDirectlyBelow(stage)) {
                    this.onWall = true;
                    this.wallDirection = 1; // Right wall
                }
            } else {
                // Hit wall from right
                this.x = tileX + tileWidth;
                this.vx = 0;
                
                // Check if we can grab the wall (falling, not on ground, and no ground directly below)
                if (this.vy > 0 && !this.onGround && !this.hasGroundDirectlyBelow(stage)) {
                    this.onWall = true;
                    this.wallDirection = -1; // Left wall
                }
            }
        } else {
            // Vertical collision
            if (this.y < tileY) {
                // Hit from above (landing on platform)
                const snapTolerance = 3; // Allow small adjustments for smoother landing
                if (overlapY <= snapTolerance || this.vy >= 0) {
                    this.y = tileY - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    this.jumpCount = 0; // Reset jump count when landing
                }
            } else {
                // Hit from below (hitting ceiling)
                this.y = tileY + tileHeight;
                this.vy = 0;
            }
        }
    }
    
    hasGroundDirectlyBelow(stage) {
        // Check if there's solid ground directly below the player
        if (!stage || !stage.tiles) return false;
        
        const tileSize = stage.tileSize || 32;
        
        // Check tiles directly below the player (with a small buffer)
        const leftCol = Math.floor(this.x / tileSize);
        const rightCol = Math.floor((this.x + this.width - 1) / tileSize);
        const belowRow = Math.floor((this.y + this.height + 8) / tileSize); // 8 pixel buffer below
        
        // Check if any tile directly below is solid
        for (let col = leftCol; col <= rightCol; col++) {
            if (belowRow >= 0 && belowRow < stage.tiles.length && 
                col >= 0 && col < stage.tiles[0].length) {
                if (stage.tiles[belowRow] && stage.tiles[belowRow][col] === 1) {
                    return true; // Found solid ground below
                }
            }
        }
        
        return false; // No ground directly below
    }
    
    constrainToBounds(stage) {
        if (!stage) return;
        
        const stageWidth = (stage.width || 25) * (stage.tileSize || 32);
        const stageHeight = (stage.height || 19) * (stage.tileSize || 32);
        
        // Horizontal bounds
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
        if (this.x + this.width > stageWidth) {
            this.x = stageWidth - this.width;
            this.vx = 0;
        }
        
        // Vertical bounds (respawn if falling off)
        if (this.y > stageHeight + 100) {
            this.respawn(stage);
        }
    }
    
    respawn(stage) {
        if (stage && stage.spawn) {
            this.x = stage.spawn[0] * (stage.tileSize || 32);
            this.y = stage.spawn[1] * (stage.tileSize || 32);
        } else {
            this.x = 100;
            this.y = 100;
        }
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.onWall = false;
        this.wallDirection = 0;
        this.jumpCount = 0; // Reset jump count on respawn
        this.health = this.maxHealth; // Reset health on respawn
    }
    
    // Get serializable data for networking
    getNetworkData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            name: this.name,
            color: this.color,
            onGround: this.onGround,
            onWall: this.onWall,
            wallDirection: this.wallDirection,
            jumpCount: this.jumpCount,
            gunAngle: this.gun.angle,
            health: this.health,
            muzzleFlash: this.gun.muzzleFlash,
            timestamp: Date.now()
        };
    }
    
    // Update from network data
    updateFromNetwork(data) {
        if (data.timestamp > this.lastUpdate) {
            this.x = data.x;
            this.y = data.y;
            this.vx = data.vx;
            this.vy = data.vy;
            this.onGround = data.onGround;
            this.onWall = data.onWall || false;
            this.wallDirection = data.wallDirection || 0;
            this.jumpCount = data.jumpCount || 0;
            this.gun.angle = data.gunAngle || 0;
            this.health = data.health || this.maxHealth;
            this.gun.muzzleFlash = data.muzzleFlash || 0;
            this.lastUpdate = data.timestamp;
        }
    }
} 