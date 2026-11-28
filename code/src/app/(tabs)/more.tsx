import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Shell } from '@/components/sortify/shell';
import { C, Card, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
import { useApp } from '@/state/app-state';

const moreItems = [
  { href: '/history', label: 'History', subtitle: 'Past scans & saved items', icon: 'history' },
  { href: '/activity', label: 'Activity', subtitle: 'Weekly stats & categories', icon: 'chart' },
  { href: '/learn', label: 'Learn', subtitle: 'Practical sorting guides', icon: 'leaf' },
  {
    href: '/profile',
    label: 'Settings & profile',
    subtitle: 'Location, account & data',
    icon: 'settings',
  },
  { href: '/admin', label: 'Admin panel', subtitle: 'Catalog & feedback review', icon: 'shield' },
];

export default function MoreTab() {
  const { state } = useApp();

  return (
    <Shell>
      <View style={{ gap: 16 }}>
        <Heading title="More" subtitle="History, learning guides, settings & tools." />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: 16,
            backgroundColor: pressed ? '#E8EFE0' : C.white,
            borderWidth: 1,
            borderColor: C.line,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#DDE7CE',
            }}
          >
            <Txt weight="600" size={14} color={C.green}>
              {state.profile?.name.slice(0, 2).toUpperCase() || 'YO'}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={15} weight="600">
              {state.profile?.name || 'Guest'}
            </Txt>
            <Txt color={C.muted} size={12}>
              {state.profile ? state.profile.email : 'Tap to sign in or manage profile'}
            </Txt>
          </View>
          <Icon name="chevron" size={16} color={C.muted} />
        </Pressable>

        <Card style={{ padding: 8, gap: 4 }}>
          {moreItems.map((item) => (
            <Pressable
              key={item.href}
              accessibilityRole="button"
              onPress={() => router.push(item.href as Href)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 10,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: pressed ? '#F2F5EC' : 'transparent',
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#F2F4EC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={item.icon} size={18} color={C.muted} />
              </View>
              <Row style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="500" color={C.ink}>
                    {item.label}
                  </Txt>
                  <Txt size={11} color={C.muted}>
                    {item.subtitle}
                  </Txt>
                </View>
                <Icon name="chevron" size={15} color={C.muted} />
              </Row>
            </Pressable>
          ))}
        </Card>
      </View>
    </Shell>
  );
}
