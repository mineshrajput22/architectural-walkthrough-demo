import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FloorOrbitControls } from './floor-orbit-controls.js';
import floorPlanModelUrl from './models/apartment-floor-plan-demo.glb?url';

const viewer = document.getElementById('floor-viewer');
const canvas = document.getElementById('floor-scene');
const loading = document.getElementById('floor-loading');
const reset = document.getElementById('floor-reset');

function initialize() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8ebe6');
  // A floor plan reads more consistently in parallel projection: orbiting
  // changes its angle without perspective making the footprint drift sideways.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: false, powerPreference: 'high-performance' });
  } catch {
    loading.textContent = '3D rendering is unavailable. Enable WebGL in your browser.';
    return;
  }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc1c9bc, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(7, 15, 10);
  scene.add(sun);

  const controls = new FloorOrbitControls(camera, canvas);
  controls.enableDamping = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.dampingFactor = .08;
  controls.rotateSpeed = .65;
  controls.enablePan = false;
  controls.zoomToCursor = true;
  controls.minZoom = 0.7;
  controls.maxZoom = 6;
  controls.minPolarAngle = .01;
  controls.maxPolarAngle = Math.PI / 3;
  let center = new THREE.Vector3();
  let radius = 10;

  function render() { renderer.render(scene, camera); }
  function resize() {
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;
    if (!width || !height) return;
    // Cap the drawing buffer at 1K wide while controls and text remain at CSS resolution.
    const bufferWidth = Math.min(width, 1024);
    const bufferHeight = Math.max(1, Math.round(bufferWidth * height / width));
    renderer.setSize(bufferWidth, bufferHeight, false);
    const aspect = width / height;
    const halfHeight = radius * 1.1 * Math.max(1, 1 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    render();
  }
  let animationFrame = 0;
  function requestRender() {
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      if (controls.enableDamping) controls.update();
      render();
    });
  }
  controls.addEventListener('change', requestRender);
  new ResizeObserver(resize).observe(viewer);

  reset.addEventListener('click', () => {
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(0, radius * 2.8, radius * .001));
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    camera.lookAt(center);
    controls.update();
    render();
  });

  new GLTFLoader().load(floorPlanModelUrl, (gltf) => {
    scene.add(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    bounds.getCenter(center);
    // Rotate around the apartment's floor footprint, not the vertical midpoint
    // of its furniture and walls.
    center.y = bounds.min.y;
    radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(radius * 1.15, radius * 1.8, radius * 1.15));
    camera.lookAt(center);
    controls.update();
    reset.disabled = false;
    resize();
    loading.hidden = true;
  }, undefined, () => {
    loading.textContent = 'Could not load the floor plan model. Refresh to try again.';
  });
}

initialize();
