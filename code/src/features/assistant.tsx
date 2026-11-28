import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, uniqueId } from '@/state/app-state';
import { Badge, Button, C, Card, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
import { askAssistant } from '@/services/assistant';

// Strip unicode emojis to enforce zero-emoji rule
export function stripEmojis(str: string): string {
  return str.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{25AA}-\u{25FE}]/gu,
    '',
  );
}

// Parses inline bold, italic, and code without raw asterisks or backticks
export function renderInlineFormatted(rawText: string, baseColor = C.ink, fontSize = 14) {
  const clean = stripEmojis(rawText);
  // Match **bold** or __bold__ or *italic* or _italic_ or `code`
  const parts = clean.split(
    /(\*\*[^*]+?\*\*|__[^_]+?__|\*(?!\s)[^*]+?(?<!\s)\*|_(?!\s)[^_]+?(?<!\s)_|`[^`]+?`)/g,
  );
  return parts.map((part, i) => {
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <Txt key={i} weight="700" color={baseColor} size={fontSize}>
          {part.slice(2, -2)}
        </Txt>
      );
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <Txt key={i} color={baseColor} size={fontSize} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </Txt>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <Txt
          key={i}
          color={baseColor}
          size={Math.max(11, fontSize - 1)}
          style={{
            fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
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
      <Txt key={i} color={baseColor} size={fontSize}>
        {part}
      </Txt>
    );
  });
}

export function AssistantMessageRenderer({
  text,
  isMobile = false,
}: {
  text: string;
  isMobile?: boolean;
}) {
  const clean = stripEmojis(text);
  const rawLines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const baseFontSize = isMobile ? 13 : 14;
  const headingFontSize = isMobile ? 15 : 16;

  return (
    <View style={{ gap: 8, width: '100%' }}>
      {rawLines.map((line, idx) => {
        // 1. Header with title and optional category: **Title** (Category) or **Title**: (Category) or markdown # Title
        const headerMatch = line.match(
          /^(?:#{1,4}\s+)?\*\*(.*?)\*\*(?:\s*[:\–\-]\s*|\s+)?(?:\((.*?)\))?\s*:?\s*$/,
        );
        const mdHeaderMatch = !headerMatch ? line.match(/^#{1,4}\s+(.*?)(?:\s*\((.*?)\))?$/) : null;

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
              <Txt size={headingFontSize} weight="700" color={C.ink}>
                {title}
              </Txt>
              {category && <Badge text={category} />}
            </View>
          );
        }

        if (mdHeaderMatch && mdHeaderMatch[1]) {
          const title = mdHeaderMatch[1].trim();
          const category = mdHeaderMatch[2]?.trim();
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
              <Txt size={headingFontSize} weight="700" color={C.ink}>
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
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
                marginTop: 4,
                gap: 4,
                width: '100%',
              }}
            >
              <Row style={{ gap: 6, alignItems: 'center' }}>
                <Icon name="warning" size={14} color="#92400E" />
                <Txt size={11} weight="700" color="#92400E" style={{ letterSpacing: 0.4 }}>
                  CAUTION
                </Txt>
              </Row>
              <Txt size={baseFontSize} color="#78350F" style={{ lineHeight: 19 }}>
                {renderInlineFormatted(cautionBody, '#78350F', baseFontSize)}
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
                marginTop: 4,
                gap: 4,
                width: '100%',
              }}
            >
              <Txt size={11} weight="700" color={C.green}>
                {topic ? `Related: ${topic}` : kind ? kind.toUpperCase() : 'NOTE'}
              </Txt>
              <Txt size={baseFontSize} color={C.ink} style={{ lineHeight: 19 }}>
                {renderInlineFormatted(noteBody, C.ink, baseFontSize)}
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
                width: '100%',
              }}
            >
              <Txt size={baseFontSize} color={C.green} weight="700" style={{ lineHeight: 21 }}>
                •
              </Txt>
              <Txt
                size={baseFontSize}
                color={C.ink}
                style={{ flex: 1, minWidth: 0, lineHeight: 21 }}
              >
                {renderInlineFormatted(bulletMatch[1], C.ink, baseFontSize)}
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
                width: '100%',
              }}
            >
              <Txt
                size={baseFontSize - 1}
                color={C.green}
                weight="700"
                style={{ lineHeight: 21, minWidth: 18 }}
              >
                {numMatch[1]}.
              </Txt>
              <Txt
                size={baseFontSize}
                color={C.ink}
                style={{ flex: 1, minWidth: 0, lineHeight: 21 }}
              >
                {renderInlineFormatted(numMatch[2], C.ink, baseFontSize)}
              </Txt>
            </View>
          );
        }

        // 6. Section header like Disposal Instructions: ... or Instructions:
        const sectionMatch = line.match(
          /^(?:Disposal\s+Instructions|Instructions|Overview):\s*(.*)$/i,
        );
        if (sectionMatch) {
          const detail = sectionMatch[1]?.trim();
          return (
            <View key={idx} style={{ marginTop: 4, gap: 4, width: '100%' }}>
              <Txt size={12} weight="700" color={C.green} style={{ letterSpacing: 0.3 }}>
                DISPOSAL INSTRUCTIONS
              </Txt>
              {detail ? (
                <Txt size={baseFontSize} color={C.ink} style={{ lineHeight: 21 }}>
                  {renderInlineFormatted(detail, C.ink, baseFontSize)}
                </Txt>
              ) : null}
            </View>
          );
        }

        // 7. Regular paragraph with styled bold/italic/code tokens
        return (
          <Txt
            key={idx}
            size={baseFontSize}
            color={C.ink}
            style={{ lineHeight: isMobile ? 20 : 22, width: '100%' }}
          >
            {renderInlineFormatted(line, C.ink, baseFontSize)}
          </Txt>
        );
      })}
    </View>
  );
}

export default function AssistantScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1000;
  const isSmallScreen = width < 380;
  const isMobile = width < 768;

  const params = useLocalSearchParams<{ item?: string; itemName?: string; fromScan?: string }>();
  const { state, update } = useApp();
  const [draft, setDraft] = useState('');
  const [openContexts, setOpenContexts] = useState<Record<string, boolean>>({});
  const messagesRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);

  const context = state.items.find((i) => i.id === params.item);
  const paramItemName = params.itemName || context?.name || '';
  const currentItemKey = `${params.item || ''}-${params.itemName || ''}-${params.fromScan || ''}`;
  const [clearedItemKey, setClearedItemKey] = useState<string | null>(null);
  const activeItemName = clearedItemKey === currentItemKey ? '' : paramItemName;

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

  // Scroll to bottom helper
  const scrollToBottom = useCallback((delay = 60) => {
    setTimeout(() => {
      messagesRef.current?.scrollToEnd({ animated: true });
    }, delay);
  }, []);

  // Listen to keyboard on mobile to scroll messages into view
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      scrollToBottom(80);
    });
    return () => sub.remove();
  }, [scrollToBottom]);

  // Suggestion chips: 4 rich contextual options
  const suggestionChips = activeItemName
    ? [
        `How do I dispose of ${activeItemName.toLowerCase()}?`,
        `Which bin does ${activeItemName.toLowerCase()} belong in?`,
        `Are there safety cautions for ${activeItemName.toLowerCase()}?`,
        `Can ${activeItemName.toLowerCase()} be recycled curbside?`,
      ]
    : [
        'Where does a plastic water bottle go?',
        'How do I safely dispose of batteries?',
        'Can greasy pizza boxes be recycled?',
        'What should I do with electronic waste?',
      ];

  function toggleContext(messageId: string) {
    setOpenContexts((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
    scrollToBottom(100);
  }

  function resetConversation() {
    setOpenContexts({});
    setDraft('');
    update((s) => ({ ...s, messages: [] }));
  }

  function clearActiveItem() {
    setClearedItemKey(currentItemKey);
  }

  async function send(value = draft) {
    const text = value.trim();
    if (!text || busy) return;
    setDraft('');
    setBusy(true);

    const userMessage = { id: uniqueId(), role: 'user' as const, text };
    update((s) => ({ ...s, messages: [...s.messages, userMessage] }));
    scrollToBottom(40);

    try {
      const res = await askAssistant(text, context);
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: uniqueId(),
            role: 'assistant' as const,
            text: res.reply,
            itemId: res.itemId,
            ragContext: res.context,
            ragTraces: res.traces,
          },
        ],
      }));
      scrollToBottom(80);
    } catch {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: uniqueId(),
            role: 'assistant' as const,
            text: 'I could not process that question right now. Please try asking again.',
          },
        ],
      }));
      scrollToBottom(80);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        maxWidth: 960,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {/* Screen Header */}
      <Heading
        title="Sorting Assistant"
        subtitle="AI waste guidance grounded in rag.txt"
        action={
          <Button
            title={isSmallScreen ? 'Reset' : 'New chat'}
            icon="reset"
            variant="ghost"
            disabled={busy || !state.messages.length}
            onPress={resetConversation}
            style={{ flexShrink: 0 }}
          />
        }
      />

      {/* Main Chat Card Container */}
      <Card
        style={{
          flex: 1,
          minHeight: 0,
          padding: 0,
          overflow: 'hidden',
          borderRadius: isMobile ? 14 : 18,
          borderWidth: 1,
          borderColor: C.line,
          backgroundColor: C.white,
        }}
      >
        {/* Active item context banner */}
        {!!activeItemName && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: isMobile ? 12 : 16,
              paddingVertical: 9,
              backgroundColor: '#EFF5E9',
              borderBottomWidth: 1,
              borderColor: '#DCE5D3',
              gap: 8,
            }}
          >
            <Row style={{ gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Icon name="leaf" size={14} color={C.green} />
              <Txt size={12} weight="600" color={C.ink} numberOfLines={1} style={{ flexShrink: 1 }}>
                Asking about:{' '}
                <Txt size={12} weight="700" color={C.green}>
                  {activeItemName}
                </Txt>
              </Txt>
              {context?.category && <Badge text={context.category} />}
            </Row>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear item context"
              hitSlop={8}
              onPress={clearActiveItem}
              style={({ pressed, hovered }) => ({
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: pressed ? '#D3DFC7' : hovered ? '#DFE9D5' : 'transparent',
              })}
            >
              <Txt size={11} color={C.muted} weight="600">
                Clear
              </Txt>
            </Pressable>
          </View>
        )}

        {/* Scrollable Message List */}
        <ScrollView
          ref={messagesRef}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{
            padding: isMobile ? 12 : 18,
            paddingBottom: isMobile ? 16 : 24,
            gap: 12,
            flexGrow: 1,
            justifyContent: !state.messages.length ? 'center' : 'flex-start',
          }}
          onContentSizeChange={() => {
            if (state.messages.length) {
              scrollToBottom(50);
            }
          }}
        >
          {!state.messages.length ? (
            /* Empty State */
            <View
              style={{
                alignItems: 'center',
                paddingVertical: isMobile ? 12 : 24,
                paddingHorizontal: isMobile ? 8 : 16,
                gap: 10,
                width: '100%',
                maxWidth: 580,
                alignSelf: 'center',
              }}
            >
              <View
                style={{
                  width: isMobile ? 48 : 56,
                  height: isMobile ? 48 : 56,
                  borderRadius: isMobile ? 14 : 18,
                  backgroundColor: '#EBF1E3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                }}
              >
                <Icon name="chat" size={isMobile ? 24 : 28} color={C.green} />
              </View>

              <Txt
                size={isMobile ? 17 : 20}
                weight="600"
                style={{ textAlign: 'center', letterSpacing: -0.3 }}
              >
                {activeItemName ? `Ask about ${activeItemName}` : 'What are you sorting today?'}
              </Txt>

              <Txt
                size={13}
                color={C.muted}
                style={{ textAlign: 'center', maxWidth: 380, lineHeight: 19 }}
              >
                Choose a common prompt below or type your own question about recycling, organics, or
                e-waste.
              </Txt>

              <View
                style={{
                  width: '100%',
                  marginTop: 10,
                  gap: 8,
                  flexDirection: isDesktop ? 'row' : 'column',
                  flexWrap: isDesktop ? 'wrap' : 'nowrap',
                  justifyContent: 'space-between',
                }}
              >
                {suggestionChips.map((chip, idx) => (
                  <Pressable
                    key={idx}
                    accessibilityRole="button"
                    accessibilityLabel={chip}
                    disabled={busy}
                    onPress={() => send(chip)}
                    style={({ pressed, hovered }) => ({
                      width: isDesktop ? '48.5%' : '100%',
                      backgroundColor: pressed ? '#E2EBD6' : hovered ? '#EBF1E3' : '#F9FAF6',
                      borderColor: '#D5DFCD',
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      minHeight: 46,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      opacity: busy ? 0.5 : 1,
                    })}
                  >
                    <Row style={{ gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <Icon name="sparkle" size={14} color={C.green} />
                      <Txt
                        size={12}
                        weight="500"
                        color={C.ink}
                        numberOfLines={2}
                        style={{ flex: 1, minWidth: 0, lineHeight: 17 }}
                      >
                        {chip}
                      </Txt>
                    </Row>
                    <Icon name="chevron" size={13} color={C.muted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            /* Messages Stream */
            state.messages.map((m) => {
              const isOpen = !!openContexts[m.id];
              const isUser = m.role === 'user';

              if (isUser) {
                return (
                  <View
                    key={m.id}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: isMobile ? '86%' : '75%',
                      alignItems: 'flex-end',
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: C.green,
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderRadius: 18,
                        borderBottomRightRadius: 4,
                        shadowColor: '#1B5E3F',
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 1,
                      }}
                    >
                      <Txt size={14} color="#FFFFFF" style={{ lineHeight: 21 }}>
                        {m.text}
                      </Txt>
                    </View>
                  </View>
                );
              }

              // Assistant message
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: 'stretch',
                    width: '100%',
                    backgroundColor: '#F7F9F3',
                    borderWidth: 1,
                    borderColor: '#E2E8D8',
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    padding: isMobile ? 12 : 16,
                    gap: 10,
                  }}
                >
                  {/* Assistant header avatar & role */}
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Row style={{ gap: 8, alignItems: 'center' }}>
                      <Image
                        source={require('@/assets/images/logo.png')}
                        style={{ width: 22, height: 22 }}
                        resizeMode="contain"
                        accessibilityLabel="Sortify logo"
                      />
                      <Txt size={12} weight="600" color={C.ink}>
                        Sortify Assistant
                      </Txt>
                    </Row>
                  </Row>

                  {/* Rendered markdown message */}
                  <AssistantMessageRenderer text={m.text} isMobile={isMobile} />

                  {/* Disposal guide action button if item was matched */}
                  {!!m.itemId && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open disposal guide"
                      onPress={() =>
                        router.push({ pathname: '/result', params: { id: m.itemId! } })
                      }
                      style={({ pressed, hovered }) => ({
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: pressed ? '#E2EBD6' : hovered ? '#EBF1E3' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#CBD8C2',
                        marginTop: 2,
                        minHeight: 38,
                      })}
                    >
                      <Icon name="book" size={14} color={C.green} />
                      <Txt size={12} weight="600" color={C.green}>
                        View disposal guide
                      </Txt>
                      <Icon name="chevron" size={12} color={C.green} />
                    </Pressable>
                  )}

                  {/* Collapsible RAG Sources & Pipeline Traces Accordion */}
                  {(!!m.ragContext || !!m.ragTraces) && (
                    <View style={{ marginTop: 2 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Toggle RAG knowledge sources and traces"
                        onPress={() => toggleContext(m.id)}
                        style={({ pressed, hovered }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: isOpen
                            ? '#E2EBD6'
                            : pressed
                              ? '#E2EBD6'
                              : hovered
                                ? '#EBF1E3'
                                : '#EDF2E6',
                          minHeight: 36,
                        })}
                      >
                        <Row style={{ gap: 6, alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <Icon name="book" size={13} color={C.green} />
                          <Txt
                            size={11}
                            weight="600"
                            color={C.green}
                            numberOfLines={1}
                            style={{ flexShrink: 1 }}
                          >
                            Knowledge Sources & Pipeline Traces
                          </Txt>
                        </Row>
                        <Row style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
                          {typeof m.ragTraces?.retrieval_score === 'number' && (
                            <Badge
                              text={`${Math.round(m.ragTraces.retrieval_score * 100)}% match`}
                            />
                          )}
                          <Icon name={isOpen ? 'down' : 'chevron'} size={13} color={C.green} />
                        </Row>
                      </Pressable>

                      {isOpen && (
                        <View
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#DDE5D6',
                            borderRadius: 10,
                            padding: 12,
                            gap: 10,
                            marginTop: 6,
                          }}
                        >
                          <Row style={{ gap: 6, alignItems: 'center' }}>
                            <Icon name="book" size={13} color={C.green} />
                            <Txt size={11} weight="600" color={C.ink}>
                              Retrieved Context Chunk (rag.txt)
                            </Txt>
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
                            <Txt
                              size={11}
                              color={C.ink}
                              style={{
                                lineHeight: 18,
                                fontFamily: Platform.select({
                                  ios: 'Courier',
                                  default: 'monospace',
                                }),
                              }}
                            >
                              {m.ragContext || 'Retrieved context from rag.txt'}
                            </Txt>
                          </View>

                          {!!m.ragTraces && (
                            <>
                              <Row style={{ gap: 6, alignItems: 'center', marginTop: 2 }}>
                                <Icon name="chart" size={13} color={C.green} />
                                <Txt size={11} weight="600" color={C.ink}>
                                  RAG Pipeline Traces
                                </Txt>
                              </Row>
                              <View
                                style={{
                                  backgroundColor: '#F8F9F4',
                                  borderRadius: 6,
                                  padding: 10,
                                  borderWidth: 1,
                                  borderColor: '#EDF0E8',
                                  gap: 5,
                                }}
                              >
                                <Row
                                  style={{
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 4,
                                  }}
                                >
                                  <Txt size={11} color={C.muted}>
                                    Model:
                                  </Txt>
                                  <Txt size={11} weight="600" color={C.ink}>
                                    {m.ragTraces.model || 'Qwen/Qwen2.5-1.5B-Instruct'}
                                  </Txt>
                                </Row>
                                <Row
                                  style={{
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 4,
                                  }}
                                >
                                  <Txt size={11} color={C.muted}>
                                    Retrieval latency:
                                  </Txt>
                                  <Txt size={11} color={C.ink}>
                                    {m.ragTraces.retrieval_ms ?? 12} ms
                                  </Txt>
                                </Row>
                                <Row
                                  style={{
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 4,
                                  }}
                                >
                                  <Txt size={11} color={C.muted}>
                                    Generation latency:
                                  </Txt>
                                  <Txt size={11} color={C.ink}>
                                    {m.ragTraces.generation_ms ?? 45} ms
                                  </Txt>
                                </Row>
                                <Row
                                  style={{
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 4,
                                  }}
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
                                      gap: 4,
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
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Assistant Busy / Typing Indicator */}
          {busy && (
            <View
              style={{
                alignSelf: 'flex-start',
                maxWidth: isMobile ? '90%' : '80%',
                backgroundColor: '#F5F7F1',
                borderWidth: 1,
                borderColor: '#E2E8D8',
                borderRadius: 16,
                borderTopLeftRadius: 4,
                padding: isMobile ? 12 : 14,
                gap: 8,
              }}
            >
              <Row style={{ gap: 8, alignItems: 'center' }}>
                <Image
                  source={require('@/assets/images/logo.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                  accessibilityLabel="Sortify logo"
                />
                <Txt size={12} weight="600" color={C.ink}>
                  Sortify Assistant
                </Txt>
                <Badge text="Searching rag.txt" />
              </Row>
              <Row style={{ gap: 8, alignItems: 'center', paddingLeft: 2 }}>
                <ActivityIndicator size="small" color={C.green} />
                <Txt size={12} color={C.muted} accessibilityLiveRegion="polite">
                  Consulting waste guide and generating answer…
                </Txt>
              </Row>
            </View>
          )}
        </ScrollView>

        {/* Pinned Chat Input Field */}
        <View
          style={{
            paddingHorizontal: isMobile ? 10 : 14,
            paddingTop: isMobile ? 8 : 10,
            paddingBottom: isMobile ? 8 : 10,
            borderTopWidth: 1,
            borderColor: C.line,
            backgroundColor: C.white,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAF5',
              borderWidth: 1.5,
              borderColor: '#DFE5D7',
              borderRadius: 22,
              paddingLeft: isMobile ? 12 : 14,
              paddingRight: 6,
              paddingVertical: 4,
              gap: 10,
            }}
          >
            <Icon name="chat" size={16} color={C.muted} />

            <TextInput
              accessibilityLabel="Ask a question about waste sorting"
              placeholder={
                activeItemName
                  ? `Ask about ${activeItemName.toLowerCase()}…`
                  : 'Ask about an item, material, or bin…'
              }
              placeholderTextColor="#8A9684"
              value={draft}
              onChangeText={setDraft}
              maxLength={1000}
              multiline={true}
              onFocus={() => {
                scrollToBottom(100);
              }}
              onKeyPress={(e: any) => {
                if (
                  Platform.OS === 'web' &&
                  e.nativeEvent?.key === 'Enter' &&
                  !e.nativeEvent?.shiftKey
                ) {
                  e.preventDefault?.();
                  send();
                }
              }}
              onSubmitEditing={() => {
                if (Platform.OS !== 'web') {
                  send();
                }
              }}
              returnKeyType="send"
              editable={!busy}
              style={[
                {
                  flex: 1,
                  minHeight: 38,
                  maxHeight: isMobile ? 80 : 100,
                  fontSize: 14,
                  lineHeight: 20,
                  color: C.ink,
                  paddingTop: 9,
                  paddingBottom: 9,
                  paddingHorizontal: 0,
                  textAlignVertical: 'center',
                },
                Platform.OS === 'web'
                  ? ({ outlineStyle: 'none', outlineWidth: 0, height: draft.includes('\n') ? undefined : 38 } as any)
                  : undefined,
              ]}
            />

            {draft.length > 0 && !busy && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear message input"
                hitSlop={8}
                onPress={() => setDraft('')}
                style={({ pressed }) => ({
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? '#D2DDD0' : '#E2EBDC',
                })}
              >
                <Icon name="close" size={13} color={C.ink} />
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !draft.trim() || busy }}
              disabled={!draft.trim() || busy}
              hitSlop={6}
              onPress={() => send()}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor:
                  !draft.trim() || busy ? '#DCE3D4' : pressed ? '#144B31' : C.green,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              })}
            >
              <Icon name="send" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {isDesktop && (
            <Txt size={11} color={C.muted} style={{ textAlign: 'center', marginTop: 5 }}>
              Press{' '}
              <Txt size={11} weight="600" color={C.ink}>
                Enter
              </Txt>{' '}
              to send,{' '}
              <Txt size={11} weight="600" color={C.ink}>
                Shift + Enter
              </Txt>{' '}
              for new line
            </Txt>
          )}
        </View>
      </Card>
    </View>
  );
}
