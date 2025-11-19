import { logVisit } from './firebase-logger.js';

document.addEventListener('DOMContentLoaded', () => {
    logVisit();
    const doiInput = document.getElementById('doi-input');
    const convertBtn = document.getElementById('convert-btn');
    const errorMsg = document.getElementById('error-msg');
    // const outputGroup = document.getElementById('output-group'); // Always visible now
    const bibtexOutput = document.getElementById('bibtex-output');
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('copy-text');
    const themeToggle = document.getElementById('theme-toggle');

    // Options
    const removeAbstractCheckbox = document.getElementById('remove-abstract');
    const removeKeywordsCheckbox = document.getElementById('remove-keywords');
    const beautifyCheckbox = document.getElementById('beautify-bibtex');

    let currentRawBibtex = null;

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    convertBtn.addEventListener('click', handleConversion);
    doiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConversion();
    });

    // Instant updates on option change
    [removeAbstractCheckbox, removeKeywordsCheckbox, beautifyCheckbox].forEach(el => {
        el.addEventListener('change', () => {
            if (currentRawBibtex) {
                renderOutput();
            }
        });
    });

    copyBtn.addEventListener('click', async () => {
        const text = bibtexOutput.textContent;
        if (!text || bibtexOutput.classList.contains('placeholder')) return;

        try {
            await navigator.clipboard.writeText(text);
            const originalText = copyText.textContent;
            copyText.textContent = 'Copied!';
            setTimeout(() => {
                copyText.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    async function handleConversion() {
        const input = doiInput.value.trim();
        if (!input) {
            showError('Please enter a DOI.');
            return;
        }

        clearError();
        setLoading(true);

        try {
            const doi = extractDOI(input);
            if (!doi) {
                throw new Error('Invalid DOI format.');
            }

            currentRawBibtex = await fetchBibTeX(doi);
            renderOutput();

            // Enable copy button
            copyBtn.disabled = false;
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function renderOutput() {
        if (!currentRawBibtex) return;
        const processedBibtex = processBibTeX(currentRawBibtex);
        bibtexOutput.textContent = processedBibtex;
        bibtexOutput.classList.remove('placeholder');
    }

    function extractDOI(input) {
        // Regex to match DOI patterns
        // Matches:
        // 1. 10.xxxx/yyyy
        // 2. https://doi.org/10.xxxx/yyyy
        // 3. http://dx.doi.org/10.xxxx/yyyy
        const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)\b/;
        const match = input.match(doiRegex);
        return match ? match[1] : null;
    }

    async function fetchBibTeX(doi) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(`https://doi.org/${doi}`, {
                headers: {
                    'Accept': 'application/x-bibtex'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) throw new Error('DOI not found.');
                throw new Error(`Server error: ${response.status}`);
            }

            return await response.text();
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('Request timed out.');
            }
            throw err;
        }
    }

    function processBibTeX(bibtex) {
        const removeAbstract = removeAbstractCheckbox.checked;
        const removeKeywords = removeKeywordsCheckbox.checked;
        const beautify = beautifyCheckbox.checked;

        // Common: Extract Author and Year for Key Generation
        let newKey = null;
        let author = null;
        let year = null;

        // Extract Author
        const authorMatch = bibtex.match(/author\s*=\s*[{"'](.+?)[}"']/i);
        if (authorMatch) {
            const authors = authorMatch[1];
            const firstAuthor = authors.split(/\s+and\s+/i)[0].trim();
            if (firstAuthor.includes(',')) {
                author = firstAuthor.split(',')[0].trim();
            } else {
                const parts = firstAuthor.split(/\s+/);
                author = parts[parts.length - 1];
            }
            author = author.replace(/[^a-zA-Z]/g, '');
        }

        // Extract Year
        const yearMatch = bibtex.match(/year\s*=\s*[{"]?(\d{4})[}"]?/i);
        if (yearMatch) {
            year = yearMatch[1];
        }

        if (author && year) {
            newKey = `${author}${year}`;
        }

        if (beautify) {
            // --- BEAUTIFY ON: Token-based reconstruction ---
            let entryType = 'article';
            let currentKey = 'key';

            const headerMatch = bibtex.match(/@(\w+)\s*\{\s*([^,]+),/);
            if (headerMatch) {
                entryType = headerMatch[1];
                currentKey = headerMatch[2];
            }

            const bodyStart = bibtex.indexOf('{');
            const bodyEnd = bibtex.lastIndexOf('}');

            if (bodyStart === -1 || bodyEnd === -1) return bibtex;

            let bodyContent = bibtex.substring(bodyStart + 1, bodyEnd);
            const firstComma = bodyContent.indexOf(',');
            if (firstComma !== -1) {
                bodyContent = bodyContent.substring(firstComma + 1);
            }

            const fieldParts = bodyContent.split(/,\s*(?=[a-zA-Z0-9-]+\s*=)/);
            let output = `@${entryType}{${newKey || currentKey},\n`;

            fieldParts.forEach(part => {
                part = part.trim();
                if (!part) return;

                const match = part.match(/^([a-zA-Z0-9-]+)\s*=\s*([\s\S]*)$/);
                if (match) {
                    const fieldName = match[1].toLowerCase();
                    let fieldValue = match[2].trim();

                    if (fieldValue.endsWith(',')) {
                        fieldValue = fieldValue.slice(0, -1).trim();
                    }

                    if (removeAbstract && fieldName === 'abstract') return;
                    if (removeKeywords && fieldName === 'keywords') return;

                    output += `  ${fieldName} = ${fieldValue},\n`;
                }
            });

            output += '}';
            return output;

        } else {
            // --- BEAUTIFY OFF: Line-based preservation ---
            const lines = bibtex.split('\n');
            let firstLineIndex = -1;

            // Find first line
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('@') && lines[i].includes('{')) {
                    firstLineIndex = i;
                    break;
                }
            }

            const newLines = [];
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                // Replace key
                if (i === firstLineIndex && newKey) {
                    line = line.replace(/@(\w+)\{([^,]+),/, `@$1{${newKey},`);
                }

                // Remove abstract/keywords
                const lowerLine = line.trim().toLowerCase();
                if (removeAbstract && lowerLine.startsWith('abstract')) continue;
                if (removeKeywords && lowerLine.startsWith('keywords')) continue;

                newLines.push(line);
            }

            return newLines.join('\n');
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('visible');
    }

    function clearError() {
        errorMsg.textContent = '';
        errorMsg.classList.remove('visible');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            convertBtn.classList.add('loading');
            convertBtn.disabled = true;
        } else {
            convertBtn.classList.remove('loading');
            convertBtn.disabled = false;
        }
    }
});
