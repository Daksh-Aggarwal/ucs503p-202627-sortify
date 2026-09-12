import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Button, C, Icon, Row, Txt } from './ui';
export function Segments({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#EDF0E7',
        marginBottom: 20,
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="tab"
          accessibilityState={{ selected: option === value }}
          aria-selected={option === value}
          {...(Platform.OS === 'web'
            ? {
                tabIndex: option === value ? (0 as const) : (-1 as const),
                onKeyDown: (event: {
                  key: string;
                  preventDefault: () => void;
                  currentTarget: HTMLElement;
                }) => {
                  const index = options.indexOf(option);
                  const next =
                    event.key === 'ArrowRight'
                      ? (index + 1) % options.length
                      : event.key === 'ArrowLeft'
                        ? (index - 1 + options.length) % options.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? options.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  onChange(options[next]);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLElement>('[role="tab"]')
                    [next]?.focus();
                },
              }
            : {})}
          onPress={() => onChange(option)}
          style={({ hovered }) => ({
            flexGrow: 1,
            minHeight: 44,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: value === option ? 'white' : hovered ? '#E3E9DB' : 'transparent',
          })}
        >
          <Txt
            weight={value === option ? '600' : '400'}
            size={13}
            color={value === option ? C.green : C.muted}
          >
            {option}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
export function Disclosure({
  title,
  children,
  icon = 'help',
}: React.PropsWithChildren<{ title: string; icon?: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: 1, borderColor: C.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 48, paddingVertical: 12 }}
      >
        <Row>
          <Icon name={icon} size={17} />
          <Txt size={13} weight="500" style={{ flex: 1 }}>
            {title}
          </Txt>
          <Icon name={open ? 'down' : 'chevron'} size={16} />
        </Row>
      </Pressable>
      {open && <View style={{ paddingBottom: 16, gap: 12 }}>{children}</View>}
    </View>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap' }}>
      <Button
        title="Previous"
        variant="secondary"
        disabled={page === 0}
        onPress={() => onChange(page - 1)}
      />
      <Txt accessibilityLiveRegion="polite" size={12} color={C.muted}>
        {page + 1} of {pages}
      </Txt>
      <Button
        title="Next"
        variant="secondary"
        disabled={page >= pages - 1}
        onPress={() => onChange(page + 1)}
      />
    </Row>
  );
}
