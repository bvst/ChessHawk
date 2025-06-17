# Chess Hawk - Troubleshooting Quick Reference

## 🚨 Emergency Debugging Checklist

### 1. Application Won't Load
```bash
# First: Check if using web server (NOT file://)
python3 -m http.server 8000
# Then open: http://localhost:8000/

# Test sequence:
1. http://localhost:8000/test-basic-load.html
2. Click each test button manually
3. Check console for specific errors
```

### 2. Buttons Don't Work
**Check**: Button IDs match between HTML and JavaScript
```javascript
// HTML should have:
<button id="newProblemBtn">Nytt Problem</button>

// JavaScript should look for:
document.getElementById('newProblemBtn')
```

### 3. Chess Board Empty/Missing
**Quick fix**: Check DOM element and libraries
```javascript
// In browser console:
document.getElementById('myBoard')  // Should exist
typeof Chessboard                  // Should be 'function'
typeof Chess                       // Should be 'function'
```

### 4. Piece Movement Errors
**Error**: `TypeError: window.game?.isGameOver is not a function`
**Fix**: Chess.js version compatibility - already handled in BoardManager

### 5. JSON Loading Failed
**Error**: "Invalid data format: problems array not found"
**Fix**: Use web server, fallback data available

## 🔧 Quick Fixes

### Reset Everything
```bash
# Clear browser cache
# Hard refresh (Ctrl+F5 or Cmd+Shift+R)
# Restart web server
python3 -m http.server 8000
```

### Check Method Availability
```javascript
// In browser console:
window.game?.isGameOver?.()     // Check game over method
window.boardManager             // Should exist
window.boardManager.updatePosition // Should be function
```

### Test Individual Components
1. **Libraries**: Use `test-basic-load.html` → "Test Libraries"
2. **Board**: Use `test-basic-load.html` → "Test Chessboard"  
3. **Chess.js**: Use `test-basic-load.html` → "Test Chess.js"
4. **Globals**: Use `test-basic-load.html` → "Check Globals"

## 📋 Error Message Decoder

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Cannot set properties of null` | DOM element missing | Check element IDs, use null checks |
| `isGameOver is not a function` | Chess.js version issue | Already fixed in BoardManager |
| `fetch failed` | CORS/file protocol | Use web server |
| `Module not found` | ES6 import issue | Check file paths, web server |
| `Button element not found` | ID mismatch | Check HTML vs JS IDs |

## 🎯 Test File Usage

| File | Purpose | When to Use |
|------|---------|-------------|
| `test-basic-load.html` | Manual testing, debugging | First step, controlled testing |
| `test-simple.html` | Automated validation | Quick health check |
| `test-minimal.html` | Real-time monitoring | Watch initialization process |
| `test-json.html` | JSON/CORS specific | Data loading issues |
| `index.html` | Full application | Final testing |

## 🔍 Browser Console Commands

```javascript
// Check application state
window.coreManager?.gameState

// Test method availability  
Object.getOwnPropertyNames(window.boardManager || {})

// Force reload problem
window.coreManager?.loadRandomProblem()

// Check error history
window.coreManager?.getStatistics()
```

## 🚀 Development Workflow

1. **Start server**: `python3 -m http.server 8000`
2. **Test basics**: Open `test-basic-load.html`
3. **Run manual tests**: Click all test buttons
4. **Check main app**: Open `index.html`
5. **Debug issues**: Use specific test files

## 💡 Pro Tips

- Always use web server (never file://)
- Check browser console first
- Use test files for isolated debugging
- Test Chess.js compatibility when adding features
- Check DOM elements exist before manipulation
- Use optional chaining for all external library calls