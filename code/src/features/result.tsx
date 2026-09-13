import { Disclosure } from '@/components/sortify/controls';
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { uniqueId, useApp } from '@/state/app-state';
import { locationGuidance } from '@/data/catalog';
import {
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
export default function ResultScreen() {
  const params = useLocalSearchParams<{
    id: string;
    confidence?: string;
    source?: string;
    scanId?: string;
  }>();
  const { state, update, notify, saveScan } = useApp();
  const [savedId, setSavedId] = useState(params.scanId || '');
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const item = state.items.find((i) => i.id === params.id);
  const saved = state.scans.find((s) => s.id === savedId);
  const confidence = saved?.confidence ?? Number(params.confidence || 0);
  const low = confidence > 0 && confidence < 70 && !confirmed && !saved;
  const source = params.source === 'demo' || saved?.source === 'demo' ? 'demo' : 'manual';
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
    } else setSavedId(saveScan(item!.id, confidence, source, sorted));
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
      <Row style={{ marginBottom: 20, alignItems: 'flex-start' }}>
        <ItemArt item={item} size={64} />
        <View style={{ flex: 1, gap: 5 }}>
          <Txt accessibilityRole="header" size={26} weight="500" style={{ lineHeight: 32 }}>
            {item.name}
          </Txt>
          <Txt size={13} color={C.muted}>
            {item.material}
          </Txt>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            <CategoryBadge category={item.category} />
            {confidence > 0 && (
              <Txt size={12} color={C.muted}>
                Demo confidence: {confidence}%
              </Txt>
            )}
          </Row>
        </View>
      </Row>
      {low && (
        <Card style={{ gap: 12, marginBottom: 16, backgroundColor: '#FAF2E4' }}>
          <Txt weight="600">Confirm this item</Txt>
          <Txt size={13} color={C.muted}>
            The example prediction is uncertain. Check the match before saving.
          </Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            <Button title="Yes, this is my item" onPress={() => setConfirmed(true)} />
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
          <Row style={{ flexWrap: 'wrap', paddingTop: 4 }}>
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
        )}
      </Card>
      <View style={{ marginTop: 16 }}>
        <Disclosure title={`Local guidance · ${state.location}`} icon="pin">
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
          onPress={() => router.push({ pathname: '/assistant', params: { item: item.id } })}
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
