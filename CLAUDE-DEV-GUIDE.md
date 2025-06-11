# Chess Hawk - Claude Development Guide

This guide helps Claude Code work efficiently with the Chess Hawk codebase by documenting patterns, gotchas, and best practices discovered during development.

## 🎯 Quick Start for Claude

### Essential First Steps
1. **Always start web server**: `python3 -m http.server 8000`
2. **Test with**: `test-basic-load.html` before making changes
3. **Check syntax**: `node -c src/js/filename.js` after edits
4. **Verify DOM elements**: Required IDs are `myBoard`, `feedback`, `solution`, `status`

### Common Error Patterns to Avoid

#### ❌ DOM Element Access Without Checks
```javascript
// BAD - Will cause null errors
element.textContent = 'value';

// GOOD - Safe access
if (element) {
    element.textContent = 'value';
}
```

#### ❌ Library Method Assumptions
```javascript
// BAD - Assumes specific Chess.js version
if (game.isGameOver()) {

// GOOD - Version-compatible
if (this.#isGameOver(game)) {
```

#### ❌ Button ID Mismatches
```javascript
// HTML has: id="newProblemBtn"
// JS looks for: 'new-problem-btn' ❌

// ALWAYS match exactly: 'newProblemBtn' ✅
```

## 🔧 Code Patterns That Work

### DOM Manipulation
```javascript
// Always check existence
const element = document.getElementById('elementId');
if (element) {
    element.textContent = 'safe update';
}

// For multiple elements
const elements = {
    title: document.getElementById('problemTitle'),
    description: document.getElementById('problemDescription')
};

Object.entries(elements).forEach(([key, el]) => {
    if (el) {
        el.textContent = data[key] || '';
    }
});
```

### Library Compatibility
```javascript
// Chess.js version-safe patterns
const isGameOver = game?.isGameOver?.() || game?.game_over?.() || false;
const moves = game?.moves?.() || [];
const turn = game?.turn?.() || 'w';
```

### Error Handling
```javascript
// Use centralized error handling
try {
    riskyOperation();
} catch (error) {
    this.handleError(error, 'Operation Context', showToUser);
}

// For warnings
this.handleWarning('Non-critical issue', 'Context', showToUser);
```

### Module Method Calls
```javascript
// BoardManager methods (both work)
boardManager.updatePosition(fen);  // Preferred
boardManager.loadPosition(fen);    // Original

// Always check module exists
if (window.boardManager) {
    window.boardManager.updatePosition(fen);
}
```

## 🧪 Testing Strategy for Claude

### Before Making Changes
1. **Run**: `test-basic-load.html` to establish baseline
2. **Check**: All test buttons work (Libraries, Board, Globals, Methods)
3. **Note**: Any existing errors in console

### After Making Changes
1. **Syntax check**: `node -c src/js/modified-file.js`
2. **Test again**: `test-basic-load.html` with same test buttons
3. **Verify**: Main application loads at `index.html`
4. **Check**: No new console errors

### When Adding New Features
1. **Test libraries first**: Click "Test Chess.js" to see available methods
2. **Check DOM requirements**: Use "Check Globals" to verify elements
3. **Add error handling**: Use `CoreManager.handleError()` pattern
4. **Test fallbacks**: Verify graceful degradation

## 📁 File Modification Guidelines

### Core Files (Handle with Care)
- `core-manager.js` - Central orchestrator, affects everything
- `board-manager.js` - Chess piece movement, library integration
- `problem-manager.js` - JSON loading, puzzle management

### Safe to Modify
- Test files (`test-*.html`) - For debugging and validation
- CSS files - Visual changes only
- Documentation files

### Method Name Reference
```javascript
// BoardManager
boardManager.updatePosition(fen)     // Alias (preferred)
boardManager.loadPosition(fen)       // Original
boardManager.setBoardOrientation(turn)
boardManager.initializeBoard()

// CoreManager  
coreManager.handleError(error, context, showToUser)
coreManager.handleWarning(message, context, showToUser)
coreManager.loadRandomProblem()

// ProblemManager
problemManager.loadProblems()        // Returns Promise
problemManager.getRandomProblem()
problemManager.displayProblem(problem)
```

## 🐛 Debugging Decision Tree

```
Error occurred?
├── Button not working?
│   └── Check: HTML id="buttonId" matches JS getElementById('buttonId')
├── Board not showing?
│   ├── Check: document.getElementById('myBoard') exists
│   ├── Check: typeof Chessboard === 'function'
│   └── Test: test-basic-load.html "Test Chessboard"
├── Piece movement error?
│   ├── Check: window.game exists
│   ├── Test: test-basic-load.html "Test Chess.js"
│   └── Error likely handled by BoardManager compatibility layer
├── JSON loading failed?
│   ├── Check: Using web server (not file://)
│   ├── Test: test-json.html
│   └── Fallback data should activate automatically
└── Module undefined?
    ├── Check: Browser console for ES6 import errors
    ├── Test: test-basic-load.html "Check Globals"
    └── Verify: DOM ready before module loading
```

## 🎨 UI Element IDs Reference

### Critical Elements (Required)
```html
<div id="myBoard"></div>          <!-- Chess board container -->
<div id="feedback"></div>         <!-- User feedback messages -->
<div id="solution"></div>         <!-- Solution display -->
<div id="status"></div>           <!-- Game status -->
```

### Button IDs (Must Match JS)
```html
<button id="newProblemBtn">Nytt Problem</button>
<button id="checkSolutionBtn">Sjekk Løsning</button>
<button id="getHintBtn">Hint</button>
<button id="resetPositionBtn">Reset Posisjon</button>
<button id="debugShowSolution">Debug: Vis Løsning</button>
<button id="debugAnalyzeProblems">Debug: Analyser Problemer</button>
```

### Optional Elements
```html
<div id="problemTitle">Problem title</div>
<div id="problemDescription">Problem description</div>
<div id="score">Score display</div>
```

## 🚀 Performance Considerations

### Avoid
- Continuous intervals without cleanup
- DOM queries in loops
- Repeated library compatibility checks

### Prefer
- One-time setup with proper cleanup
- Cached DOM element references
- Version detection once, store results

### Memory Management
```javascript
// Good: Proper cleanup
const controller = new AbortController();
// ... use controller.signal in event listeners
// Later: controller.abort()

// Good: Clear intervals
const interval = setInterval(func, 1000);
// Later: clearInterval(interval)
```

This guide should make future Claude interactions much more efficient by avoiding the common pitfalls we discovered! 🎯