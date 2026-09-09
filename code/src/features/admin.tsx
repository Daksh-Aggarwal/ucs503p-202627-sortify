import { useState } from 'react';
import { View } from 'react-native';
import { categories, type WasteItem } from '@/data/catalog';
import { useApp, uniqueId } from '@/state/app-state';
import {
  Badge,
  Button,
  C,
  Card,
  Empty,
  Field,
  Heading,
  Icon,
  ItemRow,
  Row,
  SectionTitle,
  Txt,
} from '@/components/sortify/ui';
const blank: WasteItem = {
  id: '',
  name: '',
  category: 'Recyclable',
  material: '',
  description: '',
  steps: ['', '', ''],
  keywords: [],
};
export default function AdminScreen() {
  const { state, update, notify } = useApp();
  const [tab, setTab] = useState('Waste catalog');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<WasteItem | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const pending = state.feedback.filter((f) => f.status === 'Pending');
  function save() {
    if (!editing) return;
    if (
      [editing.name, editing.material, editing.description, ...editing.steps].some((s) => !s.trim())
    ) {
      setError('Add a name, material, description, and all three disposal steps.');
      return;
    }
    const item = {
      ...editing,
      name: editing.name.trim(),
      id: editing.id || `custom-${uniqueId()}`,
      keywords: editing.name.toLowerCase().split(/\s+/),
    };
    update((s) => ({
      ...s,
      items: editing.id ? s.items.map((i) => (i.id === editing.id ? item : i)) : [...s.items, item],
    }));
    setEditing(null);
    notify('Guide entry saved. It is now available in the waste guide.');
  }
  return (
    <View>
      <Heading
        eyebrow="BEHIND EVERY BETTER ANSWER"
        title="The knowledge that keeps us sorting."
        subtitle="Manage the demo guide and close the loop on feedback."
      />
      <Badge
        text="Admin preview · open demo access, no authorization enforced"
        icon="demo"
        background="#FBF1DF"
        color="#A07D46"
      />
      <Row style={{ flexWrap: 'wrap', marginVertical: 24 }}>
        {[
          { label: 'Waste items', value: state.items.length },
          { label: 'Saved discoveries', value: state.scans.length },
          { label: 'Feedback to review', value: pending.length },
        ].map((t) => (
          <Card key={t.label} style={{ flex: 1, minWidth: 150 }}>
            <Txt size={30} weight="500">
              {t.value}
            </Txt>
            <Txt size={12} color={C.muted}>
              {t.label}
            </Txt>
          </Card>
        ))}
      </Row>
      <Row style={{ flexWrap: 'wrap', marginBottom: 22 }}>
        {['Waste catalog', 'Feedback', 'Analytics'].map((t) => (
          <Button
            title={t}
            key={t}
            variant={tab === t ? 'primary' : 'secondary'}
            onPress={() => {
              setTab(t);
              setEditing(null);
            }}
          />
        ))}
      </Row>
      {tab === 'Waste catalog' &&
        (editing ? (
          <Card style={{ gap: 18 }}>
            <SectionTitle title={editing.id ? 'Edit waste guidance' : 'Add a new waste item'} />
            <Field
              label="Item name"
              value={editing.name}
              onChangeText={(name) => setEditing({ ...editing, name })}
              maxLength={80}
            />
            <Field
              label="Material"
              value={editing.material}
              onChangeText={(material) => setEditing({ ...editing, material })}
              maxLength={120}
            />
            <Txt size={12} weight="600">
              Category
            </Txt>
            <Row style={{ flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <Button
                  key={c.name}
                  title={c.name}
                  variant={editing.category === c.name ? 'primary' : 'secondary'}
                  onPress={() => setEditing({ ...editing, category: c.name })}
                />
              ))}
            </Row>
            <Field
              label="Short description"
              value={editing.description}
              onChangeText={(description) => setEditing({ ...editing, description })}
              multiline
              maxLength={500}
            />
            {editing.steps.map((step, i) => (
              <Field
                key={i}
                label={`Disposal step ${i + 1}`}
                value={step}
                onChangeText={(value) =>
                  setEditing({
                    ...editing,
                    steps: editing.steps.map((s, index) => (index === i ? value : s)),
                  })
                }
                multiline
                maxLength={500}
              />
            ))}
            <Field
              label="Safety note (optional)"
              value={editing.caution || ''}
              onChangeText={(caution) => setEditing({ ...editing, caution })}
              multiline
              maxLength={500}
            />
            {!!error && (
              <Txt accessibilityRole="alert" color="#AC6049">
                {error}
              </Txt>
            )}
            <Row style={{ flexWrap: 'wrap' }}>
              <Button title="Save guidance" icon="check" onPress={save} />
              <Button title="Cancel" variant="secondary" onPress={() => setEditing(null)} />
              {!!editing.id && (
                <Button
                  title="Delete item"
                  icon="trash"
                  variant="danger"
                  onPress={() => setDeleting(true)}
                />
              )}
            </Row>
            {deleting && (
              <View style={{ padding: 18, backgroundColor: '#FAEDE7', borderRadius: 12, gap: 12 }}>
                <Txt size={12}>
                  Delete this guide entry and its saved history entries? Related feedback is
                  retained for review.
                </Txt>
                <Row style={{ flexWrap: 'wrap' }}>
                  <Button
                    title="Confirm deletion"
                    variant="danger"
                    onPress={() => {
                      update((s) => ({
                        ...s,
                        items: s.items.filter((i) => i.id !== editing.id),
                        scans: s.scans.filter((scan) => scan.itemId !== editing.id),
                      }));
                      setEditing(null);
                      setDeleting(false);
                      notify('Guide entry deleted.');
                    }}
                  />
                  <Button
                    title="Keep item"
                    variant="secondary"
                    onPress={() => setDeleting(false)}
                  />
                </Row>
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <SectionTitle
              title="Waste items & disposal guidance"
              action="Add item"
              onPress={() => {
                setEditing({ ...blank, steps: ['', '', ''] });
                setError('');
                setDeleting(false);
              }}
            />
            <Field placeholder="Search the catalog…" value={query} onChangeText={setQuery} />
            {state.items
              .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
              .map((i) => (
                <ItemRow
                  key={i.id}
                  item={i}
                  onPress={() => {
                    setEditing({ ...i, steps: [...i.steps] });
                    setError('');
                    setDeleting(false);
                  }}
                  end={<Icon name="edit" size={17} />}
                />
              ))}
            {!state.items.some((i) => i.name.toLowerCase().includes(query.toLowerCase())) && (
              <Txt color={C.muted} style={{ marginTop: 20 }}>
                No entries match this search.
              </Txt>
            )}
          </Card>
        ))}
      {tab === 'Feedback' &&
        (state.feedback.length ? (
          <View style={{ gap: 14 }}>
            {state.feedback.map((f) => (
              <Card key={f.id} style={{ gap: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={17} weight="500">
                    {state.items.find((i) => i.id === f.itemId)?.name || 'Removed catalog item'}
                  </Txt>
                  <Badge text={f.status} />
                </Row>
                <Txt>{f.correction}</Txt>
                <Txt size={11} color={C.muted}>
                  {new Date(f.date).toLocaleString('en-IN')}
                </Txt>
                <Button
                  title={f.status === 'Reviewed' ? 'Reopen feedback' : 'Mark as reviewed'}
                  variant="secondary"
                  icon="check"
                  onPress={() =>
                    update((s) => ({
                      ...s,
                      feedback: s.feedback.map((v) =>
                        v.id === f.id
                          ? { ...v, status: v.status === 'Pending' ? 'Reviewed' : 'Pending' }
                          : v,
                      ),
                    }))
                  }
                  style={{ alignSelf: 'flex-start' }}
                />
              </Card>
            ))}
          </View>
        ) : (
          <Empty
            title="All clear for now."
            text="Corrections submitted from a result screen appear here for review."
          />
        ))}
      {tab === 'Analytics' && (
        <Card style={{ gap: 22 }}>
          <SectionTitle title="Prototype usage overview" />
          {[
            {
              label: 'Demo predictions saved',
              value: state.scans.filter((s) => s.source === 'demo').length,
            },
            {
              label: 'Manual selections saved',
              value: state.scans.filter((s) => s.source === 'manual').length,
            },
            { label: 'Corrections submitted', value: state.feedback.length },
            {
              label: 'Corrections reviewed',
              value: state.feedback.filter((f) => f.status === 'Reviewed').length,
            },
          ].map((t) => (
            <Row
              key={t.label}
              style={{
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: C.line,
                paddingBottom: 16,
              }}
            >
              <Txt size={13}>{t.label}</Txt>
              <Txt weight="600" size={20}>
                {t.value}
              </Txt>
            </Row>
          ))}
          <View style={{ backgroundColor: '#F2F5EB', padding: 20, borderRadius: 12, gap: 9 }}>
            <Row>
              <Icon name="chart" />
              <Txt weight="500">Model evaluation comes next.</Txt>
            </Row>
            <Txt size={12} color={C.muted}>
              Accuracy, F1 score, inference latency, and the confusion matrix require a trained
              model and a held-out evaluation set. No model-performance numbers are fabricated in
              this prototype.
            </Txt>
          </View>
        </Card>
      )}
    </View>
  );
}
