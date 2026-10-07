import assert from 'node:assert/strict';
import * as THREE from 'three';
import { FloorOrbitControls } from '../src/floor-orbit-controls.js';

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();

const controls = Object.create(FloorOrbitControls.prototype);
controls.object = camera;
controls.zoomToCursor = true;
controls.domElement = {
  getBoundingClientRect: () => ({ left: 20, top: 100, width: 300, height: 400 }),
};
controls._mouse = new THREE.Vector2();
controls._dollyDirection = new THREE.Vector3();
controls._pointers = [1, 2];

const previousWindow = globalThis.window;
globalThis.window = { scrollX: 0, scrollY: 1000 };
try {
  // OrbitControls supplies the midpoint of two touches in page coordinates.
  // On this scrolled page that midpoint is viewport (170, 300).
  controls._updateZoomParameters(170, 1300);
  assert.ok(Math.abs(controls._mouse.x) < 1e-9, 'pinch x should stay at the midpoint');
  assert.ok(Math.abs(controls._mouse.y) < 1e-9, 'pinch y should stay at the midpoint');

  // Mouse wheel input already uses viewport coordinates and must not shift.
  controls._pointers = [];
  controls._updateZoomParameters(170, 300);
  assert.ok(Math.abs(controls._mouse.x) < 1e-9);
  assert.ok(Math.abs(controls._mouse.y) < 1e-9);
} finally {
  globalThis.window = previousWindow;
}

console.log('PASS: pinch and wheel zoom use the intended viewport point.');
