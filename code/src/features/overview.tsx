import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { Button, C, Heading, Row, SortIllustration, Txt } from '@/components/sortify/ui';
import { Milestone, StatsSummary } from '@/components/sortify/progress';
export default function Overview() {
  const { state } = useApp();
  const { width } = useWindowDimensions();
  return (
    <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center' }}>
      <Heading title={state.profile ? `Hi, ${state.profile.name.split(' ')[0]}` : 'Overview'} />
      <View
        style={{
          borderRadius: 20,
          backgroundColor: '#E8EDDB',
          padding: 24,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <Row style={{ gap: 20 }}>
          <View style={{ flex: 1, gap: 12 }}>
            <Txt size={28} weight="500" style={{ letterSpacing: -0.8, lineHeight: 34 }}>
              Ready to sort?
            </Txt>
            <Txt color={C.muted} style={{ maxWidth: 360 }}>
              Take a photo to find the right disposal method.
            </Txt>
            <Button
              title="Scan an item"
              icon="scan"
              onPress={() => router.push('/scan')}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            />
          </View>
          {width >= 700 && (
            <View style={{ marginVertical: -32 }}>
              <SortIllustration small />
            </View>
          )}
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <Txt size={17} weight="600">
          Your progress
        </Txt>
        <Button
          title="View activity"
          variant="ghost"
          onPress={() => router.push('/activity')}
          style={{ paddingHorizontal: 0 }}
        />
      </Row>
      <StatsSummary />
      <View style={{ marginTop: 16 }}>
        <Milestone />
      </View>
    </View>
  );
}
