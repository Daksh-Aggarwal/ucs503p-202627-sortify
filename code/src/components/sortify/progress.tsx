import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { C, Txt } from './ui';

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
    <View style={[styles.stats, fontScale >= 1.3 && styles.stackedStats]}>
      {[
        { label: 'Items logged', value: state.scans.length },
        { label: 'Items sorted', value: sorted },
        { label: 'Categories', value: `${categoryCount}/5` },
      ].map(({ label, value }) => (
        <View key={label} style={[styles.stat, fontScale >= 1.3 && styles.stackedStat]}>
          <Txt size={24} weight="700" style={styles.value}>
            {value}
          </Txt>
          <Txt size={14} color={C.muted} style={styles.caption}>
            {label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function Milestone({ link = false }: { link?: boolean }) {
  const { state } = useApp();
  const sorted = state.scans.filter((s) => s.sorted).length;
  const goal = [5, 10, 25, 50, 100].find((n) => n > sorted) ?? (Math.floor(sorted / 50) + 1) * 50;

  return (
    <View style={styles.milestone}>
      <Txt accessibilityRole="header" size={16} weight="600" style={styles.goal}>
        Sorting goal
      </Txt>
      <Txt size={14} color={C.muted} style={styles.caption}>
        {sorted} of {goal} items sorted
      </Txt>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Sorting goal"
        accessibilityValue={{ min: 0, max: goal, now: sorted }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${Math.min(sorted / goal, 1) * 100}%` }]} />
      </View>
      {link && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/activity')}
          style={({ pressed, hovered }) => [
            styles.activityLink,
            (pressed || hovered) && styles.activityFeedback,
          ]}
        >
          <Txt size={14} weight="600" color={C.green} style={styles.caption}>
            View activity
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  stackedStats: { flexDirection: 'column' },
  stat: { flexGrow: 1, flexBasis: '25%', minWidth: 72, gap: 4 },
  stackedStat: { flexBasis: 'auto' },
  value: { lineHeight: 32, fontVariant: ['tabular-nums'] },
  caption: { lineHeight: 20 },
  milestone: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#B9C2B5',
    paddingTop: 16,
    gap: 8,
  },
  goal: { lineHeight: 24 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#CFD8C9', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.green },
  activityLink: {
    alignSelf: 'flex-start',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activityFeedback: { backgroundColor: C.sage },
});
