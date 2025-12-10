# DOI to BibTeX Converter

A web application to convert DOIs to BibTeX format with automatic arXiv Related DOI extraction and pagination.

## Features

- Convert any DOI to BibTeX format
- Automatic detection and extraction of Related DOIs from arXiv papers
- Paginated results (2 per page) with navigation
- Clean, modern UI with dark/light theme support

## Running Locally

### Option 1: Using npm (Recommended)

1. Install dependencies (if needed):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   
   This will automatically open your browser at `http://localhost:8080`

### Option 2: Using Python

If you have Python installed:

```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Then open `http://localhost:8080` in your browser.

### Option 3: Using Node.js http-server directly

```bash
npx http-server . -p 8080
```

Then open `http://localhost:8080` in your browser.

## Deployment

This project is configured for Firebase Hosting. Deploy using:

```bash
firebase deploy
```

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

