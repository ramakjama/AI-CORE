// ============================================================================
// DISCOUNT WIDGET TESTS
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiscountWidget from './DiscountWidget';
import { gamificationAPI } from '@/lib/api/gamification';
import type { GetWalletBalanceResponse, GetConversionRateResponse } from '@/types/gamification';

// Mock the API
jest.mock('@/lib/api/gamification');
const mockedAPI = gamificationAPI as jest.Mocked<typeof gamificationAPI>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

describe('DiscountWidget', () => {
  const mockClientWallet: GetWalletBalanceResponse = {
    wallet: {
      id: 'wallet-client-1',
      type: 'CLIENT',
      ownerId: 'client-123',
      ownerName: 'John Doe',
      balance: 1000,
      totalEarned: 1500,
      totalSpent: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    balance: 1000,
    balanceEur: 100,
    conversionRate: 0.1,
  };

  const mockAgencyWallet: GetWalletBalanceResponse = {
    wallet: {
      id: 'wallet-agency-1',
      type: 'AGENCY',
      ownerId: 'default',
      ownerName: 'Soriano Seguros',
      balance: 5000,
      totalEarned: 10000,
      totalSpent: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    balance: 5000,
    balanceEur: 500,
    conversionRate: 0.1,
  };

  const mockOccidentWallet: GetWalletBalanceResponse = {
    wallet: {
      id: 'wallet-occident-1',
      type: 'OCCIDENT',
      ownerId: 'occident',
      ownerName: 'Occident',
      balance: 50000,
      totalEarned: 100000,
      totalSpent: 50000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    balance: 50000,
    balanceEur: 5000,
    conversionRate: 0.1,
  };

  const mockConversionRate: GetConversionRateResponse = {
    sorisToEur: 0.1,
    effectiveFrom: new Date().toISOString(),
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockedAPI.getAllWallets.mockResolvedValue({
      client: mockClientWallet,
      agency: mockAgencyWallet,
      occident: mockOccidentWallet,
    });

    mockedAPI.getConversionRate.mockResolvedValue(mockConversionRate);
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  it('should render loading state initially', () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);
    expect(screen.getByText(/Cargando información de Soris/i)).toBeInTheDocument();
  });

  it('should render widget after loading data', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Importe del recibo/i)).toBeInTheDocument();
    expect(screen.getByText(/€450.00/i)).toBeInTheDocument();
  });

  it('should display wallet cards', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Tu Wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/Wallet Agencia/i)).toBeInTheDocument();
      expect(screen.getByText(/Wallet Occident/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1,000 Soris/i)).toBeInTheDocument();
    expect(screen.getByText(/5,000 Soris/i)).toBeInTheDocument();
    expect(screen.getByText(/50,000 Soris/i)).toBeInTheDocument();
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  it('should update Soris when slider is moved', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '500' } });

    await waitFor(() => {
      expect(screen.getByText(/Usarás/i)).toBeInTheDocument();
    });
  });

  it('should update Soris when input is changed', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '500' } });

    await waitFor(() => {
      expect(input).toHaveValue(500);
    });
  });

  it('should apply quick action buttons', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const button50 = screen.getByText('50%');
    fireEvent.click(button50);

    await waitFor(() => {
      expect(screen.getByText(/Usarás/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CALCULATION TESTS
  // ==========================================================================

  it('should calculate discount correctly', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '500' } });

    await waitFor(() => {
      // 500 Soris * 0.10 EUR = 50 EUR discount
      expect(screen.getByText(/-€50.00/i)).toBeInTheDocument();
      // 450 - 50 = 400 EUR final
      expect(screen.getByText(/€400.00/i)).toBeInTheDocument();
    });
  });

  it('should show breakdown when Soris are selected', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '500' } });

    await waitFor(() => {
      expect(screen.getByText(/Orden de Aplicación/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  it('should show error when exceeding balance', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '100000' } }); // More than available

    await waitFor(() => {
      expect(screen.getByText(/No hay suficientes Soris disponibles/i)).toBeInTheDocument();
    });
  });

  it('should disable apply button when validation fails', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const applyButton = screen.getByRole('button', { name: /Aplicar Descuento/i });
    expect(applyButton).toBeDisabled(); // No Soris selected
  });

  // ==========================================================================
  // APPLY DISCOUNT TESTS
  // ==========================================================================

  it('should call API when applying discount', async () => {
    const mockDiscount = {
      id: 'discount-1',
      receiptId: 'receipt-123',
      clientId: 'client-123',
      clientName: 'John Doe',
      originalAmount: 450,
      discountAmount: 50,
      finalAmount: 400,
      totalSorisUsed: 500,
      sorisFromClient: 500,
      sorisFromAgency: 0,
      sorisFromOccident: 0,
      conversionRate: 0.1,
      status: 'APPLIED' as const,
      transactionIds: ['tx-1'],
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockedAPI.applyDiscount.mockResolvedValue({
      discount: mockDiscount,
      transactions: [],
      updatedWallets: {},
    });

    const onDiscountApplied = jest.fn();

    render(
      <DiscountWidget
        receiptId="receipt-123"
        clientId="client-123"
        amount={450}
        onDiscountApplied={onDiscountApplied}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    // Select Soris
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '500' } });

    // Click apply
    const applyButton = screen.getByRole('button', { name: /Aplicar Descuento/i });

    await waitFor(() => {
      expect(applyButton).not.toBeDisabled();
    });

    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockedAPI.applyDiscount).toHaveBeenCalledWith({
        receiptId: 'receipt-123',
        policyId: undefined,
        clientId: 'client-123',
        amount: 450,
        sorisToUse: 500,
        breakdown: {
          fromClient: 500,
          fromAgency: 0,
          fromOccident: 0,
        },
      });
    });

    await waitFor(() => {
      expect(onDiscountApplied).toHaveBeenCalledWith(mockDiscount);
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  it('should handle API error gracefully', async () => {
    mockedAPI.getAllWallets.mockRejectedValue(new Error('Network error'));

    const onError = jest.fn();

    render(
      <DiscountWidget
        clientId="client-123"
        amount={450}
        onError={onError}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar el widget/i)).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalledWith('Network error');
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  it('should show message when no Soris available', async () => {
    const emptyWallet = {
      ...mockClientWallet,
      balance: 0,
      balanceEur: 0,
    };

    mockedAPI.getAllWallets.mockResolvedValue({
      client: emptyWallet,
      agency: { ...mockAgencyWallet, balance: 0, balanceEur: 0 },
      occident: { ...mockOccidentWallet, balance: 0, balanceEur: 0 },
    });

    render(<DiscountWidget clientId="client-123" amount={450} />);

    await waitFor(() => {
      expect(screen.getByText(/No tienes Soris disponibles/i)).toBeInTheDocument();
    });
  });

  it('should handle disabled prop', async () => {
    render(<DiscountWidget clientId="client-123" amount={450} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Aplicar Descuento SORIS/i)).toBeInTheDocument();
    });

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();

    const applyButton = screen.getByRole('button', { name: /Aplicar Descuento/i });
    expect(applyButton).toBeDisabled();
  });
});
