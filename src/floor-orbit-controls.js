import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class FloorOrbitControls extends OrbitControls {
  _updateZoomParameters(x, y) {
    // Three 0.186 passes the two-touch midpoint as page coordinates here,
    // although OrbitControls expects viewport coordinates for its canvas rect.
    // Mouse wheel coordinates are already viewport-relative.
    if (this._pointers.length === 2) {
      super._updateZoomParameters(x - window.scrollX, y - window.scrollY);
    } else {
      super._updateZoomParameters(x, y);
    }
  }
}
