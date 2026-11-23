import { useState } from 'react';
import { Plus, Trash2, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUpload from '@/components/ImageUpload';
import SupplierAvatar from '@/components/SupplierAvatar';
import { useLanguage } from '@/hooks/useLanguage';
import type { Product } from '@/hooks/useInventory';
import type { SupplierContactInput } from '@/hooks/useSuppliers';

export interface SupplierFormValue {
  name: string;
  image_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  wilaya: string;
  commune: string;
  notes: string;
  contacts: SupplierContactInput[];
  product_ids: string[];
}

const emptySupplierForm: SupplierFormValue = {
  name: '',
  image_url: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  wilaya: '',
  commune: '',
  notes: '',
  contacts: [],
  product_ids: [],
};

const emptyContact: SupplierContactInput = {
  name: '',
  role: '',
  phone: '',
  whatsapp: '',
  email: '',
};

interface SupplierFormProps {
  initial?: Partial<SupplierFormValue> | null;
  products: Product[];
  submitLabel: string;
  busy?: boolean;
  onSubmit: (value: SupplierFormValue) => Promise<boolean> | boolean;
  onCancel?: () => void;
}

const cleanContacts = (contacts: SupplierContactInput[]) => contacts
  .map(contact => ({
    name: (contact.name || '').trim(),
    role: (contact.role || '').trim(),
    phone: (contact.phone || '').trim(),
    whatsapp: (contact.whatsapp || '').trim(),
    email: (contact.email || '').trim(),
    is_primary: !!contact.is_primary,
  }))
  .filter(contact => contact.name || contact.phone || contact.whatsapp || contact.email);

const SupplierForm = ({ initial, products, submitLabel, busy = false, onSubmit, onCancel }: SupplierFormProps) => {
  const { lang } = useLanguage();
  const fr = lang === 'fr';
  const [value, setValue] = useState<SupplierFormValue>(() => ({
    ...emptySupplierForm,
    ...initial,
    contacts: initial?.contacts ? [...initial.contacts] : [],
    product_ids: initial?.product_ids ? [...initial.product_ids] : [],
  }));
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const update = <K extends keyof SupplierFormValue>(key: K, next: SupplierFormValue[K]) =>
    setValue(current => ({ ...current, [key]: next }));

  const updateContact = (index: number, patch: Partial<SupplierContactInput>) => {
    setValue(current => ({
      ...current,
      contacts: current.contacts.map((contact, position) => position === index ? { ...contact, ...patch } : contact),
    }));
  };

  const removeContact = (index: number) => {
    setValue(current => ({
      ...current,
      contacts: current.contacts.filter((_, position) => position !== index),
    }));
  };

  const toggleProduct = (productId: string) => {
    setValue(current => ({
      ...current,
      product_ids: current.product_ids.includes(productId)
        ? current.product_ids.filter(id => id !== productId)
        : [...current.product_ids, productId],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.name.trim() || submitting || busy) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...value,
        name: value.name.trim(),
        image_url: value.image_url || '',
        phone: value.phone.trim(),
        whatsapp: value.whatsapp.trim(),
        email: value.email.trim(),
        address: value.address.trim(),
        wilaya: value.wilaya.trim(),
        commune: value.commune.trim(),
        notes: value.notes.trim(),
        contacts: cleanContacts(value.contacts),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || busy;
  const visibleProducts = products.filter(product => {
    const needle = productSearch.trim().toLowerCase();
    if (!needle) return true;
    return [product.designation, product.type, product.brand]
      .some(field => (field || '').toLowerCase().includes(needle));
  });

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <SupplierAvatar
          name={value.name || '?'}
          imageUrl={value.image_url}
          size="lg"
          interactive={false}
          showTooltip={false}
        />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1.5">{fr ? 'Logo / photo (optionnel)' : 'الشعار / الصورة (اختياري)'}</p>
          <ImageUpload
            currentUrl={value.image_url}
            onUploaded={url => update('image_url', url)}
            folder="suppliers"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="supplier-name">{fr ? "Nom de l'entreprise" : 'اسم الشركة'} *</Label>
          <Input
            id="supplier-name"
            required
            value={value.name}
            onChange={event => update('name', event.target.value)}
            placeholder={fr ? 'Ex. Tissus Algérie' : 'مثال: نسيج الجزائر'}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier-phone">{fr ? 'Téléphone' : 'الهاتف'}</Label>
          <Input id="supplier-phone" type="tel" value={value.phone} onChange={event => update('phone', event.target.value)} placeholder="0550 00 00 00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier-whatsapp">WhatsApp</Label>
          <Input id="supplier-whatsapp" type="tel" value={value.whatsapp} onChange={event => update('whatsapp', event.target.value)} placeholder="0550 00 00 00" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="supplier-email">{fr ? 'E-mail' : 'البريد الإلكتروني'}</Label>
          <Input id="supplier-email" type="email" value={value.email} onChange={event => update('email', event.target.value)} placeholder="contact@exemple.dz" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="supplier-address">{fr ? 'Adresse' : 'العنوان'}</Label>
          <Input id="supplier-address" value={value.address} onChange={event => update('address', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier-wilaya">{fr ? 'Wilaya' : 'الولاية'}</Label>
          <Input id="supplier-wilaya" value={value.wilaya} onChange={event => update('wilaya', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier-commune">{fr ? 'Commune' : 'البلدية'}</Label>
          <Input id="supplier-commune" value={value.commune} onChange={event => update('commune', event.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="supplier-notes">{fr ? 'Observations' : 'ملاحظات'}</Label>
          <Textarea id="supplier-notes" value={value.notes} onChange={event => update('notes', event.target.value)} rows={2} />
        </div>
      </div>

      <section className="space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <UserRound className="h-4 w-4 text-primary" />
            {fr ? 'Contacts commerciaux' : 'جهات الاتصال التجارية'}
          </h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => update('contacts', [...value.contacts, { ...emptyContact }])}
          >
            <Plus className="h-3 w-3" />
            {fr ? 'Ajouter' : 'إضافة'}
          </Button>
        </div>
        {value.contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            {fr ? 'Aucun contact commercial enregistré.' : 'لا توجد جهات اتصال تجارية مسجلة.'}
          </p>
        ) : (
          <div className="space-y-2">
            {value.contacts.map((contact, index) => (
              <div key={index} className="rounded-lg bg-muted/30 p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 text-xs"
                    placeholder={fr ? 'Nom du contact' : 'اسم جهة الاتصال'}
                    value={contact.name || ''}
                    onChange={event => updateContact(index, { name: event.target.value })}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive shrink-0"
                    onClick={() => removeContact(index)}
                    aria-label={fr ? 'Supprimer le contact' : 'حذف جهة الاتصال'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input className="h-8 text-xs" placeholder={fr ? 'Fonction' : 'الوظيفة'} value={contact.role || ''} onChange={event => updateContact(index, { role: event.target.value })} />
                  <Input className="h-8 text-xs" type="email" placeholder="E-mail" value={contact.email || ''} onChange={event => updateContact(index, { email: event.target.value })} />
                  <Input className="h-8 text-xs" type="tel" placeholder={fr ? 'Téléphone' : 'الهاتف'} value={contact.phone || ''} onChange={event => updateContact(index, { phone: event.target.value })} />
                  <Input className="h-8 text-xs" type="tel" placeholder="WhatsApp" value={contact.whatsapp || ''} onChange={event => updateContact(index, { whatsapp: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-xl border p-3">
        <h4 className="text-sm font-medium">{fr ? 'Produits fournis' : 'المنتجات الموردة'} ({value.product_ids.length})</h4>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder={fr ? 'Rechercher un produit…' : 'البحث عن منتج…'}
            value={productSearch}
            onChange={event => setProductSearch(event.target.value)}
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 rounded-md bg-background p-1 border">
          {visibleProducts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">
              {fr ? 'Aucun produit disponible' : 'لا توجد منتجات متاحة'}
            </p>
          ) : visibleProducts.map(product => {
            const checked = value.product_ids.includes(product.id);
            return (
              <label
                key={product.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${checked ? 'bg-primary/10' : ''}`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleProduct(product.id)} />
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate block">{product.designation}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {product.type}{product.brand ? ` · ${product.brand}` : ''}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" disabled={disabled} onClick={onCancel}>
            {fr ? 'Annuler' : 'إلغاء'}
          </Button>
        )}
        <Button type="submit" disabled={disabled || !value.name.trim()}>
          {disabled ? '…' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
