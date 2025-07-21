import { state } from './state.js';
import { updateUIValues } from './ui/index.js';
import * as audio from './audio.js';
import * as scene from './scene.js';

export function savePreset(name) {
    const presetData = {
        paramsDefaults: {
            frequency: state.params.frequency,
            amplitude: state.params.amplitude,
            y: state.params.y,
            speed: state.params.speed,
            bpm: state.params.bpm,
            bpmSyncEnabled: state.params.bpmSyncEnabled,
            rayCount: state.params.rayCount,
            rayConeAngle: state.params.rayConeAngle,
            n: state.params.n,
        },
        music: {
            chordMagnetEnabled: state.params.chordMagnetEnabled,
            chordMagnetStrength: state.params.chordMagnetStrength,
            rootNote: state.params.rootNote,
            scale: state.params.scale,
        },
        audio: {
            masterVolume: state.audio.masterVolume,
            oscillator: {
                type: state.audio.oscillatorType,
            },
            adsr: {
                attack: state.audio.attack,
                decay: state.audio.decay,
                sustain: state.audio.sustain,
                release: state.audio.release,
            },
            duration: state.audio.duration,
            durationMode: state.audio.durationMode,
            filter: {
                enabled: state.audio.filterEnabled,
                type: state.audio.filterType,
                frequency: state.audio.filterFrequency,
                q: state.audio.filterQ,
            },
        },
        bloom: JSON.parse(JSON.stringify(state.bloomParams)),
        midi: JSON.parse(JSON.stringify(state.midi)),
    };
    
    // Conditionally add lens2 params if it exists
    if (state.lens2) {
        presetData.lens2Params = JSON.parse(JSON.stringify(state.lens2Params));
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
    // Preserve current time values
    const originalTime = state.params.time;
    const originalLens2Time = state.lens2Params ? state.lens2Params.time : 0;

    // Apply lens1 and music params
    if (presetData.paramsDefaults) Object.assign(state.params, presetData.paramsDefaults);
    if (presetData.music) Object.assign(state.params, presetData.music);

    // Restore time values
    state.params.time = originalTime;
    
    // Apply audio settings from their structured format
    if (presetData.audio) {
        const audioData = presetData.audio;
        state.audio.masterVolume = audioData.masterVolume;
        state.audio.oscillatorType = audioData.oscillator.type;
        Object.assign(state.audio, audioData.adsr);
        state.audio.duration = audioData.duration;
        state.audio.durationMode = audioData.durationMode;
        
        state.audio.filterEnabled = audioData.filter.enabled;
        state.audio.filterType = audioData.filter.type;
        state.audio.filterFrequency = audioData.filter.frequency;
        state.audio.filterQ = audioData.filter.q;
    }

    // Apply bloom and midi
    if (presetData.bloom) Object.assign(state.bloomParams, presetData.bloom);
    if (presetData.midi) Object.assign(state.midi, presetData.midi);

    // Handle lens2 state
    if (presetData.lens2Params) {
        if (!state.lens2) scene.addOrRemoveLens2(); // Add it if it's not there
        Object.assign(state.lens2Params, presetData.lens2Params);
        state.lens2Params.time = originalLens2Time; // Restore time for lens 2
    } else {
        if (state.lens2) scene.addOrRemoveLens2(); // Remove it if it exists
    }

    // After loading state, we need to manually trigger updates 
    // for components that don't automatically react to state changes.
    updateAudioFromState();
    scene.updateBloom();
    updateUIValues(); // This should update most of the UI based on the new state

    console.log('Preset loaded and applied successfully.');
}

function updateAudioFromState() {
    // Manually call the update functions for the audio filter and volume
    audio.updateFilterType(state.audio.filterType);
    audio.updateFilterFrequency(state.audio.filterFrequency);
    audio.updateFilterQ(state.audio.filterQ);
    audio.updateMasterVolume(state.audio.masterVolume);
    // The main envelope doesn't need a call here as it's read on noteOn
} 