import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ProductService } from '../../core/services/product.service';
import {
  LOW_STOCK_THRESHOLD,
  Product,
  stockLabel,
  stockStatus,
} from '../../core/models/product.model';

interface Feedback {
  tone: 'success' | 'error';
  title: string;
  detail: string;
}

/**
 * Critério 3 e 4 da HU-02: listagem com `@for` / `@empty`, alerta visual
 * condicional (`@if`) de estoque baixo e fluxo de compra com tratamento
 * de erros HTTP.
 */
@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-list-page.component.html',
})
export class ProductListPageComponent implements OnInit {
  private readonly productService = inject(ProductService);

  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pendingProductId = signal<string | null>(null);
  readonly quantities = signal<Record<string, number>>({});

  readonly feedback = computed<Feedback | null>(() => {
    const success = this.successMessage();
    if (success) {
      return { tone: 'success', title: 'Compra confirmada', detail: success };
    }
    const error = this.errorMessage();
    if (error) {
      return { tone: 'error', title: 'Não foi possível concluir', detail: error };
    }
    return null;
  });

  readonly totalUnits = computed(() =>
    this.products().reduce((total, product) => total + product.stock, 0),
  );

  readonly lowStockProducts = computed(() =>
    this.products().filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD),
  );

  readonly outOfStockProducts = computed(() =>
    this.products().filter((product) => product.stock === 0),
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  /** GET /api/products */
  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(ProductService.toFriendlyMessage(error));
        this.loading.set(false);
      },
    });
  }

  quantityOf(product: Product): number {
    if (product.stock <= 0) {
      return 0;
    }
    const requested = this.quantities()[product.id] ?? 1;
    return Math.min(Math.max(requested, 1), product.stock);
  }

  changeQuantity(product: Product, delta: number): void {
    if (product.stock <= 0) {
      return;
    }
    const next = Math.min(Math.max(this.quantityOf(product) + delta, 1), product.stock);
    this.quantities.update((current) => ({ ...current, [product.id]: next }));
  }

  stockStatus = stockStatus;
  stockLabel = stockLabel;

  /** POST /api/orders — feedback imediato e recarga da listagem. */
  buyProduct(product: Product): void {
    if (product.stock <= 0) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.pendingProductId.set(product.id);

    this.productService
      .createOrder({ productId: product.id, quantity: this.quantityOf(product) })
      .subscribe({
        next: (order) => {
          this.pendingProductId.set(null);
          this.successMessage.set(`${order.message} Estoque restante: ${order.remainingStock} unidade(s).`);
          this.quantities.update((current) => ({ ...current, [product.id]: 1 }));
          this.loadProducts(); // Atualiza em tempo real
        },
        error: (error: unknown) => {
          const message = ProductService.toFriendlyMessage(error);
          this.pendingProductId.set(null);
          this.errorMessage.set(message);
          this.loadProducts(); // Re-sincroniza o estoque após o HTTP 400
        },
      });
  }

  dismissFeedback(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
