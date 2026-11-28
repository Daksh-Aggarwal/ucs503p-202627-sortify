import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { Button, C, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
import { Milestone, StatsSummary } from '@/components/sortify/progress';

const quickActions = [
  {
    href: '/explore' as const,
    icon: 'book',
    title: 'Waste guide',
    subtitle: 'Disposal rules',
  },
  {
    href: '/assistant' as const,
    icon: 'chat',
    title: 'Assistant',
    subtitle: 'Ask sorting AI',
  },
  {
    href: '/history' as const,
    icon: 'history',
    title: 'History',
    subtitle: 'Past scans',
  },
];

export default function Overview() {
  const { state } = useApp();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  return (
    <View style={styles.screen}>
      <Heading
        title={state.profile ? `Hi, ${state.profile.name.split(' ')[0]}` : 'Overview'}
        subtitle="Identify items, find the right bin, and track your sorting impact."
      />

      <View style={styles.scanPanel}>
        <Row style={{ gap: 14, alignItems: 'flex-start' }}>
          <View style={styles.heroIcon}>
            <Icon name="scan" size={24} color={C.green} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt accessibilityRole="header" size={18} weight="600" style={styles.sectionTitle}>
              Find the right bin
            </Txt>
            <Txt size={15} color={C.muted} style={styles.body}>
              Take or choose a photo for instant disposal instructions.
            </Txt>
          </View>
        </Row>
        <Button
          title="Scan an item"
          icon="scan"
          onPress={() => router.push('/scan')}
          style={styles.scanButton}
        />
      </View>

      <View style={[styles.quickGrid, isNarrow && { gap: 6 }]}>
        {quickActions.map((item) => (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed, hovered }) => [
              styles.quickCard,
              isNarrow && { padding: 9, borderRadius: 12 },
              (pressed || hovered) && styles.quickCardActive,
            ]}
          >
            <View style={[styles.quickIcon, isNarrow && { width: 30, height: 30 }]}>
              <Icon name={item.icon} size={isNarrow ? 15 : 17} color={C.green} />
            </View>
            <Txt size={isNarrow ? 12 : 13} weight="600" numberOfLines={1}>
              {item.title}
            </Txt>
            <Txt size={isNarrow ? 10 : 11} color={C.muted} numberOfLines={2} style={{ lineHeight: isNarrow ? 13 : 15 }}>
              {item.subtitle}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View style={styles.progress}>
        <View style={styles.progressHeader}>
          <Txt accessibilityRole="header" size={18} weight="600" style={styles.sectionTitle}>
            Progress
          </Txt>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/activity')}
            style={({ pressed, hovered }) => [
              styles.action,
              (pressed || hovered) && styles.activityFeedback,
            ]}
          >
            <Txt size={14} weight="600" color={C.green} style={styles.activityLabel}>
              View activity
            </Txt>
          </Pressable>
        </View>
        <StatsSummary />
        <Milestone />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', maxWidth: 1000, alignSelf: 'center', gap: 16 },
  header: { gap: 2 },
  title: { lineHeight: 34, letterSpacing: -0.6 },
  scanPanel: {
    backgroundColor: '#EDF2E5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE4D0',
    padding: 18,
    gap: 14,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#DCE8CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { lineHeight: 26 },
  body: { lineHeight: 20 },
  action: {
    minHeight: 40,
    minWidth: 44,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButton: {
    width: '100%',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    shadowColor: '#1B5E3F',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickCardActive: {
    backgroundColor: '#F5F8F0',
    borderColor: '#CED9C0',
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  actionLabel: { lineHeight: 24, flexShrink: 1 },
  progress: { gap: 14 },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  activityLabel: { lineHeight: 20, flexShrink: 1 },
  activityFeedback: { backgroundColor: C.sage },
});
