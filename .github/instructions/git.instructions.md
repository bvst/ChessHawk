---
applyTo: '**'
---

# Chess Hawk Git Workflow Instructions

## Commit Message Format
Use descriptive commit messages with emojis for categorization:

```
🔧 Fix: Description of bug fix
📝 Docs: Documentation changes  
✨ Feature: New functionality
🧹 Cleanup: Code organization
🔥 Remove: Delete unnecessary files
⚡ Performance: Speed improvements
🎨 Style: UI/UX improvements
🐛 Bug: Critical bug fixes
🚀 Deploy: Deployment related changes
🔀 Merge: Branch merges
```

## Pre-Commit Checklist
1. **Run database verification**: `node scripts/verify-database.js`
2. **Check git status**: Ensure no untracked backup files
3. **Test core functionality**: Verify app loads and puzzles work
4. **Review changes**: Use `git diff` to review modifications

## Branch Strategy
- **main**: Production-ready code only
- **feature/***: New feature development
- **fix/***: Bug fixes
- **cleanup/***: Code organization and maintenance

## What to Commit
- ✅ Source code changes
- ✅ Documentation updates
- ✅ Configuration files
- ✅ Test files
- ✅ Utility scripts

## What NOT to Commit
- ❌ Backup files (*.backup.*, *_new.*, temp_*)
- ❌ IDE-specific files
- ❌ Operating system files
- ❌ Temporary files
- ❌ Large binary files (unless necessary)

## File Cleanup Before Commits
```bash
# Remove backup files
del src\data\*.backup.*

# Check for temporary files
dir temp_* /s

# Verify clean status
git status
```

## Commit Process
1. **Stage changes**: `git add .` (after cleanup)
2. **Review staged**: `git diff --cached`
3. **Commit with message**: `git commit -m "🔧 Fix: Description"`
4. **Push changes**: `git push`

## Emergency Procedures
- **Database corruption**: Restore from last known good backup
- **Accidental deletion**: Use `git checkout -- filename`
- **Wrong commit**: Use `git reset --soft HEAD~1` to undo last commit
- **Branch conflicts**: Always backup before merging
