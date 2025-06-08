---
applyTo: '**'
---

# Chess Hawk Testing Instructions

## Test File Organization
All test files are located in `tests/` directory with proper documentation:

- `test-json.html` - Database loading verification
- `test-complete.html` - Full application testing
- `test-json.js` - JavaScript database tests
- `README.md` - Testing documentation

## Path Requirements for Tests
**Critical**: Test files must use relative paths to access source files:
- ✅ Correct: `../src/data/problems.json`
- ❌ Incorrect: `src/data/problems.json`

## Database Testing
Run verification script before any changes:
```bash
node scripts/verify-database.js
```

Expected output verification:
- ✅ Total: 1000 problems
- ✅ Themes: 10 themes with 100 problems each
- ✅ Difficulty: ~340 beginner, ~330 intermediate, ~330 advanced
- ✅ All Norwegian text properly encoded

## Application Testing
1. **Database Loading**: Open `tests/test-json.html`
   - Should load 1000 problems without errors
   - Verify theme distribution
   - Check for missing or malformed data

2. **Complete Application**: Open `tests/test-complete.html`
   - Chess board should render correctly
   - Problem selection should work
   - Solution checking should function
   - Mobile responsiveness should be verified

## Manual Testing Checklist
- [ ] App loads without console errors
- [ ] Chess board displays correctly
- [ ] Problems load from all 10 themes
- [ ] Solution validation works
- [ ] Mobile layout is responsive
- [ ] Norwegian text displays correctly
- [ ] Navigation between problems works

## Performance Testing
- Load time should be under 3 seconds
- Problem switching should be instantaneous
- Memory usage should remain stable
- No memory leaks during extended use

## Error Testing
- Test with corrupted database
- Test with missing files
- Test with invalid chess positions
- Test with network disconnection

## Automated Testing Setup
For future implementation:
- Unit tests for core functions
- Integration tests for chess logic
- Performance benchmarks
- Accessibility testing
