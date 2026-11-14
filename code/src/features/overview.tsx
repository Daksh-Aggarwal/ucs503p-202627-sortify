import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { C, Icon, Txt } from '@/components/sortify/ui';
import { Milestone, StatsSummary } from '@/components/sortify/progress';

export default function Overview() {
  const { state } = useApp();

  return (
    <View style={styles.screen}>
      <Txt accessibilityRole="header" size={30} weight="700" style={styles.title}>
        {state.profile ? `Hi, ${state.profile.name.split(' ')[0]}` : 'Overview'}
      </Txt>

      <View style={styles.scanPanel}>
        <Txt accessibilityRole="header" size={20} weight="600" style={styles.sectionTitle}>
          Find the right bin
        </Txt>
        <Txt size={16} color={C.muted} style={styles.body}>
          Take or choose a photo for disposal instructions.
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/scan')}
          style={({ pressed, hovered }) => [
            styles.action,
            styles.scanButton,
            (pressed || hovered) && styles.scanFeedback,
          ]}
        >
          <Icon name="scan" size={20} color={C.white} />
          <Txt size={16} weight="600" color={C.white} style={styles.actionLabel}>
            Scan an item
          </Txt>
        </Pressable>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressHeader}>
          <Txt accessibilityRole="header" size={20} weight="600" style={styles.sectionTitle}>
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
  screen: { width: '100%', maxWidth: 1000, alignSelf: 'center', gap: 24 },
  title: { lineHeight: 36, letterSpacing: -0.6 },
  scanPanel: { backgroundColor: '#EDF1E7', borderRadius: 12, padding: 16, gap: 8 },
  sectionTitle: { lineHeight: 28 },
  body: { lineHeight: 24 },
  action: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 4,
    backgroundColor: C.green,
  },
  scanFeedback: { backgroundColor: '#164B33' },
  actionLabel: { lineHeight: 24, flexShrink: 1 },
  progress: { gap: 16 },
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
