import { BoundingBox } from '@/services/recognition';
import { Image, LayoutChangeEvent, Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
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

  return (
    <View
      accessibilityLabel="Detection preview with focused bounding box"
      onLayout={onLayout}
      style={{
        height: 290,
        borderRadius: 16,
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

      {/* Render ONLY the single active item's bounding box to eliminate visual clutter */}
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
            >
              {/* Focused identification badge on the active box */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#143825',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderBottomRightRadius: 8,
                  borderTopLeftRadius: 7,
                  borderWidth: 1,
                  borderLeftWidth: 0,
                  borderTopWidth: 0,
                  borderColor: 'rgba(46, 194, 126, 0.45)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#2EC27E',
                  }}
                />
                <Txt size={11} weight="700" color="#FFFFFF">
                  {totalItems > 1 ? `#${safeActiveIndex + 1} ` : ''}
                  {activeItem.label}
                  {activeItem.confidence ? ` (${activeItem.confidence}%)` : ''}
                </Txt>
              </View>
            </View>
          );
        })()
      )}

      {/* Sleek bottom overlay pagination bar for multi-item stepping */}
      {totalItems > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 26, 19, 0.90)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.14)',
            zIndex: 20,
          }}
        >
          {/* Active Item Title & Quick Jump Dots */}
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#1B5E3F',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt size={11} weight="700" color="#FFFFFF">
                {safeActiveIndex + 1}
              </Txt>
            </View>
            <Txt size={12} weight="600" color="#FFFFFF">
              {activeItem?.label || 'Item'}
            </Txt>

            {/* Direct jump dot indicators */}
            <Row style={{ gap: 4, alignItems: 'center', marginLeft: 4 }}>
              {itemsToRender.map((_, dotIdx) => {
                const isCurrent = dotIdx === safeActiveIndex;
                return (
                  <Pressable
                    key={dotIdx}
                    onPress={() => onSelectIndex?.(dotIdx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to item ${dotIdx + 1}`}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={{
                      width: isCurrent ? 14 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isCurrent ? '#2EC27E' : 'rgba(255, 255, 255, 0.28)',
                    }}
                  />
                );
              })}
            </Row>
          </Row>

          {/* Stepper buttons */}
          <Row style={{ gap: 6, alignItems: 'center' }}>
            <Pressable
              disabled={safeActiveIndex === 0}
              onPress={() => onSelectIndex?.(Math.max(0, safeActiveIndex - 1))}
              accessibilityRole="button"
              accessibilityLabel="Previous detected item"
              style={({ pressed }) => ({
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: safeActiveIndex === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
                opacity: safeActiveIndex === 0 ? 0.35 : pressed ? 0.7 : 1,
              })}
            >
              <Txt size={11} weight="600" color="#FFFFFF">
                ‹ Prev
              </Txt>
            </Pressable>

            <Pressable
              disabled={safeActiveIndex === totalItems - 1}
              onPress={() => onSelectIndex?.(Math.min(totalItems - 1, safeActiveIndex + 1))}
              accessibilityRole="button"
              accessibilityLabel="Next detected item"
              style={({ pressed }) => ({
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor:
                  safeActiveIndex === totalItems - 1
                    ? 'transparent'
                    : '#1B5E3F',
                opacity: safeActiveIndex === totalItems - 1 ? 0.35 : pressed ? 0.7 : 1,
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
