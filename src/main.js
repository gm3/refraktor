import * as THREE from 'three';
import * as Tone from 'tone';
import './styles/main.css';

import { state } from './modules/state.js';
import { initializeScene } from './modules/scene.js';
import { rebuildUI, updateUIValues } from './modules/ui/index.js';
import { toggleSound, noteOn, noteOff } from './modules/audio.js';
import { updateMusicScale, findClosestFrequency, getScaleFrequencies } from './modules/music.js';
import { emit } from './modules/eventBus.js';
import { initializeStatusBar } from './modules/ui/statusBar.js';
import { updateCymatics } from './modules/cymatics.js';
import { updateUfoAndGetTiles } from './modules/ufo.js';
import { updateRay } from './modules/raycaster.js';

const clock = new THREE.Clock();
const mouse = new THREE.Vector2();
const mouseRaycaster = new THREE.Raycaster();
let isMouseDown = false;

// --- Initialization ---

function init() {
    initializeScene();
    initializeStatusBar();
    rebuildUI({ 
        onToggleSound: toggleSound,
        isSoundEnabled: () => state.soundEnabled,
    });

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // Start the animation loop
    animate();
}

// --- Grid and Scene Management ---

// The rebuildGrid function has been removed, as grid creation is now handled in scene.js

// --- Event Handlers ---

function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    if (state.composer) {
        state.composer.setSize(window.innerWidth, window.innerHeight);
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (isMouseDown) {
        handleMouseInteraction();
    }
}

function onMouseDown() {
    isMouseDown = true;
    mouseRaycaster.setFromCamera(mouse, state.camera);
    const intersects = mouseRaycaster.intersectObjects(state.gridTiles);
    if (intersects.length > 0) {
        state.controls.enabled = false; // Disable orbit controls when dragging on grid
    }
    handleMouseInteraction(); // Allow single clicks to trigger notes
}

function onMouseUp() {
    isMouseDown = false;
    state.controls.enabled = true; // Re-enable orbit controls
}

// --- Interaction Logic ---

function handleMouseInteraction() {
    mouseRaycaster.setFromCamera(mouse, state.camera);
    const intersects = mouseRaycaster.intersectObjects(state.gridTiles);

    if (intersects.length > 0) {
        const tile = intersects[0].object;
        if (!state.zappedTiles.has(tile.uuid)) {
            playNoteForTile(tile);
        }
    }
}

function playNoteForTile(tile, isUFO = false) {
    let finalFreq = tile.userData.frequency;
    if (state.params.chordMagnetEnabled) {
        const originalFreq = tile.userData.frequency;
        const scaleFreqs = getScaleFrequencies(state.params.rootNote, state.params.scale, 4);
        const targetFreq = findClosestFrequency(originalFreq, scaleFreqs);
        finalFreq = originalFreq + (targetFreq - originalFreq) * state.params.chordMagnetStrength;
    }
    // Always add to zappedTiles for visuals
    if (!state.zappedTiles.has(tile.uuid)) {
        state.zappedTiles.set(tile.uuid, { startTime: clock.getElapsedTime(), frequency: finalFreq, noteTriggered: false });
    }
    // Only trigger noteOn if sound is enabled and not already triggered
    const zap = state.zappedTiles.get(tile.uuid);
    if (state.soundEnabled && zap && !zap.noteTriggered) {
        noteOn(finalFreq, tile.uuid);
        zap.noteTriggered = true;
    }
}

function findTileByFrequency(targetFreq) {
    return state.gridTiles.reduce((closest, tile) => {
        const diff = Math.abs(tile.userData.frequency - targetFreq);
        if (diff < closest.minDiff) {
            return { minDiff: diff, tile: tile };
        }
        return closest;
    }, { minDiff: Infinity, tile: null }).tile;
}

function updateTileVisuals() {
    const now = clock.getElapsedTime();
    const peakIntensity = state.tileZap.peakIntensity;
    const zapDuration = state.tileZap.duration; // Visual zap duration is now independent

    // First pass: Reset all tiles to their base visual state
    for (const tile of state.gridTiles) {
        if (tile.material && tile.material.color && tile.material.emissive) {
            tile.material.emissive.set(0x000000);
            tile.material.emissiveIntensity = 0;
            tile.material.opacity = 0.5;
            tile.material.color.set(0x222244);
        }
    }

    // Second pass: Apply "zap" effects
    for (const [uuid, zapInfo] of state.zappedTiles.entries()) {
        const timeSinceZap = now - zapInfo.startTime;
        if (timeSinceZap < zapDuration) {
            const sourceTile = state.gridTiles.find(t => t.uuid === uuid);
            if (sourceTile && sourceTile.material && sourceTile.material.emissive) {
                // Calculate visual progress (e.g., for fade-out)
                const progress = timeSinceZap / zapDuration;
                const easedProgress = 1 - Math.pow(progress, 2); // Ease-out quad
                const intensity = Math.min(peakIntensity * easedProgress, 0.3); // More visible
                // Apply zap effect to the source tile using emissive properties
                sourceTile.material.emissive.copy(sourceTile.userData.hotColor);
                sourceTile.material.emissiveIntensity = intensity;
                sourceTile.material.opacity = 0.5 + 0.5 * easedProgress;
            }
        } else {
            state.zappedTiles.delete(uuid);
        }
    }
}

// --- Animation Loop ---

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Time update for cymatics
    if (state.params.bpmSyncEnabled) {
        const timeIncrement = (state.params.bpm / 60) * (2 * Math.PI) * delta;
        state.params.time += timeIncrement;
    } else {
        state.params.time += delta * state.params.speed;
    }

    updateCymatics(delta);

    // UFO logic and visuals are now unified.
    const { newlyHotTiles = [], deadTiles = [] } = updateRay() || {};
    newlyHotTiles.forEach(tile => playNoteForTile(tile, true));
    deadTiles.forEach(uuid => noteOff(uuid));

    // Update tile "zap" visuals
    updateTileVisuals();
    
    // Render scene
    state.controls.update(delta);
    if (state.composer) {
        state.composer.render(delta);
    } else {
        state.renderer.render(state.scene, state.camera);
    }

    // Update UI
    updateUIValues();
}

// --- Start ---
document.addEventListener('DOMContentLoaded', init); 