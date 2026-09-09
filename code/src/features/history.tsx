import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { categories } from '@/data/catalog';
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
  SectionTitle,
  Txt,
} from '@/components/sortify/ui';
export default function HistoryScreen() {
  const { state, update, notify } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All discoveries');
  const [remove, setRemove] = useState<string | null>(null);
  const scans = state.scans.filter((scan) => {
    const item = state.items.find((i) => i.id === scan.itemId);
    return (
      item &&
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter !== 'Sorted' || scan.sorted) &&
      (filter !== 'To sort' || !scan.sorted)
    );
  });
  return (
    <View>
      <Heading
        eyebrow="YOUR SORTING JOURNEY"
        title="Every discovery, in one place."
        subtitle="Revisit what you learned and pick up where you left off."
        action={<Button title="Scan an item" icon="plus" onPress={() => router.push('/scan')} />}
      />
      <Field placeholder="Search your history…" value={query} onChangeText={setQuery} />
      <Row style={{ marginVertical: 18, flexWrap: 'wrap' }}>
        {['All discoveries', 'Sorted', 'To sort'].map((t) => (
          <Button
            key={t}
            title={t}
            variant={filter === t ? 'primary' : 'secondary'}
            onPress={() => setFilter(t)}
          />
        ))}
      </Row>
      {scans.length ? (
        <Card>
          {scans.map((scan) => {
            const item = state.items.find((i) => i.id === scan.itemId)!;
            return (
              <View key={scan.id}>
                <ItemRow
                  item={item}
                  subtitle={`${new Date(scan.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${scan.source === 'demo' ? 'Demo scan' : 'Manual selection'}`}
                  onPress={() =>
                    router.push({ pathname: '/result', params: { id: item.id, scanId: scan.id } })
                  }
                  end={
                    <Badge
                      text={scan.sorted ? 'Sorted' : 'To sort'}
                      icon={scan.sorted ? 'check' : 'clock'}
                    />
                  }
                />
                <Row style={{ justifyContent: 'flex-end' }}>
                  {remove === scan.id ? (
                    <>
                      <Txt size={11} color={C.muted}>
                        Remove this saved item?
                      </Txt>
                      <Button
                        title="Remove"
                        variant="danger"
                        onPress={() => {
                          update((s) => ({ ...s, scans: s.scans.filter((v) => v.id !== scan.id) }));
                          setRemove(null);
                          notify('Item removed from history.');
                        }}
                      />
                      <Button title="Keep" variant="ghost" onPress={() => setRemove(null)} />
                    </>
                  ) : (
                    <Button
                      title="Remove from history"
                      variant="ghost"
                      onPress={() => setRemove(scan.id)}
                      style={{ minHeight: 32, paddingVertical: 8 }}
                    />
                  )}
                </Row>
              </View>
            );
          })}
        </Card>
      ) : (
        <Empty
          title="A fresh start."
          text="No discoveries match this view. Try another search or scan your first item."
          action={<Button title="Scan an item" icon="scan" onPress={() => router.push('/scan')} />}
        />
      )}
    </View>
  );
}
export function ActivityScreen() {
  const { state } = useApp();
  const { width } = useWindowDimensions();
  const sorted = state.scans.filter((s) => s.sorted);
  const totals = categories.map((c) => ({
    ...c,
    count: state.scans.filter(
      (scan) => state.items.find((i) => i.id === scan.itemId)?.category === c.name,
    ).length,
  }));
  const max = Math.max(1, ...totals.map((t) => t.count));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return {
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: state.scans.filter((s) => new Date(s.date).toDateString() === date.toDateString())
        .length,
    };
  });
  const dayMax = Math.max(1, ...days.map((d) => d.count));
  return (
    <View>
      <Heading
        eyebrow="SMALL ACTIONS ADD UP"
        title="Look how far you’re growing."
        subtitle="Your activity is a reflection of the choices you make, one item at a time."
      />
      <Row style={{ flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 24 }}>
        {[
          { label: 'Items explored', value: state.scans.length, icon: 'scan' },
          { label: 'Marked as sorted', value: sorted.length, icon: 'leaf' },
          {
            label: 'Categories discovered',
            value: totals.filter((t) => t.count > 0).length,
            icon: 'target',
          },
        ].map((t) => (
          <Card key={t.label} style={{ flex: 1, minWidth: 170, gap: 12 }}>
            <Icon name={t.icon} />
            <Txt size={38} weight="500">
              {t.value}
            </Txt>
            <Txt size={12} color={C.muted}>
              {t.label}
            </Txt>
          </Card>
        ))}
      </Row>
      <View style={{ flexDirection: width > 1100 ? 'row' : 'column', gap: 22 }}>
        <Card style={{ flex: 1 }}>
          <SectionTitle title="Your last seven days" />
          <Txt size={12} color={C.muted}>
            Saved discoveries
          </Txt>
          <Row style={{ height: 210, alignItems: 'flex-end', gap: 15, marginTop: 25 }}>
            {days.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 9 }}>
                <Txt size={11} color={C.muted}>
                  {d.count}
                </Txt>
                <View
                  accessibilityLabel={`${d.label}: ${d.count} saved discoveries`}
                  style={{
                    height: 8 + (d.count / dayMax) * 135,
                    width: '100%',
                    maxWidth: 55,
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    backgroundColor: i === 6 ? C.green : '#CFDCBA',
                  }}
                />
                <Txt size={10} color={C.muted}>
                  {d.label}
                </Txt>
              </View>
            ))}
          </Row>
        </Card>
        <Card style={{ flex: 1 }}>
          <SectionTitle title="A little of everything" />
          <View style={{ gap: 22 }}>
            {totals.map((c) => (
              <View key={c.name} style={{ gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row>
                    <Icon name={c.icon} color={c.color} size={16} />
                    <Txt size={12}>{c.name}</Txt>
                  </Row>
                  <Txt size={12}>{c.count}</Txt>
                </Row>
                <View style={{ height: 7, borderRadius: 7, backgroundColor: c.background }}>
                  <View
                    style={{
                      height: 7,
                      width: `${(c.count / max) * 100}%`,
                      borderRadius: 7,
                      backgroundColor: c.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>
      <Card style={{ marginTop: 22, backgroundColor: '#EAF0DF' }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name="sprout" size={35} />
          <View style={{ flex: 1, gap: 8 }}>
            <Txt size={21} weight="500">
              Your next little milestone: five sorted items.
            </Txt>
            <Txt color={C.muted} size={13}>
              {sorted.length >= 5
                ? 'You’ve reached this milestone. Keep the good habits going.'
                : `${5 - sorted.length} more to go. Every thoughtful choice counts.`}
            </Txt>
            <View style={{ height: 7, backgroundColor: '#D8E1CB', borderRadius: 8, marginTop: 6 }}>
              <View
                style={{
                  height: 7,
                  width: `${Math.min(sorted.length / 5, 1) * 100}%`,
                  borderRadius: 8,
                  backgroundColor: C.green,
                }}
              />
            </View>
          </View>
        </Row>
      </Card>
      <Txt size={11} color={C.muted} style={{ marginTop: 16 }}>
        Activity reflects saved demo and manual entries. Environmental impact estimates are not
        calculated.
      </Txt>
    </View>
  );
}
