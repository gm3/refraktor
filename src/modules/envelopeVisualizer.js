const D_NODE = 10; // Draggable node diameter

let canvas, ctx;
let points = []; // Control points for ADSR: [Attack, Decay, Sustain, Release]
let onUpdateCallback;

function getCanvasCoordinates(time, level) {
    const x = (time / state.getTotalTime()) * canvas.width;
    const y = (1 - level) * canvas.height;
    return { x, y };
}

function draw() {
    if (!ctx) return;
    const { attack, decay, sustain, release } = state.getValues();
    const totalTime = state.getTotalTime();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Define points ---
    const start = { x: 0, y: canvas.height };
    const attackEnd = getCanvasCoordinates(attack, 1.0);
    const decayEnd = getCanvasCoordinates(attack + decay, sustain);
    // Sustain is a level, not a time, so we draw a line. We'll add a dummy point for the drag handle.
    const sustainTime = attack + decay + 0.1; // A small arbitrary time for the handle
    const sustainPoint = getCanvasCoordinates(sustainTime, sustain);
    const releaseStart = getCanvasCoordinates(totalTime - release, sustain);
    const end = { x: canvas.width, y: canvas.height };
    
    // --- Draw line ---
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(attackEnd.x, attackEnd.y);
    ctx.lineTo(decayEnd.x, decayEnd.y);
    ctx.lineTo(releaseStart.x, releaseStart.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // --- Draw draggable nodes ---
    points = [attackEnd, decayEnd, sustainPoint, releaseStart]; 
    ctx.fillStyle = '#00ff88';
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, D_NODE / 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

const state = {
    attack: 0, decay: 0, sustain: 0, release: 0,
    maxTime: 5, // max value of attack/decay/release sliders
    
    init(initialValues, callback) {
        this.attack = initialValues.attack;
        this.decay = initialValues.decay;
        this.sustain = initialValues.sustain;
        this.release = initialValues.release;
        onUpdateCallback = callback;
    },
    
    getValues() {
        return { attack: this.attack, decay: this.decay, sustain: this.sustain, release: this.release };
    },
    
    getTotalTime() {
        return this.attack + this.decay + this.release + 0.2; // Add a buffer for sustain handle
    },
    
    update(newValues) {
        if (newValues.attack !== undefined) this.attack = newValues.attack;
        if (newValues.decay !== undefined) this.decay = newValues.decay;
        if (newValues.sustain !== undefined) this.sustain = newValues.sustain;
        if (newValues.release !== undefined) this.release = newValues.release;
        draw();
        if (onUpdateCallback) onUpdateCallback(this.getValues());
    }
};

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < D_NODE) {
            draggedPointIndex = i;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
}

function handleMouseMove(e) {
    if (draggedPointIndex === null) return;

    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Clamp x and y to be within the canvas bounds
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    
    let { attack, decay, sustain, release } = state.getValues();
    const totalTime = state.getTotalTime();
    const timeValue = (x / canvas.width) * totalTime;

    switch (draggedPointIndex) {
        case 0: // Attack
            attack = timeValue;
            break;
        case 1: // Decay
            decay = timeValue - attack;
            break;
        case 2: // Sustain
            sustain = 1 - (y / canvas.height);
            break;
        case 3: // Release
            release = totalTime - timeValue;
            break;
    }
    
    // Basic validation to prevent negative values
    attack = Math.max(0.01, attack);
    decay = Math.max(0.01, decay);
    sustain = Math.max(0, Math.min(1, sustain));
    release = Math.max(0.01, release);

    state.update({ attack, decay, sustain, release });
}

function handleMouseUp() {
    draggedPointIndex = null;
    canvas.style.cursor = 'grab';
}

let draggedPointIndex = null;

export function init(canvasElement, initialValues, callback) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    state.init(initialValues, callback);
    draw();
    
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    canvas.style.cursor = 'grab';
}

export function updateVisualizer(newValues) {
    state.update(newValues);
} 