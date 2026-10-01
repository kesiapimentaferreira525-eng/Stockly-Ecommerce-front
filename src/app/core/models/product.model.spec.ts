/**
 * Teste de contrato da regra de negócio do alerta visual (Critério 3).
 * Execute com: npx tsx src/app/core/models/product.model.spec.ts
 */
import { strict as assert } from 'node:assert';

import { stockLabel, stockStatus } from './product.model';

assert.equal(stockStatus(0), 'out-of-stock');
assert.equal(stockLabel(0), 'Esgotado');

assert.equal(stockStatus(1), 'critical');
assert.equal(stockStatus(5), 'low');
assert.equal(stockLabel(5), 'Estoque baixo');

assert.equal(stockStatus(6), 'healthy');
assert.equal(stockLabel(6), 'Disponível');

console.log('OK — regras de estoque (0 / 1 / 5 / 6) validadas.');
