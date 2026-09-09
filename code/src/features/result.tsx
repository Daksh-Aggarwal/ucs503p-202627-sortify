import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
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
  Heading,
  Icon,
  ItemArt,
  Row,
  SectionTitle,
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
  const { width } = useWindowDimensions();
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
    <View>
      <Button
        title="Back to waste guide"
        icon="back"
        variant="ghost"
        onPress={() => router.push('/explore')}
        style={{ alignSelf: 'flex-start', paddingLeft: 0, marginBottom: 12 }}
      />
      <Heading
        eyebrow={source === 'demo' ? 'YOUR DEMO RESULT' : 'FROM THE WASTE GUIDE'}
        title={low ? 'Let’s take a closer look.' : 'A better ending starts here.'}
        subtitle={
          low
            ? 'This example is uncertain. Confirm the item before saving it.'
            : 'Know what it is. Know what to do next.'
        }
      />
      <View style={{ flexDirection: width > 1100 ? 'row' : 'column', gap: 24 }}>
        <Card style={{ flex: 1, gap: 22 }}>
          <View
            style={{
              padding: 30,
              alignItems: 'center',
              backgroundColor: '#F5F7EF',
              borderRadius: 14,
            }}
          >
            <ItemArt item={item} size={130} />
          </View>
          <CategoryBadge category={item.category} />
          <View>
            <Txt size={30} weight="500" style={{ letterSpacing: -1 }}>
              {item.name}
            </Txt>
            <Txt color={C.muted} size={12}>
              {item.material}
            </Txt>
          </View>
          <Txt color={C.muted}>{item.description}</Txt>
          {confidence > 0 && (
            <View style={{ gap: 9 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12}>Example model confidence</Txt>
                <Txt size={14} weight="600" color={low ? '#B08037' : C.green}>
                  {confidence}%
                </Txt>
              </Row>
              <View style={{ height: 5, backgroundColor: '#E9EDE3', borderRadius: 5 }}>
                <View
                  style={{
                    width: `${Math.min(confidence, 100)}%`,
                    height: 5,
                    backgroundColor: low ? '#D0AA67' : '#83A665',
                    borderRadius: 5,
                  }}
                />
              </View>
              <Txt size={10} color={C.muted}>
                Simulated result · not a live image prediction
              </Txt>
            </View>
          )}
          {low ? (
            <View style={{ gap: 12 }}>
              <Txt color="#A07535" size={12}>
                We’re not sure this is the right match. Compare your item with the guide, or retake
                your photo.
              </Txt>
              <Button
                title="Yes, this is my item"
                icon="check"
                onPress={() => setConfirmed(true)}
              />
              <Button
                title="Choose a different item"
                variant="secondary"
                onPress={() => router.push('/explore')}
              />
              <Button
                title="Retake photo"
                icon="camera"
                variant="ghost"
                onPress={() => router.push('/scan')}
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Button
                title={saved?.sorted ? 'Marked as sorted' : 'I sorted this item'}
                disabled={saved?.sorted}
                icon="check"
                onPress={() => save(true)}
              />
              <Button
                title={saved ? 'Saved to history' : 'Save to my history'}
                disabled={!!saved}
                variant="secondary"
                icon="bookmark"
                onPress={() => save(false)}
              />
            </View>
          )}
        </Card>
        <View style={{ flex: 1.5, gap: 20 }}>
          <Card>
            <SectionTitle title="Here’s what to do" />
            <View style={{ gap: 25, marginTop: 9 }}>
              {item.steps.map((step, index) => (
                <Row key={index} style={{ alignItems: 'flex-start', gap: 16 }}>
                  <View
                    style={{
                      width: 29,
                      height: 29,
                      borderRadius: 10,
                      backgroundColor: '#EFF3E5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt weight="500" size={12}>
                      0{index + 1}
                    </Txt>
                  </View>
                  <Txt style={{ flex: 1, paddingTop: 3 }} size={14}>
                    {step}
                  </Txt>
                </Row>
              ))}
            </View>
            {!!item.caution && (
              <Row
                style={{
                  padding: 17,
                  backgroundColor: '#FAF2E4',
                  borderRadius: 12,
                  marginTop: 25,
                  alignItems: 'flex-start',
                }}
              >
                <Icon name="warning" color="#A58349" size={20} />
                <Txt color="#927343" size={12} style={{ flex: 1 }}>
                  {item.caution}
                </Txt>
              </Row>
            )}
          </Card>
          <Card style={{ backgroundColor: '#F0F4E9', gap: 12 }}>
            <Row>
              <Icon name="pin" size={19} />
              <Txt weight="500">Around {state.location}</Txt>
            </Row>
            <Txt size={12} color={C.muted}>
              {locationGuidance(state.location, item.category)}
            </Txt>
          </Card>
          <Card style={{ gap: 14 }}>
            <Row>
              <Icon name="chat" />
              <Txt size={17} weight="500">
                Have a follow-up?
              </Txt>
            </Row>
            <Txt color={C.muted} size={12}>
              A tricky cap? A different material? Let’s talk it through.
            </Txt>
            <Button
              title="Ask about this item"
              icon="arrow"
              variant="secondary"
              onPress={() => router.push({ pathname: '/assistant', params: { item: item.id } })}
              style={{ alignSelf: 'flex-start' }}
            />
          </Card>
          {correcting ? (
            <Card style={{ gap: 13 }}>
              <Txt weight="500">Help us get it right.</Txt>
              <Field
                label="What should this item be?"
                value={correction}
                onChangeText={setCorrection}
                placeholder="e.g. This is a glass bottle, not plastic"
                multiline
                maxLength={500}
              />
              <Row>
                <Button title="Send correction" onPress={feedback} disabled={!correction.trim()} />
                <Button title="Cancel" variant="ghost" onPress={() => setCorrecting(false)} />
              </Row>
            </Card>
          ) : (
            <Button
              title="Something doesn’t look right? Correct this result"
              variant="ghost"
              icon="edit"
              onPress={() => setCorrecting(true)}
            />
          )}
        </View>
      </View>
    </View>
  );
}
