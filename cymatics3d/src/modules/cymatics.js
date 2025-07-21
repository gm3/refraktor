import { state } from './state.js';
import { config } from './config.js';

function deform(lensObject, lensParams) {
    if (!lensObject) return;

    const cymaticsConfig = config.cymatics;
    const geometry = lensObject.geometry;
    const positionAttribute = geometry.attributes.position;

    // Store original vertex positions if not already stored
    if (!geometry.userData.originalPosition) {
        geometry.userData.originalPosition = positionAttribute.clone();
    }
    const originalPosition = geometry.userData.originalPosition;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPosition.getX(i);
        const y = originalPosition.getY(i);

        // This cymatic formula is derived from the structure of the config
        const dx = x * lensParams.frequency * cymaticsConfig.freqMultiplierX + lensParams.time;
        const dy = y * lensParams.frequency * cymaticsConfig.freqMultiplierY;
        const z = Math.sin(dx) * Math.cos(dy) * lensParams.amplitude * cymaticsConfig.amplitudeFactor;

        // The lens is a PlaneGeometry, which is in the XY plane. We displace along Z.
        positionAttribute.setZ(i, z);
    }

    positionAttribute.needsUpdate = true;
    // Re-computing normals is crucial for the raycaster to calculate refraction correctly
    geometry.computeVertexNormals();
}

export function updateLensDeformation() {
    deform(state.lens, state.params);
    if (state.lens2) {
        deform(state.lens2, state.lens2Params);
    }
} 