import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiErrorResponse,
  Category,
  CategoryCreateRequest,
  OrderRequest,
  OrderResponse,
  Product,
  ProductCreateRequest,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;
  private readonly orderUrl = `${environment.apiBaseUrl}/orders`;
  private readonly categoriesUrl = `${environment.apiBaseUrl}/categories`;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(this.apiUrl)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(this.categoriesUrl)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createCategory(category: CategoryCreateRequest): Observable<Category> {
    return this.http
      .post<Category>(this.categoriesUrl, category)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createProduct(product: ProductCreateRequest): Observable<Product> {
    return this.http
      .post<Product>(this.apiUrl, product)
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${productId}`)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http
      .post<OrderResponse>(this.orderUrl, order)
      .pipe(catchError((error) => throwError(() => error)));
  }

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
