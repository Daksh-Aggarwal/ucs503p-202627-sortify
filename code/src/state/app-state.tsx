import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { catalog, WasteItem } from '@/data/catalog';

export type Scan = {
  id: string;
  itemId: string;
  date: string;
  confidence: number;
  source: 'demo' | 'manual';
  sorted: boolean;
};
export type Feedback = {
  id: string;
  itemId: string;
  correction: string;
  status: 'Pending' | 'Reviewed';
  date: string;
};
export type Message = { id: string; role: 'user' | 'assistant'; text: string; itemId?: string };
type State = {
  profile: { name: string; email: string } | null;
  location: string;
  scans: Scan[];
  feedback: Feedback[];
  messages: Message[];
  items: WasteItem[];
};
const seed: State = {
  profile: null,
  location: 'Patiala, Punjab',
  scans: [
    {
      id: 'seed-1',
      itemId: 'bottle',
      date: '2026-09-09T08:30:00',
      confidence: 98,
      source: 'demo',
      sorted: true,
    },
    {
      id: 'seed-2',
      itemId: 'banana',
      date: '2026-09-08T12:00:00',
      confidence: 96,
      source: 'demo',
      sorted: true,
    },
    {
      id: 'seed-3',
      itemId: 'box',
      date: '2026-09-07T09:00:00',
      confidence: 97,
      source: 'demo',
      sorted: false,
    },
  ],
  feedback: [],
  messages: [],
  items: catalog,
};
const KEY = 'sortify-prototype-v1';
type Context = {
  state: State;
  ready: boolean;
  notice: string;
  notify: (text: string) => void;
  update: (fn: (previous: State) => State) => void;
  reset: () => void;
  saveScan: (
    itemId: string,
    confidence: number,
    source: Scan['source'],
    sorted?: boolean,
  ) => string;
};
const AppContext = createContext<Context | null>(null);
export const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export function AppProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<State>(seed);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw && active) {
          const parsed = JSON.parse(raw);
          if (
            Array.isArray(parsed.items) &&
            Array.isArray(parsed.scans) &&
            Array.isArray(parsed.feedback) &&
            Array.isArray(parsed.messages) &&
            typeof parsed.location === 'string'
          )
            setState({ ...seed, ...parsed });
        }
      })
      .catch(() => {
        if (active) setNotice('Saved demo data could not be loaded. Starting with sample data.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready) {
      writes.current = writes.current
        .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
        .catch(() =>
          setNotice(
            'Changes are available for this session, but could not be saved on this device.',
          ),
        );
    }
  }, [state, ready]);
  const notify = (text: string) => {
    setNotice(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 4000);
  };
  const saveScan: Context['saveScan'] = (itemId, confidence, source, sorted = false) => {
    const id = uniqueId();
    setState((s) => ({
      ...s,
      scans: [
        { id, itemId, confidence, source, sorted, date: new Date().toISOString() },
        ...s.scans,
      ],
    }));
    return id;
  };
  return (
    <AppContext.Provider
      value={{
        state,
        ready,
        notice,
        notify,
        update: setState,
        reset: () => {
          setState({ ...seed, scans: [], messages: [], feedback: [] });
          notify('Your local demo data has been reset.');
        },
        saveScan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider is required');
  return value;
}
