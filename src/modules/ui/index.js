// src/modules/ui/index.js
import { state } from '../state.js';
import { initializePanelContainer, togglePanel } from './panelManager.js';
import { getPanelDefinitions } from './panelDefinitions.js';

let uiCallbacks;

function createFooter() {
    const footer = document.createElement('div');
    footer.id = 'ui-footer';

    const githubLink = document.createElement('a');
    githubLink.href = 'https://github.com/cabbibo/refraktor'; // Assumed repo, user can change
    githubLink.target = '_blank';
    githubLink.rel = 'noopener noreferrer';
    githubLink.title = 'View on GitHub';
    githubLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="24" height="24"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
    footer.appendChild(githubLink);

    const licenseText = document.createElement('span');
    licenseText.textContent = 'MIT License';
    footer.appendChild(licenseText);

    return footer;
}

export function rebuildUI(callbacks = {}) {
    uiCallbacks = { ...uiCallbacks, ...callbacks };
    const uiWrapper = document.getElementById('ui-container-wrapper');
    if (!uiWrapper) return;

    // Preserve the panels container, clear everything else
    const panelsContainer = document.getElementById('ui-panels-container') || document.createElement('div');
    if (!document.getElementById('ui-panels-container')) {
        panelsContainer.id = 'ui-panels-container';
        initializePanelContainer(panelsContainer);
    }
    
    uiWrapper.innerHTML = ''; // Clear everything

    const logoContainer = document.createElement('div');
    logoContainer.id = 'ui-logo-container';
    
    const logo = document.createElement('img');
    logo.src = './public/logo_dark.png';
    logo.id = 'ui-logo';
    logoContainer.appendChild(logo);

    const title = document.createElement('h1');
    title.id = 'ui-title';
    title.textContent = 'REFRAKTOR';
    logoContainer.appendChild(title);

    uiWrapper.appendChild(logoContainer);

    const leftMenu = document.createElement('div');
    leftMenu.id = 'ui-left-menu';

    const panelDefinitions = getPanelDefinitions({ ...uiCallbacks, rebuildUI });

    Object.values(panelDefinitions).forEach(def => {
        // Don't create a menu button for Lens 2 if it doesn't exist
        if (def.title === 'Lens 2' && !state.lens2) {
            return;
        }

        const button = document.createElement('button');
        const { title, content } = def;
        const panelId = `panel-${title.toLowerCase().replace(/\s/g, '-')}`;

        button.id = `menu-button-${title.replace(' ', '-')}`;
        button.textContent = title;
        button.onclick = () => togglePanel(panelId, title, () => content);

        leftMenu.appendChild(button);
    });

    uiWrapper.appendChild(leftMenu);
    uiWrapper.appendChild(panelsContainer); // Add the preserved container back
    uiWrapper.appendChild(createFooter());
}

export function createUI(callbacks) {
    uiCallbacks = callbacks;
    rebuildUI();
}

export function updateUIValues() {
    // This function is now largely obsolete as components update themselves.
} 