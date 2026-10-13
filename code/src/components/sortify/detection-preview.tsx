import { BoundingBox } from '@/services/recognition';
import { Image, LayoutChangeEvent, NativeSyntheticEvent, View } from 'react-native';
import { useState } from 'react';
import { C, Txt } from './ui';

type Size = { width: number; height: number };

export function DetectionPreview({
  uri,
  box,
  label,
}: {
  uri: string;
  box: BoundingBox;
  label: string;
}) {
  const [frame, setFrame] = useState<Size>({ width: 0, height: 0 });
  const [image, setImage] = useState<Size>({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => setFrame(event.nativeEvent.layout);
  const onLoad = (event: NativeSyntheticEvent<{ source: Size }>) =>
    setImage(event.nativeEvent.source);
  const scale =
    image.width && image.height
      ? Math.min(frame.width / image.width, frame.height / image.height)
      : 0;
  const displayed = { width: image.width * scale, height: image.height * scale };
  const offset = {
    x: (frame.width - displayed.width) / 2,
    y: (frame.height - displayed.height) / 2,
  };
  return (
    <View
      accessibilityLabel={`Detected ${label}`}
      onLayout={onLayout}
      style={{ height: 260, borderRadius: 14, backgroundColor: '#1C2D23', overflow: 'hidden' }}
    >
      <Image
        source={{ uri }}
        resizeMode="contain"
        onLoad={onLoad}
        style={{ width: '100%', height: '100%' }}
      />
      {!!scale && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: offset.x + box.x * displayed.width,
            top: offset.y + box.y * displayed.height,
            width: box.width * displayed.width,
            height: box.height * displayed.height,
            borderWidth: 3,
            borderColor: '#CFF56B',
            borderRadius: 5,
          }}
        >
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#CFF56B',
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Txt size={11} weight="600" color={C.ink}>
              {label}
            </Txt>
          </View>
        </View>
      )}
    </View>
  );
}
