import { Component } from '@angular/core';
import { ProductListPageComponent } from './features/catalog/product-list-page.component';

/**
 * Componente raiz — Standalone Components (Angular 17+), sem NgModules
 * (Critério 1 da HU-02).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListPageComponent],
  template: '<app-product-list-page />',
})
export class AppComponent {}
