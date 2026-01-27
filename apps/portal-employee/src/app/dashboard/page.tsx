'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';

type Party = {
  id: string;
  displayName: string;
  partyType: string;
};

type Message = {
  id: string;
  channel: string;
  status: string;
  to: string;
};

type AgentRun = {
  id: string;
  agentName: string;
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
  parties: `
    query Parties {
      parties {
        items { id displayName partyType }
      }
    }
  `,
  messages: `
    query Messages {
      messages {
        items { id channel status to }
      }
    }
  `,
  agentRuns: `
    query AgentRuns {
      agentRuns {
        items { id agentName status }
      }
    }
  `,
};

const MUTATIONS = {
  createParty: `
    mutation CreateParty($input: CreatePartyInput!) {
      createParty(input: $input) { id displayName partyType }
    }
  `,
  sendMessage: `
    mutation SendMessage($input: SendMessageInput!) {
      sendMessage(input: $input) { id channel status to }
    }
  `,
  runAgent: `
    mutation RunAgent($input: RunAgentInput!) {
      runAgent(input: $input) { id agentName status }
    }
  `,
};

export default function EmployeeDashboard() {
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [parties, setParties] = useState<Party[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState('PERSON');
  const [messageTo, setMessageTo] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageChannel, setMessageChannel] = useState('email');
  const [agentName, setAgentName] = useState('support-agent');
  const [agentInput, setAgentInput] = useState('');

  const refreshAll = async () => {
    setStatus({ type: 'loading', message: 'Cargando datos...' });
    try {
      const [partyData, messageData, agentData] = await Promise.all([
        graphqlRequest<{ parties: { items: Party[] } }>(QUERIES.parties),
        graphqlRequest<{ messages: { items: Message[] } }>(QUERIES.messages),
        graphqlRequest<{ agentRuns: { items: AgentRun[] } }>(QUERIES.agentRuns),
      ]);
      setParties(partyData.parties.items);
      setMessages(messageData.messages.items);
      setAgentRuns(agentData.agentRuns.items);
      setStatus({ type: 'success', message: 'Actualizado.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar.';
      setStatus({ type: 'error', message });
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const onCreateParty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await graphqlRequest(MUTATIONS.createParty, {
        input: { displayName: partyName, partyType },
      });
      setPartyName('');
      refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la party.';
      setStatus({ type: 'error', message });
    }
  };

  const onSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await graphqlRequest(MUTATIONS.sendMessage, {
        input: { to: messageTo, body: messageBody, channel: messageChannel },
      });
      setMessageTo('');
      setMessageBody('');
      refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar.';
      setStatus({ type: 'error', message });
    }
  };

  const onRunAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await graphqlRequest(MUTATIONS.runAgent, {
        input: { agentName, input: agentInput },
      });
      setAgentInput('');
      refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo ejecutar.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <main className="page">
      <section className="dashboard">
        <div className="card">
          <h1>Panel operaciones</h1>
          <p>Gestion interna de clientes, comunicaciones y agentes.</p>
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
            <h2>Parties</h2>
            <ul>
              {parties.slice(0, 5).map((party) => (
                <li key={party.id}>
                  <span>{party.displayName}</span>
                  <span className="pill">{party.partyType}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onCreateParty}>
              <label className="field">
                Nombre
                <input
                  value={partyName}
                  onChange={(event) => setPartyName(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Tipo
                <select value={partyType} onChange={(event) => setPartyType(event.target.value)}>
                  <option value="PERSON">Persona</option>
                  <option value="COMPANY">Empresa</option>
                </select>
              </label>
              <button type="submit" className="primary">
                Crear party
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Mensajes</h2>
            <ul>
              {messages.slice(0, 5).map((message) => (
                <li key={message.id}>
                  <span>{message.to}</span>
                  <span className="pill">{message.status}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onSendMessage}>
              <label className="field">
                Canal
                <select
                  value={messageChannel}
                  onChange={(event) => setMessageChannel(event.target.value)}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>
              <label className="field">
                Destino
                <input
                  value={messageTo}
                  onChange={(event) => setMessageTo(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Mensaje
                <textarea
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="primary">
                Enviar
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Agentes</h2>
            <ul>
              {agentRuns.slice(0, 5).map((run) => (
                <li key={run.id}>
                  <span>{run.agentName}</span>
                  <span className="pill">{run.status}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onRunAgent}>
              <label className="field">
                Agente
                <input
                  value={agentName}
                  onChange={(event) => setAgentName(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Input
                <textarea
                  value={agentInput}
                  onChange={(event) => setAgentInput(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="primary">
                Ejecutar
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
