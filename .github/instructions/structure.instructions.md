---
applyTo: '**'
---

# Chess Hawk Project Structure Instructions

## Required Directory Structure
```
chess-hawk/
├── .github/                      # GitHub configuration
│   ├── instructions/             # Detailed AI instructions
│   └── copilot-instructions.md   # Main Copilot instructions
├── index.html                    # Main application entry point
├── README.md                     # Project documentation
├── docs/                         # All documentation files
├── scripts/                      # Utility and database scripts
├── tests/                        # Test files with proper relative paths
└── src/                          # Source code only
    ├── css/styles.css            # Main stylesheet
    ├── js/chesshawk.js           # Core application logic
    ├── data/problems.json        # 1000 tactical problems database
    └── lib/                      # Third-party libraries
```

## File Organization Rules

### What Goes Where
- **Root level**: Only essential files (index.html, README.md, .gitignore)
- **docs/**: All documentation, reports, and markdown files
- **scripts/**: Database utilities, generators, and helper scripts
- **tests/**: All test files with proper README documentation
- **src/**: Source code only - no documentation or utilities
- **.github/**: GitHub-specific configuration and instructions

### What to Avoid
- **No backup files**: Auto-delete any `.backup.*` or `_new.*` files
- **No duplicate data**: Single source of truth for database
- **No mixed content**: Keep documentation separate from source code
- **No hardcoded paths**: Use relative paths appropriately
- **No root clutter**: Keep root directory minimal

## Path Management
- **From tests/**: Use `../src/data/problems.json`
- **From scripts/**: Use `src/data/problems.json`
- **From src/**: Use relative paths like `data/problems.json`
- **Always use forward slashes** in code, even on Windows

## File Naming Conventions
- **Lowercase with hyphens** for directories: `chess-hawk/`
- **Descriptive names** for files: `verify-database.js`
- **Consistent extensions**: `.js` for scripts, `.md` for docs
- **No spaces or special characters** in filenames

## Maintenance Rules
- Remove temporary files before commits
- Keep directory structure consistent
- Document new directories with README.md files
- Maintain clean separation of concerns
