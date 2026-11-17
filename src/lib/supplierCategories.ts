export interface CategoryLink { supplier_id: string; category_id: string }

export const categorySupplierIds = (links: CategoryLink[], categoryId: string) =>
  [...new Set(links.filter(link => link.category_id === categoryId).map(link => link.supplier_id))];

export const supplierCategoryIds = (links: CategoryLink[], supplierId: string) =>
  links.filter(link => link.supplier_id === supplierId).map(link => link.category_id);

export const toggleCategory = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];