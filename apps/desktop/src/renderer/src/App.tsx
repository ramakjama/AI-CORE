import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql';

const PING_QUERY = `
  query {
    parties {
      total
    }
  }
`;

export default function App() {
  const [status, setStatus] = useState('Ready');

  const onPing = async () => {
    setStatus('Loading...');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: PING_QUERY }),
      });
      const payload = await response.json();
      if (payload.errors?.length) {
        throw new Error(payload.errors[0].message);
      }
      setStatus(`API OK. Total parties: ${payload.data.parties.total}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'API error');
    }
  };

  return (
    <main className="app">
      <section className="card">
        <h1>AI-CORE Desktop</h1>
        <p>Desktop shell for local testing.</p>
        <button type="button" onClick={onPing}>
          Ping API
        </button>
        <p className="status">{status}</p>
      </section>
    </main>
  );
}
