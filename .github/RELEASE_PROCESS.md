# SysTracker Release Process

This document outlines the standard process for creating new releases of SysTracker.

---

## 📋 Pre-Release Checklist

Before creating a new release, ensure the following:

- [ ] All changes are committed and pushed to the `main` branch
- [ ] All tests pass (if automated tests exist)
- [ ] Version numbers are updated in:
  - [ ] `package.json` files (server, dashboard, agent)
  - [ ] Agent version strings
  - [ ] Documentation references
- [ ] `CHANGELOG.md` is updated with new version entry
- [ ] Build artifacts are tested locally:
  - [ ] Dashboard builds successfully (`npm run build`)
  - [ ] Server runs without errors
  - [ ] Agent executable works on Windows
- [ ] Documentation is up to date
- [ ] All changes are pushed to the `new reasese version with proper tags`

---

## 🚀 Release Steps

### 1. Update CHANGELOG.md

Add a new entry at the top of `CHANGELOG.md`:

```markdown
## [vX.Y.Z] - YYYY-MM-DD
### ✨ New Features
- Feature descriptions...

### 🐛 Bug Fixes
- Bug fix descriptions...

### 🔧 Technical Improvements
- Technical improvement descriptions...
```

Use the template in [RELEASE_TEMPLATE.md](RELEASE_TEMPLATE.md) for guidance.

### 2. Commit Changes

```bash
git add -A
git commit -m "chore: Prepare release vX.Y.Z

- Update CHANGELOG.md with release notes
- Update version numbers
- Update documentation"
```

### 3. Create Git Tag

Create an annotated tag with release notes:

```bash
git tag -a vX.Y.Z -m "SysTracker vX.Y.Z - Release Title

Brief description of the release highlights:
- Major feature or fix 1
- Major feature or fix 2
- Major feature or fix 3"
```

### 4. Push to GitHub

Push both the commit and the tag:

```bash
git push origin main vX.Y.Z
```

This will trigger the GitHub Actions workflow to build and publish the release automatically.

### 5. Update GitHub Release Notes

After the automated release is created, update it with comprehensive notes:

```bash
gh release edit vX.Y.Z \
  --title "SysTracker vX.Y.Z - Release Title" \
  --notes-file .github/RELEASE_NOTES.md
```

Or manually edit on GitHub using the [RELEASE_TEMPLATE.md](RELEASE_TEMPLATE.md) as a guide.

**Important sections to include:**
- What's New (features, improvements, bug fixes)
- Installation instructions
- System requirements
- Known issues
- Upgrade notes (if applicable)
- Full changelog link

### 6. Verify Release

- [ ] Check that GitHub Actions build completed successfully
- [ ] Verify all artifacts are attached to the release:
  - `SysTracker_Agent.exe`
  - `SysTracker_Server.exe` (Windows)
  - `SysTracker_Server` (Linux)
- [ ] Test download links work
- [ ] Verify Docker image was published to GHCR
- [ ] Check that the release is marked as "Latest"

### 7. Announce Release

After verification:
- [ ] Update project README if needed
- [ ] Post announcement in discussions/community channels
- [ ] Update any external documentation or guides

---

## 📌 Version Numbering

SysTracker follows [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes, major overhauls
- **Minor (0.X.0)**: New features, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Examples:
- `v2.8.0` → `v2.9.0`: Added new monitoring features
- `v2.8.5` → `v2.8.6`: Fixed bugs, updated dependencies
- `v2.9.9` → `v3.0.0`: Complete architecture rewrite

---

## 🔧 Quick Release Script

For convenience, here's a quick script to automate common release tasks:

```bash
#!/bin/bash
# release.sh - Quick release script for SysTracker

VERSION=$1
TITLE=$2

if [ -z "$VERSION" ] || [ -z "$TITLE" ]; then
    echo "Usage: ./release.sh vX.Y.Z 'Release Title'"
    exit 1
fi

echo "Creating release $VERSION..."

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Stage changes
git add -A

# Commit
git commit -m "chore: Prepare release $VERSION"

# Create tag
git tag -a $VERSION -m "SysTracker $VERSION - $TITLE"

# Push
git push origin main $VERSION

echo "Release $VERSION created and pushed!"
echo "GitHub Actions will build the release automatically."
echo "Remember to update the GitHub Release notes!"
```

Make it executable: `chmod +x release.sh`

Usage: `./release.sh v2.8.7 "Bug Fix Release"`

---

## 🐛 Hotfix Process

For urgent bug fixes that need immediate release:

1. Create a hotfix branch from the latest tag:
   ```bash
   git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z
   ```

2. Apply the fix and commit:
   ```bash
   git commit -m "fix: Critical bug description"
   ```

3. Update CHANGELOG.md with hotfix entry

4. Merge to main:
   ```bash
   git checkout main
   git merge --no-ff hotfix/vX.Y.Z+1
   ```

5. Follow normal release process from step 3

---

## 📦 Build Artifacts

Ensure these are included in every release:

### Required
- `SysTracker_Agent.exe` - Windows agent executable
- Release notes (comprehensive)

### Optional
- `SysTracker_Server.exe` - Windows server executable
- `SysTracker_Server` - Linux server executable
- Docker image published to GHCR
- Source code archives (auto-generated by GitHub)

---

## 🔍 Post-Release Monitoring

After releasing, monitor for:

- GitHub Issues for new bug reports
- GitHub Discussions for user feedback
- Docker Hub/GHCR download statistics
- CI/CD pipeline health

Address critical issues with hotfix releases if needed.

---

## 📚 Additional Resources

- [RELEASE_TEMPLATE.md](RELEASE_TEMPLATE.md) - Template for release notes
- [GitHub Actions Workflows](../.github/workflows/) - Automated build pipelines
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Semantic Versioning](https://semver.org/) - Versioning standard

---

**Last Updated**: February 20, 2026
