import { state } from './state.js';

let midiAccess = null;
let outputs = [];
let selectedOutput = null;

function freqToMidi(freq) {
    const midiNum = 69 + 12 * Math.log2(freq / 440);
    return Math.round(midiNum);
}

export async function initMidi() {
    if (navigator.requestMIDIAccess) {
        try {
            midiAccess = await navigator.requestMIDIAccess();
            console.log('MIDI Access successful!');
            
            const outputIterator = midiAccess.outputs.values();
            outputs = [];
            for (let output = outputIterator.next(); !output.done; output = outputIterator.next()) {
                outputs.push(output.value);
            }
            
            // If there's a selected output ID in the state, try to set it
            if (state.midi.outputId && outputs.length > 0) {
                selectMidiOutput(state.midi.outputId);
            } else if (outputs.length > 0) {
                // Otherwise, default to the first available output
                selectMidiOutput(outputs[0].id);
            }

            return outputs; // Return the list of devices for the UI
        } catch (e) {
            console.error('Could not access MIDI devices.', e);
            return [];
        }
    } else {
        console.warn('Web MIDI API is not supported in this browser.');
        return [];
    }
}

export function selectMidiOutput(deviceId) {
    selectedOutput = midiAccess.outputs.get(deviceId);
    if (selectedOutput) {
        state.midi.outputId = deviceId;
        console.log(`MIDI output set to: ${selectedOutput.name}`);
    } else {
        console.warn(`Could not find MIDI output with ID: ${deviceId}`);
    }
}

export function sendNoteOn(frequency, velocity = 100) {
    if (!state.midi.enabled || !selectedOutput) return;
    
    const note = freqToMidi(frequency);
    const channel = state.midi.channel - 1; // MIDI channels are 0-15
    const noteOnMessage = [0x90 + channel, note, velocity];
    
    selectedOutput.send(noteOnMessage);
}

export function sendNoteOff(frequency) {
    if (!state.midi.enabled || !selectedOutput) return;

    const note = freqToMidi(frequency);
    const channel = state.midi.channel - 1;
    const noteOffMessage = [0x80 + channel, note, 0]; // Note Off message with 0 velocity

    selectedOutput.send(noteOffMessage);
} 