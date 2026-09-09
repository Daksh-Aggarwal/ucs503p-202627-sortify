import { Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/app-state';
import { categories } from '@/data/catalog';
import {
  Badge,
  Button,
  C,
  Card,
  Heading,
  Icon,
  ItemRow,
  Row,
  SectionTitle,
  SortIllustration,
  Txt,
} from '@/components/sortify/ui';
export default function Overview() {
  const { state } = useApp();
  const { width } = useWindowDimensions();
  const wide = width > 1150;
  const mobile = width < 650;
  const sorted = state.scans.filter((s) => s.sorted).length;
  const catCount = new Set(
    state.scans.map((s) => state.items.find((i) => i.id === s.itemId)?.category),
  ).size;
  return (
    <View>
      <Heading
        eyebrow="A SMALL STEP FOR YOU. A BIG STEP FOR OUR PLANET."
        title={
          state.profile
            ? `Hello, ${state.profile.name.split(' ')[0]}.`
            : 'Good things start with a small sort.'
        }
        subtitle="Less guesswork. Better habits. Let’s make a little difference today."
      />
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 20 }}>
        <View
          style={{
            flex: 1.95,
            borderRadius: 20,
            backgroundColor: '#E8EDDB',
            padding: mobile ? 26 : 32,
            minHeight: 292,
            overflow: 'hidden',
          }}
        >
          <Row style={{ flex: 1, gap: 0 }}>
            <View style={{ flex: 1, gap: 15, zIndex: 1 }}>
              <Badge
                text="A BETTER WAY TO THROW AWAY"
                color="#5F754B"
                background="#DFE7D0"
                icon="sparkle"
              />
              <Txt
                size={mobile ? 31 : 36}
                weight="500"
                style={{ lineHeight: mobile ? 37 : 42, letterSpacing: -1.2, maxWidth: 370 }}
              >
                Every item has{'\n'}a right place.
              </Txt>
              <Txt color="#718063" size={13} style={{ maxWidth: 280 }}>
                Snap a photo. Know where it goes.{'\n'}Give waste a better ending.
              </Txt>
              <Button
                title="Scan an item"
                icon="scan"
                onPress={() => router.push('/scan')}
                style={{ alignSelf: 'flex-start', marginTop: 5 }}
              />
            </View>
            {!mobile && (
              <View style={{ width: wide ? 245 : 300, marginRight: -28, marginVertical: -20 }}>
                <SortIllustration small={wide} />
              </View>
            )}
          </Row>
        </View>
        <Card
          style={{
            flex: 1,
            backgroundColor: '#F4F2E9',
            borderColor: '#E9E7DB',
            justifyContent: 'space-between',
            gap: 22,
            padding: 26,
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={10} weight="600" color="#89866D" style={{ letterSpacing: 1.8 }}>
              ONE GOOD HABIT
            </Txt>
            <Icon name="sprout" size={25} color="#8C9871" />
          </Row>
          <View style={{ gap: 10 }}>
            <Txt size={22} weight="500" style={{ letterSpacing: -0.5 }}>
              Empty. Rinse. Recycle.
            </Txt>
            <Txt size={13} color="#868674">
              A quick rinse keeps food residue from spoiling other recyclables. Small effort, better
              recycling.
            </Txt>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/learn')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={12} weight="500">
                A little more know-how
              </Txt>
              <Icon name="arrow" size={18} />
            </Row>
          </Pressable>
        </Card>
      </View>
      <View
        style={{
          flexDirection: mobile ? 'column' : 'row',
          gap: 14,
          marginTop: 20,
          marginBottom: 34,
        }}
      >
        {[
          {
            value: state.scans.length.toString().padStart(2, '0'),
            title: 'Items explored',
            text: 'Every item is a chance to learn',
            icon: 'scan',
          },
          {
            value: sorted.toString().padStart(2, '0'),
            title: 'Items marked sorted',
            text: 'Small actions, real intention',
            icon: 'leaf',
          },
          {
            value: `${catCount} / 5`,
            title: 'Categories discovered',
            text: 'Keep your curiosity growing',
            icon: 'target',
          },
        ].map((stat) => (
          <Card key={stat.title} style={{ flex: 1, padding: 22 }}>
            <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View>
                <Txt size={11} color={C.muted}>
                  {stat.title}
                </Txt>
                <Txt size={32} weight="500" style={{ letterSpacing: -1, marginTop: 3 }}>
                  {stat.value}
                </Txt>
              </View>
              <View style={{ backgroundColor: '#F2F5EA', padding: 9, borderRadius: 10 }}>
                <Icon name={stat.icon} size={19} color="#7C9362" />
              </View>
            </Row>
            <Txt size={10} color="#979F8E" style={{ marginTop: 7 }}>
              {stat.text}
            </Txt>
          </Card>
        ))}
      </View>
      <SectionTitle
        title="A place for everything"
        action="Explore the guide"
        onPress={() => router.push('/explore')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 34 }}>
        {categories.map((cat) => (
          <Pressable
            accessibilityRole="button"
            key={cat.name}
            onPress={() => router.push({ pathname: '/explore', params: { category: cat.name } })}
            style={({ hovered }) => ({
              flex: 1,
              minWidth: mobile ? 135 : 110,
              padding: 19,
              paddingVertical: 23,
              gap: 17,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 14,
              backgroundColor: hovered ? cat.background : C.white,
            })}
          >
            <View
              style={{
                backgroundColor: cat.background,
                borderRadius: 12,
                width: 43,
                height: 43,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name={cat.icon} color={cat.color} size={23} />
            </View>
            <Row style={{ justifyContent: 'space-between', gap: 3 }}>
              <Txt size={12} weight="500">
                {cat.name}
              </Txt>
              <Icon name="chevron" size={13} color="#A2AA97" />
            </Row>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 22 }}>
        <Card style={{ flex: 1.95 }}>
          <SectionTitle
            title="Your recent discoveries"
            action="View history"
            onPress={() => router.push('/history')}
          />
          {state.scans.length ? (
            state.scans.slice(0, 3).map((scan) => {
              const item = state.items.find((i) => i.id === scan.itemId);
              return item ? (
                <ItemRow
                  key={scan.id}
                  item={item}
                  subtitle={`${new Date(scan.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${scan.source === 'demo' ? 'Demo scan' : 'Manual selection'}`}
                  onPress={() =>
                    router.push({ pathname: '/result', params: { id: item.id, scanId: scan.id } })
                  }
                />
              ) : null;
            })
          ) : (
            <Txt color={C.muted}>Your first discovery is just a scan away.</Txt>
          )}
          <Txt size={10} color="#98A08F" style={{ marginTop: 14 }}>
            Sample activity is included to help you explore the prototype.
          </Txt>
        </Card>
        <Card style={{ flex: 1, backgroundColor: '#EFF3E7', gap: 18 }}>
          <View
            style={{
              width: 43,
              height: 43,
              borderRadius: 13,
              backgroundColor: '#E0E9D3',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chat" size={23} />
          </View>
          <View style={{ gap: 10 }}>
            <Txt size={23} weight="500" style={{ letterSpacing: -0.5 }}>
              A little unsure?{'\n'}Let’s sort it out.
            </Txt>
            <Txt color={C.muted} size={12}>
              From tricky packaging to old chargers, your sorting companion is here to help.
            </Txt>
          </View>
          <Button
            title="Ask Sortify"
            icon="arrow"
            variant="secondary"
            onPress={() => router.push('/assistant')}
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      </View>
    </View>
  );
}
