import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import {
  Badge,
  Button,
  C,
  Card,
  Heading,
  Icon,
  ItemArt,
  Row,
  SectionTitle,
  Txt,
} from '@/components/sortify/ui';
export default function ScanScreen() {
  const { state } = useApp();
  const { width } = useWindowDimensions();
  const [uri, setUri] = useState('');
  const [sample, setSample] = useState('bottle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function pick(camera: boolean) {
    setError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(
            'Camera access is off. Enable it in your device settings, upload a photo, or try a sample below.',
          );
          return;
        }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 10 * 1024 * 1024) {
        setError('This photo is too large. Please choose an image smaller than 10 MB.');
        return;
      }
      if (!asset.width || !asset.height || Math.min(asset.width, asset.height) < 100) {
        setError(
          'This image is too small or unreadable. Try a clear photo at least 100 × 100 pixels.',
        );
        return;
      }
      setUri(asset.uri);
    } catch {
      setError(
        'The camera or photo picker could not open. Try uploading a photo or choosing a sample below.',
      );
    }
  }
  function analyze() {
    setBusy(true);
    setError('');
    timer.current = setTimeout(() => {
      setBusy(false);
      if (failed) {
        setError(
          'The demo prediction service is unavailable. Retry with the error scenario off, or find your item in the waste guide.',
        );
        return;
      }
      router.push({
        pathname: '/result',
        params: { id: sample, confidence: uncertain ? '46' : '98', source: 'demo' },
      });
    }, 1600);
  }
  return (
    <View>
      <Heading
        eyebrow="ONE ITEM. ONE BETTER CHOICE."
        title="Let’s find its right place."
        subtitle="A clear photo is the first step to a better ending."
      />
      <Row style={{ marginBottom: 26, gap: 16, flexWrap: 'wrap' }}>
        {['Capture an item', 'Understand the result', 'Sort with confidence'].map((t, i) => (
          <Row key={t} style={{ gap: 8 }}>
            <View
              style={{
                width: 25,
                height: 25,
                borderRadius: 20,
                backgroundColor: i === 0 ? C.green : '#E9EDE3',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={11} color={i === 0 ? 'white' : C.muted}>
                {i + 1}
              </Txt>
            </View>
            <Txt size={12} color={i === 0 ? C.green : C.muted}>
              {t}
            </Txt>
            {i < 2 && <Icon name="chevron" size={13} color="#B7BEAE" />}
          </Row>
        ))}
      </Row>
      <View style={{ flexDirection: width > 1100 ? 'row' : 'column', gap: 24 }}>
        <Card style={{ flex: 1.6, gap: 20 }}>
          <View
            style={{
              minHeight: 265,
              borderRadius: 15,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#BACBAD',
              backgroundColor: '#F5F7EF',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 26,
              gap: 16,
            }}
          >
            {uri ? (
              <Image
                accessibilityLabel="Selected waste photo"
                source={{ uri }}
                style={{ height: 230, width: '100%', borderRadius: 12 }}
                resizeMode="contain"
              />
            ) : (
              <>
                <View style={{ padding: 20, borderRadius: 24, backgroundColor: '#E9EFDE' }}>
                  <Icon name="scan" size={45} strokeWidth={1.2} />
                </View>
                <Txt size={21} weight="500">
                  A new perspective on waste.
                </Txt>
                <Txt color={C.muted} size={12} style={{ textAlign: 'center' }}>
                  Place one item in good lighting.{'\n'}Keep it in focus, with a simple background.
                </Txt>
                <Txt size={10} color="#929B89">
                  IMAGES UP TO 10 MB
                </Txt>
              </>
            )}
          </View>
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              title={uri ? 'Replace photo' : 'Upload a photo'}
              icon="upload"
              variant="secondary"
              onPress={() => pick(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Take a photo"
              icon="camera"
              onPress={() => pick(true)}
              style={{ flex: 1 }}
            />
          </Row>
          {!!uri && <Button title="Remove photo" variant="ghost" onPress={() => setUri('')} />}
          <View style={{ gap: 12 }}>
            <SectionTitle
              title={uri ? 'Choose a demo result for this photo' : 'Or explore with a sample'}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {state.items
                .filter((i) => ['bottle', 'banana', 'box', 'battery', 'charger'].includes(i.id))
                .map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sample === item.id }}
                    onPress={() => setSample(item.id)}
                    style={{
                      flex: 1,
                      minWidth: 90,
                      borderWidth: 1,
                      borderColor: sample === item.id ? C.green : C.line,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                      gap: 9,
                      backgroundColor: sample === item.id ? '#F1F5E9' : 'white',
                    }}
                  >
                    <ItemArt item={item} size={43} />
                    <Txt size={10} style={{ textAlign: 'center' }}>
                      {item.name}
                    </Txt>
                  </Pressable>
                ))}
            </View>
          </View>
          {!!error && (
            <View
              accessibilityRole="alert"
              style={{ padding: 14, backgroundColor: '#FAEDE7', borderRadius: 9 }}
            >
              <Txt color="#9A543D" size={12}>
                {error}
              </Txt>
            </View>
          )}
          {busy && (
            <Row accessibilityLiveRegion="polite">
              <ActivityIndicator color={C.green} />
              <Txt color={C.muted}>Preparing your demo result…</Txt>
            </Row>
          )}
          <Button title="Identify item · demo" icon="sparkle" loading={busy} onPress={analyze} />
          <Txt size={11} color={C.muted}>
            No AI is connected yet. Your selected sample determines the result, including when you
            upload a photo. Photos stay in this session.
          </Txt>
        </Card>
        <View style={{ flex: 1, gap: 20 }}>
          <Card style={{ backgroundColor: '#EDF2E3', gap: 20 }}>
            <Icon name="leaf" size={29} />
            <Txt size={23} weight="500">
              Make the first shot count.
            </Txt>
            {[
              'One item at a time',
              'Natural, even lighting',
              'A clear, uncluttered background',
            ].map((t, i) => (
              <Row key={t}>
                <Txt color="#95A17F" size={12}>
                  0{i + 1}
                </Txt>
                <Txt size={13}>{t}</Txt>
              </Row>
            ))}
          </Card>
          <Card style={{ gap: 16 }}>
            <Badge text="PROTOTYPE SCENARIOS" icon="demo" />
            <Txt size={12} color={C.muted}>
              Walk through the moments when an answer needs a little more care.
            </Txt>
            {[
              {
                label: 'Low-confidence result',
                value: uncertain,
                toggle: () => setUncertain(!uncertain),
              },
              { label: 'Service unavailable', value: failed, toggle: () => setFailed(!failed) },
            ].map((o) => (
              <Pressable
                key={o.label}
                accessibilityRole="switch"
                accessibilityState={{ checked: o.value }}
                onPress={o.toggle}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={12}>{o.label}</Txt>
                  <View
                    style={{
                      width: 36,
                      height: 22,
                      borderRadius: 20,
                      padding: 3,
                      backgroundColor: o.value ? C.green : '#DCE2D3',
                      alignItems: o.value ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <View
                      style={{ width: 16, height: 16, borderRadius: 9, backgroundColor: 'white' }}
                    />
                  </View>
                </Row>
              </Pressable>
            ))}
          </Card>
          <Button
            title="Search for an item instead"
            icon="search"
            variant="ghost"
            onPress={() => router.push('/explore')}
          />
        </View>
      </View>
    </View>
  );
}
