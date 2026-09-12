import { Disclosure, Segments } from '@/components/sortify/controls';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { Button, C, Card, Heading, Icon, ItemArt, Row, Txt } from '@/components/sortify/ui';
export default function ScanScreen() {
  const { state } = useApp();
  const [mode, setMode] = useState('Photo');
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
  const samples = state.items.filter((i) =>
    ['bottle', 'banana', 'box', 'battery', 'charger'].includes(i.id),
  );
  return (
    <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Heading title="Scan an item" />
      <Segments
        options={['Photo', 'Samples']}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError('');
        }}
      />
      <Card style={{ gap: 16, padding: 20 }}>
        {mode === 'Photo' && (
          <>
            <View
              style={{
                height: 180,
                borderRadius: 12,
                backgroundColor: '#F1F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 16,
              }}
            >
              {uri ? (
                <Image
                  accessibilityLabel="Selected waste photo"
                  source={{ uri }}
                  style={{ height: 150, width: '100%', borderRadius: 10 }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Icon name="scan" size={42} />
                  <Txt size={13} color={C.muted}>
                    One item, clearly in focus.
                  </Txt>
                  <Txt size={12} color={C.muted}>
                    Images up to 10 MB
                  </Txt>
                </>
              )}
            </View>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button
                title="Take photo"
                icon="camera"
                onPress={() => pick(true)}
                style={{ flexGrow: 1 }}
              />
              <Button
                title={uri ? 'Replace photo' : 'Upload photo'}
                icon="upload"
                variant="secondary"
                onPress={() => pick(false)}
                style={{ flexGrow: 1 }}
              />
            </Row>
            {!!uri && <Button title="Remove photo" variant="ghost" onPress={() => setUri('')} />}
          </>
        )}
        {(mode === 'Samples' || !!uri) && (
          <>
            <Txt size={13} color={C.muted}>
              {uri && mode === 'Photo'
                ? 'Choose the demo result for this photo.'
                : 'Choose an item to try the scan flow.'}
            </Txt>
            <View style={{ gap: 4 }}>
              {samples.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sample === item.id }}
                  aria-checked={sample === item.id}
                  onPress={() => setSample(item.id)}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: sample === item.id ? '#EFF4E7' : 'transparent',
                    minHeight: 48,
                  }}
                >
                  <Row>
                    <ItemArt item={item} size={32} />
                    <Txt style={{ flex: 1 }}>{item.name}</Txt>
                    <Icon
                      name={sample === item.id ? 'success' : 'plus'}
                      size={18}
                      color={sample === item.id ? C.green : C.muted}
                    />
                  </Row>
                </Pressable>
              ))}
            </View>
            <Button
              title="Identify item · demo"
              icon="scan"
              loading={busy}
              disabled={!samples.some((i) => i.id === sample)}
              onPress={analyze}
            />
            <Txt size={12} color={C.muted}>
              Simulated prediction. The selected sample determines the result; photos stay on this
              device.
            </Txt>
          </>
        )}
        {!!error && (
          <View
            accessibilityRole="alert"
            style={{ padding: 14, backgroundColor: '#FAEDE7', borderRadius: 9 }}
          >
            <Txt color="#914A32" size={13}>
              {error}
            </Txt>
          </View>
        )}
      </Card>
      <Button
        title="Search the waste guide"
        icon="search"
        variant="ghost"
        onPress={() => router.push('/explore')}
        style={{ marginVertical: 12 }}
      />
      <Disclosure title="Photo tips">
        <Txt size={13} color={C.muted}>
          Use even lighting and a plain background. Keep the whole item in frame. If the image is
          unclear, retake it or search the guide.
        </Txt>
      </Disclosure>
      <Disclosure title={`Demo options${uncertain || failed ? ' · active' : ''}`} icon="demo">
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
            aria-checked={o.value}
            onPress={o.toggle}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={13}>{o.label}</Txt>
              <View
                style={{
                  width: 38,
                  height: 24,
                  borderRadius: 20,
                  padding: 3,
                  backgroundColor: o.value ? C.green : '#CED6C4',
                  alignItems: o.value ? 'flex-end' : 'flex-start',
                }}
              >
                <View
                  style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white' }}
                />
              </View>
            </Row>
          </Pressable>
        ))}
      </Disclosure>
    </View>
  );
}
