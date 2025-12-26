# Git Workflow

## Worktree Rules

All git worktrees MUST be created in `.trees/` directory:

```bash
# Correct
git worktree add .trees/feature-branch feature-branch
git worktree add .trees/bugfix-123 -b bugfix-123

# Incorrect - never do this
git worktree add ../feature-branch feature-branch
```

## Complete Workflow

```bash
# 1. Create worktree
git worktree add .trees/new-feature -b new-feature

# 2. Work in worktree
cd .trees/new-feature
# ... make changes, commit ...

# 3. Return to main
cd ../../
git checkout main

# 4. Merge
git merge new-feature

# 5. Cleanup
git worktree remove .trees/new-feature
git branch -d new-feature
```

## Why `.trees/`

- Organized in single folder
- Prevents workspace clutter
- Already in .gitignore
- Predictable and scriptable
