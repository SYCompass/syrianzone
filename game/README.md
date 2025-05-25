# Multiplayer 2D Platformer

A real-time multiplayer 2D platformer game built with HTML5 Canvas and WebRTC for peer-to-peer communication.

## Features

- **Real-time Multiplayer**: Connect with other players using WebRTC
- **Static Camera**: Fixed camera view for consistent gameplay
- **Matrix-based Stages**: Levels defined using JSON matrix format
- **Physics Engine**: Gravity, jumping, and collision detection
- **Cross-platform**: Runs in any modern web browser
- **No Server Required**: Peer-to-peer networking using Google STUN servers

## Quick Start

1. **Open the game**: Simply open `index.html` in a modern web browser
2. **Create a room**: Click "Create Room" and enter your name
3. **Share room ID**: Give the generated room ID to friends
4. **Join game**: Friends can enter the room ID and click "Join Room"
5. **Play**: Use arrow keys to move and spacebar to jump!

## Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Spacebar**: Jump/Wall Jump (with double jump support!)
- **Window Focus**: Game pauses when window loses focus

### Advanced Movement System

#### Double Jump
- **First Jump**: Ground jump (full power)
- **Second Jump**: Air jump (slightly weaker)
- **Visual Indicators**: ↑ = jump available

#### Wall Sliding & Wall Jumping
- **Wall Slide**: Hold against a wall while falling to slide down slowly
- **Wall Jump**: Press jump while wall sliding to jump away from the wall
- **Wall Jump Power**: Stronger than air jump, pushes you away from wall
- **Visual Indicators**: 🧗 = wall sliding, gold particles on wall jump
- **Reset**: Jump count resets when grabbing a wall or landing on ground

## Game Architecture

### Core Components

- **Game Engine** (`js/game.js`): Main game loop with fixed timestep
- **Renderer** (`js/renderer.js`): Canvas-based rendering system
- **Player** (`js/player.js`): Player physics and collision detection
- **Stage** (`js/stage.js`): Matrix-based level system
- **Input** (`js/input.js`): Keyboard input handling
- **Network** (`js/network.js`): WebRTC peer-to-peer networking

### Stage Format

Stages are defined in JSON files with a matrix format:

```json
{
  "width": 25,
  "height": 19,
  "tileSize": 32,
  "spawn": [2, 16],
  "tiles": [
    [0,0,0,0,0],
    [0,1,1,1,0],
    [0,0,2,0,0],
    [1,1,1,1,1]
  ]
}
```

**Tile Types:**
- `0`: Empty space
- `1`: Solid platform
- `2`: Spawn point

### Network Architecture

- **WebRTC Data Channels**: Real-time game state synchronization
- **Google STUN Servers**: NAT traversal for peer discovery
- **Fallback Mode**: Local testing using localStorage
- **Automatic Reconnection**: Handles connection drops gracefully

## Technical Details

### Physics System
- Gravity: 0.8 units/frame
- Jump Power: -15 units
- Move Speed: 5 units/frame
- Friction: 0.8 multiplier
- Fixed timestep: 60 FPS

### Networking
- Update Rate: 60 Hz
- Data Format: JSON over WebRTC data channels
- Lag Compensation: Client-side prediction
- Connection: Peer-to-peer (no central server)

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Edge**: Full support

## Development

### File Structure
```
├── index.html          # Main HTML file
├── style.css           # Game styling
├── js/
│   ├── game.js         # Main game engine
│   ├── renderer.js     # Canvas rendering
│   ├── player.js       # Player physics
│   ├── stage.js        # Level system
│   ├── input.js        # Input handling
│   └── network.js      # WebRTC networking
├── stages/
│   └── stage1.json     # Example stage
└── README.md           # This file
```

### Adding New Stages

1. Create a new JSON file in the `stages/` directory
2. Follow the matrix format shown above
3. Load the stage using `stage.loadStage('filename')`

### Customizing Physics

Edit the physics constants in `js/player.js`:

```javascript
this.gravity = 0.8;        // Gravity strength
this.jumpPower = -15;      // Jump velocity
this.moveSpeed = 5;        // Movement speed
this.friction = 0.8;       // Friction multiplier
```

## Troubleshooting

### Connection Issues
- **Can't connect**: Check if WebRTC is supported in your browser
- **Firewall blocking**: Ensure UDP traffic is allowed
- **NAT issues**: Try using a VPN or different network

### Performance Issues
- **Low FPS**: Close other browser tabs and applications
- **Lag**: Check network connection quality
- **Stuttering**: Disable browser extensions

### Game Issues
- **Player stuck**: Refresh the page to respawn
- **Controls not working**: Click on the game canvas to focus
- **Stage not loading**: Check browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Credits

- Built with HTML5 Canvas and WebRTC
- Uses Google STUN servers for peer discovery
- Inspired by classic 2D platformer games

---

**Have fun playing!** 🎮 