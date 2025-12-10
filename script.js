import { logVisit } from './firebase-logger.js';

document.addEventListener('DOMContentLoaded', () => {
    logVisit();
    const doiInput = document.getElementById('doi-input');
    const convertBtn = document.getElementById('convert-btn');
    const errorMsg = document.getElementById('error-msg');
    // const outputGroup = document.getElementById('output-group'); // Always visible now
    const bibtexOutput = document.getElementById('bibtex-output');
    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');

    // Helper function to check if user is in an editable area
    function isInEditableArea(element) {
        if (!element) return false;
        
        // Check if it's the DOI input
        if (element === doiInput) return true;
        
        // Check if it's any input or textarea
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') return true;
        
        // Check if it's a contenteditable element (code-wrapper)
        if (element.isContentEditable) return true;
        
        // Check if it's inside a code-wrapper (contenteditable code element)
        const codeWrapper = element.closest('.code-wrapper');
        if (codeWrapper) {
            const codeElement = codeWrapper.querySelector('code[contenteditable="true"]');
            if (codeElement && (element === codeElement || codeElement.contains(element))) {
                return true;
            }
        }
        
        return false;
    }

    // Global paste detection - detect Cmd+V or Ctrl+V when page is active
    // Works even when input is not focused, but disabled if user is in editable area
    document.addEventListener('keydown', (e) => {
        // Check for Cmd+V (Mac) or Ctrl+V (Windows/Linux)
        const isPaste = (e.metaKey || e.ctrlKey) && e.key === 'v';
        
        if (isPaste) {
            const activeElement = document.activeElement;
            
            // Only intercept if user is NOT in any editable area
            if (!isInEditableArea(activeElement)) {
                e.preventDefault();
                e.stopPropagation();
                
                // Focus the input first
                doiInput.focus();
                
                // Small delay to ensure input is focused, then get clipboard
                setTimeout(() => {
                    navigator.clipboard.readText().then(text => {
                        if (text && text.trim()) {
                            doiInput.value = text.trim();
                            // Clear any existing error
                            clearError();
                        }
                    }).catch(err => {
                        // If clipboard API fails, just focus the input
                        // User can manually paste
                        console.log('Could not read clipboard, input is focused for manual paste');
                    });
                }, 10);
            }
            // If user is in editable area, let normal paste behavior happen
        }
    });
    
    // Also listen for paste event as fallback
    document.addEventListener('paste', (e) => {
        const activeElement = document.activeElement;
        
        // Only intercept if user is NOT in any editable area
        if (!isInEditableArea(activeElement)) {
            e.preventDefault();
            doiInput.focus();
            
            // Get clipboard data from paste event
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (pastedText && pastedText.trim()) {
                setTimeout(() => {
                    doiInput.value = pastedText.trim();
                    clearError();
                }, 10);
            }
        }
        // If user is in editable area, let normal paste behavior happen
    }, true); // Use capture phase to intercept early

    // Options
    const removeAbstractCheckbox = document.getElementById('remove-abstract');
    const removeKeywordsCheckbox = document.getElementById('remove-keywords');
    const beautifyCheckbox = document.getElementById('beautify-bibtex');

    let currentRawBibtex = null;
    let allBibtexResults = []; // Array to store multiple BibTeX results
    let arxivResult = null; // Store arXiv BibTeX separately
    let relatedResult = null; // Store Related DOI BibTeX separately

    // Theme Logic
    const savedTheme = localStorage.getItem('theme') || 'light';
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
            if (allBibtexResults.length > 0) {
                renderOutput();
            }
        });
    });

    // Font size control
    if (fontSizeSlider && fontSizeValue) {
        const savedFontSize = localStorage.getItem('fontSize') || '0.9';
        fontSizeSlider.value = savedFontSize;
        updateFontSize(savedFontSize);
        
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            updateFontSize(size);
            localStorage.setItem('fontSize', size);
        });
    }
    
    function updateFontSize(size) {
        if (!fontSizeValue) return;
        
        const sizeRem = `${size}rem`;
        fontSizeValue.textConte
        nt = size;
        
        // Apply to all code elements
        const codeElements = document.querySelectorAll('.code-wrapper code');
        codeElements.forEach(code => {
            code.style.fontSize = sizeRem;
        });
    }


    async function handleConversion() {
        const input = doiInput.value.trim();
        if (!input) {
            showError('Please enter a DOI.');
            return;
        }

        clearError();
        setLoading(true);

        try {
            // Check if user entered multiple DOIs (comma-separated)
            const inputParts = input.split(',').map(s => s.trim()).filter(s => s);
            let doisToFetch = [];
            
            for (const part of inputParts) {
                console.log(`🔍 Processing input part: "${part}"`);
                const doi = extractDOI(part);
                if (doi) {
                    console.log(`✅ Extracted DOI: ${doi}`);
                    doisToFetch.push(doi);
                } else {
                    console.warn(`⚠️ Could not extract DOI from: "${part}"`);
                }
            }
            
            if (doisToFetch.length === 0) {
                throw new Error('Invalid DOI or URL format. Enter a DOI, DOI URL, or arXiv URL (e.g., arxiv.org/abs/2512.06991).');
            }
            
            console.log(`📋 Extracted ${doisToFetch.length} DOI(s) to fetch:`, doisToFetch);
            
            // Remove duplicates
            doisToFetch = [...new Set(doisToFetch)];
            
            // Check if any is an arXiv DOI and try to extract Related DOI
            const arxivDOIs = doisToFetch.filter(d => isArxivDOI(d));
            
            // Try to extract Related DOI for each arXiv DOI (if not already provided)
            for (const arxivDOI of arxivDOIs) {
                // Skip if Related DOI is already in the list
                const hasRelated = doisToFetch.some(d => !isArxivDOI(d) && d !== arxivDOI);
                if (hasRelated) {
                    console.log('✅ Related DOI already provided by user, skipping extraction');
                    continue;
                }
                
                console.log(`🔍 Detected arXiv DOI: ${arxivDOI}`);
                console.log('📡 Attempting to extract Related DOI from HTML page...');
                // Try to extract related DOI from HTML page
                // Note: This may fail due to CORS if doi.org redirects to arxiv.org
                try {
                    const relatedDOI = await extractRelatedDOI(arxivDOI);
                    if (relatedDOI) {
                        if (!doisToFetch.includes(relatedDOI)) {
                            console.log('✅ SUCCESS: Related DOI extracted:', relatedDOI);
                            console.log(`📝 Adding Related DOI to fetch list. Total DOIs to fetch: ${doisToFetch.length + 1}`);
                            doisToFetch.push(relatedDOI);
                        } else {
                            console.log('⚠️ Related DOI found but already in list:', relatedDOI);
                        }
                    } else {
                        console.log('❌ No Related DOI found in HTML');
                    }
                } catch (err) {
                    console.error(`❌ ERROR: Could not extract related DOI for ${arxivDOI}`);
                    console.error('   Error details:', err.message);
                    console.warn('💡 Tip: You can manually enter the Related DOI separated by a comma');
                    // Continue with existing DOIs
                }
            }
            
            // Remove duplicates again after adding Related DOIs
            doisToFetch = [...new Set(doisToFetch)];

            // Fetch BibTeX for all DOIs and separate arXiv from Related
            console.log(`\n📚 Fetching BibTeX for ${doisToFetch.length} DOI(s):`);
            doisToFetch.forEach((doi, idx) => {
                console.log(`   ${idx + 1}. ${doi}`);
            });
            
            arxivResult = null;
            relatedResult = null;
            allBibtexResults = [];
            
            for (let i = 0; i < doisToFetch.length; i++) {
                const doiToFetch = doisToFetch[i];
                const isArxiv = isArxivDOI(doiToFetch);
                try {
                    console.log(`\n🔄 [${i + 1}/${doisToFetch.length}] Fetching BibTeX for: ${doiToFetch}`);
                    const bibtex = await fetchBibTeX(doiToFetch);
                    const result = {
                        doi: doiToFetch,
                        bibtex: bibtex
                    };
                    
                    if (isArxiv) {
                        arxivResult = result;
                        console.log(`✅ [${i + 1}/${doisToFetch.length}] Successfully fetched arXiv BibTeX`);
                    } else {
                        relatedResult = result;
                        console.log(`✅ [${i + 1}/${doisToFetch.length}] Successfully fetched Related DOI BibTeX`);
                    }
                    
                    allBibtexResults.push(result);
                } catch (err) {
                    console.error(`❌ [${i + 1}/${doisToFetch.length}] Failed to fetch BibTeX for ${doiToFetch}:`, err.message);
                    // Continue with other DOIs
                }
            }
            
            console.log(`\n📊 Summary: ${allBibtexResults.length} out of ${doisToFetch.length} DOIs successfully fetched`);
            if (allBibtexResults.length > 0) {
                console.log('✅ Results ready for display');
            } else {
                console.error('❌ No results to display');
            }

            if (allBibtexResults.length === 0) {
                throw new Error('Failed to fetch BibTeX for any DOI.');
            }

            renderOutput();

            // Update font size for new code elements
            if (fontSizeSlider) {
                const currentFontSize = fontSizeSlider.value;
                updateFontSize(currentFontSize);
            }
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function renderOutput() {
        if (allBibtexResults.length === 0) return;

        // Display in separate boxes if we have both arXiv and Related DOI
        if (arxivResult && relatedResult) {
            renderDualOutput();
        } else {
            // Single result or multiple non-arXiv results - use original single box
            // Reset first box label
            const firstLabel = document.querySelector('#output-group label');
            if (firstLabel) {
                firstLabel.textContent = 'BibTeX Result';
            }
            
            let combinedBibtex = '';
            allBibtexResults.forEach((result, idx) => {
                const processed = processBibTeX(result.bibtex);
                combinedBibtex += processed;
                if (idx < allBibtexResults.length - 1) {
                    combinedBibtex += '\n\n';
                }
            });

            bibtexOutput.textContent = combinedBibtex;
            bibtexOutput.classList.remove('placeholder');
            
            // Apply font size
            if (fontSizeSlider) {
                bibtexOutput.style.fontSize = `${fontSizeSlider.value}rem`;
            }
            
            // Hide second code wrapper if it exists
            const secondCodeWrapper = document.getElementById('code-wrapper-2');
            if (secondCodeWrapper) {
                secondCodeWrapper.style.display = 'none';
            }
            
            // Hide separator if it exists
            const separator = document.querySelector('.separator-label');
            if (separator) {
                separator.style.display = 'none';
            }
            
            // Remove copy button from first code wrapper if it exists
            const firstCodeWrapper = document.querySelector('#output-group .code-wrapper');
            const firstCopyBtn = firstCodeWrapper?.querySelector('.code-copy-btn');
            if (firstCopyBtn) {
                firstCopyBtn.remove();
            }
        }
    }

    function renderDualOutput() {
        // Update label to show it contains both
        const firstLabel = document.querySelector('#output-group label');
        if (firstLabel) {
            firstLabel.textContent = 'BibTeX Results';
        }
        
        // Process Related DOI result (show at top)
        const processedRelated = processBibTeX(relatedResult.bibtex);
        bibtexOutput.textContent = processedRelated;
        bibtexOutput.classList.remove('placeholder');
        
        // Apply font size to first code element
        if (fontSizeSlider) {
            bibtexOutput.style.fontSize = `${fontSizeSlider.value}rem`;
        }
        
        // Add copy button to first code wrapper if not exists
        const firstCodeWrapper = document.querySelector('#output-group .code-wrapper');
        let firstCopyBtn = firstCodeWrapper.querySelector('.code-copy-btn');
        if (!firstCopyBtn) {
            firstCopyBtn = createCodeCopyButton('bibtex-output', 'copy-text-1');
            firstCodeWrapper.style.position = 'relative';
            firstCodeWrapper.appendChild(firstCopyBtn);
        }
        
        // Get or create second code wrapper for arXiv (show at bottom)
        let secondCodeWrapper = document.getElementById('code-wrapper-2');
        let secondBibtexOutput = document.getElementById('bibtex-output-2');
        
        if (!secondCodeWrapper) {
            // Create separator label
            const separatorLabel = document.createElement('div');
            separatorLabel.className = 'separator-label';
            separatorLabel.textContent = 'arXiv BibTeX';
            separatorLabel.style.marginTop = '1rem';
            separatorLabel.style.marginBottom = '0.5rem';
            separatorLabel.style.fontSize = '0.9rem';
            separatorLabel.style.fontWeight = '600';
            separatorLabel.style.color = 'var(--text-secondary)';
            
            // Clone the code wrapper
            secondCodeWrapper = firstCodeWrapper.cloneNode(true);
            secondCodeWrapper.id = 'code-wrapper-2';
            
            // Get the second output element
            secondBibtexOutput = secondCodeWrapper.querySelector('#bibtex-output');
            if (secondBibtexOutput) {
                secondBibtexOutput.id = 'bibtex-output-2';
                secondBibtexOutput.className = 'placeholder';
                // Make it editable
                secondBibtexOutput.setAttribute('contenteditable', 'true');
                secondBibtexOutput.setAttribute('spellcheck', 'false');
            }
            
            // Remove old copy button and add new one for second wrapper
            const oldCopyBtn = secondCodeWrapper.querySelector('.code-copy-btn');
            if (oldCopyBtn) {
                oldCopyBtn.remove();
            }
            const secondCopyBtn = createCodeCopyButton('bibtex-output-2', 'copy-text-2');
            secondCodeWrapper.style.position = 'relative';
            secondCodeWrapper.appendChild(secondCopyBtn);
            
            // Insert separator and second code wrapper after first code wrapper
            firstCodeWrapper.insertAdjacentElement('afterend', separatorLabel);
            separatorLabel.insertAdjacentElement('afterend', secondCodeWrapper);
        }
        
        // Process arXiv result (show at bottom)
        const processedArxiv = processBibTeX(arxivResult.bibtex);
        
        secondBibtexOutput.textContent = processedArxiv;
        secondBibtexOutput.classList.remove('placeholder');
        
        // Apply font size to second code element
        if (fontSizeSlider) {
            secondBibtexOutput.style.fontSize = `${fontSizeSlider.value}rem`;
        }
        
        secondCodeWrapper.style.display = 'block';
        
        // Show separator
        const separator = document.querySelector('.separator-label');
        if (separator) {
            separator.style.display = 'block';
        }
    }
    
    function createCodeCopyButton(outputId, textId) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn secondary-btn';
        copyBtn.innerHTML = `
            <span id="${textId}">Copy</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24264C20 6.71221 19.7893 6.20357 19.4142 5.82843L16.1716 2.58579C15.7964 2.21071 15.2878 2 14.7574 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        copyBtn.addEventListener('click', async () => {
            const output = document.getElementById(outputId);
            if (!output || output.classList.contains('placeholder')) return;
            
            // Get text content (works with editable elements)
            const text = output.textContent || output.innerText;
            if (!text) return;
            
            try {
                await navigator.clipboard.writeText(text);
                const copyText = document.getElementById(textId);
                if (copyText) {
                    const originalText = copyText.textContent;
                    copyText.textContent = 'Copied!';
                    setTimeout(() => {
                        copyText.textContent = originalText;
                    }, 2000);
                }
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
        
        return copyBtn;
    }

    function extractDOI(input) {
        // Clean input - remove whitespace
        const cleanInput = input.trim();
        
        if (!cleanInput) return null;
        
        // First, try to extract arXiv ID from arXiv URLs
        // Matches various arXiv URL formats:
        // 1. https://arxiv.org/abs/2512.06991
        // 2. http://arxiv.org/abs/2512.06991
        // 3. arxiv.org/abs/2512.06991
        // 4. https://arxiv.org/pdf/2512.06991.pdf
        // 5. https://arxiv.org/pdf/2512.06991
        // 6. arxiv:2512.06991
        // 7. arXiv:2512.06991
        // 8. 2512.06991 (standalone arXiv ID - YYMM.NNNNN format)
        // 9. 1201.1234 (older format - YYMM.NNNN)
        
        // Pattern 1: Full URLs with protocol (https:// or http://)
        let match = cleanInput.match(/https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})(?:\.pdf)?/i);
        if (match && match[1]) {
            const arxivId = match[1];
            console.log(`📄 Detected arXiv URL, extracted ID: ${arxivId}`);
            return `10.48550/arXiv.${arxivId}`;
        }
        
        // Pattern 2: URLs without protocol (arxiv.org/abs/...)
        match = cleanInput.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})(?:\.pdf)?/i);
        if (match && match[1]) {
            const arxivId = match[1];
            console.log(`📄 Detected arXiv URL (no protocol), extracted ID: ${arxivId}`);
            return `10.48550/arXiv.${arxivId}`;
        }
        
        // Pattern 3: arxiv: prefix format
        match = cleanInput.match(/arxiv:(\d{4}\.\d{4,5})/i);
        if (match && match[1]) {
            const arxivId = match[1];
            console.log(`📄 Detected arXiv prefix format, extracted ID: ${arxivId}`);
            return `10.48550/arXiv.${arxivId}`;
        }
        
        // Pattern 4: Standalone arXiv ID (must match YYMM.NNNNN or YYMM.NNNN format)
        // Only match if it looks like an arXiv ID (not part of a DOI)
        match = cleanInput.match(/^(\d{4}\.\d{4,5})$/);
        if (match && match[1] && !cleanInput.includes('10.')) {
            const arxivId = match[1];
            console.log(`📄 Detected standalone arXiv ID: ${arxivId}`);
            return `10.48550/arXiv.${arxivId}`;
        }
        
        // If not arXiv, try to match regular DOI patterns
        // Matches:
        // 1. 10.xxxx/yyyy
        // 2. https://doi.org/10.xxxx/yyyy
        // 3. http://dx.doi.org/10.xxxx/yyyy
        // 4. https://doi.org/10.xxxx/yyyy
        
        // Pattern 1: Full DOI URLs
        match = cleanInput.match(/(?:https?:\/\/)?(?:dx\.)?doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/i);
        if (match && match[1]) {
            console.log(`📄 Detected DOI URL: ${match[1]}`);
            return match[1];
        }
        
        // Pattern 2: Standalone DOI
        match = cleanInput.match(/\b(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)\b/);
        if (match && match[1]) {
            console.log(`📄 Detected standalone DOI: ${match[1]}`);
            return match[1];
        }
        
        console.warn(`⚠️ Could not extract DOI or arXiv ID from: "${cleanInput}"`);
        return null;
    }

    function isArxivDOI(doi) {
        // Check if DOI is an arXiv DOI (10.48550/arXiv.*)
        return /^10\.48550\/arXiv\./.test(doi);
    }

    async function extractRelatedDOI(arxivDOI) {
        // Use CORS proxy to fetch HTML from doi.org
        try {
            console.log('📡 Using CORS proxy to fetch HTML...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            
            // Try CORS proxy services
            const corsProxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://doi.org/${arxivDOI}`)}`,
                `https://corsproxy.io/?${encodeURIComponent(`https://doi.org/${arxivDOI}`)}`
            ];

            let html = null;
            for (const proxyUrl of corsProxies) {
                try {
                    console.log(`Trying CORS proxy: ${proxyUrl.substring(0, 50)}...`);
                    const proxyResponse = await fetch(proxyUrl, {
                        headers: {
                            'Accept': 'text/html'
                        },
                        signal: controller.signal,
                        mode: 'cors'
                    });
                    clearTimeout(timeoutId);

                    if (proxyResponse.ok) {
                        html = await proxyResponse.text();
                        console.log(`✅ Fetched HTML via CORS proxy (${html.length} chars)`);
                        break;
                    } else {
                        console.log(`⚠️ Proxy returned status: ${proxyResponse.status}`);
                    }
                } catch (proxyErr) {
                    console.log(`⚠️ CORS proxy failed: ${proxyErr.message}`);
                    continue;
                }
            }

            if (!html) {
                throw new Error('Could not fetch HTML via CORS proxy');
            }
            
            return await processHTMLForRelatedDOI(html, arxivDOI);
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error('Request timed out while fetching HTML.');
            }
            console.error('Error extracting Related DOI:', err);
            throw err;
        }
    }

    async function processHTMLForRelatedDOI(html, arxivDOI) {
        // Strategy 1: Use regex on raw HTML first (most reliable)
            // Look for "Related DOI:" followed by various patterns
            // Based on actual doi.org structure: "Related DOI: <https://doi.org/10.xxxx/yyyy>"
            const patterns = [
                // Pattern 1: Related DOI: <https://doi.org/10.xxxx/yyyy> (most common format)
                /Related\s+DOI[:\s]*<[^<>]*https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/i,
                // Pattern 2: Related DOI: <a href="https://doi.org/10.xxxx/yyyy">
                /Related\s+DOI[:\s]*<a[^>]*href=["']?https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/i,
                // Pattern 3: Related DOI: https://doi.org/10.xxxx/yyyy (direct link, no brackets)
                /Related\s+DOI[:\s]*https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/i,
                // Pattern 4: More flexible - Related DOI followed by any DOI link within 200 chars
                /Related\s+DOI[:\s]*.{0,200}?https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/i,
                // Pattern 5: Look in table cells: <td>Related DOI: ...</td>
                /<td[^>]*>.*?Related\s+DOI[:\s]*.{0,200}?https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/is,
                // Pattern 6: Look for "Journal reference" followed by "Related DOI" (common structure)
                /Journal\s+reference.*?Related\s+DOI[:\s]*.{0,200}?https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/is
            ];

            for (let i = 0; i < patterns.length; i++) {
                const pattern = patterns[i];
                const match = html.match(pattern);
                if (match) {
                    const extractedDOI = match[1];
                    // Make sure it's not the arXiv DOI itself
                    if (!isArxivDOI(extractedDOI) && extractedDOI !== arxivDOI) {
                        console.log(`✅ Found Related DOI via regex pattern ${i + 1}: ${extractedDOI}`);
                        return extractedDOI;
                    } else {
                        console.log(`⚠️ Pattern ${i + 1} matched but DOI is arXiv or same: ${extractedDOI}`);
                    }
                }
            }
            
            // Debug: Show a snippet of HTML around "Related DOI" if found
            const relatedIndex = html.toLowerCase().indexOf('related doi');
            if (relatedIndex !== -1) {
                const snippet = html.substring(Math.max(0, relatedIndex - 100), Math.min(html.length, relatedIndex + 500));
                console.log('HTML snippet around "Related DOI":', snippet);
            } else {
                console.log('"Related DOI" text not found in HTML');
            }

            // Strategy 2: Parse HTML with DOMParser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Find all elements containing "Related DOI"
            const allElements = doc.querySelectorAll('*');
            for (const element of allElements) {
                const text = element.textContent || '';
                if (text.includes('Related DOI') || text.includes('Related DOI:')) {
                    // Look for DOI links in this element and its children
                    const links = element.querySelectorAll('a[href*="doi.org"]');
                    for (const link of links) {
                        const href = link.getAttribute('href') || '';
                        const doiMatch = href.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/);
                        if (doiMatch) {
                            const extractedDOI = doiMatch[1];
                            if (!isArxivDOI(extractedDOI) && extractedDOI !== arxivDOI) {
                                console.log(`✅ Found Related DOI via DOM parsing: ${extractedDOI}`);
                                return extractedDOI;
                            }
                        }
                    }
                    
                    // Also check parent elements for links
                    let parent = element.parentElement;
                    for (let depth = 0; depth < 5 && parent; depth++) {
                        const links = parent.querySelectorAll('a[href*="doi.org"]');
                        for (const link of links) {
                            const href = link.getAttribute('href') || '';
                            const doiMatch = href.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/);
                            if (doiMatch) {
                                const extractedDOI = doiMatch[1];
                                if (!isArxivDOI(extractedDOI) && extractedDOI !== arxivDOI) {
                                    console.log(`✅ Found Related DOI via parent DOM parsing: ${extractedDOI}`);
                                    return extractedDOI;
                                }
                            }
                        }
                        parent = parent.parentElement;
                    }
                }
            }

            // Strategy 3: Find all DOI links and check if they're near "Related" text
            const allLinks = doc.querySelectorAll('a[href*="doi.org"]');
            for (const link of allLinks) {
                const href = link.getAttribute('href') || '';
                const doiMatch = href.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/);
                if (!doiMatch) continue;
                
                const extractedDOI = doiMatch[1];
                // Skip if it's the arXiv DOI
                if (isArxivDOI(extractedDOI) || extractedDOI === arxivDOI) continue;
                
                // Check if nearby text mentions "Related"
                let parent = link.parentElement;
                for (let i = 0; i < 10 && parent; i++) {
                    const text = parent.textContent || '';
                    if (text.includes('Related DOI') || text.includes('Related DOI:')) {
                        console.log(`✅ Found Related DOI via context search: ${extractedDOI}`);
                        return extractedDOI;
                    }
                    parent = parent.parentElement;
                }
            }

            console.warn('Could not find Related DOI in HTML');
            return null;
    }

    function updatePaginationControls() {
        const totalPages = Math.ceil(allBibtexResults.length / resultsPerPage);
        
        // Remove existing pagination controls
        const existingControls = document.getElementById('pagination-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Only show pagination if there's more than one page
        if (totalPages <= 1) return;

        // Create pagination controls
        const controls = document.createElement('div');
        controls.id = 'pagination-controls';
        controls.className = 'pagination-controls';
        
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages} (${allBibtexResults.length} result${allBibtexResults.length > 1 ? 's' : ''})`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'secondary-btn pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage >= totalPages - 1;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderOutput();
            }
        });

        const prevBtn = document.createElement('button');
        prevBtn.className = 'secondary-btn pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 0;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderOutput();
            }
        });

        controls.appendChild(prevBtn);
        controls.appendChild(pageInfo);
        controls.appendChild(nextBtn);

        // Insert after output header
        const outputHeader = document.querySelector('.output-header');
        outputHeader.insertAdjacentElement('afterend', controls);
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
