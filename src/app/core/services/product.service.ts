import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiErrorResponse,
  OrderRequest,
  OrderResponse,
  Product,
} from '../models/product.model';

/**
 * Critério 2 da HU-02: serviço dedicado que encapsula as chamadas HTTP
 * de listagem de produtos (GET) e envio de pedidos (POST).
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;
  private readonly orderUrl = `${environment.apiBaseUrl}/orders`;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(this.apiUrl)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http
      .post<OrderResponse>(this.orderUrl, order)
      .pipe(catchError((error) => throwError(() => error)));
  }

  /** Converte qualquer falha HTTP em uma mensagem amigável para a tela. */
  static toFriendlyMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Não foi possível falar com a API (verifique se o Spring Boot está rodando).';
      }
      const body = error.error as ApiErrorResponse | null;
      if (body && typeof body.message === 'string' && body.message.length > 0) {
        return body.message;
      }
      if (error.status === 400) {
        return 'Estoque insuficiente para concluir o pedido.';
      }
      return `Erro HTTP ${error.status} ao processar a solicitação.`;
    }
    return 'Erro inesperado ao processar a solicitação.';
  }
}
