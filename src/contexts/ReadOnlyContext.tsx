import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ReadOnlyContextType {
  isReadOnly: boolean;
  token: string | null;
  ready: boolean;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: false,
  token: null,
  ready: false,
});

export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [valid, setValid] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');

    if (!t) {
      setReady(true);
      return;
    }

    setToken(t);

    supabase
      .from('share_tokens')
      .select('id')
      .eq('token', t)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setValid(true);
        }
        setReady(true);
      });
  }, []);

  return (
    <ReadOnlyContext.Provider value={{ isReadOnly: valid, token, ready }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}
