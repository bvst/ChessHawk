---
applyTo: '**/*.js'
---

# Chess Hawk JavaScript Coding Standards

## Technology Stack
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Chess Logic**: chess.js library (`src/lib/chess.min.js`)
- **Board Display**: chessboard.js library (`src/lib/chessboard.min.js`)
- **Dependencies**: jQuery (minimal usage) (`src/lib/jquery.min.js`)

## File Organization
- **Main App**: `src/js/chesshawk.js` - core application logic
- **Utilities**: `src/js/puzzle-importer.js` - import utilities
- **Scripts**: `scripts/` - database utilities and generators
- **Tests**: `tests/` - test files and validation

## JavaScript Standards
- Use modern ES6+ syntax where supported
- Maintain compatibility with existing chess.js/chessboard.js
- Follow existing naming conventions in chesshawk.js
- Use Norwegian variable names and comments where appropriate
- Prefer const/let over var
- Use arrow functions for callbacks

## Code Style
```javascript
// Norwegian variable names
const spillBrett = new ChessBoard('board', config);
const nåværendeProblem = problems[currentIndex];

// Consistent function naming
function lastNesteProblem() {
    // Implementation
}

// Error handling in Norwegian
if (!validMove) {
    console.error('Ugyldig trekk:', move);
    visErrorMelding('Dette trekket er ikke gyldig');
}
```

## Error Handling
- Always validate chess positions and moves
- Provide user-friendly error messages in Norwegian
- Log detailed errors to console for debugging
- Handle missing or corrupted data gracefully

## Performance Considerations
- Lazy load chess problems as needed
- Optimize board rendering for mobile devices
- Minimize DOM manipulations
- Cache frequently accessed data

## Chess Logic Standards
- Always validate FEN positions before use
- Use chess.js for move validation
- Ensure proper piece movement rules
- Handle special cases (castling, en passant, promotion)

## Database Interaction
- Use relative paths correctly: `../src/data/problems.json` from tests
- Always validate JSON structure before parsing
- Handle network errors gracefully
- Implement proper loading states

## Testing Requirements
- All functions should be testable
- Use console.log for debugging (remove in production)
- Validate input parameters
- Test edge cases and error conditions
