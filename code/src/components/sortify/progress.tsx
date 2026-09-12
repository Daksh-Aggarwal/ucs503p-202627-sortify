import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { C, Card, Icon, Row, SectionTitle, Txt } from './ui';

export function StatsSummary() {
  const { state } = useApp();
  const { fontScale } = useWindowDimensions();
  const sorted = state.scans.filter((s) => s.sorted).length;
  const categoryCount = new Set(
    state.scans.flatMap((s) => {
      const item = state.items.find((i) => i.id === s.itemId);
      return item ? [item.category] : [];
    }),
  ).size;
  return (
    <Card style={{ padding: 16 }}>
      <Row style={{ alignItems: 'stretch', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Explored', value: state.scans.length },
          { label: 'Sorted', value: sorted },
          { label: 'Categories', value: `${categoryCount}/5` },
        ].map((stat, index) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              minWidth: fontScale > 1.3 ? 110 : 65,
              borderLeftWidth: index ? 1 : 0,
              borderColor: C.line,
              paddingLeft: index ? 10 : 0,
              gap: 3,
            }}
          >
            <Txt size={30} weight="500" style={{ letterSpacing: -0.8 }}>
              {stat.value}
            </Txt>
            <Txt size={12} color={C.muted}>
              {stat.label}
            </Txt>
          </View>
        ))}
      </Row>
    </Card>
  );
}
export function Milestone({ link = false }: { link?: boolean }) {
  const { state } = useApp();
  const sorted = state.scans.filter((s) => s.sorted).length;
  const goal = [5, 10, 25, 50, 100].find((n) => n > sorted) ?? (Math.floor(sorted / 50) + 1) * 50;
  return (
    <Card style={{ backgroundColor: '#EEF3E5', borderColor: '#E0E8D5', padding: 20 }}>
      <SectionTitle
        title={`Sort ${goal} items`}
        action={link ? 'View activity' : undefined}
        onPress={link ? () => router.push('/activity') : undefined}
      />
      <Row style={{ gap: 14 }}>
        <Icon name="target" size={23} />
        <View style={{ flex: 1, gap: 9 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={12} color={C.muted}>
              {goal - sorted} to your next milestone
            </Txt>
            <Txt size={12} weight="600">
              {sorted}/{goal}
            </Txt>
          </Row>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Sorting milestone"
            accessibilityValue={{ min: 0, max: goal, now: sorted }}
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={sorted}
            style={{ height: 6, backgroundColor: '#DCE5CF', borderRadius: 6 }}
          >
            <View
              style={{
                height: 6,
                width: `${Math.min(sorted / goal, 1) * 100}%`,
                borderRadius: 6,
                backgroundColor: C.green,
              }}
            />
          </View>
        </View>
      </Row>
    </Card>
  );
}
