import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, uniqueId } from '@/state/app-state';
import { Badge, Button, C, Card, Field, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
import { askAssistant } from '@/services/assistant';

export default function AssistantScreen() {
  const params = useLocalSearchParams<{ item?: string }>();
  const { state, update } = useApp();
  const [draft, setDraft] = useState('');
  const [openContexts, setOpenContexts] = useState<Record<string, boolean>>({});
  const messagesRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const context = state.items.find((i) => i.id === params.item);

  function toggleContext(messageId: string) {
    setOpenContexts((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  }

  async function send(value = draft) {
    const text = value.trim();
    if (!text || busy) return;
    setDraft('');
    setBusy(true);
    update((s) => ({ ...s, messages: [...s.messages, { id: uniqueId(), role: 'user', text }] }));

    try {
      const res = await askAssistant(text, context);
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: uniqueId(),
            role: 'assistant',
            text: res.reply,
            itemId: res.itemId,
            ragContext: res.context,
            ragTraces: res.traces,
          },
        ],
      }));
    } catch {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: uniqueId(),
            role: 'assistant',
            text: 'I couldn’t process that question right now. Please try again.',
          },
        ],
      }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ maxWidth: 930, width: '100%', alignSelf: 'center' }}>
      <Heading title="Assistant" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Row
          style={{
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: C.line,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Txt size={12} color={C.muted}>
            Answers from rag.txt
          </Txt>
          <Badge text="RAG (Qwen 0.5B)" />
        </Row>
        <ScrollView
          ref={messagesRef}
          nestedScrollEnabled
          style={{ maxHeight: Math.max(200, Math.min(height - 390, 460)) }}
          contentContainerStyle={{
            padding: 20,
            gap: 18,
            minHeight: Math.max(180, Math.min(height - 410, 280)),
          }}
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
              <Icon name="chat" size={28} strokeWidth={1.5} />
              <Txt size={20} weight="500" style={{ textAlign: 'center' }}>
                What are you sorting?
              </Txt>
              <Txt size={13} color={C.muted} style={{ textAlign: 'center' }}>
                Ask about an item or choose a question.
              </Txt>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}
              >
                {[
                  context
                    ? `How do I dispose of ${context.name.toLowerCase()}?`
                    : 'Where does a plastic bottle go?',
                  'What do I do with old batteries?',
                ].map((q) => (
                  <Button key={q} title={q} variant="secondary" onPress={() => send(q)} />
                ))}
              </View>
            </View>
          ) : (
            state.messages.map((m) => {
              const isOpen = !!openContexts[m.id];
              return (
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
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <Txt
                      size={13}
                      color={m.role === 'user' ? 'white' : C.ink}
                      style={{ lineHeight: 22, flex: 1 }}
                    >
                      {m.text}
                    </Txt>
                    {m.role === 'assistant' && (!!m.ragContext || !!m.ragTraces) && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Context"
                        onPress={() => toggleContext(m.id)}
                        style={({ pressed, hovered }) => ({
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          backgroundColor: isOpen ? '#154830' : C.green,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          opacity: pressed ? 0.75 : hovered ? 0.88 : 1,
                        })}
                      >
                        <Icon name={isOpen ? 'down' : 'chevron'} size={16} color="#FFFFFF" />
                      </Pressable>
                    )}
                  </View>

                  {m.role === 'assistant' && isOpen && (
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: C.line,
                        borderRadius: 10,
                        padding: 12,
                        gap: 10,
                      }}
                    >
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Row style={{ gap: 6, alignItems: 'center' }}>
                          <Icon name="book" size={14} color={C.green} />
                          <Txt size={11} weight="600" color={C.green}>
                            Context from rag.txt
                          </Txt>
                        </Row>
                        {typeof m.ragTraces?.retrieval_score === 'number' && (
                          <Badge text={`${Math.round(m.ragTraces.retrieval_score * 100)}% match`} />
                        )}
                      </Row>
                      <View
                        style={{
                          backgroundColor: '#F8F9F4',
                          borderRadius: 6,
                          padding: 10,
                          borderWidth: 1,
                          borderColor: '#EDF0E8',
                        }}
                      >
                        <Txt size={12} color={C.ink} style={{ lineHeight: 18 }}>
                          {m.ragContext || 'Retrieved context from rag.txt'}
                        </Txt>
                      </View>

                      {!!m.ragTraces && (
                        <>
                          <Row style={{ gap: 6, alignItems: 'center', marginTop: 2 }}>
                            <Icon name="chart" size={14} color={C.green} />
                            <Txt size={11} weight="600" color={C.green}>
                              RAG Pipeline Traces
                            </Txt>
                          </Row>
                          <View
                            style={{
                              gap: 6,
                              backgroundColor: '#F8F9F4',
                              borderRadius: 6,
                              padding: 10,
                              borderWidth: 1,
                              borderColor: '#EDF0E8',
                            }}
                          >
                            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <Txt size={11} color={C.muted}>
                                Base model:
                              </Txt>
                              <Txt size={11} weight="600" color={C.ink}>
                                {m.ragTraces.model || 'Qwen/Qwen2.5-0.5B-Instruct'}
                              </Txt>
                            </Row>
                            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <Txt size={11} color={C.muted}>
                                Retrieval latency:
                              </Txt>
                              <Txt size={11} color={C.ink}>
                                {m.ragTraces.retrieval_ms ?? 12} ms
                              </Txt>
                            </Row>
                            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <Txt size={11} color={C.muted}>
                                Generation latency:
                              </Txt>
                              <Txt size={11} color={C.ink}>
                                {m.ragTraces.generation_ms ?? 45} ms
                              </Txt>
                            </Row>
                            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <Txt size={11} color={C.muted}>
                                Total pipeline latency:
                              </Txt>
                              <Txt size={11} weight="600" color={C.ink}>
                                {m.ragTraces.total_ms ?? 57} ms
                              </Txt>
                            </Row>
                            {!!m.ragTraces.trace_id && (
                              <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                <Txt size={10} color={C.muted}>
                                  Trace ID:
                                </Txt>
                                <Txt size={10} color={C.muted}>
                                  {m.ragTraces.trace_id}
                                </Txt>
                              </Row>
                            )}
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {!!m.itemId && (
                    <Button
                      title="Open disposal guide"
                      icon="arrow"
                      variant="secondary"
                      onPress={() => router.push({ pathname: '/result', params: { id: m.itemId! } })}
                    />
                  )}
                </View>
              );
            })
          )}
          {busy && (
            <Txt accessibilityLiveRegion="polite" color={C.muted} size={12}>
              Pulling context from rag.txt with Qwen…
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
            RAG replies pull context from rag.txt grounded with lightweight Qwen model.
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
            title="New conversation"
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
