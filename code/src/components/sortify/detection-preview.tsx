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
  onCaptureNewImage,
}: {
  uri: string;
  box?: BoundingBox;
  label?: string;
  boxes?: DetectionBoxItem[];
  activeIndex?: number;
  onSelectIndex?: (index: number) => void;
  onCaptureNewImage?: () => void;
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
    // Detect horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped left -> Next item (cycle)
        onSelectIndex?.((safeActiveIndex + 1) % totalItems);
      } else {
        // Swiped right -> Previous item (cycle)
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
            />
          );
        })()
      )}

      {/* Sleek bottom overlay pagination bar */}
      {totalItems > 0 && (
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
          <Row style={{ gap: 8, alignItems: 'center', flexShrink: 1 }}>
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
            <Txt size={12} weight="600" color="#FFFFFF" numberOfLines={1}>
              {totalItems > 1
                ? `${activeItem?.label || 'Item'}${activeItem?.confidence ? ` (${activeItem.confidence}%)` : ''}`
                : `${activeItem?.label || 'Item'} detected`}
            </Txt>

            {/* Direct jump dot indicators for multiple items */}
            {totalItems > 1 && (
              <Row style={{ gap: 5, alignItems: 'center', marginLeft: 4 }}>
                {itemsToRender.map((_, dotIdx) => {
                  const isCurrent = dotIdx === safeActiveIndex;
                  return (
                    <Pressable
                      key={dotIdx}
                      onPress={() => onSelectIndex?.(dotIdx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to item ${dotIdx + 1}`}
                      hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                      style={({ pressed, hovered }) => ({
                        width: isCurrent ? 16 : 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: isCurrent
                          ? '#2EC27E'
                          : hovered
                            ? 'rgba(255, 255, 255, 0.6)'
                            : 'rgba(255, 255, 255, 0.3)',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    />
                  );
                })}
              </Row>
            )}
          </Row>

          {/* Stepper buttons */}
          <Row style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {totalItems > 1 ? (
              <>
                <Pressable
                  onPress={() => onSelectIndex?.(safeActiveIndex === 0 ? totalItems - 1 : safeActiveIndex - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Previous detected item"
                  style={({ pressed, hovered }) => ({
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: hovered ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Txt size={11} weight="600" color="#FFFFFF">
                    ‹ Prev
                  </Txt>
                </Pressable>

                <Pressable
                  onPress={() => onSelectIndex?.((safeActiveIndex + 1) % totalItems)}
                  accessibilityRole="button"
                  accessibilityLabel="Next detected item"
                  style={({ pressed, hovered }) => ({
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: hovered ? '#237B52' : '#1B5E3F',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Txt size={11} weight="600" color="#FFFFFF">
                    Next ›
                  </Txt>
                </Pressable>
              </>
            ) : onCaptureNewImage ? (
              <Pressable
                onPress={onCaptureNewImage}
                accessibilityRole="button"
                accessibilityLabel="Capture new image"
                style={({ pressed }) => ({
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: '#1B5E3F',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Txt size={11} weight="700" color="#FFFFFF">
                  Capture new image
                </Txt>
              </Pressable>
            ) : null}
          </Row>
        </View>
      )}
    </View>
  );
}
