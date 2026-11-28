import { Disclosure } from '@/components/sortify/controls';
import { useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { uniqueId, useApp } from '@/state/app-state';
import { Category, locationGuidance } from '@/data/catalog';
import { NearbyDisposal } from '@/components/sortify/nearby-disposal';
import { DetectionPreview } from '@/components/sortify/detection-preview';
import {
  BoundingBox,
  CONFIDENCE_LEVELS,
  ConfidenceTier,
  demoPredictions,
  parseBox,
  recognizeImage,
} from '@/services/recognition';
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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 360;
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

  const [selectedTier, setSelectedTier] = useState<ConfidenceTier>(() => {
    if (
      params.confidenceTier === 'low' ||
      params.confidenceTier === 'medium' ||
      params.confidenceTier === 'high'
    ) {
      return params.confidenceTier as ConfidenceTier;
    }
    const thresh = Number(params.confidenceThreshold || 50);
    if (thresh <= 40) return 'low';
    if (thresh >= 65) return 'high';
    return 'medium';
  });
  const [reEvaluating, setReEvaluating] = useState(false);
  const [customDetections, setCustomDetections] = useState<DetectedItemPayload[] | null>(null);
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null);

  const handleSelectIndex = (index: number) => {
    setActiveIndex(index);
    setSelectedSubItemId(null);
    setCorrecting(false);
    setCorrection('');
  };

  const initialDetectedItems: DetectedItemPayload[] = useMemo(() => {
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
  }, [
    params.itemsJson,
    params.id,
    params.confidence,
    params.detectorClass,
    params.modelClass,
    params.displayName,
    params.bbox,
  ]);

  const detectedItems = customDetections !== null ? customDetections : initialDetectedItems;
  const activeDetected = detectedItems[activeIndex] || detectedItems[0];
  const item =
    state.items.find((i) => i.id === activeDetected?.id) ||
    state.items.find((i) => i.id === params.id);
  const currentSavedId = savedByItem[activeIndex] || '';
  const saved = state.scans.find((s) => s.id === currentSavedId);
  const confidence = activeDetected
    ? activeDetected.confidence
    : (saved?.confidence ?? Number(params.confidence || 0));
  const isConfirmed = !!confirmedByItem[activeIndex];
  const low = confidence > 0 && confidence < 70 && !isConfirmed && !saved;
  const source =
    saved?.source ||
    (params.source === 'demo' ? 'demo' : params.source === 'model' ? 'model' : 'manual');

  const confidenceScore = Math.max(0, Math.min(100, Math.round(confidence)));
  const confidenceColor =
    confidenceScore >= 75 ? '#2E7D32' : confidenceScore >= 50 ? '#B45309' : '#DC2626';
  const confidenceBg =
    confidenceScore >= 75 ? '#EAF5EA' : confidenceScore >= 50 ? '#FEF3C7' : '#FEE2E2';

  const rawModelClass =
    activeDetected?.modelClassName ||
    activeDetected?.className ||
    params.modelClass ||
    params.detectorClass ||
    '';

  if (!item) {
    return (
      <Empty
        title="This item isn’t in the guide."
        text="Search the current catalog to find another item."
        action={<Button title="Open waste guide" onPress={() => router.replace('/explore')} />}
      />
    );
  }

  const activeItem =
    (selectedSubItemId ? state.items.find((i) => i.id === selectedSubItemId) : null) || item;

  const parentClassItem =
    !item.subItemIds && !selectedSubItemId
      ? state.items.find((i) => i.subItemIds && i.subItemIds.includes(item.id))
      : null;

  function save(sorted = false) {
    if (saved) {
      if (sorted) {
        update((s) => ({
          ...s,
          scans: s.scans.map((scan) => (scan.id === saved.id ? { ...scan, sorted: true } : scan)),
        }));
      }
    } else {
      const targetId = activeItem?.id || item!.id;
      const newScanId = saveScan(targetId, confidence, source, sorted);
      setSavedByItem((prev) => ({ ...prev, [activeIndex]: newScanId }));
    }
    notify(
      sorted ? 'Marked as sorted. A small action worth celebrating.' : 'Saved to your history.',
    );
  }

  function feedback() {
    if (!correction.trim()) return;
    const targetId = activeItem?.id || item!.id;
    update((s) => ({
      ...s,
      feedback: [
        {
          id: uniqueId(),
          itemId: targetId,
          correction: correction.trim(),
          status: 'Pending',
          date: new Date().toISOString(),
        },
        ...s.feedback,
      ],
    }));
    setCorrecting(false);
    setCorrection('');
    notify('Correction saved. You can review it in the admin panel.');
  }

  async function handleConfidenceChange(tier: ConfidenceTier) {
    if (reEvaluating || tier === selectedTier) return;
    setSelectedTier(tier);
    const targetLevel = CONFIDENCE_LEVELS.find((l) => l.id === tier) || CONFIDENCE_LEVELS[1];

    if (params.imageUri && source === 'model') {
      setReEvaluating(true);
      try {
        const preds = await recognizeImage(
          params.imageUri,
          params.modelUsed || 'best.pt',
          targetLevel.value,
        );
        if (preds && preds.length > 0) {
          const newItems: DetectedItemPayload[] = preds.map((p) => ({
            id: p.itemId,
            confidence: p.confidence,
            className: p.className,
            modelClassName: p.modelClassName,
            displayName: p.displayName,
            category: p.category,
            box: p.box,
          }));
          setCustomDetections(newItems);
          setActiveIndex(0);
          notify(
            `Re-evaluated at ${targetLevel.thresholdPercent}%: ${newItems.length} item(s) found`,
          );
        } else {
          const filtered = initialDetectedItems.filter(
            (d) => d.confidence >= targetLevel.thresholdPercent,
          );
          if (filtered.length > 0) {
            setCustomDetections(filtered);
            setActiveIndex(0);
            notify(
              `Filtered at ${targetLevel.thresholdPercent}%: ${filtered.length} item(s)`,
            );
          } else {
            const topMatch = initialDetectedItems[0];
            setCustomDetections(topMatch ? [topMatch] : null);
            setActiveIndex(0);
            notify(`No items passed ${targetLevel.thresholdPercent}%. Showing top match.`);
          }
        }
      } catch {
        const filtered = initialDetectedItems.filter(
          (d) => d.confidence >= targetLevel.thresholdPercent,
        );
        if (filtered.length > 0) {
          setCustomDetections(filtered);
          setActiveIndex(0);
          notify(`Filtered at ≥${targetLevel.thresholdPercent}%: ${filtered.length} item(s)`);
        } else {
          const topMatch = initialDetectedItems[0];
          setCustomDetections(topMatch ? [topMatch] : null);
          setActiveIndex(0);
          notify(`No items passed ${targetLevel.thresholdPercent}%. Showing top match.`);
        }
      } finally {
        setReEvaluating(false);
      }
    } else {
      setReEvaluating(true);
      setTimeout(() => {
        if (initialDetectedItems.length > 1) {
          const filtered = initialDetectedItems.filter(
            (d) => d.confidence >= targetLevel.thresholdPercent,
          );
          if (filtered.length > 0) {
            setCustomDetections(filtered);
            setActiveIndex(0);
            notify(`Filtered at ${targetLevel.thresholdPercent}%: ${filtered.length} item(s)`);
          } else {
            const topMatch = initialDetectedItems[0];
            setCustomDetections(topMatch ? [topMatch] : null);
            setActiveIndex(0);
            notify(`No items passed ${targetLevel.thresholdPercent}%. Showing top match.`);
          }
        } else {
          const simConf = tier === 'low' ? 46 : tier === 'medium' ? 78 : 98;
          const preds = demoPredictions(params.id || 'bottle', simConf);
          const newItems: DetectedItemPayload[] = preds.map((p) => ({
            id: p.itemId,
            confidence: p.confidence,
            className: p.className,
            modelClassName: p.modelClassName,
            displayName: p.displayName,
            category: p.category,
            box: p.box,
          }));
          setCustomDetections(newItems);
          setActiveIndex(0);
          notify(`Re-evaluated at ${targetLevel.thresholdPercent}%`);
        }
        setReEvaluating(false);
      }, 300);
    }
  }

  return (
    <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center', gap: 16 }}>
      {!!params.imageUri && (
        <View style={{ gap: 10 }}>
          <DetectionPreview
            uri={params.imageUri}
            boxes={detectedItems.map((d) => ({
              box: d.box,
              label: d.displayName,
              confidence: d.confidence,
            }))}
            activeIndex={activeIndex}
            onSelectIndex={handleSelectIndex}
          />
          {detectedItems.length > 1 && (
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {detectedItems.map((det, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <Pressable
                    key={idx}
                    hitSlop={4}
                    onPress={() => handleSelectIndex(idx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Inspect item ${idx + 1}: ${det.displayName}`}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      minHeight: 38,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isSelected ? C.green : C.line,
                      backgroundColor: isSelected ? '#E6F0DF' : C.white,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Txt size={12} weight={isSelected ? '700' : '500'} color={isSelected ? C.green : C.ink}>
                      {idx + 1}. {det.displayName}
                    </Txt>
                    <Txt size={11} weight="600" color={isSelected ? C.green : C.muted}>
                      {det.confidence}%
                    </Txt>
                  </Pressable>
                );
              })}
            </Row>
          )}
        </View>
      )}

      {/* Clean Item Hero */}
      <Row style={{ alignItems: 'center', gap: 14 }}>
        <ItemArt item={activeItem} size={60} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Txt
            accessibilityRole="header"
            size={isNarrow ? 22 : isMobile ? 24 : 28}
            weight="700"
            color={C.ink}
            style={{
              lineHeight: isNarrow ? 28 : isMobile ? 30 : 34,
              letterSpacing: isMobile ? -0.5 : -0.7,
            }}
          >
            {activeItem.name}
          </Txt>
          <Txt size={isMobile ? 13 : 14} color={C.muted} numberOfLines={2} style={{ lineHeight: isMobile ? 18 : 20 }}>
            {activeItem.material}
          </Txt>
          <Row style={{ flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            <CategoryBadge category={activeItem.category} />
            {confidence > 0 && (
              <Badge
                text={`${confidenceScore}% match`}
                background={confidenceBg}
                color={confidenceColor}
              />
            )}
          </Row>
        </View>
      </Row>

      {low && (
        <Card style={{ gap: 12, padding: 16, backgroundColor: '#FAF2E4', borderColor: '#EBD9B8' }}>
          <Txt size={15} weight="600" color="#7A561E">
            Uncertain match — please confirm
          </Txt>
          <Txt size={13} color="#7A561E">
            Confidence is low for this image. Confirm it matches your item before sorting.
          </Txt>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            <Button
              title="Yes, confirm"
              onPress={() => setConfirmedByItem((prev) => ({ ...prev, [activeIndex]: true }))}
              style={{ flexGrow: 1 }}
            />
            <Button
              title="Retake"
              variant="secondary"
              onPress={() => router.push('/scan')}
              style={{ flexGrow: 1 }}
            />
          </Row>
        </Card>
      )}

      {parentClassItem && (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/result',
              params: { id: parentClassItem.id, source: 'manual' },
            })
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: C.white,
            borderWidth: 1,
            borderColor: C.line,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Txt size={13} color={C.muted}>
            Part of <Txt size={13} weight="600" color={C.ink}>{parentClassItem.name}</Txt>
          </Txt>
          <Row style={{ gap: 4 }}>
            <Txt size={12} weight="600" color={C.green}>
              Class overview
            </Txt>
            <Icon name="arrow" size={14} color={C.green} />
          </Row>
        </Pressable>
      )}

      {item.subItemIds && item.subItemIds.length > 0 && (
        <View style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt size={13} weight="600" color={C.muted}>
              Specific variant
            </Txt>
            {selectedSubItemId && (
              <Pressable onPress={() => setSelectedSubItemId(null)} accessibilityRole="button">
                <Txt size={12} color={C.green} weight="600">
                  Reset to {item.name}
                </Txt>
              </Pressable>
            )}
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {item.subItemIds.map((subId) => {
              const sub = state.items.find((i) => i.id === subId);
              if (!sub) return null;
              const isSelected = activeItem.id === sub.id;
              return (
                <Pressable
                  key={subId}
                  hitSlop={4}
                  onPress={() => setSelectedSubItemId(isSelected ? null : sub.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    minHeight: 38,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? C.green : C.line,
                    backgroundColor: isSelected ? '#E6F0DF' : C.white,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <ItemArt item={sub} size={20} />
                  <Txt
                    size={12}
                    weight={isSelected ? '700' : '500'}
                    color={isSelected ? C.green : C.ink}
                  >
                    {sub.name}
                  </Txt>
                </Pressable>
              );
            })}
          </Row>
        </View>
      )}

      {/* Disposal Steps Card */}
      <Card style={{ padding: 18, gap: 16 }}>
        <Txt size={17} weight="600">
          How to dispose
        </Txt>
        {activeItem.steps.map((step, index) => (
          <Row key={index} style={{ alignItems: 'flex-start', gap: 12 }}>
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
              <Txt size={12} weight="600" color={C.green}>
                {index + 1}
              </Txt>
            </View>
            <Txt style={{ flex: 1, lineHeight: 21 }}>{step}</Txt>
          </Row>
        ))}

        {!!activeItem.caution && (
          <Row
            style={{
              backgroundColor: '#FAF2E4',
              padding: 12,
              borderRadius: 10,
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <Icon name="warning" size={18} color="#8B652B" />
            <Txt style={{ flex: 1, lineHeight: 19 }} color="#805D28" size={13}>
              {activeItem.caution}
            </Txt>
          </Row>
        )}

        {!low && (
          <View style={{ gap: 10, paddingTop: 2 }}>
            <Row style={{ gap: 10 }}>
              <Button
                title={saved?.sorted ? 'Sorted' : 'I sorted this'}
                disabled={saved?.sorted}
                icon="check"
                onPress={() => save(true)}
                style={{ flex: 1 }}
              />
              <Button
                title={saved ? 'Saved' : 'Save'}
                disabled={!!saved}
                icon="bookmark"
                variant="secondary"
                onPress={() => save(false)}
                style={{ minWidth: 90 }}
              />
            </Row>
            {detectedItems.length > 1 && activeIndex < detectedItems.length - 1 && (
              <Button
                title={`Next item: ${detectedItems[activeIndex + 1].displayName} →`}
                variant="ghost"
                onPress={() => handleSelectIndex(activeIndex + 1)}
              />
            )}
          </View>
        )}
      </Card>

      <NearbyDisposal key={activeItem.id} item={activeItem} />

      <View>
        <Disclosure
          title={
            state.location && state.location !== 'Location detected'
              ? `Local guidance · ${state.location}`
              : 'Local guidance'
          }
          icon="pin"
        >
          <Txt size={13} color={C.muted}>
            {locationGuidance(state.location, activeItem.category)}
          </Txt>
        </Disclosure>

        {confidence > 0 && (
          <Disclosure title="Scan details & sensitivity" icon="filter">
            <View style={{ gap: 12 }}>
              <View style={{ gap: 6 }}>
                <Txt size={12} weight="600" color={C.ink}>
                  Confidence threshold {reEvaluating ? '· Updating…' : ''}
                </Txt>
                <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                  {CONFIDENCE_LEVELS.map((lvl) => {
                    const isSelected = lvl.id === selectedTier;
                    return (
                      <Pressable
                        key={lvl.id}
                        disabled={reEvaluating}
                        onPress={() => handleConfidenceChange(lvl.id)}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isSelected ? C.green : C.line,
                          backgroundColor: isSelected ? '#E6F0DF' : C.white,
                          opacity: reEvaluating ? 0.55 : pressed ? 0.75 : 1,
                        })}
                      >
                        <Txt
                          size={12}
                          weight={isSelected ? '600' : '500'}
                          color={isSelected ? C.green : C.ink}
                        >
                          {lvl.label} ({lvl.thresholdPercent}%)
                        </Txt>
                      </Pressable>
                    );
                  })}
                </Row>
              </View>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                {!!rawModelClass && (
                  <Txt size={12} color={C.muted}>
                    Detected class: {rawModelClass.replaceAll('_', ' ')}
                  </Txt>
                )}
                {!!params.modelUsed && (
                  <Txt size={12} color={C.muted}>
                    Model: {params.modelUsed}
                  </Txt>
                )}
              </Row>
            </View>
          </Disclosure>
        )}
      </View>

      {/* Clean Footer Actions */}
      <View style={{ gap: 8 }}>
        <Button
          title="Scan another item"
          icon="camera"
          variant="secondary"
          onPress={() => router.push('/scan')}
        />
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Button
            title="Ask assistant"
            icon="chat"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/assistant',
                params: {
                  item: activeItem.id,
                  itemName: activeItem.name,
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
      </View>

      {correcting && (
        <Card style={{ gap: 14, padding: 18 }}>
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
