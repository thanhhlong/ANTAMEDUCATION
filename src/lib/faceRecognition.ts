import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Model weight files are served as static assets from /public/models (not bundled
// in the face-api.js npm package itself — the package only ships the JS code).
export function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
  })();
  return loadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

// Detects the single most prominent face in a video/image element and returns
// its 128-d recognition descriptor, or null if no face was found.
export async function detectFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const result = await faceapi
    .detectSingleFace(input, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result ? result.descriptor : null;
}

export function averageDescriptors(descriptors: Float32Array[]): number[] {
  const len = descriptors[0].length;
  const avg = new Array(len).fill(0);
  for (const d of descriptors) {
    for (let i = 0; i < len; i++) avg[i] += d[i];
  }
  for (let i = 0; i < len; i++) avg[i] /= descriptors.length;
  return avg;
}

export function euclideanDistance(a: number[] | Float32Array, b: number[] | Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Empirically, face-api.js descriptors from the same person land under ~0.5-0.6
// Euclidean distance; different people are typically well above that.
export const MATCH_THRESHOLD = 0.55;

export function findBestMatch<T extends { descriptor: number[] }>(
  descriptor: Float32Array,
  enrollments: T[]
): { match: T; distance: number } | null {
  let best: { match: T; distance: number } | null = null;
  for (const e of enrollments) {
    const distance = euclideanDistance(descriptor, e.descriptor);
    if (!best || distance < best.distance) {
      best = { match: e, distance };
    }
  }
  if (best && best.distance <= MATCH_THRESHOLD) return best;
  return null;
}
