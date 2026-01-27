'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

type Policy = {
  id: string;
  holderName: string;
  status: string;
  type: string;
};

type Claim = {
  id: string;
  title: string;
  status: string;
};

type StatusState = { type: 'idle' | 'loading' | 'success' | 'error'; message?: string };

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
  return payload.data as T;
}

const QUERIES = {
  policies: `
    query Policies {
      policies {
        items { id holderName status type }
      }
    }
  `,
  claims: `
    query Claims {
      claims {
        items { id title status }
      }
    }
  `,
};

const MUTATIONS = {
  createPolicy: `
    mutation CreatePolicy($input: CreatePolicyInput!) {
      createPolicy(input: $input) { id holderName status type }
    }
  `,
  createClaim: `
    mutation CreateClaim($input: CreateClaimInput!) {
      createClaim(input: $input) { id title status }
    }
  `,
};

export default function CustomerDashboard() {
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [holderName, setHolderName] = useState('');
  const [policyType, setPolicyType] = useState('AUTO');
  const [claimTitle, setClaimTitle] = useState('');

  const refreshAll = async () => {
    setStatus({ type: 'loading', message: 'Cargando datos...' });
    try {
      const [policyData, claimData] = await Promise.all([
        graphqlRequest<{ policies: { items: Policy[] } }>(QUERIES.policies),
        graphqlRequest<{ claims: { items: Claim[] } }>(QUERIES.claims),
      ]);
      setPolicies(policyData.policies.items);
      setClaims(claimData.claims.items);
      setStatus({ type: 'success', message: 'Actualizado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar.';
      setStatus({ type: 'error', message });
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const onCreatePolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await graphqlRequest(MUTATIONS.createPolicy, {
        input: { holderName, type: policyType },
      });
      setHolderName('');
      refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la poliza.';
      setStatus({ type: 'error', message });
    }
  };

  const onCreateClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await graphqlRequest(MUTATIONS.createClaim, {
        input: { title: claimTitle },
      });
      setClaimTitle('');
      refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el siniestro.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <main className="page">
      <section className="dashboard">
        <div className="card">
          <h1>Panel cliente</h1>
          <p>Resumen rapido de polizas y siniestros.</p>
          <div className="actions">
            <button type="button" className="primary" onClick={refreshAll}>
              Recargar
            </button>
            <span className="pill">API: {API_URL}</span>
          </div>
          {status.type !== 'idle' && (
            <p className={`status ${status.type === 'error' ? 'error' : status.type === 'success' ? 'success' : ''}`}>
              {status.message}
            </p>
          )}
        </div>

        <div className="grid">
          <section className="panel">
            <h2>Polizas</h2>
            <ul>
              {policies.slice(0, 5).map((policy) => (
                <li key={policy.id}>
                  <span>{policy.holderName}</span>
                  <span className="pill">{policy.status}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onCreatePolicy}>
              <label className="field">
                Tomador
                <input
                  value={holderName}
                  onChange={(event) => setHolderName(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Tipo
                <select value={policyType} onChange={(event) => setPolicyType(event.target.value)}>
                  <option value="AUTO">Auto</option>
                  <option value="HOME">Hogar</option>
                  <option value="LIFE">Vida</option>
                </select>
              </label>
              <button type="submit" className="primary">
                Crear poliza
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Siniestros</h2>
            <ul>
              {claims.slice(0, 5).map((claim) => (
                <li key={claim.id}>
                  <span>{claim.title}</span>
                  <span className="pill">{claim.status}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onCreateClaim}>
              <label className="field">
                Titulo
                <input
                  value={claimTitle}
                  onChange={(event) => setClaimTitle(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="primary">
                Crear siniestro
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
