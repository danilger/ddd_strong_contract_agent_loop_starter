import { useEffect, useState } from 'react';
import { api } from '@/shared/api';

/** Учебная страница: GET / через ts-rest client */
export function HelloPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void api.getHello().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.status === 200) {
        setMessage(result.body.message);
        setError(null);
        return;
      }

      setError(`Unexpected status: ${result.status}`);
    }).catch((err: unknown) => {
      if (cancelled) {
        return;
      }

      setError(err instanceof Error ? err.message : 'Request failed');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: '40rem' }}>
      <h1>Starter client</h1>
      <p>Contract-first hello via <code>@repo/contract</code>.</p>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p>{message}</p> : !error ? <p>Loading…</p> : null}
    </main>
  );
}
