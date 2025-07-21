import { state } from './state.js';
import { config } from './config.js';

function deform(lensObject, lensParams) {
    if (!lensObject) return;

    const geometry = lensObject.geometry;
    const positionAttribute = geometry.attributes.position;
    const originalPosition = geometry.userData.originalPosition;

    if (!originalPosition) return;

    const time = lensParams.time * lensParams.speed;
    const freq = lensParams.frequency;
    const amp = lensParams.amplitude;

    const cymaticsConf = config.cymatics;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPosition.getX(i);
        const y = originalPosition.getY(i);

        // This is the classic cymatics formula
        const dx = x * lensParams.frequency * cymaticsConf.freqMultiplierX + lensParams.time;
        const dy = y * lensParams.frequency * cymaticsConf.freqMultiplierY;
        const z = Math.sin(dx) * Math.cos(dy) * lensParams.amplitude * cymaticsConf.amplitudeFactor;

        // The lens is a PlaneGeometry, which is in the XY plane. We displace along Z.
        positionAttribute.setZ(i, z);
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
}

export function updateCymatics(delta) {
    if (state.lens) {
        // Update time for the first lens
        if (state.params.bpmSyncEnabled) {
            const timeIncrement = (state.params.bpm / 60) * (2 * Math.PI) * delta;
            state.params.time += timeIncrement;
        } else {
            state.params.time += delta * state.params.speed;
        }
        // Update lens position and deformation
        state.lens.position.y = state.params.y;
        deform(state.lens, state.params);
    }

    if (state.lens2) {
        // Update time for the second lens
        if (state.lens2Params.bpmSyncEnabled) {
            const timeIncrement = (state.lens2Params.bpm / 60) * (2 * Math.PI) * delta;
            state.lens2Params.time += timeIncrement;
        } else {
            state.lens2Params.time += delta * state.lens2Params.speed;
        }
        // Update lens position and deformation
        state.lens2.position.y = state.lens2Params.y;
        deform(state.lens2, state.lens2Params);
    }
} 