---
applyTo: '**'
---

# Chess Hawk Database Management Instructions

## Database Schema Requirements
- **Total Problems**: Exactly 1000 tactical chess problems
- **Themes**: 10 themes with exactly 100 problems each
- **Structure**: Use `problems.json` with version 2.0 schema
- **Language**: All text content must be in Norwegian

## Database Structure
```javascript
{
  "version": "2.0",
  "generated": "ISO timestamp",
  "totalPuzzles": 1000,
  "themes": ["fork", "pin", "skewer", "mate", "mateIn1", "mateIn2", "sacrifice", "deflection", "decoy", "discoveredAttack"],
  "problems": [
    {
      "id": "unique_id",
      "title": "Norwegian title",
      "description": "Norwegian description", 
      "category": "theme_name",
      "difficulty": "beginner|intermediate|advanced",
      "rating": 1000-2000,
      "points": 5-15,
      "fen": "valid_chess_position",
      "solution": ["move1", "move2", ...]
    }
  ]
}
```

## Difficulty Distribution
- **Beginner**: ~340 problems (ratings 1000-1299)
- **Intermediate**: ~330 problems (ratings 1300-1699)
- **Advanced**: ~330 problems (ratings 1700-2000)

## Database Modification Rules
1. **Never edit problems.json directly** - use generation scripts
2. **Always verify** with `node scripts/verify-database.js` after changes
3. **Maintain exact counts** - 1000 total, 100 per theme
4. **Use proper FEN notation** for chess positions
5. **Ensure valid move notation** in solutions

## Required Validation
- Run verification script before any commit
- Check theme distribution is exactly 100 each
- Verify difficulty balance is maintained
- Confirm all Norwegian text is properly encoded (UTF-8)