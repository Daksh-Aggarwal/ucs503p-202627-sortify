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
  | 'paper_cardboard'
  | 'flexible_plastic'
  | 'paper'
  | 'cardboard'
  | 'glass'
  | 'metal'
  | 'plastic_bottle'
  | 'plastic_bag'
  | 'sanitary_ppe_waste'
  | 'organic'
  | 'battery_ewaste'
  | 'hazardous_medical'
  | string;

export type RecognitionPrediction = {
  classId: number;
  className: DetectorClass;
  /** Raw prediction class label returned directly from the model */
  modelClassName: string;
  /** Clean human-readable label */
  displayName: string;
  itemId: string;
  /** Guaranteed mapped to one of Sortify's 5 major categories */
  category: Category;
  confidence: number;
  box: BoundingBox;
};

export type ModelOption = {
  id: string;
  name: string;
  is_default?: boolean;
};

export type ConfidenceTier = 'low' | 'medium' | 'high';

export type ConfidenceOption = {
  id: ConfidenceTier;
  label: string;
  value: number;
  thresholdPercent: number;
  description: string;
};

export const CONFIDENCE_LEVELS: ConfidenceOption[] = [
  {
    id: 'low',
    label: 'Low',
    value: 0.35,
    thresholdPercent: 35,
    description: '35% min - Sensitive, detects faint or partially occluded items',
  },
  {
    id: 'medium',
    label: 'Medium',
    value: 0.50,
    thresholdPercent: 50,
    description: '50% min - Balanced, recommended default for daily waste sorting',
  },
  {
    id: 'high',
    label: 'High',
    value: 0.70,
    thresholdPercent: 70,
    description: '70% min - Strict, requires high certainty detection',
  },
];

/**
 * Mapping for the 8-class YOLOv11 model (from Sortify-ML/yolov11/best.pt)
 * Classes:
 *   0: paper_cardboard   -> Recyclable
 *   1: plastic_bottle    -> Recyclable
 *   2: metal             -> Recyclable
 *   3: flexible_plastic  -> General waste
 *   4: sanitary_ppe_waste-> General waste
 *   5: organic           -> Organic
 *   6: battery_ewaste    -> E-waste
 *   7: hazardous_medical -> Hazardous
 */
export const STREAMLINED_8_CLASS_MAPPING: Record<
  number,
  { className: string; displayName: string; itemId: string; category: Category }
> = {
  0: { className: 'paper_cardboard', displayName: 'Paper & Cardboard', itemId: 'paper-cardboard', category: 'Recyclable' },
  1: { className: 'plastic_bottle', displayName: 'Plastic Bottle & Container', itemId: 'plastic-bottle', category: 'Recyclable' },
  2: { className: 'metal', displayName: 'Metal Can & Packaging', itemId: 'metal', category: 'Recyclable' },
  3: { className: 'flexible_plastic', displayName: 'Flexible Plastic Packaging', itemId: 'flexible-plastic', category: 'General waste' },
  4: { className: 'sanitary_ppe_waste', displayName: 'Sanitary & PPE Waste', itemId: 'sanitary-ppe', category: 'General waste' },
  5: { className: 'organic', displayName: 'Organic Waste', itemId: 'organic-waste', category: 'Organic' },
  6: { className: 'battery_ewaste', displayName: 'Battery & E-waste', itemId: 'battery-ewaste', category: 'E-waste' },
  7: { className: 'hazardous_medical', displayName: 'Hazardous Medical Waste', itemId: 'hazardous-medical', category: 'Hazardous' },
};

/**
 * Mapping for the 10-class dataset YOLOv11 model
 */
export const UNIFIED_10_CLASS_MAPPING: Record<
  number,
  { className: string; displayName: string; itemId: string; category: Category }
> = {
  0: { className: 'paper', displayName: 'Paper', itemId: 'paper', category: 'Recyclable' },
  1: { className: 'cardboard', displayName: 'Cardboard Box', itemId: 'box', category: 'Recyclable' },
  2: { className: 'glass', displayName: 'Glass Container', itemId: 'jar', category: 'Recyclable' },
  3: { className: 'metal', displayName: 'Metal Can & Packaging', itemId: 'metal', category: 'Recyclable' },
  4: { className: 'plastic_bottle', displayName: 'Plastic Bottle & Container', itemId: 'plastic-bottle', category: 'Recyclable' },
  5: { className: 'plastic_bag', displayName: 'Plastic Bag & Flexible Film', itemId: 'flexible-plastic', category: 'General waste' },
  6: { className: 'sanitary_ppe_waste', displayName: 'Sanitary & PPE Waste', itemId: 'sanitary-ppe', category: 'General waste' },
  7: { className: 'organic', displayName: 'Organic Waste', itemId: 'organic-waste', category: 'Organic' },
  8: { className: 'battery_ewaste', displayName: 'Battery & E-waste', itemId: 'battery-ewaste', category: 'E-waste' },
  9: { className: 'hazardous_medical', displayName: 'Hazardous Medical Waste', itemId: 'hazardous-medical', category: 'Hazardous' },
};

type RawDetection = {
  class_id?: unknown;
  class_name?: string;
  model_class_name?: string;
  display_name?: string;
  category?: Category;
  item_id?: string;
  confidence?: unknown;
  bbox?: Partial<BoundingBox>;
};

type PredictionResponse = {
  model?: string;
  model_profile?: string;
  detections?: RawDetection[];
};

const apiUrl = process.env.EXPO_PUBLIC_INFERENCE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export async function fetchAvailableModels(): Promise<ModelOption[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${apiUrl}/v1/models`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models) && data.models.length > 0) {
        return data.models;
      }
    }
  } catch {
    // API not reachable; return static fallback list
  }
  return [
    { id: 'best.pt', name: 'YOLOv11s v3 Generalization (8 Classes - Production Default)', is_default: true },
    { id: 'yolo11s_8cls_v3_generalization.pt', name: 'YOLOv11s (8 Classes - v3 Generalization Dataset)' },
    { id: 'yolo11s_8cls_v2_curated.pt', name: 'YOLOv11s (8 Classes - v2 Curated Dataset)' },
    { id: 'yolo11s_8cls_real_organic.pt', name: 'YOLOv11s (8 Classes - Real Organic Augmentation)' },
    { id: 'yolo11s_8cls_v1_streamlined_old_dataset.pt', name: 'YOLOv11s (8 Classes - Old 8-Class Streamlined Dataset)' },
    { id: 'yolo11s_10cls_legacy_old_dataset.pt', name: 'YOLOv11s (10 Classes - Old 10-Class Legacy Dataset)' },
  ];
}

function asNormalizedBox(box: Partial<BoundingBox> | undefined): BoundingBox | null {
  const values = [box?.x, box?.y, box?.width, box?.height];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
  const [x, y, width, height] = values as number[];
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) return null;
  return { x, y, width, height };
}

export function getAllPredictions(response: PredictionResponse): RecognitionPrediction[] {
  const candidates = (response.detections || [])
    .map((detection) => {
      const classId = typeof detection.class_id === 'number' ? detection.class_id : NaN;
      const confidence = typeof detection.confidence === 'number' ? detection.confidence : NaN;
      const box = asNormalizedBox(detection.bbox);
      if (!box || !Number.isFinite(confidence)) return null;

      // Check if server already provided 5-class category mapping
      if (detection.category && detection.item_id) {
        return {
          classId,
          className: (detection.class_name || detection.model_class_name || 'waste') as DetectorClass,
          modelClassName: detection.model_class_name || detection.class_name || 'waste',
          displayName: detection.display_name || (detection.model_class_name || 'waste').replaceAll('_', ' '),
          itemId: detection.item_id,
          category: detection.category,
          confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100),
          box,
        };
      }

      // Client-side fallback mapping for 8-class vs 10-class
      const is8Class = response.model_profile === 'sortify-8class' || classId <= 7;
      const mapping = is8Class
        ? STREAMLINED_8_CLASS_MAPPING[classId]
        : UNIFIED_10_CLASS_MAPPING[classId];

      if (!mapping) return null;
      return {
        classId,
        className: mapping.className,
        modelClassName: mapping.className,
        displayName: mapping.displayName,
        itemId: mapping.itemId,
        category: mapping.category,
        confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100),
        box,
      };
    })
    .filter((prediction): prediction is RecognitionPrediction => prediction !== null)
    .sort((a, b) => b.confidence - a.confidence);

  if (!candidates[0]) {
    throw new Error('No supported waste item was detected. Try a clearer photo with one item in frame.');
  }
  return candidates;
}

export function getPrediction(response: PredictionResponse): RecognitionPrediction {
  return getAllPredictions(response)[0];
}

export async function recognizeImage(
  uri: string,
  selectedModel: string = 'best.pt',
  confidenceThreshold: number = 0.50,
): Promise<RecognitionPrediction[]> {
  const targetUrl = `${apiUrl}/v1/detections?model=${encodeURIComponent(selectedModel)}&confidence=${encodeURIComponent(String(confidenceThreshold))}`;
  console.log('[Sortify] Calling recognition service with model:', selectedModel, 'confidence:', confidenceThreshold, 'URL:', targetUrl);

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
    return getAllPredictions((await response.json()) as PredictionResponse);
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
  return getAllPredictions(data);
}

export function demoPredictions(itemId: string, confidence: number): RecognitionPrediction[] {
  const primary = demoPrediction(itemId, confidence);
  if (itemId === 'bottle' || itemId === 'plastic-bottle') {
    return [
      primary,
      {
        classId: 0,
        className: 'paper_cardboard',
        modelClassName: 'paper_cardboard',
        displayName: 'Paper & Cardboard',
        itemId: 'paper-cardboard',
        category: 'Recyclable',
        confidence: 82,
        box: { x: 0.58, y: 0.38, width: 0.36, height: 0.54 },
      },
    ];
  }
  if (itemId === 'can' || itemId === 'metal') {
    return [
      primary,
      {
        classId: 3,
        className: 'flexible_plastic',
        modelClassName: 'flexible_plastic',
        displayName: 'Flexible Plastic Packaging',
        itemId: 'flexible-plastic',
        category: 'General waste',
        confidence: 71,
        box: { x: 0.06, y: 0.44, width: 0.44, height: 0.50 },
      },
    ];
  }
  if (itemId === 'flexible-plastic' || itemId === 'wrapper' || itemId === 'plastic-bag') {
    return [
      primary,
      {
        classId: 1,
        className: 'plastic_bottle',
        modelClassName: 'plastic_bottle',
        displayName: 'Plastic Bottle & Container',
        itemId: 'plastic-bottle',
        category: 'Recyclable',
        confidence: 68,
        box: { x: 0.55, y: 0.20, width: 0.38, height: 0.65 },
      },
    ];
  }
  if (itemId === 'sanitary-ppe' || itemId === 'tissue') {
    return [
      primary,
      {
        classId: 3,
        className: 'flexible_plastic',
        modelClassName: 'flexible_plastic',
        displayName: 'Flexible Plastic Packaging',
        itemId: 'flexible-plastic',
        category: 'General waste',
        confidence: 65,
        box: { x: 0.60, y: 0.30, width: 0.35, height: 0.50 },
      },
    ];
  }
  if (itemId === 'hazardous-medical' || itemId === 'medical-waste' || itemId === 'medicine') {
    return [
      primary,
      {
        classId: 0,
        className: 'paper_cardboard',
        modelClassName: 'paper_cardboard',
        displayName: 'Paper & Cardboard',
        itemId: 'paper-cardboard',
        category: 'Recyclable',
        confidence: 72,
        box: { x: 0.52, y: 0.15, width: 0.42, height: 0.60 },
      },
    ];
  }
  return [primary];
}

export function demoPrediction(itemId: string, confidence: number): RecognitionPrediction {
  const itemMappings: Record<
    string,
    { classId: number; className: string; displayName: string; category: Category }
  > = {
    // Generalized 8-class IDs
    'paper-cardboard': { classId: 0, className: 'paper_cardboard', displayName: 'Paper & Cardboard', category: 'Recyclable' },
    'plastic-bottle': { classId: 1, className: 'plastic_bottle', displayName: 'Plastic Bottle & Container', category: 'Recyclable' },
    metal: { classId: 2, className: 'metal', displayName: 'Metal Can & Packaging', category: 'Recyclable' },
    'flexible-plastic': { classId: 3, className: 'flexible_plastic', displayName: 'Flexible Plastic Packaging', category: 'General waste' },
    'sanitary-ppe': { classId: 4, className: 'sanitary_ppe_waste', displayName: 'Sanitary & PPE Waste', category: 'General waste' },
    'organic-waste': { classId: 5, className: 'organic', displayName: 'Organic Waste', category: 'Organic' },
    'battery-ewaste': { classId: 6, className: 'battery_ewaste', displayName: 'Battery & E-waste', category: 'E-waste' },
    'hazardous-medical': { classId: 7, className: 'hazardous_medical', displayName: 'Hazardous Medical Waste', category: 'Hazardous' },

    // Specific item IDs
    bottle: { classId: 1, className: 'plastic_bottle', displayName: 'Plastic Bottle', category: 'Recyclable' },
    banana: { classId: 5, className: 'organic', displayName: 'Banana Peel', category: 'Organic' },
    box: { classId: 0, className: 'paper_cardboard', displayName: 'Cardboard Box', category: 'Recyclable' },
    paper: { classId: 0, className: 'paper_cardboard', displayName: 'Newspaper & Print Paper', category: 'Recyclable' },
    battery: { classId: 6, className: 'battery_ewaste', displayName: 'Household Battery', category: 'E-waste' },
    can: { classId: 2, className: 'metal', displayName: 'Aluminium Can', category: 'Recyclable' },
    scraps: { classId: 5, className: 'organic', displayName: 'Vegetable Scraps', category: 'Organic' },
    tissue: { classId: 4, className: 'sanitary_ppe_waste', displayName: 'Used Tissue', category: 'General waste' },
    'plastic-bag': { classId: 3, className: 'flexible_plastic', displayName: 'Plastic Bag', category: 'General waste' },
    wrapper: { classId: 3, className: 'flexible_plastic', displayName: 'Snack Wrapper', category: 'General waste' },
    'bubble-wrap': { classId: 3, className: 'flexible_plastic', displayName: 'Bubble Wrap', category: 'General waste' },
    'mobile-phone': { classId: 6, className: 'battery_ewaste', displayName: 'Old Mobile Phone', category: 'E-waste' },
    charger: { classId: 6, className: 'battery_ewaste', displayName: 'Phone Charger', category: 'E-waste' },
    medicine: { classId: 7, className: 'hazardous_medical', displayName: 'Expired Medicine', category: 'Hazardous' },
    'medical-waste': { classId: 7, className: 'hazardous_medical', displayName: 'Medical Waste', category: 'Hazardous' },
    jar: { classId: 2, className: 'metal', displayName: 'Glass Jar', category: 'Recyclable' },
  };

  const sample = itemMappings[itemId] || {
    classId: 0,
    className: 'paper_cardboard',
    displayName: 'Paper & Cardboard',
    category: 'Recyclable',
  };

  return {
    ...sample,
    modelClassName: sample.className,
    itemId,
    confidence,
    box: { x: 0.18, y: 0.12, width: 0.64, height: 0.72 },
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
