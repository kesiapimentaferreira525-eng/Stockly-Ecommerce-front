export interface Category {
  id: string;
  name: string;
}

export interface CategoryCreateRequest {
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
  hasSales: boolean;
}

export interface ProductCreateRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface OrderRequest {
  productId: string;
  quantity: number;
  buyerName: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress | null;
}

export type FulfillmentType = 'DELIVERY' | 'STORE_PICKUP';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';

export interface DeliveryAddress {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderResponse {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  remainingStock: number;
  buyerName: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress | null;
  pickupLocation: string | null;
  status: 'CONFIRMED' | 'REJECTED';
  message: string;
}

export interface ApiErrorResponse {
  message: string;
}

export type StockStatus = 'out-of-stock' | 'critical' | 'low' | 'healthy';

export const LOW_STOCK_THRESHOLD = 5;

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(
    value.trim(),
  );
} 

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) {
    return 'out-of-stock';
  }
  if (stock <= 2) {
    return 'critical';
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return 'low';
  }
  return 'healthy';
}

export function stockLabel(stock: number): string {
  switch (stockStatus(stock)) {
    case 'out-of-stock':
      return 'Esgotado';
    case 'critical':
      return 'Crítico';
    case 'low':
      return 'Estoque baixo';
    default:
      return 'Disponível';
  }
}
