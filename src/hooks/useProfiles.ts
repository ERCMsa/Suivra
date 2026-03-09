import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  department: string | null;
  position: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'worker';
}

export const useProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data as Profile[]);
  }, []);

  const fetchRoles = useCallback(async () => {
    const { data } = await supabase.from('user_roles').select('*');
    if (data) setRoles(data as UserRole[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchProfiles(), fetchRoles()]).then(() => setIsLoading(false));
  }, [fetchProfiles, fetchRoles]);

  useEffect(() => {
    if (user && profiles.length > 0) {
      setMyProfile(profiles.find(p => p.user_id === user.id) || null);
    }
  }, [user, profiles]);

  const getProfileByUserId = useCallback((userId: string) => {
    return profiles.find(p => p.user_id === userId) || null;
  }, [profiles]);

  const getUserRole = useCallback((userId: string): 'admin' | 'worker' | null => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || null;
  }, [roles]);

  const updateMyProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'department' | 'position'>>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(updates as any).eq('user_id', user.id);
    if (error) throw error;
    await fetchProfiles();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateMyProfile({ avatar_url: urlData.publicUrl + '?t=' + Date.now() });
  };

  const assignRole = async (userId: string, role: 'admin' | 'worker') => {
    // Delete existing role first
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role } as any);
    if (error) throw error;
    await fetchRoles();
  };

  return {
    profiles,
    roles,
    myProfile,
    isLoading,
    getProfileByUserId,
    getUserRole,
    updateMyProfile,
    uploadAvatar,
    assignRole,
    fetchProfiles,
  };
};
