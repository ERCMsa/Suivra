import { describe, test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import {
  categorySupplierIds,
  filterSuppliersForLinking,
  supplierCategoryIds,
  supplierMatchesSearch,
  toggleCategory,
} from './supplierCategories.ts';

describe('User-managed supplier categories', () => {
  test('No category associations are invented for an empty system', () => {
    deepStrictEqual(supplierCategoryIds([], 'supplier-1'), []);
    deepStrictEqual(categorySupplierIds([], 'category-1'), []);
  });
  test('One supplier can be associated with multiple selected categories', () => {
    deepStrictEqual(toggleCategory(['category-1'], 'category-2'), ['category-1', 'category-2']);
  });
  test('Consulting a category returns only its associated suppliers', () => {
    deepStrictEqual(categorySupplierIds([
      {supplier_id: 'supplier-1', category_id: 'category-1'},
      {supplier_id: 'supplier-2', category_id: 'category-2'},
      {supplier_id: 'supplier-1', category_id: 'category-2'},
    ], 'category-1'), ['supplier-1']);
  });
  test('Removing an association leaves the other selections intact', () => {
    deepStrictEqual(toggleCategory(['category-1', 'category-2'], 'category-1'), ['category-2']);
  });
});

const suppliers = [
  { id: 's1', name: 'Tissus Algérie', phone: '0550 00 00 00', email: 'contact@tissus.dz', category: 'Tissus', category_ids: ['c1'] },
  { id: 's2', name: 'Boutons SARL', whatsapp: '0661 11 11 11', category_ids: [] },
  { id: 's3', name: 'Fil & Cie', category: 'Mercerie', category_ids: ['c2'] },
];

const links = [
  { supplier_id: 's1', category_id: 'c1' },
  { supplier_id: 's3', category_id: 'c2' },
];

describe('Linking existing suppliers to a category', () => {
  test('A supplier already associated with the current category is not proposed again', () => {
    deepStrictEqual(
      filterSuppliersForLinking(suppliers, links, 'c1').map(supplier => supplier.id),
      ['s2', 's3'],
    );
  });
  test('The same supplier can be proposed for another category', () => {
    deepStrictEqual(
      filterSuppliersForLinking(suppliers, links, 'c2').map(supplier => supplier.id),
      ['s1', 's2'],
    );
  });
  test('Search matches name, phone, WhatsApp and e-mail', () => {
    deepStrictEqual(supplierMatchesSearch(suppliers[0], 'tissus'), true);
    deepStrictEqual(supplierMatchesSearch(suppliers[0], '0550'), true);
    deepStrictEqual(supplierMatchesSearch(suppliers[1], '0661'), true);
    deepStrictEqual(supplierMatchesSearch(suppliers[0], 'contact@tissus'), true);
    deepStrictEqual(supplierMatchesSearch(suppliers[0], 'introuvable'), false);
  });
  test('Filters target suppliers without category or from a specific category', () => {
    deepStrictEqual(
      filterSuppliersForLinking(suppliers, links, 'c1', '', 'uncategorized').map(supplier => supplier.id),
      ['s2'],
    );
    deepStrictEqual(
      filterSuppliersForLinking(suppliers, links, 'c1', '', 'c2').map(supplier => supplier.id),
      ['s3'],
    );
  });
});
