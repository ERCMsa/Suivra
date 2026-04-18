
## Plan: Show Supplier Avatars Directly on Purchase List Cards

### What's already done ✅
- `image_url` column on `suppliers` table
- `SupplierAvatar` component (3 sizes, initials fallback, hover tooltip, click popover with Call/WhatsApp)
- `ImageUpload` field in **Add Supplier** and **Edit Supplier** forms (live preview, replace, remove)
- Avatars used in: supplier list cards, edit form preview, recommended chips, `ProductTable` linked-suppliers modal

### What's missing (this iteration)
The purchase list rows (left panel — the cards showing "TRICOT S", urgency dot, Stock/Seuil/Qté) have **no visible supplier avatars**. The user must click a row to reveal linked suppliers in the right panel. The new prompt requires supplier avatars to appear directly inside the product card "as small circular icons" for instant visual scanning.

### Change

**Edit `src/pages/PurchaseRequests.tsx` — purchase list row (around line 591–635)**

Add a compact avatar stack on the right side of each purchase card, rendered just before the status badge:

- Pull linked suppliers via `getSuppliersForProduct(req.product_id, true)` (linked-only)
- Render up to 3 `SupplierAvatar` (size `sm`) overlapping with `-ml-2` for a stacked look
- If more than 3 → show a `+N` chip
- If zero linked suppliers → show a subtle "—" or skip silently (no clutter)
- Wrap in `onClick={e => e.stopPropagation()}` so clicking an avatar opens its popover (Call/WhatsApp) without toggling the row selection
- Hidden on very small screens (`hidden sm:flex`) to preserve mobile layout

### Visual layout (after change)

```text
[●] TRICOT S [Urgent]    10  20  20    [👤👤👤+2]  [Pending]  [Edit]
```

### Files to edit
- `src/pages/PurchaseRequests.tsx` (one small JSX insertion in the purchase row)

No DB changes, no new components, no hook changes — purely a UI enhancement reusing existing infrastructure.
