
## Plan: Supplier Image Upload & Avatar Display

### Current state
- `suppliers` table has no `image_url` column
- `attachments` storage bucket exists (public) — can reuse
- `ImageUpload.tsx` component already exists for product images
- `UserAvatar.tsx` exists with initials fallback + tooltip — reusable pattern
- Supplier add/edit happens inline in `PurchaseRequests.tsx`
- Suppliers are displayed in supplier cards (right panel) and supplier suggestions on product cards

### Changes

**1. Database (migration)**
- Add `image_url TEXT` column to `suppliers` table (nullable)

**2. New component: `SupplierAvatar.tsx`**
- Circular avatar (rounded-full), 3 sizes (sm/md/lg)
- Shows uploaded image OR initials fallback (auto color from name hash)
- Tooltip on hover: name + phone
- Click opens popover with: image, name, phone, Call button, WhatsApp button

**3. Update `useSuppliers.ts`**
- Add `image_url` to `Supplier` interface
- Include in `addSupplier` / `updateSupplier` payloads

**4. Update `PurchaseRequests.tsx`**
- **Add Supplier form**: include `ImageUpload` field with live preview
- **Edit Supplier form** (inline): include `ImageUpload` field to replace/remove
- **Supplier cards** (right panel): show new `SupplierAvatar` (md) at top
- **Product card supplier suggestions**: replace text-only chips with row of `SupplierAvatar` (sm) — clean circular icons with hover/click behavior

**5. Update `ProductTable.tsx` supplier modal**
- Use `SupplierAvatar` for consistency

### Technical notes
- Reuse existing `attachments` bucket with folder `suppliers/`
- Reuse existing `ImageUpload` component (already handles upload, preview, remove)
- Initials fallback: first letter of first 2 words; background color derived from name string hash → consistent per supplier
- Image processing: rely on `object-cover` + `aspect-square` + `rounded-full` for crop-to-circle (CSS-only, no server processing needed for the size we display)

### Files to create
- `src/components/SupplierAvatar.tsx`
- New migration: `ALTER TABLE suppliers ADD COLUMN image_url TEXT`

### Files to edit
- `src/hooks/useSuppliers.ts`
- `src/pages/PurchaseRequests.tsx`
- `src/components/ProductTable.tsx`
