/**
 * Modelos de domínio espelhando os DTOs do back-end Spring Boot (Critério 2).
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;
}

export interface OrderRequest {
  productId: string;
  quantity: number;
}

export interface OrderResponse {
  orderId: string;
  productId: string;
  quantity: number;
  total: number;
  remainingStock: number;
  status: 'CONFIRMED' | 'REJECTED';
  message: string;
}

/** Payload de erro do back-end (HTTP 400 / 404). */
export interface ApiErrorResponse {
  message: string;
}

export type StockStatus = 'out-of-stock' | 'critical' | 'low' | 'healthy';

/** Regra de negócio do alerta visual: estoque crítico em 5 unidades. */
export const LOW_STOCK_THRESHOLD = 5;

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
