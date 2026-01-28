import Link from 'next/link';

async function getTickets() {
  try {
    const res = await fetch('http://localhost:3001/tickets', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export default async function TicketsSSRPage() {
  const tickets = await getTickets();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tickets (SSR Version)</h1>
          <p className="text-gray-600">Total de tickets: {tickets.length}</p>
        </div>

        <div className="grid gap-4">
          {tickets.map((ticket: any) => (
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
                <span><strong>Canal:</strong> {ticket.channel}</span>
                {ticket.contactName && <span><strong>Contacto:</strong> {ticket.contactName}</span>}
                {ticket.category && <span><strong>Categoría:</strong> {ticket.category}</span>}
              </div>

              {ticket.description && (
                <p className="mt-3 text-sm text-gray-600">{ticket.description.substring(0, 200)}...</p>
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
