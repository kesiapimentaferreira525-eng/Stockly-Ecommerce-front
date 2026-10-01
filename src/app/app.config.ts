import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { provideHttpClient, withFetch } from '@angular/common/http';

registerLocaleData(localePtBr, 'pt-BR');

/**
 * Critério 1 da HU-02: HttpClient moderno configurado com `provideHttpClient`
 * + `withFetch()`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
  ],
};
