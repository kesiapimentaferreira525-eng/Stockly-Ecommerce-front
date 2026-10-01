/**
 * Configuração por ambiente. Em desenvolvimento o back-end Spring Boot
 * roda em `http://localhost:8080` e expõe `/api`.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
};
