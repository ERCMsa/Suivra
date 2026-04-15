# Project Memory

## Core
ERCMsa brand. Arabic/French (RTL/LTR). Latin numbers only.
Glassmorphism, Teal/Blue, Emerald Green for Décharge buttons.
3 roles: admin, magasinier, chef_chantier. Supabase Auth + usePermissions hook.

## Memories
- [Authentication & RBAC](mem://auth/authentication-system) — 3-role system (admin/magasinier/chef_chantier) with RLS + usePermissions hook
- [Inventory Requirements](mem://features/inventory-system-requirements) — Tracks tools, clothes, consumables, parts with custom status
- [Stock Movements](mem://features/stock-movements-tracking) — Mandatory 'Taken By' with confirmation popup
- [Multilingual](mem://features/multilingual-support) — Arabic/French, RTL/LTR, Latin numerals, auto-translating categories
- [Visual Identity](mem://style/visual-identity) — Glassmorphism, Teal/Blue gradients, Emerald Green for Décharge
- [UI & Navigation](mem://style/ui-navigation) — 'Accueil', top placement for Décharge/History, unified action menus, Team in settings
- [Branding](mem://style/branding) — ERCMsa logo in header/login, footer in PDFs
- [Discharge (Décharge)](mem://features/discharge-management) — Multi-item handovers, legal PDF with liability/signatures
- [Caisse Management](mem://features/caisse-management-system) — Independent tracking for CAISSE 1-8 field boxes, replacements
- [Personnel Management](mem://features/personnel-management) — Department split, equipment stats, discharge history, PDF exports
- [Damage Reporting](mem://features/damage-reporting) — Links items to workers, severity levels, official PDF reports
- [Withdrawal Workflow](mem://features/withdrawal-workflow) — Admin approval workflow with auto-deduction
- [Visual Analytics](mem://features/visual-analytics) — Recharts (gradients, rounded bars, area charts) with blur tooltips
- [Data Management](mem://features/data-management) — Bulk Excel import/export (auto column mapping), PDF exports
- [Media Management](mem://features/media-management) — Photos for items, damage proofs, worker avatars
- [Equipment History](mem://features/equipment-history) — Timeline view, prominent 'Taken By', filter by person
- [Brand Management](mem://features/brand-management) — Manual brand entry with logos for visual grid filtering
- [Smart Reorder](mem://features/automatic-reorder-system) — Min Threshold alerts, auto-generates supplier PDFs (excludes Caisses)
