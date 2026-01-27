/**
 * ERP Connector
 * Conectores para SAP, Oracle, Microsoft Dynamics, Sage, Odoo
 */

import axios, { AxiosInstance } from 'axios';
import {
  Connector,
  ConnectorConfig,
  IntegrationCredentials,
  IntegrationType,
  AuthType,
  OperationResult,
  PaginatedResult
} from '../types';

// ============================================
// INTERFACES COMUNES ERP
// ============================================

/**
 * Producto ERP
 */
export interface ERPProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice?: number;
  currency: string;
  taxRate?: number;
  unit?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  barcode?: string;
  active: boolean;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cliente ERP
 */
export interface ERPCustomer {
  id: string;
  code: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  billingAddress?: ERPAddress;
  shippingAddress?: ERPAddress;
  paymentTerms?: string;
  creditLimit?: number;
  currency: string;
  priceList?: string;
  active: boolean;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Proveedor ERP
 */
export interface ERPSupplier {
  id: string;
  code: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: ERPAddress;
  paymentTerms?: string;
  currency: string;
  leadTime?: number;
  active: boolean;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Direccion ERP
 */
export interface ERPAddress {
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/**
 * Pedido de venta ERP
 */
export interface ERPSalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  lines: ERPOrderLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentTerms?: string;
  shippingAddress?: ERPAddress;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Linea de pedido
 */
export interface ERPOrderLine {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  subtotal: number;
}

/**
 * Pedido de compra ERP
 */
export interface ERPPurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: Date;
  expectedDate?: Date;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  lines: ERPOrderLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Factura ERP
 */
export interface ERPInvoice {
  id: string;
  invoiceNumber: string;
  type: 'customer' | 'supplier';
  customerId?: string;
  supplierId?: string;
  partnerName?: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  lines: ERPInvoiceLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  paymentTerms?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Linea de factura
 */
export interface ERPInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  subtotal: number;
  accountCode?: string;
}

/**
 * Asiento contable ERP
 */
export interface ERPJournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  lines: ERPJournalLine[];
  status: 'draft' | 'posted' | 'reversed';
  reference?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Linea de asiento contable
 */
export interface ERPJournalLine {
  id: string;
  accountCode: string;
  accountName?: string;
  description?: string;
  debit: number;
  credit: number;
  partnerId?: string;
  partnerName?: string;
}

/**
 * Movimiento de inventario
 */
export interface ERPStockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  productId: string;
  productName?: string;
  quantity: number;
  sourceLocation?: string;
  destinationLocation?: string;
  reference?: string;
  date: Date;
  status: 'pending' | 'done' | 'cancelled';
  createdAt: Date;
}

/**
 * Filtros de busqueda ERP
 */
export interface ERPSearchFilters {
  query?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CONECTOR BASE ERP
// ============================================

/**
 * Conector base para ERP
 */
abstract class BaseERPConnector implements Connector {
  config: ConnectorConfig;
  protected client: AxiosInstance | null = null;
  protected credentials: IntegrationCredentials | null = null;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract initialize(credentials: IntegrationCredentials): Promise<void>;
  abstract testConnection(): Promise<boolean>;

  async execute<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    const endpointConfig = this.config.endpoints.find(e => e.name === endpoint);
    if (!endpointConfig) {
      throw new Error(`Endpoint ${endpoint} not found`);
    }

    const response = await this.client.request<T>({
      method: endpointConfig.method,
      url: endpointConfig.path,
      params: endpointConfig.method === 'GET' ? params : undefined,
      data: endpointConfig.method !== 'GET' ? params : undefined
    });

    return response.data;
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.credentials = null;
  }

  // Metodos abstractos comunes
  abstract getProducts(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPProduct>>>;
  abstract getProduct(id: string): Promise<OperationResult<ERPProduct>>;
  abstract createProduct(product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>>;
  abstract updateProduct(id: string, product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>>;

  abstract getCustomers(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPCustomer>>>;
  abstract getCustomer(id: string): Promise<OperationResult<ERPCustomer>>;
  abstract createCustomer(customer: Partial<ERPCustomer>): Promise<OperationResult<ERPCustomer>>;

  abstract getSalesOrders(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPSalesOrder>>>;
  abstract getSalesOrder(id: string): Promise<OperationResult<ERPSalesOrder>>;
  abstract createSalesOrder(order: Partial<ERPSalesOrder>): Promise<OperationResult<ERPSalesOrder>>;

  abstract getInvoices(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPInvoice>>>;
  abstract getInvoice(id: string): Promise<OperationResult<ERPInvoice>>;
  abstract createInvoice(invoice: Partial<ERPInvoice>): Promise<OperationResult<ERPInvoice>>;
}

// ============================================
// SAP CONNECTOR
// ============================================

/**
 * Conector SAP Business One / S4HANA
 */
export class SAPConnector extends BaseERPConnector {
  private sessionId: string = '';

  constructor() {
    super({
      type: IntegrationType.ERP_SAP,
      name: 'SAP Business Connector',
      version: '1.0.0',
      endpoints: [
        { name: 'getItems', path: '/b1s/v1/Items', method: 'GET', description: 'Get items/products' },
        { name: 'getItem', path: '/b1s/v1/Items(\'{code}\')', method: 'GET', description: 'Get item by code' },
        { name: 'createItem', path: '/b1s/v1/Items', method: 'POST', description: 'Create item' },
        { name: 'updateItem', path: '/b1s/v1/Items(\'{code}\')', method: 'PATCH', description: 'Update item' },
        { name: 'getBusinessPartners', path: '/b1s/v1/BusinessPartners', method: 'GET', description: 'Get business partners' },
        { name: 'getOrders', path: '/b1s/v1/Orders', method: 'GET', description: 'Get sales orders' },
        { name: 'createOrder', path: '/b1s/v1/Orders', method: 'POST', description: 'Create sales order' },
        { name: 'getInvoices', path: '/b1s/v1/Invoices', method: 'GET', description: 'Get invoices' },
        { name: 'createInvoice', path: '/b1s/v1/Invoices', method: 'POST', description: 'Create invoice' },
        { name: 'getJournalEntries', path: '/b1s/v1/JournalEntries', method: 'GET', description: 'Get journal entries' }
      ],
      authentication: [AuthType.BASIC, AuthType.OAUTH2],
      rateLimits: { requests: 100, period: 60 },
      features: ['items', 'business-partners', 'orders', 'invoices', 'accounting', 'inventory'],
      documentation: 'https://help.sap.com/docs/SAP_BUSINESS_ONE'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    const baseURL = credentials.customParams?.serviceLayerUrl as string || 'https://localhost:50000';

    this.client = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Login to get session
    if (credentials.authType === AuthType.BASIC) {
      const loginResponse = await this.client.post('/b1s/v1/Login', {
        CompanyDB: credentials.customParams?.companyDB,
        UserName: credentials.username,
        Password: credentials.password
      });

      this.sessionId = loginResponse.data.SessionId;
      this.client.defaults.headers.common['Cookie'] = `B1SESSION=${this.sessionId}`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/b1s/v1/Items?$top=1');
      return true;
    } catch {
      return false;
    }
  }

  async getProducts(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPProduct>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const params: Record<string, string> = {
        '$top': String(filters?.pageSize || 100),
        '$skip': String(((filters?.page || 1) - 1) * (filters?.pageSize || 100))
      };

      if (filters?.query) {
        params['$filter'] = `contains(ItemName, '${filters.query}')`;
      }

      const response = await this.client.get('/b1s/v1/Items', { params });

      const products = response.data.value.map((item: Record<string, unknown>) => this.mapSAPToProduct(item));

      return {
        success: true,
        data: {
          items: products,
          total: response.data['odata.count'] || products.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data['odata.count'] || products.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data['odata.nextLink'],
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_PRODUCTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get products'
        }
      };
    }
  }

  async getProduct(id: string): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/b1s/v1/Items('${id}')`);
      return { success: true, data: this.mapSAPToProduct(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_PRODUCT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product'
        }
      };
    }
  }

  async createProduct(product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sapItem = {
        ItemCode: product.sku,
        ItemName: product.name,
        ItemType: 'itItems',
        ItemsGroupCode: 100,
        SalesItem: 'tYES',
        PurchaseItem: 'tYES',
        InventoryItem: 'tYES'
      };

      const response = await this.client.post('/b1s/v1/Items', sapItem);
      return this.getProduct(response.data.ItemCode);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product'
        }
      };
    }
  }

  async updateProduct(id: string, product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sapItem: Record<string, unknown> = {};
      if (product.name) sapItem.ItemName = product.name;
      if (product.description) sapItem.User_Text = product.description;

      await this.client.patch(`/b1s/v1/Items('${id}')`, sapItem);
      return this.getProduct(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product'
        }
      };
    }
  }

  async getCustomers(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPCustomer>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const params: Record<string, string> = {
        '$filter': "CardType eq 'cCustomer'",
        '$top': String(filters?.pageSize || 100),
        '$skip': String(((filters?.page || 1) - 1) * (filters?.pageSize || 100))
      };

      if (filters?.query) {
        params['$filter'] += ` and contains(CardName, '${filters.query}')`;
      }

      const response = await this.client.get('/b1s/v1/BusinessPartners', { params });

      const customers = response.data.value.map((bp: Record<string, unknown>) => ({
        id: bp.CardCode as string,
        code: bp.CardCode as string,
        name: bp.CardName as string || '',
        taxId: bp.FederalTaxID as string,
        email: bp.EmailAddress as string,
        phone: bp.Phone1 as string,
        currency: bp.Currency as string || 'EUR',
        active: bp.Valid === 'tYES',
        createdAt: new Date(bp.CreateDate as string),
        updatedAt: new Date(bp.UpdateDate as string)
      }));

      return {
        success: true,
        data: {
          items: customers,
          total: response.data['odata.count'] || customers.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data['odata.count'] || customers.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data['odata.nextLink'],
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CUSTOMERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customers'
        }
      };
    }
  }

  async getCustomer(id: string): Promise<OperationResult<ERPCustomer>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/b1s/v1/BusinessPartners('${id}')`);
      const bp = response.data;
      return {
        success: true,
        data: {
          id: bp.CardCode,
          code: bp.CardCode,
          name: bp.CardName || '',
          taxId: bp.FederalTaxID,
          email: bp.EmailAddress,
          phone: bp.Phone1,
          currency: bp.Currency || 'EUR',
          active: bp.Valid === 'tYES',
          createdAt: new Date(bp.CreateDate),
          updatedAt: new Date(bp.UpdateDate)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CUSTOMER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customer'
        }
      };
    }
  }

  async createCustomer(customer: Partial<ERPCustomer>): Promise<OperationResult<ERPCustomer>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sapBP = {
        CardCode: customer.code,
        CardName: customer.name,
        CardType: 'cCustomer',
        FederalTaxID: customer.taxId,
        EmailAddress: customer.email,
        Phone1: customer.phone,
        Currency: customer.currency || 'EUR'
      };

      const response = await this.client.post('/b1s/v1/BusinessPartners', sapBP);
      return this.getCustomer(response.data.CardCode);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create customer'
        }
      };
    }
  }

  async getSalesOrders(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPSalesOrder>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const params: Record<string, string> = {
        '$top': String(filters?.pageSize || 100),
        '$skip': String(((filters?.page || 1) - 1) * (filters?.pageSize || 100)),
        '$orderby': 'DocEntry desc'
      };

      const response = await this.client.get('/b1s/v1/Orders', { params });

      const orders = response.data.value.map((order: Record<string, unknown>) => this.mapSAPToSalesOrder(order));

      return {
        success: true,
        data: {
          items: orders,
          total: response.data['odata.count'] || orders.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data['odata.count'] || orders.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data['odata.nextLink'],
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_ORDERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sales orders'
        }
      };
    }
  }

  async getSalesOrder(id: string): Promise<OperationResult<ERPSalesOrder>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/b1s/v1/Orders(${id})`);
      return { success: true, data: this.mapSAPToSalesOrder(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_ORDER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sales order'
        }
      };
    }
  }

  async createSalesOrder(order: Partial<ERPSalesOrder>): Promise<OperationResult<ERPSalesOrder>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sapOrder = {
        CardCode: order.customerId,
        DocDate: order.orderDate?.toISOString().split('T')[0],
        DocDueDate: order.deliveryDate?.toISOString().split('T')[0],
        Comments: order.notes,
        DocumentLines: order.lines?.map(line => ({
          ItemCode: line.productId,
          Quantity: line.quantity,
          UnitPrice: line.unitPrice,
          DiscountPercent: line.discount
        }))
      };

      const response = await this.client.post('/b1s/v1/Orders', sapOrder);
      return this.getSalesOrder(response.data.DocEntry);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create sales order'
        }
      };
    }
  }

  async getInvoices(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPInvoice>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const params: Record<string, string> = {
        '$top': String(filters?.pageSize || 100),
        '$skip': String(((filters?.page || 1) - 1) * (filters?.pageSize || 100)),
        '$orderby': 'DocEntry desc'
      };

      const response = await this.client.get('/b1s/v1/Invoices', { params });

      const invoices = response.data.value.map((inv: Record<string, unknown>) => this.mapSAPToInvoice(inv));

      return {
        success: true,
        data: {
          items: invoices,
          total: response.data['odata.count'] || invoices.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data['odata.count'] || invoices.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data['odata.nextLink'],
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_INVOICES_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoices'
        }
      };
    }
  }

  async getInvoice(id: string): Promise<OperationResult<ERPInvoice>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/b1s/v1/Invoices(${id})`);
      return { success: true, data: this.mapSAPToInvoice(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_INVOICE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoice'
        }
      };
    }
  }

  async createInvoice(invoice: Partial<ERPInvoice>): Promise<OperationResult<ERPInvoice>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sapInvoice = {
        CardCode: invoice.customerId,
        DocDate: invoice.invoiceDate?.toISOString().split('T')[0],
        DocDueDate: invoice.dueDate?.toISOString().split('T')[0],
        Comments: invoice.notes,
        DocumentLines: invoice.lines?.map(line => ({
          ItemDescription: line.description,
          Quantity: line.quantity,
          UnitPrice: line.unitPrice,
          DiscountPercent: line.discount
        }))
      };

      const response = await this.client.post('/b1s/v1/Invoices', sapInvoice);
      return this.getInvoice(response.data.DocEntry);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAP_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create invoice'
        }
      };
    }
  }

  private mapSAPToProduct(item: Record<string, unknown>): ERPProduct {
    return {
      id: item.ItemCode as string,
      sku: item.ItemCode as string,
      name: item.ItemName as string || '',
      description: item.User_Text as string,
      unitPrice: item.AvgStdPrice as number || 0,
      currency: 'EUR',
      stockQuantity: item.QuantityOnStock as number,
      barcode: item.BarCode as string,
      active: item.Valid === 'tYES',
      createdAt: new Date(item.CreateDate as string),
      updatedAt: new Date(item.UpdateDate as string)
    };
  }

  private mapSAPToSalesOrder(order: Record<string, unknown>): ERPSalesOrder {
    const lines = (order.DocumentLines as Array<Record<string, unknown>>)?.map(line => ({
      id: String(line.LineNum),
      productId: line.ItemCode as string,
      productName: line.ItemDescription as string,
      quantity: line.Quantity as number,
      unitPrice: line.UnitPrice as number,
      discount: line.DiscountPercent as number,
      taxRate: line.TaxPercentagePerRow as number,
      subtotal: line.LineTotal as number
    })) || [];

    return {
      id: String(order.DocEntry),
      orderNumber: String(order.DocNum),
      customerId: order.CardCode as string,
      customerName: order.CardName as string,
      orderDate: new Date(order.DocDate as string),
      deliveryDate: order.DocDueDate ? new Date(order.DocDueDate as string) : undefined,
      status: this.mapSAPOrderStatus(order.DocumentStatus as string),
      lines,
      subtotal: order.DocTotal as number - (order.VatSum as number || 0),
      taxAmount: order.VatSum as number || 0,
      total: order.DocTotal as number,
      currency: order.DocCurrency as string || 'EUR',
      notes: order.Comments as string,
      createdAt: new Date(order.CreateDate as string),
      updatedAt: new Date(order.UpdateDate as string)
    };
  }

  private mapSAPToInvoice(inv: Record<string, unknown>): ERPInvoice {
    const lines = (inv.DocumentLines as Array<Record<string, unknown>>)?.map(line => ({
      id: String(line.LineNum),
      description: line.ItemDescription as string || '',
      quantity: line.Quantity as number,
      unitPrice: line.UnitPrice as number,
      discount: line.DiscountPercent as number,
      taxRate: line.TaxPercentagePerRow as number,
      subtotal: line.LineTotal as number
    })) || [];

    return {
      id: String(inv.DocEntry),
      invoiceNumber: String(inv.DocNum),
      type: 'customer',
      customerId: inv.CardCode as string,
      partnerName: inv.CardName as string,
      invoiceDate: new Date(inv.DocDate as string),
      dueDate: new Date(inv.DocDueDate as string),
      status: this.mapSAPInvoiceStatus(inv.DocumentStatus as string, inv.PaidToDate as number, inv.DocTotal as number),
      lines,
      subtotal: (inv.DocTotal as number) - (inv.VatSum as number || 0),
      taxAmount: inv.VatSum as number || 0,
      total: inv.DocTotal as number,
      amountPaid: inv.PaidToDate as number || 0,
      amountDue: (inv.DocTotal as number) - (inv.PaidToDate as number || 0),
      currency: inv.DocCurrency as string || 'EUR',
      notes: inv.Comments as string,
      createdAt: new Date(inv.CreateDate as string),
      updatedAt: new Date(inv.UpdateDate as string)
    };
  }

  private mapSAPOrderStatus(status: string): ERPSalesOrder['status'] {
    switch (status) {
      case 'bost_Open': return 'confirmed';
      case 'bost_Close': return 'delivered';
      case 'bost_Paid': return 'delivered';
      case 'bost_Cancelled': return 'cancelled';
      default: return 'draft';
    }
  }

  private mapSAPInvoiceStatus(status: string, paid: number, total: number): ERPInvoice['status'] {
    if (status === 'bost_Close' || paid >= total) return 'paid';
    if (paid > 0) return 'partial';
    return 'sent';
  }
}

// ============================================
// ODOO CONNECTOR
// ============================================

/**
 * Conector Odoo
 */
export class OdooConnector extends BaseERPConnector {
  private uid: number = 0;
  private db: string = '';

  constructor() {
    super({
      type: IntegrationType.ERP_ODOO,
      name: 'Odoo ERP Connector',
      version: '16.0',
      endpoints: [
        { name: 'getProducts', path: '/api/product.product', method: 'GET', description: 'Get products' },
        { name: 'getPartners', path: '/api/res.partner', method: 'GET', description: 'Get partners' },
        { name: 'getSaleOrders', path: '/api/sale.order', method: 'GET', description: 'Get sale orders' },
        { name: 'getInvoices', path: '/api/account.move', method: 'GET', description: 'Get invoices' },
        { name: 'getStockMoves', path: '/api/stock.move', method: 'GET', description: 'Get stock moves' }
      ],
      authentication: [AuthType.API_KEY, AuthType.BASIC],
      rateLimits: { requests: 100, period: 60 },
      features: ['products', 'partners', 'sales', 'invoicing', 'inventory', 'accounting'],
      documentation: 'https://www.odoo.com/documentation/16.0/developer/reference/external_api.html'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;
    this.db = credentials.customParams?.database as string || '';

    const baseURL = credentials.customParams?.url as string || 'https://your-instance.odoo.com';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Authenticate via JSON-RPC
    if (credentials.username && credentials.password) {
      const authResponse = await this.client.post('/jsonrpc', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [this.db, credentials.username, credentials.password, {}]
        },
        id: Date.now()
      });

      this.uid = authResponse.data.result;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client || !this.uid) return false;
      await this.callOdoo('res.partner', 'search_count', [[['is_company', '=', true]]]);
      return true;
    } catch {
      return false;
    }
  }

  private async callOdoo(model: string, method: string, args: unknown[]): Promise<unknown> {
    if (!this.client) throw new Error('Not initialized');

    const response = await this.client.post('/jsonrpc', {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          this.db,
          this.uid,
          this.credentials?.password || this.credentials?.apiKey,
          model,
          method,
          ...args
        ]
      },
      id: Date.now()
    });

    if (response.data.error) {
      throw new Error(response.data.error.data?.message || 'Odoo API error');
    }

    return response.data.result;
  }

  async getProducts(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPProduct>>> {
    try {
      const domain: unknown[][] = [];
      if (filters?.query) {
        domain.push(['name', 'ilike', filters.query]);
      }

      const count = await this.callOdoo('product.product', 'search_count', [domain]) as number;

      const ids = await this.callOdoo('product.product', 'search', [
        domain,
        {
          limit: filters?.pageSize || 100,
          offset: ((filters?.page || 1) - 1) * (filters?.pageSize || 100)
        }
      ]) as number[];

      const records = await this.callOdoo('product.product', 'read', [
        ids,
        ['default_code', 'name', 'description', 'list_price', 'standard_price', 'categ_id',
          'uom_id', 'qty_available', 'barcode', 'active', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      const products = records.map(r => ({
        id: String(r.id),
        sku: r.default_code as string || String(r.id),
        name: r.name as string || '',
        description: r.description as string,
        category: (r.categ_id as [number, string])?.[1],
        unitPrice: r.list_price as number || 0,
        costPrice: r.standard_price as number,
        currency: 'EUR',
        unit: (r.uom_id as [number, string])?.[1],
        stockQuantity: r.qty_available as number,
        barcode: r.barcode as string,
        active: r.active as boolean,
        createdAt: new Date(r.create_date as string),
        updatedAt: new Date(r.write_date as string)
      }));

      return {
        success: true,
        data: {
          items: products,
          total: count,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(count / (filters?.pageSize || 100)),
          hasNext: ((filters?.page || 1) * (filters?.pageSize || 100)) < count,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_PRODUCTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get products'
        }
      };
    }
  }

  async getProduct(id: string): Promise<OperationResult<ERPProduct>> {
    try {
      const records = await this.callOdoo('product.product', 'read', [
        [parseInt(id)],
        ['default_code', 'name', 'description', 'list_price', 'standard_price', 'categ_id',
          'uom_id', 'qty_available', 'barcode', 'active', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      if (!records.length) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Product not found' }
        };
      }

      const r = records[0];
      return {
        success: true,
        data: {
          id: String(r.id),
          sku: r.default_code as string || String(r.id),
          name: r.name as string || '',
          description: r.description as string,
          category: (r.categ_id as [number, string])?.[1],
          unitPrice: r.list_price as number || 0,
          costPrice: r.standard_price as number,
          currency: 'EUR',
          unit: (r.uom_id as [number, string])?.[1],
          stockQuantity: r.qty_available as number,
          barcode: r.barcode as string,
          active: r.active as boolean,
          createdAt: new Date(r.create_date as string),
          updatedAt: new Date(r.write_date as string)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_PRODUCT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product'
        }
      };
    }
  }

  async createProduct(product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      const id = await this.callOdoo('product.product', 'create', [{
        default_code: product.sku,
        name: product.name,
        description: product.description,
        list_price: product.unitPrice,
        standard_price: product.costPrice,
        barcode: product.barcode
      }]) as number;

      return this.getProduct(String(id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product'
        }
      };
    }
  }

  async updateProduct(id: string, product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      const values: Record<string, unknown> = {};
      if (product.name) values.name = product.name;
      if (product.description) values.description = product.description;
      if (product.unitPrice !== undefined) values.list_price = product.unitPrice;
      if (product.sku) values.default_code = product.sku;

      await this.callOdoo('product.product', 'write', [[parseInt(id)], values]);
      return this.getProduct(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product'
        }
      };
    }
  }

  async getCustomers(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPCustomer>>> {
    try {
      const domain: unknown[][] = [['customer_rank', '>', 0]];
      if (filters?.query) {
        domain.push(['name', 'ilike', filters.query]);
      }

      const count = await this.callOdoo('res.partner', 'search_count', [domain]) as number;

      const ids = await this.callOdoo('res.partner', 'search', [
        domain,
        { limit: filters?.pageSize || 100, offset: ((filters?.page || 1) - 1) * (filters?.pageSize || 100) }
      ]) as number[];

      const records = await this.callOdoo('res.partner', 'read', [
        ids,
        ['ref', 'name', 'vat', 'email', 'phone', 'street', 'city', 'zip', 'country_id',
          'property_payment_term_id', 'credit_limit', 'active', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      const customers = records.map(r => ({
        id: String(r.id),
        code: r.ref as string || String(r.id),
        name: r.name as string || '',
        taxId: r.vat as string,
        email: r.email as string,
        phone: r.phone as string,
        billingAddress: {
          street: r.street as string || '',
          city: r.city as string || '',
          postalCode: r.zip as string || '',
          country: (r.country_id as [number, string])?.[1] || ''
        },
        paymentTerms: (r.property_payment_term_id as [number, string])?.[1],
        creditLimit: r.credit_limit as number,
        currency: 'EUR',
        active: r.active as boolean,
        createdAt: new Date(r.create_date as string),
        updatedAt: new Date(r.write_date as string)
      }));

      return {
        success: true,
        data: {
          items: customers,
          total: count,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(count / (filters?.pageSize || 100)),
          hasNext: ((filters?.page || 1) * (filters?.pageSize || 100)) < count,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CUSTOMERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customers'
        }
      };
    }
  }

  async getCustomer(id: string): Promise<OperationResult<ERPCustomer>> {
    try {
      const records = await this.callOdoo('res.partner', 'read', [
        [parseInt(id)],
        ['ref', 'name', 'vat', 'email', 'phone', 'street', 'city', 'zip', 'country_id',
          'property_payment_term_id', 'credit_limit', 'active', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      if (!records.length) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } };
      }

      const r = records[0];
      return {
        success: true,
        data: {
          id: String(r.id),
          code: r.ref as string || String(r.id),
          name: r.name as string || '',
          taxId: r.vat as string,
          email: r.email as string,
          phone: r.phone as string,
          currency: 'EUR',
          active: r.active as boolean,
          createdAt: new Date(r.create_date as string),
          updatedAt: new Date(r.write_date as string)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CUSTOMER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customer'
        }
      };
    }
  }

  async createCustomer(customer: Partial<ERPCustomer>): Promise<OperationResult<ERPCustomer>> {
    try {
      const id = await this.callOdoo('res.partner', 'create', [{
        ref: customer.code,
        name: customer.name,
        vat: customer.taxId,
        email: customer.email,
        phone: customer.phone,
        customer_rank: 1
      }]) as number;

      return this.getCustomer(String(id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create customer'
        }
      };
    }
  }

  async getSalesOrders(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPSalesOrder>>> {
    try {
      const domain: unknown[][] = [];
      if (filters?.status) {
        domain.push(['state', '=', filters.status]);
      }

      const count = await this.callOdoo('sale.order', 'search_count', [domain]) as number;

      const ids = await this.callOdoo('sale.order', 'search', [
        domain,
        { limit: filters?.pageSize || 100, offset: ((filters?.page || 1) - 1) * (filters?.pageSize || 100), order: 'id desc' }
      ]) as number[];

      const records = await this.callOdoo('sale.order', 'read', [
        ids,
        ['name', 'partner_id', 'date_order', 'commitment_date', 'state', 'order_line',
          'amount_untaxed', 'amount_tax', 'amount_total', 'currency_id', 'note', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      const orders = await Promise.all(records.map(async r => {
        const lines = await this.getOrderLines(r.order_line as number[]);
        return {
          id: String(r.id),
          orderNumber: r.name as string,
          customerId: String((r.partner_id as [number, string])[0]),
          customerName: (r.partner_id as [number, string])[1],
          orderDate: new Date(r.date_order as string),
          deliveryDate: r.commitment_date ? new Date(r.commitment_date as string) : undefined,
          status: this.mapOdooOrderStatus(r.state as string),
          lines,
          subtotal: r.amount_untaxed as number,
          taxAmount: r.amount_tax as number,
          total: r.amount_total as number,
          currency: (r.currency_id as [number, string])?.[1] || 'EUR',
          notes: r.note as string,
          createdAt: new Date(r.create_date as string),
          updatedAt: new Date(r.write_date as string)
        };
      }));

      return {
        success: true,
        data: {
          items: orders,
          total: count,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(count / (filters?.pageSize || 100)),
          hasNext: ((filters?.page || 1) * (filters?.pageSize || 100)) < count,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_ORDERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sales orders'
        }
      };
    }
  }

  async getSalesOrder(id: string): Promise<OperationResult<ERPSalesOrder>> {
    try {
      const records = await this.callOdoo('sale.order', 'read', [
        [parseInt(id)],
        ['name', 'partner_id', 'date_order', 'commitment_date', 'state', 'order_line',
          'amount_untaxed', 'amount_tax', 'amount_total', 'currency_id', 'note', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      if (!records.length) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } };
      }

      const r = records[0];
      const lines = await this.getOrderLines(r.order_line as number[]);

      return {
        success: true,
        data: {
          id: String(r.id),
          orderNumber: r.name as string,
          customerId: String((r.partner_id as [number, string])[0]),
          customerName: (r.partner_id as [number, string])[1],
          orderDate: new Date(r.date_order as string),
          deliveryDate: r.commitment_date ? new Date(r.commitment_date as string) : undefined,
          status: this.mapOdooOrderStatus(r.state as string),
          lines,
          subtotal: r.amount_untaxed as number,
          taxAmount: r.amount_tax as number,
          total: r.amount_total as number,
          currency: (r.currency_id as [number, string])?.[1] || 'EUR',
          notes: r.note as string,
          createdAt: new Date(r.create_date as string),
          updatedAt: new Date(r.write_date as string)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_ORDER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get sales order'
        }
      };
    }
  }

  async createSalesOrder(order: Partial<ERPSalesOrder>): Promise<OperationResult<ERPSalesOrder>> {
    try {
      const orderLines = order.lines?.map(line => [0, 0, {
        product_id: parseInt(line.productId),
        product_uom_qty: line.quantity,
        price_unit: line.unitPrice,
        discount: line.discount || 0
      }]) || [];

      const id = await this.callOdoo('sale.order', 'create', [{
        partner_id: parseInt(order.customerId || '0'),
        date_order: order.orderDate?.toISOString(),
        commitment_date: order.deliveryDate?.toISOString(),
        note: order.notes,
        order_line: orderLines
      }]) as number;

      return this.getSalesOrder(String(id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create sales order'
        }
      };
    }
  }

  async getInvoices(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPInvoice>>> {
    try {
      const domain: unknown[][] = [['move_type', 'in', ['out_invoice', 'out_refund']]];

      const count = await this.callOdoo('account.move', 'search_count', [domain]) as number;

      const ids = await this.callOdoo('account.move', 'search', [
        domain,
        { limit: filters?.pageSize || 100, offset: ((filters?.page || 1) - 1) * (filters?.pageSize || 100), order: 'id desc' }
      ]) as number[];

      const records = await this.callOdoo('account.move', 'read', [
        ids,
        ['name', 'move_type', 'partner_id', 'invoice_date', 'invoice_date_due', 'state',
          'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual', 'currency_id', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      const invoices = records.map(r => ({
        id: String(r.id),
        invoiceNumber: r.name as string,
        type: 'customer' as const,
        customerId: String((r.partner_id as [number, string])[0]),
        partnerName: (r.partner_id as [number, string])[1],
        invoiceDate: new Date(r.invoice_date as string),
        dueDate: new Date(r.invoice_date_due as string),
        status: this.mapOdooInvoiceStatus(r.state as string, r.amount_residual as number),
        lines: [],
        subtotal: r.amount_untaxed as number,
        taxAmount: r.amount_tax as number,
        total: r.amount_total as number,
        amountPaid: (r.amount_total as number) - (r.amount_residual as number),
        amountDue: r.amount_residual as number,
        currency: (r.currency_id as [number, string])?.[1] || 'EUR',
        createdAt: new Date(r.create_date as string),
        updatedAt: new Date(r.write_date as string)
      }));

      return {
        success: true,
        data: {
          items: invoices,
          total: count,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(count / (filters?.pageSize || 100)),
          hasNext: ((filters?.page || 1) * (filters?.pageSize || 100)) < count,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_INVOICES_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoices'
        }
      };
    }
  }

  async getInvoice(id: string): Promise<OperationResult<ERPInvoice>> {
    try {
      const records = await this.callOdoo('account.move', 'read', [
        [parseInt(id)],
        ['name', 'move_type', 'partner_id', 'invoice_date', 'invoice_date_due', 'state',
          'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual', 'currency_id', 'create_date', 'write_date']
      ]) as Array<Record<string, unknown>>;

      if (!records.length) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } };
      }

      const r = records[0];
      return {
        success: true,
        data: {
          id: String(r.id),
          invoiceNumber: r.name as string,
          type: 'customer',
          customerId: String((r.partner_id as [number, string])[0]),
          partnerName: (r.partner_id as [number, string])[1],
          invoiceDate: new Date(r.invoice_date as string),
          dueDate: new Date(r.invoice_date_due as string),
          status: this.mapOdooInvoiceStatus(r.state as string, r.amount_residual as number),
          lines: [],
          subtotal: r.amount_untaxed as number,
          taxAmount: r.amount_tax as number,
          total: r.amount_total as number,
          amountPaid: (r.amount_total as number) - (r.amount_residual as number),
          amountDue: r.amount_residual as number,
          currency: (r.currency_id as [number, string])?.[1] || 'EUR',
          createdAt: new Date(r.create_date as string),
          updatedAt: new Date(r.write_date as string)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_INVOICE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoice'
        }
      };
    }
  }

  async createInvoice(invoice: Partial<ERPInvoice>): Promise<OperationResult<ERPInvoice>> {
    try {
      const invoiceLines = invoice.lines?.map(line => [0, 0, {
        name: line.description,
        quantity: line.quantity,
        price_unit: line.unitPrice,
        discount: line.discount || 0
      }]) || [];

      const id = await this.callOdoo('account.move', 'create', [{
        move_type: invoice.type === 'supplier' ? 'in_invoice' : 'out_invoice',
        partner_id: parseInt(invoice.customerId || invoice.supplierId || '0'),
        invoice_date: invoice.invoiceDate?.toISOString().split('T')[0],
        invoice_date_due: invoice.dueDate?.toISOString().split('T')[0],
        invoice_line_ids: invoiceLines
      }]) as number;

      return this.getInvoice(String(id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ODOO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create invoice'
        }
      };
    }
  }

  private async getOrderLines(lineIds: number[]): Promise<ERPOrderLine[]> {
    if (!lineIds.length) return [];

    const records = await this.callOdoo('sale.order.line', 'read', [
      lineIds,
      ['product_id', 'name', 'product_uom_qty', 'price_unit', 'discount', 'price_subtotal']
    ]) as Array<Record<string, unknown>>;

    return records.map(r => ({
      id: String(r.id),
      productId: String((r.product_id as [number, string])?.[0] || ''),
      productName: (r.product_id as [number, string])?.[1] || r.name as string,
      quantity: r.product_uom_qty as number,
      unitPrice: r.price_unit as number,
      discount: r.discount as number,
      subtotal: r.price_subtotal as number
    }));
  }

  private mapOdooOrderStatus(state: string): ERPSalesOrder['status'] {
    switch (state) {
      case 'draft': return 'draft';
      case 'sent': return 'draft';
      case 'sale': return 'confirmed';
      case 'done': return 'delivered';
      case 'cancel': return 'cancelled';
      default: return 'draft';
    }
  }

  private mapOdooInvoiceStatus(state: string, amountDue: number): ERPInvoice['status'] {
    if (state === 'draft') return 'draft';
    if (state === 'cancel') return 'cancelled';
    if (state === 'posted') {
      if (amountDue === 0) return 'paid';
      if (amountDue > 0) return 'sent';
    }
    return 'draft';
  }
}

// ============================================
// SAGE CONNECTOR
// ============================================

/**
 * Conector Sage (50cloud, X3, etc.)
 */
export class SageConnector extends BaseERPConnector {
  constructor() {
    super({
      type: IntegrationType.ERP_SAGE,
      name: 'Sage ERP Connector',
      version: '1.0.0',
      endpoints: [
        { name: 'getProducts', path: '/api/v1/products', method: 'GET', description: 'Get products' },
        { name: 'getCustomers', path: '/api/v1/customers', method: 'GET', description: 'Get customers' },
        { name: 'getSalesOrders', path: '/api/v1/sales-orders', method: 'GET', description: 'Get sales orders' },
        { name: 'getInvoices', path: '/api/v1/invoices', method: 'GET', description: 'Get invoices' }
      ],
      authentication: [AuthType.OAUTH2, AuthType.API_KEY],
      rateLimits: { requests: 100, period: 60 },
      features: ['products', 'customers', 'orders', 'invoices', 'accounting'],
      documentation: 'https://developer.sage.com/'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: credentials.customParams?.baseUrl as string || 'https://api.sage.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken}`
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/api/v1/business');
      return true;
    } catch {
      return false;
    }
  }

  async getProducts(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPProduct>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/api/v1/products', {
        params: {
          page: filters?.page || 1,
          items_per_page: filters?.pageSize || 100,
          search: filters?.query
        }
      });

      const products = (response.data.$items || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        sku: p.item_code as string || p.id as string,
        name: p.description as string || '',
        unitPrice: p.sales_ledger_account?.default_tax_rate?.percentage ? 0 : 0,
        currency: 'EUR',
        active: p.active as boolean,
        createdAt: new Date(p.created_at as string),
        updatedAt: new Date(p.updated_at as string)
      }));

      return {
        success: true,
        data: {
          items: products,
          total: response.data.$total || products.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.$total || products.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.$next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_PRODUCTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get products'
        }
      };
    }
  }

  async getProduct(id: string): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/products/${id}`);
      const p = response.data;
      return {
        success: true,
        data: {
          id: p.id,
          sku: p.item_code || p.id,
          name: p.description || '',
          unitPrice: 0,
          currency: 'EUR',
          active: p.active,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_PRODUCT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product'
        }
      };
    }
  }

  async createProduct(product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/api/v1/products', {
        product: {
          item_code: product.sku,
          description: product.name
        }
      });
      return this.getProduct(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product'
        }
      };
    }
  }

  async updateProduct(id: string, product: Partial<ERPProduct>): Promise<OperationResult<ERPProduct>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.put(`/api/v1/products/${id}`, {
        product: {
          description: product.name,
          item_code: product.sku
        }
      });
      return this.getProduct(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product'
        }
      };
    }
  }

  async getCustomers(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPCustomer>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/api/v1/contacts', {
        params: {
          contact_type_ids: 'CUSTOMER',
          page: filters?.page || 1,
          items_per_page: filters?.pageSize || 100,
          search: filters?.query
        }
      });

      const customers = (response.data.$items || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        code: c.reference as string || c.id as string,
        name: c.name as string || '',
        taxId: c.tax_number as string,
        email: c.email as string,
        phone: c.telephone as string,
        currency: 'EUR',
        active: true,
        createdAt: new Date(c.created_at as string),
        updatedAt: new Date(c.updated_at as string)
      }));

      return {
        success: true,
        data: {
          items: customers,
          total: response.data.$total || customers.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.$total || customers.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.$next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_CUSTOMERS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customers'
        }
      };
    }
  }

  async getCustomer(id: string): Promise<OperationResult<ERPCustomer>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/contacts/${id}`);
      const c = response.data;
      return {
        success: true,
        data: {
          id: c.id,
          code: c.reference || c.id,
          name: c.name || '',
          taxId: c.tax_number,
          email: c.email,
          phone: c.telephone,
          currency: 'EUR',
          active: true,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_CUSTOMER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get customer'
        }
      };
    }
  }

  async createCustomer(customer: Partial<ERPCustomer>): Promise<OperationResult<ERPCustomer>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/api/v1/contacts', {
        contact: {
          name: customer.name,
          reference: customer.code,
          tax_number: customer.taxId,
          email: customer.email,
          telephone: customer.phone,
          contact_type_ids: ['CUSTOMER']
        }
      });
      return this.getCustomer(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create customer'
        }
      };
    }
  }

  async getSalesOrders(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPSalesOrder>>> {
    // Sage specific implementation
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 100,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      }
    };
  }

  async getSalesOrder(id: string): Promise<OperationResult<ERPSalesOrder>> {
    return {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' }
    };
  }

  async createSalesOrder(order: Partial<ERPSalesOrder>): Promise<OperationResult<ERPSalesOrder>> {
    return {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' }
    };
  }

  async getInvoices(filters?: ERPSearchFilters): Promise<OperationResult<PaginatedResult<ERPInvoice>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/api/v1/sales_invoices', {
        params: {
          page: filters?.page || 1,
          items_per_page: filters?.pageSize || 100
        }
      });

      const invoices = (response.data.$items || []).map((inv: Record<string, unknown>) => ({
        id: inv.id as string,
        invoiceNumber: inv.invoice_number as string || '',
        type: 'customer' as const,
        customerId: (inv.contact as Record<string, unknown>)?.id as string,
        partnerName: (inv.contact as Record<string, unknown>)?.name as string,
        invoiceDate: new Date(inv.date as string),
        dueDate: new Date(inv.due_date as string),
        status: inv.status as ERPInvoice['status'] || 'draft',
        lines: [],
        subtotal: inv.net_amount as number || 0,
        taxAmount: inv.tax_amount as number || 0,
        total: inv.total_amount as number || 0,
        amountPaid: inv.payments_allocations_total_amount as number || 0,
        amountDue: inv.outstanding_amount as number || 0,
        currency: 'EUR',
        createdAt: new Date(inv.created_at as string),
        updatedAt: new Date(inv.updated_at as string)
      }));

      return {
        success: true,
        data: {
          items: invoices,
          total: response.data.$total || invoices.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.$total || invoices.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.$next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_INVOICES_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoices'
        }
      };
    }
  }

  async getInvoice(id: string): Promise<OperationResult<ERPInvoice>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/api/v1/sales_invoices/${id}`);
      const inv = response.data;
      return {
        success: true,
        data: {
          id: inv.id,
          invoiceNumber: inv.invoice_number || '',
          type: 'customer',
          customerId: inv.contact?.id,
          partnerName: inv.contact?.name,
          invoiceDate: new Date(inv.date),
          dueDate: new Date(inv.due_date),
          status: inv.status || 'draft',
          lines: [],
          subtotal: inv.net_amount || 0,
          taxAmount: inv.tax_amount || 0,
          total: inv.total_amount || 0,
          amountPaid: inv.payments_allocations_total_amount || 0,
          amountDue: inv.outstanding_amount || 0,
          currency: 'EUR',
          createdAt: new Date(inv.created_at),
          updatedAt: new Date(inv.updated_at)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_INVOICE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get invoice'
        }
      };
    }
  }

  async createInvoice(invoice: Partial<ERPInvoice>): Promise<OperationResult<ERPInvoice>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.post('/api/v1/sales_invoices', {
        sales_invoice: {
          contact_id: invoice.customerId,
          date: invoice.invoiceDate?.toISOString().split('T')[0],
          due_date: invoice.dueDate?.toISOString().split('T')[0]
        }
      });

      return this.getInvoice(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAGE_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create invoice'
        }
      };
    }
  }
}

// ============================================
// FACTORY
// ============================================

/**
 * Factory para crear conectores ERP
 */
export function createERPConnector(type: IntegrationType): BaseERPConnector {
  switch (type) {
    case IntegrationType.ERP_SAP:
      return new SAPConnector();
    case IntegrationType.ERP_ODOO:
      return new OdooConnector();
    case IntegrationType.ERP_SAGE:
      return new SageConnector();
    default:
      throw new Error(`Unsupported ERP connector type: ${type}`);
  }
}

export {
  BaseERPConnector,
  SAPConnector,
  OdooConnector,
  SageConnector
};
