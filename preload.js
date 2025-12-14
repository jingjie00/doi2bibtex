const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Fetch BibTeX from doi.org (bypasses CORS)
    fetchBibTeX: (doi) => ipcRenderer.invoke('fetch-bibtex', doi),
    
    // Fetch HTML from doi.org (bypasses CORS)
    fetchHTML: (url) => ipcRenderer.invoke('fetch-html', url),
    
    // Check if running in Electron
    isElectron: true
});

