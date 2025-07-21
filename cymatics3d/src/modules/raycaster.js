import * as THREE from 'three';
import { noteOn, noteOff } from './audio.js';
import { state } from './state.js';
import { config } from './config.js';
import { getScaleFrequencies, findClosestFrequency } from './music.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

let fanRayLines = [];
let previouslyHotTiles = new Set();

// Snell's Law helper
function refractRay(incident, normal, n1, n2) {
  const n = n1 / n2;
  const cosI = -normal.dot(incident);
  const sinT2 = n * n * (1.0 - cosI * cosI);
  if (sinT2 > 1.0) return null;
  const cosT = Math.sqrt(1.0 - sinT2);
  return incident.clone().multiplyScalar(n).add(normal.clone().multiplyScalar(n * cosI - cosT)).normalize();
}

export function updateRay() {
  if (!state.lightSource) {
      return; // Don't run if the light source isn't loaded yet
  }
  const { scene, gridTiles, lightSource, lens, params, lens2, lens2Params } = state;
  
  const hotTilesThisFrame = new Set();

  // Remove all previous fan rays
  for (const l of fanRayLines) scene.remove(l);
  fanRayLines = [];
  
  const numRays = Math.floor(params.rayCount);
  const coneAngle = params.rayConeAngle;
  const lightPos = lightSource.position.clone();
  for (let i = 0; i < numRays; i++) {
    let dirRay;
    if (i === 0) {
      // Central ray: straight down
      dirRay = new THREE.Vector3(0, -1, 0);
    } else {
      // Distribute rays evenly around a circle (azimuth)
      const theta = (2 * Math.PI * (i - 1)) / (numRays - 1);
      // Spherical coordinates
      dirRay = new THREE.Vector3(
        Math.sin(coneAngle) * Math.cos(theta),
        -Math.cos(coneAngle),
        Math.sin(coneAngle) * Math.sin(theta)
      ).normalize();
    }
    const pointsRay = [lightPos.clone()];
    // --- First lens ---
    const geo1 = lens.geometry;
    geo1.computeVertexNormals();
    let minDist1 = Infinity, idx1 = 0;
    const tLens1 = (lens.position.y - lightPos.y) / dirRay.y;
    const rayXZ1 = lightPos.clone().add(dirRay.clone().multiplyScalar(tLens1));
    for (let j = 0; j < geo1.attributes.position.count; j++) {
      const vx = geo1.attributes.position.getX(j);
      const vy = geo1.attributes.position.getY(j);
      const vz = geo1.attributes.position.getZ(j);
      const world = lens.localToWorld(new THREE.Vector3(vx, vy, vz));
      const dist = Math.hypot(world.x - rayXZ1.x, world.z - rayXZ1.z);
      if (dist < minDist1) {
        minDist1 = dist;
        idx1 = j;
      }
    }
    const vx1 = geo1.attributes.position.getX(idx1);
    const vy1 = geo1.attributes.position.getY(idx1);
    const vz1 = geo1.attributes.position.getZ(idx1);
    const hit1 = lens.localToWorld(new THREE.Vector3(vx1, vy1, vz1));
    const n1 = new THREE.Vector3(
      geo1.attributes.normal.getX(idx1),
      geo1.attributes.normal.getY(idx1),
      geo1.attributes.normal.getZ(idx1)
    );
    const normal1 = n1.applyMatrix3(new THREE.Matrix3().getNormalMatrix(lens.matrixWorld)).normalize();
    pointsRay.push(hit1.clone());
    const newDir1 = refractRay(dirRay, normal1, 1.0, params.n);
    if (!newDir1) continue;
    // --- Second lens (if exists) ---
    let hit2, newDir2;
    if (lens2) {
      const geo2 = lens2.geometry;
      geo2.computeVertexNormals();
      let minDist2 = Infinity, idx2 = 0;
      const tLens2 = (lens2.position.y - hit1.y) / newDir1.y;
      const rayXZ2 = hit1.clone().add(newDir1.clone().multiplyScalar(tLens2));
      for (let j = 0; j < geo2.attributes.position.count; j++) {
        const vx = geo2.attributes.position.getX(j);
        const vy = geo2.attributes.position.getY(j);
        const vz = geo2.attributes.position.getZ(j);
        const world = lens2.localToWorld(new THREE.Vector3(vx, vy, vz));
        const dist = Math.hypot(world.x - rayXZ2.x, world.z - rayXZ2.z);
        if (dist < minDist2) {
          minDist2 = dist;
          idx2 = j;
        }
      }
      const vx2 = geo2.attributes.position.getX(idx2);
      const vy2 = geo2.attributes.position.getY(idx2);
      const vz2 = geo2.attributes.position.getZ(idx2);
      hit2 = lens2.localToWorld(new THREE.Vector3(vx2, vy2, vz2));
      const n2 = new THREE.Vector3(
        geo2.attributes.normal.getX(idx2),
        geo2.attributes.normal.getY(idx2),
        geo2.attributes.normal.getZ(idx2)
      );
      const normal2 = n2.applyMatrix3(new THREE.Matrix3().getNormalMatrix(lens2.matrixWorld)).normalize();
      pointsRay.push(hit2.clone());
      newDir2 = refractRay(newDir1, normal2, 1.0, lens2Params.n);
      if (!newDir2) continue;
    }
    // --- Ground ---
    let groundStart, groundDir;
    if (lens2 && hit2 && newDir2) {
      groundStart = hit2;
      groundDir = newDir2;
    } else {
      groundStart = hit1;
      groundDir = newDir1;
    }
    const tGround = (config.scene.groundY - groundStart.y) / groundDir.y;
    if (tGround > 0) {
      const groundHit = groundStart.clone().add(groundDir.clone().multiplyScalar(tGround));
      pointsRay.push(groundHit);
      let minTileDist = Infinity, minTile = null;
      for (const tile of gridTiles) {
        const d = Math.hypot(tile.position.x - groundHit.x, tile.position.z - groundHit.z);
        if (d < minTileDist) {
          minTileDist = d;
          minTile = tile;
        }
      }
      if (minTile) {
        hotTilesThisFrame.add(minTile);
      }
    }
    
    // --- Create thick line ---
    const rayGeom = new LineGeometry();
    const positions = pointsRay.flatMap(p => [p.x, p.y, p.z]);
    rayGeom.setPositions(positions);

    const rayConf = config.raycaster;
    const vibrantColor = new THREE.Color(rayConf.material.color).multiplyScalar(rayConf.material.emissiveIntensity);
    const rayMat = new LineMaterial({
        color: vibrantColor,
        linewidth: rayConf.material.lineWidth,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        dashed: false
    });

    const rayLine = new LineSegments2(rayGeom, rayMat);
    rayLine.computeLineDistances();
    scene.add(rayLine);
    fanRayLines.push(rayLine);
  }

  const newlyHotTiles = new Set();
  hotTilesThisFrame.forEach(tile => {
      if (!previouslyHotTiles.has(tile.uuid)) {
          newlyHotTiles.add(tile);
      }
  });

  const deadTiles = new Set();
  previouslyHotTiles.forEach(uuid => {
      const tileIsStillHot = [...hotTilesThisFrame].some(tile => tile.uuid === uuid);
      if (!tileIsStillHot) {
          deadTiles.add(uuid);
      }
  });

  previouslyHotTiles = new Set([...hotTilesThisFrame].map(tile => tile.uuid));

  return { newlyHotTiles, deadTiles };
} 