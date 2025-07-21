import { state } from './state.js';

export const NOTES = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
};

export const NOTE_NAMES = Object.keys(NOTES);

export const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], // Major scale intervals
    minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor scale intervals
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
};

export const CHORDS = {
    major: [0, 4, 7], // Major triad
    minor: [0, 3, 7], // Minor triad
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
};

/**
 * Gets the frequencies for a given scale.
 * @param {string} rootNote - E.g., 'C', 'F#'.
 * @param {string} scaleName - E.g., 'major', 'minor'.
 * @param {number} octaves - Number of octaves to generate.
 * @returns {number[]} - Array of frequencies.
 */
export function getScaleFrequencies(rootNote = 'C', scaleName = 'major', octaves = 4) {
    const scaleIntervals = SCALES[scaleName];
    if (!scaleIntervals) throw new Error(`Scale '${scaleName}' not found.`);

    const rootNoteIndex = NOTE_NAMES.indexOf(rootNote);
    if (rootNoteIndex === -1) throw new Error(`Root note '${rootNote}' not found.`);

    const frequencies = [];
    for (let o = 0; o < octaves; o++) {
        for (const interval of scaleIntervals) {
            const noteIndex = (rootNoteIndex + interval) % 12;
            const noteName = NOTE_NAMES[noteIndex];
            const octaveMultiplier = Math.pow(2, o + Math.floor((rootNoteIndex + interval) / 12));
            frequencies.push(NOTES[noteName] * octaveMultiplier);
        }
    }
    return frequencies;
}

/**
 * Finds the closest frequency in a given list of frequencies.
 * @param {number} targetFreq - The frequency to match.
 * @param {number[]} freqList - The list of frequencies to search in.
 * @returns {number} - The closest frequency from the list.
 */
export function findClosestFrequency(targetFreq, freqList) {
    return freqList.reduce((prev, curr) => {
        return (Math.abs(curr - targetFreq) < Math.abs(prev - targetFreq) ? curr : prev);
    });
} 

/**
 * Updates the global state with a pre-calculated array of frequencies for the current musical scale.
 * Should be called whenever the root note, scale, or octave range changes.
 */
export function updateMusicScale() {
    if (!state.music) state.music = {};
    const root = state.music.rootNote || 'C';
    const scale = state.music.scale || 'major';
    const octaves = state.music.octaves || 4;
    state.music.scaleFrequencies = getScaleFrequencies(root, scale, octaves);
} 