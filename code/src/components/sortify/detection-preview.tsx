import { BoundingBox } from '@/services/recognition';
import { Image, LayoutChangeEvent, Pressable, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Row, Txt } from './ui';

type Size = { width: number; height: number };

export type DetectionBoxItem = {
  box: BoundingBox;
  label: string;
  confidence?: number;
};

export function DetectionPreview({
  uri,
  box,
  label,
  boxes,
  activeIndex = 0,
  onSelectIndex,
}: {
  uri: string;
  box?: BoundingBox;
  label?: string;
  boxes?: DetectionBoxItem[];
  activeIndex?: number;
  onSelectIndex?: (index: number) => void;
}) {
  const [frame, setFrame] = useState<Size>({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  const itemsToRender: DetectionBoxItem[] =
    boxes && boxes.length > 0
      ? boxes
      : box && label
        ? [{ box, label }]
        : [];

  const totalItems = itemsToRender.length;
  const safeActiveIndex = Math.max(0, Math.min(totalItems - 1, activeIndex));
  const activeItem = itemsToRender[safeActiveIndex];

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent?.pageX ?? null;
    touchStartY.current = e.nativeEvent?.pageY ?? null;
  };

  const handleTouchEnd = (e: any) => {
    if (touchStartX.current === null || totalItems <= 1) return;
    const endX = e.nativeEvent?.pageX ?? touchStartX.current;
    const endY = e.nativeEvent?.pageY ?? (touchStartY.current ?? 0);
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - (touchStartY.current ?? endY);
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        onSelectIndex?.((safeActiveIndex + 1) % totalItems);
      } else {
        onSelectIndex?.(safeActiveIndex === 0 ? totalItems - 1 : safeActiveIndex - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <View
      accessibilityLabel="Detection preview with focused bounding box"
      onLayout={onLayout}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        height: 260,
        borderRadius: 18,
        backgroundColor: '#0F1A13',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#1D3325',
      }}
    >
      <Image
        source={{ uri }}
        resizeMode="contain"
        onLoad={onLoad}
        style={{ width: '100%', height: '100%' }}
      />

      {scale > 0 && activeItem && (
        (() => {
          const left = offset.x + activeItem.box.x * displayed.width;
          const top = offset.y + activeItem.box.y * displayed.height;
          const width = Math.max(32, activeItem.box.width * displayed.width);
          const height = Math.max(32, activeItem.box.height * displayed.height);

          return (
            <View
              key={safeActiveIndex}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                borderWidth: 2,
                borderColor: '#2EC27E',
                backgroundColor: 'rgba(46, 194, 126, 0.12)',
                borderRadius: 10,
                zIndex: 10,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
              }}
            />
          );
        })()
      )}

      {totalItems > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 26, 19, 0.88)',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.14)',
            zIndex: 20,
          }}
        >
          <Row style={{ gap: 8, alignItems: 'center', flexShrink: 1 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#1B5E3F',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={11} weight="700" color="#FFFFFF">
                {safeActiveIndex + 1}
              </Txt>
            </View>
            <Txt size={12} weight="600" color="#FFFFFF" numberOfLines={1} style={{ flexShrink: 1 }}>
              {activeItem?.label || 'Item'}
              {activeItem?.confidence ? ` · ${activeItem.confidence}%` : ''}
            </Txt>
          </Row>

          <Row style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <Pressable
              hitSlop={8}
              onPress={() => onSelectIndex?.(safeActiveIndex === 0 ? totalItems - 1 : safeActiveIndex - 1)}
              accessibilityRole="button"
              accessibilityLabel="Previous detected item"
              style={({ pressed }) => ({
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Txt size={11} weight="600" color="#FFFFFF">
                ‹ Prev
              </Txt>
            </Pressable>

            <Pressable
              hitSlop={8}
              onPress={() => onSelectIndex?.((safeActiveIndex + 1) % totalItems)}
              accessibilityRole="button"
              accessibilityLabel="Next detected item"
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: '#1B5E3F',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Txt size={11} weight="600" color="#FFFFFF">
                Next ›
              </Txt>
            </Pressable>
          </Row>
        </View>
      )}
    </View>
  );
}
