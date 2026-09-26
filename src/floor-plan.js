import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewer = document.getElementById('floor-viewer');
const canvas = document.getElementById('floor-scene');
const loading = document.getElementById('floor-loading');
const reset = document.getElementById('floor-reset');

function initialize() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8ebe6');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.up.set(0, 0, -1);
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

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.minDistance = 3;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI * .91;
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
    camera.aspect = width / height;
    camera.zoom = Math.min(1, Math.max(.65, width / height * 1.1));
    camera.updateProjectionMatrix();
    render();
  }
  controls.addEventListener('change', render);
  new ResizeObserver(resize).observe(viewer);

  reset.addEventListener('click', () => {
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(0, radius * 2.8, 0));
    camera.lookAt(center);
    controls.update();
    render();
  });

  new GLTFLoader().load('/models/apartment-floor-plan-demo.glb', (gltf) => {
    scene.add(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    bounds.getCenter(center);
    radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(radius * 1.15, radius * 1.8, radius * 1.15));
    camera.lookAt(center);
    controls.update();
    reset.disabled = false;
    loading.hidden = true;
    resize();
  }, undefined, () => {
    loading.textContent = 'Could not load the floor plan model. Refresh to try again.';
  });
}

// Keep the second model out of the initial walkthrough load path.
const observer = new IntersectionObserver((entries) => {
  if (entries.some((entry) => entry.isIntersecting)) {
    observer.disconnect();
    initialize();
  }
}, { rootMargin: '400px' });
observer.observe(viewer);
