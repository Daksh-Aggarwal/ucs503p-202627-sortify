import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Category } from '@/data/catalog';

export type BoundingBox = {
  /** Fractional coordinates in the source image, with every value between 0 and 1. */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectorClass =
  | 'paper'
  | 'cardboard'
  | 'glass'
  | 'metal'
  | 'plastic_bottle'
  | 'plastic_bag'
  | 'sanitary_ppe_waste'
  | 'organic'
  | 'battery_ewaste'
  | 'hazardous_medical';

export type RecognitionPrediction = {
  classId: number;
  className: DetectorClass;
  itemId: string;
  category: Category;
  confidence: number;
  box: BoundingBox;
};

type ClassMapping = Omit<RecognitionPrediction, 'classId' | 'confidence' | 'box'>;

/**
 * This order is part of the trained YOLOv11 dataset contract. Keep it in sync with
 * `server/app/main.py` and the model's data.yaml file when the model is retrained.
 */
export const DETECTOR_CLASS_MAPPING: Record<number, ClassMapping> = {
  0: { className: 'paper', itemId: 'paper', category: 'Recyclable' },
  1: { className: 'cardboard', itemId: 'box', category: 'Recyclable' },
  2: { className: 'glass', itemId: 'jar', category: 'Recyclable' },
  3: { className: 'metal', itemId: 'can', category: 'Recyclable' },
  4: { className: 'plastic_bottle', itemId: 'bottle', category: 'Recyclable' },
  5: { className: 'plastic_bag', itemId: 'plastic-bag', category: 'General waste' },
  6: { className: 'sanitary_ppe_waste', itemId: 'tissue', category: 'General waste' },
  7: { className: 'organic', itemId: 'scraps', category: 'Organic' },
  8: { className: 'battery_ewaste', itemId: 'battery', category: 'E-waste' },
  9: { className: 'hazardous_medical', itemId: 'medical-waste', category: 'Hazardous' },
};

type PredictionResponse = {
  detections?: {
    class_id?: unknown;
    confidence?: unknown;
    bbox?: Partial<BoundingBox>;
  }[];
};

const apiUrl = process.env.EXPO_PUBLIC_INFERENCE_API_URL?.replace(/\/$/, '');

function asNormalizedBox(box: Partial<BoundingBox> | undefined): BoundingBox | null {
  const values = [box?.x, box?.y, box?.width, box?.height];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  const [x, y, width, height] = values as number[];
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) return null;
  return { x, y, width, height };
}

function getPrediction(response: PredictionResponse): RecognitionPrediction {
  const candidates = (response.detections || [])
    .map((detection) => {
      const classId = typeof detection.class_id === 'number' ? detection.class_id : NaN;
      const confidence = typeof detection.confidence === 'number' ? detection.confidence : NaN;
      const mapping = DETECTOR_CLASS_MAPPING[classId];
      const box = asNormalizedBox(detection.bbox);
      return mapping && box && Number.isFinite(confidence)
        ? {
            ...mapping,
            classId,
            confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100),
            box,
          }
        : null;
    })
    .filter((prediction): prediction is RecognitionPrediction => prediction !== null)
    .sort((a, b) => b.confidence - a.confidence);
  if (!candidates[0])
    throw new Error(
      'No supported waste item was detected. Try a clearer photo with one item in frame.',
    );
  return candidates[0];
}

export async function recognizeImage(uri: string): Promise<RecognitionPrediction> {
  if (!apiUrl)
    throw new Error(
      'The recognition service is not configured. Add EXPO_PUBLIC_INFERENCE_API_URL to connect the FastAPI detector.',
    );

  const targetUrl = `${apiUrl}/v1/detections`;
  console.log('[Sortify] Calling recognition service:', targetUrl);

  if (Platform.OS === 'web') {
    let response: Response;
    try {
      const blob = await fetch(uri).then((res) => res.blob());
      const body = new FormData();
      body.append('image', blob, 'sortify-scan.jpg');
      response = await fetch(targetUrl, { method: 'POST', body });
    } catch (error) {
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error('[Sortify] Detection request failed:', error, 'Target:', targetUrl);
      throw new Error(
        `Could not reach the recognition service at ${apiUrl} (${errorDetails}). Check that FastAPI is running and reachable from this device.`,
      );
    }
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { detail?: unknown } | null;
      throw new Error(
        typeof detail?.detail === 'string'
          ? detail.detail
          : 'The recognition service could not process this image.',
      );
    }
    return getPrediction((await response.json()) as PredictionResponse);
  }

  let uploadResult: FileSystem.FileSystemUploadResult;
  try {
    uploadResult = await FileSystem.uploadAsync(targetUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'image',
      mimeType: 'image/jpeg',
    });
  } catch (error) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('[Sortify] Detection upload failed:', error, 'Target:', targetUrl);
    throw new Error(
      `Could not reach the recognition service at ${apiUrl} (${errorDetails}). Check that FastAPI is running and reachable from this device.`,
    );
  }

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    let detail: { detail?: unknown } | null = null;
    try {
      detail = JSON.parse(uploadResult.body) as { detail?: unknown };
    } catch {
      // ignore json parse errors
    }
    throw new Error(
      typeof detail?.detail === 'string'
        ? detail.detail
        : 'The recognition service could not process this image.',
    );
  }

  const data = JSON.parse(uploadResult.body) as PredictionResponse;
  return getPrediction(data);
}

export function demoPrediction(itemId: string, confidence: number): RecognitionPrediction {
  const classIdByItem: Record<string, number> = {
    bottle: 4,
    banana: 7,
    box: 1,
    battery: 8,
    can: 3,
  };
  const classId = classIdByItem[itemId];
  const mapping = DETECTOR_CLASS_MAPPING[classId];
  if (!mapping) throw new Error('This sample is not represented in the detector mapping.');
  return {
    ...mapping,
    itemId,
    classId,
    confidence,
    box: { x: 0.2, y: 0.15, width: 0.6, height: 0.7 },
  };
}

export function serializeBox(box: BoundingBox) {
  return [box.x, box.y, box.width, box.height].map((value) => value.toFixed(5)).join(',');
}

export function parseBox(value?: string | string[]): BoundingBox | null {
  if (typeof value !== 'string') return null;
  const values = value.split(',').map(Number);
  return values.length === 4
    ? asNormalizedBox({ x: values[0], y: values[1], width: values[2], height: values[3] })
    : null;
}
