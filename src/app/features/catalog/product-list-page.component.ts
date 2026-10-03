import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductService } from '../../core/services/product.service';
import {
  Category,
  DeliveryAddress,
  FulfillmentType,
  LOW_STOCK_THRESHOLD,
  OrderResponse,
  PaymentMethod,
  Product,
  ProductCreateRequest,
  isValidUuid,
  stockLabel,
  stockStatus,
} from '../../core/models/product.model';

interface Feedback {
  tone: 'success' | 'error';
  title: string;
  detail: string;
}

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './product-list-page.component.html',
})
export class ProductListPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly formBuilder = inject(FormBuilder);

  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  newCategoryName = '';
  creatingCategory = false;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly successTitle = signal('Operação concluída');
  readonly pendingProductId = signal<string | null>(null);
  readonly pendingDeleteProductId = signal<string | null>(null);
  readonly savingProduct = signal(false);
  readonly showProductForm = signal(false);
  readonly checkoutProduct = signal<Product | null>(null);
  readonly completedOrder = signal<OrderResponse | null>(null);
  readonly checkoutError = signal<string | null>(null);
  readonly quantities = signal<Record<string, number>>({});
  readonly productForm = this.formBuilder.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(40)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
  });
  readonly checkoutForm = this.formBuilder.nonNullable.group({
    buyerName: ['', [Validators.required, Validators.maxLength(120)]],
    fulfillmentType: this.formBuilder.nonNullable.control<FulfillmentType>(
      'DELIVERY',
      Validators.required,
    ),
    paymentMethod: this.formBuilder.nonNullable.control<PaymentMethod>('PIX', Validators.required),
    postalCode: [''],
    street: [''],
    number: [''],
    complement: [''],
    neighborhood: [''],
    city: [''],
    state: [''],
  });

  readonly feedback = computed<Feedback | null>(() => {
    const success = this.successMessage();
    if (success) {
      return { tone: 'success', title: this.successTitle(), detail: success };
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
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error: unknown) => this.errorMessage.set(ProductService.toFriendlyMessage(error)),
    });
  }

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

  toggleProductForm(): void {
    this.showProductForm.update((visible) => !visible);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  createCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.errorMessage.set('Informe o nome da categoria antes de salvar.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.creatingCategory = true;

    this.productService.createCategory({ name }).subscribe({
      next: (category) => {
        this.categories.update((current) => [...current, category]);
        this.productForm.patchValue({ categoryId: category.id });
        this.newCategoryName = '';
        this.creatingCategory = false;
        this.successTitle.set('Categoria criada');
        this.successMessage.set(`Categoria ${category.name} cadastrada com sucesso.`);
      },
      error: (error: unknown) => {
        this.creatingCategory = false;
        this.errorMessage.set(ProductService.toFriendlyMessage(error));
      },
    });
  }

  createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.errorMessage.set('Preencha os campos corretamente para cadastrar o produto.');
      return;
    }

    const form = this.productForm.getRawValue();
    const categoryId = form.categoryId.trim();

    if (!isValidUuid(categoryId)) {
      this.errorMessage.set('Selecione uma categoria válida para cadastrar o produto.');
      return;
    }

    const product: ProductCreateRequest = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price,
      stock: form.stock,
      categoryId,
    };

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.savingProduct.set(true);
    this.productService.createProduct(product).subscribe({
      next: (created) => {
        this.savingProduct.set(false);
        this.successTitle.set('Produto cadastrado');
        this.successMessage.set(`Produto ${created.name} cadastrado com sucesso.`);
        this.productForm.reset();
        this.showProductForm.set(false);
        this.loadProducts();
        this.loadCategories();
      },
      error: (error: unknown) => {
        this.savingProduct.set(false);
        this.errorMessage.set(ProductService.toFriendlyMessage(error));
      },
    });
  }

  deleteProduct(product: Product): void {
    if (product.stock > 0) {
      this.errorMessage.set('Só é possível excluir produtos sem estoque.');
      return;
    }
    if (product.hasSales) {
      this.errorMessage.set('Este produto possui vendas registradas e não pode ser excluído.');
      return;
    }
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.pendingDeleteProductId.set(product.id);
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.pendingDeleteProductId.set(null);
        this.successTitle.set('Produto excluído');
        this.successMessage.set(`Produto ${product.name} excluído.`);
        this.loadProducts();
        this.loadCategories();
      },
      error: (error: unknown) => {
        this.pendingDeleteProductId.set(null);
        this.errorMessage.set(ProductService.toFriendlyMessage(error));
        this.loadProducts();
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

  openCheckout(product: Product): void {
    if (product.stock <= 0) {
      this.errorMessage.set('Este produto está sem estoque.');
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.checkoutError.set(null);
    this.completedOrder.set(null);
    this.checkoutProduct.set(product);
    this.checkoutForm.reset();
    this.checkoutForm.enable({ emitEvent: false });
    this.updateFulfillmentValidators();
  }

  updateFulfillmentValidators(): void {
    this.checkoutForm.enable({ emitEvent: false });
    const deliveryRequired = this.checkoutForm.controls.fulfillmentType.value === 'DELIVERY';
    const deliveryFields = [
      [this.checkoutForm.controls.street, 255],
      [this.checkoutForm.controls.number, 30],
      [this.checkoutForm.controls.neighborhood, 120],
      [this.checkoutForm.controls.city, 120],
    ] as const;

    for (const [field, maxLength] of deliveryFields) {
      field.setValidators(
        deliveryRequired ? [Validators.required, Validators.maxLength(maxLength)] : [],
      );
      field.updateValueAndValidity({ emitEvent: false });
    }

    this.checkoutForm.controls.complement.setValidators(
      deliveryRequired ? [Validators.maxLength(120)] : [],
    );
    this.checkoutForm.controls.complement.updateValueAndValidity({ emitEvent: false });

    this.checkoutForm.controls.postalCode.setValidators(
      deliveryRequired
        ? [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]
        : [],
    );
    this.checkoutForm.controls.postalCode.updateValueAndValidity({ emitEvent: false });
    this.checkoutForm.controls.state.setValidators(
      deliveryRequired
        ? [Validators.required, Validators.pattern(/^[a-zA-Z]{2}$/)]
        : [],
    );
    this.checkoutForm.controls.state.updateValueAndValidity({ emitEvent: false });
  }

  finalizePurchase(): void {
    const product = this.checkoutProduct();
    if (!product) {
      this.checkoutError.set('Selecione um produto antes de finalizar a compra.');
      return;
    }
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.checkoutError.set('Confira os dados do comprador e da entrega.');
      return;
    }

    const form = this.checkoutForm.getRawValue();
    const deliveryAddress: DeliveryAddress | null =
      form.fulfillmentType === 'DELIVERY'
        ? {
            postalCode: form.postalCode.trim(),
            street: form.street.trim(),
            number: form.number.trim(),
            complement: form.complement.trim(),
            neighborhood: form.neighborhood.trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
          }
        : null;

    this.checkoutError.set(null);
    this.pendingProductId.set(product.id);
    this.productService
      .createOrder({
        productId: product.id,
        quantity: this.quantityOf(product),
        buyerName: form.buyerName.trim(),
        fulfillmentType: form.fulfillmentType,
        paymentMethod: form.paymentMethod,
        deliveryAddress,
      })
      .subscribe({
        next: (order) => {
          this.pendingProductId.set(null);
          this.checkoutProduct.set(null);
          this.completedOrder.set(order);
          this.quantities.update((current) => ({ ...current, [product.id]: 1 }));
          this.loadProducts();
        },
        error: (error: unknown) => {
          this.pendingProductId.set(null);
          this.checkoutError.set(ProductService.toFriendlyMessage(error));
          this.loadProducts();
        },
      });
  }

  closeCheckout(): void {
    this.checkoutProduct.set(null);
    this.checkoutError.set(null);
  }

  closeOrderReceipt(): void {
    const order = this.completedOrder();
    if (order) {
      this.successTitle.set('Compra finalizada');
      this.successMessage.set(`Pedido #${order.orderId} confirmado. Estoque restante: ${order.remainingStock} unidade(s).`);
    }
    this.completedOrder.set(null);
  }

  paymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case 'PIX':
        return 'Pix';
      case 'CREDIT_CARD':
        return 'Cartão de crédito';
      case 'DEBIT_CARD':
        return 'Cartão de débito';
      case 'CASH':
        return 'Dinheiro';
    }
  }

  fulfillmentLabel(type: FulfillmentType): string {
    return type === 'DELIVERY' ? 'Entrega' : 'Retirada em loja';
  }

  dismissFeedback(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
