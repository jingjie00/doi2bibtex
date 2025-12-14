# GitHub Releases Guide

This guide explains how to publish the desktop applications to GitHub Releases.

## Prerequisites

1. Build the applications:
   ```bash
   npm run build:all
   ```

2. Verify the `dist/` folder contains:
   - macOS files:
     - `DOI2BibTeX-1.0.0.dmg` (Intel Macs)
     - `DOI2BibTeX-1.0.0-arm64.dmg` (Apple Silicon Macs)
     - `DOI2BibTeX-1.0.0-mac.zip` (Intel Macs - ZIP)
     - `DOI2BibTeX-1.0.0-arm64-mac.zip` (Apple Silicon Macs - ZIP)
   - Windows files:
     - `DOI2BibTeX Setup 1.0.0.exe` (Installer)
     - `DOI2BibTeX 1.0.0.exe` (Portable)

## Creating a GitHub Release

### Step 1: Create a New Release

1. Go to your GitHub repository: `https://github.com/jingjie00/doi2bibtex`
2. Click on **"Releases"** (right sidebar or repository header)
3. Click **"Create a new release"** or **"Draft a new release"**

### Step 2: Fill in Release Information

1. **Choose a tag:**
   - Click "Choose tag" → Create new tag
   - Tag: `v1.0.0` (follow semantic versioning)
   - Description: "Initial release" or your release notes

2. **Release title:**
   - `v1.0.0` or `Release v1.0.0`

3. **Describe this release:**
   ```markdown
   ## What's New
   
   - Initial release of DOI2BibTeX desktop app
   - Bypasses CORS restrictions
   - Supports macOS (Intel & Apple Silicon) and Windows
   
   ## Downloads
   
   ### macOS
   - **Intel Macs:** Download `DOI2BibTeX-1.0.0.dmg` or `DOI2BibTeX-1.0.0-mac.zip`
   - **Apple Silicon (M1/M2/M3):** Download `DOI2BibTeX-1.0.0-arm64.dmg` or `DOI2BibTeX-1.0.0-arm64-mac.zip`
   
   ### Windows
   - **Installer:** Download `DOI2BibTeX Setup 1.0.0.exe` (recommended)
   - **Portable:** Download `DOI2BibTeX 1.0.0.exe` (no installation needed)
   ```

### Step 3: Upload Release Assets

1. Scroll down to **"Attach binaries"** section
2. Drag and drop these files from your `dist/` folder:

   **macOS:**
   - `DOI2BibTeX-1.0.0.dmg`
   - `DOI2BibTeX-1.0.0-arm64.dmg`
   - `DOI2BibTeX-1.0.0-mac.zip`
   - `DOI2BibTeX-1.0.0-arm64-mac.zip`

   **Windows:**
   - `DOI2BibTeX Setup 1.0.0.exe`
   - `DOI2BibTeX 1.0.0.exe`

3. Wait for uploads to complete (files are large, ~70-140MB each)

### Step 4: Publish

1. Click **"Publish release"** (or **"Update release"** if editing)
2. Your release is now live!

## Updating Releases

For future versions:

1. Update version in `package.json`
2. Rebuild: `npm run build:all`
3. Go to Releases → Edit the release
4. Upload new files
5. Update release notes
6. Save changes

## Optional: Automated Releases with GitHub Actions

You can automate this process using GitHub Actions. Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/**
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This will automatically build and upload releases when you push a version tag.

## File Sizes

Expected file sizes:
- macOS DMG: ~90-95 MB
- macOS ZIP: ~87-92 MB
- Windows Installer: ~138 MB
- Windows Portable: ~73 MB

Total upload size: ~500-600 MB per release

## Notes

- GitHub has a 2GB limit per file and 10GB per release
- Large files may take several minutes to upload
- Users can download directly from the Releases page
- GitHub automatically generates download counts

