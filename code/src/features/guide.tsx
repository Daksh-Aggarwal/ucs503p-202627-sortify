import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/state/app-state';
import { categories, lessons } from '@/data/catalog';
import {
  Badge,
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
export default function GuideScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(category || 'All items');
  const items = state.items.filter(
    (i) =>
      (filter === 'All items' || i.category === filter) &&
      `${i.name} ${i.material} ${i.keywords.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <View>
      <Heading
        eyebrow="LESS GUESSWORK. MORE KNOW-HOW."
        title="There’s a place for everything."
        subtitle="Find your item and give it the right next chapter."
        action={<Button title="Scan instead" icon="scan" onPress={() => router.push('/scan')} />}
      />
      <Row
        style={{
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 12,
          paddingLeft: 16,
          marginBottom: 18,
        }}
      >
        <Icon name="search" color={C.muted} />
        <View style={{ flex: 1 }}>
          <Field
            placeholder="Search bottles, batteries, food scraps…"
            value={query}
            onChangeText={setQuery}
            style={{ borderWidth: 0, backgroundColor: 'transparent', minHeight: 53 }}
          />
        </View>
        {!!query && <Button title="Clear" variant="ghost" onPress={() => setQuery('')} />}
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 27 }}>
        {['All items', ...categories.map((c) => c.name)].map((c) => (
          <Button
            key={c}
            title={c}
            variant={filter === c ? 'primary' : 'secondary'}
            onPress={() => setFilter(c)}
            style={{ minHeight: 36, paddingVertical: 8, paddingHorizontal: 14 }}
          />
        ))}
      </View>
      <SectionTitle
        title={`${items.length} ${items.length === 1 ? 'item' : 'items'} to get to know`}
      />
      {!items.length && (
        <Empty
          title="No match just yet."
          text="Try another material or a simpler name, or explore all five categories."
          action={
            <Button
              title="Reset search"
              onPress={() => {
                setQuery('');
                setFilter('All items');
              }}
            />
          }
        />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/result', params: { id: item.id, source: 'manual' } })
            }
            style={({ hovered }) => ({
              flexGrow: 1,
              flexBasis: 250,
              maxWidth: 500,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: hovered ? '#A5B78F' : C.line,
              padding: 22,
              backgroundColor: 'white',
              gap: 17,
            })}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <ItemArt item={item} />
              <Icon name="arrow" color="#A1AC95" size={18} />
            </Row>
            <View>
              <Txt size={18} weight="500">
                {item.name}
              </Txt>
              <Txt color={C.muted} size={11}>
                {item.material}
              </Txt>
            </View>
            <CategoryBadge category={item.category} />
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 30 }}>
        <SectionTitle
          title="A little knowledge goes a long way"
          action="All stories"
          onPress={() => router.push('/learn')}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {lessons.slice(0, 2).map((lesson, i) => (
            <Pressable
              key={lesson.title}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/learn', params: { article: String(i) } })}
              style={{ flex: 1, minWidth: 240 }}
            >
              <Card style={{ backgroundColor: lesson.color, gap: 15, borderWidth: 0 }}>
                <Row>
                  <Icon name={lesson.icon} />
                  <Txt size={9} weight="600" color={C.muted} style={{ letterSpacing: 1.5 }}>
                    {lesson.tag}
                  </Txt>
                </Row>
                <Txt size={21} weight="500">
                  {lesson.title}
                </Txt>
                <Txt color={C.muted} size={11}>
                  {lesson.time} ↗
                </Txt>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
export function LearnScreen() {
  const { article } = useLocalSearchParams<{ article?: string }>();
  const [active, setActive] = useState<number | null>(
    article != null && lessons[Number(article)] ? Number(article) : null,
  );
  const lesson = active !== null ? lessons[active] : null;
  return (
    <View>
      <Heading
        eyebrow="THE EVERYDAY FIELD GUIDE"
        title={lesson ? lesson.title : 'Better habits begin here.'}
        subtitle={
          lesson ? lesson.intro : 'A few minutes of reading. A fresh way of seeing everyday waste.'
        }
      />
      {lesson ? (
        <Card style={{ maxWidth: 850, gap: 25 }}>
          <Badge text={`${lesson.tag} · ${lesson.time}`} />
          <View
            style={{
              alignItems: 'center',
              padding: 35,
              backgroundColor: lesson.color,
              borderRadius: 14,
            }}
          >
            <Icon name={lesson.icon} size={75} strokeWidth={1} />
          </View>
          {lesson.paragraphs.map((p, i) => (
            <Txt key={p} size={16} style={{ lineHeight: 29 }}>
              {p}
            </Txt>
          ))}
          <Button
            title="Back to all stories"
            icon="back"
            variant="secondary"
            onPress={() => setActive(null)}
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      ) : (
        <View style={{ gap: 20 }}>
          {lessons.map((l, i) => (
            <Pressable accessibilityRole="button" key={l.title} onPress={() => setActive(i)}>
              <Card style={{ gap: 14, backgroundColor: l.color }}>
                <Row>
                  <Icon name={l.icon} size={30} />
                  <Badge text={`${l.tag} · ${l.time}`} background="#FFFFFF77" />
                </Row>
                <Txt size={25} weight="500">
                  {l.title}
                </Txt>
                <Txt color={C.muted}>{l.intro}</Txt>
                <Row>
                  <Txt size={12} weight="600">
                    Read the story
                  </Txt>
                  <Icon name="arrow" size={17} />
                </Row>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
