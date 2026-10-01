# Interface de Catálogo e Compra — Angular 17 + Tailwind CSS (HU-02)

Front-end do **Módulo de Gestão de E-commerce e Inventário**: consome a API RESTful
do back-end Spring Boot, exibe o catálogo com estoque em tempo real, sinaliza
visualmente produtos com estoque crítico e executa o fluxo de compra com
tratamento de erro (HTTP 400 — estoque esgotado).

## Stack

| Item | Versão / Configuração |
| --- | --- |
| Angular | 17 (`@angular/core` ^17.3.0) |
| Componentes | **Standalone Components** (`standalone: true`), sem `NgModule` |
| HTTP | `provideHttpClient(withFetch())` em `src/app/app.config.ts` |
| Estilização | Tailwind CSS 3.4 (`tailwind.config.js` + `postcss.config.js`) |
| Controle de fluxo | Diretivas nativas `@if`, `@for`, `@empty`, `@else if` |
| Estado | `signal`, `computed` (Angular Signals) |
| Tipagem | `strict: true` + `strictTemplates: true` |

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
npm run build      # bundle de produção em dist/aurora-catalogo
```

O back-end Spring Boot deve responder em `http://localhost:8080/api`. O
`proxy.conf.json` também encaminha `/api` para `http://localhost:8080`, então
basta manter o Spring Boot na porta padrão. Para apontar para outro host,
edite `src/environments/environment.ts`.

### Endpoints consumidos

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/api/products` | Lista o catálogo (`Product[]`) |
| `POST` | `/api/orders` | Envia `OrderRequest` e devolve `OrderResponse` |
| — | HTTP `400` | Corpo `{ "message": "..." }` exibido na caixa de alerta |

## Estrutura

```
src/
├── app/
│   ├── app.component.ts                     # raiz standalone
│   ├── app.config.ts                        # provideHttpClient(withFetch())
│   ├── core/
│   │   ├── models/product.model.ts          # Category, Product, OrderRequest, OrderResponse
│   │   └── services/product.service.ts      # GET produtos + POST pedidos + erros amigáveis
│   └── features/catalog/
│       ├── product-list-page.component.ts   # signals, compra, recarga em tempo real
│       └── product-list-page.component.html # grid com @for/@empty e selos @if
├── environments/                            # apiBaseUrl por ambiente
├── index.html
├── main.ts
└── styles.css
```

## Critérios de aceite atendidos

**1. Arquitetura e configuração**
- Componentes Standalone (`AppComponent` e `ProductListPageComponent`).
- `provideHttpClient(withFetch())` no arquivo de configuração.
- Tailwind CSS com tokens de marca (`brand`, `canvas`, `ink`) em `tailwind.config.js`.

**2. Consumo de API e tipagem forte**
- Interfaces `Category`, `Product`, `OrderRequest`, `OrderResponse` e `ApiErrorResponse`.
- `ProductService` encapsula `getProducts()` (GET) e `createOrder()` (POST), além de
  converter falhas HTTP em mensagens para a tela.

**3. Interface, alerta visual e reatividade**
- Grid renderizado com `@for (product of products(); track product.id)` e `@empty`.
- Selo âmbar **“Estoque baixo (n)”** quando `product.stock <= 5 && product.stock > 0`;
  produtos com 1 ou 2 unidades sobem para o tom laranja **“Crítico”**.
- Selo vermelho **“Esgotado”** quando `product.stock === 0`.
- Barra colorida no topo de cada card reforça o estado; a lateral “Central de estoque”
  lista os SKUs esgotados e em nível crítico.

**4. Fluxo de compra e tratamento de erros**
- Botão **Comprar agora** fica `[disabled]` e vira **Indisponível** com estoque zero.
- Seletor de quantidade limitado ao estoque disponível.
- Caixa de alerta amigável para HTTP 400 (ex.: *“está esgotado e o pedido não pôde
  ser aprovado”*) e para falhas de rede (HTTP 0).
- Após a compra confirmada, a mensagem de sucesso traz o número do pedido e o estoque
  restante, e a listagem é recarregada automaticamente (`loadProducts()`).

## Teste da regra de estoque

```bash
npx tsx src/app/core/models/product.model.spec.ts
# OK — regras de estoque (0 / 1 / 5 / 6) validadas.
```
