import { useState } from 'react';
import { View } from 'react-native';
import { useApp } from '@/state/app-state';
import { Badge, Button, C, Card, Field, Heading, Icon, Row, Txt } from '@/components/sortify/ui';
export default function ProfileScreen() {
  const { state, update, notify, reset } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState(state.profile?.name || '');
  const [email, setEmail] = useState(state.profile?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  function submit() {
    setError('');
    if ((mode === 'register' || state.profile) && name.trim().length < 2) {
      setError('Please enter a name with at least two characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!state.profile && password.length < 8) {
      setError('For this demo, enter a password of at least eight characters.');
      return;
    }
    update((s) => ({
      ...s,
      profile: { name: name.trim() || email.split('@')[0], email: email.trim() },
    }));
    setPassword('');
    notify(state.profile ? 'Profile updated on this device.' : 'Welcome to your demo profile.');
  }
  return (
    <View style={{ maxWidth: 820, width: '100%', alignSelf: 'center' }}>
      <Heading
        eyebrow="YOUR LITTLE CORNER"
        title={state.profile ? 'Make yourself at home.' : 'Good habits feel better together.'}
        subtitle={
          state.profile
            ? 'Your profile, preferences, and a fresh start when you need one.'
            : 'Try the account flow, or keep exploring as a guest.'
        }
      />
      <Card style={{ gap: 21 }}>
        <Badge text="Local demo profile · no real authentication" icon="demo" />
        {!state.profile && (
          <Row>
            <Button
              title="Create account"
              variant={mode === 'register' ? 'primary' : 'secondary'}
              onPress={() => {
                setMode('register');
                setError('');
              }}
            />
            <Button
              title="Sign in"
              variant={mode === 'login' ? 'primary' : 'secondary'}
              onPress={() => {
                setMode('login');
                setError('');
              }}
            />
          </Row>
        )}
        {(mode === 'register' || state.profile) && (
          <Field
            label="Your name"
            placeholder="What should we call you?"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={60}
          />
        )}
        <Field
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          maxLength={120}
        />
        {!state.profile && (
          <Field
            label="Demo password"
            placeholder="At least 8 characters · never stored"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
          />
        )}
        {!!error && (
          <Txt accessibilityRole="alert" color="#AE5B41" size={12}>
            {error}
          </Txt>
        )}
        <Button
          title={
            state.profile
              ? 'Save profile'
              : mode === 'register'
                ? 'Create demo account'
                : 'Enter demo account'
          }
          icon={state.profile ? 'check' : 'arrow'}
          onPress={submit}
        />
        <Txt size={11} color={C.muted}>
          {state.profile
            ? 'Your name and email are stored locally on this device.'
            : 'No account is created on a server and no password is saved or verified. Both forms open a local demo profile; do not use a real password.'}
        </Txt>
        {state.profile && (
          <Button
            title="Sign out of demo profile"
            icon="logout"
            variant="ghost"
            onPress={() => {
              update((s) => ({ ...s, profile: null }));
              setName('');
              setEmail('');
              notify('Signed out. Local discoveries remain available in guest mode.');
            }}
          />
        )}
      </Card>
      <Card style={{ marginTop: 23, gap: 17 }}>
        <Row>
          <Icon name="pin" />
          <Txt size={18} weight="500">
            Your local context
          </Txt>
        </Row>
        <Txt color={C.muted}>{state.location}</Txt>
        <Txt color={C.muted} size={12}>
          Use the location selector at the top of the app to change your area. Verified collection
          services will be connected in a later version.
        </Txt>
      </Card>
      <Card style={{ marginTop: 23, gap: 16 }}>
        <Row>
          <Icon name="shield" />
          <Txt size={18} weight="500">
            A little control over your data.
          </Txt>
        </Row>
        <Txt color={C.muted} size={12}>
          Profiles, history, conversations, and catalog edits are saved in local demo storage shared
          by this device. Uploaded photos are not retained in history. Resetting clears your profile
          and activity and restores the original guide.
        </Txt>
        {confirmReset ? (
          <>
            <Txt size={13} weight="500">
              Clear all local activity and restore the demo guide?
            </Txt>
            <Row style={{ flexWrap: 'wrap' }}>
              <Button
                title="Yes, reset demo data"
                variant="danger"
                onPress={() => {
                  reset();
                  setName('');
                  setEmail('');
                  setPassword('');
                  setConfirmReset(false);
                }}
              />
              <Button
                title="Keep my data"
                variant="secondary"
                onPress={() => setConfirmReset(false)}
              />
            </Row>
          </>
        ) : (
          <Button
            title="Reset local demo data"
            icon="reset"
            variant="secondary"
            onPress={() => setConfirmReset(true)}
            style={{ alignSelf: 'flex-start' }}
          />
        )}
      </Card>
    </View>
  );
}
