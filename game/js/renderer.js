class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Static camera properties
        this.camera = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
        
        // Enable image smoothing for better sprite rendering
        this.ctx.imageSmoothingEnabled = false;
    }
    
    clear() {
        // Clear with sky blue background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x - this.camera.x,
            y - this.camera.y,
            width,
            height
        );
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            x - this.camera.x,
            y - this.camera.y,
            radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawText(text, x, y, options = {}) {
        const {
            color = '#000',
            font = '16px Arial',
            align = 'left',
            baseline = 'top'
        } = options;
        
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(
            text,
            x - this.camera.x,
            y - this.camera.y
        );
    }
    
    drawPlayer(player) {
        // Draw player as a colored rectangle with name
        const screenX = player.x - this.camera.x;
        const screenY = player.y - this.camera.y;
        
        // Player body
        this.ctx.fillStyle = player.color || '#FF6B6B';
        this.ctx.fillRect(screenX, screenY, player.width, player.height);
        
        // Player outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenX, screenY, player.width, player.height);
        
        // Player eyes
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(screenX + 5, screenY + 5, 6, 6);
        this.ctx.fillRect(screenX + 15, screenY + 5, 6, 6);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 7, screenY + 7, 2, 2);
        this.ctx.fillRect(screenX + 17, screenY + 7, 2, 2);
        
        // Player name
        if (player.name) {
            this.drawText(player.name, screenX + player.width/2, screenY - 20, {
                color: '#FFF',
                font: 'bold 12px Arial',
                align: 'center'
            });
        }
        
        // Health bar
        if (player.health !== undefined) {
            const healthBarWidth = player.width;
            const healthBarHeight = 4;
            const healthPercent = player.health / (player.maxHealth || 100);
            
            // Background
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(screenX, screenY - 10, healthBarWidth, healthBarHeight);
            
            // Health
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(screenX, screenY - 10, healthBarWidth * healthPercent, healthBarHeight);
        }
        
        // Draw gun
        this.drawGun(player, screenX, screenY);
        
                // Jump indicator (show remaining jumps)
        if (player.jumpCount !== undefined) {
            const remainingJumps = (player.maxJumps || 2) - player.jumpCount;
            if (remainingJumps < 2) { // Only show when not at full jumps
                const jumpText = remainingJumps === 1 ? '↑' : '✗';
                const jumpColor = remainingJumps === 1 ? '#00FF00' : '#FF6666';
                this.drawText(jumpText, screenX + player.width + 5, screenY + 5, {
                    color: jumpColor,
                    font: 'bold 14px Arial',
                    align: 'left'
                });
            }
        }
        
        // Wall sliding indicator
        if (player.onWall) {
            const wallText = '🧗'; // Climbing emoji
            const wallSide = player.wallDirection > 0 ? screenX + player.width + 5 : screenX - 20;
            this.drawText(wallText, wallSide, screenY + player.height / 2, {
                color: '#FFD700',
                font: 'bold 16px Arial',
                align: 'left'
            });
            
            // Draw wall slide particles
            if (Math.random() < 0.3) { // 30% chance each frame
                const particleX = player.wallDirection > 0 ? player.x + player.width : player.x;
                const particleY = player.y + Math.random() * player.height;
                
                // Add a small dust particle effect
                this.ctx.save();
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillStyle = '#D2B48C'; // Tan color for dust
                this.ctx.beginPath();
                this.ctx.arc(
                    particleX - this.camera.x + (Math.random() - 0.5) * 10,
                    particleY - this.camera.y,
                    2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                this.ctx.restore();
            }
        }
         
        // Draw particles
        if (player.particles && player.particles.length > 0) {
            player.particles.forEach(particle => {
                const alpha = particle.life / particle.maxLife;
                const size = 3 * alpha;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    particle.x - this.camera.x,
                    particle.y - this.camera.y,
                    size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                this.ctx.restore();
            });
        }
    }
    
    drawGun(player, screenX, screenY) {
        if (!player.gun) return;
        
        const gunLength = 20;
        const gunWidth = 3;
        const playerCenterX = screenX + player.width / 2;
        const playerCenterY = screenY + player.height / 2;
        
        // Calculate gun end position
        const gunEndX = playerCenterX + Math.cos(player.gun.angle) * gunLength;
        const gunEndY = playerCenterY + Math.sin(player.gun.angle) * gunLength;
        
        // Draw gun barrel
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = gunWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(playerCenterX, playerCenterY);
        this.ctx.lineTo(gunEndX, gunEndY);
        this.ctx.stroke();
        
        // Draw muzzle flash
        if (player.gun.muzzleFlash > 0) {
            const flashSize = 8;
            this.ctx.save();
            this.ctx.globalAlpha = player.gun.muzzleFlash / 5;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(gunEndX, gunEndY, flashSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawBullet(bullet) {
        const screenX = bullet.x - this.camera.x;
        const screenY = bullet.y - this.camera.y;
        
        // Draw bullet trail
        if (bullet.trail && bullet.trail.length > 1) {
            this.ctx.strokeStyle = bullet.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            
            for (let i = 0; i < bullet.trail.length; i++) {
                const trailPoint = bullet.trail[i];
                const trailX = trailPoint.x - this.camera.x;
                const trailY = trailPoint.y - this.camera.y;
                
                if (i === 0) {
                    this.ctx.moveTo(trailX, trailY);
                } else {
                    this.ctx.lineTo(trailX, trailY);
                }
            }
            this.ctx.lineTo(screenX, screenY);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw bullet
        this.ctx.fillStyle = bullet.color;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bullet outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawTile(x, y, tileSize, tileType) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;
        
        switch (tileType) {
            case 1: // Solid platform
                this.ctx.fillStyle = '#8B4513'; // Brown
                this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
                
                // Add texture lines
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY + tileSize / 3);
                this.ctx.lineTo(screenX + tileSize, screenY + tileSize / 3);
                this.ctx.moveTo(screenX, screenY + 2 * tileSize / 3);
                this.ctx.lineTo(screenX + tileSize, screenY + 2 * tileSize / 3);
                this.ctx.stroke();
                break;
                
            case 2: // Spawn point
                this.ctx.fillStyle = '#00FF00'; // Green
                this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
                this.ctx.strokeStyle = '#008000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenX, screenY, tileSize, tileSize);
                break;
        }
    }
    
    drawStage(stage) {
        if (!stage || !stage.tiles) return;
        
        const tileSize = stage.tileSize || 32;
        
        for (let row = 0; row < stage.tiles.length; row++) {
            for (let col = 0; col < stage.tiles[row].length; col++) {
                const tileType = stage.tiles[row][col];
                if (tileType !== 0) {
                    this.drawTile(
                        col * tileSize,
                        row * tileSize,
                        tileSize,
                        tileType
                    );
                }
            }
        }
    }
    
    drawUI(gameState) {
        // Draw FPS counter
        if (gameState.fps) {
            this.drawText(`FPS: ${gameState.fps}`, 10, 10, {
                color: '#FFF',
                font: 'bold 14px Arial'
            });
        }
        
        // Draw connection status
        if (gameState.connectionStatus) {
            this.drawText(`Status: ${gameState.connectionStatus}`, 10, 30, {
                color: gameState.connectionStatus === 'Connected' ? '#00FF00' : '#FF0000',
                font: 'bold 14px Arial'
            });
        }
        
        // Draw player count
        if (gameState.playerCount !== undefined) {
            this.drawText(`Players: ${gameState.playerCount}`, 10, 50, {
                color: '#FFF',
                font: 'bold 14px Arial'
            });
        }
    }
    
    setCameraPosition(x, y) {
        this.camera.x = x;
        this.camera.y = y;
    }
    
    // Static camera - no movement
    updateCamera() {
        // Camera remains static at (0, 0)
        this.camera.x = 0;
        this.camera.y = 0;
    }
} 