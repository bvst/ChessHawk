---
applyTo: '**/*.js'
---

# Chess Hawk JavaScript Coding Standards

## Technology Stack
- **Frontend**: Modern Vanilla JavaScript (ES2024+)
- **Module System**: ES6 Modules (import/export)
- **Chess Logic**: chess.js library (`src/lib/chess.min.js`)
- **Board Display**: chessboard.js library (`src/lib/chessboard.min.js`)
- **Dependencies**: jQuery (minimal usage, migrate away when possible)

## File Organization
- **Main App**: Modularized into 6 focused modules in `src/js/`
- **Core Modules**: core-manager.js, problem-manager.js, game-logic.js, board-manager.js, ui-manager.js, debug-tools.js
- **Import System**: Modern ES6 modules with proper import/export
- **Utilities**: Import/export utilities organized in subdirectories
- **Scripts**: `scripts/` - database utilities and generators
- **Tests**: `tests/` - test files and validation

## Modern JavaScript Standards (ES2024+)
### Module System
```javascript
// Use ES6 modules for all new code
export class ProblemManager {
    // Class implementation
}

export const DEFAULT_CONFIG = {
    // Configuration
};

// Named imports
import { ProblemManager, DEFAULT_CONFIG } from './problem-manager.js';

// Dynamic imports for lazy loading
const module = await import('./heavy-module.js');
```

### Modern Syntax Features
- **ES2024+ syntax**: Use latest language features
- **Optional chaining**: `game?.position()?.fen`
- **Nullish coalescing**: `config.theme ?? 'default'`
- **Private class fields**: `#privateMethod()`
- **Top-level await**: For module initialization
- **Array methods**: `Array.from()`, `Array.at()`, `Array.findLast()`
- **Object methods**: `Object.groupBy()`, `Object.hasOwn()`
- **String methods**: `String.prototype.replaceAll()`

### Async/Await Pattern
```javascript
// Prefer async/await over Promises
async function loadProblems() {
    try {
        const response = await fetch('data/problems.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Feil ved lasting av problemer:', error);
        throw error;
    }
}
```

### Class-Based Architecture
```javascript
// Modern class syntax with private fields
export class ChessGameManager {
    #game;
    #board;
    #currentProblem;
    
    constructor(config = {}) {
        this.#game = new Chess();
        this.#initializeBoard(config);
    }
    
    #initializeBoard(config) {
        // Private method implementation
    }
    
    async loadProblem(problemId) {
        // Public async method
    }
}
```

## Modern Code Patterns

### Error Handling with Modern Syntax
```javascript
// Use Norwegian error messages with modern patterns
class ProblemlastingFeil extends Error {
    constructor(melding, problem = null) {
        super(melding);
        this.name = 'ProblemlastingFeil';
        this.problem = problem;
    }
}

// Optional chaining for safe property access
const poeng = currentProblem?.rating ?? 1000;
const løsning = currentProblem?.solution?.at(0) ?? null;
```

### Functional Programming Patterns
```javascript
// Use modern array methods
const nybegynnerProblemer = problems
    .filter(p => p.difficulty === 'beginner')
    .map(p => ({ ...p, displayName: `${p.title} (${p.points} poeng)` }))
    .sort((a, b) => a.rating - b.rating);

// Object destructuring with Norwegian names
const { tittel: title, beskrivelse: description, løsning: solution } = problem;
```

### Modern Event Handling
```javascript
// Use AbortController for better event management
const controller = new AbortController();

document.addEventListener('click', async (event) => {
    if (event.target.matches('.hint-knapp')) {
        await visHint();
    }
}, { signal: controller.signal });

// Cleanup when needed
controller.abort();
```

### Web APIs Integration
```javascript
// Local Storage with modern patterns
class ProblemlagerManager {
    static async lagreSpillerdata(data) {
        try {
            localStorage.setItem('chesshawk_data', JSON.stringify(data));
        } catch (error) {
            console.warn('Kunne ikke lagre data:', error);
        }
    }
    
    static hentSpillerdata() {
        return JSON.parse(localStorage.getItem('chesshawk_data') ?? '{}');
    }
}

// Use Intersection Observer for performance
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Lazy load content
        }
    });
});
```

## Performance & Best Practices

### Modern Performance Optimization
```javascript
// Use requestIdleCallback for non-critical tasks
function behandleNonKritiskeOppgaver() {
    requestIdleCallback((deadline) => {
        while (deadline.timeRemaining() > 0 && oppgaveKø.length > 0) {
            const oppgave = oppgaveKø.shift();
            utførOppgave(oppgave);
        }
    });
}

// Web Workers for heavy computations
const worker = new Worker('./workers/puzzle-analyzer.js');
worker.postMessage({ problems: heavyProblems });

// Use CSS Custom Properties for dynamic theming
document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
```

### Memory Management
```javascript
// Use WeakMap for private data
const privateData = new WeakMap();

class ProblemManager {
    constructor() {
        privateData.set(this, {
            cache: new Map(),
            listeners: new Set()
        });
    }
    
    // Cleanup method
    destroy() {
        const data = privateData.get(this);
        data.listeners.forEach(listener => listener.abort());
        privateData.delete(this);
    }
}
```

## Migration Guidelines

### From Legacy to Modern
1. **Convert to ES6 modules**: Replace script tags with import/export
2. **Use classes**: Replace function constructors with class syntax
3. **Async operations**: Replace callbacks with async/await
4. **Error handling**: Use custom Error classes
5. **Type safety**: Add JSDoc comments for better IDE support

### Backward Compatibility
- Maintain support for existing chess.js/chessboard.js APIs
- Gradual migration from jQuery to vanilla JS
- Preserve existing Norwegian variable names and comments
- Keep current problem database structure intact

## Code Quality Standards
- **ESNext features**: Use latest JavaScript features when beneficial
- **Tree shaking**: Structure code for optimal bundling
- **Performance**: Measure and optimize critical paths
- **Accessibility**: Ensure keyboard navigation and screen readers work
- **Testing**: Write testable, modular code
- **Documentation**: Use JSDoc for complex functions

## Development Tools
- **Modern debugging**: Use browser DevTools effectively
- **Performance profiling**: Monitor memory usage and CPU performance
- **Code formatting**: Consider Prettier/ESLint for consistency
- **Module bundling**: Prepare for potential build tools integration
