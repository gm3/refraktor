// src/modules/ui/index.js
import { state } from '../state.js';
import { initializePanelContainer, togglePanel } from './panelManager.js';
import { getPanelDefinitions } from './panelDefinitions.js';

let uiCallbacks = {
    onToggleSound: () => {},
    isSoundEnabled: () => state.soundEnabled,
};

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
    logo.src = './logo_dark.png';
    logo.id = 'ui-logo';
    logoContainer.appendChild(logo);

    const title = document.createElement('h1');
    title.id = 'ui-title';
    title.textContent = 'REFRAKTOR';
    logoContainer.appendChild(title);

    uiWrapper.appendChild(logoContainer);

    const leftMenu = document.createElement('div');
    leftMenu.id = 'ui-left-menu';

    const panelDefinitions = getPanelDefinitions({
        onToggleSound: typeof uiCallbacks.onToggleSound === 'function' ? uiCallbacks.onToggleSound : () => {},
        isSoundEnabled: typeof uiCallbacks.isSoundEnabled === 'function' ? uiCallbacks.isSoundEnabled : () => state.soundEnabled,
        rebuildUI,
    });

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
    // Footer removed
}

export function createUI(callbacks) {
    uiCallbacks = { ...uiCallbacks, ...callbacks };
    rebuildUI();
}

export function updateUIValues() {
    // This function is now largely obsolete as components update themselves.
} 