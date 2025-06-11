# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Dependencies
```bash
# Install npm dependencies (automatically handled by start-server.sh)
npm install

# Dependencies include:
# - jquery: DOM manipulation and utilities
# - chess.js: Chess game logic and move validation
# - @chrisoakman/chessboardjs: Interactive chess board rendering
```

### Server Setup
```bash
# Start development server (REQUIRED for proper operation)
# This script automatically checks and installs npm dependencies
./start-server.sh

# Alternative manual start:
npm start
# Or directly:
python3 -m http.server 8000

# Access app at http://localhost:8000

# IMPORTANT: file:// protocol causes CORS issues
# Always use a web server for development and testing
```

### Testing
```bash
# Test sequence (run in order for debugging):
# 1. Basic functionality: http://localhost:8000/test-basic-load.html
# 2. Simple validation: http://localhost:8000/test-simple.html  
# 3. Minimal monitoring: http://localhost:8000/test-minimal.html
# 4. JSON specific: http://localhost:8000/test-json.html
# 5. Full application: http://localhost:8000/index.html

# Legacy test files in tests/ directory:
# http://localhost:8000/tests/test-complete.html
```

### Database Management
```bash
# Generate new puzzle database (run from scripts/)
cd scripts
node generate-full-database.js

# Validate database integrity
node verify-database.js

# Import puzzles from Lichess
node import-puzzles-fixed.js
```

## Architecture Overview

Chess Hawk is a tactical chess training application built with modern ES6+ modules. The architecture follows a modular design pattern with clear separation of concerns.

### Core Module System
The application uses a centralized module orchestrator pattern:

- **CoreManager** (`src/js/core-manager.js`) - Main entry point and module orchestrator
- **BoardManager** (`src/js/board-manager.js`) - Chessboard.js integration and piece movement
- **ProblemManager** (`src/js/problem-manager.js`) - Puzzle loading and management
- **GameLogic** (`src/js/game-logic.js`) - Chess.js integration and move validation
- **UIManager** (`src/js/ui-manager.js`) - User interface updates and feedback
- **DebugTools** (`src/js/debug-tools.js`) - Development utilities

### Module Loading Pattern
The application loads via ES6 modules starting from `core-manager.js`, which initializes all other modules and exposes them globally for backward compatibility.

### Data Architecture
- **Primary Database**: `src/data/problems.json` contains 1000 tactical puzzles
- **Data Format**: JSON file uses `puzzles` array (not `problems` - compatibility handled in code)
- **Puzzle Structure**: Each puzzle has id, type, title, description, fen, solution array, hints, difficulty, category, points, and rating
- **Categories**: 10 tactical themes (fork, pin, skewer, mate, etc.) with 100 puzzles each
- **Localization**: All content in Norwegian (no)
- **Fallback Data**: 2 test puzzles available if JSON loading fails

### Import System Architecture
The puzzle import system uses a modular approach with specialized components:

- **PuzzleImporter** (`src/js/puzzle-importer-main.js`) - Main orchestrator
- **LichessImporter** (`src/js/importers/lichess-importer.js`) - Lichess API integration
- **PuzzleConverter** (`src/js/converters/puzzle-converter.js`) - Data transformation
- **PuzzleValidator** (`src/js/validators/puzzle-validator.js`) - Validation and statistics
- **PuzzleExporter** (`src/js/exporters/puzzle-exporter.js`) - Export and merge functionality

### Mobile Architecture
Mobile support is implemented through:
- CSS `touch-action: none` on board and pieces
- Touch event handling in BoardManager
- Responsive CSS grid layout
- Viewport meta tag with `user-scalable=no`

## Key Technical Details

### Library Dependencies
All dependencies are now managed through npm and loaded as ES6 modules:

- **Chess.js** (`chess.js@1.3.1`): Modern ES6 module with game logic and move validation
- **Chessboard.js** (`@chrisoakman/chessboardjs@^1.0.0`): Interactive chess board rendering (global script)
- **jQuery** (`jquery@^3.7.1`): DOM manipulation and utilities (global script)

### ES6 Module Architecture
The application now uses a fully modular ES6 architecture:
- `src/js/chess-global.js` - Chess.js ES6 module wrapper
- `src/js/core-manager.js` - Main application entry point (ES6 module)
- All game modules use ES6 import/export syntax
- No global script loading for application code

### Library Compatibility Notes
- **Chess.js versions**: Code handles multiple method names (`isGameOver()`, `game_over()`, `gameOver()`)
- **BoardManager methods**: Both `updatePosition()` and `loadPosition()` work (aliases)
- **DOM requirements**: Critical elements are `myBoard`, `feedback`, `solution`, `status`

### File Structure Significance
- `package.json` - npm configuration and dependencies
- `node_modules/` - npm-managed JavaScript libraries (auto-generated)
- `index.html` - Single-page application entry point
- `src/css/` - Modular CSS with responsive design
- `src/js/` - ES6 modules with clear separation of concerns
- `src/data/` - JSON puzzle database
- `src/lib/` - Legacy local library files (now replaced by npm packages)
- `tests/` - Browser-based testing infrastructure
- `scripts/` - Node.js utilities for database management

### Global Exposure Pattern
For backward compatibility, all modules are exposed globally via CoreManager:
```javascript
window.coreManager = this;
window.boardManager = this.#modules.get('board');
// etc.
```

### Error Handling
The application uses comprehensive error handling with:
- Try-catch blocks around critical operations
- Console logging with emoji prefixes for visibility
- User-facing error messages via UIManager
- Graceful degradation when modules fail to load
- Centralized error handling via `CoreManager.handleError()`
- Standardized warning system via `CoreManager.handleWarning()`
- DOM element existence checks before manipulation
- Library compatibility checks and fallbacks

## Important Patterns

### Puzzle Loading Flow
1. CoreManager initializes all modules
2. ProblemManager loads problems.json
3. Random puzzle selected and loaded into Chess.js
4. BoardManager updates visual board
5. UIManager updates problem display

### Move Validation Flow
1. User drags piece on board
2. BoardManager captures move attempt
3. GameLogic validates move via Chess.js
4. If valid, update game state and check solution
5. UIManager provides feedback

### Module Communication
Modules communicate through the CoreManager instance, avoiding direct dependencies between modules.

## Testing Strategy

The application uses browser-based testing with HTML test files that verify:
- Module loading and initialization
- JSON data loading and parsing
- Touch capabilities detection
- Theme distribution analysis
- Complete application functionality

No external testing framework is required - tests run directly in the browser.

### Debugging Test Files
1. **test-basic-load.html** - Manual tests, no intervals, best for step-by-step debugging
2. **test-simple.html** - Sequential automated tests with clear visual feedback
3. **test-minimal.html** - Real-time monitoring with automatic cleanup
4. **test-json.html** - Specific JSON loading and CORS issue detection

## Common Issues and Solutions

### CORS / File Protocol Issues
**Problem**: JSON loading fails, "fetch" errors
**Solution**: Use web server (`python3 -m http.server 8000`) instead of opening files directly

### Button Not Working
**Problem**: UI buttons don't respond to clicks
**Root Cause**: Button IDs in HTML must match JavaScript event listeners
**Check**: HTML uses `newProblemBtn`, JS looks for `newProblemBtn` (not `new-problem-btn`)

### Board Not Appearing
**Problem**: Chessboard doesn't render or shows as empty div
**Root Cause**: 
1. DOM element `myBoard` missing
2. Libraries not loaded (Chess.js, Chessboard.js)
3. Initialization timing issues
**Debug**: Use `test-basic-load.html` → "Test Chessboard" button

### Piece Movement Errors
**Problem**: `TypeError: window.game?.isGameOver is not a function`
**Root Cause**: Chess.js version compatibility
**Solution**: BoardManager handles multiple method names automatically

### Module Loading Failures
**Problem**: `window.boardManager` undefined, modules not available
**Root Cause**: 
1. ES6 module loading issues
2. Initialization order problems
3. DOM not ready when modules initialize
**Debug**: Check browser console for module loading errors, use test files

### JSON Data Format Issues
**Problem**: "Invalid data format: problems array not found"
**Root Cause**: JSON uses `puzzles` array, code expected `problems`
**Solution**: Code now checks both `data.puzzles` and `data.problems`

### Performance Issues
**Problem**: Repeated errors every 500ms, console spam
**Root Cause**: Monitoring intervals not properly cleaned up
**Solution**: All test files now have proper interval cleanup and error handling

## Development Best Practices

### When Adding New Features
1. Always test with `test-basic-load.html` first
2. Check library compatibility (especially Chess.js methods)
3. Add proper error handling with `CoreManager.handleError()`
4. Use optional chaining for DOM element access
5. Test on both web server and file:// protocol

### When Debugging Issues
1. Start with simplest test file (`test-basic-load.html`)
2. Check browser console for specific error messages
3. Verify all required DOM elements exist
4. Test library loading with manual test buttons
5. Use "Test Chess.js" to check method availability

### Code Patterns to Follow
```javascript
// Good: Safe DOM access
const element = document.getElementById('myElement');
if (element) {
    element.textContent = 'Safe update';
}

// Good: Library compatibility
const isGameOver = window.game?.isGameOver?.() || window.game?.game_over?.() || false;

// Good: Error handling
try {
    const result = riskyOperation();
    CoreManager.handleError(error, 'Operation Context');
} catch (error) {
    CoreManager.handleError(error, 'Operation Context');
}
```