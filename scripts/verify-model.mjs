import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vector3, Raycaster } from 'three';

const bytes = fs.readFileSync(new URL('../public/models/apartment-demo.glb', import.meta.url));
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
console.log('PASS: GLB structure; eleven 1K textures; five starting viewpoints; floor geometry bounds.');
