import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, uniqueId } from '@/state/app-state';
import { Badge, Button, C, Card, Field, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
export default function AssistantScreen() {
  const params = useLocalSearchParams<{ item?: string }>();
  const { state, update } = useApp();
  const [draft, setDraft] = useState('');
  const messagesRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const context = state.items.find((i) => i.id === params.item);
  function send(value = draft) {
    const text = value.trim();
    if (!text || busy) return;
    setDraft('');
    setBusy(true);
    update((s) => ({ ...s, messages: [...s.messages, { id: uniqueId(), role: 'user', text }] }));
    const words: string[] = Array.from(text.toLowerCase().match(/[a-z]+/g) || []);
    const matches = state.items
      .map((item) => ({
        item,
        score:
          item.keywords.filter((k) => words.includes(k) && !['can', 'aa'].includes(k)).length +
          (text.toLowerCase().includes(item.name.toLowerCase()) ? 3 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const matched = matches[0]?.score > 0 ? matches[0].item : undefined;
    const lastItem = [...state.messages].reverse().find((m) => m.itemId)?.itemId;
    const followup = /\b(it|this|that|cap|rinse|clean|where|safe|lid)\b/i.test(text);
    const item =
      matched || (followup ? context || state.items.find((i) => i.id === lastItem) : undefined);
    let response =
      'I don’t have a reliable match for that question in the demo guide. Try a specific item such as “plastic bottle”, “phone charger”, or “battery”, or use the waste guide to choose a category.';
    if (item)
      response = `${item.name} belongs in ${item.category.toLowerCase()}.\n\n${item.steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}${item.caution ? `\n\nTake care: ${item.caution}` : ''}\n\nCheck accepted materials with your collector in ${state.location}. Local collection points are not connected yet.`;
    else if (words.includes('recycling') || words.includes('recycle') || words.includes('sort'))
      response =
        'Start by separating food scraps from clean, dry materials. Keep batteries and electronics aside for dedicated collection. Acceptance varies by location, so look up the exact item in the waste guide before choosing a bin.\n\nWhat item would you like to sort?';
    timer.current = setTimeout(() => {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { id: uniqueId(), role: 'assistant', text: response, itemId: item?.id },
        ],
      }));
      setBusy(false);
    }, 650);
  }
  return (
    <View style={{ maxWidth: 930, width: '100%', alignSelf: 'center' }}>
      <Heading
        eyebrow="YOUR EVERYDAY SORTING COMPANION"
        title="Let’s sort it out, together."
        subtitle="A little clarity for the things that don’t fit neatly into a bin."
      />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Row
          style={{
            borderBottomWidth: 1,
            borderColor: C.line,
            padding: 20,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Row>
            <View style={{ padding: 10, backgroundColor: '#EAF0DF', borderRadius: 13 }}>
              <Icon name="chat" />
            </View>
            <View>
              <Txt weight="600">Sortify assistant</Txt>
              <Txt size={10} color={C.muted}>
                Answers from the demo waste guide
              </Txt>
            </View>
          </Row>
          <Badge text="Scripted demo" icon="demo" />
        </Row>
        <ScrollView
          ref={messagesRef}
          nestedScrollEnabled
          style={{ maxHeight: width < 650 ? 360 : 460 }}
          contentContainerStyle={{ padding: 24, gap: 22, minHeight: 300 }}
          onContentSizeChange={() => {
            if (state.messages.length) messagesRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {context && (
            <View style={{ backgroundColor: '#EFF3E8', borderRadius: 10, padding: 13 }}>
              <Txt size={12}>You’re asking about: {context.name}</Txt>
            </View>
          )}
          {!state.messages.length ? (
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 18 }}>
              <Icon name="sprout" size={48} strokeWidth={1.2} />
              <Txt size={24} weight="500" style={{ textAlign: 'center' }}>
                Every good habit starts with a question.
              </Txt>
              <Txt size={13} color={C.muted} style={{ textAlign: 'center' }}>
                Tell me what you’re sorting. We’ll find its next step.
              </Txt>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}
              >
                {[
                  context
                    ? `How do I dispose of ${context.name.toLowerCase()}?`
                    : 'Where does a plastic bottle go?',
                  'What do I do with old batteries?',
                  'Can I compost banana peels?',
                ].map((q) => (
                  <Button key={q} title={q} variant="secondary" onPress={() => send(q)} />
                ))}
              </View>
            </View>
          ) : (
            state.messages.map((m) => (
              <View
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  backgroundColor: m.role === 'user' ? C.green : '#F1F4EA',
                  padding: 18,
                  borderRadius: 14,
                  gap: 12,
                }}
              >
                <Txt
                  size={13}
                  color={m.role === 'user' ? 'white' : C.ink}
                  style={{ lineHeight: 22 }}
                >
                  {m.text}
                </Txt>
                {!!m.itemId && (
                  <Button
                    title="Open disposal guide"
                    icon="arrow"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/result', params: { id: m.itemId! } })}
                  />
                )}
              </View>
            ))
          )}
          {busy && (
            <Txt accessibilityLiveRegion="polite" color={C.muted} size={12}>
              Looking through the demo guide…
            </Txt>
          )}
        </ScrollView>
        <View style={{ padding: 20, borderTopWidth: 1, borderColor: C.line, gap: 10 }}>
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field
                placeholder="Ask about an item…"
                value={draft}
                onChangeText={setDraft}
                maxLength={1000}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                editable={!busy}
              />
            </View>
            <Button
              title="Send"
              icon="send"
              disabled={!draft.trim() || busy}
              onPress={() => send()}
            />
          </Row>
          <Txt size={10} color={C.muted}>
            This prototype matches keywords to sample guidance. It does not use a live AI model.
          </Txt>
        </View>
      </Card>
      <Row style={{ justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
        {confirmClear ? (
          <>
            <Txt size={12} color={C.muted}>
              Clear this local conversation?
            </Txt>
            <Button
              title="Clear conversation"
              variant="danger"
              onPress={() => {
                update((s) => ({ ...s, messages: [] }));
                setConfirmClear(false);
              }}
            />
            <Button title="Cancel" variant="ghost" onPress={() => setConfirmClear(false)} />
          </>
        ) : (
          <Button
            title="Start a new conversation"
            icon="plus"
            variant="ghost"
            disabled={busy || !state.messages.length}
            onPress={() => setConfirmClear(true)}
          />
        )}
      </Row>
    </View>
  );
}
