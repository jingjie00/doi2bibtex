# DOI to BibTeX Converter

A web application to convert DOIs to BibTeX format with automatic arXiv Related DOI extraction and pagination. Available as a web app or standalone desktop application (macOS and Windows).

## 🚀 Quick Start

**Want to use the desktop app?** [Download it here →](https://github.com/jingjie00/doi2bibtex/releases)

1. Go to the [Releases page](https://github.com/jingjie00/doi2bibtex/releases)
2. Download the file for your system (macOS or Windows)
3. Install and run (see detailed instructions below)

**Want to run the web version?** See [Running Locally](#running-locally-web-version) section below.

## Features

- Convert any DOI to BibTeX format
- Automatic detection and extraction of Related DOIs from arXiv papers
- **Bypasses CORS restrictions** when running as Electron app
- Clean, modern UI with dark/light theme support
- Standalone desktop applications for macOS and Windows

## 📥 Download Desktop App

**Ready-to-use desktop applications are available for download!** These apps bypass CORS restrictions and work faster than the web version.

### How to Download

1. **Go to the Releases page:**
   - Visit: [https://github.com/jingjie00/doi2bibtex/releases](https://github.com/jingjie00/doi2bibtex/releases)
   - Or click "Releases" on the right sidebar of the GitHub repository

2. **Find the latest release:**
   - Look for the most recent version (e.g., `v1.0.0`)
   - Click on the release to see all available downloads

3. **Download the file for your system** (see instructions below)

---

### 🍎 macOS Download & Installation

#### Step 1: Choose the Right File

**Check your Mac type:**
- **Apple Silicon (M1/M2/M3/M4):** Download `DOI2BibTeX-1.0.0-arm64.dmg` or `DOI2BibTeX-1.0.0-arm64-mac.zip`
- **Intel Mac:** Download `DOI2BibTeX-1.0.0.dmg` or `DOI2BibTeX-1.0.0-mac.zip`

*Not sure? Click the Apple menu → About This Mac. If you see "Chip: Apple M1/M2/M3", use the arm64 version.*

#### Step 2: Download

- Click on the file name in the Releases page
- The file will download to your Downloads folder (~90-95 MB)

#### Step 3: Install

**If you downloaded a DMG file:**
1. Open the `.dmg` file from Downloads
2. A window will open showing `DOI2BibTeX.app`
3. Drag `DOI2BibTeX.app` to your **Applications** folder
4. Eject the DMG (drag to Trash or press Cmd+E)
5. Open **Applications** folder and double-click `DOI2BibTeX.app`

**If you downloaded a ZIP file:**
1. Double-click the `.zip` file to extract it
2. You'll see `DOI2BibTeX.app` in the extracted folder
3. Drag `DOI2BibTeX.app` to your **Applications** folder
4. Open **Applications** folder and double-click `DOI2BibTeX.app`

#### Step 4: First Launch (Security Warning)

macOS may show a security warning because the app isn't code-signed. Here's how to open it:

1. **Right-click** (or Control+click) on `DOI2BibTeX.app`
2. Select **"Open"** from the menu
3. Click **"Open"** in the security dialog
4. The app will launch and remember this choice for future launches

*This is normal for unsigned apps and only happens the first time.*

---

### 🪟 Windows Download & Installation

#### Step 1: Choose Your Version

**Option A: Installer (Recommended for most users)**
- Download: `DOI2BibTeX Setup 1.0.0.exe` (~138 MB)
- This creates a proper installation with Start Menu entry

**Option B: Portable Version (No installation)**
- Download: `DOI2BibTeX 1.0.0.exe` (~73 MB)
- Run directly from anywhere, no installation needed

#### Step 2: Download

- Click on the file name in the Releases page
- The file will download to your Downloads folder

#### Step 3: Install/Run

**If you downloaded the Installer (`DOI2BibTeX Setup 1.0.0.exe`):**
1. Double-click the downloaded `.exe` file
2. If Windows SmartScreen appears:
   - Click **"More info"**
   - Click **"Run anyway"** (the app is safe, just unsigned)
3. Follow the installation wizard
4. The app will be installed in your Programs folder
5. Launch from Start Menu or desktop shortcut

**If you downloaded the Portable version (`DOI2BibTeX 1.0.0.exe`):**
1. Extract or move the `.exe` file to any folder you want
2. Double-click `DOI2BibTeX 1.0.0.exe` to run
3. No installation needed - just run it whenever you need it!

**Note:** Windows SmartScreen may warn about unsigned apps. Click "More info" → "Run anyway" if you trust the source. This is normal for apps not distributed through the Microsoft Store.

## Running Locally (Web Version)

### Option 1: Using npm (Recommended)

1. Install dependencies (if needed):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run web
   ```
   
   This will automatically open your browser at `http://localhost:8080`

### Option 2: Using Python

If you have Python installed:

```bash
# Python 3
cd web
python3 -m http.server 8080

# Python 2
cd web
python -m SimpleHTTPServer 8080
```

Then open `http://localhost:8080` in your browser.

### Option 3: Using Node.js http-server directly

```bash
cd web
npx http-server . -p 8080
```

Then open `http://localhost:8080` in your browser.

## Running Electron App Locally

To run the Electron version locally (bypasses CORS):

```bash
npm install
npm start
```

## Building Desktop Apps

To build the desktop applications yourself:

```bash
# Install dependencies
npm install

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for both
npm run build:all
```

Built files will be in the `dist/` directory.

## Deployment

### Web Version

This project is configured for Firebase Hosting. Deploy using:

```bash
firebase deploy
```

### Desktop Apps (GitHub Releases)

**⚠️ IMPORTANT: You need to manually upload the built files to GitHub Releases for users to download them.**

#### Step-by-Step Guide to Create a GitHub Release:

1. **Build the applications first:**
   ```bash
   npm run build:all
   ```
   This creates all the `.app`, `.dmg`, `.exe` files in the `dist/` folder.

2. **Go to GitHub:**
   - Visit: `https://github.com/jingjie00/doi2bibtex`
   - Click **"Releases"** (in the right sidebar or repository header)
   - Click **"Create a new release"** button

3. **Create the release:**
   - **Tag version:** Click "Choose tag" → Type `v1.0.0` → Create new tag
   - **Release title:** `v1.0.0` or `Release v1.0.0`
   - **Description:** Add release notes (see template below)

4. **Upload the files:**
   - Scroll down to **"Attach binaries by dropping them here or selecting them"**
   - Drag and drop these **6 files** from your `dist/` folder:
     - ✅ `DOI2BibTeX-1.0.0.dmg` (macOS Intel - DMG)
     - ✅ `DOI2BibTeX-1.0.0-arm64.dmg` (macOS Apple Silicon - DMG)
     - ✅ `DOI2BibTeX-1.0.0-mac.zip` (macOS Intel - ZIP)
     - ✅ `DOI2BibTeX-1.0.0-arm64-mac.zip` (macOS Apple Silicon - ZIP)
     - ✅ `DOI2BibTeX Setup 1.0.0.exe` (Windows Installer)
     - ✅ `DOI2BibTeX 1.0.0.exe` (Windows Portable)

5. **Publish:**
   - Click **"Publish release"** button
   - Wait for uploads to complete (files are large, ~500MB total)
   - Your release is now live! Users can download from the Releases page.

#### Release Notes Template:

```markdown
## 🎉 What's New

- Initial release of DOI2BibTeX desktop application
- Bypasses CORS restrictions for faster, more reliable DOI fetching
- Supports macOS (Intel & Apple Silicon) and Windows

## 📥 Downloads

### macOS
- **Intel Macs:** Download `DOI2BibTeX-1.0.0.dmg` or `DOI2BibTeX-1.0.0-mac.zip`
- **Apple Silicon (M1/M2/M3):** Download `DOI2BibTeX-1.0.0-arm64.dmg` or `DOI2BibTeX-1.0.0-arm64-mac.zip`

### Windows
- **Installer (Recommended):** Download `DOI2BibTeX Setup 1.0.0.exe`
- **Portable:** Download `DOI2BibTeX 1.0.0.exe` (no installation needed)

## 🚀 Features

- Convert DOIs to BibTeX format instantly
- Automatic Related DOI extraction for arXiv papers
- No CORS restrictions - direct API access
- Clean, modern UI with dark/light theme
```

**Note:** For detailed instructions, see [GITHUB_RELEASES.md](GITHUB_RELEASES.md)

## Usage

1. Enter a DOI or DOI URL in the input field
2. Click "Convert" or press Enter
3. For arXiv DOIs, the app will automatically detect and fetch the Related DOI
4. Use Previous/Next buttons to navigate through multiple results (2 per page)
5. Copy the BibTeX output using the Copy button

## Example DOIs

- Regular DOI: `10.1038/s41586-020-2649-2`
- arXiv DOI: `10.48550/arXiv.2512.06991`
- Full URL: `https://doi.org/10.48550/arXiv.2512.06991`
- arXiv URL: `arxiv.org/abs/2512.06991`

## Advantages of Desktop App

- **No CORS restrictions** - Direct API access without proxy delays
- **Faster performance** - No network latency from CORS proxies
- **Offline capability** - Works without internet (after initial fetch)
- **Better reliability** - No dependency on third-party CORS proxy services
