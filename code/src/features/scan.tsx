import { Disclosure, Segments } from '@/components/sortify/controls';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, View } from 'react-native';
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

  const [selectedConfidence, setSelectedConfidence] = useState<ConfidenceTier>('medium');
  const [models, setModels] = useState<ModelOption[]>([
    {
      id: 'best.pt',
      name: 'YOLOv11s v3 Generalization (8 Classes - Production Default)',
      is_default: true,
    },
    {
      id: 'yolo11s_8cls_v3_generalization.pt',
      name: 'YOLOv11s (8 Classes - v3 Generalization Dataset)',
    },
    { id: 'yolo11s_8cls_v2_curated.pt', name: 'YOLOv11s (8 Classes - v2 Curated Dataset)' },
    {
      id: 'yolo11s_8cls_real_organic.pt',
      name: 'YOLOv11s (8 Classes - Real Organic Augmentation)',
    },
    {
      id: 'yolo11s_8cls_v1_streamlined_old_dataset.pt',
      name: 'YOLOv11s (8 Classes - Old 8-Class Streamlined Dataset)',
    },
    {
      id: 'yolo11s_10cls_legacy_old_dataset.pt',
      name: 'YOLOv11s (10 Classes - Old 10-Class Legacy Dataset)',
    },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('best.pt');

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

  const currentConfidenceObj =
    CONFIDENCE_LEVELS.find((c) => c.id === selectedConfidence) || CONFIDENCE_LEVELS[1];
  const currentModelObj = models.find((m) => m.id === selectedModel) || models[0];

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

  async function analyzePhoto(targetUri = uri) {
    if (!targetUri) return;
    setBusy(true);
    setError('');
    try {
      const predictions = await recognizeImage(
        targetUri,
        selectedModel,
        currentConfidenceObj.value,
      );
      openResult(predictions, 'model', targetUri);
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

  async function pick(camera: boolean) {
    if (busy) return;
    setError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(
            'Camera access is off. Enable it in your device settings, choose a photo from your library, or try a sample.',
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
      await analyzePhoto(asset.uri);
    } catch {
      setError(
        'The camera or photo picker could not open. Try choosing from your library or trying a sample.',
      );
    }
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
    }, 900);
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

  return (
    <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Heading
        title="Scan an item"
        subtitle="Take a photo or choose one from your library for instant sorting steps."
      />
      <Segments
        options={['Photo', 'Samples']}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError('');
        }}
      />

      <Card style={{ gap: 16, padding: 18 }}>
        {mode === 'Photo' && (
          <>
            <View
              style={{
                height: 256,
                borderRadius: 16,
                backgroundColor: uri ? '#0F1A13' : '#F2F6EC',
                borderWidth: uri ? 1 : 1.5,
                borderStyle: uri ? 'solid' : 'dashed',
                borderColor: uri ? '#1D3325' : '#C6D4B8',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {uri ? (
                <>
                  <Image
                    accessibilityLabel="Selected waste photo"
                    source={{ uri }}
                    style={{ height: '100%', width: '100%' }}
                    resizeMode="contain"
                  />
                  {busy && (
                    <View
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(15, 26, 19, 0.72)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        padding: 20,
                      }}
                    >
                      <ActivityIndicator color="#FFFFFF" size="large" />
                      <Txt size={15} weight="600" color="#FFFFFF">
                        Identifying item…
                      </Txt>
                      <Txt size={12} color="rgba(255, 255, 255, 0.75)" numberOfLines={1}>
                        {currentModelObj?.name.split('(')[0].trim() || 'Running detection'}
                      </Txt>
                    </View>
                  )}
                </>
              ) : (
                <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 24 }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 20,
                      backgroundColor: '#E1ECD3',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="scan" size={28} color={C.green} />
                  </View>
                  <Txt size={16} weight="600" color={C.ink} style={{ textAlign: 'center' }}>
                    Ready to scan
                  </Txt>
                  <Txt size={13} color={C.muted} style={{ textAlign: 'center', lineHeight: 19 }}>
                    Center one item in good lighting. Analysis starts automatically.
                  </Txt>
                </View>
              )}
            </View>

            {!uri ? (
              <View style={{ gap: 10 }}>
                <Button
                  title="Take photo"
                  icon="camera"
                  onPress={() => pick(true)}
                  disabled={busy}
                />
                <Button
                  title="Choose from library"
                  icon="image"
                  variant="secondary"
                  onPress={() => pick(false)}
                  disabled={busy}
                />
              </View>
            ) : (
              !busy && (
                <View style={{ gap: 10 }}>
                  <Button
                    title={error ? 'Try again' : 'Identify item'}
                    icon="scan"
                    onPress={() => analyzePhoto(uri)}
                  />
                  <Row style={{ gap: 10 }}>
                    <Button
                      title="Retake"
                      icon="camera"
                      variant="secondary"
                      onPress={() => pick(true)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Library"
                      icon="image"
                      variant="secondary"
                      onPress={() => pick(false)}
                      style={{ flex: 1 }}
                    />
                  </Row>
                </View>
              )
            )}
          </>
        )}

        {mode === 'Samples' && (
          <>
            <Txt size={13} color={C.muted}>
              Choose a sample item to preview the post-scan experience.
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
                    borderRadius: 12,
                    backgroundColor: sample === item.id ? '#EFF4E7' : 'transparent',
                    minHeight: 48,
                  }}
                >
                  <Row>
                    <ItemArt item={item} size={34} />
                    <Txt style={{ flex: 1 }} weight={sample === item.id ? '600' : '400'}>
                      {item.name}
                    </Txt>
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
              title="Identify sample"
              icon="scan"
              loading={busy}
              disabled={!samples.some((i) => i.id === sample)}
              onPress={analyzeSample}
            />
          </>
        )}

        {!!error && (
          <View
            accessibilityRole="alert"
            style={{ padding: 14, backgroundColor: '#FAEDE7', borderRadius: 12 }}
          >
            <Txt color="#914A32" size={13}>
              {error}
            </Txt>
          </View>
        )}
      </Card>

      <View style={{ marginTop: 14 }}>
        <Disclosure
          title={`Detection settings · ${currentConfidenceObj.label} (${currentConfidenceObj.thresholdPercent}%)`}
          icon="filter"
        >
          <View style={{ gap: 14 }}>
            <View style={{ gap: 8 }}>
              <Txt size={12} weight="600" color={C.ink}>
                Confidence threshold
              </Txt>
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                {CONFIDENCE_LEVELS.map((level) => {
                  const isSelected = level.id === selectedConfidence;
                  return (
                    <Pressable
                      key={level.id}
                      onPress={() => setSelectedConfidence(level.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isSelected ? C.green : C.line,
                        backgroundColor: isSelected ? '#EAF2E2' : C.white,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Txt
                        size={12}
                        weight={isSelected ? '600' : '500'}
                        color={isSelected ? C.green : C.ink}
                      >
                        {level.label} ({level.thresholdPercent}%)
                      </Txt>
                    </Pressable>
                  );
                })}
              </Row>
              <Txt size={11} color={C.muted}>
                {currentConfidenceObj.description}
              </Txt>
            </View>

            <View style={{ gap: 6 }}>
              <Txt size={12} weight="600" color={C.ink}>
                Detection model
              </Txt>
              <View
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.line,
                  backgroundColor: C.white,
                  overflow: 'hidden',
                }}
              >
                {models.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setSelectedModel(m.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        minHeight: 44,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: isSelected ? '#EFF4E7' : 'transparent',
                        borderBottomWidth: 1,
                        borderColor: '#F0F2EB',
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Txt
                        size={12}
                        weight={isSelected ? '600' : '400'}
                        color={isSelected ? C.green : C.ink}
                        style={{ flex: 1, lineHeight: 17 }}
                      >
                        {m.name}
                      </Txt>
                      {isSelected && <Badge text="Active" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Disclosure>

        <Disclosure title="Photo tips">
          <Txt size={13} color={C.muted}>
            Use even lighting and a plain background. Keep the whole item in frame. If the image is
            unclear, retake it or search the waste guide.
          </Txt>
        </Disclosure>

        {mode === 'Samples' && (
          <Disclosure
            title={`Test scenarios${uncertain || failed ? ' · active' : ''}`}
            icon="settings"
          >
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

      <Button
        title="Search the waste guide instead"
        icon="search"
        variant="ghost"
        onPress={() => router.push('/explore')}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
