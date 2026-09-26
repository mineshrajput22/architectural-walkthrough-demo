"""Prepare this baked sample for the demo, preserving the original asset."""
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / 'apartment__baked.glb'
data = source.read_bytes()
offset = 12
chunks = []
while offset < len(data):
    size, kind = struct.unpack_from('<II', data, offset)
    chunks.append((kind, data[offset + 8:offset + 8 + size]))
    offset += 8 + size
document = json.loads(chunks[0][1])
for material in document['materials']:
    legacy = material.get('extensions', {}).get('KHR_materials_pbrSpecularGlossiness', {})
    # This sample stores its baked appearance in the diffuse texture. Unlit
    # avoids illuminating those already-lit pixels a second time. This is a
    # sample-specific conversion, not a general specular/glossiness converter.
    material['pbrMetallicRoughness'] = {
        'baseColorFactor': legacy.get('diffuseFactor', [1, 1, 1, 1]),
        'metallicFactor': 0,
        'roughnessFactor': 1,
    }
    if 'diffuseTexture' in legacy:
        material['pbrMetallicRoughness']['baseColorTexture'] = legacy['diffuseTexture']
    material['extensions'] = {'KHR_materials_unlit': {}}
    material.pop('emissiveFactor', None)
    material.pop('emissiveTexture', None)
document['extensionsUsed'] = ['KHR_materials_unlit']
document['extensionsRequired'] = ['KHR_materials_unlit']
document['asset']['generator'] = 'Local demo: baked diffuse to unlit; original attribution preserved'
encoded = json.dumps(document, separators=(',', ':')).encode()
encoded += b' ' * ((-len(encoded)) % 4)
chunks[0] = (0x4E4F534A, encoded)
body = b''.join(struct.pack('<II', len(chunk), kind) + chunk for kind, chunk in chunks)
target = root / 'src' / 'models' / 'apartment-demo.glb'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + len(body)) + body)
print(f'Prepared {target.name}: {target.stat().st_size:,} bytes')
