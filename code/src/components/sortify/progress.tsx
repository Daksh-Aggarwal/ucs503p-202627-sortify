import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const pct = Math.min(sorted / goal, 1);
  const [progressAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [pct, progressAnim]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.milestone}>
      <View style={styles.milestoneHeader}>
        <Txt accessibilityRole="header" size={16} weight="600" style={styles.goal}>
          Sorting goal
        </Txt>
        <Txt size={13} weight="600" color={C.green}>
          {Math.round(pct * 100)}%
        </Txt>
      </View>
      <Txt size={14} color={C.muted} style={styles.caption}>
        {sorted} of {goal} items sorted
      </Txt>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Sorting goal"
        accessibilityValue={{ min: 0, max: goal, now: sorted }}
        style={styles.track}
      >
        <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
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
  stats: { flexDirection: 'row', gap: 10 },
  stackedStats: { flexDirection: 'column' },
  stat: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 13,
    shadowColor: '#1B5E3F',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stackedStat: { flexBasis: 'auto' },
  value: { lineHeight: 28, fontVariant: ['tabular-nums'] },
  caption: { lineHeight: 18 },
  milestone: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: '#1B5E3F',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goal: { lineHeight: 24 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#DDE4D4', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
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
