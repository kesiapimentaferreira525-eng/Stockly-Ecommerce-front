import { isValidUuid, stockLabel, stockStatus } from './product.model';

describe('isValidUuid', () => {
  it('deve aceitar UUID válido', () => {
    expect(isValidUuid('b7d9a2c4-3c91-4b6d-9e0c-2d8ef73f1a12')).toBeTrue();
  });

  it('deve rejeitar UUID inválido', () => {
    expect(isValidUuid('UUID-DA-CATEGORIA')).toBeFalse();
    expect(isValidUuid('')).toBeFalse();
  });
});

describe('stockStatus', () => {
  it('deve marcar estoque zerado como fora de estoque', () => {
    expect(stockStatus(0)).toBe('out-of-stock');
  });

  it('deve marcar estoque crítico quando está entre 1 e 2 unidades', () => {
    expect(stockStatus(1)).toBe('critical');
    expect(stockStatus(2)).toBe('critical');
  });

  it('deve marcar estoque baixo quando está até o limite crítico', () => {
    expect(stockStatus(5)).toBe('low');
  });

  it('deve marcar estoque saudável acima do limite', () => {
    expect(stockStatus(6)).toBe('healthy');
  });
});

describe('stockLabel', () => {
  it('deve retornar a legenda correta para estoque zerado', () => {
    expect(stockLabel(0)).toBe('Esgotado');
  });

  it('deve retornar a legenda correta para estoque baixo', () => {
    expect(stockLabel(5)).toBe('Estoque baixo');
  });

  it('deve retornar a legenda correta para estoque disponível', () => {
    expect(stockLabel(6)).toBe('Disponível');
  });
});
