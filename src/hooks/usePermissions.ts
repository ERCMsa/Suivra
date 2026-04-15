import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';

export type AppRole = 'admin' | 'magasinier' | 'chef_chantier' | 'viewer';

export const usePermissions = () => {
  const { user } = useAuth();
  const { getUserRole, myProfile } = useProfiles();

  const role = user ? (getUserRole(user.id) as AppRole | null) : null;

  const isAdmin = role === 'admin';
  const isMagasinier = role === 'magasinier';
  const isChefChantier = role === 'chef_chantier';
  const isViewer = role === 'viewer';

  return {
    role,
    isAdmin,
    isMagasinier,
    isChefChantier,
    isViewer,

    // Navigation
    canViewSettings: isAdmin,
    canViewTeam: true,
    canViewInventory: isAdmin || isMagasinier,
    canViewEmployees: isAdmin || isMagasinier,
    canViewCaisses: isAdmin || isMagasinier,
    canViewPurchases: isAdmin || isMagasinier,

    // Products / Stock
    canAddProduct: isAdmin || isMagasinier,
    canEditProduct: isAdmin || isMagasinier,
    canDeleteProduct: isAdmin,
    canModifyStock: isAdmin || isMagasinier,

    // Discharges
    canCreateDischarge: isAdmin || isMagasinier,
    canEditDischarge: isAdmin || isMagasinier,
    canDeleteDischarge: isAdmin,
    canCancelDischarge: isAdmin || isMagasinier,
    canViewAllDischarges: isAdmin || isMagasinier,

    // Users
    canManageUsers: isAdmin,
    canAssignRoles: isAdmin,

    // Withdrawal requests
    canCreateWithdrawal: true,
    canApproveWithdrawal: isAdmin || isMagasinier,

    // Damage reports
    canCreateDamageReport: isAdmin || isMagasinier,

    // Export
    canExport: isAdmin || isMagasinier,
  };
};
