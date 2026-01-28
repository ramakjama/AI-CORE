'use client';

// ============================================================================
// RECEIPT PAGE - Página de detalle de recibo con DiscountWidget
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DiscountWidget from '@/components/gamification/DiscountWidget';
import type { Discount } from '@/types/gamification';
import {
  FileText,
  Download,
  CreditCard,
  Calendar,
  User,
  Building,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Receipt {
  id: string;
  receiptNumber: string;
  policyNumber: string;
  policyId?: string;
  clientId: string;
  clientName: string;
  premiumTotal: number;
  discountApplied?: number;
  finalAmount?: number;
  status: string;
  dueDate: Date;
  issueDate?: Date;
  description?: string;
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
  const [hasDiscount, setHasDiscount] = useState(false);

  // Load receipt data
  useEffect(() => {
    loadReceipt();
  }, [params.id]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/receipts/${params.id}`);
      if (!response.ok) throw new Error('Error al cargar recibo');

      const data = await response.json();
      setReceipt(data);
      setHasDiscount((data.discountApplied || 0) > 0);
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountApplied = async (discount: Discount) => {
    console.log('Discount applied:', discount);

    // Update local state
    if (receipt) {
      setReceipt({
        ...receipt,
        discountApplied: discount.discountAmount,
        finalAmount: discount.finalAmount,
      });
    }

    // Mark as having discount
    setHasDiscount(true);

    // Hide widget
    setShowDiscountWidget(false);

    // Show success message (you can use a toast library here)
    alert(
      `¡Descuento aplicado exitosamente!\n\n` +
      `Descuento: €${discount.discountAmount.toFixed(2)}\n` +
      `Nuevo importe: €${discount.finalAmount.toFixed(2)}\n` +
      `Ahorro: ${((discount.discountAmount / discount.originalAmount) * 100).toFixed(1)}%`
    );
  };

  const handleDiscountError = (error: string) => {
    console.error('Discount error:', error);
    alert(`Error al aplicar descuento: ${error}`);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      PENDING: {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
      },
      PAID: {
        label: 'Pagado',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      OVERDUE: {
        label: 'Vencido',
        color: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      CANCELLED: {
        label: 'Cancelado',
        color: 'bg-gray-100 text-gray-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recibo no encontrado</h1>
          <p className="text-gray-600 mb-6">
            El recibo que buscas no existe o no tienes permisos para verlo.
          </p>
          <button
            onClick={() => router.push('/receipts')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver a recibos
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(receipt.status);
  const amountToPay = receipt.finalAmount || receipt.premiumTotal;
  const canApplyDiscount = receipt.status === 'PENDING' && !hasDiscount;

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Recibo {receipt.receiptNumber}
          </h1>
        </div>
        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span>Póliza: {receipt.policyNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Cliente: {receipt.clientName}</span>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`${statusConfig.color} rounded-lg p-4 mb-6 flex items-center gap-3`}>
        {statusConfig.icon}
        <span className="font-semibold">{statusConfig.label}</span>
      </div>

      {/* Receipt Details Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Detalles del Recibo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Número de recibo</p>
              <p className="text-lg font-semibold text-gray-900">{receipt.receiptNumber}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de emisión</p>
              <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {receipt.issueDate
                  ? new Date(receipt.issueDate).toLocaleDateString('es-ES')
                  : 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de vencimiento</p>
              <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                {new Date(receipt.dueDate).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Importe original</p>
              <p className="text-2xl font-bold text-gray-900">
                €{receipt.premiumTotal.toFixed(2)}
              </p>
            </div>

            {hasDiscount && receipt.discountApplied && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Descuento SORIS aplicado</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    -€{receipt.discountApplied.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Importe final a pagar</p>
                  <p className="text-3xl font-bold text-blue-600">
                    €{amountToPay.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    ¡Ahorras {((receipt.discountApplied / receipt.premiumTotal) * 100).toFixed(1)}%!
                  </p>
                </div>
              </>
            )}

            {!hasDiscount && (
              <div className="pt-4 border-t-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Importe a pagar</p>
                <p className="text-3xl font-bold text-blue-600">
                  €{amountToPay.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {receipt.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Descripción</p>
            <p className="text-gray-900">{receipt.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {canApplyDiscount && (
            <button
              onClick={() => setShowDiscountWidget(!showDiscountWidget)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {showDiscountWidget ? 'Ocultar' : 'Aplicar'} Descuento SORIS
            </button>
          )}

          {receipt.status === 'PENDING' && (
            <button
              onClick={() => router.push(`/receipts/${params.id}/pay`)}
              className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Pagar Recibo
            </button>
          )}

          <button
            onClick={() => window.open(`/api/receipts/${params.id}/pdf`, '_blank')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Discount Widget */}
      {showDiscountWidget && canApplyDiscount && (
        <div className="mb-8 animate-fadeIn">
          <DiscountWidget
            receiptId={receipt.id}
            policyId={receipt.policyId}
            clientId={receipt.clientId}
            amount={receipt.premiumTotal}
            onDiscountApplied={handleDiscountApplied}
            onError={handleDiscountError}
          />
        </div>
      )}

      {/* Info Banner */}
      {hasDiscount && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¡Descuento SORIS Aplicado!
              </h3>
              <p className="text-gray-700">
                Has usado tus puntos SORIS para obtener un descuento de €
                {receipt.discountApplied?.toFixed(2)} en este recibo.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Sigue ganando puntos SORIS pagando tus pólizas a tiempo y obtén más descuentos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
