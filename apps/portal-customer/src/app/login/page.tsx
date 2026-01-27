'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user { id email firstName lastName }
    }
  }
`;

type StatusState = { type: 'idle' | 'loading' | 'success' | 'error'; message?: string };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Validando...' });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LOGIN_MUTATION, variables: { email, password } }),
      });
      const payload = await response.json();
      if (payload.errors?.length) {
        throw new Error(payload.errors[0].message);
      }
      setStatus({ type: 'success', message: 'Acceso correcto.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo acceder.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1>Acceso clientes</h1>
        <p>Ingresa con tu email para ver polizas y mensajes.</p>
        <form className="form" onSubmit={onSubmit}>
          <label className="field" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary">
            Entrar
          </button>
          {status.type !== 'idle' && (
            <p className={`status ${status.type === 'error' ? 'error' : status.type === 'success' ? 'success' : ''}`}>
              {status.message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
