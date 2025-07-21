import * as Tone from 'tone';
import { state } from './state.js';
import { emit } from './eventBus.js';
import { sendNoteOn, sendNoteOff } from './midi.js';
import { config } from './config.js';

let synth;
let monoSynth;
let filter;
let distortion;
let saturation;
let limiter;
let isToneStarted = false;
let player;

async function startTone() {
    if (isToneStarted) return;
    await Tone.start();
    isToneStarted = true;
    console.log('AudioContext started successfully.');
    emit('status', 'Audio ready.');
}

function ensureFXDefaults() {
    if (!state.audio.distortion) state.audio.distortion = { enabled: false, amount: 0.2 };
    if (!state.audio.saturation) state.audio.saturation = { enabled: false, amount: 0.2 };
    if (!state.audio.limiter) state.audio.limiter = { enabled: true, threshold: -6 };
}

function createFXChain() {
    ensureFXDefaults();
    // Filter
    filter = new Tone.Filter(state.audio.filterFrequency, state.audio.filterType, -12);
    // Distortion
    const distortionAmount = (state.audio.distortion && typeof state.audio.distortion.amount === 'number') ? state.audio.distortion.amount : 0.2;
    distortion = new Tone.Distortion(distortionAmount);
    distortion.wet.value = state.audio.distortion && state.audio.distortion.enabled ? 1 : 0;
    // Saturation (WaveShaper)
    const saturationAmount = (state.audio.saturation && typeof state.audio.saturation.amount === 'number') ? state.audio.saturation.amount : 0.2;
    saturation = new Tone.WaveShaper(x => Math.tanh(saturationAmount * x));
    saturation.wet = state.audio.saturation && state.audio.saturation.enabled ? 1 : 0;
    // Limiter
    const limiterThreshold = (state.audio.limiter && typeof state.audio.limiter.threshold === 'number') ? state.audio.limiter.threshold : -6;
    limiter = new Tone.Limiter(limiterThreshold);
    limiter.wet = state.audio.limiter && state.audio.limiter.enabled ? 1 : 0;
    // Chain: filter -> distortion -> saturation -> limiter -> destination
    filter.chain(distortion, saturation, limiter, Tone.Destination);
}

function createSynths() {
    if (synth) synth.dispose();
    if (monoSynth) monoSynth.dispose();
    if (player) player.dispose();
    createFXChain();
    // PolySynth
    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: state.audio.oscillatorType },
        envelope: {
            attack: state.audio.attack,
            decay: state.audio.decay,
            sustain: state.audio.sustain,
            release: state.audio.release
        }
    }).connect(filter);
    synth.volume.value = Tone.gainToDb(state.audio.masterVolume);
    // MonoSynth
    monoSynth = new Tone.Synth({
        oscillator: { type: state.audio.oscillatorType },
        envelope: {
            attack: state.audio.attack,
            decay: state.audio.decay,
            sustain: state.audio.sustain,
            release: state.audio.release
        }
    }).connect(filter);
    monoSynth.volume.value = Tone.gainToDb(state.audio.masterVolume);
    // Sample Player
    if (state.audio.sample.url) {
        player = new Tone.Player(state.audio.sample.url).toDestination();
        player.autostart = false;
        player.volume.value = Tone.gainToDb(state.audio.masterVolume * state.audio.sample.mix);
    }
}

export async function loadSample(url) {
    state.audio.sample.url = url;
    state.audio.sample.enabled = true;
    createSynths();
}

export async function toggleSound(enabled) {
    if (enabled) {
        await startTone();
        if (!synth || !monoSynth) {
            createSynths();
        }
        state.soundEnabled = true;
    } else {
        if (synth) synth.releaseAll();
        if (monoSynth) monoSynth.triggerRelease();
        state.soundEnabled = false;
    }
}

export function noteOn(frequency, tileId) {
    if (!state.soundEnabled) return;
    const src = state.audio.soundSource || 'synth';
    if (src === 'mono') {
        monoSynth.triggerRelease();
        monoSynth.triggerAttack(frequency);
    }
    if (src === 'poly' || src === 'synth' || src === 'both') {
        synth.triggerAttack(frequency, undefined, 1);
    }
    if ((src === 'sample' || src === 'both') && player) {
        player.start();
    }
    sendNoteOn(frequency);
    state.zappedTiles.set(tileId, { startTime: Tone.now(), frequency });
}

export function noteOff(tileId) {
    if (!state.soundEnabled) return;
    const zapInfo = state.zappedTiles.get(tileId);
    if (zapInfo && zapInfo.frequency) {
        const src = state.audio.soundSource || 'synth';
        if (src === 'mono') {
            monoSynth.triggerRelease();
        }
        if (src === 'poly' || src === 'synth' || src === 'both') {
            synth.triggerRelease(zapInfo.frequency);
        }
        // No noteOff for sample player (one-shots)
        sendNoteOff(zapInfo.frequency);
        state.zappedTiles.delete(tileId);
    }
}

export function updateEnvelope(adsr) {
    if (synth) {
        synth.set({
            envelope: {
                attack: adsr.attack,
                decay: adsr.decay,
                sustain: adsr.sustain,
                release: adsr.release
            }
        });
    }
}

export function updateOscillatorType(type) {
    state.audio.oscillatorType = type;
    if (synth) {
        synth.set({ oscillator: { type } });
    }
}

export function updateFilterType(type) {
    state.audio.filterType = type;
    if (filter) {
        filter.type = type;
    }
}

export function updateFilterFrequency(freq) {
    state.audio.filterFrequency = freq;
    if (filter) {
        filter.frequency.rampTo(freq, 0.1);
    }
}

export function updateFilterQ(q) {
    state.audio.filterQ = q;
    if (filter) {
        filter.Q.rampTo(q, 0.1);
    }
}

export function updateMasterVolume(volume) {
    state.audio.masterVolume = volume;
    if (synth) {
        synth.volume.rampTo(Tone.gainToDb(volume), 0.1);
    }
}

export function updateFXChain() {
    // Disconnect synths and player from old FX chain
    if (synth) synth.disconnect();
    if (monoSynth) monoSynth.disconnect();
    if (player) player.disconnect();
    // Re-create FX chain
    createFXChain();
    // Set filter frequency to current value
    if (filter) filter.frequency.value = state.audio.filterFrequency;
    // Reconnect synths and player to new FX chain
    if (synth) synth.connect(filter);
    if (monoSynth) monoSynth.connect(filter);
    if (player) player.connect(Tone.Destination);
}

export function panic() {
    if (synth) {
        synth.releaseAll();
    }
}

