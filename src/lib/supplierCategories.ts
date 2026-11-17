export interface CategoryLink { supplier_id: string; category_id: string }

export interface SearchableSupplier {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  category?: string | null;
}

export const categorySupplierIds = (links: CategoryLink[], categoryId: string) =>
  [...new Set(links.filter(link => link.category_id === categoryId).map(link => link.supplier_id))];

export const supplierCategoryIds = (links: CategoryLink[], supplierId: string) =>
  links.filter(link => link.supplier_id === supplierId).map(link => link.category_id);

export const toggleCategory = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];

export const supplierMatchesSearch = (supplier: SearchableSupplier, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [supplier.name, supplier.phone, supplier.whatsapp, supplier.email, supplier.category]
    .some(value => (value || '').toLowerCase().includes(needle));
};

/**
 * Suppliers that can still be associated with a category:
 * - the supplier must not already belong to the category;
 * - the search matches name, phone, WhatsApp, e-mail or displayed categories;
 * - the filter can target every supplier, suppliers without any category,
 *   or suppliers already associated with one specific category.
 */
export const filterSuppliersForLinking = <T extends SearchableSupplier>(
  suppliers: T[],
  links: CategoryLink[],
  currentCategoryId: string,
  query = '',
  categoryFilter: 'all' | 'uncategorized' | string = 'all',
) => {
  const alreadyLinked = new Set(categorySupplierIds(links, currentCategoryId));
  return suppliers.filter(supplier => {
    if (alreadyLinked.has(supplier.id)) return false;
    if (!supplierMatchesSearch(supplier, query)) return false;
    if (categoryFilter === 'uncategorized') return supplierCategoryIds(links, supplier.id).length === 0;
    if (categoryFilter !== 'all') return supplierCategoryIds(links, supplier.id).includes(categoryFilter);
    return true;
  });
};
