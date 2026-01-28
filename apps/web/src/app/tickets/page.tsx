'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  channel: string;
  category?: string;
  priority: string;
  status: string;
  contactName?: string;
  contactEmail?: string;
  aiSentiment?: string;
  aiSentimentScore?: number;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/tickets')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tickets</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tickets</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tickets</h1>
          <p className="text-gray-600">Total de tickets: {tickets.length}</p>
        </div>

        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{ticket.ticketNumber}</h3>
                  <p className="text-gray-600 mt-1">{ticket.title}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                    ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                    ticket.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Canal:</span> {ticket.channel}
                </span>
                {ticket.contactName && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Contacto:</span> {ticket.contactName}
                  </span>
                )}
                {ticket.category && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Categoría:</span> {ticket.category}
                  </span>
                )}
              </div>

              {ticket.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
              )}
            </div>
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No hay tickets disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
