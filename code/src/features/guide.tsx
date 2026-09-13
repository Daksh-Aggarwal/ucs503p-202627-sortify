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
  Empty,
  Field,
  Heading,
  Icon,
  ItemRow,
  Row,
  Txt,
} from '@/components/sortify/ui';
import { Pagination } from '@/components/sortify/controls';
export default function GuideScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(category || 'All items');
  const [page, setPage] = useState(0);
  const items = state.items.filter(
    (i) =>
      (filter === 'All items' || i.category === filter) &&
      `${i.name} ${i.material} ${i.keywords.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const currentPage = Math.min(page, Math.max(0, Math.ceil(items.length / 6) - 1));
  return (
    <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
      <Heading title="Waste guide" />
      <Field
        placeholder="Search an item or material"
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setPage(0);
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 }}>
        {['All items', ...categories.map((c) => c.name)].map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === c }}
            aria-pressed={filter === c}
            onPress={() => {
              setFilter(c);
              setPage(0);
            }}
            style={({ hovered }) => ({
              minHeight: 44,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 9,
              backgroundColor: filter === c ? C.green : hovered ? '#E8EEDF' : 'white',
              borderWidth: 1,
              borderColor: filter === c ? C.green : C.line,
            })}
          >
            <Txt size={13} color={filter === c ? 'white' : C.green}>
              {c}
            </Txt>
          </Pressable>
        ))}
      </View>
      <Txt size={12} color={C.muted} style={{ marginBottom: 10 }}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </Txt>
      {items.length ? (
        <Card style={{ paddingHorizontal: 16, paddingVertical: 0 }}>
          {items.slice(currentPage * 6, (currentPage + 1) * 6).map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              subtitle={item.category}
              end={<Icon name="arrow" size={16} />}
              onPress={() =>
                router.push({ pathname: '/result', params: { id: item.id, source: 'manual' } })
              }
            />
          ))}
        </Card>
      ) : (
        <Empty
          title="No items found"
          text="Try another search or category."
          action={
            <Button
              title="Reset search"
              onPress={() => {
                setQuery('');
                setFilter('All items');
                setPage(0);
              }}
            />
          }
        />
      )}
      <Pagination page={currentPage} total={items.length} pageSize={6} onChange={setPage} />
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
        title={lesson ? lesson.title : 'Learn'}
        subtitle={lesson ? lesson.intro : 'Practical guides to sorting waste.'}
      />
      {lesson ? (
        <Card style={{ maxWidth: 850, gap: 25 }}>
          <Badge text={`${lesson.tag} · ${lesson.time}`} />
          <View
            style={{
              alignItems: 'center',
              padding: 20,
              backgroundColor: lesson.color,
              borderRadius: 14,
            }}
          >
            <Icon name={lesson.icon} size={44} strokeWidth={1} />
          </View>
          {lesson.paragraphs.map((p, i) => (
            <Txt key={p} size={16} style={{ lineHeight: 29 }}>
              {p}
            </Txt>
          ))}
          <Button
            title="All guides"
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
                <Txt size={20} weight="500">
                  {l.title}
                </Txt>

                <Row>
                  <Txt size={12} weight="600">
                    Read guide
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
