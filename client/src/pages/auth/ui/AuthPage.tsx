import { useState } from 'react';
import { api, setAccessToken } from '@/shared/api';

/** Минимальная страница register / login / me / logout */
export function AuthPage() {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password1');
  const [status, setStatus] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Регистрирует пользователя через API.
   */
  async function onRegister(): Promise<void> {
    setError(null);
    const result = await api.register({ body: { email, password } });
    if (result.status === 201) {
      setStatus(`Registered: ${result.body.userId}`);
      setMe(null);
      return;
    }
    setError(JSON.stringify(result.body));
  }

  /**
   * Логин и сохранение access token.
   */
  async function onLogin(): Promise<void> {
    setError(null);
    const result = await api.login({ body: { email, password } });
    if (result.status === 200) {
      setAccessToken(result.body.accessToken);
      setStatus('Logged in');
      return;
    }
    setError(JSON.stringify(result.body));
  }

  /**
   * Запрашивает /auth/me.
   */
  async function onMe(): Promise<void> {
    setError(null);
    const result = await api.getMe();
    if (result.status === 200) {
      setMe(`${result.body.userId} · ${result.body.email}`);
      return;
    }
    setError(JSON.stringify(result.body));
  }

  /**
   * Выход и очистка access token.
   */
  async function onLogout(): Promise<void> {
    setError(null);
    const result = await api.logout({});
    setAccessToken(null);
    setMe(null);
    if (result.status === 204) {
      setStatus('Logged out');
      return;
    }
    setError(JSON.stringify(result.body));
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '28rem', fontFamily: 'system-ui' }}>
      <h1>Auth</h1>
      <p>Identity only — password + JWT cookie session.</p>
      <label style={{ display: 'block', marginTop: '1rem' }}>
        Email
        <input
          style={{ display: 'block', width: '100%' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Password
        <input
          style={{ display: 'block', width: '100%' }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={() => void onRegister()}>
          Register
        </button>
        <button type="button" onClick={() => void onLogin()}>
          Login
        </button>
        <button type="button" onClick={() => void onMe()}>
          Me
        </button>
        <button type="button" onClick={() => void onLogout()}>
          Logout
        </button>
      </div>
      {status ? <p data-testid="auth-status">{status}</p> : null}
      {me ? <p data-testid="auth-me">{me}</p> : null}
      {error ? (
        <p role="alert" data-testid="auth-error">
          {error}
        </p>
      ) : null}
    </main>
  );
}
