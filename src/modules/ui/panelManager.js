// src/modules/ui/panelManager.js
import * as Components from './components.js';

let panelsContainer;
const PANEL_START_X = 150;
const PANEL_START_Y = 50;
const PANEL_X_OFFSET = 30;
const PANEL_Y_OFFSET = 30;
const PANEL_ESTIMATED_HEIGHT = 400; // Increased estimate
let nextPanelX = PANEL_START_X;
let nextPanelY = PANEL_START_Y;
let columnWidth = 0;

function getHighestZIndex() {
    if (!panelsContainer) return 10;
    return Array.from(panelsContainer.children)
        .map(p => parseInt(p.style.zIndex || '10', 10))
        .reduce((max, z) => Math.max(max, z), 10);
}

function createDraggablePanel(id, title, content) {
    const panel = document.createElement('div');
    panel.id = id;
    panel.className = 'ui-panel';

    const header = document.createElement('div');
    header.className = 'ui-panel-header';
    header.textContent = title;
    panel.appendChild(header);

    const closeButton = document.createElement('button');
    closeButton.className = 'ui-panel-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => panel.style.display = 'none';
    header.appendChild(closeButton);
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'ui-panel-content';
    content.forEach(controlDef => {
        const component = Components.createComponent(controlDef);
        contentContainer.appendChild(component);
        if (controlDef.onMount) {
            // Use requestAnimationFrame to ensure the element is in the DOM
            requestAnimationFrame(() => {
                controlDef.onMount(component);
            });
        }
    });
    panel.appendChild(contentContainer);
    panelsContainer.appendChild(panel);

    let isDragging = false;
    let offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        panel.style.zIndex = getHighestZIndex() + 1;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    return panel;
}

export function initializePanelContainer(container) {
    panelsContainer = container;
}

export function togglePanel(id, title, contentCreator) {
    let panel = document.getElementById(id);
    if (panel && panel.style.display === 'block') {
        panel.style.display = 'none';
    } else if (panel) {
        panel.style.display = 'block';
        panel.style.zIndex = getHighestZIndex() + 1;
    } else {
        panel = createDraggablePanel(id, title, contentCreator());
        panel.style.display = 'block';
        
        panel.style.left = `${nextPanelX}px`;
        panel.style.top = `${nextPanelY}px`;
        
        columnWidth = Math.max(columnWidth, panel.offsetWidth);
        nextPanelY += PANEL_Y_OFFSET;

        if (nextPanelY + PANEL_ESTIMATED_HEIGHT > window.innerHeight) {
            nextPanelY = PANEL_START_Y;
            nextPanelX += columnWidth + PANEL_X_OFFSET;
            columnWidth = 0;
        }

        panel.style.zIndex = getHighestZIndex() + 1;
    }
} 