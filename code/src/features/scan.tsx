import { Disclosure, Segments } from '@/components/sortify/controls';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { Badge, Button, C, Card, Heading, Icon, ItemArt, Row, Txt } from '@/components/sortify/ui';
import {
  CONFIDENCE_LEVELS,
  ConfidenceTier,
  demoPredictions,
  fetchAvailableModels,
  ModelOption,
  RecognitionPrediction,
  recognizeImage,
  serializeBox,
} from '@/services/recognition';

export default function ScanScreen() {
  const { state } = useApp();
  const [mode, setMode] = useState('Photo');
  const [uri, setUri] = useState('');
  const [sample, setSample] = useState('bottle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [failed, setFailed] = useState(false);

  // Confidence threshold
  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceTier>('medium');
  const [showConfidencePicker, setShowConfidencePicker] = useState<boolean>(false);

  // Model switching
  const [models, setModels] = useState<ModelOption[]>([
    { id: 'best.pt', name: 'YOLOv11s v3 Generalization (8 Classes - Production Default)', is_default: true },
    { id: 'yolo11s_8cls_v3_generalization.pt', name: 'YOLOv11s (8 Classes - v3 Generalization Dataset)' },
    { id: 'yolo11s_8cls_v2_curated.pt', name: 'YOLOv11s (8 Classes - v2 Curated Dataset)' },
    { id: 'yolo11s_8cls_real_organic.pt', name: 'YOLOv11s (8 Classes - Real Organic Augmentation)' },
    { id: 'yolo11s_8cls_v1_streamlined_old_dataset.pt', name: 'YOLOv11s (8 Classes - Old 8-Class Streamlined Dataset)' },
    { id: 'yolo11s_10cls_legacy_old_dataset.pt', name: 'YOLOv11s (10 Classes - Old 10-Class Legacy Dataset)' },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('best.pt');
  const [showModelPicker, setShowModelPicker] = useState<boolean>(false);

  useEffect(() => {
    fetchAvailableModels()
      .then((available) => {
        if (available && available.length > 0) {
          setModels(available);
          const defaultModel = available.find((m) => m.is_default)?.id || available[0].id;
          setSelectedModel(defaultModel);
        }
      })
      .catch(() => {
        // use initial fallback
      });
  }, []);

  async function pick(camera: boolean) {
    setError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(
            'Camera access is off. Enable it in your device settings, upload a photo, or try a sample below.',
          );
          return;
        }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 10 * 1024 * 1024) {
        setError('This photo is too large. Please choose an image smaller than 10 MB.');
        return;
      }
      if (!asset.width || !asset.height || Math.min(asset.width, asset.height) < 100) {
        setError(
          'This image is too small or unreadable. Try a clear photo at least 100 × 100 pixels.',
        );
        return;
      }
      setUri(asset.uri);
    } catch {
      setError(
        'The camera or photo picker could not open. Try uploading a photo or choosing a sample below.',
      );
    }
  }

  function openResult(
    predictions: RecognitionPrediction[],
    source: 'demo' | 'model',
    imageUri?: string,
  ) {
    const primary = predictions[0];
    if (!primary) return;

    const itemsData = predictions.map((p) => ({
      id: p.itemId,
      confidence: p.confidence,
      className: p.className,
      modelClassName: p.modelClassName,
      displayName: p.displayName,
      category: p.category,
      box: p.box,
    }));

    router.push({
      pathname: '/result',
      params: {
        id: primary.itemId,
        confidence: String(primary.confidence),
        source,
        detectorClass: primary.className,
        modelClass: primary.modelClassName,
        displayName: primary.displayName,
        modelUsed: selectedModel,
        confidenceTier: selectedConfidence,
        confidenceThreshold: String(currentConfidenceObj.thresholdPercent),
        bbox: serializeBox(primary.box),
        itemsJson: JSON.stringify(itemsData),
        ...(imageUri ? { imageUri } : {}),
      },
    });
  }

  function analyzeSample() {
    setBusy(true);
    setError('');
    setTimeout(() => {
      setBusy(false);
      if (failed) {
        setError(
          'The item identification service is currently unavailable. Please try again or find your item in the waste guide.',
        );
        return;
      }
      openResult(demoPredictions(sample, uncertain ? 46 : 98), 'demo');
    }, 1600);
  }

  async function analyzePhoto() {
    if (!uri) return;
    setBusy(true);
    setError('');
    try {
      const predictions = await recognizeImage(uri, selectedModel, currentConfidenceObj.value);
      openResult(predictions, 'model', uri);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The image could not be analyzed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  const samples = state.items.filter((i) =>
    [
      'bottle',
      'banana',
      'box',
      'battery',
      'can',
      'flexible-plastic',
      'tissue',
      'medical-waste',
    ].includes(i.id),
  );

  const currentConfidenceObj =
    CONFIDENCE_LEVELS.find((c) => c.id === selectedConfidence) || CONFIDENCE_LEVELS[1];
  const currentModelObj = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Heading title="Scan an item" />
      <Segments
        options={['Photo', 'Samples']}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError('');
        }}
      />

      <Card style={{ gap: 16, padding: 20 }}>
        {/* Detection Controls: Confidence Threshold (left) and Model Switcher (right) */}
        <View style={{ borderBottomWidth: 1, borderColor: C.line, paddingBottom: 14, gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              width: '100%',
            }}
          >
            {/* Confidence Threshold Dropdown (to the left of models) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Icon name="filter" size={14} color={C.green} />
              <Txt size={12} weight="600" color={C.ink}>
                Confidence:
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set Confidence Threshold"
                onPress={() => {
                  setShowConfidencePicker(!showConfidencePicker);
                  setShowModelPicker(false);
                }}
                style={({ pressed, hovered }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.line,
                  backgroundColor: hovered ? '#EFF3E8' : '#FAFBF7',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Txt size={12} weight="600" color={C.green}>
                  {currentConfidenceObj.label} ({currentConfidenceObj.thresholdPercent}%)
                </Txt>
                <Icon name={showConfidencePicker ? 'down' : 'chevron'} size={14} color={C.muted} />
              </Pressable>
            </View>

            {/* Model Switcher Dropdown (to the right of confidence) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                minWidth: 180,
                maxWidth: '100%',
              }}
            >
              <Icon name="sparkle" size={14} color={C.green} />
              <Txt size={12} weight="600" color={C.ink}>
                Model:
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch Model"
                onPress={() => {
                  setShowModelPicker(!showModelPicker);
                  setShowConfidencePicker(false);
                }}
                style={({ pressed, hovered }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.line,
                  backgroundColor: hovered ? '#EFF3E8' : '#FAFBF7',
                  opacity: pressed ? 0.75 : 1,
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '100%',
                })}
              >
                <Txt
                  size={12}
                  weight="600"
                  color={C.green}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {currentModelObj?.name || selectedModel}
                </Txt>
                <Icon name={showModelPicker ? 'down' : 'chevron'} size={14} color={C.muted} />
              </Pressable>
            </View>
          </View>

          {/* Confidence Threshold Picker Popover */}
          {showConfidencePicker && (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.line,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
                width: '100%',
                marginTop: 4,
              }}
            >
              {CONFIDENCE_LEVELS.map((level) => {
                const isSelected = level.id === selectedConfidence;
                return (
                  <Pressable
                    key={level.id}
                    onPress={() => {
                      setSelectedConfidence(level.id);
                      setShowConfidencePicker(false);
                    }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: isSelected ? '#EFF4E7' : hovered ? '#F8F9F4' : 'transparent',
                      borderBottomWidth: 1,
                      borderColor: '#F0F2EB',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={{ flex: 1, flexShrink: 1, gap: 2, marginRight: 8 }}>
                      <Row style={{ gap: 6, alignItems: 'center' }}>
                        <Txt size={12} weight={isSelected ? '600' : '500'} color={isSelected ? C.green : C.ink}>
                          {level.label} ({level.thresholdPercent}% Threshold)
                        </Txt>
                      </Row>
                      <Txt size={11} color={C.muted} style={{ lineHeight: 16 }}>
                        {level.description}
                      </Txt>
                    </View>
                    {isSelected && (
                      <View style={{ flexShrink: 0 }}>
                        <Badge text="Selected" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Model Switcher Picker Popover */}
          {showModelPicker && (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.line,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
                width: '100%',
                marginTop: 4,
              }}
            >
              {models.map((m) => {
                const isSelected = m.id === selectedModel;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setSelectedModel(m.id);
                      setShowModelPicker(false);
                    }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: isSelected ? '#EFF4E7' : hovered ? '#F8F9F4' : 'transparent',
                      borderBottomWidth: 1,
                      borderColor: '#F0F2EB',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={{ flex: 1, flexShrink: 1, marginRight: 8 }}>
                      <Txt
                        size={12}
                        weight={isSelected ? '600' : '400'}
                        color={isSelected ? C.green : C.ink}
                        style={{ lineHeight: 17 }}
                      >
                        {m.name}
                      </Txt>
                    </View>
                    {isSelected && (
                      <View style={{ flexShrink: 0 }}>
                        <Badge text="Active" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {mode === 'Photo' && (
          <>
            <View
              style={{
                height: 180,
                borderRadius: 12,
                backgroundColor: '#F1F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 16,
              }}
            >
              {uri ? (
                <Image
                  accessibilityLabel="Selected waste photo"
                  source={{ uri }}
                  style={{ height: 150, width: '100%', borderRadius: 10 }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Icon name="scan" size={42} />
                  <Txt size={13} color={C.muted}>
                    One item, clearly in focus.
                  </Txt>
                  <Txt size={12} color={C.muted}>
                    Images up to 10 MB
                  </Txt>
                </>
              )}
            </View>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button
                title="Take photo"
                icon="camera"
                onPress={() => pick(true)}
                style={{ flexGrow: 1 }}
              />
              <Button
                title={uri ? 'Replace photo' : 'Upload photo'}
                icon="upload"
                variant="secondary"
                onPress={() => pick(false)}
                style={{ flexGrow: 1 }}
              />
            </Row>
            {!!uri && <Button title="Remove photo" variant="ghost" onPress={() => setUri('')} />}
          </>
        )}
        {mode === 'Samples' && (
          <>
            <Txt size={13} color={C.muted}>
              Choose an item to try the scan flow.
            </Txt>
            <View style={{ gap: 4 }}>
              {samples.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sample === item.id }}
                  aria-checked={sample === item.id}
                  onPress={() => setSample(item.id)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: sample === item.id ? '#EFF4E7' : 'transparent',
                    minHeight: 48,
                  }}
                >
                  <Row>
                    <ItemArt item={item} size={32} />
                    <Txt style={{ flex: 1 }}>{item.name}</Txt>
                    <Icon
                      name={sample === item.id ? 'success' : 'plus'}
                      size={18}
                      color={sample === item.id ? C.green : C.muted}
                    />
                  </Row>
                </Pressable>
              ))}
            </View>
            <Button
              title="Identify sample item"
              icon="scan"
              loading={busy}
              disabled={!samples.some((i) => i.id === sample)}
              onPress={analyzeSample}
            />
            <Txt size={12} color={C.muted}>
              Sample detection mode. The selected item simulates live recognition; photos stay on this
              device.
            </Txt>
          </>
        )}
        {mode === 'Photo' && !!uri && (
          <>
            <Button title="Identify item" icon="scan" loading={busy} onPress={analyzePhoto} />
            <Txt size={12} color={C.muted}>
              Your photo is analyzed with {currentModelObj?.name || 'the selected model'}.
            </Txt>
          </>
        )}
        {!!error && (
          <View
            accessibilityRole="alert"
            style={{ padding: 14, backgroundColor: '#FAEDE7', borderRadius: 9 }}
          >
            <Txt color="#914A32" size={13}>
              {error}
            </Txt>
          </View>
        )}
      </Card>
      <Button
        title="Search the waste guide"
        icon="search"
        variant="ghost"
        onPress={() => router.push('/explore')}
        style={{ marginVertical: 12 }}
      />
      <Disclosure title="Photo tips">
        <Txt size={13} color={C.muted}>
          Use even lighting and a plain background. Keep the whole item in frame. If the image is
          unclear, retake it or search the guide.
        </Txt>
      </Disclosure>
      {mode === 'Samples' && (
        <Disclosure title={`Test scenarios${uncertain || failed ? ' · active' : ''}`} icon="settings">
          {[
            {
              label: 'Low-confidence result',
              value: uncertain,
              toggle: () => setUncertain(!uncertain),
            },
            { label: 'Service unavailable', value: failed, toggle: () => setFailed(!failed) },
          ].map((o) => (
            <Pressable
              key={o.label}
              accessibilityRole="switch"
              accessibilityState={{ checked: o.value }}
              aria-checked={o.value}
              onPress={o.toggle}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={13}>{o.label}</Txt>
                <View
                  style={{
                    width: 38,
                    height: 24,
                    borderRadius: 20,
                    padding: 3,
                    backgroundColor: o.value ? C.green : '#CED6C4',
                    alignItems: o.value ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View
                    style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white' }}
                  />
                </View>
              </Row>
            </Pressable>
          ))}
        </Disclosure>
      )}
    </View>
  );
}
