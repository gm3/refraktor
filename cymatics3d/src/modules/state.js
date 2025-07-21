import { config } from './config.js';

export const state = {
  // Global parameters
  params: {
    frequency: 440,
    amplitude: 1.0,
    time: 0,
    y: 0.0,
    n: 1.33,
    speed: 1.0,
    rayCount: 7,
    rayConeAngle: 0.35,
    bpm: 120,
    bpmSyncEnabled: false,
    chordMagnetEnabled: false,
    chordMagnetStrength: 1.0,
    rootNote: 'D',
    scale: 'minor',
  },
  bloomParams: {
    enabled: config.bloom.enabled,
    strength: config.bloom.strength,
    radius: config.bloom.radius,
    threshold: config.bloom.threshold,
  },
  lens2Params: {
    frequency: 440,
    amplitude: 1.0,
    y: -1.5,
    n: 1.33,
    time: 0,
    speed: 1.0,
    bpm: 120,
    bpmSyncEnabled: false,
  },

  // Scene objects
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  transformControls: null,
  lightSource: null,
  lens: null,
  lens2: null,
  gridTiles: [],
  zappedTiles: new Map(),

  // Audio state
  audioCtx: null,
  soundEnabled: false,
  activeOscillators: new Map(),

  // UI state
  sweepEnabled: false,
  sweepStartTime: 0,
  sweepDirection: 1,
  freqManual: 440,
  sweep2Enabled: false,
  sweep2StartTime: 0,
  sweep2Direction: 1,
  freq2Manual: 440,

  // Audio settings
  audio: {
    // ADSR Envelope
    attack: config.audio.adsr.attack,
    decay: config.audio.adsr.decay,
    sustain: config.audio.adsr.sustain,
    release: config.audio.adsr.release,

    // Master Filter
    filterEnabled: config.audio.filter.enabled,
    filterType: config.audio.filter.type,
    filterFrequency: config.audio.filter.frequency,
    filterQ: config.audio.filter.q,

    // Master Volume
    masterVolume: config.audio.masterVolume,
  },

  tileZap: {
    duration: config.tileZap.duration,
    peakIntensity: config.tileZap.peakIntensity
  },

  // MIDI Settings
  midi: {
    enabled: false,
    outputId: null,
    channel: 1,
  },
}; 