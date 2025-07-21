export const config = {
  // Scene & Grid Configuration
  scene: {
    gridSize: 6,
    gridDiv: 16,
    groundY: -2.5,
  },
  
  grid: {
    width: 20,
    height: 20,
    tileSize: 1
  },

  // Lens Configuration
  lensDefaults: {
    width: 6,
    height: 6,
    segments: 32,
    initialPosition: { x: 0, y: 0, z: 0 },
    initialRotation: { x: -Math.PI / 2, y: 0, z: 0 },
    material: {
      color: 0x00ffff, // A brighter cyan
      wireframe: true,
      transparent: false, // Make it opaque to help with bloom
      opacity: 1.0,
    }
  },

  // Light Source Configuration
  lightSourceDefaults: {
    radius: 0.1,
    segments: 16,
    initialPosition: { x: 0, y: 3, z: 0 },
    material: {
      color: 0xffff00,
    }
  },

  // Music Scale Configuration
  music: {
    dMinorSemitones: [0, 2, 3, 5, 7, 8, 10], // D, E, F, G, A, Bb, C
    baseFreq: 73.42, // D2
    chordMagnetEnabled: false,
    chordMagnetStrength: 1.0,
    rootNote: 'D',
    scale: 'minor'
  },

   // Cymatics Simulation Configuration
   cymatics: {
    freqMultiplierX: 0.2,
    freqMultiplierY: 0.2,
    radialFreqMultiplier: 0.1,
    thetaMultiplier: 4.0,
    amplitudeFactor: 0.2,
  },

  tileZap: {
    duration: 0.4,
    peakIntensity: 0.2 // Lowered for minimal bloom
  },

  // Audio Generation Configuration
  audio: {
    peakGain: 0.05,
    adsr: {
        attack: 0.01,
        decay: 0.01,
        sustain: 0.0,
        release: 0.01
    },
    duration: 0.05,
    durationMode: 'pre', // 'pre' or 'post'
    oscillator: {
        type: 'sine' // sine, square, sawtooth, triangle
    },
    polyphonyMode: 'poly', // 'poly' or 'mono'
    filter: {
        enabled: true,
        type: 'lowpass',
        frequency: 1200,
        q: 1
    },
    distortion: {
        enabled: false,
        amount: 0.2
    },
    saturation: {
        enabled: false,
        amount: 0.2
    },
    limiter: {
        enabled: true,
        threshold: -6
    },
    masterVolume: 0.7,
    sample: {
      url: '', // default: no sample loaded
      enabled: false,
      mix: 0.5 // 0 = only synth, 1 = only sample
    },
    soundSource: 'synth', // 'synth', 'sample', or 'both'
  },

  // Raycaster Configuration
  raycaster: {
    material: {
      color: 0x00ff88,
      lineWidth: 2.0,
      emissive: 0x00ff88,
      emissiveIntensity: 2 // Lowered for less bloom
    }
  },

  bloom: {
    enabled: true,
    strength: 0.12, // Lowered for less bloom
    radius: .43,
    threshold: 0.07
  },

  // Default parameters for lenses, etc.
  paramsDefaults: {
    frequency: 440,
    amplitude: 1.0,
    y: 0.0,
    speed: 1.0,
    bpm: 120,
    bpmSyncEnabled: false,
    // These don't have UI but are good to have in config
    rayCount: 7, 
    rayConeAngle: 0.35,
    n: 1.33
  },

  // MIDI Default Configuration
  midi: {
    enabled: false,
    channel: 1,
  },

  ufo: {
    config: {
      velocity: { x: 5, y: 0, z: 3.5 }
    }
  }
}; 