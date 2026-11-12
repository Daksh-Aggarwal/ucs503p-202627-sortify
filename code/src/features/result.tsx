import { Disclosure } from '@/components/sortify/controls';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { uniqueId, useApp } from '@/state/app-state';
import { Category, locationGuidance } from '@/data/catalog';
import { NearbyDisposal } from '@/components/sortify/nearby-disposal';
import { DetectionPreview } from '@/components/sortify/detection-preview';
import { BoundingBox, parseBox } from '@/services/recognition';
import {
  Badge,
  Button,
  C,
  Card,
  CategoryBadge,
  Empty,
  Field,
  Icon,
  ItemArt,
  Row,
  Txt,
} from '@/components/sortify/ui';

type DetectedItemPayload = {
  id: string;
  confidence: number;
  className: string;
  modelClassName: string;
  displayName: string;
  category: Category;
  box: BoundingBox;
};

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    id: string;
    confidence?: string;
    source?: string;
    scanId?: string;
    imageUri?: string;
    bbox?: string;
    detectorClass?: string;
    modelClass?: string;
    displayName?: string;
    modelUsed?: string;
    confidenceTier?: string;
    confidenceThreshold?: string;
    itemsJson?: string;
  }>();
  const { state, update, notify, saveScan } = useApp();
  const [savedByItem, setSavedByItem] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (params.scanId) {
      initial[0] = params.scanId;
    }
    return initial;
  });
  const [confirmedByItem, setConfirmedByItem] = useState<Record<number, boolean>>({});
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelectIndex = (index: number) => {
    setActiveIndex(index);
    setCorrecting(false);
    setCorrection('');
  };

  // Parse all detected items from scan
  const detectedItems: DetectedItemPayload[] = useMemo(() => {
    try {
      if (params.itemsJson) {
        const parsed = JSON.parse(params.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const defaultBox = parseBox(params.bbox) || { x: 0.15, y: 0.15, width: 0.7, height: 0.7 };
    return [
      {
        id: params.id,
        confidence: Number(params.confidence || 0),
        className: params.detectorClass || '',
        modelClassName: params.modelClass || '',
        displayName: params.displayName || '',
        category: (params.detectorClass as Category) || 'General waste',
        box: defaultBox,
      },
    ];
  }, [params.itemsJson, params.id, params.confidence, params.detectorClass, params.modelClass, params.displayName, params.bbox]);

  // Current active detected item being inspected
  const activeDetected = detectedItems[activeIndex] || detectedItems[0];
  const item = state.items.find((i) => i.id === activeDetected?.id) || state.items.find((i) => i.id === params.id);
  const currentSavedId = savedByItem[activeIndex] || '';
  const saved = state.scans.find((s) => s.id === currentSavedId);
  const confidence = activeDetected ? activeDetected.confidence : saved?.confidence ?? Number(params.confidence || 0);
  const isConfirmed = !!confirmedByItem[activeIndex];
  const low = confidence > 0 && confidence < 70 && !isConfirmed && !saved;
  const source =
    saved?.source ||
    (params.source === 'demo' ? 'demo' : params.source === 'model' ? 'model' : 'manual');

  // Confidence assessment & styling
  const confidenceScore = Math.max(0, Math.min(100, Math.round(confidence)));
  const confidenceTierLabel =
    confidenceScore >= 75
      ? 'High Confidence'
      : confidenceScore >= 50
        ? 'Moderate Confidence'
        : 'Low Confidence';
  const confidenceColor =
    confidenceScore >= 75 ? '#2E7D32' : confidenceScore >= 50 ? '#D97706' : '#DC2626';
  const confidenceBg =
    confidenceScore >= 75 ? '#EFF8EE' : confidenceScore >= 50 ? '#FFFBEB' : '#FEF2F2';
  const confidenceBorder =
    confidenceScore >= 75 ? '#C8E6C9' : confidenceScore >= 50 ? '#FDE68A' : '#FECACA';
  const confidenceDescription =
    confidenceScore >= 75
      ? 'The model is highly confident in this categorization.'
      : confidenceScore >= 50
        ? 'The model detected this item with moderate confidence. Reviewing the item is recommended.'
        : 'The model has low confidence for this image. Please confirm before sorting.';

  // Labels
  const rawModelClass = activeDetected?.modelClassName || activeDetected?.className || params.modelClass || params.detectorClass || '';
  const detectorLabel =
    activeDetected?.displayName ||
    params.displayName ||
    rawModelClass.replaceAll('_', ' ') ||
    item?.name ||
    'detected item';

  if (!item)
    return (
      <Empty
        title="This item isn’t in the guide."
        text="Search the current catalog to find another item."
        action={<Button title="Open waste guide" onPress={() => router.replace('/explore')} />}
      />
    );

  function save(sorted = false) {
    if (saved) {
      if (sorted)
        update((s) => ({
          ...s,
          scans: s.scans.map((scan) => (scan.id === saved.id ? { ...scan, sorted: true } : scan)),
        }));
    } else {
      const newScanId = saveScan(item!.id, confidence, source, sorted);
      setSavedByItem((prev) => ({ ...prev, [activeIndex]: newScanId }));
    }
    notify(
      sorted ? 'Marked as sorted. A small action worth celebrating.' : 'Saved to your history.',
    );
  }

  function feedback() {
    if (!correction.trim()) return;
    update((s) => ({
      ...s,
      feedback: [
        {
          id: uniqueId(),
          itemId: item!.id,
          correction: correction.trim(),
          status: 'Pending',
          date: new Date().toISOString(),
        },
        ...s.feedback,
      ],
    }));
    setCorrecting(false);
    setCorrection('');
    notify('Correction saved. You can review it in the admin demo.');
  }

  return (
    <View style={{ maxWidth: 850, width: '100%', alignSelf: 'center' }}>
      <Button
        title="Waste guide"
        icon="back"
        variant="ghost"
        onPress={() => router.push('/explore')}
        style={{ alignSelf: 'flex-start', paddingLeft: 0, marginBottom: 8 }}
      />

      {/* Item Inspection & Capture Banner */}
      <Card
        style={{
          marginBottom: 16,
          padding: 14,
          gap: 12,
          backgroundColor: '#F6F8F3',
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: C.green,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="scan" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Txt size={14} weight="700" color={C.ink}>
                {detectedItems.length > 1
                  ? `Item ${activeIndex + 1} of ${detectedItems.length}: ${detectorLabel}`
                  : `Detected item: ${detectorLabel}`}
              </Txt>
              <Txt size={11} color={C.muted}>
                {detectedItems.length > 1
                  ? `${detectedItems.length} items detected • Step through one by one`
                  : 'Scan complete • Ready to sort or capture a new image'}
              </Txt>
            </View>
          </Row>

          <Row style={{ gap: 6, alignItems: 'center' }}>
            {detectedItems.length > 1 && (
              <Button
                title="Prev"
                variant="secondary"
                disabled={activeIndex === 0}
                onPress={() => handleSelectIndex(Math.max(0, activeIndex - 1))}
              />
            )}
            {detectedItems.length > 1 && activeIndex < detectedItems.length - 1 ? (
              <Button
                title="Next"
                variant="primary"
                onPress={() => handleSelectIndex(activeIndex + 1)}
              />
            ) : (
              <Button
                title="Capture new image"
                icon="camera"
                variant="primary"
                onPress={() => router.push('/scan')}
              />
            )}
          </Row>
        </Row>

        {/* Selectable item pills row */}
        {detectedItems.length > 1 && (
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {detectedItems.map((det, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectIndex(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspect item ${idx + 1}: ${det.displayName}`}
                  style={({ pressed, hovered }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: isSelected ? C.green : C.line,
                    backgroundColor: isSelected ? '#E2ECE0' : hovered ? '#F0F3EC' : '#FFFFFF',
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: isSelected ? C.green : '#D5DDD1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt size={10} weight="700" color={isSelected ? '#FFFFFF' : C.ink}>
                      {idx + 1}
                    </Txt>
                  </View>
                  <Txt size={12} weight={isSelected ? '700' : '500'} color={isSelected ? C.green : C.ink}>
                    {det.displayName}
                  </Txt>
                  <Badge
                    text={`${det.confidence}%`}
                    background={isSelected ? '#CBE3C9' : '#EAECE4'}
                    color={isSelected ? C.ink : C.muted}
                  />
                </Pressable>
              );
            })}
          </Row>
        )}
      </Card>

      <Row style={{ marginBottom: 20, alignItems: 'flex-start' }}>
        <ItemArt item={item} size={64} />
        <View style={{ flex: 1, gap: 5 }}>
          <Txt accessibilityRole="header" size={26} weight="500" style={{ lineHeight: 32 }}>
            {item.name}
          </Txt>
          <Txt size={13} color={C.muted}>
            {item.material}
          </Txt>
          <Row style={{ flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <CategoryBadge category={item.category} />
            {confidence > 0 && (
              <Badge
                text={`${confidenceScore}% • ${confidenceTierLabel}`}
                background={confidenceBg}
                color={confidenceColor}
              />
            )}
            {!!rawModelClass && (
              <Badge
                text={`Model Class: ${rawModelClass.replaceAll('_', ' ')}`}
                background="#EFF4E7"
                color={C.green}
              />
            )}
          </Row>
        </View>
      </Row>

      {/* Model Confidence Card */}
      {confidence > 0 && (
        <Card
          style={{
            marginBottom: 16,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: confidenceBorder,
            backgroundColor: confidenceBg,
          }}
        >
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Icon name="target" size={18} color={confidenceColor} />
              <Txt size={14} weight="600" color={confidenceColor}>
                {confidenceTierLabel} ({confidenceScore}%)
              </Txt>
            </Row>
            {!!params.confidenceThreshold && (
              <Badge
                text={`Filter: ${params.confidenceTier ? params.confidenceTier.toUpperCase() : ''} (≥${params.confidenceThreshold}%)`}
                background="#FFFFFF"
                color={C.muted}
              />
            )}
          </Row>

          {/* Visual progress meter bar */}
          <View
            style={{
              height: 8,
              width: '100%',
              backgroundColor: '#E2E6DC',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${confidenceScore}%`,
                backgroundColor: confidenceColor,
                borderRadius: 4,
              }}
            />
          </View>

          <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Txt size={12} color={C.muted} style={{ flex: 1 }}>
              {confidenceDescription}
            </Txt>
            {!!params.modelUsed && (
              <Txt size={11} color={C.muted}>
                Engine: {params.modelUsed}
              </Txt>
            )}
          </Row>
        </Card>
      )}

      {/* Detection bounding box preview with active box focus */}
      {!!params.imageUri && (
        <Card style={{ gap: 10, marginBottom: 16, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Row style={{ gap: 6, alignItems: 'center' }}>
              <Txt size={13} weight="600">
                {detectedItems.length > 1
                  ? `Detection Frame (${detectedItems.length} items found)`
                  : 'Detected item & Bounding Box'}
              </Txt>
              {detectedItems.length > 1 && (
                <Badge
                  text={`Inspecting #${activeIndex + 1}: ${detectorLabel}`}
                  background="#E2ECE0"
                  color="#1B4332"
                />
              )}
            </Row>
            {!!params.modelUsed && (
              <Txt size={11} color={C.muted}>
                Engine: {params.modelUsed}
              </Txt>
            )}
          </Row>
          <DetectionPreview
            uri={params.imageUri}
            boxes={detectedItems.map((d) => ({
              box: d.box,
              label: d.displayName,
              confidence: d.confidence,
            }))}
            activeIndex={activeIndex}
            onSelectIndex={handleSelectIndex}
            onCaptureNewImage={() => router.push('/scan')}
          />
          <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <Txt size={12} color={C.muted}>
              Active item: <Txt size={12} weight="600" color={C.ink}>{detectorLabel}</Txt> → mapped to <Txt size={12} weight="600" color={C.green}>{item.category}</Txt>
            </Txt>
            {detectedItems.length > 1 && (
              <Txt size={11} color={C.muted}>
                Showing focused box for active item. Use Prev / Next controls to step through items.
              </Txt>
            )}
          </Row>
        </Card>
      )}

      {low && (
        <Card style={{ gap: 12, marginBottom: 16, backgroundColor: '#FAF2E4' }}>
          <Txt weight="600">Confirm this item</Txt>
          <Txt size={13} color={C.muted}>
            The prediction is uncertain. Check the match before saving.
          </Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              title="Yes, this is my item"
              onPress={() => setConfirmedByItem((prev) => ({ ...prev, [activeIndex]: true }))}
            />
            <Button
              title="Choose another"
              variant="secondary"
              onPress={() => router.push('/explore')}
            />
            <Button title="Retake photo" variant="ghost" onPress={() => router.push('/scan')} />
          </Row>
        </Card>
      )}

      <Card style={{ padding: 20, gap: 18 }}>
        <Txt size={17} weight="600">
          Disposal steps
        </Txt>
        {item.steps.map((step, index) => (
          <Row key={index} style={{ alignItems: 'flex-start' }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: '#EEF3E5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={12} weight="600">
                {index + 1}
              </Txt>
            </View>
            <Txt style={{ flex: 1 }}>{step}</Txt>
          </Row>
        ))}
        {!!item.caution && (
          <Row
            style={{
              backgroundColor: '#FAF2E4',
              padding: 14,
              borderRadius: 10,
              alignItems: 'flex-start',
            }}
          >
            <Icon name="warning" size={18} color="#8B652B" />
            <Txt style={{ flex: 1 }} color="#805D28" size={13}>
              {item.caution}
            </Txt>
          </Row>
        )}
        {!low && (
          <View style={{ gap: 10, paddingTop: 4 }}>
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              <Button
                title={saved?.sorted ? 'Marked as sorted' : 'I sorted this item'}
                disabled={saved?.sorted}
                icon="check"
                onPress={() => save(true)}
                style={{ flexGrow: 1 }}
              />
              <Button
                title={saved ? 'Saved to history' : 'Save for later'}
                disabled={!!saved}
                icon="bookmark"
                variant="secondary"
                onPress={() => save(false)}
                style={{ flexGrow: 1 }}
              />
            </Row>
            {detectedItems.length > 1 ? (
              <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
                <Txt size={12} color={C.muted}>
                  Item {activeIndex + 1} of {detectedItems.length}
                </Txt>
                {activeIndex < detectedItems.length - 1 ? (
                  <Button
                    title={`Next: ${detectedItems[activeIndex + 1].displayName} →`}
                    variant="ghost"
                    onPress={() => handleSelectIndex(activeIndex + 1)}
                  />
                ) : (
                  <Button
                    title="Capture new image →"
                    icon="camera"
                    variant="ghost"
                    onPress={() => router.push('/scan')}
                  />
                )}
              </Row>
            ) : (
              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
                <Button
                  title="Capture new image →"
                  icon="camera"
                  variant="ghost"
                  onPress={() => router.push('/scan')}
                />
              </Row>
            )}
          </View>
        )}
      </Card>
      <NearbyDisposal key={item.id} item={item} />
      <View style={{ marginTop: 16 }}>
        <Disclosure
          title={
            state.location && state.location !== 'Location detected'
              ? `Local guidance · ${state.location}`
              : 'Local guidance'
          }
          icon="pin"
        >
          <Txt size={13} color={C.muted}>
            {locationGuidance(state.location, item.category)}
          </Txt>
        </Disclosure>
      </View>
      <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Button
          title="Ask about this item"
          icon="chat"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/assistant',
              params: {
                item: item.id,
                itemName: activeDetected?.displayName || item.name,
                fromScan: String(Date.now()),
              },
            })
          }
        />
        <Button
          title="Correct result"
          icon="edit"
          variant="ghost"
          onPress={() => setCorrecting(!correcting)}
        />
      </Row>
      {correcting && (
        <Card style={{ gap: 14 }}>
          <Field
            label="What should this item be?"
            value={correction}
            onChangeText={setCorrection}
            placeholder="Describe the correct item"
            multiline
            maxLength={500}
          />
          <Row style={{ flexWrap: 'wrap' }}>
            <Button title="Send correction" disabled={!correction.trim()} onPress={feedback} />
            <Button title="Cancel" variant="ghost" onPress={() => setCorrecting(false)} />
          </Row>
        </Card>
      )}
    </View>
  );
}
