import { describe, test } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { categorySupplierIds, supplierCategoryIds, toggleCategory } from './supplierCategories.ts';

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