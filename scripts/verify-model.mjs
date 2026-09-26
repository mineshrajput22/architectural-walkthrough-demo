import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vector3, Raycaster } from 'three';

const bytes = fs.readFileSync(new URL('../src/models/apartment-demo.glb', import.meta.url));
assert.equal(bytes.readUInt32LE(8), bytes.length);
const length = bytes.readUInt32LE(12);
const document = JSON.parse(bytes.subarray(20, 20 + length));
assert.deepEqual(document.extensionsRequired, ['KHR_materials_unlit']);
assert.equal(document.images.length, 11);
const binary = bytes.subarray(28 + length);
for (const image of document.images) {
  const view = document.bufferViews[image.bufferView];
  const offset = view.byteOffset ?? 0;
  assert.equal(binary.readUInt32BE(offset + 16), 1024);
  assert.equal(binary.readUInt32BE(offset + 20), 1024);
}
// Parse actual geometry without loading images in the headless Node process.
document.buffers = [{ byteLength: binary.length, uri: `data:application/octet-stream;base64,${binary.toString('base64')}` }];
for (const key of ['images', 'textures', 'materials', 'extensionsRequired', 'extensionsUsed']) delete document[key];
for (const mesh of document.meshes) for (const primitive of mesh.primitives) delete primitive.material;
globalThis.ProgressEvent = class {};
const gltf = await new GLTFLoader().parseAsync(JSON.stringify(document), '');
gltf.scene.updateMatrixWorld(true);
const floor = [];
gltf.scene.traverse((object) => { if (object.isMesh && object.name.startsWith('Floor_')) floor.push(object); });
const ray = new Raycaster();
const views = JSON.parse(fs.readFileSync(new URL('../src/tour.json', import.meta.url)));
for (const view of views) {
  const [x, y, z] = view.position;
  ray.set(new Vector3(x, 2.8, z), new Vector3(0, -1, 0));
  assert.ok(ray.intersectObjects(floor).length, `${view.title} has no floor`);
}
ray.set(new Vector3(30, 2.8, 30), new Vector3(0, -1, 0));
assert.equal(ray.intersectObjects(floor).length, 0, 'Floor geometry ends at apartment bounds');
const floorPlanSource = fs.readFileSync(new URL('../apartment_floor_plan.glb', import.meta.url));
const floorPlanDemo = fs.readFileSync(new URL('../src/models/apartment-floor-plan-demo.glb', import.meta.url));
assert.ok(floorPlanDemo.equals(floorPlanSource), 'Browser floor plan must preserve the supplied GLB byte-for-byte');
assert.equal(floorPlanDemo.readUInt32LE(8), floorPlanDemo.length);
const floorPlanJsonLength = floorPlanDemo.readUInt32LE(12);
const floorPlanDocument = JSON.parse(floorPlanDemo.subarray(20, 20 + floorPlanJsonLength));
assert.equal(floorPlanDocument.images.length, 3);
assert.equal(floorPlanDocument.asset.extras.author, 'SrMonteiro (https://sketchfab.com/crispimrafael)');
assert.match(floorPlanDocument.asset.extras.license, /CC-BY-4\.0/);
assert.ok(floorPlanDocument.meshes.length > 0 && floorPlanDocument.accessors.some((accessor) => accessor.type === 'VEC3' && accessor.min && accessor.max));
console.log('PASS: walkthrough GLB, eleven 1K textures, five viewpoints, floor bounds; separate floor-plan GLB and attribution.');
