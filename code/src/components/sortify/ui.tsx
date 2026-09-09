import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  ScanLine,
  LayoutDashboard,
  BookOpen,
  History,
  MessageCircle,
  Settings,
  Leaf,
  Recycle,
  Sprout,
  Trash2,
  Plug,
  ShieldCheck,
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Plus,
  Search,
  Upload,
  CircleHelp,
  SlidersHorizontal,
  LogOut,
  Mail,
  User,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  CircleCheck,
  TriangleAlert,
  Send,
  Pencil,
  BarChart3,
  RotateCcw,
  ImagePlus,
  Bookmark,
  Menu,
  MoreHorizontal,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { categories, Category, WasteItem } from '@/data/catalog';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
export const C = {
  green: Palette.primary,
  ink: '#213D30',
  muted: '#7B847A',
  bg: '#F8F9F4',
  line: '#E6E9E0',
  sage: '#E9EEDC',
  lime: '#DBEDAF',
  white: '#FFFFFF',
};
const icons: Record<string, LucideIcon> = {
  arrow: ArrowRight,
  back: ArrowLeft,
  camera: Camera,
  scan: ScanLine,
  home: LayoutDashboard,
  book: BookOpen,
  history: History,
  chat: MessageCircle,
  settings: Settings,
  leaf: Leaf,
  recycle: Recycle,
  sprout: Sprout,
  trash: Trash2,
  plug: Plug,
  shield: ShieldCheck,
  pin: MapPin,
  down: ChevronDown,
  chevron: ChevronRight,
  close: X,
  check: Check,
  plus: Plus,
  search: Search,
  upload: Upload,
  help: CircleHelp,
  filter: SlidersHorizontal,
  logout: LogOut,
  mail: Mail,
  user: User,
  sparkle: Sparkles,
  trend: TrendingUp,
  target: Target,
  clock: Clock,
  success: CircleCheck,
  warning: TriangleAlert,
  send: Send,
  edit: Pencil,
  chart: BarChart3,
  reset: RotateCcw,
  image: ImagePlus,
  bookmark: Bookmark,
  menu: Menu,
  more: MoreHorizontal,
  demo: FlaskConical,
};
export function Icon({
  name,
  size = 20,
  color = C.green,
  strokeWidth = 1.65,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Component = icons[name] || Leaf;
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}
export function Txt({
  children,
  size = 14,
  color = C.ink,
  weight = '400',
  style,
  ...rest
}: React.ComponentProps<typeof Text> & {
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
}) {
  return (
    <Text
      {...rest}
      style={[{ fontSize: size, color, fontWeight: weight, lineHeight: size * 1.5 }, style]}
    >
      {children}
    </Text>
  );
}
export function Row({ children, style, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View {...props} style={[s.row, style]}>
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = variant === 'primary' ? '#fff' : variant === 'danger' ? '#A44836' : C.green;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed, hovered }) => [
        s.button,
        {
          backgroundColor:
            variant === 'primary'
              ? C.green
              : variant === 'secondary'
                ? C.white
                : variant === 'danger'
                  ? '#FAEDE7'
                  : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: C.line,
          opacity: disabled ? 0.45 : pressed ? 0.65 : hovered ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : icon ? (
        <Icon name={icon} size={18} color={color} />
      ) : null}
      <Txt color={color} weight="600" size={13}>
        {title}
      </Txt>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
}: {
  name: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }) => ({
        padding: 10,
        borderRadius: 12,
        backgroundColor: hovered ? C.sage : 'transparent',
      })}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Badge({
  text,
  color = C.green,
  background = '#EAF0E2',
  icon,
}: {
  text: string;
  color?: string;
  background?: string;
  icon?: string;
}) {
  return (
    <Row
      style={{
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: background,
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      {!!icon && <Icon name={icon} size={12} color={color} />}
      <Txt size={11} weight="600" color={color}>
        {text}
      </Txt>
    </Row>
  );
}
export function CategoryBadge({ category }: { category: Category }) {
  const cat = categories.find((c) => c.name === category)!;
  return <Badge text={category} color={cat.color} background={cat.background} />;
}
export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 7 }}>
      {!!label && (
        <Txt size={12} weight="600">
          {label}
        </Txt>
      )}
      <TextInput
        accessibilityLabel={label || props.placeholder}
        placeholderTextColor="#939B92"
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6, marginBottom: 28 }}>
      {!!eyebrow && (
        <Txt size={10} weight="600" color={C.muted} style={{ letterSpacing: 2 }}>
          {eyebrow}
        </Txt>
      )}
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Txt accessibilityRole="header" size={32} weight="500" style={{ letterSpacing: -1 }}>
          {title}
        </Txt>
        {action}
      </Row>
      {!!subtitle && <Txt color={C.muted}>{subtitle}</Txt>}
    </View>
  );
}
export function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: 17 }}>
      <Txt size={18} weight="600" style={{ letterSpacing: -0.35 }}>
        {title}
      </Txt>
      {!!action && onPress && (
        <Pressable accessibilityRole="button" onPress={onPress}>
          <Row style={{ gap: 6 }}>
            <Txt size={12} color={C.green} weight="500">
              {action}
            </Txt>
            <Icon name="arrow" size={14} />
          </Row>
        </Pressable>
      )}
    </Row>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={{ alignItems: 'center', padding: 42, gap: 12 }}>
      <Icon name="leaf" size={35} />
      <Txt size={20} weight="500">
        {title}
      </Txt>
      <Txt color={C.muted} style={{ textAlign: 'center', maxWidth: 370 }}>
        {text}
      </Txt>
      {action}
    </Card>
  );
}
export function ItemArt({ item, size = 56 }: { item: WasteItem; size?: number }) {
  const cat = categories.find((c) => c.name === item.category)!;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 13,
        backgroundColor: cat.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={cat.icon} size={size * 0.43} color={cat.color} />
    </View>
  );
}
export function ItemRow({
  item,
  subtitle,
  onPress,
  end,
}: {
  item: WasteItem;
  subtitle?: string;
  onPress: () => void;
  end?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered }) => ({
        paddingVertical: 15,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderColor: C.line,
        backgroundColor: hovered ? '#F7F9F2' : 'transparent',
      })}
    >
      <Row>
        <ItemArt item={item} size={45} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt weight="500">{item.name}</Txt>
          <Txt size={11} color={C.muted}>
            {subtitle || item.material}
          </Txt>
        </View>
        {end || <CategoryBadge category={item.category} />}
        <Icon name="chevron" size={16} color={C.muted} />
      </Row>
    </Pressable>
  );
}
export function SortIllustration({ small = false }: { small?: boolean }) {
  return (
    <Svg width={small ? 240 : 300} height={small ? 225 : 280} viewBox="0 0 320 300">
      <Circle cx="164" cy="151" r="123" fill="#DDE8C9" />
      <Circle cx="164" cy="151" r="100" fill="none" stroke="#C4D4AE" strokeDasharray="3 8" />
      <Ellipse cx="159" cy="270" rx="111" ry="13" fill="#C5D5B3" />
      <G transform="rotate(-17 110 160)">
        <Rect x="68" y="103" width="65" height="132" rx="17" fill="#78A28B" />
        <Path d="M82 104V80Q82 74 90 74H110Q119 74 119 80V104" fill="#78A28B" />
        <Rect x="83" y="69" width="35" height="15" rx="4" fill="#214E38" />
        <Rect x="68" y="144" width="65" height="50" fill="#EFF2DD" />
        <Path
          d="M84 164L91 151L97 161M111 163L115 177L104 176M103 187H87L90 178"
          fill="none"
          stroke="#416F50"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </G>
      <G transform="rotate(13 206 189)">
        <Path d="M161 144H247L237 257Q205 267 171 257Z" fill="#315F46" />
        <Path
          d="M173 157L181 248M190 157L194 252M208 157V253M225 157L219 251M240 157L229 248"
          stroke="#507B58"
          strokeWidth="3"
        />
        <Rect x="155" y="134" width="98" height="17" rx="6" fill="#214C35" />
        <Rect x="184" y="125" width="39" height="10" rx="4" fill="#214C35" />
        <Circle cx="205" cy="198" r="24" fill="#DCE9C8" />
        <Path
          d="M191 196L198 184L204 193M213 191L218 204L208 202M207 211H193L197 202"
          fill="none"
          stroke="#315F46"
          strokeWidth="2.5"
        />
      </G>
      <Path d="M236 132Q255 94 258 56" fill="none" stroke="#6C884D" strokeWidth="3" />
      <Path
        d="M255 91Q220 84 236 55Q260 63 255 91M257 76Q257 39 282 37Q285 68 257 76M247 111Q252 83 282 84Q275 113 247 111"
        fill="#8BA75E"
      />
      <Path d="M50 76L53 84L61 87L53 90L50 98L47 90L39 87L47 84Z" fill="#FAFBEB" />
      <Circle cx="281" cy="180" r="5" fill="#9FB77A" />
      <Circle cx="122" cy="41" r="4" fill="#A8BC89" />
    </Svg>
  );
}
export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    padding: 24,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    fontSize: 14,
    color: C.ink,
  },
  stack: { gap: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
