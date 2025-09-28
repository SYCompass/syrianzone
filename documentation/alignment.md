# Custom Political Compass Generator (`/alignment`)

An interactive political compass generator that allows users to create custom political compasses with personalized axes, colors, and positioned dots. Features mouse/touch interaction, drag-and-drop dots, and multiple export formats.

## Main Files
- `index.html` — Main page layout with navbar, hero section, compass interface, and footer following project design patterns.
- `script.js` — Core PoliticalCompassGenerator class implementing canvas drawing, event handling, dot management, and export functionality.

## Design Implementation
- Uses navbar.js web component for consistent navigation
- Hero section similar to party/ with centered title and description
- Footer matching project style with developer credits
- Tailwind CSS integration with theme system support
- Sharp borders (0px radius) consistent with project styling
- RTL (right-to-left) text direction for Arabic content

## Core Features
- **Custom Axes**: User-configurable labels for all four compass directions (left, right, top, bottom)
- **Color Customization**: Individual color pickers for each compass quadrant
- **Interactive Dot Placement**: Click (desktop) or tap (mobile) to place dots on compass with automatic color assignment
- **Dot Management**: Drag dots to reposition (desktop), long-press and drag (mobile), edit names, delete dots
- **Dot Naming**: Assign custom names to placed dots
- **Export Options**: Download compass as PNG, JPG, or SVG formats
- **Persistence**: LocalStorage saves compass state (dots, colors, axes)
- **Full Touch Support**: Optimized touch event handling for mobile devices with proper coordinate mapping

## Key Functions
- **Canvas Drawing**: `drawCompass()` renders quadrants, grid lines, axes labels, and dots
- **Event Handling**: Mouse and touch event handlers for dot placement and dragging
- **Dot Management**: `addDot()`, `showDotEditor()`, `updateDotsList()`, `handleDotAction()`
- **Export System**: `exportAsPNG()`, `exportAsJPG()`, `exportAsSVG()` with download triggers
- **State Management**: `saveToStorage()`, `loadFromStorage()` for persistence
- **UI Updates**: Real-time updates when axes or colors change

## Technical Implementation
- **Canvas-based Rendering**: HTML5 Canvas API for compass visualization
- **Coordinate System**: Robust mouse/touch coordinate mapping handling both event types
- **Drag and Drop**: Custom drag implementation for desktop (mouse) and mobile (touch)
- **Touch Optimization**: Proper touch event handling with passive:false for better performance
- **Color System**: Browser-native color pickers integrated with canvas rendering
- **Export Formats**:
  - PNG: Canvas.toDataURL() for bitmap export
  - JPG: Canvas.toDataURL() with quality settings
  - SVG: Manual SVG generation with embedded elements
- **Mobile-First**: Comprehensive touch support with visual feedback and instructions

## User Interface Elements
- **Compass Canvas**: 600x600px interactive canvas with crosshair cursor
- **Axis Controls**: Four input fields for customizing compass directions
- **Color Controls**: Four color pickers for quadrant customization
- **Dots List**: Scrollable list showing all placed dots with edit/delete options
- **Export Controls**: Format selection buttons and download trigger
- **Visual Feedback**: Real-time canvas updates, hover states, active selections

## Data Structure
```javascript
{
  dots: [
    {
      x: number,      // Canvas X coordinate
      y: number,      // Canvas Y coordinate
      color: string,  // Hex color code
      name: string,   // User-defined label
      id: string      // Unique identifier
    }
  ],
  colors: {
    topLeft: string,
    topRight: string,
    bottomLeft: string,
    bottomRight: string
  },
  axes: {
    left: string,
    right: string,
    top: string,
    bottom: string
  }
}
```

## Browser Compatibility
- Modern browsers with Canvas API support
- Touch events for mobile devices
- LocalStorage for state persistence
- File download API for exports

## Notes
- Absolute paths used for all assets and components
- Follows project's sharp border styling (0px radius)
- Integrates with site's theme system for consistent appearance
- Minimalist logic with clean separation of concerns
- Arabic language support with RTL text direction
