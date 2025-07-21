// src/modules/ui/components.js

// --- Value Transformation Logic ---
function toSliderValue(val, max, curve) {
    if (curve === 'exponential') {
        return Math.pow(val / max, 1 / 3) * max;
    }
    return val;
}

function fromSliderValue(val, max, curve) {
    if (curve === 'exponential') {
        return Math.pow(val / max, 3) * max;
    }
    return val;
}

// --- Component Creation Functions ---

export function createSlider({ id, label, min, max, step, curve, getValue, onChange, valueElements }) {
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
    if (valueElements) {
        valueElements[id] = valueEl; // For global updates if needed
    }
    header.appendChild(valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = toSliderValue(getValue(), max, curve);

    const updateValueDisplay = (val) => {
        let text = parseFloat(val).toFixed(2);
        if (id.includes('Frequency')) text = `${parseFloat(val).toFixed(0)} Hz`;
        if (['attack', 'decay', 'release', 'duration'].includes(id)) text = `${parseFloat(val).toFixed(3)}s`;
        if (id.includes('bpm')) text = `${parseFloat(val).toFixed(0)} BPM`;
        valueEl.textContent = text;
    };
    
    slider.addEventListener('input', (e) => {
        const newValue = fromSliderValue(parseFloat(e.target.value), max, curve);
        onChange(newValue);
        updateValueDisplay(newValue); // Update label immediately
    });

    container.appendChild(header);
    container.appendChild(slider);
    
    updateValueDisplay(getValue()); // Set initial value

    return container;
}

export function createDropdown({ id, label, options, getValue, onChange }) {
    const container = document.createElement('div');
    container.className = 'control-container';
    
    if (label) {
        const labelEl = document.createElement('label');
        labelEl.htmlFor = id;
        labelEl.textContent = label;
        container.appendChild(labelEl);
    }

    const select = document.createElement('select');
    select.id = id;
    select.className = 'custom-select';
    for (const option of options) {
        const optionEl = document.createElement('option');
        const value = typeof option === 'object' ? option.value : option;
        const text = typeof option === 'object' ? option.text : option;
        optionEl.value = value;
        optionEl.textContent = text;
        if (value === getValue()) optionEl.selected = true;
        select.appendChild(optionEl);
    }
    select.addEventListener('change', (e) => onChange(e.target.value));

    container.appendChild(select);
    return container;
}

export function createToggle(config) {
    const { id, label, getValue, onChange } = config;
    const wrapper = document.createElement('div');
    wrapper.className = 'component-wrapper toggle-wrapper';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = id;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    
    // DEFENSIVE CHECK: Ensure getValue is a function before calling it.
    if (typeof getValue !== 'function') {
        console.error(`Error for toggle with ID "${id}": 'getValue' is not a function. It is a '${typeof getValue}'. Defaulting to false.`);
        input.checked = false;
    } else {
        input.checked = getValue();
    }
    
    input.onchange = () => {
        if (onChange) onChange(input.checked);
    };

    // This is needed to update the UI if the state changes from somewhere else
    input.update = () => {
        if (typeof getValue === 'function') {
            input.checked = getValue();
        }
    };

    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    return wrapper;
}

export function createButton({ id, label, onClick }) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = label;
    button.onclick = onClick;
    return button;
}

export function createInput({ id, placeholder, getValue, onSave }) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.placeholder = placeholder;
    input.className = 'value-input-box';
    if(getValue) input.value = getValue();
    input.addEventListener('change', () => onSave(input.value));
    return input;
}

export function createContainer({ id, children, style = 'block' }) {
    const container = document.createElement('div');
    container.id = id;
    container.style.display = style;
    // This is a placeholder for a function that would build children
    // In a real framework, this would be more robust.
    return container;
}

export function createComponent(config) {
    let element;
    switch (config.type) {
        case 'slider':
            element = createSlider(config);
            break;
        case 'dropdown':
            element = createDropdown(config);
            break;
        case 'toggle':
            element = createToggle(config);
            break;
        case 'button':
            element = createButton(config);
            break;
        case 'input':
            element = document.createElement('div');
            element.className = 'input-group';
            element.innerHTML = `
                <input type="text" id="${config.id}" placeholder="${config.placeholder || ''}" />
                <button id="save-${config.id}">Save</button>
            `;
            element.querySelector(`#save-${config.id}`).addEventListener('click', () => {
                const input = element.querySelector(`#${config.id}`);
                config.onSave(input.value);
            });
            break;

        case 'canvas':
            element = document.createElement('canvas');
            element.id = config.id;
            // The `onMount` callback will handle initialization
            break;

        default:
            element = document.createElement('div');
            element.textContent = `Unknown component type: ${config.type}`;
    }
    return element;
}