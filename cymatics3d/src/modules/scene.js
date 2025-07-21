import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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
    state.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    state.bloomPass.threshold = state.bloomParams.threshold;
    state.bloomPass.strength = state.bloomParams.strength;
    state.bloomPass.radius = state.bloomParams.radius;

    const smaaPass = new SMAAPass( window.innerWidth * state.renderer.getPixelRatio(), window.innerHeight * state.renderer.getPixelRatio() );

    state.composer = new EffectComposer(state.renderer);
    state.composer.addPass(renderScene);
    state.composer.addPass(state.bloomPass);
    state.composer.addPass(smaaPass);


    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.1;
    state.controls.enablePan = true;
    state.controls.enableZoom = true;
    state.controls.enableRotate = true;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
    state.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    state.scene.add(directionalLight);


    const lensConf = config.lensDefaults;
    const lensGeo = new THREE.PlaneGeometry(lensConf.width, lensConf.height, lensConf.segments, lensConf.segments);
    const lensMat = new THREE.MeshBasicMaterial(lensConf.material);
    state.lens = new THREE.Mesh(lensGeo, lensMat);
    state.lens.position.set(lensConf.initialPosition.x, state.params.y, lensConf.initialPosition.z);
    state.lens.rotation.set(lensConf.initialRotation.x, lensConf.initialRotation.y, lensConf.initialRotation.z);
    state.scene.add(state.lens);

    state.gridTiles = [];
    const { gridSize, gridDiv, groundY } = config.scene;
    const { dMinorSemitones, baseFreq } = config.music;
    const tileSize = gridSize / gridDiv;
    for (let gx = 0; gx < gridDiv; gx++) {
        for (let gz = 0; gz < gridDiv; gz++) {
            const tileGeo = new THREE.PlaneGeometry(tileSize, tileSize);
            const baseColor = new THREE.Color(0x222244);
            const tileMat = new THREE.MeshBasicMaterial({ color: baseColor, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const tile = new THREE.Mesh(tileGeo, tileMat);
            tile.position.x = -gridSize / 2 + tileSize / 2 + gx * tileSize;
            tile.position.z = -gridSize / 2 + tileSize / 2 + gz * tileSize;
            tile.position.y = groundY;
            tile.rotation.x = -Math.PI / 2;

            const noteIndex = (gx + gz * 2) % dMinorSemitones.length;
            const octave = Math.floor((gx + (gridDiv - 1 - gz) * gridDiv) / (dMinorSemitones.length * 4)) % 4;
            const semitones = 12 * octave + dMinorSemitones[noteIndex];
            tile.userData.frequency = baseFreq * Math.pow(2, semitones / 12);
            tile.userData.baseColor = baseColor;
            tile.userData.hotColor = new THREE.Color(0xffff00);
            
            state.scene.add(tile);
            state.gridTiles.push(tile);
        }
    }

    state.transformControls = new TransformControls(state.camera, state.renderer.domElement);
    state.scene.add(state.transformControls);
    state.transformControls.addEventListener('dragging-changed', e => { state.controls.enabled = !e.value; });

    // Load UFO Model
    const loader = new GLTFLoader();
    loader.load(
        'public//bob_lazar_ufo.glb',
        function (gltf) {
            console.log("UFO model loaded successfully:", gltf);
            state.lightSource = gltf.scene;
            // Let's start with a larger scale, and we can adjust if needed.
            state.lightSource.scale.set(1.5, 1.5, 1.5);
            const lightConf = config.lightSourceDefaults;
            state.lightSource.position.set(lightConf.initialPosition.x, lightConf.initialPosition.y, lightConf.initialPosition.z);
            state.scene.add(state.lightSource);
            state.transformControls.attach(state.lightSource);
        },
        undefined,
        function (error) {
            console.error('An error happened while loading the UFO model, falling back to sphere:', error);
            const lightConf = config.lightSourceDefaults;
            const lightGeometry = new THREE.SphereGeometry(lightConf.radius, lightConf.segments, lightConf.segments);
            const lightMaterial = new THREE.MeshBasicMaterial(lightConf.material);
            state.lightSource = new THREE.Mesh(lightGeometry, lightMaterial);
            state.lightSource.position.set(lightConf.initialPosition.x, lightConf.initialPosition.y, lightConf.initialPosition.z);
            state.scene.add(state.lightSource);
            state.transformControls.attach(state.lightSource);
        }
    );
}

export function updateBloom() {
    state.bloomPass.threshold = state.bloomParams.threshold;
    state.bloomPass.strength = state.bloomParams.strength;
    state.bloomPass.radius = state.bloomParams.radius;
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
        const lensMat = new THREE.MeshBasicMaterial(lensConf.material);
        state.lens2 = new THREE.Mesh(lensGeo, lensMat);
        state.lens2.position.set(lensConf.initialPosition.x, state.lens2Params.y, lensConf.initialPosition.z);
        state.lens2.rotation.set(lensConf.initialRotation.x, lensConf.initialRotation.y, lensConf.initialRotation.z);
        state.scene.add(state.lens2);
        return true;
    }
} 