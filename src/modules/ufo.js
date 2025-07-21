import * as THREE from 'three';
import { state } from './state.js';

const ufoRaycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

// Keep track of which tiles were hit in the last frame
let lastHotUUIDs = new Set();

export function updateUfoAndGetTiles(delta) {
    if (!state.ufo.object || !state.grid.object) {
        return { newlyHotTiles: [], deadTiles: new Set() };
    }

    // Move UFO
    state.ufo.object.position.x += state.ufo.velocity.x * delta;
    state.ufo.object.position.z += state.ufo.velocity.z * delta;

    // Bounce off walls
    const halfWidth = state.grid.config.width / 2;
    const halfHeight = state.grid.config.height / 2;
    if (state.ufo.object.position.x > halfWidth || state.ufo.object.position.x < -halfWidth) {
        state.ufo.velocity.x *= -1;
    }
    if (state.ufo.object.position.z > halfHeight || state.ufo.object.position.z < -halfHeight) {
        state.ufo.velocity.z *= -1;
    }

    // Raycast down from UFO
    ufoRaycaster.set(state.ufo.object.position, down);
    const intersects = ufoRaycaster.intersectObjects(state.gridTiles);

    const currentHotUUIDs = new Set(intersects.map(intersect => intersect.object.uuid));
    const newlyHotTiles = [];

    for (const intersect of intersects) {
        const tile = intersect.object;
        if (!lastHotUUIDs.has(tile.uuid)) {
            newlyHotTiles.push(tile);
        }
    }

    const deadTiles = new Set();
    for (const uuid of lastHotUUIDs) {
        if (!currentHotUUIDs.has(uuid)) {
            deadTiles.add(uuid);
        }
    }
    
    lastHotUUIDs = currentHotUUIDs;
    
    return { newlyHotTiles, deadTiles };
} 