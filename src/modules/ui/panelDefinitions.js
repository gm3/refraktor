// src/modules/ui/panelDefinitions.js
import { state } from '../state.js';
import * as audio from '../audio.js';
import * as scene from '../scene.js';
import * as presets from '../presets.js';
import { initMidi, selectMidiOutput } from '../midi.js';
import { init as initEnvelopeVisualizer, updateVisualizer } from '../envelopeVisualizer.js';


export const getPanelDefinitions = ({ onToggleSound, isSoundEnabled, rebuildGrid, rebuildUI }) => ({
    'General': {
        title: 'General',
        content: [
            { type: 'toggle', id: 'sound-enabled', label: 'Sound Enabled', getValue: () => isSoundEnabled(), onChange: onToggleSound },
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
            { type: 'file', id: 'sample-upload', label: 'Upload Sample', onChange: (file) => {
                const url = URL.createObjectURL(file);
                audio.loadSample(url);
            } },
            { type: 'slider', id: 'sample-mix', label: 'Sample Mix', min: 0, max: 1, step: 0.01, getValue: () => state.audio.sample.mix, onChange: (val) => { state.audio.sample.mix = val; } },
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
            { type: 'dropdown', id: 'filterType', label: 'Filter Type', options: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'lowshelf', 'highshelf'], getValue: () => state.audio.filterType, onChange: (val) => { audio.updateFilterType(val); audio.updateFXChain(); } },
            { type: 'slider', id: 'filterFrequency', label: 'Filter Frequency', min: 20, max: 20000, step: 1, curve: 'exponential', getValue: () => state.audio.filterFrequency, onChange: (val) => { audio.updateFilterFrequency(val); audio.updateFXChain(); } },
            { type: 'slider', id: 'filterQ', label: 'Filter Q', min: 0.1, max: 30, step: 0.1, getValue: () => state.audio.filterQ, onChange: (val) => { audio.updateFilterQ(val); audio.updateFXChain(); } },
            { type: 'toggle', id: 'distortion-enabled', label: 'Distortion', getValue: () => state.audio.distortion.enabled, onChange: (val) => { state.audio.distortion.enabled = val; audio.updateFXChain(); } },
            { type: 'slider', id: 'distortion-amount', label: 'Distortion Amount', min: 0, max: 1, step: 0.01, getValue: () => state.audio.distortion.amount, onChange: (val) => { state.audio.distortion.amount = val; audio.updateFXChain(); } },
            { type: 'toggle', id: 'saturation-enabled', label: 'Saturation', getValue: () => state.audio.saturation.enabled, onChange: (val) => { state.audio.saturation.enabled = val; audio.updateFXChain(); } },
            { type: 'slider', id: 'saturation-amount', label: 'Saturation Amount', min: 0, max: 1, step: 0.01, getValue: () => state.audio.saturation.amount, onChange: (val) => { state.audio.saturation.amount = val; audio.updateFXChain(); } },
            { type: 'toggle', id: 'limiter-enabled', label: 'Limiter', getValue: () => state.audio.limiter.enabled, onChange: (val) => { state.audio.limiter.enabled = val; audio.updateFXChain(); } },
            { type: 'slider', id: 'limiter-threshold', label: 'Limiter Threshold', min: -24, max: 0, step: 1, getValue: () => state.audio.limiter.threshold, onChange: (val) => { state.audio.limiter.threshold = val; audio.updateFXChain(); } },
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
             { type: 'toggle', id: 'chord-magnet', label: 'Enable Chord Magnet', getValue: () => state.params.chordMagnetEnabled, onChange: (val) => state.params.chordMagnetEnabled = val },
             { type: 'slider', id: 'chord-magnet-strength', label: 'Magnet Strength', min: 0, max: 1, step: 0.01, getValue: () => state.params.chordMagnetStrength, onChange: (val) => state.params.chordMagnetStrength = val },
             { type: 'dropdown', id: 'root-note', label: 'Root Note', options: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'], getValue: () => state.music.rootNote, onChange: (val) => { state.music.rootNote = val; rebuildGrid(); } },
             { type: 'dropdown', id: 'scale', label: 'Scale', options: ['major', 'minor', 'pentatonic', 'blues', 'chromatic'], getValue: () => state.music.scale, onChange: (val) => { state.music.scale = val; rebuildGrid(); } },
             { type: 'slider', id: 'octave-range', label: 'Octave Range', min: 1, max: 8, step: 1, getValue: () => state.music.octaves, onChange: (val) => { state.music.octaves = val; rebuildGrid(); } },
        ]
    },
    'Bloom': {
        title: 'Bloom',
        content: [
            { type: 'toggle', id: 'bloomEnabled', label: 'Enable', getValue: () => state.bloomParams.enabled, onChange: (val) => { state.bloomParams.enabled = val; scene.updateBloom(); state.bloomPass.enabled = val; } },
            { type: 'slider', id: 'bloomStrength', label: 'Strength', min: 0, max: 3, step: 0.01, getValue: () => state.bloomParams.strength, onChange: (val) => { state.bloomParams.strength = val; scene.updateBloom(); } },
            { type: 'slider', id: 'bloomRadius', label: 'Radius', min: 0, max: 1, step: 0.01, getValue: () => state.bloomParams.radius, onChange: (val) => { state.bloomParams.radius = val; scene.updateBloom(); } },
            { type: 'slider', id: 'bloomThreshold', label: 'Threshold', min: 0, max: 1, step: 0.01, getValue: () => state.bloomParams.threshold, onChange: (val) => { state.bloomParams.threshold = val; scene.updateBloom(); } },
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