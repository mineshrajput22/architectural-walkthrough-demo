import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import './style.css';
import './floor-plan.js';
import defaults from './tour.json';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dfe5e3');
const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 100);
camera.rotation.order = 'YXZ';
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: false, powerPreference: 'high-performance' });
} catch (error) {
  $('loading').querySelector('h2').textContent = '3D rendering is unavailable';
  $('loading-text').textContent = 'Open this demo in a browser with WebGL 2 and hardware acceleration enabled.';
  throw error;
}
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2;
const controls = new PointerLockControls(camera, canvas);
const floorMeshes = [];
const wallMeshes = [];
const keys = new Set();
const storageKey = 'atelier-apartment-demo-views-v1';
let views = structuredClone(defaults);
let index = 0, ready = false, playing = false, tourClock = 0, changing = false;
let lastInteract = performance.now();
const IDLE_RESUME_MS = 5000;
let dragging = false, previousPointer = null, savedNotice = '';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer:coarse)').matches;
function setFsPanel(collapsed) {
  $('viewer').classList.toggle('fs-collapsed', collapsed);
  const toggle = $('fs-toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Show spaces panel' : 'Hide spaces panel');
    // Open panel shows a close affordance so it can be dismissed manually;
    // collapsed state offers the panel back under its "Spaces" label.
    toggle.innerHTML = collapsed ? 'Spaces' : ICONS.close;
  }
}
function validView(v) {
  return typeof v?.title === 'string' && v.title.trim().length > 0 && v.title.length <= 60
    && ['position', 'target'].every((key) => Array.isArray(v[key]) && v[key].length === 3 && v[key].every((n) => Number.isFinite(n) && Math.abs(n) < 100));
}
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved) && saved.length && saved.length <= 30 && saved.every(validView)) views = saved;
} catch { /* Browser storage may be unavailable; the tour still works. */ }

function notify(message) { $('status').textContent = message; }
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(views)); savedNotice = 'Saved in this browser.'; }
  catch { savedNotice = 'Browser storage is unavailable. Export your tour to keep it.'; }
}
const ICONS = {
  arrow: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"/></svg>',
  expand: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  exit: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 4.5 4.5 11.5M10 11.5H4.5V6"/></svg>',
  compress: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5H2.5V6M10 2.5h3.5V6M2.5 10v3.5H6M10 13.5h3.5V10"/></svg>',
  close: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  play: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.5 8Z" fill="currentColor" stroke="none"/></svg>',
};
function renderViews() {
  $('view-list').replaceChildren();
  views.forEach((view, i) => {
    const button = document.createElement('button');
    button.className = `view-item${i === index ? ' active' : ''}`;
    button.setAttribute('aria-current', i === index ? 'true' : 'false');
    button.disabled = !ready;
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(i + 1).padStart(2, '0');
    const title = document.createElement('span'); title.textContent = view.title;
    const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.innerHTML = ICONS.arrow;
    button.append(number, title, arrow);
    button.addEventListener('click', () => { stopTour(); goToView(i); });
    $('view-list').append(button);
  });
  $('view-count').textContent = `${String(views.length).padStart(2, '0')} SPACES`;
  $('tour-counter').textContent = `${String(index + 1).padStart(2, '0')} / ${String(views.length).padStart(2, '0')}`;
  $('remove-view').disabled = !ready || views.length <= 1;
  renderSpaceMarkers();
  renderFsList();
}
function renderFsList() {
  if (!$('fs-list')) return;
  $('fs-list').replaceChildren();
  views.forEach((view, i) => {
    const button = document.createElement('button');
    button.className = `fs-item${i === index ? ' active' : ''}`;
    button.disabled = !ready;
    button.setAttribute('aria-current', i === index ? 'true' : 'false');
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(i + 1).padStart(2, '0');
    const title = document.createElement('span'); title.textContent = view.title;
    button.append(number, title);
    button.addEventListener('click', (event) => { event.stopPropagation(); stopTour(); goToView(i); if (coarsePointer && isViewerFs()) setFsPanel(true); });
    $('fs-list').append(button);
  });
  if ($('fs-count')) $('fs-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(views.length).padStart(2, '0')}`;
}
function renderSpaceMarkers() {
  const ns = 'http://www.w3.org/2000/svg';
  $('space-markers').replaceChildren();
  views.forEach((view, i) => {
    const [x, , z] = view.position;
    if (x < -10 || x > 7.5 || z < -1.8 || z > 5.4) return;
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('transform', `translate(${x} ${z})`);
    group.setAttribute('class', `space-marker${i === index ? ' selected' : ''}`);
    group.setAttribute('role', 'button'); group.setAttribute('tabindex', ready ? '0' : '-1');
    group.setAttribute('aria-label', `${i + 1}. ${view.title}`);
    const title = document.createElementNS(ns, 'title'); title.textContent = view.title;
    const circle = document.createElementNS(ns, 'circle'); circle.setAttribute('r', '.43');
    const text = document.createElementNS(ns, 'text'); text.textContent = String(i + 1);
    text.setAttribute('dy', '.14');
    group.append(title, circle, text);
    const select = (event) => { event.stopPropagation(); stopTour(); goToView(i); };
    group.addEventListener('click', select);
    group.addEventListener('keydown', (event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); select(event); } });
    $('space-markers').append(group);
  });
}
function stopTour() {
  playing = false; tourClock = 0;
  lastInteract = performance.now();
  $('mode-label').textContent = controls.isLocked ? 'FREE EXPLORATION' : 'LOOK AROUND';
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let flight = null;
function currentLookTarget() {
  return camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3).add(camera.position);
}
function cancelFlight() {
  if (!flight) return;
  flight = null;
  changing = false;
  $('transition').classList.remove('active');
}
function flyStep(now) {
  if (!flight) return;
  const t = Math.min((now - flight.startTime) / (flight.duration * 1000), 1);
  const eased = easeInOutCubic(t);
  camera.position.lerpVectors(flight.startPos, flight.endPos, eased);
  // Gentle arc so longer flights glide slightly above obstacles; free movement still passes through walls.
  camera.position.y += Math.sin(eased * Math.PI) * flight.lift;
  const target = flight.startTarget.clone().lerp(flight.endTarget, eased);
  camera.lookAt(target);
  if (t >= 1) {
    camera.position.copy(flight.endPos);
    camera.lookAt(flight.endTarget);
    flight = null;
    changing = false;
    tourClock = 0;
    $('transition').classList.remove('active');
  }
}
async function goToView(nextIndex, instant = false) {
  if (!ready) return;
  // Interrupt any in-progress flight from the current camera pose.
  cancelFlight();
  keys.clear();
  if (controls.isLocked) controls.unlock();
  const fromPos = camera.position.clone();
  const fromTarget = currentLookTarget();
  index = (nextIndex + views.length) % views.length;
  const view = views[index];
  const endPos = new THREE.Vector3().fromArray(view.position);
  const endTarget = new THREE.Vector3().fromArray(view.target);
  $('current-title').textContent = view.title;
  renderViews();
  if (instant) {
    camera.position.copy(endPos);
    camera.lookAt(endTarget);
    tourClock = 0;
    return;
  }
  const distance = fromPos.distanceTo(endPos);
  if (distance < 0.05) {
    camera.position.copy(endPos);
    camera.lookAt(endTarget);
    tourClock = 0;
    return;
  }
  // Smooth glide from point A to point B instead of jumping. Reduced-motion
  // systems get a shorter, level glide rather than an instant cut.
  changing = true;
  tourClock = 0;
  flight = {
    startPos: fromPos,
    endPos,
    startTarget: fromTarget,
    endTarget,
    startTime: performance.now(),
    duration: reducedMotion ? 0.6 : Math.min(2.2, Math.max(1.1, distance * 0.22)),
    lift: reducedMotion ? 0 : Math.min(0.6, distance * 0.08),
  };
  await new Promise((resolve) => {
    const check = () => (flight ? requestAnimationFrame(check) : resolve());
    check();
  });
}
function move(delta) {
  // Deliberately unrestricted: inspection can pass through all scene geometry.
  // Coarse-pointer (mobile) viewers stay locked to the default eye level.
  if (coarsePointer) delta.y = 0;
  camera.position.add(delta);
}
function moveWithKeys(dt) {
  if (!keys.size) return;
  const forward = camera.getWorldDirection(new THREE.Vector3()); forward.y = 0; forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const direction = new THREE.Vector3();
  if (keys.has('KeyW') || keys.has('ArrowUp')) direction.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) direction.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) direction.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) direction.sub(right);
  if (keys.has('KeyE')) direction.y += 1;
  if (keys.has('KeyQ')) direction.y -= 1;
  if (direction.lengthSq()) move(direction.normalize().multiplyScalar(dt * 1.65));
}
const stick = { active: false, id: null, cx: 0, cy: 0, x: 0, y: 0 };
function moveStick(clientX, clientY) {
  const radius = 44;
  let dx = clientX - stick.cx, dy = clientY - stick.cy;
  const len = Math.hypot(dx, dy);
  if (len > radius) { dx = (dx / len) * radius; dy = (dy / len) * radius; }
  stick.x = dx / radius; stick.y = dy / radius;
  $('stick-nub').style.transform = `translate(${dx}px,${dy}px)`;
}
function endStick(event) {
  if (!stick.active || (event && event.pointerId !== stick.id)) return;
  stick.active = false; stick.x = 0; stick.y = 0;
  $('stick').classList.remove('active');
  $('stick-nub').style.transform = 'translate(0px,0px)';
}
function moveWithTouch(dt) {
  let x = stick.active ? stick.x : 0, y = stick.active ? stick.y : 0;
  if (Math.hypot(x, y) < 0.12) { x = 0; y = 0; }
  if (!x && !y) return;
  const forward = camera.getWorldDirection(new THREE.Vector3()); forward.y = 0;
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const direction = new THREE.Vector3();
  direction.addScaledVector(forward, -y);
  direction.addScaledVector(right, x);
  if (direction.lengthSq()) move(direction.normalize().multiplyScalar(dt * 1.65));
}
const mapVector = new THREE.Vector3();
const lastMapState = { x: Infinity, y: Infinity, z: Infinity, angle: Infinity };
function updateMap() {
  camera.getWorldDirection(mapVector);
  const angle = THREE.MathUtils.radToDeg(Math.atan2(mapVector.x, -mapVector.z));
  const x = THREE.MathUtils.clamp(camera.position.x, -10.1, 7.7);
  const z = THREE.MathUtils.clamp(camera.position.z, -1.9, 5.6);
  const y = camera.position.y;
  // Skip DOM writes when the camera is effectively static: the marker, labels,
  // and readouts are already showing these values. Thresholds sit far below
  // visible precision (marker radius .19 m, readouts to 2 decimals).
  if (Math.abs(x - lastMapState.x) < 0.001 && Math.abs(z - lastMapState.z) < 0.001
    && Math.abs(y - lastMapState.y) < 0.001 && Math.abs(angle - lastMapState.angle) < 0.05) return;
  lastMapState.x = x; lastMapState.y = y; lastMapState.z = z; lastMapState.angle = angle;
  const outside = x !== camera.position.x || z !== camera.position.z;
  $('map-position').setAttribute('transform', `translate(${x} ${z}) rotate(${angle})`);
  $('map-location').textContent = `${outside ? 'Outside plan' : Math.abs(y - 1.65) < .03 ? 'Eye level' : 'Free height'} · ${y.toFixed(2)} m`;
  $('camera-position').textContent = `Camera: ${camera.position.toArray().map((v) => v.toFixed(2)).join(' / ')} m`;
}
function makePlan() {
  const ns = 'http://www.w3.org/2000/svg';
  for (const mesh of floorMeshes) {
    const geometry = mesh.geometry, positions = geometry.attributes.position;
    const indices = geometry.index;
    for (let i = 0; i < (indices?.count ?? positions.count); i += 3) {
      const points = [];
      for (let j = 0; j < 3; j++) {
        const point = new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(i + j) : i + j).applyMatrix4(mesh.matrixWorld);
        points.push(`${point.x},${point.z}`);
      }
      const polygon = document.createElementNS(ns, 'polygon');
      polygon.setAttribute('points', points.join(' ')); $('floor-plan').append(polygon);
    }
  }
  // Architectural section at one metre: windows, doors, and partitions are
  // actual model geometry. Floor triangle edges are deliberately not shown.
  for (const mesh of wallMeshes) {
    const { index: indices, attributes: { position } } = mesh.geometry;
    for (let i = 0; i < (indices?.count ?? position.count); i += 3) {
      const vertices = [0, 1, 2].map((j) => new THREE.Vector3().fromBufferAttribute(position, indices ? indices.getX(i + j) : i + j).applyMatrix4(mesh.matrixWorld));
      const points = [];
      for (let j = 0; j < 3; j++) {
        const a = vertices[j], b = vertices[(j + 1) % 3];
        if ((a.y - 1) * (b.y - 1) < 0) points.push(a.clone().lerp(b, (1 - a.y) / (b.y - a.y)));
      }
      if (points.length === 2) {
        const line = document.createElementNS(ns, 'line');
        for (const [key, value] of Object.entries({ x1: points[0].x, y1: points[0].z, x2: points[1].x, y2: points[1].z, stroke: '#7e8e72', 'stroke-width': .09 })) line.setAttribute(key, value);
        $('floor-plan').append(line);
      }
    }
  }
}
function resize() {
  const rect = $('viewer').getBoundingClientRect();
  camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
  // Fixed 1024-pixel width; CSS scales to the panel while UI stays native-res.
  const width = 1024, height = Math.round(width / camera.aspect);
  renderer.setSize(width, height, false);
  $('resolution').textContent = `${width} × ${height}`;
}
new ResizeObserver(resize).observe($('viewer'));
resize(); renderViews();

new GLTFLoader().load('/models/apartment-demo.glb', async (gltf) => {
  scene.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    if (object.name.startsWith('Floor_')) floorMeshes.push(object);
    if (/^(Wall|Window|Door)/.test(object.name)) wallMeshes.push(object);
    if (object.material.map) object.material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  });
  makePlan(); ready = true;
  for (const id of ['reset', 'walk', 'previous', 'next', 'save-view', 'export-views']) $(id).disabled = false;
  await goToView(0, true);
  $('loading').hidden = true;
  playing = true; tourClock = 0; lastInteract = performance.now();
  $('mode-label').textContent = 'GUIDED TOUR';
  notify('The tour plays automatically. Interact at any time to take over — it resumes after five idle seconds.');
}, (event) => {
  const progress = event.total ? Math.round(event.loaded / event.total * 100) : 0;
  $('progress').value = progress;
  $('loading-text').textContent = progress ? `Loading the apartment · ${progress}%` : 'Loading the apartment…';
}, (error) => {
  console.error(error);
  $('loading').querySelector('h2').textContent = 'The apartment could not load';
  $('loading-text').textContent = 'Check the local server and refresh the page.';
  notify('Model loading failed. Please refresh after checking the local server.');
});

$('walk').addEventListener('click', () => {
  if (controls.isLocked) { controls.unlock(); return; }
  cancelFlight();
  stopTour(); canvas.focus();
  try {
    const request = canvas.requestPointerLock();
    request?.catch(() => notify('Drag to look · W A S D to move · E up · Q down. Mouse capture is unavailable here.'));
  } catch { notify('Drag to look · W A S D to move · E up · Q down.'); }
});
document.addEventListener('pointerlockerror', () => notify('Drag to look · W A S D to move · E up · Q down. Mouse capture is unavailable here.'));
controls.addEventListener('lock', () => { $('mode-label').textContent = 'FREE EXPLORATION'; $('walk').innerHTML = `Exit exploration <span>${ICONS.exit}</span>`; $('crosshair').hidden = false; notify('W A S D to move · E up · Q down · mouse to look · Esc to release. Walls and doors do not block movement.'); });
controls.addEventListener('unlock', () => { keys.clear(); $('mode-label').textContent = playing ? 'GUIDED TOUR' : 'LOOK AROUND'; $('walk').innerHTML = `Explore freely <span>${ICONS.arrow}</span>`; $('crosshair').hidden = true; });
canvas.addEventListener('pointerdown', (event) => {
  if (!ready || controls.isLocked) return;
  if (flight) cancelFlight();
  if (changing) return;
  // Touch navigation in fullscreen gets full real estate: hide the spaces menu while moving.
  if (event.pointerType === 'touch' && coarsePointer && isViewerFs()) setFsPanel(true);
  stopTour(); dragging = true; previousPointer = [event.clientX, event.clientY];
  canvas.setPointerCapture(event.pointerId); canvas.focus();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging || controls.isLocked) return;
  camera.rotation.y -= (event.clientX - previousPointer[0]) * .003;
  camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - (event.clientY - previousPointer[1]) * .003, -1.35, 1.35);
  previousPointer = [event.clientX, event.clientY];
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { dragging = false; });
$('stick').addEventListener('pointerdown', (event) => {
  if (!ready || stick.active) return;
  event.preventDefault();
  if (flight) cancelFlight();
  if (changing) return;
  stopTour();
  stick.active = true; stick.id = event.pointerId;
  $('stick').classList.add('active');
  const rect = $('stick').getBoundingClientRect();
  stick.cx = rect.left + rect.width / 2; stick.cy = rect.top + rect.height / 2;
  moveStick(event.clientX, event.clientY);
});
window.addEventListener('pointermove', (event) => {
  if (!stick.active || event.pointerId !== stick.id) return;
  moveStick(event.clientX, event.clientY);
});
window.addEventListener('pointerup', endStick);
window.addEventListener('pointercancel', endStick);
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input,textarea') || !ready) return;
  if ((controls.isLocked || document.activeElement === canvas) && ['KeyW','KeyA','KeyS','KeyD','KeyE','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) {
    event.preventDefault();
    if (flight) cancelFlight();
    if (changing) return;
    stopTour(); keys.add(event.code);
    // Short taps can begin and end between animation frames. Apply a small
    // initial step so both tapping and holding the controls respond reliably.
    if (!event.repeat) { moveWithKeys(.025); updateMap(); }
  }
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => { keys.clear(); dragging = false; stopTour(); });
canvas.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) { keys.clear(); stopTour(); } });
$('reset').addEventListener('click', () => { stopTour(); goToView(0); });
$('previous').addEventListener('click', () => { stopTour(); goToView(index - 1); });
$('next').addEventListener('click', () => { stopTour(); goToView(index + 1); });
controls.addEventListener('change', () => { lastInteract = performance.now(); });
function isViewerFs() { return !!document.fullscreenElement || $('viewer').classList.contains('pseudo-fullscreen'); }
function renderFsButton() {
  const button = $('fullscreen');
  if (!button) return;
  const fs = isViewerFs();
  button.innerHTML = fs ? ICONS.compress : ICONS.expand;
  button.setAttribute('aria-label', fs ? 'Exit fullscreen' : 'Enter fullscreen');
  button.setAttribute('title', fs ? 'Exit fullscreen' : 'Fullscreen');
}
function enterPseudoFs() {
  // Fallback for browsers without element fullscreen (e.g. iPhone Safari):
  // expand the viewer to fill the screen with CSS instead.
  $('viewer').classList.add('pseudo-fullscreen');
  document.body.style.overflow = 'hidden';
  resize(); renderFsButton();
}
function exitPseudoFs() {
  $('viewer').classList.remove('pseudo-fullscreen');
  document.body.style.overflow = '';
  resize(); renderFsButton();
}
$('fullscreen').addEventListener('click', async () => {
  if (isViewerFs()) { if (document.fullscreenElement) await document.exitFullscreen(); else exitPseudoFs(); return; }
  const request = $('viewer').requestFullscreen?.bind($('viewer')) || $('viewer').webkitRequestFullscreen?.bind($('viewer'));
  try {
    if (!request) throw new Error('no fullscreen api');
    const result = request();
    if (result?.catch) await result;
  } catch { enterPseudoFs(); }
});
document.addEventListener('fullscreenchange', () => { resize(); renderFsButton(); });
$('fs-prev').addEventListener('click', (event) => { event.stopPropagation(); stopTour(); goToView(index - 1); if (coarsePointer && isViewerFs()) setFsPanel(true); });
$('fs-next').addEventListener('click', (event) => { event.stopPropagation(); stopTour(); goToView(index + 1); if (coarsePointer && isViewerFs()) setFsPanel(true); });
$('fs-toggle').addEventListener('click', (event) => { event.stopPropagation(); setFsPanel(!$('viewer').classList.contains('fs-collapsed')); });
setFsPanel($('viewer').classList.contains('fs-collapsed')); renderFsButton();
$('plan').addEventListener('click', (event) => {
  if (!ready) return;
  cancelFlight();
  if (changing) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform($('plan').getScreenCTM().inverse());
  const next = new THREE.Vector3(point.x, 1.65, point.y);
  stopTour(); camera.position.copy(next); $('current-title').textContent = 'Your perspective';
  notify('Moved to your selected position. Drag to look around.');
});
$('save-view').addEventListener('click', () => {
  if (!ready || changing) return;
  if (views.length >= 30) { notify('This demo supports up to 30 viewpoints.'); return; }
  const title = $('view-name').value.trim();
  if (!title) { $('view-name').focus(); notify('Give your viewpoint a title first.'); return; }
  stopTour();
  const target = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3).add(camera.position);
  views.push({ title, position: camera.position.toArray(), target: target.toArray() });
  index = views.length - 1; persist(); renderViews(); $('view-name').value = '';
  $('current-title').textContent = title; notify(`“${title}” added. ${savedNotice}`);
});
$('export-views').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, model: 'apartment-demo.glb', views }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'apartment-tour.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Tour exported as apartment-tour.json.');
});
$('remove-view').addEventListener('click', async () => {
  if (!ready || changing || views.length <= 1) return;
  stopTour(); const removed = views.splice(index, 1)[0]; persist();
  await goToView(Math.min(index, views.length - 1));
  notify(`Removed “${removed.title}”. ${savedNotice}`);
});
$('import-views').addEventListener('click', () => $('tour-file').click());
$('tour-file').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file || !ready) return;
  try {
    if (file.size > 100000) throw new Error('Tour file is too large.');
    const data = JSON.parse(await file.text());
    if (data.version !== 1 || data.model !== 'apartment-demo.glb' || !Array.isArray(data.views) || !data.views.length || data.views.length > 30 || !data.views.every(validView)) throw new Error('Choose a valid tour exported for this apartment.');
    stopTour(); views = data.views; persist(); await goToView(0); notify(`Imported ${views.length} viewpoints. ${savedNotice}`);
  } catch (error) { notify(error.message); }
  event.target.value = '';
});
canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); stopTour(); notify('The graphics context was interrupted. Refresh to reload the walkthrough.'); });

let previousTime = performance.now();
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - previousTime) / 1000, .05); previousTime = time;
  if (ready) {
    if (flight) flyStep(time);
    if (!changing) {
      moveWithKeys(dt);
      moveWithTouch(dt);
      if (dragging || keys.size || stick.active) lastInteract = time;
      if (playing) {
        tourClock += dt;
        if (tourClock > 4) goToView(index + 1);
      } else if (time - lastInteract > IDLE_RESUME_MS && !flight) {
        // Ambient auto-tour: resume gliding after five idle seconds, looping forever.
        playing = true; tourClock = 0;
        $('mode-label').textContent = 'GUIDED TOUR';
        goToView(index + 1);
      }
    }
    updateMap();
  }
  renderer.render(scene, camera);
});
