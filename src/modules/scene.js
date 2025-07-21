import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// The RGBELoader is no longer needed
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'; 
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { state } from './state.js';
import { config } from './config.js';

export function initializeScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0a0a0a);

    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    state.camera.position.set(0, 6, 10);
    state.camera.lookAt(0, 0, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.domElement.id = 'main-canvas';
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(state.renderer.domElement);

    // Post-processing
    const renderScene = new RenderPass(state.scene, state.camera);
    // state.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85); // REMOVE
    // state.bloomPass.threshold = state.bloomParams.threshold;
    // state.bloomPass.strength = state.bloomParams.strength;
    // state.bloomPass.radius = state.bloomParams.radius;

    const smaaPass = new SMAAPass( window.innerWidth * state.renderer.getPixelRatio(), window.innerHeight * state.renderer.getPixelRatio() );

    state.composer = new EffectComposer(state.renderer);
    state.composer.addPass(renderScene);
    // state.composer.addPass(state.bloomPass); // REMOVE
    state.composer.addPass(smaaPass);


    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.1;
    state.controls.enablePan = true;
    state.controls.enableZoom = true;
    state.controls.enableRotate = true;

    // Add lighting back in since the JPG doesn't provide it
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Softer ambient light
    state.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // A bit less intense
    directionalLight.position.set(5, 10, 7.5);
    state.scene.add(directionalLight);


    const lensConf = config.lensDefaults;
    const lensGeo = new THREE.PlaneGeometry(lensConf.width, lensConf.height, lensConf.segments, lensConf.segments);
    
    // Use a standard material. The deformation will be handled on the CPU.
    const lensMat = new THREE.MeshBasicMaterial({
        color: config.lensDefaults.material.color,
        wireframe: true,
    });
    
    state.lens = new THREE.Mesh(lensGeo, lensMat);
    // Store the original vertex positions for CPU-based animation
    state.lens.geometry.userData.originalPosition = state.lens.geometry.attributes.position.clone();
    state.lens.position.set(lensConf.initialPosition.x, state.params.y, lensConf.initialPosition.z);
    state.lens.rotation.set(lensConf.initialRotation.x, lensConf.initialRotation.y, lensConf.initialRotation.z);
    state.scene.add(state.lens);

    state.transformControls = new TransformControls(state.camera, state.renderer.domElement);
    state.scene.add(state.transformControls);
    state.transformControls.addEventListener('dragging-changed', e => { state.controls.enabled = !e.value; });

    // Create the grid
    const { gridSize, gridDiv, groundY } = config.scene;
    const tileSize = gridSize / gridDiv;
    for (let gx = 0; gx < gridDiv; gx++) {
        for (let gz = 0; gz < gridDiv; gz++) {
            const tileGeo = new THREE.PlaneGeometry(tileSize, tileSize);
            const baseColor = new THREE.Color(0x222244);
            // Use MeshStandardMaterial for emissive support
            const tileMat = new THREE.MeshStandardMaterial({
                color: baseColor,
                emissive: 0x000000,
                emissiveIntensity: 0,
                transparent: true,
                opacity: 0.5
            });
            const tile = new THREE.Mesh(tileGeo, tileMat);
            tile.position.x = -gridSize / 2 + tileSize / 2 + gx * tileSize;
            tile.position.z = -gridSize / 2 + tileSize / 2 + gz * tileSize;
            tile.position.y = groundY;
            tile.rotation.x = -Math.PI / 2;

            const noteIndex = (gx + gz * 2) % config.music.dMinorSemitones.length;
            const octave = Math.floor((gx + (gridDiv - 1 - gz) * gridDiv) / (config.music.dMinorSemitones.length * 4)) % 4;
            const semitones = 12 * octave + config.music.dMinorSemitones[noteIndex];
            tile.userData.frequency = config.music.baseFreq * Math.pow(2, semitones / 12);
            tile.userData.baseColor = baseColor;
            tile.userData.hotColor = new THREE.Color(0xffff00);
            
            state.scene.add(tile);
            state.gridTiles.push(tile);
        }
    }

    // Load the JPG background
    const loader = new THREE.TextureLoader();
    loader.load(
        'public/HDR_blue_nebula.jpg',
        function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            state.scene.background = texture;
            state.scene.environment = null; // JPG cannot be an environment map
            console.log("JPG background loaded.");

            // Load UFO Model inside the texture callback
            const gltfLoader = new GLTFLoader();
            gltfLoader.load(
                'public//bob_lazar_ufo.glb',
                function (gltf) {
                    console.log("UFO model loaded successfully:", gltf);
                    state.lightSource = gltf.scene;

                    // Make the UFO material metallic and emissive, but not reflective
                    state.lightSource.traverse(function (child) {
                        if (child.isMesh) {
                            const newMaterial = new THREE.MeshStandardMaterial({
                                metalness: 0.9,
                                roughness: 0.1,
                                emissive: new THREE.Color(0xaaaaaa),
                                emissiveIntensity: 0.1
                                // envMap is removed
                            });

                            if (child.material && child.material.map) {
                                newMaterial.map = child.material.map;
                            }

                            child.material = newMaterial;
                        }
                    });

                    state.lightSource.scale.set(1.5, 1.5, 1.5);
                    const lightConf = config.lightSourceDefaults;
                    state.lightSource.position.set(lightConf.initialPosition.x, lightConf.initialPosition.y, lightConf.initialPosition.z);
                    state.ufo.object = state.lightSource; // Restore the link
                    state.ufo.velocity = new THREE.Vector3(config.ufo.config.velocity.x, config.ufo.config.velocity.y, config.ufo.config.velocity.z);
                    state.scene.add(state.lightSource);
                    state.transformControls.attach(state.lightSource);
                },
                undefined,
                function (error) {
                    console.error('An error happened while loading the UFO model, falling back to sphere:', error);
                    const lightConf = config.lightSourceDefaults;
                    const lightGeometry = new THREE.SphereGeometry(lightConf.radius, lightConf.segments, lightConf.segments);
                    const lightMaterial = new THREE.MeshStandardMaterial({
                        color: lightConf.material.color,
                        emissive: new THREE.Color(0xffffff),
                        emissiveIntensity: 1
                        // envMap is removed
                    });
                    state.lightSource = new THREE.Mesh(lightGeometry, lightMaterial);
                    state.lightSource.position.set(lightConf.initialPosition.x, lightConf.initialPosition.y, lightConf.initialPosition.z);
                    state.ufo.object = state.lightSource; // Also assign the fallback sphere
                    state.ufo.velocity = new THREE.Vector3(config.ufo.config.velocity.x, config.ufo.config.velocity.y, config.ufo.config.velocity.z);
                    state.scene.add(state.lightSource);
                    state.transformControls.attach(state.lightSource);
                }
            );
        }
    );
}

export function addOrRemoveLens2() {
    if (state.lens2) {
        // Remove existing lens2
        state.scene.remove(state.lens2);
        state.lens2.geometry.dispose();
        state.lens2.material.dispose();
        state.lens2 = null;
        return false;
    } else {
        // Add new lens2
        const lensConf = config.lensDefaults;
        const lensGeo = new THREE.PlaneGeometry(lensConf.width, lensConf.height, lensConf.segments, lensConf.segments);
        
        // Use the same standard material
        const lensMat = new THREE.MeshBasicMaterial({
            color: config.lensDefaults.material.color,
            wireframe: true,
        });

        state.lens2 = new THREE.Mesh(lensGeo, lensMat);
        // Store original vertex positions for the second lens
        state.lens2.geometry.userData.originalPosition = state.lens2.geometry.attributes.position.clone();
        state.lens2.position.set(lensConf.initialPosition.x, state.lens2Params.y, lensConf.initialPosition.z);
        state.lens2.rotation.set(lensConf.initialRotation.x, lensConf.initialRotation.y, lensConf.initialRotation.z);
        state.scene.add(state.lens2);
        return true;
    }
} 

export function rebuildGrid() {
    // Remove old tiles
    if (state.gridTiles && state.gridTiles.length) {
        for (const tile of state.gridTiles) {
            try {
                state.scene.remove(tile);
                tile.geometry.dispose();
                tile.material.dispose();
            } catch (e) {
                console.warn('Failed to fully dispose tile:', tile, e);
            }
        }
    }
    state.gridTiles = [];
    // Remove any leftover Meshes at y = groundY and rotation.x = -Math.PI/2 (paranoia)
    const { groundY } = config.scene;
    state.scene.traverse(obj => {
        if (obj.isMesh && obj.position.y === groundY && obj.rotation.x === -Math.PI / 2) {
            state.scene.remove(obj);
        }
    });
    // Get current scale frequencies
    const scaleFreqs = (state.music && state.music.scaleFrequencies) ? state.music.scaleFrequencies : [];
    const numTiles = scaleFreqs.length;
    const { gridSize } = config.scene;
    // Make a single row of tiles for each note in the scale/octave range
    const tileSize = gridSize / Math.max(numTiles, 1);
    for (let i = 0; i < numTiles; i++) {
        const tileGeo = new THREE.PlaneGeometry(tileSize, tileSize);
        const baseColor = new THREE.Color(0x222244);
        const tileMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: 0x000000,
            emissiveIntensity: 0,
            transparent: true,
            opacity: 0.5
        });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.x = -gridSize / 2 + tileSize / 2 + i * tileSize;
        tile.position.z = 0;
        tile.position.y = groundY;
        tile.rotation.x = -Math.PI / 2;
        tile.userData.frequency = scaleFreqs[i];
        tile.userData.baseColor = baseColor;
        tile.userData.hotColor = new THREE.Color(0xffff00);
        state.scene.add(tile);
        state.gridTiles.push(tile);
    }
    console.log('Grid rebuilt. Number of tiles:', state.gridTiles.length);
} 