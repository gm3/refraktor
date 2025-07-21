// Keyboard visualizer for REFRAKTOR
// Renders a simple piano keyboard and highlights keys when notes are played
// Usage: keyboardVisualizer.init(containerElement, { numOctaves: 2, startNote: 'C4' });
//        keyboardVisualizer.setActiveNotes([midiNote1, midiNote2, ...]);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let keyElements = [];
let config = { numOctaves: 2, startNote: 'C4' };
let container = null;
let onNoteOn = null;
let onNoteOff = null;

function midiToNoteName(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const note = NOTE_NAMES[midi % 12];
    return note + octave;
}

function noteNameToMidi(noteName) {
    const match = noteName.match(/^([A-G]#?)(\d)$/);
    if (!match) return 60; // Default to C4
    const note = match[1];
    const octave = parseInt(match[2], 10);
    return NOTE_NAMES.indexOf(note) + (octave + 1) * 12;
}

export function setNoteHandlers(noteOnHandler, noteOffHandler) {
    onNoteOn = noteOnHandler;
    onNoteOff = noteOffHandler;
}

export function init(containerElement, options = {}) {
    container = containerElement;
    config = { ...config, ...options };
    container.innerHTML = '';
    keyElements = [];
    const startMidi = noteNameToMidi(config.startNote);
    const numKeys = config.numOctaves * 12;
    for (let i = 0; i < numKeys; i++) {
        const midi = startMidi + i;
        const note = NOTE_NAMES[midi % 12];
        const key = document.createElement('div');
        key.className = 'kv-key ' + (note.includes('#') ? 'kv-black' : 'kv-white');
        key.dataset.midi = midi;
        key.title = midiToNoteName(midi);
        // Make keys clickable
        key.onmousedown = e => {
            e.preventDefault();
            if (onNoteOn) onNoteOn(midi);
        };
        key.onmouseup = e => {
            e.preventDefault();
            if (onNoteOff) onNoteOff(midi);
        };
        key.onmouseleave = e => {
            if (onNoteOff) onNoteOff(midi);
        };
        container.appendChild(key);
        keyElements.push(key);
    }
    // Style
    container.style.display = 'flex';
    container.style.height = '48px';
    container.style.position = 'relative';
    container.style.background = '#222';
    container.style.pointerEvents = 'auto';
}

export function setActiveNotes(midiNotes) {
    keyElements.forEach(key => {
        if (midiNotes.includes(Number(key.dataset.midi))) {
            key.classList.add('kv-active');
        } else {
            key.classList.remove('kv-active');
        }
    });
}

// CSS (add to main.css):
// .kv-key { flex: 1 0 0; border: 1px solid #333; box-sizing: border-box; position: relative; }
// .kv-white { background: #fff; height: 100%; z-index: 1; }
// .kv-black { background: #222; height: 60%; width: 60%; position: absolute; left: 70%; top: 0; z-index: 2; }
// .kv-active { background: #00ff88 !important; box-shadow: 0 0 8px #00ff88; } 