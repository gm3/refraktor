// src/modules/ui/panelDefinitions.js
import { state } from '../state.js';
import * as audio from '../audio.js';
import * as scene from '../scene.js';
import * as presets from '../presets.js';
import { initMidi, selectMidiOutput } from '../midi.js';
import { init as initEnvelopeVisualizer, updateVisualizer } from '../envelopeVisualizer.js';
import { updateMusicScale } from '../music.js';
import { rebuildGrid } from '../scene.js';
import {
    updateDistortionAmount, updateDistortionEnabled,
    updateSaturationAmount, updateSaturationEnabled,
    updateReverbDecay, updateReverbWet, updateReverbEnabled,
    updateLimiterThreshold, updateLimiterEnabled,
    updateFilterType, updateFilterFrequency, updateFilterQ
} from '../audio.js';

// Helper to update grid tile frequencies after scale/octave change
function updateGridFrequencies() {
    updateMusicScale();
    if (state.music && state.music.scaleFrequencies && state.gridTiles) {
        for (let i = 0; i < state.gridTiles.length; i++) {
            const tile = state.gridTiles[i];
            const freq = state.music.scaleFrequencies[i % state.music.scaleFrequencies.length];
            tile.userData.frequency = freq;
        }
    }
}

function updateGridFrequenciesAndRebuild() {
    updateMusicScale();
    rebuildGrid();
}

export const getPanelDefinitions = ({ onToggleSound, isSoundEnabled, rebuildUI }) => {
    // Ensure isSoundEnabled is always a function
    const getIsSoundEnabled = typeof isSoundEnabled === 'function' ? isSoundEnabled : () => state.soundEnabled;
    // Ensure all FX state objects exist
    state.audio.distortion = state.audio.distortion ?? { enabled: false, amount: 0.2 };
    state.audio.saturation = state.audio.saturation ?? { enabled: false, amount: 0.2 };
    state.audio.limiter = state.audio.limiter ?? { enabled: true, threshold: -6 };
    return ({
        'General': {
            title: 'General',
            content: [
                { type: 'toggle', id: 'sound-enabled', label: 'Sound Enabled', getValue: () => getIsSoundEnabled(), onChange: (val) => onToggleSound(val) },
                { type: 'button', id: 'add-lens-2', label: state.lens2 ? 'Remove Lens 2' : 'Add Lens 2', onClick: () => {
                    scene.addOrRemoveLens2();
                    rebuildUI();
                }},
            ]
        },
        'Master': {
            title: 'Master Controls',
            content: [
                { type: 'slider', id: 'masterVolume', label: 'Volume', min: 0, max: 1, step: 0.01, getValue: () => state.audio.masterVolume, onChange: (val) => audio.updateMasterVolume(val) },
                { type: 'button', id: 'panic', label: 'Panic (Reset)', onClick: audio.panic },
            ]
        },
        'Sound': {
            title: 'Sound',
            content: [
                { type: 'dropdown', id: 'polyphony-mode', label: 'Polyphony', options: ['poly', 'mono'], getValue: () => state.audio.polyphonyMode, onChange: (val) => {
                    state.audio.polyphonyMode = val;
                }},
                { type: 'dropdown', id: 'sound-source', label: 'Sound Source', options: ['synth', 'sample', 'both'], getValue: () => state.audio.soundSource, onChange: (val) => { state.audio.soundSource = val; } },
                // Show sample controls only if relevant
                ...(state.audio.soundSource === 'sample' || state.audio.soundSource === 'both' ? [
                    { type: 'button', id: 'sample-upload', label: state.audio.sample?.name ? `Loaded: ${state.audio.sample.name}` : 'Load Sample', onClick: () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'audio/*';
                        input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                state.audio.sample = state.audio.sample || {};
                                state.audio.sample.name = file.name;
                                const url = URL.createObjectURL(file);
                                import('../audio.js').then(audio => audio.loadSample(url));
                            }
                        };
                        input.click();
                    } },
                    { type: 'dropdown', id: 'sample-root', label: 'Sample Root Note', options: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'].map(n => Array.from({length: 8}, (_, o) => `${n}${o}`)).flat(), getValue: () => state.audio.sample?.rootNote || 'C4', onChange: (val) => { state.audio.sample = state.audio.sample || {}; state.audio.sample.rootNote = val; } },
                    { type: 'slider', id: 'sample-mix', label: 'Sample Mix', min: 0, max: 1, step: 0.01, getValue: () => state.audio.sample?.mix ?? 0.5, onChange: (val) => { state.audio.sample = state.audio.sample || {}; state.audio.sample.mix = val; } },
                ] : []),
                { type: 'dropdown', id: 'waveformType', label: 'Waveform', options: ['sine', 'square', 'sawtooth', 'triangle'], getValue: () => state.audio.oscillatorType, onChange: (val) => audio.updateOscillatorType(val) },
                { type: 'toggle', id: 'duration-mode', label: 'Duration Mode (Pre)', getValue: () => state.audio.durationMode === 'pre', onChange: (val) => state.audio.durationMode = val ? 'pre' : 'post' },
                { 
                    type: 'canvas', 
                    id: 'adsr-visualizer', 
                    onMount: (canvas) => {
                        initEnvelopeVisualizer(canvas, state.audio, (newValues) => {
                            Object.assign(state.audio, newValues);
                            audio.updateEnvelope(state.audio);
                        });
                    }
                },
                { type: 'slider', id: 'attack', label: 'Attack', min: 0.01, max: 2, step: 0.001, curve: 'exponential', getValue: () => state.audio.attack, onChange: (val) => { state.audio.attack = val; audio.updateEnvelope(state.audio); updateVisualizer(state.audio); }},
                { type: 'slider', id: 'decay', label: 'Decay', min: 0.01, max: 2, step: 0.001, curve: 'exponential', getValue: () => state.audio.decay, onChange: (val) => { state.audio.decay = val; audio.updateEnvelope(state.audio); updateVisualizer(state.audio); }},
                { type: 'slider', id: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, getValue: () => state.audio.sustain, onChange: (val) => { state.audio.sustain = val; audio.updateEnvelope(state.audio); updateVisualizer(state.audio); }},
                { type: 'slider', id: 'release', label: 'Release', min: 0.01, max: 2, step: 0.001, curve: 'exponential', getValue: () => state.audio.release, onChange: (val) => { state.audio.release = val; audio.updateEnvelope(state.audio); updateVisualizer(state.audio); }},
                { type: 'slider', id: 'duration', label: 'Note Duration', min: 0.01, max: 1, step: 0.01, getValue: () => state.audio.duration, onChange: (val) => state.audio.duration = val },
            ]
        },
        'FX': {
            title: 'FX',
            content: [
                { type: 'dropdown', id: 'filterType', label: 'Filter Type', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'lowshelf', 'highshelf'], getValue: () => state.audio.filterType, onChange: (val) => { updateFilterType(val); } },
                { type: 'slider', id: 'filterFrequency', label: 'Filter Frequency', min: 20, max: 20000, step: 1, curve: 'exponential', getValue: () => state.audio.filterFrequency, onChange: (val) => { updateFilterFrequency(val); } },
                { type: 'slider', id: 'filterQ', label: 'Filter Q', min: 0.1, max: 30, step: 0.1, getValue: () => state.audio.filterQ, onChange: (val) => { updateFilterQ(val); } },
                { type: 'toggle', id: 'distortion-enabled', label: 'Distortion', getValue: () => state.audio.distortion?.enabled ?? false, onChange: (val) => { updateDistortionEnabled(val); } },
                { type: 'slider', id: 'distortion-amount', label: 'Distortion Amount', min: 0, max: 1, step: 0.01, getValue: () => state.audio.distortion?.amount ?? 0.2, onChange: (val) => { updateDistortionAmount(val); } },
                { type: 'toggle', id: 'saturation-enabled', label: 'Saturation', getValue: () => state.audio.saturation?.enabled ?? false, onChange: (val) => { updateSaturationEnabled(val); } },
                { type: 'slider', id: 'saturation-amount', label: 'Saturation Amount', min: 0, max: 1, step: 0.01, getValue: () => state.audio.saturation?.amount ?? 0.2, onChange: (val) => { updateSaturationAmount(val); } },
                { type: 'toggle', id: 'reverb-enabled', label: 'Reverb', getValue: () => state.audio.reverb?.enabled ?? false, onChange: (val) => { updateReverbEnabled(val); } },
                { type: 'slider', id: 'reverb-decay', label: 'Reverb Decay', min: 0.1, max: 10, step: 0.1, getValue: () => state.audio.reverb?.decay ?? 2, onChange: (val) => { updateReverbDecay(val); } },
                { type: 'slider', id: 'reverb-wet', label: 'Reverb Wet', min: 0, max: 1, step: 0.01, getValue: () => state.audio.reverb?.wet ?? 0.3, onChange: (val) => { updateReverbWet(val); } },
                { type: 'toggle', id: 'limiter-enabled', label: 'Limiter', getValue: () => state.audio.limiter?.enabled ?? true, onChange: (val) => { updateLimiterEnabled(val); } },
                { type: 'slider', id: 'limiter-threshold', label: 'Limiter Threshold', min: -24, max: 0, step: 1, getValue: () => state.audio.limiter?.threshold ?? -6, onChange: (val) => { updateLimiterThreshold(val); } },
            ]
        },
        'Lens 1': {
            title: 'Lens 1',
            content: [
                { type: 'slider', id: 'l1-frequency', label: 'Frequency', min: 20, max: 20000, step: 1, curve: 'exponential', getValue: () => state.params.frequency, onChange: (val) => state.params.frequency = val },
                { type: 'slider', id: 'l1-amplitude', label: 'Amplitude', min: 0.1, max: 10.0, step: 0.1, getValue: () => state.params.amplitude, onChange: (val) => state.params.amplitude = val },
                { type: 'slider', id: 'l1-y', label: 'Y Position', min: -5, max: 5, step: 0.1, getValue: () => state.params.y, onChange: (val) => state.params.y = val },
                { type: 'toggle', id: 'l1-bpm-sync', label: 'BPM Sync', getValue: () => state.params.bpmSyncEnabled, onChange: (val) => state.params.bpmSyncEnabled = val },
                { type: 'slider', id: 'l1-speed', label: 'Anim Speed', min: 0.1, max: 10.0, step: 0.1, getValue: () => state.params.speed, onChange: (val) => state.params.speed = val },
                { type: 'slider', id: 'l1-bpm', label: 'BPM', min: 30, max: 240, step: 1, getValue: () => state.params.bpm, onChange: (val) => state.params.bpm = val },
                { type: 'slider', id: 'ray-count', label: 'Ray Count', min: 1, max: 50, step: 1, getValue: () => state.params.rayCount, onChange: (val) => state.params.rayCount = val },
                { type: 'slider', id: 'cone-angle', label: 'Cone Angle', min: 0, max: Math.PI / 2, step: 0.01, getValue: () => state.params.rayConeAngle, onChange: (val) => state.params.rayConeAngle = val },
            ]
        },
        'Lens 2': {
            title: 'Lens 2',
            content: [
                { type: 'slider', id: 'l2-frequency', label: 'Frequency', min: 20, max: 20000, step: 1, curve: 'exponential', getValue: () => state.lens2Params.frequency, onChange: (val) => state.lens2Params.frequency = val },
                { type: 'slider', id: 'l2-amplitude', label: 'Amplitude', min: 0.1, max: 10.0, step: 0.1, getValue: () => state.lens2Params.amplitude, onChange: (val) => state.lens2Params.amplitude = val },
                { type: 'slider', id: 'l2-y', label: 'Y Position', min: -5, max: 5, step: 0.1, getValue: () => state.lens2Params.y, onChange: (val) => state.lens2Params.y = val },
                { type: 'toggle', id: 'l2-bpm-sync', label: 'BPM Sync', getValue: () => state.lens2Params.bpmSyncEnabled, onChange: (val) => state.lens2Params.bpmSyncEnabled = val },
                { type: 'slider', id: 'l2-speed', label: 'Anim Speed', min: 0.1, max: 10.0, step: 0.1, getValue: () => state.lens2Params.speed, onChange: (val) => state.lens2Params.speed = val },
                { type: 'slider', id: 'l2-bpm', label: 'BPM', min: 30, max: 240, step: 1, getValue: () => state.lens2Params.bpm, onChange: (val) => state.lens2Params.bpm = val },
            ]
        },
        'Music': {
            title: 'Music',
            content: [
                 { type: 'toggle', id: 'chord-magnet', label: 'Enable Chord Magnet', getValue: () => state.params.chordMagnetEnabled, onChange: (val) => { state.params.chordMagnetEnabled = val; updateGridFrequenciesAndRebuild(); } },
                 { type: 'slider', id: 'chord-magnet-strength', label: 'Magnet Strength', min: 0, max: 1, step: 0.01, getValue: () => state.params.chordMagnetStrength, onChange: (val) => { state.params.chordMagnetStrength = val; updateGridFrequenciesAndRebuild(); } },
                 { type: 'dropdown', id: 'root-note', label: 'Root Note', options: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'], getValue: () => state.music.rootNote, onChange: (val) => { state.music.rootNote = val; updateGridFrequenciesAndRebuild(); } },
                 { type: 'dropdown', id: 'scale', label: 'Scale', options: ['major', 'minor', 'pentatonic', 'blues', 'chromatic'], getValue: () => state.music.scale, onChange: (val) => { state.music.scale = val; updateGridFrequenciesAndRebuild(); } },
                 { type: 'slider', id: 'octave-range', label: 'Octave Range', min: 1, max: 8, step: 1, getValue: () => state.music.octaves, onChange: (val) => { state.music.octaves = val; updateGridFrequenciesAndRebuild(); } },
            ]
        },
        'MIDI': {
            title: 'MIDI',
            content: [
                { type: 'toggle', id: 'midi-enabled', label: 'Enable MIDI Output', getValue: () => state.midi.enabled, onChange: (val) => state.midi.enabled = val },
            ]
        },
         'Presets': {
            title: 'Presets',
            content: [
                { type: 'input', id: 'preset-name', placeholder: 'Preset Name', onSave: (val) => presets.savePreset(val) },
                { type: 'button', id: 'load-preset', label: 'Load', onClick: () => {
                    const input = document.getElementById('preset-name');
                    presets.loadPreset().then(name => input.value = name);
                }},
            ]
        }
    });
}; 