'use client';

// ============================================================================
// RECEIPT PAGE WITH DISCOUNT WIDGET - Integration Example
// ============================================================================
// This is an example of how to integrate the DiscountWidget into a receipt page

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DiscountWidget from '@/components/gamification/DiscountWidget';
import type { Discount } from '@/types/gamification';

interface Receipt {
  id: string;
  receiptNumber: string;
  policyNumber: string;
  accountId: string;
  clientId: string;
  clientName: string;
  premiumTotal: number;
  status: string;
  dueDate: Date;
  // ... other fields
}

interface ReceiptPageProps {
  params: {
    id: string;
  };
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showDiscountWidget, setShowDiscountWidget] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load receipt data
  React.useEffect(() => {
    loadReceipt();
  }, [params.id]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/receipts/${params.id}`);
      const data = await response.json();
      setReceipt(data);
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountApplied = async (discount: Discount) => {
    console.log('Discount applied:', discount);

    // Show success message
    alert(`¡Descuento aplicado exitosamente! Has ahorrado €${discount.discountAmount.toFixed(2)}`);

    // Reload receipt to show updated amount
    await loadReceipt();

    // Hide discount widget
    setShowDiscountWidget(false);

    // Optional: Navigate to payment page with discounted amount
    // router.push(`/receipts/${params.id}/pay?amount=${discount.finalAmount}`);
  };

  const handleDiscountError = (error: string) => {
    console.error('Discount error:', error);
    alert(`Error al aplicar descuento: ${error}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recibo no encontrado</h1>
          <button
            onClick={() => router.push('/receipts')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Volver a recibos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Recibo {receipt.receiptNumber}
        </h1>
        <p className="text-gray-600">
          Póliza: {receipt.policyNumber} | Cliente: {receipt.clientName}
        </p>
      </div>

      {/* Receipt Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Recibo</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Número de recibo</p>
            <p className="text-lg font-medium text-gray-900">{receipt.receiptNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className="text-lg font-medium text-gray-900">{receipt.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de vencimiento</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(receipt.dueDate).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Importe total</p>
            <p className="text-2xl font-bold text-blue-600">
              €{receipt.premiumTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowDiscountWidget(!showDiscountWidget)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all shadow-lg"
          >
            {showDiscountWidget ? 'Ocultar' : 'Aplicar'} Descuento SORIS
          </button>

          <button
            onClick={() => router.push(`/receipts/${params.id}/pay`)}
            className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            Pagar Recibo
          </button>

          <button
            onClick={() => router.push(`/receipts/${params.id}/download`)}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Discount Widget */}
      {showDiscountWidget && (
        <div className="mb-8">
          <DiscountWidget
            receiptId={receipt.id}
            clientId={receipt.clientId}
            amount={receipt.premiumTotal}
            onDiscountApplied={handleDiscountApplied}
            onError={handleDiscountError}
            className="animate-fadeIn"
          />
        </div>
      )}

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Pago 1/12</p>
                <p className="text-sm text-gray-600">15/01/2026</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Pagado
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Pago 2/12</p>
                <p className="text-sm text-gray-600">15/02/2026</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pendiente
              </span>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Póliza</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Número de póliza:</span>
              <span className="font-medium text-gray-900">{receipt.policyNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-900">{receipt.clientName}</span>
            </div>
            <button
              onClick={() => router.push(`/policies/${receipt.policyNumber}`)}
              className="w-full mt-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Ver Póliza Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
