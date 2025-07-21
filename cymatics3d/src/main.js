import * as THREE from 'three';
import './styles/main.css';
import { toggleSound, isSoundEnabled, noteOn, noteOff } from './modules/audio.js';
import { updateLensDeformation } from './modules/cymatics.js';
import { updateRay } from './modules/raycaster.js';
import { createUI, updateUIValues } from './modules/ui.js';
import { initializeScene } from './modules/scene.js';
import { state } from './modules/state.js';
import { getScaleFrequencies, findClosestFrequency } from './modules/music.js';
import { config } from './modules/config.js';

const clock = new THREE.Clock();

function init() {
  initializeScene();
  
  createUI({
    onToggleSound: toggleSound,
    isSoundEnabled: isSoundEnabled,
  });

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.composer.setSize(window.innerWidth, window.innerHeight);
}

function handleFrequencySweep() {
    if (state.sweepEnabled) {
        const elapsed = (performance.now() - state.sweepStartTime) / 1000;
        let progress = elapsed / 60; // 1-minute sweep

        if (progress >= 1.0) {
            progress = 1.0;
            state.sweepDirection *= -1;
            state.sweepStartTime = performance.now();
        }
        
        const minLog = Math.log(20);
        const maxLog = Math.log(20000);

        if (state.sweepDirection === 1) {
            const logFreq = minLog + progress * (maxLog - minLog);
            state.params.frequency = Math.exp(logFreq);
        } else {
            const logFreq = maxLog - progress * (maxLog - minLog);
            state.params.frequency = Math.exp(logFreq);
        }
    }

    if (state.sweep2Enabled) {
        const elapsed = (performance.now() - state.sweep2StartTime) / 1000;
        let progress = elapsed / 60;

        if (progress >= 1.0) {
            progress = 1.0;
            state.sweep2Direction *= -1;
            state.sweep2StartTime = performance.now();
        }
        
        const minLog = Math.log(20);
        const maxLog = Math.log(20000);

        if (state.sweep2Direction === 1) {
            const logFreq = minLog + progress * (maxLog - minLog);
            state.lens2Params.frequency = Math.exp(logFreq);
        } else {
            const logFreq = maxLog - progress * (maxLog - minLog);
            state.lens2Params.frequency = Math.exp(logFreq);
        }
    }
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();

  if (state.params.bpmSyncEnabled) {
    // 1 beat = 1 full cycle (2 * PI)
    // (state.params.bpm / 60) gives beats per second
    const timeIncrement = (state.params.bpm / 60) * (2 * Math.PI) * delta;
    state.params.time += timeIncrement;
  } else {
    state.params.time += delta * state.params.speed;
  }
  
  if (state.lens2) {
    if (state.lens2Params.bpmSyncEnabled) {
      const timeIncrement = (state.lens2Params.bpm / 60) * (2 * Math.PI) * delta;
      state.lens2Params.time += timeIncrement;
    } else {
      state.lens2Params.time += delta * state.lens2Params.speed;
    }
  }

  handleFrequencySweep();
  
  // Update lens positions from state
  if (state.lens) state.lens.position.y = state.params.y;
  if (state.lens2) state.lens2.position.y = state.lens2Params.y;

  updateLensDeformation();
  
  const raycastResults = updateRay();
  if (raycastResults) {
    const { newlyHotTiles, deadTiles } = raycastResults;

    newlyHotTiles.forEach(tile => {
        let finalFreq = tile.userData.frequency;
        if (state.params.chordMagnetEnabled) {
            const originalFreq = tile.userData.frequency;
            const scaleFreqs = getScaleFrequencies(state.params.rootNote, state.params.scale, 4);
            const targetFreq = findClosestFrequency(originalFreq, scaleFreqs);
            finalFreq = originalFreq + (targetFreq - originalFreq) * state.params.chordMagnetStrength;
        }
        noteOn(finalFreq, tile.uuid);
        state.zappedTiles.set(tile.uuid, { startTime: clock.getElapsedTime() });
    });

    deadTiles.forEach(uuid => {
        noteOff(uuid);
    });
  }
  
  updateTileVisuals();
  
  state.controls.update();
  // state.renderer.render(state.scene, state.camera);
  if (state.composer) {
    state.composer.render();
  } else {
    state.renderer.render(state.scene, state.camera);
  }
  updateUIValues();
}

function updateTileVisuals() {
    const now = clock.getElapsedTime();
    const zapDuration = state.tileZap.duration; 
    const peakIntensity = state.tileZap.peakIntensity;

    for (const tile of state.gridTiles) {
        if (state.zappedTiles.has(tile.uuid)) {
            const zapInfo = state.zappedTiles.get(tile.uuid);
            const timeSinceZap = now - zapInfo.startTime;

            if (timeSinceZap < zapDuration) {
                const progress = timeSinceZap / zapDuration;
                const easedProgress = 1 - Math.pow(progress, 0.5); // Use an ease-out curve
                const intensity = 1 + (peakIntensity - 1) * easedProgress;
                tile.material.color.copy(tile.userData.hotColor).multiplyScalar(intensity);
                tile.material.opacity = 0.5 + 0.4 * easedProgress;
            } else {
                // Animation finished, reset to base state
                tile.material.color.copy(tile.userData.baseColor);
                tile.material.opacity = 0.5;
                state.zappedTiles.delete(tile.uuid);
            }
        } else {
            // Ensure non-zapped tiles are at base state
             tile.material.color.copy(tile.userData.baseColor);
             tile.material.opacity = 0.5;
        }
    }
}

document.addEventListener('DOMContentLoaded', init); 