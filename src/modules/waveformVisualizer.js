// Real-time waveform visualizer (oscilloscope) for REFRAKTOR
// Shows the audio output waveform after all effects (distortion, saturation, limiting)
// Usage: waveformVisualizer.setAnalyserSource(analyserNode); waveformVisualizer.start(canvasElement);

let analyser = null;
let animationId = null;
let canvas = null;
let ctx = null;
let bufferLength = 0;
let dataArray = null;

/**
 * Set the analyser node as the source for visualization.
 * @param {AnalyserNode} analyserNode - The Web Audio or Tone.js analyser node.
 */
export function setAnalyserSource(analyserNode) {
    analyser = analyserNode;
    if (analyser) {
        bufferLength = analyser.fftSize;
        dataArray = new Uint8Array(bufferLength);
    }
}

/**
 * Start the waveform visualizer on the given canvas element.
 * @param {HTMLCanvasElement} canvasElement
 */
export function start(canvasElement) {
    if (!analyser || !canvasElement) return;
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    cancelAnimationFrame(animationId);
    draw();
}

/**
 * Stop the waveform visualizer.
 */
export function stop() {
    cancelAnimationFrame(animationId);
    animationId = null;
}

function draw() {
    if (!analyser || !ctx) return;
    analyser.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ff88';
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    animationId = requestAnimationFrame(draw);
}

// To use: import { setAnalyserSource, start, stop } from './waveformVisualizer.js'; 