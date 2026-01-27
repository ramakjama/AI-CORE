'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

const TRACK_EVENT_MUTATION = `
  mutation TrackEvent($input: TrackEventInput!) {
    trackEvent(input: $input) { id eventType source }
  }
`;

type StatusState = { type: 'idle' | 'loading' | 'success' | 'error'; message?: string };

export default function OpsPage() {
  const [eventType, setEventType] = useState('operational_alert');
  const [source, setSource] = useState('ops');
  const [payload, setPayload] = useState('');
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Enviando evento...' });
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: TRACK_EVENT_MUTATION,
          variables: { input: { eventType, source, payload } },
        }),
      });
      const result = await response.json();
      if (result.errors?.length) {
        throw new Error(result.errors[0].message);
      }
      setPayload('');
      setStatus({ type: 'success', message: 'Evento registrado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1>Operaciones</h1>
        <p>Registra eventos operativos y alertas internas.</p>
        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            Tipo
            <input
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Source
            <input value={source} onChange={(event) => setSource(event.target.value)} />
          </label>
          <label className="field">
            Payload
            <textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
            />
          </label>
          <button type="submit" className="primary">
            Registrar evento
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
