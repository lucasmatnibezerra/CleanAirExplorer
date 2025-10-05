// Lightweight ozone forecast grid loader and interpolator
// Assumes .npy float32 arrays with shape (rows, cols)

export interface OzoneManifestHour {
  index: number;
  file: string;
  timestamp: string; // ISO
}

export interface OzoneManifest {
  version: number;
  variable: string; // "ozone_ppb"
  unit: string; // "ppb"
  grid: {
    lat_min: number;
    lat_max: number;
    lon_min: number;
    lon_max: number;
    rows: number;
    cols: number;
  };
  hours: OzoneManifestHour[];
  attribution?: string;
}

// Internal cache
const manifestUrl = '/data/ozone/manifest.json';
let manifestPromise: Promise<OzoneManifest> | null = null;
const gridCache: Record<number, Promise<Float32Array>> = {};

interface NpyHeader {
  shape: number[];
  fortranOrder: boolean;
  dtype: string;
}

function parseNpy(buffer: ArrayBuffer): Float32Array {
  // Minimal .npy (v1.0/2.0) parser for little-endian float32
  const magic = new TextDecoder().decode(new Uint8Array(buffer, 0, 6));
  if (!magic.startsWith('\u0093NUMPY')) {
    // Some bundlers may strip the initial 0x93, fallback check
  }
  const view = new DataView(buffer);
  const major = view.getUint8(6);
  // minor version currently unused but read to advance pointer
  view.getUint8(7); // minor
  let headerLen: number;
  if (major === 1) {
    headerLen = view.getUint16(8, true);
    const headerTxt = new TextDecoder().decode(new Uint8Array(buffer, 10, headerLen));
  parseHeaderDict(headerTxt);
    const offset = 10 + headerLen;
    return new Float32Array(buffer, offset);
  } else if (major === 2) {
    headerLen = view.getUint32(8, true);
    const headerTxt = new TextDecoder().decode(new Uint8Array(buffer, 12, headerLen));
    parseHeaderDict(headerTxt); // not used afterwards
    const offset = 12 + headerLen;
    return new Float32Array(buffer, offset);
  }
  throw new Error('Unsupported npy version');
}

function parseHeaderDict(txt: string): NpyHeader {
  // Convert Python dict literal to JSON-ish string then eval safely
  // Example: "{'descr': '<f4', 'fortran_order': False, 'shape': (240, 400), }"
  const cleaned = txt
    .trim()
    .replace(/^[{]|[}]$/g, '')
    .replace(/True/g, 'true')
    .replace(/False/g, 'false')
    .replace(/'/g, '"')
    .replace(/\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/, '[$1,$2]');
  const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
  const dict: any = {};
  for (const p of parts) {
    const [k, v] = p.split(/:\s*/);
    if (!k) continue;
    try {
      if (v === 'true' || v === 'false') dict[k.replace(/"/g, '')] = v === 'true';
      else if (/^\[/.test(v)) dict[k.replace(/"/g, '')] = JSON.parse(v);
      else dict[k.replace(/"/g, '')] = v.replace(/"/g, '');
    } catch {
      // ignore minor parsing issues
    }
  }
  return {
    dtype: dict.descr || '<f4',
    fortranOrder: !!dict.fortran_order,
    shape: dict.shape || []
  };
}

export async function loadManifest(): Promise<OzoneManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(manifestUrl).then(r => {
      if (!r.ok) throw new Error('Failed manifest');
      return r.json();
    });
  }
  return manifestPromise;
}

async function loadHour(index: number): Promise<Float32Array> {
  if (!gridCache[index]) {
    gridCache[index] = (async () => {
      const m = await loadManifest();
      const hour = m.hours.find(h => h.index === index);
      if (!hour) throw new Error('Hour out of range');
      const res = await fetch(`/data/ozone/${hour.file}`);
      if (!res.ok) throw new Error('Failed hour file');
      const buf = await res.arrayBuffer();
      return parseNpy(buf);
    })();
  }
  return gridCache[index];
}

export interface OzoneGridMeta {
  rows: number;
  cols: number;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
}

export interface SampleResult {
  value: number | null; // null if out of bounds
}

export async function getOzoneValue(lat: number, lon: number, hourIndex: number): Promise<SampleResult> {
  const manifest = await loadManifest();
  const { rows, cols, lat_min, lat_max, lon_min, lon_max } = manifest.grid;
  if (lat < lat_min || lat > lat_max || lon < lon_min || lon > lon_max) return { value: null };
  const arr = await loadHour(hourIndex);
  // Bilinear interpolation
  const latFrac = (lat - lat_min) / (lat_max - lat_min);
  const lonFrac = (lon - lon_min) / (lon_max - lon_min);
  const y = latFrac * (rows - 1);
  const x = lonFrac * (cols - 1);
  const y0 = Math.floor(y), y1 = Math.min(rows - 1, y0 + 1);
  const x0 = Math.floor(x), x1 = Math.min(cols - 1, x0 + 1);
  const fy = y - y0;
  const fx = x - x0;
  const idx = (row: number, col: number) => row * cols + col;
  const v00 = arr[idx(y0, x0)];
  const v01 = arr[idx(y0, x1)];
  const v10 = arr[idx(y1, x0)];
  const v11 = arr[idx(y1, x1)];
  const v0 = v00 * (1 - fx) + v01 * fx;
  const v1 = v10 * (1 - fx) + v11 * fx;
  const v = v0 * (1 - fy) + v1 * fy;
  return { value: v };
}

export async function getOzoneGrid(hourIndex: number): Promise<{ meta: OzoneGridMeta; data: Float32Array; } > {
  const manifest = await loadManifest();
  const arr = await loadHour(hourIndex);
  return { meta: { ...manifest.grid }, data: arr };
}

export function clearOzoneCache() {
  manifestPromise = null;
  for (const k of Object.keys(gridCache)) delete gridCache[+k];
}
