import { state } from './state.js';
import { config } from './config.js';
import { sendNoteOn, sendNoteOff } from './midi.js';

export function toggleSound(enabled) {
    state.soundEnabled = enabled;
    if (state.soundEnabled && !state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain
        state.masterGain = state.audioCtx.createGain();
        state.masterGain.gain.value = state.audio.masterVolume;
        
        // Create the master filter and connect it to the master gain
        state.filterNode = state.audioCtx.createBiquadFilter();
        updateFilterType(state.audio.filterType);
        updateFilterFrequency(state.audio.filterFrequency);
        updateFilterQ(state.audio.filterQ);
        state.filterNode.connect(state.masterGain);
        state.masterGain.connect(state.audioCtx.destination);

    } else if (!state.soundEnabled && state.audioCtx) {
        // When turning sound off, release all currently playing notes
        state.activeOscillators.forEach((osc, tileId) => {
            noteOff(tileId);
        });
    }
}

export function isSoundEnabled() {
    return state.soundEnabled;
}

export function updateFilterType(type) {
    if (state.filterNode) {
        state.audio.filterType = type;
        state.filterNode.type = type;
    }
}

export function updateFilterFrequency(freq) {
    if (state.filterNode) {
        state.audio.filterFrequency = freq;
        // Use setTargetAtTime for smooth transitions
        state.filterNode.frequency.setTargetAtTime(freq, state.audioCtx.currentTime, 0.015);
    }
}

export function updateFilterQ(q) {
    if (state.filterNode) {
        state.audio.filterQ = q;
        state.filterNode.Q.setTargetAtTime(q, state.audioCtx.currentTime, 0.015);
    }
}

export function updateMasterVolume(volume) {
    if(state.masterGain) {
        state.audio.masterVolume = volume;
        state.masterGain.gain.setTargetAtTime(volume, state.audioCtx.currentTime, 0.015);
    }
}

export function panic() {
    if (!state.audioCtx) return;
    state.activeOscillators.forEach(({ oscillator }) => {
        oscillator.stop(state.audioCtx.currentTime);
    });
    state.activeOscillators.clear();
}

export function noteOn(frequency, tileId) {
    if (!state.soundEnabled || !state.audioCtx || state.activeOscillators.has(tileId)) return;

    const oscillator = state.audioCtx.createOscillator();
    const gainNode = state.audioCtx.createGain();
    oscillator.connect(gainNode);
    // Connect to the filter instead of the destination
    gainNode.connect(state.filterNode);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, state.audioCtx.currentTime);

    const { attack, decay, sustain } = state.audio;
    const peakGain = config.audio.peakGain;
    const sustainLevel = peakGain * sustain;
    
    // ADSR Attack and Decay
    const now = state.audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);

    oscillator.start(now);
    sendNoteOn(frequency);
    
    state.activeOscillators.set(tileId, { oscillator, gainNode, frequency });
}

export function noteOff(tileId) {
    if (!state.soundEnabled || !state.audioCtx || !state.activeOscillators.has(tileId)) return;

    const { oscillator, gainNode, frequency } = state.activeOscillators.get(tileId);
    const { release } = state.audio;

    const now = state.audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    // Use the current gain as the starting point for the release ramp
    const currentGain = gainNode.gain.value;
    gainNode.gain.setValueAtTime(currentGain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Schedule the oscillator to stop after the release phase is complete
    oscillator.stop(now + release);
    sendNoteOff(frequency);
    
    oscillator.onended = () => {
        state.activeOscillators.delete(tileId);
    };
} 