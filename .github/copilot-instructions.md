# GitHub Copilot Instructions for Chess Hawk Project

## Project Overview
Chess Hawk is a tactical chess puzzle application built with vanilla JavaScript, featuring 1000 tactical problems across 10 themes. The project has been thoroughly cleaned and organized following best practices.

## Project Structure & Organization

### Core Directory Structure
```
chess-hawk/
├── index.html                    # Main application entry point
├── README.md                     # Project documentation
├── docs/                         # Documentation files
│   ├── FINAL_REPORT.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── IMPORT_COMPLETE_REPORT.md
│   ├── MOBILE_FIX_COMPLETE.md
│   └── PUZZLE_IMPORTER_README.md
├── scripts/                      # Utility and database scripts
│   ├── batch-import.js
│   ├── generate-full-database.js
│   ├── verify-database.js
│   └── README.md
├── tests/                        # Test files with proper relative paths
│   ├── test-complete.html
│   ├── test-json.html
│   ├── test-json.js
│   └── README.md
└── src/                          # Source code
    ├── css/styles.css            # Main stylesheet
    ├── js/
    │   ├── chesshawk.js          # Core application logic
    │   └── puzzle-importer.js    # Import utilities
    ├── data/problems.json        # 1000 tactical problems database
    ├── img/chesspieces/          # Chess piece images
    └── lib/                      # Third-party libraries
        ├── chess.min.js
        ├── chessboard.min.js
        ├── chessboard.min.css
        └── jquery.min.js
```

### File Path Conventions
- **Test files**: Use relative paths like `../src/data/problems.json` when accessing data from tests/
- **Scripts**: Reference data as `src/data/problems.json` from project root
- **Documentation**: All `.md` files belong in `docs/` folder
- **Utilities**: All helper scripts belong in `scripts/` folder

## Database Structure

### Problems.json Schema
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
      "fen": "chess_position",
      "solution": ["move1", "move2", ...]
    }
  ]
}
```

### Database Distribution Requirements
- **Total**: Exactly 1000 problems
- **Themes**: 10 themes with 100 problems each
- **Difficulty**: ~340 beginner, ~330 intermediate, ~330 advanced
- **Language**: All text in Norwegian

## Coding Standards

### JavaScript
- Use vanilla JavaScript (no frameworks)
- Maintain compatibility with existing chess.js and chessboard.js libraries
- Follow existing naming conventions in chesshawk.js
- Use Norwegian comments and variable names where appropriate

### File Management
- **No duplicate files**: Remove any `.backup`, `_new`, or temporary files
- **Clean commits**: Use descriptive commit messages with emojis
- **Path consistency**: Always use forward slashes in code, even on Windows

### Commit Message Format
```
🔧 Fix: Description of bug fix
📝 Docs: Documentation changes  
✨ Feature: New functionality
🧹 Cleanup: Code organization
🔥 Remove: Delete unnecessary files
⚡ Performance: Speed improvements
```

## Development Workflow

### Before Making Changes
1. Run `node scripts/verify-database.js` to check database integrity
2. Check `git status` and ensure clean working directory
3. Read existing code to understand current implementation

### When Adding Features
1. Maintain the 1000-problem database structure
2. Keep all text in Norwegian
3. Test changes with existing test files in `tests/`
4. Update documentation in `docs/` if needed

### Database Modifications
- **Never directly edit** `problems.json` manually
- Use `scripts/generate-full-database.js` for regeneration
- Always verify with `scripts/verify-database.js` after changes
- Maintain exactly 1000 problems across 10 themes

## Testing Guidelines
- Use test files in `tests/` directory
- Ensure relative paths work: `../src/data/problems.json`
- Test database loading with `test-json.html`
- Verify complete application with `test-complete.html`

## File Organization Rules

### What Goes Where
- **Root**: Only essential files (index.html, README.md)
- **docs/**: All documentation and reports
- **scripts/**: Database utilities and helper scripts  
- **tests/**: All test files with proper README
- **src/**: Source code only - no documentation or utilities

### What to Avoid
- Backup files (auto-delete any `.backup.*` files)
- Duplicate data files
- Mixed Norwegian/English in same context
- Hardcoded file paths in scripts
- Documentation in root directory

## Error Prevention

### Common Issues to Watch For
1. **Path problems**: Always use relative paths correctly from each directory
2. **Database corruption**: Verify after any data changes
3. **Encoding issues**: Ensure UTF-8 for Norwegian characters
4. **Git clutter**: Remove backup and temporary files before commits

### Validation Commands
```bash
# Verify database integrity
node scripts/verify-database.js

# Check for backup files to remove
dir *.backup* /s

# Validate test paths work
start tests/test-json.html
```

## Project Goals
- Maintain clean, organized codebase
- Preserve 1000 tactical problems database
- Keep Norwegian language throughout
- Ensure mobile compatibility
- Follow established project structure

Remember: This project has been thoroughly cleaned and organized. Maintain this organization and always verify database integrity after changes.
