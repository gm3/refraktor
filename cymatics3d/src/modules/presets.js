import { state } from './state.js';
import { updateUIValues } from './ui.js';
import { updateFilterQ, updateFilterType, updateFilterFrequency, updateMasterVolume } from './audio.js';
import { updateBloom } from './scene.js';

// A list of parameters to save in the preset
const PRESET_PARAMS = [
    'params',
    'lens2Params',
    'bloomParams',
    'audio',
    'midi',
    'tileZap'
];

export function savePreset(name) {
    const presetData = {};
    for (const key of PRESET_PARAMS) {
        // Simple deep copy for plain objects
        presetData[key] = JSON.parse(JSON.stringify(state[key]));
    }

    try {
        const serializedData = JSON.stringify(presetData, null, 2);
        const blob = new Blob([serializedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Preset '${name}' saved successfully.`);
    } catch (error) {
        console.error('Failed to save preset:', error);
        alert('Could not save the preset. See console for details.');
    }
}

export async function loadPreset() {
    return new Promise((resolve, reject) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) {
                    reject('No file selected.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = readerEvent => {
                    try {
                        const presetData = JSON.parse(readerEvent.target.result);
                        applyPreset(presetData);
                        const presetName = file.name.replace('.json', '');
                        resolve(presetName);
                    } catch (error) {
                        console.error('Error parsing preset file:', error);
                        alert('Could not parse the preset file. Is it a valid JSON?');
                        reject(error);
                    }
                };
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    alert('Could not read the preset file.');
                    reject(error);
                };
                reader.readAsText(file, 'UTF-8');
            };
            
            input.click();
        } catch (error) {
            console.error('Error setting up file loader:', error);
            alert('Could not open the file dialog.');
            reject(error);
        }
    });
}

function applyPreset(presetData) {
    for (const key of PRESET_PARAMS) {
        if (presetData[key]) {
            // Overwrite the state keys with loaded data
            Object.assign(state[key], presetData[key]);
        }
    }

    // After loading state, we need to manually trigger updates 
    // for components that don't automatically react to state changes.
    updateAudioFromState();
    updateBloom();
    updateUIValues(); // This should update most of the UI based on the new state

    console.log('Preset loaded and applied successfully.');
}

function updateAudioFromState() {
    // Manually call the update functions for the audio filter and volume
    updateFilterType(state.audio.filterType);
    updateFilterFrequency(state.audio.filterFrequency);
    updateFilterQ(state.audio.filterQ);
    updateMasterVolume(state.audio.masterVolume);
} 