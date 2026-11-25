import React, { useEffect, useState } from 'react';
import {
  Animated,
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
  const [pageAnim] = useState(() => new Animated.Value(1));
  const [pageSlide] = useState(() => new Animated.Value(0));
  const [toastAnim] = useState(() => new Animated.Value(0));
  const [sheetAnim] = useState(() => new Animated.Value(320));

  const isPrimaryTab = ['/', '/explore', '/scan', '/assistant'].includes(pathname);
  const subRouteTitle: Record<string, string> = {
    '/result': 'Disposal guide',
    '/history': 'History',
    '/activity': 'Activity',
    '/learn': 'Learn',
    '/profile': 'Settings & profile',
    '/admin': 'Admin panel',
  };
  const currentTitle =
    links.find((link) => link.href === pathname)?.label || subRouteTitle[pathname] || 'Sortify';
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    pageAnim.setValue(0.88);
    pageSlide.setValue(6);
    Animated.parallel([
      Animated.timing(pageAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(pageSlide, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [pathname, pageAnim, pageSlide]);

  useEffect(() => {
    if (notice) {
      toastAnim.setValue(0);
      Animated.spring(toastAnim, {
        toValue: 1,
        speed: 28,
        bounciness: 6,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [notice, toastAnim]);

  useEffect(() => {
    if (menuOpen) {
      sheetAnim.setValue(300);
      Animated.spring(sheetAnim, {
        toValue: 0,
        speed: 30,
        bounciness: 2,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [menuOpen, sheetAnim]);

  const locationLabelText = locationBusy
    ? 'Locating…'
    : state.location
      ? state.location
      : state.nearbyDisposalEnabled
        ? 'Enable location'
        : 'Location off';

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
              minHeight: desktop ? 64 : 56,
              paddingHorizontal: desktop ? 32 : 16,
              justifyContent: 'space-between',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 8, flexShrink: 1 }}>
              {!desktop && !isPrimaryTab && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={goBack}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 44,
                    minHeight: 44,
                    paddingRight: 8,
                    borderRadius: 10,
                    opacity: pressed ? 0.65 : 1,
                    flexShrink: 1,
                  })}
                >
                  <Icon name="back" size={19} color={C.ink} />
                  <Txt size={15} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {currentTitle}
                  </Txt>
                </Pressable>
              )}
              {!desktop && isPrimaryTab && (
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
                  <Txt size={15} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
                    Sortify
                  </Txt>
                </Pressable>
              )}
              {desktop && (
                <Row style={{ gap: 10, alignItems: 'center' }}>
                  {pathname === '/result' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Go back"
                      onPress={goBack}
                      style={({ hovered, pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: pressed ? '#E1E9D5' : hovered ? '#EFF3E7' : 'transparent',
                      })}
                    >
                      <Icon name="back" size={15} color={C.green} />
                      <Txt size={12} weight="600" color={C.green}>
                        Back
                      </Txt>
                    </Pressable>
                  )}
                  <Txt size={12} color={C.muted}>
                    {currentTitle}
                  </Txt>
                </Row>
              )}
            </Row>
            <Row style={{ gap: desktop ? 16 : 8, flexShrink: 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Location details"
                onPress={() => setLocationOpen(true)}
                style={({ hovered, pressed }) => ({
                  minHeight: 38,
                  minWidth: 44,
                  justifyContent: 'center',
                  flexShrink: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#DCE4D1',
                  backgroundColor: pressed ? '#E1E9D5' : hovered ? '#E8EEDF' : '#EFF3E7',
                })}
              >
                <Row style={{ gap: 6, flexShrink: 1 }}>
                  <Icon name="pin" size={14} color={C.green} />
                  <Txt
                    size={12}
                    weight="500"
                    color={C.ink}
                    numberOfLines={1}
                    style={{ maxWidth: width < 400 ? 120 : 210, flexShrink: 1 }}
                  >
                    {locationLabelText}
                  </Txt>
                  <Icon name="down" size={12} color={C.muted} />
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
            padding: desktop ? 32 : 14,
            paddingBottom: desktop ? 28 : 16,
            width: '100%',
            maxWidth: 1200,
            alignSelf: 'center',
          }}
        >
          <Animated.View
            style={{
              opacity: pageAnim,
              transform: [{ translateY: pageSlide }],
            }}
          >
            {children}
          </Animated.View>
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
              paddingTop: 6,
              paddingBottom: 6,
              paddingHorizontal: 6,
              gap: 4,
              shadowColor: '#1B5E3F',
              shadowOpacity: 0.05,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: -3 },
              elevation: 6,
            }}
          >
            {[
              { href: '/', label: 'Home', icon: 'home' },
              { href: '/explore', label: 'Guide', icon: 'book' },
              { href: '/scan', label: 'Scan', icon: 'scan', primary: true },
              { href: '/assistant', label: 'Assistant', icon: 'chat' },
              { href: 'more', label: 'More', icon: 'more' },
            ].map((link) => {
              const active =
                link.href === 'more'
                  ? !['/', '/scan', '/explore', '/assistant', '/result'].includes(pathname)
                  : pathname === link.href || (pathname === '/result' && link.href === '/explore');
              if (link.primary) {
                return (
                  <Pressable
                    key={link.href}
                    accessibilityRole="button"
                    accessibilityLabel="Scan an item"
                    aria-current={active ? 'page' : undefined}
                    accessibilityState={{ selected: active }}
                    onPress={() => navigate(link.href)}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      minHeight: 48,
                      minWidth: 56,
                      flex: 1,
                      borderRadius: 14,
                      backgroundColor: pressed ? '#144B31' : C.green,
                      shadowColor: '#1B5E3F',
                      shadowOpacity: active ? 0.28 : 0.18,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 3,
                    })}
                  >
                    <Icon name={link.icon} size={20} color="#FFFFFF" />
                    <Txt size={10} weight="600" color="#FFFFFF">
                      {link.label}
                    </Txt>
                  </Pressable>
                );
              }
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
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    minHeight: 48,
                    minWidth: 44,
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: active ? '#EFF3E7' : pressed ? '#F6F8F1' : 'transparent',
                  })}
                >
                  <Icon name={link.icon} size={20} color={active ? C.green : C.muted} />
                  <Txt size={11} weight={active ? '600' : '400'} color={active ? C.green : C.muted}>
                    {link.label}
                  </Txt>
                </Pressable>
              );
            })}
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
      {!!notice && (
        <Animated.View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            bottom: desktop ? 25 : 90,
            alignSelf: 'center',
            left: desktop ? 270 : 20,
            right: 20,
            backgroundColor: C.green,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 14,
            maxWidth: 600,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#14291C',
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <Icon name="check" size={16} color="#FFFFFF" />
          <Txt size={13} weight="500" color="white" style={{ flex: 1 }}>
            {notice}
          </Txt>
        </Animated.View>
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
                  {locationBusy
                    ? 'Finding location…'
                    : state.location || 'Location not yet enabled'}
                </Txt>
                {!!locationError && (
                  <Txt size={12} color="#963F2B">
                    {locationError}
                  </Txt>
                )}
                <Button
                  title={
                    locationBusy
                      ? 'Updating…'
                      : state.location
                        ? 'Refresh location'
                        : 'Allow & detect location'
                  }
                  disabled={locationBusy}
                  icon="pin"
                  onPress={() => {
                    void refreshLocation(undefined, true);
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
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#14291C66' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close navigation"
            onPress={() => setMenuOpen(false)}
            style={{ flex: 1 }}
          />
          <Animated.View
            style={{
              backgroundColor: C.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 10,
              paddingHorizontal: 20,
              paddingBottom: 24,
              gap: 14,
              transform: [{ translateY: sheetAnim }],
              shadowColor: '#14291C',
              shadowOpacity: 0.16,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: -4 },
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#D6DDD0',
                alignSelf: 'center',
                marginBottom: 4,
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate('/profile')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 14,
                backgroundColor: pressed ? '#E8EFE0' : '#F4F7EE',
                borderWidth: 1,
                borderColor: C.line,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#DDE7CE',
                }}
              >
                <Txt weight="600" size={13} color={C.green}>
                  {state.profile?.name.slice(0, 2).toUpperCase() || 'YO'}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="600">
                  {state.profile?.name || 'Guest'}
                </Txt>
                <Txt color={C.muted} size={11}>
                  {state.profile ? state.profile.email : 'Tap to sign in or manage profile'}
                </Txt>
              </View>
              <Icon name="chevron" size={16} color={C.muted} />
            </Pressable>

            <View style={{ gap: 4 }}>
              {[
                { href: '/history', label: 'History', subtitle: 'Past scans & saved items', icon: 'history' },
                { href: '/activity', label: 'Activity', subtitle: 'Weekly stats & categories', icon: 'chart' },
                { href: '/learn', label: 'Learn', subtitle: 'Practical sorting guides', icon: 'leaf' },
                { href: '/profile', label: 'Settings & profile', subtitle: 'Location, account & data', icon: 'settings' },
                { href: '/admin', label: 'Admin panel', subtitle: 'Catalog & feedback review', icon: 'shield' },
              ].map((item) => {
                const active = pathname === item.href;
                return (
                  <Pressable
                    key={item.href}
                    accessibilityRole="button"
                    onPress={() => navigate(item.href)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 11,
                      borderRadius: 12,
                      backgroundColor: active ? '#EFF3E7' : pressed ? '#F6F8F1' : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: active ? '#DCE7CC' : '#F2F4EC',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={item.icon} size={17} color={active ? C.green : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight={active ? '600' : '500'} color={active ? C.green : C.ink}>
                        {item.label}
                      </Txt>
                      <Txt size={11} color={C.muted}>
                        {item.subtitle}
                      </Txt>
                    </View>
                    <Icon name="chevron" size={15} color={C.muted} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
