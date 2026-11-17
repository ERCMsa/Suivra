import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/hooks/useLanguage';
import { toggleCategory } from '@/lib/supplierCategories';
import type { SupplierCategory } from '@/hooks/useSuppliers';

export default function SupplierCategoryPicker({ categories, selected, onChange }: {
  categories: SupplierCategory[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const { lang } = useLanguage();
  return <fieldset className="space-y-2">
    <legend className="text-sm font-medium">{lang === 'fr' ? 'Catégories' : 'الفئات'}</legend>
    {categories.length === 0 && <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Aucune catégorie' : 'لا توجد فئات'}</p>}
    <div className="max-h-40 overflow-y-auto grid gap-2">
      {categories.map(category => <label key={category.id} className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={selected.includes(category.id)} onCheckedChange={() => onChange(toggleCategory(selected, category.id))} />
        <span className="text-sm break-words min-w-0">{category.name}</span>
      </label>)}
    </div>
  </fieldset>;
}