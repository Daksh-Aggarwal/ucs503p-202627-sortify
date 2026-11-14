import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/state/app-state';
import { Button, C, Icon, IconButton, Row, Txt } from './ui';
const links = [
  { href: '/', label: 'Overview', icon: 'home' },
  { href: '/scan', label: 'Scan an item', icon: 'scan' },
  { href: '/explore', label: 'Waste guide', icon: 'book' },
  { href: '/history', label: 'History', icon: 'history' },
  { href: '/activity', label: 'Activity', icon: 'chart' },
  { href: '/assistant', label: 'Assistant', icon: 'chat' },
  { href: '/learn', label: 'Learn', icon: 'leaf' },
];
export function Shell({ children }: React.PropsWithChildren) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const { state, notice, refreshLocation, locationBusy, locationError } = useApp();
  const pathname = usePathname();
  const [locationOpen, setLocationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (href: string) => {
    setMenuOpen(false);
    router.navigate(href as Href);
  };
  const nav = (
    <View style={{ flex: 1, backgroundColor: '#F2F4EC', padding: 24, gap: 24 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sortify home"
        style={{ minHeight: 44, justifyContent: 'center' }}
        onPress={() => navigate('/')}
      >
        <Row style={{ gap: 8, paddingHorizontal: 8, alignItems: 'center' }}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 34, height: 34 }}
            resizeMode="contain"
            accessibilityLabel="Sortify logo"
          />
          <Txt size={28} weight="600" style={{ letterSpacing: -1.6 }}>
            sortify
            <Txt size={28} color="#7E9A53">
              .
            </Txt>
          </Txt>
        </Row>
      </Pressable>
      <View style={{ gap: 4 }}>
        {links.map((link) => {
          const active =
            pathname === link.href || (pathname === '/result' && link.href === '/explore');
          return (
            <Pressable
              key={link.href}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              aria-current={active ? 'page' : undefined}
              onPress={() => navigate(link.href)}
              style={({ hovered, pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                minHeight: 44,
                borderRadius: 8,
                backgroundColor: active
                  ? '#E0E8D6'
                  : hovered || pressed
                    ? '#E9EEDF'
                    : 'transparent',
              })}
            >
              <Icon name={link.icon} size={19} color={active ? C.green : C.muted} />
              <Txt size={13} weight={active ? '600' : '400'} color={active ? C.green : C.muted}>
                {link.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigate('/profile')}
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
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
          style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
        >
          <Row>
            <Icon name="shield" size={18} color={C.muted} />
            <Txt color={C.muted} size={12}>
              Admin panel
            </Txt>
          </Row>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigate('/profile')}
        style={{ borderTopWidth: 1, borderColor: '#DDE4D2', paddingTop: 24 }}
      >
        <Row>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
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
              {state.profile?.name || 'Guest'}
            </Txt>
            <Txt color={C.muted} size={10}>
              {state.profile ? 'Member' : 'Guest user'}
            </Txt>
          </View>
          <Icon name="chevron" size={15} />
        </Row>
      </Pressable>
    </View>
  );
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, backgroundColor: C.bg, flexDirection: 'row' }}
    >
      {desktop && (
        <SafeAreaView
          edges={['top', 'bottom']}
          style={{ width: 244, borderRightWidth: 1, borderColor: C.line }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{nav}</ScrollView>
        </SafeAreaView>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, minWidth: 0 }}
      >
        <SafeAreaView
          edges={['top']}
          style={{
            backgroundColor: C.bg,
            borderBottomWidth: 1,
            borderColor: C.line,
          }}
        >
          <Row
            style={{
              minHeight: 64,
              paddingHorizontal: desktop ? 32 : 16,
              justifyContent: 'space-between',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 8, flexShrink: 1 }}>
              {!desktop && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sortify home"
                  onPress={() => navigate('/')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 44,
                    minHeight: 44,
                    flexShrink: 1,
                  }}
                >
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                    accessibilityLabel="Sortify logo"
                  />
                  <Txt size={14} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
                    Sortify
                  </Txt>
                </Pressable>
              )}
              {desktop && (
                <Txt size={12} color={C.muted}>
                  {links.find((link) => link.href === pathname)?.label || 'Sortify'}
                </Txt>
              )}
            </Row>
            <Row style={{ gap: desktop ? 16 : 8, flexShrink: 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Location details"
                onPress={() => setLocationOpen(true)}
                style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', flexShrink: 1 }}
              >
                <Row style={{ gap: 8, flexShrink: 1 }}>
                  <Icon name="pin" size={15} color={C.muted} />
                  <Txt
                    size={12}
                    numberOfLines={1}
                    style={{ maxWidth: width < 400 ? 112 : 200, flexShrink: 1 }}
                  >
                    {locationBusy ? 'Finding location…' : state.location || 'Location unavailable'}
                  </Txt>
                  <Icon name="down" size={12} />
                </Row>
              </Pressable>
              {/* {desktop && <View style={{ height: 22, width: 1, backgroundColor: C.line }} />}
              <Badge text="Online" icon="sparkle" background="#EFF6E9" color="#4F7A28" /> */}
            </Row>
          </Row>
        </SafeAreaView>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: desktop ? 32 : 16,
            paddingBottom: 24,
            width: '100%',
            maxWidth: 1200,
            alignSelf: 'center',
          }}
        >
          {children}
        </ScrollView>
        {!desktop && (
          <SafeAreaView
            edges={{ bottom: 'maximum' }}
            style={{
              flexDirection: 'row',
              backgroundColor: C.white,
              justifyContent: 'space-around',
              borderTopWidth: 1,
              borderColor: C.line,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 0,
            }}
          >
            {[
              links[0],
              links[2],
              links[1],
              links[4],
              { href: 'more', label: 'More', icon: 'more' },
            ].map((link) => {
              const active =
                link.href === 'more'
                  ? !['/', '/scan', '/explore', '/activity', '/result'].includes(pathname)
                  : pathname === link.href || (pathname === '/result' && link.href === '/explore');
              return (
                <Pressable
                  key={link.href}
                  accessibilityRole="button"
                  accessibilityLabel={link.label}
                  aria-current={active ? 'page' : undefined}
                  aria-expanded={link.href === 'more' ? menuOpen : undefined}
                  accessibilityState={{
                    selected: active,
                    expanded: link.href === 'more' ? menuOpen : undefined,
                  }}
                  onPress={() => (link.href === 'more' ? setMenuOpen(true) : navigate(link.href))}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    minHeight: 48,
                    minWidth: 44,
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: active ? '#EFF3E7' : 'transparent',
                  }}
                >
                  <Icon name={link.icon} size={21} color={active ? C.green : C.muted} />
                  <Txt size={11} weight={active ? '600' : '400'} color={active ? C.green : C.muted}>
                    {link.href === '/'
                      ? 'Home'
                      : link.href === '/explore'
                        ? 'Guide'
                        : link.href === '/scan'
                          ? 'Scan'
                          : link.label}
                  </Txt>
                </Pressable>
              );
            })}
          </SafeAreaView>
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
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#14291C66' }}
        >
          <View
            style={{
              backgroundColor: C.white,
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              alignSelf: 'center',
              gap: 16,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={22} weight="500">
                Location
              </Txt>
              <IconButton
                name="close"
                label="Close location selector"
                onPress={() => setLocationOpen(false)}
              />
            </Row>
            <Txt color={C.muted}>
              {state.nearbyDisposalEnabled
                ? 'Sortify uses your location to find nearby drop-off sites.'
                : 'Enable nearby disposal in Settings to use your location.'}
            </Txt>
            {state.nearbyDisposalEnabled ? (
              <>
                <Txt weight="500">
                  {locationBusy ? 'Finding location…' : state.location || 'Location unavailable'}
                </Txt>
                {!!locationError && (
                  <Txt size={12} color="#963F2B">
                    {locationError}
                  </Txt>
                )}
                <Button
                  title={locationBusy ? 'Updating…' : 'Refresh location'}
                  disabled={locationBusy}
                  icon="pin"
                  onPress={() => {
                    void refreshLocation();
                  }}
                />
              </>
            ) : (
              <Button
                title="Open settings"
                onPress={() => {
                  setLocationOpen(false);
                  router.push('/profile');
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, flexDirection: 'row', backgroundColor: '#14291C66' }}>
          <View
            style={{
              width: Math.min(300, width - 60),
              backgroundColor: '#F2F4EC',
            }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{nav}</ScrollView>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
            onPress={() => setMenuOpen(false)}
            style={{ flex: 1, padding: 16 }}
          >
            <Icon name="close" color="white" />
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
