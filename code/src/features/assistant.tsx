import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, uniqueId } from '@/state/app-state';
import { Badge, Button, C, Card, Field, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
import { askAssistant } from '@/services/assistant';

// Strip unicode emojis to enforce zero-emoji rule
export function stripEmojis(str: string): string {
  return str.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{25AA}-\u{25FE}]/gu,
    '',
  );
}

// Parses inline bold, italic, and code without raw asterisks or backticks
export function renderInlineFormatted(rawText: string, baseColor = C.ink) {
  const clean = stripEmojis(rawText);
  // Match **bold** or __bold__ or *italic* or _italic_ or `code`
  const parts = clean.split(/(\*\*[^*]+?\*\*|__[^_]+?__|\*(?!\s)[^*]+?(?<!\s)\*|_(?!\s)[^_]+?(?<!\s)_|`[^`]+?`)/g);
  return parts.map((part, i) => {
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <Txt key={i} weight="700" color={baseColor} size={13}>
          {part.slice(2, -2)}
        </Txt>
      );
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <Txt key={i} color={baseColor} size={13} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </Txt>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <Txt
          key={i}
          color={baseColor}
          size={12}
          style={{
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 4,
          }}
        >
          {part.slice(1, -1)}
        </Txt>
      );
    }
    return (
      <Txt key={i} color={baseColor} size={13}>
        {part}
      </Txt>
    );
  });
}

export function AssistantMessageRenderer({ text }: { text: string }) {
  const clean = stripEmojis(text);
  const rawLines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <View style={{ gap: 8, width: '100%' }}>
      {rawLines.map((line, idx) => {
        // 1. Header with title and optional category: **Title** (Category) or **Title**: (Category) or **Title** (Category):
        const headerMatch = line.match(
          /^(?:#{1,4}\s+)?\*\*(.*?)\*\*(?:\s*[:\–\-]\s*|\s+)?(?:\((.*?)\))?\s*:?\s*$/,
        );
        if (headerMatch && (headerMatch[1] || headerMatch[2])) {
          const title = headerMatch[1].trim();
          const category = headerMatch[2]?.trim();
          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
              }}
            >
              <Txt size={14} weight="700" color={C.ink}>
                {title}
              </Txt>
              {category && <Badge text={category} />}
            </View>
          );
        }

        // 2. Caution / Warning block: e.g. Caution: ... or **Caution**: ... or • Caution: ...
        const cautionMatch = line.match(
          /^(?:[•\-*]\s*)?(?:\*\*(?:Caution|Warning)\*\*|(?:Caution|Warning))(?:[:\s]+\s*)(.*)$/i,
        );
        if (cautionMatch) {
          const cautionBody = cautionMatch[1].trim();
          return (
            <View
              key={idx}
              style={{
                backgroundColor: '#FFFBEB',
                borderColor: '#FDE68A',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 9,
                marginTop: 2,
                gap: 3,
              }}
            >
              <Row style={{ gap: 6, alignItems: 'center' }}>
                <Txt size={11} weight="700" color="#92400E" style={{ letterSpacing: 0.4 }}>
                  CAUTION
                </Txt>
              </Row>
              <Txt size={12} color="#78350F" style={{ lineHeight: 18 }}>
                {renderInlineFormatted(cautionBody, '#78350F')}
              </Txt>
            </View>
          );
        }

        // 3. Related note / Material note / Regional note block
        const noteMatch = line.match(
          /^(?:[•\-*]\s*)?(?:\*?(Related\s+(?:note|category)|Material\s+note|Regional\s+note|Note)(?:\s+(?:on|for)\s+([^*:]+)|\s*\(([^)]+)\))?\*?)(?:[:\s]+\s*)(.*)$/i,
        );
        if (noteMatch) {
          const kind = noteMatch[1].trim();
          const topic = (noteMatch[2] || noteMatch[3] || '').trim();
          const noteBody = noteMatch[4].trim();
          return (
            <View
              key={idx}
              style={{
                backgroundColor: '#F3F6F0',
                borderColor: '#DDE5D6',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 2,
                gap: 3,
              }}
            >
              <Txt size={11} weight="700" color={C.green}>
                {topic ? `Related: ${topic}` : kind ? kind.toUpperCase() : 'NOTE'}
              </Txt>
              <Txt size={12} color={C.ink} style={{ lineHeight: 18 }}>
                {renderInlineFormatted(noteBody, C.ink)}
              </Txt>
            </View>
          );
        }

        // 4. Bullet points: starts with •, -, or * (when not **)
        const bulletMatch = line.match(/^(?:•|\-|\*(?!\*))\s+(.*)$/);
        if (bulletMatch) {
          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                paddingLeft: 2,
              }}
            >
              <Txt size={13} color={C.green} weight="700" style={{ lineHeight: 20 }}>
                •
              </Txt>
              <Txt size={13} color={C.ink} style={{ flex: 1, lineHeight: 20 }}>
                {renderInlineFormatted(bulletMatch[1])}
              </Txt>
            </View>
          );
        }

        // 5. Numbered list: starts with 1., 2., etc.
        const numMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
        if (numMatch) {
          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                paddingLeft: 2,
              }}
            >
              <Txt size={12} color={C.green} weight="700" style={{ lineHeight: 20, minWidth: 16 }}>
                {numMatch[1]}.
              </Txt>
              <Txt size={13} color={C.ink} style={{ flex: 1, lineHeight: 20 }}>
                {renderInlineFormatted(numMatch[2])}
              </Txt>
            </View>
          );
        }

        // 6. Section header like Disposal Instructions: ...
        const sectionMatch = line.match(/^(?:Disposal\s+Instructions|Instructions|Overview):\s*(.*)$/i);
        if (sectionMatch && sectionMatch[1]) {
          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                paddingLeft: 2,
              }}
            >
              <Txt size={13} color={C.green} weight="700" style={{ lineHeight: 20 }}>
                •
              </Txt>
              <Txt size={13} color={C.ink} style={{ flex: 1, lineHeight: 20 }}>
                {renderInlineFormatted(sectionMatch[1])}
              </Txt>
            </View>
          );
        }

        // 7. If multiple sentences are in one paragraph (e.g. unformatted instructions):
        const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter((s) => s.trim().length > 0);
        if (sentences.length > 1 && !line.startsWith('I ') && !line.startsWith('You ')) {
          return (
            <View key={idx} style={{ gap: 6, marginVertical: 2 }}>
              {sentences.map((sent, sIdx) => (
                <View
                  key={sIdx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                    paddingLeft: 2,
                  }}
                >
                  <Txt size={13} color={C.green} weight="700" style={{ lineHeight: 20 }}>
                    •
                  </Txt>
                  <Txt size={13} color={C.ink} style={{ flex: 1, lineHeight: 20 }}>
                    {renderInlineFormatted(sent)}
                  </Txt>
                </View>
              ))}
            </View>
          );
        }

        // 8. Regular paragraph with styled bold/italic tokens
        return (
          <Txt key={idx} size={13} color={C.ink} style={{ lineHeight: 21 }}>
            {renderInlineFormatted(line)}
          </Txt>
        );
      })}
    </View>
  );
}

export default function AssistantScreen() {
  const params = useLocalSearchParams<{ item?: string; itemName?: string; fromScan?: string }>();
  const { state, update } = useApp();
  const [draft, setDraft] = useState('');
  const [openContexts, setOpenContexts] = useState<Record<string, boolean>>({});
  const messagesRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const [busy, setBusy] = useState(false);

  const context = state.items.find((i) => i.id === params.item);
  const itemName = params.itemName || context?.name || '';

  // Ephemeral conversations: reset previous messages when entering with an item query or new scan
  const scanKeyRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentKey = params.fromScan
      ? `scan-${params.fromScan}`
      : params.item
        ? `item-${params.item}`
        : undefined;
    if (currentKey && currentKey !== scanKeyRef.current) {
      scanKeyRef.current = currentKey;
      update((s) => ({ ...s, messages: [] }));
    }
  }, [params.fromScan, params.item, update]);

  // 2 Floating suggestion chips
  const suggestionChips = itemName
    ? [
        `How do I dispose of ${itemName.toLowerCase()}?`,
        `Which bin does ${itemName.toLowerCase()} go into?`,
      ]
    : ['Where does a plastic bottle go?', 'What do I do with old batteries?'];

  function toggleContext(messageId: string) {
    setOpenContexts((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  }

  function resetConversation() {
    setOpenContexts({});
    update((s) => ({ ...s, messages: [] }));
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
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: C.line,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Txt size={12} color={C.muted}>
              Answers from rag.txt
            </Txt>
            <Badge text="RAG (Qwen 0.5B)" />
          </Row>
          {state.messages.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset conversation"
              onPress={resetConversation}
              style={({ pressed, hovered }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: pressed ? '#FEE2E2' : hovered ? '#FEF2F2' : '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              })}
            >
              <Icon name="reset" size={13} color="#991B1B" />
              <Txt size={11} weight="600" color="#991B1B">
                Reset chat
              </Txt>
            </Pressable>
          )}
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
                {itemName ? `Ask about ${itemName}` : 'What are you sorting?'}
              </Txt>
              <Txt size={13} color={C.muted} style={{ textAlign: 'center' }}>
                Choose a question below or type your own question.
              </Txt>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}
              >
                {suggestionChips.map((q) => (
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
                    {m.role === 'user' ? (
                      <Txt size={13} color="white" style={{ lineHeight: 22, flex: 1 }}>
                        {m.text}
                      </Txt>
                    ) : (
                      <View style={{ flex: 1 }}>
                        <AssistantMessageRenderer text={m.text} />
                      </View>
                    )}
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
                            <Row
                              style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}
                            >
                              <Txt size={11} color={C.muted}>
                                Base model:
                              </Txt>
                              <Txt size={11} weight="600" color={C.ink}>
                                {m.ragTraces.model || 'Qwen/Qwen2.5-0.5B-Instruct'}
                              </Txt>
                            </Row>
                            <Row
                              style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}
                            >
                              <Txt size={11} color={C.muted}>
                                Retrieval latency:
                              </Txt>
                              <Txt size={11} color={C.ink}>
                                {m.ragTraces.retrieval_ms ?? 12} ms
                              </Txt>
                            </Row>
                            <Row
                              style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}
                            >
                              <Txt size={11} color={C.muted}>
                                Generation latency:
                              </Txt>
                              <Txt size={11} color={C.ink}>
                                {m.ragTraces.generation_ms ?? 45} ms
                              </Txt>
                            </Row>
                            <Row
                              style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}
                            >
                              <Txt size={11} color={C.muted}>
                                Total pipeline latency:
                              </Txt>
                              <Txt size={11} weight="600" color={C.ink}>
                                {m.ragTraces.total_ms ?? 57} ms
                              </Txt>
                            </Row>
                            {!!m.ragTraces.trace_id && (
                              <Row
                                style={{
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 6,
                                }}
                              >
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

        {/* 2 Floating suggestion chips */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderColor: C.line,
            backgroundColor: '#F8F9F4',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Txt size={11} weight="600" color={C.muted} style={{ marginRight: 2 }}>
            Suggested:
          </Txt>
          {suggestionChips.map((chip, idx) => (
            <Pressable
              key={idx}
              accessibilityRole="button"
              accessibilityLabel={chip}
              disabled={busy}
              onPress={() => send(chip)}
              style={({ pressed, hovered }) => ({
                backgroundColor: pressed ? '#E2EBD6' : hovered ? '#EBF0E4' : '#FFFFFF',
                borderColor: '#CBD8C2',
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: busy ? 0.5 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
              })}
            >
              <Icon name="sparkle" size={13} color={C.green} />
              <Txt size={12} weight="500" color={C.green}>
                {chip}
              </Txt>
            </Pressable>
          ))}
        </View>

        {/* Chat input field */}
        <View style={{ padding: 16, borderTopWidth: 1, borderColor: C.line, gap: 10 }}>
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
        <Button
          title="New conversation"
          icon="reset"
          variant="ghost"
          disabled={busy || !state.messages.length}
          onPress={resetConversation}
        />
      </Row>
    </View>
  );
}
