# ✅ GitHub Release Checklist

## What You Need to Do

**YES, you need to manually upload files to GitHub Releases.** GitHub doesn't automatically create releases from your builds.

## Quick Checklist

- [ ] Build the applications: `npm run build:all`
- [ ] Go to GitHub Releases page
- [ ] Create a new release with tag `v1.0.0`
- [ ] Upload 6 files from `dist/` folder
- [ ] Add release notes
- [ ] Publish the release

## Detailed Steps

### 1. Build the Apps (Already Done ✅)

The apps are already built in the `dist/` folder. If you need to rebuild:

```bash
npm run build:all
```

### 2. Files Ready for Upload

These files are in `/Users/jingjietan/Desktop/doi2bib/dist/`:

**macOS:**
- `DOI2BibTeX-1.0.0.dmg` (~95 MB)
- `DOI2BibTeX-1.0.0-arm64.dmg` (~90 MB)
- `DOI2BibTeX-1.0.0-mac.zip` (~92 MB)
- `DOI2BibTeX-1.0.0-arm64-mac.zip` (~87 MB)

**Windows:**
- `DOI2BibTeX Setup 1.0.0.exe` (~138 MB)
- `DOI2BibTeX 1.0.0.exe` (~73 MB)

**Total:** ~575 MB

### 3. Create GitHub Release

1. **Go to:** https://github.com/jingjie00/doi2bibtex/releases
2. **Click:** "Create a new release" (or "Draft a new release")
3. **Tag:** Create new tag `v1.0.0`
4. **Title:** `v1.0.0` or `Release v1.0.0`
5. **Description:** Copy from template below
6. **Upload files:** Drag all 6 files from `dist/` folder
7. **Click:** "Publish release"

### 4. Release Notes Template

Copy and paste this:

```markdown
## 🎉 Initial Release

First release of DOI2BibTeX desktop application!

## ✨ Features

- Convert DOIs to BibTeX format instantly
- Automatic Related DOI extraction for arXiv papers
- **Bypasses CORS restrictions** - faster and more reliable than web version
- Clean, modern UI with dark/light theme support
- Works offline after initial fetch

## 📥 Downloads

### macOS
- **Intel Macs:** `DOI2BibTeX-1.0.0.dmg` or `DOI2BibTeX-1.0.0-mac.zip`
- **Apple Silicon (M1/M2/M3):** `DOI2BibTeX-1.0.0-arm64.dmg` or `DOI2BibTeX-1.0.0-arm64-mac.zip`

### Windows
- **Installer:** `DOI2BibTeX Setup 1.0.0.exe` (recommended)
- **Portable:** `DOI2BibTeX 1.0.0.exe` (no installation needed)

## 📝 Installation

See the [README](https://github.com/jingjie00/doi2bibtex#download-desktop-app) for detailed installation instructions.

## ⚠️ Note

These apps are not code-signed. You may see security warnings on first launch:
- **macOS:** Right-click → Open → Click "Open" in dialog
- **Windows:** Click "More info" → "Run anyway"
```

## After Publishing

Once published, users can:
- Visit the Releases page
- Download the appropriate file for their system
- Follow installation instructions in the README

The README already has links pointing to the Releases page, so everything is connected!

## Future Releases

For version updates:
1. Update version in `package.json`
2. Run `npm run build:all`
3. Create new release with new tag (e.g., `v1.1.0`)
4. Upload new files
5. Update release notes

