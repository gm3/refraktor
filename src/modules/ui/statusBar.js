// src/modules/ui/statusBar.js
import { on, emit } from '../eventBus.js';

let statusBar;
let statusText;
let historyPanel;
let historyContent;
let isPanelOpen = false;

function createStatusMessage(data) {
    const { message, type = 'info', timestamp = new Date() } = data;
    const timeString = timestamp.toLocaleTimeString();
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.innerHTML = `<span class="timestamp">${timeString}</span> <span class="message">${message}</span>`;
    return messageEl;
}

function addMessageToHistory(data) {
    if (!historyContent) return;
    const messageEl = createStatusMessage(data);
    historyContent.appendChild(messageEl);
    historyContent.scrollTop = historyContent.scrollHeight; // Auto-scroll
}

function setStatusText(data) {
    if (!statusText) return;
    const { message } = data;
    statusText.textContent = message;
    statusText.classList.add('flash');
    // Remove the class after the animation completes to allow re-triggering
    setTimeout(() => statusText.classList.remove('flash'), 500);
}

function toggleHistoryPanel() {
    isPanelOpen = !isPanelOpen;
    historyPanel.style.height = isPanelOpen ? '200px' : '0px';
    statusBar.classList.toggle('open', isPanelOpen);
}

export function initializeStatusBar() {
    const container = document.body;

    statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    
    statusText = document.createElement('div');
    statusText.id = 'status-text';
    statusText.textContent = 'System initialized. Ready.';
    statusBar.appendChild(statusText);

    const toggleButton = document.createElement('button');
    toggleButton.id = 'status-toggle';
    toggleButton.textContent = '▲';
    toggleButton.onclick = toggleHistoryPanel;
    statusBar.appendChild(toggleButton);

    historyPanel = document.createElement('div');
    historyPanel.id = 'status-history-panel';
    
    historyContent = document.createElement('div');
    historyContent.id = 'status-history-content';
    historyPanel.appendChild(historyContent);

    container.appendChild(historyPanel);
    container.appendChild(statusBar);

    // Listen for events from the bus
    on('statusUpdate', (data) => {
        setStatusText(data);
        addMessageToHistory(data);
    });
    
    on('notePlayed', (data) => {
        const messageData = { message: `Note On: ${data.frequency.toFixed(0)} Hz`, type: 'note' };
        setStatusText(messageData);
        addMessageToHistory(messageData);
    });

    on('error', (data) => {
        const messageData = { message: `Error: ${data.message}`, type: 'error' };
        setStatusText(messageData);
        addMessageToHistory(messageData);
    });

    // Add an initial message
    addMessageToHistory({ message: 'Event logging started.' });
} 