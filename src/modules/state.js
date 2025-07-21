import { config } from './config.js';

export const state = {
  // Global parameters
  params: {
    frequency: config.paramsDefaults.frequency,
    amplitude: config.paramsDefaults.amplitude,
    time: 0,
    y: config.paramsDefaults.y,
    n: config.paramsDefaults.n,
    speed: config.paramsDefaults.speed,
    rayCount: config.paramsDefaults.rayCount,
    rayConeAngle: config.paramsDefaults.rayConeAngle,
    bpm: config.paramsDefaults.bpm,
    bpmSyncEnabled: config.paramsDefaults.bpmSyncEnabled,
    chordMagnetEnabled: config.music.chordMagnetEnabled,
    chordMagnetStrength: config.music.chordMagnetStrength,
    rootNote: config.music.rootNote,
    scale: config.music.scale,
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
  magneticallyLinkedTiles: new Map(), // Key: source tile UUID, Value: target tile UUID

  // Grid state
  grid: {
    // This will hold the THREE.Group object at runtime
    object: null,
    // This holds the configuration for the grid
    config: {
        width: config.grid.width,
        height: config.grid.height,
        tileSize: config.grid.tileSize
    }
  },

  // Audio state
  audioCtx: null,
  soundEnabled: false,

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
    duration: config.audio.duration,
    durationMode: config.audio.durationMode,
    polyphonyMode: config.audio.polyphonyMode,

    // Oscillator
    oscillatorType: config.audio.oscillator.type,

    // Master Filter
    filterEnabled: config.audio.filter.enabled,
    filterType: config.audio.filter.type,
    filterFrequency: config.audio.filter.frequency,
    filterQ: config.audio.filter.q,

    // Master Volume
    masterVolume: config.audio.masterVolume,
    soundSource: 'synth',
    sample: {
      url: '',
      enabled: false,
      mix: 0.5
    },
  },

  music: {
    rootNote: 'D',
    scale: 'minor',
    octaves: 4,
    scaleFrequencies: []
  },

  ufo: {
    object: null,
    config: {
      velocity: { x: 5, y: 0, z: 3.5 }
    }
  },

  rays: {
      object: null,
      material: null
  },

  tileZap: {
    duration: config.tileZap.duration,
    peakIntensity: config.tileZap.peakIntensity
  },

  // MIDI Settings
  midi: {
    enabled: config.midi.enabled,
    outputId: null,
    channel: config.midi.channel,
  },
}; 