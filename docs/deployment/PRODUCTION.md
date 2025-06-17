# Chess Hawk Production Deployment Guide

## Overview

Chess Hawk supports two deployment modes:

1. **Development Mode**: Uses Vite, npm packages, and ES6 modules
2. **Production Mode**: Uses script tags, no node_modules dependency

## Production Build Process

### 1. Build Production Bundle

```bash
# Complete production build
npm run build:production

# Or step by step:
npm run build:copy-libs     # Copy libraries from node_modules
npm run build:prod-bundle   # Build application bundle
```

### 2. Production File Structure

After building, your `dist/` folder will contain:

```
dist/
├── index-production.html     # Production entry point
├── chess-hawk.min.js        # Application bundle
├── lib/                     # Production libraries
│   ├── jquery.min.js
│   ├── chess.min.js
│   ├── chessboard.min.js
│   └── chessboard.min.css
├── src/                     # Source files (CSS, data, images)
│   ├── css/
│   ├── data/
│   └── img/
└── assets/                  # Additional assets
```

### 3. Deploy to Production

Simply copy the `dist/` folder to your web server. No node_modules required!

```bash
# Example deployment
rsync -av dist/ user@server:/var/www/chess-hawk/
```

## Key Differences: Development vs Production

### Development Mode (`index.html`)
- Uses Vite dev server
- Loads dependencies from `node_modules/`
- TypeScript compilation on-the-fly
- ES6 module imports
- Hot module replacement

```html
<!-- Development -->
<script src="node_modules/jquery/dist/jquery.min.js"></script>
<script src="node_modules/@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.js"></script>
<script type="module" src="src/js/core-manager.ts"></script>
```

### Production Mode (`index-production.html`)
- No build tools required
- Loads dependencies from `src/lib/`
- Pre-compiled JavaScript bundle
- Global script variables
- Static file serving

```html
<!-- Production -->
<script src="src/lib/jquery.min.js"></script>
<script src="src/lib/chessboard.min.js"></script>
<script type="module" src="src/js/chess-hawk-production.ts"></script>
```

## Production Architecture

### Library Loading Strategy
1. **jQuery** - Loaded globally as `$`
2. **Chess.js** - Loaded globally as `Chess`
3. **Chessboard.js** - Loaded globally as `Chessboard`
4. **ChessHawk** - Single bundled application

### Module Compatibility
The TypeScript modules are designed to work in both modes:

- **Development**: Use ES6 imports (`import { Chess } from 'chess.js'`)
- **Production**: Use global variables (`window.Chess`)

### Global Scope Management
In production mode, all modules are exposed globally:

```javascript
window.coreManager      // Main application manager
window.boardManager     // Chessboard management
window.problemManager   // Puzzle management
window.gameLogic        // Game logic and validation
window.uiManager        // User interface
window.debugTools       // Debug utilities

// Legacy compatibility
window.game             // Chess.js instance
window.currentProblem   // Current puzzle
window.loadRandomProblem()  // Load new puzzle
```

## Testing Production Build

### 1. Preview Locally
```bash
npm run preview:production
# Opens http://localhost:8080 with production build
```

### 2. Manual Testing
```bash
# Build production files
npm run build:production

# Start simple HTTP server
cd dist
python3 -m http.server 8080

# Visit http://localhost:8080/index-production.html
```

### 3. Verify Production Features
- ✅ All buttons work
- ✅ Chess pieces can be moved
- ✅ Problems load correctly
- ✅ No 404 errors for missing files
- ✅ Console shows "Production Mode" messages

## Troubleshooting Production Issues

### Common Problems

**1. "Chess is not defined" Error**
- **Cause**: Chess.js script not loaded before application
- **Fix**: Ensure script loading order in HTML

**2. "$ is not defined" Error**
- **Cause**: jQuery not loaded
- **Fix**: Check jquery.min.js path and loading

**3. Chessboard not appearing**
- **Cause**: Chessboard.js or CSS not loaded
- **Fix**: Verify chessboard.min.js and chessboard.min.css paths

**4. 404 Errors for library files**
- **Cause**: Libraries not copied to dist/
- **Fix**: Run `npm run build:copy-libs`

### Debug Mode
The production build includes console logging for debugging:

```javascript
// Check if libraries are loaded
console.log('jQuery:', typeof $);
console.log('Chess.js:', typeof Chess);
console.log('Chessboard.js:', typeof Chessboard);

// Check application state
window.coreManager.getStatistics();
window.debugTools.logGameState();
```

## Server Requirements

### Minimal Requirements
- Any web server that can serve static files
- Support for `.js`, `.css`, `.json`, `.png` file types
- No server-side processing required

### Recommended Setup
- Enable gzip compression for `.js` and `.css` files
- Set appropriate cache headers
- HTTPS for security (especially for clipboard API)

### Example Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/chess-hawk;
    index index-production.html;

    # Enable compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle JSON files (puzzles)
    location ~* \.json$ {
        add_header Access-Control-Allow-Origin "*";
    }
}
```

## Security Considerations

### CSP (Content Security Policy)
If using CSP, allow:
```
script-src 'self' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
```

### File Access
- No file:// protocol dependencies
- All resources loaded via HTTP(S)
- No external CDN dependencies (all libraries bundled)

## Deployment Checklist

- [ ] Run `npm run build:production`
- [ ] Verify `dist/` folder contains all necessary files
- [ ] Test production build locally
- [ ] Upload `dist/` contents to web server
- [ ] Configure web server (if needed)
- [ ] Test live deployment
- [ ] Verify console shows "Production Mode"
- [ ] Test all functionality works correctly

## Performance Optimizations

### Bundle Size
- Minified production bundle: ~100KB
- Libraries (jQuery + Chess.js + Chessboard.js): ~300KB
- Total JavaScript: ~400KB (gzipped: ~150KB)

### Loading Strategy
1. Critical libraries loaded first (jQuery, Chess.js, Chessboard.js)
2. Application bundle loaded last
3. Images and CSS loaded as needed

### Caching Strategy
- Library files: Long-term caching (1 year)
- Application bundle: Version-based caching
- Data files (puzzles): Short-term caching (1 hour)

## Future Enhancements

### Potential Improvements
1. **Service Worker**: Offline functionality
2. **Code Splitting**: Load modules on demand
3. **Web Workers**: Background chess analysis
4. **PWA Features**: App-like experience
5. **CDN Integration**: Faster global delivery

The production build is designed to be simple, reliable, and compatible with any web server environment while maintaining all the functionality of the development version.