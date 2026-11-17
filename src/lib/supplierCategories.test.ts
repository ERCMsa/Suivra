import { describe, expect, test } from 'bun:test';
import { categorySupplierIds, supplierCategoryIds, toggleCategory } from './supplierCategories';

describe('User-managed supplier categories', () => {
  test('No category associations are invented for an empty system', () => {
    expect(supplierCategoryIds([], 'supplier-1')).toEqual([]);
    expect(categorySupplierIds([], 'category-1')).toEqual([]);
  });
  test('One supplier can be associated with multiple selected categories', () => {
    expect(toggleCategory(['category-1'], 'category-2')).toEqual(['category-1', 'category-2']);
  });
  test('Consulting a category returns only its associated suppliers', () => {
    expect(categorySupplierIds([
      {supplier_id: 'supplier-1', category_id: 'category-1'},
      {supplier_id: 'supplier-2', category_id: 'category-2'},
      {supplier_id: 'supplier-1', category_id: 'category-2'},
    ], 'category-1')).toEqual(['supplier-1']);
  });
  test('Removing an association leaves the other selections intact', () => {
    expect(toggleCategory(['category-1', 'category-2'], 'category-1')).toEqual(['category-2']);
  });
});