'use client';

// ============================================================================
// DISCOUNT WIDGET - Componente CRÍTICO de Gamificación SORIS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Building2,
  User,
  Info,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import type {
  DiscountWidgetProps,
  DiscountWidgetState,
  WalletBalance,
  Discount,
  WalletType,
} from '@/types/gamification';

import { gamificationAPI } from '@/lib/api/gamification';
import {
  formatCurrency,
  formatSoris,
  calculateDiscountBreakdown,
  calculateMaxSoris,
  getPercentageOfMax,
  validateDiscount,
  getDiscountPercentage,
  getPrimaryWalletUsed,
  formatBreakdown,
} from '@/lib/discount-utils';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Wallet Card Component
interface WalletCardProps {
  type: WalletType;
  wallet?: WalletBalance;
  loading: boolean;
  highlight?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ type, wallet, loading, highlight }) => {
  const config = {
    CLIENT: {
      icon: User,
      label: 'Tu Wallet',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
    },
    AGENCY: {
      icon: Building2,
      label: 'Wallet Agencia',
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50',
    },
    OCCIDENT: {
      icon: Coins,
      label: 'Wallet Occident',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50',
    },
  }[type];

  const Icon = config.icon;

  if (loading) {
    return (
      <div className={`p-6 rounded-lg border-2 ${config.bgColor} border-gray-200 animate-pulse`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${config.color} rounded-full`}></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-6 rounded-lg border-2 transition-all ${
        highlight
          ? `${config.borderColor} ${config.bgColor} shadow-lg scale-105`
          : 'border-gray-200 bg-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{config.label}</p>
          {wallet && (
            <p className="text-xs text-gray-500">{wallet.ownerName}</p>
          )}
        </div>
      </div>

      {wallet ? (
        <>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatSoris(wallet.balance)}
          </p>
          <p className="text-sm text-gray-500">
            ≈ {formatCurrency(wallet.balanceEur)}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Disponible
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">No disponible</p>
      )}
    </motion.div>
  );
};

// Amount Display Component
interface AmountDisplayProps {
  label: string;
  amount: number;
  className?: string;
  icon?: React.ReactNode;
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({ label, amount, className = '', icon }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-sm text-gray-600 mb-1 flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</span>
  </div>
);

// Quick Action Button
interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {label}
  </button>
);

// Order Flow Visualization
interface OrderFlowProps {
  breakdown: { fromClient: number; fromAgency: number; fromOccident: number };
  conversionRate: number;
}

const OrderFlow: React.FC<OrderFlowProps> = ({ breakdown, conversionRate }) => {
  const steps = [
    { type: 'CLIENT', amount: breakdown.fromClient, label: 'Cliente' },
    { type: 'AGENCY', amount: breakdown.fromAgency, label: 'Agencia' },
    { type: 'OCCIDENT', amount: breakdown.fromOccident, label: 'Occident' },
  ];

  return (
    <div className="flex items-center justify-between gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.type}>
          <motion.div
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              step.amount > 0
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <p className="text-xs font-medium text-gray-600 mb-1">{step.label}</p>
            <p className="text-lg font-bold text-gray-900">
              {step.amount > 0 ? formatSoris(step.amount) : '—'}
            </p>
            {step.amount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(step.amount * conversionRate)}
              </p>
            )}
          </motion.div>
          {index < steps.length - 1 && (
            <ArrowRight
              className={`w-5 h-5 ${
                steps[index + 1].amount > 0 ? 'text-green-500' : 'text-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DiscountWidget: React.FC<DiscountWidgetProps> = ({
  receiptId,
  policyId,
  clientId,
  amount,
  onDiscountApplied,
  onError,
  className = '',
  disabled = false,
}) => {
  // ========== STATE ==========
  const [state, setState] = useState<DiscountWidgetState>({
    clientWallet: undefined,
    agencyWallet: undefined,
    occidentWallet: undefined,
    conversionRate: 0.1, // Default: 1 Soris = 0.10 EUR
    sorisToUse: 0,
    calculation: undefined,
    loading: true,
    applying: false,
    error: null,
    success: false,
  });

  // ========== COMPUTED VALUES ==========
  const maxSoris = useMemo(() => {
    if (!state.clientWallet || !state.agencyWallet || !state.occidentWallet) return 0;
    return calculateMaxSoris(
      amount,
      state.clientWallet.balance,
      state.agencyWallet.balance,
      state.occidentWallet.balance,
      state.conversionRate
    );
  }, [amount, state.clientWallet, state.agencyWallet, state.occidentWallet, state.conversionRate]);

  const validation = useMemo(() => {
    if (!state.clientWallet || !state.agencyWallet || !state.occidentWallet) {
      return { isValid: false, errors: [], warnings: [] };
    }
    return validateDiscount(
      state.sorisToUse,
      amount,
      state.clientWallet.balance,
      state.agencyWallet.balance,
      state.occidentWallet.balance,
      state.conversionRate
    );
  }, [state.sorisToUse, amount, state.clientWallet, state.agencyWallet, state.occidentWallet, state.conversionRate]);

  const calculation = useMemo(() => {
    if (!state.clientWallet || !state.agencyWallet || !state.occidentWallet) return null;
    if (state.sorisToUse === 0) return null;

    const calc = calculateDiscountBreakdown(
      state.sorisToUse,
      state.clientWallet.balance,
      state.agencyWallet.balance,
      state.occidentWallet.balance,
      state.conversionRate
    );

    return {
      ...calc,
      finalAmount: amount - calc.discountAmount,
    };
  }, [state.sorisToUse, amount, state.clientWallet, state.agencyWallet, state.occidentWallet, state.conversionRate]);

  const primaryWallet = useMemo(() => {
    if (!state.clientWallet || !state.agencyWallet || !state.occidentWallet) return null;
    return getPrimaryWalletUsed(
      state.sorisToUse,
      state.clientWallet.balance,
      state.agencyWallet.balance,
      state.occidentWallet.balance
    );
  }, [state.sorisToUse, state.clientWallet, state.agencyWallet, state.occidentWallet]);

  // ========== EFFECTS ==========

  // Load initial data
  useEffect(() => {
    loadWalletsAndRate();
  }, [clientId]);

  // ========== HANDLERS ==========

  const loadWalletsAndRate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load conversion rate and wallets in parallel
      const [rateResponse, walletsResponse] = await Promise.all([
        gamificationAPI.getConversionRate(),
        gamificationAPI.getAllWallets(clientId),
      ]);

      setState(prev => ({
        ...prev,
        conversionRate: rateResponse.sorisToEur,
        clientWallet: {
          type: 'CLIENT' as WalletType,
          balance: walletsResponse.client.balance,
          balanceEur: walletsResponse.client.balanceEur,
          walletId: walletsResponse.client.wallet.id,
          ownerName: walletsResponse.client.wallet.ownerName,
        },
        agencyWallet: {
          type: 'AGENCY' as WalletType,
          balance: walletsResponse.agency.balance,
          balanceEur: walletsResponse.agency.balanceEur,
          walletId: walletsResponse.agency.wallet.id,
          ownerName: walletsResponse.agency.wallet.ownerName,
        },
        occidentWallet: {
          type: 'OCCIDENT' as WalletType,
          balance: walletsResponse.occident.balance,
          balanceEur: walletsResponse.occident.balanceEur,
          walletId: walletsResponse.occident.wallet.id,
          ownerName: walletsResponse.occident.wallet.ownerName,
        },
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  };

  const handleSorisChange = (value: number) => {
    setState(prev => ({ ...prev, sorisToUse: Math.max(0, Math.min(value, maxSoris)) }));
  };

  const handleQuickAction = (percentage: number) => {
    const value = getPercentageOfMax(percentage, maxSoris);
    handleSorisChange(value);
  };

  const handleApplyDiscount = async () => {
    if (!calculation || !validation.isValid || disabled) return;

    setState(prev => ({ ...prev, applying: true, error: null }));

    try {
      const response = await gamificationAPI.applyDiscount({
        receiptId,
        policyId,
        clientId,
        amount,
        sorisToUse: state.sorisToUse,
        breakdown: calculation.breakdown,
      });

      // Success!
      setState(prev => ({ ...prev, applying: false, success: true }));

      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
      });

      // Notify parent
      onDiscountApplied?.(response.discount);

      // Reset after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: false, sorisToUse: 0 }));
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al aplicar descuento';
      setState(prev => ({ ...prev, applying: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  };

  // ========== RENDER ==========

  if (state.loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Cargando información de Soris...</span>
        </div>
      </div>
    );
  }

  if (state.error && !state.clientWallet) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-medium">Error al cargar el widget</p>
            <p className="text-sm text-gray-600">{state.error}</p>
          </div>
        </div>
        <button
          onClick={loadWalletsAndRate}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const totalBalance = (state.clientWallet?.balance || 0) +
                       (state.agencyWallet?.balance || 0) +
                       (state.occidentWallet?.balance || 0);

  if (totalBalance === 0) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No tienes Soris disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            Gana Soris pagando tus pólizas a tiempo y cumpliendo con tus compromisos.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg text-sm text-blue-700">
            <Info className="w-4 h-4 mr-2" />
            ¿Qué son los Soris? Son nuestra moneda virtual para obtener descuentos.
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Aplicar Descuento SORIS</h2>
              <p className="text-blue-100 text-sm">
                Usa tu moneda virtual para obtener descuentos
              </p>
            </div>
          </div>
          <button
            className="text-white/80 hover:text-white transition-colors"
            title="¿Qué son los Soris?"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Amount to Pay */}
        <div className="bg-gray-50 rounded-lg p-6">
          <AmountDisplay
            label="Importe del recibo"
            amount={amount}
            icon={<TrendingDown className="w-4 h-4" />}
          />
        </div>

        {/* Wallets */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallets Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WalletCard
              type="CLIENT"
              wallet={state.clientWallet}
              loading={false}
              highlight={primaryWallet === 'client'}
            />
            <WalletCard
              type="AGENCY"
              wallet={state.agencyWallet}
              loading={false}
              highlight={primaryWallet === 'agency'}
            />
            <WalletCard
              type="OCCIDENT"
              wallet={state.occidentWallet}
              loading={false}
              highlight={primaryWallet === 'occident'}
            />
          </div>
        </div>

        {/* Selector */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecciona Descuento</h3>
            <span className="text-sm text-gray-500">
              Máximo: {formatSoris(maxSoris)}
            </span>
          </div>

          {/* Slider */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={maxSoris}
              step={1}
              value={state.sorisToUse}
              onChange={(e) => handleSorisChange(parseInt(e.target.value))}
              disabled={disabled || maxSoris === 0}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Input */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Soris
              </label>
              <input
                type="number"
                min={0}
                max={maxSoris}
                value={state.sorisToUse}
                onChange={(e) => handleSorisChange(parseInt(e.target.value) || 0)}
                disabled={disabled || maxSoris === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento en EUR
              </label>
              <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-medium">
                {calculation ? formatCurrency(calculation.discountAmount) : '€0.00'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <QuickActionButton
              label="25%"
              onClick={() => handleQuickAction(25)}
              disabled={disabled || maxSoris === 0}
            />
            <QuickActionButton
              label="50%"
              onClick={() => handleQuickAction(50)}
              disabled={disabled || maxSoris === 0}
            />
            <QuickActionButton
              label="75%"
              onClick={() => handleQuickAction(75)}
              disabled={disabled || maxSoris === 0}
            />
            <QuickActionButton
              label="Máximo"
              onClick={() => handleQuickAction(100)}
              disabled={disabled || maxSoris === 0}
            />
          </div>

          {/* Real-time Display */}
          {calculation && state.sorisToUse > 0 && (
            <motion.div
              className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Usarás</p>
                  <p className="text-lg font-bold text-blue-600">{formatSoris(state.sorisToUse)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Descuento</p>
                  <p className="text-lg font-bold text-green-600">
                    -{formatCurrency(calculation.discountAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nuevo importe</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(calculation.finalAmount)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Flow */}
        {calculation && state.sorisToUse > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orden de Aplicación</h3>
            <OrderFlow breakdown={calculation.breakdown} conversionRate={state.conversionRate} />
          </div>
        )}

        {/* Summary */}
        {calculation && state.sorisToUse > 0 && (
          <motion.div
            className="bg-gray-50 rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Importe original:</span>
                <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento SORIS:</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(calculation.discountAmount)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">TOTAL A PAGAR:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculation.finalAmount)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  Ahorras {getDiscountPercentage(calculation.discountAmount, amount).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-300">
              <p className="text-sm font-medium text-gray-700 mb-2">Soris utilizados:</p>
              <ul className="space-y-1">
                {calculation.breakdown.fromClient > 0 && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Cliente: {formatSoris(calculation.breakdown.fromClient)} (
                    {formatCurrency(calculation.breakdown.fromClient * state.conversionRate)})
                  </li>
                )}
                {calculation.breakdown.fromAgency > 0 && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    Agencia: {formatSoris(calculation.breakdown.fromAgency)} (
                    {formatCurrency(calculation.breakdown.fromAgency * state.conversionRate)})
                  </li>
                )}
                {calculation.breakdown.fromOccident > 0 && (
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Occident: {formatSoris(calculation.breakdown.fromOccident)} (
                    {formatCurrency(calculation.breakdown.fromOccident * state.conversionRate)})
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Validation Errors */}
        {!validation.isValid && state.sorisToUse > 0 && (
          <motion.div
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-2">
                  No se puede aplicar el descuento
                </p>
                <ul className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Warnings */}
        {validation.warnings && validation.warnings.length > 0 && validation.isValid && (
          <motion.div
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <ul className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {state.error && (
          <motion.div
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleApplyDiscount}
            disabled={
              disabled ||
              !validation.isValid ||
              state.sorisToUse === 0 ||
              state.applying ||
              state.success
            }
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {state.applying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Aplicando descuento...
              </>
            ) : state.success ? (
              <>
                <Check className="w-5 h-5" />
                ¡Descuento aplicado!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Aplicar Descuento
              </>
            )}
          </button>

          <button
            onClick={() => handleSorisChange(0)}
            disabled={state.sorisToUse === 0 || disabled || state.applying}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DiscountWidget;
