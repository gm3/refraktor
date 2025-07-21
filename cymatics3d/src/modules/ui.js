import { state } from './state.js';
import { config } from './config.js';
import { addOrRemoveLens2, updateBloom } from './scene.js';
import { NOTE_NAMES, SCALES } from './music.js';
import { updateFilterType, updateFilterFrequency, updateFilterQ, updateMasterVolume, panic } from './audio.js';
import { savePreset, loadPreset } from './presets.js';
import { init as initEnvelopeVisualizer, updateVisualizer as updateEnvelopeVisualizer } from './envelopeVisualizer.js';
import { initMidi, selectMidiOutput } from './midi.js';

let uiContainer;
const valueElements = {};

// --- Value Transformation Logic ---
function toSliderValue(val, max, curve) {
    if (curve === 'exponential') {
        return Math.pow(val / max, 1 / 2) * max;
    }
    return val;
}

function fromSliderValue(val, max, curve) {
    if (curve === 'exponential') {
        return Math.pow(val / max, 2) * max;
    }
    return val;
}

function createSlider(id, label, min, max, step, value, params, lensKey, curve = 'linear') {
  const container = document.createElement('div');
  container.className = 'control-container';

  const header = document.createElement('div');
  header.className = 'control-header';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  header.appendChild(labelEl);
  
  const valueEl = document.createElement('div');
  valueEl.className = 'ui-value';
  valueEl.id = `${id}-value`;
  valueElements[id] = valueEl;
  header.appendChild(valueEl);

  valueEl.addEventListener('click', () => {
    const currentVal = lensKey ? state[lensKey][params] : state.params[params];
    const tempInput = document.createElement('input');
    tempInput.type = 'number';
    tempInput.value = currentVal;
    tempInput.className = 'value-input-box';
    tempInput.step = step;

    valueEl.style.display = 'none';
    valueEl.parentNode.insertBefore(tempInput, valueEl.nextSibling);
    tempInput.focus();
    tempInput.select();

    const applyValue = () => {
        let newValue = parseFloat(tempInput.value);
        if (isNaN(newValue)) newValue = currentVal;
        
        // Clamp value to min/max
        newValue = Math.max(min, Math.min(max, newValue));

        if (lensKey) {
            state[lensKey][params] = newValue;
        } else {
            state.params[params] = newValue;
        }
        slider.value = toSliderValue(newValue, max, curve); // Update slider position
        
        // For filter controls, we need to call the update functions directly
        if(id.includes('filterFrequency')) updateFilterFrequency(newValue);
        if(id.includes('filterQ')) updateFilterQ(newValue);
        if(id.includes('masterVolume')) updateMasterVolume(newValue);

        tempInput.parentNode.removeChild(tempInput);
        valueEl.style.display = 'block';
        updateUIValues();
    };

    tempInput.addEventListener('blur', applyValue);
    tempInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applyValue();
        } else if (e.key === 'Escape') {
            tempInput.parentNode.removeChild(tempInput);
            valueEl.style.display = 'block';
        }
    });
  });

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = id;
  slider.min = (curve === 'exponential') ? min : min;
  slider.max = max;
  slider.step = step;
  slider.value = toSliderValue(value, max, curve);
  
  slider.addEventListener('input', (e) => {
    let newValue = parseFloat(e.target.value);
    newValue = fromSliderValue(newValue, max, curve);

    if (lensKey) {
      state[lensKey][params] = newValue;
    } else {
      state.params[params] = newValue;
    }
    // For filter controls, we need to call the update functions directly
    if(id.includes('filterFrequency')) updateFilterFrequency(newValue);
    if(id.includes('filterQ')) updateFilterQ(newValue);
    if(id.includes('masterVolume')) updateMasterVolume(newValue);
    updateUIValues();
  });

  container.appendChild(header);
  container.appendChild(slider);
  return container;
}

function createDropdown(id, label, options, selectedValue, onChange) {
    const container = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.id = id;
    select.className = 'custom-select'; // Add class for styling
    for (const option of options) {
        const optionEl = document.createElement('option');
        // Handle both simple arrays and value/text objects
        const value = typeof option === 'object' ? option.value : option;
        const text = typeof option === 'object' ? option.text : option;
        optionEl.value = value;
        optionEl.textContent = text;
        if (value === selectedValue) {
            optionEl.selected = true;
        }
        select.appendChild(optionEl);
    }
    select.addEventListener('change', (e) => onChange(e.target.value));

    container.appendChild(labelEl);
    container.appendChild(select);
    return container;
}

function createMusicControls() {
    const container = document.createElement('div');
    container.className = 'music-controls';

    const title = document.createElement('h3');
    title.textContent = 'Chord Magnet';
    container.appendChild(title);

    const magnetToggle = createToggle('chord-magnet-enabled', 'Enable Chord Magnet', state.params.chordMagnetEnabled, (checked) => {
        state.params.chordMagnetEnabled = checked;
        document.getElementById('chord-magnet-options').style.display = checked ? 'block' : 'none';
    }, 'toggle-label');
    container.appendChild(magnetToggle);

    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'chord-magnet-options';
    optionsContainer.style.display = state.params.chordMagnetEnabled ? 'block' : 'none';
    
    const strengthSlider = createSlider('chordMagnetStrength', 'Magnet Strength', 0, 1, 0.01, state.params.chordMagnetStrength, 'chordMagnetStrength');
    optionsContainer.appendChild(strengthSlider);

    const rootNoteDropdown = createDropdown('rootNote', 'Root Note', NOTE_NAMES, state.params.rootNote, (value) => {
        state.params.rootNote = value;
    });
    optionsContainer.appendChild(rootNoteDropdown);

    const scaleDropdown = createDropdown('scale', 'Scale', Object.keys(SCALES), state.params.scale, (value) => {
        state.params.scale = value;
    });
    optionsContainer.appendChild(scaleDropdown);

    container.appendChild(optionsContainer);
    return container;
}

function createEnvelopeControls() {
    const container = document.createElement('div');
    container.className = 'control-group';

    const adsrTitle = document.createElement('h4');
    adsrTitle.textContent = 'ADSR Envelope';
    container.appendChild(adsrTitle);

    const visualizerCanvas = document.createElement('canvas');
    visualizerCanvas.id = 'adsr-canvas';
    visualizerCanvas.width = 180;
    visualizerCanvas.height = 80;
    container.appendChild(visualizerCanvas);

    const attackSlider = createSlider('attack', 'Attack', 0.01, 5, 0.001, state.audio.attack, 'attack', 'audio', 'exponential');
    attackSlider.querySelector('input').addEventListener('input', (e) => updateEnvelopeVisualizer({ attack: state.audio.attack }));
    container.appendChild(attackSlider);

    const decaySlider = createSlider('decay', 'Decay', 0.01, 5, 0.001, state.audio.decay, 'decay', 'audio', 'exponential');
    decaySlider.querySelector('input').addEventListener('input', (e) => updateEnvelopeVisualizer({ decay: state.audio.decay }));
    container.appendChild(decaySlider);

    const sustainSlider = createSlider('sustain', 'Sustain', 0, 1, 0.01, state.audio.sustain, 'sustain', 'audio');
    sustainSlider.querySelector('input').addEventListener('input', (e) => updateEnvelopeVisualizer({ sustain: state.audio.sustain }));
    container.appendChild(sustainSlider);

    const releaseSlider = createSlider('release', 'Release', 0.01, 5, 0.001, state.audio.release, 'release', 'audio', 'exponential');
    releaseSlider.querySelector('input').addEventListener('input', (e) => updateEnvelopeVisualizer({ release: state.audio.release }));
    container.appendChild(releaseSlider);

    // Initialize the visualizer after the sliders are created
    setTimeout(() => {
        initEnvelopeVisualizer(visualizerCanvas, state.audio, (newValues) => {
            // This callback is triggered when the visualizer is updated by dragging
            state.audio.attack = newValues.attack;
            state.audio.decay = newValues.decay;
            state.audio.sustain = newValues.sustain;
            state.audio.release = newValues.release;

            // Manually update the slider positions to match
            document.querySelector('#attack').value = toSliderValue(newValues.attack, 5, 'exponential');
            document.querySelector('#decay').value = toSliderValue(newValues.decay, 5, 'exponential');
            document.querySelector('#sustain').value = toSliderValue(newValues.sustain, 1, 'linear');
            document.querySelector('#release').value = toSliderValue(newValues.release, 5, 'exponential');

            // And update the text value displays
            updateUIValues();
        });
    }, 0);

    return container;
}

function createFilterControls() {
    const container = document.createElement('div');
    container.className = 'control-group';

    const filterTitle = document.createElement('h4');
    filterTitle.textContent = 'Master Filter';
    container.appendChild(filterTitle);
    const filterTypes = ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'lowshelf', 'highshelf'];
    const filterTypeDropdown = createDropdown('filterType', 'Type', filterTypes, state.audio.filterType, updateFilterType);
    container.appendChild(filterTypeDropdown);
    const filterFreqSlider = createSlider('filterFrequency', 'Frequency', 20, 20000, 1, state.audio.filterFrequency, 'filterFrequency', 'audio', 'exponential');
    container.appendChild(filterFreqSlider);
    const filterQSlider = createSlider('filterQ', 'Q / Resonance', 0.1, 30, 0.1, state.audio.filterQ, 'filterQ', 'audio');
    container.appendChild(filterQSlider);

    return container;
}

function createBloomControls() {
    const container = document.createElement('div');
    container.className = 'control-group';

    const title = document.createElement('h4');
    title.textContent = 'Bloom Effect';
    container.appendChild(title);

    const enabledToggle = createToggle('bloomEnabled', 'Enable', state.bloomParams.enabled, (checked) => {
        state.bloomParams.enabled = checked;
        state.composer.passes[1].enabled = checked;
    }, 'toggle-label');
    container.appendChild(enabledToggle);

    const strengthSlider = createSlider('bloomStrength', 'Strength', 0, 3, 0.01, state.bloomParams.strength, 'strength', 'bloomParams');
    strengthSlider.querySelector('input').addEventListener('input', updateBloom);
    container.appendChild(strengthSlider);
    
    const radiusSlider = createSlider('bloomRadius', 'Radius', 0, 1, 0.01, state.bloomParams.radius, 'radius', 'bloomParams');
    radiusSlider.querySelector('input').addEventListener('input', updateBloom);
    container.appendChild(radiusSlider);

    const thresholdSlider = createSlider('bloomThreshold', 'Threshold', 0, 1, 0.01, state.bloomParams.threshold, 'threshold', 'bloomParams');
    thresholdSlider.querySelector('input').addEventListener('input', updateBloom);
    container.appendChild(thresholdSlider);

    return container;
}


function createMidiControls() {
    const container = document.createElement('div');
    container.className = 'ui-section';

    const title = document.createElement('h3');
    title.textContent = 'MIDI';
    container.appendChild(title);

    const midiEnableToggle = createToggle('midi-enabled', 'Enable MIDI Output', state.midi.enabled, (checked) => {
        state.midi.enabled = checked;
        document.getElementById('midi-options').style.display = checked ? 'block' : 'none';
    });
    container.appendChild(midiEnableToggle);
    
    const midiOptions = document.createElement('div');
    midiOptions.id = 'midi-options';
    midiOptions.style.display = state.midi.enabled ? 'block' : 'none';

    // Placeholder for dropdown
    const midiDeviceDropdownContainer = document.createElement('div');
    midiDeviceDropdownContainer.id = 'midi-device-dropdown-container';
    midiOptions.appendChild(midiDeviceDropdownContainer);

    initMidi().then(outputs => {
        const options = outputs.map(output => ({ value: output.id, text: output.name }));
        const dropdown = createDropdown('midi-output', 'Output Device', options, state.midi.outputId, selectMidiOutput);
        midiDeviceDropdownContainer.appendChild(dropdown);
    });

    const channelInput = document.createElement('input');
    channelInput.type = 'number';
    channelInput.min = 1;
    channelInput.max = 16;
    channelInput.value = state.midi.channel;
    channelInput.addEventListener('input', (e) => {
        state.midi.channel = parseInt(e.target.value, 10);
    });
    
    const channelLabel = document.createElement('label');
    channelLabel.textContent = 'Channel';
    channelLabel.appendChild(channelInput);
    midiOptions.appendChild(channelLabel);

    container.appendChild(midiOptions);
    return container;
}


function createMasterControls() {
    const container = document.createElement('div');
    container.className = 'ui-section';

    const title = document.createElement('h3');
    title.textContent = 'Master';
    container.appendChild(title);

    const volumeSlider = createSlider('masterVolume', 'Volume', 0, 1, 0.01, state.audio.masterVolume, 'masterVolume', 'audio');
    volumeSlider.querySelector('input').addEventListener('input', (e) => updateMasterVolume(parseFloat(e.target.value)));
    container.appendChild(volumeSlider);
    
    const panicButton = document.createElement('button');
    panicButton.textContent = 'Panic (Reset)';
    panicButton.onclick = panic;
    container.appendChild(panicButton);

    return container;
}


function createPresetControls() {
    const container = document.createElement('div');
    container.className = 'preset-controls';

    const controlsRow = document.createElement('div');
    controlsRow.className = 'preset-controls-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Preset Name';
    nameInput.className = 'value-input-box';
    nameInput.id = 'preset-name-input';
    nameInput.value = 'default';
    controlsRow.appendChild(nameInput);
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.onclick = () => {
        const name = nameInput.value.trim();
        if (name) {
            savePreset(name);
        } else {
            alert('Please enter a name for the preset.');
        }
    };
    controlsRow.appendChild(saveButton);

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load';
    loadButton.onclick = async () => {
        const presetName = await loadPreset();
        if (presetName) {
            nameInput.value = presetName;
        }
    };
    controlsRow.appendChild(loadButton);
    
    container.appendChild(controlsRow);
    return container;
}

function createToggle(id, label, checked, onChange, className = '') {
    const container = document.createElement('div');
    container.className = 'toggle-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;
    checkbox.addEventListener('change', (e) => onChange(e.target.checked));

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    if (className) {
        labelEl.className = className;
    }
    
    container.appendChild(checkbox);
    container.appendChild(labelEl);
    return container;
}

function createBpmControls(idPrefix, params) {
    const container = document.createElement('div');
    container.className = 'bpm-container';

    const bpmSyncToggle = createToggle(`${idPrefix}-bpm-sync`, 'BPM Sync', params.bpmSyncEnabled, (checked) => {
        params.bpmSyncEnabled = checked;
        document.getElementById(`${idPrefix}-bpm-group`).style.display = checked ? 'block' : 'none';
        document.getElementById(`${idPrefix}-speed-slider`).style.display = checked ? 'none' : 'block';
    }, 'toggle-label');

    const bpmGroup = document.createElement('div');
    bpmGroup.id = `${idPrefix}-bpm-group`;
    bpmGroup.style.display = params.bpmSyncEnabled ? 'block' : 'none';

    const bpmLabel = document.createElement('label');
    bpmLabel.htmlFor = `${idPrefix}-bpm`;
    bpmLabel.textContent = `BPM`;
    
    const bpmValueEl = document.createElement('div');
    bpmValueEl.className = 'ui-value';
    bpmValueEl.id = `${idPrefix}-bpm-value`;
    valueElements[`${idPrefix}-bpm`] = bpmValueEl;

    const bpmInput = document.createElement('input');
    bpmInput.type = 'range';
    bpmInput.id = `${idPrefix}-bpm`;
    bpmInput.min = 40;
    bpmInput.max = 240;
    bpmInput.step = 1;
    bpmInput.value = params.bpm;
    bpmInput.addEventListener('input', (e) => {
        params.bpm = parseFloat(e.target.value);
    });
    
    bpmGroup.appendChild(bpmLabel);
    bpmGroup.appendChild(bpmInput);
    bpmGroup.appendChild(bpmValueEl);
    
    container.appendChild(bpmSyncToggle);
    container.appendChild(bpmGroup);

    return container;
}


export function createUI({ onToggleSound, isSoundEnabled }) {
  uiContainer = document.createElement('div');
  uiContainer.id = 'cymatics-ui';

  // --- General Controls Section ---
  const generalControls = document.createElement('div');
  generalControls.className = 'ui-section';
  const generalTitle = document.createElement('h3');
  generalTitle.textContent = 'General';
  generalControls.appendChild(generalTitle);
  const soundToggle = createToggle('sound-enabled', 'Sound Enabled', isSoundEnabled(), onToggleSound, 'toggle-label');
  generalControls.appendChild(soundToggle);
  const addLens2Button = document.createElement('button');
  addLens2Button.textContent = state.lens2 ? 'Remove Lens 2' : 'Add Lens 2';
  addLens2Button.addEventListener('click', () => {
    const lens2Added = addOrRemoveLens2();
    document.getElementById('lens2-section').style.display = lens2Added ? 'flex' : 'none';
    addLens2Button.textContent = lens2Added ? 'Remove Lens 2' : 'Add Lens 2';
  });
  generalControls.appendChild(addLens2Button);
  generalControls.appendChild(createPresetControls());
  uiContainer.appendChild(generalControls);


  // --- Lens 1 Section ---
  const lens1Section = document.createElement('div');
  lens1Section.className = 'ui-section';
  const lens1Title = document.createElement('h3');
  lens1Title.textContent = 'Lens 1';
  lens1Section.appendChild(lens1Title);
  const freqSlider = createSlider('frequency', 'Frequency', 20, 20000, 1, state.params.frequency, 'frequency');
  lens1Section.appendChild(freqSlider);
  const ampSlider = createSlider('amplitude', 'Amplitude', 0.1, 10.0, 0.1, state.params.amplitude, 'amplitude');
  lens1Section.appendChild(ampSlider);
  const speedSlider = createSlider('speed', 'Animation Speed', 0, 20, 0.1, state.params.speed, 'speed');
  speedSlider.id = 'lens1-speed-slider';
  speedSlider.style.display = state.params.bpmSyncEnabled ? 'none' : 'block';
  lens1Section.appendChild(speedSlider);
  lens1Section.appendChild(createBpmControls('lens1', state.params));
  const y1Slider = createSlider('y1', 'Y Position', -2.0, 2.0, 0.1, state.params.y, 'y');
  lens1Section.appendChild(y1Slider);
  const nSlider = createSlider('n', 'Refractive Index', 1.0, 5.0, 0.01, state.params.n, 'n');
  lens1Section.appendChild(nSlider);
  const rayCountSlider = createSlider('rayCount', 'Ray Count', 1, 30, 1, state.params.rayCount, 'rayCount');
  lens1Section.appendChild(rayCountSlider);
  const rayConeAngleSlider = createSlider('rayConeAngle', 'Ray Cone Angle', 0.0, 3.14, 0.01, state.params.rayConeAngle, 'rayConeAngle');
  lens1Section.appendChild(rayConeAngleSlider);
  uiContainer.appendChild(lens1Section);

  // --- Lens 2 Section (initially hidden) ---
  const lens2Section = document.createElement('div');
  lens2Section.className = 'ui-section';
  lens2Section.id = 'lens2-section';
  lens2Section.style.display = state.lens2 ? 'flex' : 'none';
  const lens2Title = document.createElement('h3');
  lens2Title.textContent = 'Lens 2';
  lens2Section.appendChild(lens2Title);
  const freq2Slider = createSlider('frequency2', 'Frequency', 20, 20000, 1, state.lens2Params.frequency, 'frequency', 'lens2Params');
  lens2Section.appendChild(freq2Slider);
  const amp2Slider = createSlider('amplitude2', 'Amplitude', 0.1, 10.0, 0.1, state.lens2Params.amplitude, 'amplitude', 'lens2Params');
  lens2Section.appendChild(amp2Slider);
  const speed2Slider = createSlider('speed2', 'Animation Speed', 0, 20, 0.1, state.lens2Params.speed, 'speed', 'lens2Params');
  speed2Slider.id = 'lens2-speed-slider';
  speed2Slider.style.display = state.lens2Params.bpmSyncEnabled ? 'none' : 'block';
  lens2Section.appendChild(speed2Slider);
  lens2Section.appendChild(createBpmControls('lens2', state.lens2Params));
  const y2Slider = createSlider('y2', 'Y Position', -2.0, 2.0, 0.1, state.lens2Params.y, 'y', 'lens2Params');
  lens2Section.appendChild(y2Slider);
  const n2Slider = createSlider('n2', 'Refractive Index', 1.0, 5.0, 0.01, state.lens2Params.n, 'n', 'lens2Params');
  lens2Section.appendChild(n2Slider);
  uiContainer.appendChild(lens2Section);

  // --- Music Section ---
  const musicSection = document.createElement('div');
  musicSection.className = 'ui-section';
  musicSection.appendChild(createMusicControls());
  uiContainer.appendChild(musicSection);

  // --- Envelope Section ---
  const envelopeSection = document.createElement('div');
  envelopeSection.className = 'ui-section';
  envelopeSection.appendChild(createEnvelopeControls());
  uiContainer.appendChild(envelopeSection);
  
  // --- Filter Section ---
  const filterSection = document.createElement('div');
  filterSection.className = 'ui-section';
  filterSection.appendChild(createFilterControls());
  uiContainer.appendChild(filterSection);

  // --- Bloom Section ---
  const bloomSection = document.createElement('div');
  bloomSection.className = 'ui-section';
  bloomSection.appendChild(createBloomControls());
  uiContainer.appendChild(bloomSection);

  // --- MIDI Section ---
  const midiSection = createMidiControls();
  uiContainer.appendChild(midiSection);

  // --- Master Section ---
  const masterSection = document.createElement('div');
  masterSection.className = 'ui-section';
  masterSection.appendChild(createMasterControls());
  uiContainer.appendChild(masterSection);

  document.getElementById('ui-container-wrapper').appendChild(uiContainer);
}

export function updateUIValues() {
    if (!uiContainer) return;

    Object.keys(valueElements).forEach(id => {
        const el = valueElements[id];
        if (!el) return;

        let value;
        let precision = 2;
        let suffix = '';
        let paramKey, lensKey;

        // This is getting complex, maybe refactor later.
        if (id.startsWith('bloom')) {
            paramKey = id.replace('bloom', '').toLowerCase();
            value = state.bloomParams[paramKey];
        } else if (id.startsWith('filter')) {
            paramKey = id.replace('filter', '').toLowerCase();
            value = state.audio[paramKey];
            if (id === 'filterFrequency') { precision = 0; suffix = ' Hz'; }
        } else if (['attack', 'decay', 'release'].includes(id)) {
            value = state.audio[id];
            precision = 3;
            suffix = 's';
        } else if (id === 'sustain' || id === 'masterVolume') {
            value = state.audio[id];
        } else if (id.includes('bpm')) {
            lensKey = id.includes('lens2') ? 'lens2Params' : 'params';
            value = state[lensKey].bpm;
            precision = 0;
            suffix = ' BPM';
        } else if (id.includes('frequency')) {
             const isLens2 = id.includes('lens2');
             const lensKey = isLens2 ? 'lens2Params' : 'params';
             value = state[lensKey].frequency; // Correctly get the frequency from the state
             precision = 0;
             suffix = ' Hz';
        } else {
            const slider = document.getElementById(id);
            if(slider) {
                lensKey = slider.dataset.lensKey;
                paramKey = slider.dataset.paramKey;
                 if(lensKey && paramKey && state[lensKey]) {
                    value = state[lensKey][paramKey];
                }
            }
        }
        
        if (value !== undefined) {
             el.textContent = parseFloat(value).toFixed(precision) + suffix;
        }
    });
} 