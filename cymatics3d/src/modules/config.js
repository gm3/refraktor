export const config = {
  // Scene & Grid Configuration
  scene: {
    gridSize: 6,
    gridDiv: 16,
    groundY: -2.5,
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
  },

  // Cymatics Simulation Configuration
/*   cymatics: {
    freqMultiplierX: 0.2,
    freqMultiplierY: 0.2,
    radialFreqMultiplier: 0.1,
    thetaMultiplier: 4.0,
    amplitudeFactor: 0.2,
  }, */

   // Cymatics Simulation Configuration
   cymatics: {
    freqMultiplierX: 22.2,
    freqMultiplierY: 22.2,
    radialFreqMultiplier: 44.1,
    thetaMultiplier: 4.0,
    amplitudeFactor: 0.2,
  },

  tileZap: {
    duration: 0.4,
    peakIntensity: 10.0
  },

  // Audio Generation Configuration
  audio: {
    peakGain: 0.05,
    adsr: {
        attack: 0.02,
        decay: 0.16,
        sustain: 0.0,
        release: 0.0
    },
    filter: {
        enabled: true,
        type: 'lowpass',
        frequency: 1200,
        q: 1
    },
    masterVolume: 0.7
  },

  // Raycaster Configuration
  raycaster: {
    material: {
      color: 0x00ff88,
      lineWidth: 2.0,
      emissiveIntensity: 8
    }
  },

  bloom: {
    enabled: true,
    strength: 0.19,
    radius: .43,
    threshold: 0.07
  },

  oscillator: {
    type: 'sine' // sine, square, sawtooth, triangle
  }
}; 