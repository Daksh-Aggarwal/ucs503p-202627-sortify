import { BoundingBox } from '@/services/recognition';
import { Image, LayoutChangeEvent, View } from 'react-native';
import { useEffect, useState } from 'react';
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
  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => {
        if (w && h) {
          setImageSize({ width: w, height: h });
        }
      },
      () => {
        // Fallback or ignore if getSize fails
      },
    );
  }, [uri]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) {
      setFrame({ width, height });
    }
  };

  const onLoad = (event: any) => {
    const src = event?.nativeEvent?.source;
    if (src?.width && src?.height) {
      setImageSize({ width: src.width, height: src.height });
    }
  };

  const hasImage = !!(imageSize && imageSize.width > 0 && imageSize.height > 0);
  const hasFrame = !!(frame && frame.width > 0 && frame.height > 0);

  const scale =
    hasImage && hasFrame
      ? Math.min(frame.width / imageSize.width, frame.height / imageSize.height)
      : 0;

  const displayed = {
    width: hasImage ? imageSize.width * scale : 0,
    height: hasImage ? imageSize.height * scale : 0,
  };

  const offset = {
    x: hasFrame ? (frame.width - displayed.width) / 2 : 0,
    y: hasFrame ? (frame.height - displayed.height) / 2 : 0,
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
      {scale > 0 && (
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
