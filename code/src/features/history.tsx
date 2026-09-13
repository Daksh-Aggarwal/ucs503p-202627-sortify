import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { categories } from '@/data/catalog';
import {
  Button,
  C,
  Card,
  Empty,
  Field,
  Heading,
  Icon,
  IconButton,
  ItemRow,
  Row,
  Txt,
} from '@/components/sortify/ui';
import { Pagination, Segments } from '@/components/sortify/controls';
import { Milestone, StatsSummary } from '@/components/sortify/progress';
export default function HistoryScreen() {
  const { state, update, notify } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [remove, setRemove] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const scans = state.scans.filter((scan) => {
    const item = state.items.find((i) => i.id === scan.itemId);
    return (
      item &&
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter !== 'Sorted' || scan.sorted) &&
      (filter !== 'To sort' || !scan.sorted)
    );
  });
  const currentPage = Math.min(page, Math.max(0, Math.ceil(scans.length / 6) - 1));
  return (
    <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
      <Heading title="History" />
      <Field
        placeholder="Search history"
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setPage(0);
        }}
      />
      <View style={{ marginTop: 16 }}>
        <Segments
          options={['All', 'Sorted', 'To sort']}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(0);
          }}
        />
      </View>
      {scans.length ? (
        <Card style={{ paddingHorizontal: 16, paddingVertical: 0 }}>
          {scans.slice(currentPage * 6, (currentPage + 1) * 6).map((scan) => {
            const item = state.items.find((i) => i.id === scan.itemId)!;
            return (
              <View key={scan.id}>
                <Row style={{ gap: 4 }}>
                  <View style={{ flex: 1 }}>
                    <ItemRow
                      item={item}
                      subtitle={`${new Date(scan.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${scan.sorted ? 'Sorted' : 'To sort'} · ${scan.source === 'demo' ? 'Demo' : 'Manual'}`}
                      onPress={() =>
                        router.push({
                          pathname: '/result',
                          params: { id: item.id, scanId: scan.id },
                        })
                      }
                      end={<></>}
                    />
                  </View>
                  <IconButton
                    name="trash"
                    label={`Remove ${item.name} from history`}
                    onPress={() => setRemove(remove === scan.id ? null : scan.id)}
                  />
                </Row>
                {remove === scan.id && (
                  <View style={{ paddingVertical: 14, gap: 10 }}>
                    <Txt size={13}>Remove this saved item?</Txt>
                    <Row>
                      <Button
                        title="Remove"
                        variant="danger"
                        onPress={() => {
                          update((s) => ({ ...s, scans: s.scans.filter((v) => v.id !== scan.id) }));
                          setRemove(null);
                          notify('Removed from history.');
                        }}
                      />
                      <Button title="Keep" variant="secondary" onPress={() => setRemove(null)} />
                    </Row>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      ) : (
        <Empty
          title="No saved items"
          text="Scan an item or search the guide to get started."
          action={<Button title="Scan an item" icon="scan" onPress={() => router.push('/scan')} />}
        />
      )}
      <Pagination page={currentPage} total={scans.length} pageSize={6} onChange={setPage} />
    </View>
  );
}
export function ActivityScreen() {
  const { state } = useApp();
  const [view, setView] = useState('This week');
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
    <View style={{ maxWidth: 950, width: '100%', alignSelf: 'center' }}>
      <Heading title="Activity" />
      <StatsSummary />
      <View style={{ marginVertical: 16 }}>
        <Milestone />
      </View>
      <Card style={{ padding: 20 }}>
        <Segments options={['This week', 'Categories']} value={view} onChange={setView} />
        {view === 'This week' ? (
          <>
            <Txt size={13} color={C.muted}>
              Saved items in the last seven days
            </Txt>
            <Row style={{ height: 185, alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
              {days.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  <Txt size={12} color={C.muted}>
                    {d.count}
                  </Txt>
                  <View
                    accessibilityRole="image"
                    accessibilityLabel={`${d.label}: ${d.count} saved items`}
                    style={{
                      height: 8 + (d.count / dayMax) * 115,
                      width: '100%',
                      maxWidth: 50,
                      borderRadius: 5,
                      backgroundColor: i === 6 ? C.green : '#B5C79A',
                    }}
                  />
                  <Txt size={12} color={C.muted}>
                    {d.label}
                  </Txt>
                </View>
              ))}
            </Row>
          </>
        ) : (
          <View style={{ gap: 16 }}>
            {totals.map((c) => (
              <View key={c.name} style={{ gap: 7 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row>
                    <Icon name={c.icon} size={17} color={c.color} />
                    <Txt size={13}>{c.name}</Txt>
                  </Row>
                  <Txt size={13}>{c.count}</Txt>
                </Row>
                <View style={{ height: 6, backgroundColor: c.background, borderRadius: 5 }}>
                  <View
                    style={{
                      height: 6,
                      width: `${(c.count / max) * 100}%`,
                      borderRadius: 5,
                      backgroundColor: c.color,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
      <Txt size={12} color={C.muted} style={{ marginTop: 14 }}>
        Includes demo and manually saved items.
      </Txt>
    </View>
  );
}
