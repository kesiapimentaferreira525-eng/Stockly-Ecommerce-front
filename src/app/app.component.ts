import { Component } from '@angular/core';
import { ProductListPageComponent } from './features/catalog/product-list-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListPageComponent],
  template: '<app-product-list-page />',
})
export class AppComponent {}
