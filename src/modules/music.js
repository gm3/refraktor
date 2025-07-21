import * as Tone from 'tone';
import { state } from './state';

/**
 * Updates the global state with a pre-calculated array of frequencies for the current musical scale.
 * This should be called whenever the root note, scale, or octave range changes.
 */
export function updateMusicScale() {
    state.music.scaleFrequencies = getScaleFrequencies(
        state.music.rootNote,
        state.music.scale,
        state.music.octaves
    );
}


/**
 * Generates an array of frequencies for a given scale, root note, and octave range.
 * @param {string} rootNote - The root note (e.g., 'C', 'G#').
 * @param {string} scale - The scale name (e.g., 'major', 'minor').
 * @param {number} octaveRange - The number of octaves to generate.
 * @returns {number[]} An array of frequencies.
 */
export function getScaleFrequencies(rootNote, scale, octaveRange) {
    const scaleType = scales[scale];
    if (!scaleType) {
        console.warn(`Scale '${scale}' not found.`);
        return [];
    }

    const frequencies = [];
    const rootMidi = Tone.Frequency(rootNote).toMidi();

    for (let octave = 0; octave < octaveRange; octave++) {
        scaleType.forEach(interval => {
            const midiNote = rootMidi + (octave * 12) + interval;
            if (midiNote <= 127) { // Ensure it's a valid MIDI note
                frequencies.push(Tone.Frequency(midiNote, 'midi').toFrequency());
            }
        });
    }
    // Add the highest note of the scale, one octave up, to cap the range.
    const topNote = rootMidi + (octaveRange * 12);
    if (topNote <= 127) {
        frequencies.push(Tone.Frequency(topNote, 'midi').toFrequency());
    }


    return frequencies.sort((a, b) => a - b);
}

/**
 * Finds the frequency in the scale that is closest to the given frequency.
 * @param {number} targetFreq - The frequency to match.
 * @param {number[]} freqList - The list of frequencies to search in.
 * @returns {number} The closest frequency from the list.
 */
export function findClosestFrequency(targetFreq, freqList) {
    if (!freqList || freqList.length === 0) {
        // Return the original frequency if the list is invalid, to avoid breaking playback.
        return targetFreq;
    }
    return freqList.reduce((prev, curr) => {
        return (Math.abs(curr - targetFreq) < Math.abs(prev - targetFreq) ? curr : prev);
    });
}

/**
 * A mapping of scale names to their intervals in semitones from the root.
 */
export const scales = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'pentatonic': [0, 2, 4, 7, 9],
    'blues': [0, 3, 5, 6, 7, 10],
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}; 