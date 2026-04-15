
-- Add new values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'magasinier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chef_chantier';

-- Add assigned_project to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_project text DEFAULT NULL;
