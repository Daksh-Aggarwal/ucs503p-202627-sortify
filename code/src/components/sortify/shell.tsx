import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/app-state';
import { locations } from '@/data/catalog';
import { Badge, Button, C, Icon, IconButton, Row, Txt } from './ui';
const links = [
  { href: '/', label: 'Overview', icon: 'home' },
  { href: '/scan', label: 'Scan an item', icon: 'scan' },
  { href: '/explore', label: 'Waste guide', icon: 'book' },
  { href: '/history', label: 'My history', icon: 'history' },
  { href: '/activity', label: 'My activity', icon: 'chart' },
  { href: '/assistant', label: 'Sortify assistant', icon: 'chat' },
];
export function Shell({ children }: React.PropsWithChildren) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const insets = useSafeAreaInsets();
  const { state, update, notice } = useApp();
  const pathname = usePathname();
  const [locationOpen, setLocationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (href: string) => {
    setMenuOpen(false);
    router.push(href as Href);
  };
  const nav = (
    <View style={{ flex: 1, backgroundColor: '#F2F4EC', padding: 22, paddingTop: 37, gap: 35 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sortify home"
        onPress={() => navigate('/')}
      >
        <Row style={{ gap: 9, paddingHorizontal: 8 }}>
          <View
            style={{
              width: 34,
              height: 34,
              backgroundColor: C.green,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="leaf" color="#E1EDC5" size={23} />
          </View>
          <Txt size={28} weight="600" style={{ letterSpacing: -1.6 }}>
            sortify
            <Txt size={28} color="#7E9A53">
              .
            </Txt>
          </Txt>
        </Row>
      </Pressable>
      <View style={{ gap: 6 }}>
        <Txt
          size={9}
          weight="600"
          color="#919887"
          style={{ letterSpacing: 1.8, marginLeft: 13, marginBottom: 13 }}
        >
          YOUR EVERYDAY IMPACT
        </Txt>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Pressable
              key={link.href}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => navigate(link.href)}
              style={({ hovered }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 13,
                borderRadius: 9,
                backgroundColor: active ? '#E0E8D6' : hovered ? '#E9EEDF' : 'transparent',
              })}
            >
              <Icon name={link.icon} size={19} color={active ? C.green : '#78816E'} />
              <Txt size={13} weight={active ? '600' : '400'} color={active ? C.green : '#67725F'}>
                {link.label}
              </Txt>
              {link.icon === 'chat' && (
                <View style={{ marginLeft: 'auto' }}>
                  <Icon name="sparkle" size={13} color="#8A9A75" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{ padding: 18, borderWidth: 1, borderColor: '#DDE4D2', borderRadius: 13, gap: 10 }}
      >
        <Icon name="sprout" size={26} />
        <Txt weight="500" size={14}>
          A little better, every day.
        </Txt>
        <Txt color={C.muted} size={11}>
          Small choices add up to a cleaner tomorrow.
        </Txt>
        <Pressable accessibilityRole="button" onPress={() => navigate('/learn')}>
          <Row>
            <Txt size={11} weight="600">
              Find your next good habit
            </Txt>
            <Icon name="arrow" size={14} />
          </Row>
        </Pressable>
      </View>
      <View style={{ gap: 5 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigate('/profile')}
          style={{ padding: 10 }}
        >
          <Row>
            <Icon name="settings" size={18} color={C.muted} />
            <Txt color={C.muted} size={12}>
              Settings & profile
            </Txt>
          </Row>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigate('/admin')}
          style={{ padding: 10 }}
        >
          <Row>
            <Icon name="demo" size={18} color={C.muted} />
            <Txt color={C.muted} size={12}>
              Admin demo
            </Txt>
          </Row>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigate('/profile')}
        style={{ borderTopWidth: 1, borderColor: '#DDE4D2', paddingTop: 22 }}
      >
        <Row>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E4E9D9',
            }}
          >
            <Txt weight="600" size={12}>
              {state.profile?.name.slice(0, 2).toUpperCase() || 'YO'}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={12} weight="500">
              {state.profile?.name || 'Your little corner'}
            </Txt>
            <Txt color={C.muted} size={10}>
              {state.profile ? 'Demo member' : 'Exploring as a guest'}
            </Txt>
          </View>
          <Icon name="chevron" size={15} />
        </Row>
      </Pressable>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, flexDirection: 'row' }}>
      {desktop && (
        <View style={{ width: 244, borderRightWidth: 1, borderColor: C.line }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{nav}</ScrollView>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, minWidth: 0 }}
      >
        <View
          style={{
            paddingTop: insets.top,
            backgroundColor: C.bg,
            borderBottomWidth: 1,
            borderColor: C.line,
          }}
        >
          <Row
            style={{
              minHeight: 77,
              paddingHorizontal: desktop ? 38 : 18,
              justifyContent: 'space-between',
            }}
          >
            <Row>
              {!desktop && (
                <IconButton name="menu" label="Open navigation" onPress={() => setMenuOpen(true)} />
              )}
              <Txt size={12} color={C.muted}>
                {desktop ? 'A cleaner tomorrow starts with you.' : 'sortify.'}
              </Txt>
            </Row>
            <Row style={{ gap: desktop ? 20 : 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change location"
                onPress={() => setLocationOpen(true)}
              >
                <Row style={{ gap: 7 }}>
                  <Icon name="pin" size={15} color={C.muted} />
                  <Txt size={11}>{state.location}</Txt>
                  <Icon name="down" size={12} />
                </Row>
              </Pressable>
              {desktop && <View style={{ height: 22, width: 1, backgroundColor: C.line }} />}
              <Badge text="Prototype" icon="demo" background="#F0F1EA" color="#7A846C" />
            </Row>
          </Row>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: desktop ? 38 : 20,
            paddingBottom: 40,
            width: '100%',
            maxWidth: 1390,
            alignSelf: 'center',
          }}
        >
          {children}
          <Row
            style={{
              borderTopWidth: 1,
              borderColor: C.line,
              marginTop: 35,
              paddingTop: 20,
              justifyContent: 'space-between',
            }}
          >
            <Txt size={10} color="#9CA28F">
              SORT TODAY. BETTER TOMORROW.
            </Txt>
            <Txt size={10} color="#9CA28F">
              Made with intention.
            </Txt>
          </Row>
        </ScrollView>
        {!desktop && (
          <Row
            style={{
              backgroundColor: C.white,
              justifyContent: 'space-around',
              borderTopWidth: 1,
              borderColor: C.line,
              paddingTop: 11,
              paddingBottom: Math.max(insets.bottom, 11),
              gap: 0,
            }}
          >
            {[links[0], links[2], links[1], links[3], links[5]].map((link) => (
              <Pressable
                key={link.href}
                accessibilityRole="button"
                accessibilityLabel={link.label}
                onPress={() => navigate(link.href)}
                style={{ alignItems: 'center', gap: 5 }}
              >
                <Icon
                  name={link.icon}
                  size={22}
                  color={pathname === link.href ? C.green : '#939B8D'}
                />
                <Txt
                  size={9}
                  weight={pathname === link.href ? '600' : '400'}
                  color={pathname === link.href ? C.green : C.muted}
                >
                  {link.label === 'Sortify assistant'
                    ? 'Assistant'
                    : link.icon === 'book'
                      ? 'Guide'
                      : link.icon === 'history'
                        ? 'History'
                        : link.icon === 'scan'
                          ? 'Scan'
                          : 'Home'}
                </Txt>
              </Pressable>
            ))}
          </Row>
        )}
      </KeyboardAvoidingView>
      {!!notice && (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            bottom: desktop ? 25 : 90,
            alignSelf: 'center',
            left: desktop ? 270 : 20,
            right: 20,
            backgroundColor: C.green,
            padding: 16,
            borderRadius: 12,
            maxWidth: 600,
          }}
        >
          <Txt size={13} color="white">
            {notice}
          </Txt>
        </View>
      )}
      <Modal
        transparent
        visible={locationOpen}
        animationType="fade"
        onRequestClose={() => setLocationOpen(false)}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#14291C66' }}
        >
          <View
            style={{
              backgroundColor: C.white,
              borderRadius: 20,
              padding: 25,
              width: '100%',
              maxWidth: 440,
              alignSelf: 'center',
              gap: 16,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={22} weight="500">
                Make it local.
              </Txt>
              <IconButton
                name="close"
                label="Close location selector"
                onPress={() => setLocationOpen(false)}
              />
            </Row>
            <Txt color={C.muted}>Choose your area for disposal context.</Txt>
            {locations.map((l) => (
              <Button
                key={l}
                title={l}
                icon={l === state.location ? 'check' : 'pin'}
                variant={l === state.location ? 'primary' : 'secondary'}
                onPress={() => {
                  update((s) => ({ ...s, location: l }));
                  setLocationOpen(false);
                }}
              />
            ))}
            <Txt size={11} color={C.muted}>
              Local collection details are illustrative in this demo.
            </Txt>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#14291C66' }}>
          <View style={{ width: 285, paddingTop: insets.top, backgroundColor: '#F2F4EC' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{nav}</ScrollView>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
            onPress={() => setMenuOpen(false)}
            style={{ flex: 1, padding: 20 }}
          >
            <Icon name="close" color="white" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
