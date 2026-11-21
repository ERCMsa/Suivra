import { describe, test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import {
  createRequestId,
  formatQuantity,
  materialReference,
  parseQuantityInput,
  snapshotDelta,
  snapshotTypeLabel,
  summarizeInventoryDraft,
} from './inventory.ts';

describe('Inventory quantity parsing', () => {
  test('Blank input means "keep the current quantity"', () => {
    deepStrictEqual(parseQuantityInput(''), { value: null, empty: true });
    deepStrictEqual(parseQuantityInput('   '), { value: null, empty: true });
  });

  test('Whole and decimal quantities are accepted with dot or comma', () => {
    deepStrictEqual(parseQuantityInput('12'), { value: 12, empty: false });
    deepStrictEqual(parseQuantityInput('12.5'), { value: 12.5, empty: false });
    deepStrictEqual(parseQuantityInput('12,5'), { value: 12.5, empty: false });
    deepStrictEqual(parseQuantityInput('0'), { value: 0, empty: false });
    deepStrictEqual(parseQuantityInput(' 007 '), { value: 7, empty: false });
  });

  test('Negative, malformed and exponent values are rejected', () => {
    for (const value of ['-1', '-0.5', 'abc', '1e3', '12.5.6', '1 000', '12,', '.5', '+3']) {
      deepStrictEqual(parseQuantityInput(value), { value: null, empty: false }, value);
    }
  });
});

describe('Material reference', () => {
  test('The existing reference field is reused when it is set', () => {
    strictEqual(materialReference({ id: 'abc', thickness: 42 }), '42');
    strictEqual(materialReference({ id: 'abc', thickness: '125.5' }), '125.5');
  });

  test('A stable code is derived when no reference exists', () => {
    strictEqual(
      materialReference({ id: 'abcdef12-3456-7890-abcd-ef1234567890', thickness: 0 }),
      'MAT-ABCDEF12',
    );
    strictEqual(materialReference({ id: 'abcdef12-3456-7890-abcd-ef1234567890' }), 'MAT-ABCDEF12');
  });
});

describe('Inventory draft summary', () => {
  const products = [
    { id: 'p1', quantity: 10 },
    { id: 'p2', quantity: 4 },
    { id: 'p3', quantity: 0 },
  ];

  test('Empty cells keep the current quantity and are not sent', () => {
    const summary = summarizeInventoryDraft(products, {});
    deepStrictEqual(summary.entries, []);
    strictEqual(summary.filled, 0);
    strictEqual(summary.empty, 3);
    strictEqual(summary.invalid, 0);
    strictEqual(summary.changed, 0);
    strictEqual(summary.newTotal, 14);
  });

  test('Only filled and valid cells are submitted', () => {
    const summary = summarizeInventoryDraft(products, { p1: '8,5', p2: '', p3: '2' });
    deepStrictEqual(summary.entries, [
      { product_id: 'p1', quantity: 8.5 },
      { product_id: 'p3', quantity: 2 },
    ]);
    strictEqual(summary.filled, 2);
    strictEqual(summary.empty, 1);
    strictEqual(summary.invalid, 0);
    strictEqual(summary.changed, 2);
    strictEqual(summary.newTotal, 14.5);
  });

  test('Invalid cells are counted and block the save', () => {
    const summary = summarizeInventoryDraft(products, { p1: '-2', p2: 'ok', p3: '0' });
    strictEqual(summary.invalid, 2);
    strictEqual(summary.filled, 1);
    strictEqual(summary.entries.length, 1);
    strictEqual(summary.entries[0].product_id, 'p3');
  });

  test('A quantity identical to the current one is submitted but not counted as changed', () => {
    const summary = summarizeInventoryDraft(products, { p1: '10' });
    strictEqual(summary.filled, 1);
    strictEqual(summary.changed, 0);
    deepStrictEqual(summary.entries, [{ product_id: 'p1', quantity: 10 }]);
  });
});

describe('Snapshot helpers', () => {
  test('Snapshot types are localized', () => {
    strictEqual(snapshotTypeLabel('initial', 'fr'), 'Inventaire initial');
    strictEqual(snapshotTypeLabel('updated', 'fr'), 'Inventaire mis à jour');
    strictEqual(snapshotTypeLabel('initial', 'ar'), 'الجرد الأولي');
  });

  test('Delta compares historical and current quantities', () => {
    strictEqual(snapshotDelta(10, 7), -3);
    strictEqual(snapshotDelta(10, 12.5), 2.5);
    strictEqual(snapshotDelta(10, 10), 0);
  });

  test('Quantities are displayed with Latin digits', () => {
    strictEqual(formatQuantity(12.5), '12,5');
    strictEqual(formatQuantity(null), '0');
  });

  test('Request identifiers are valid UUIDs', () => {
    strictEqual(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(createRequestId()), true);
  });
});
