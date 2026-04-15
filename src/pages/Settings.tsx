import { useState } from 'react';
import { Shield, Trash2, Users, Settings as SettingsIcon, Globe, UserCog } from 'lucide-react';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { t, lang, setLang } = useLanguage();
  const { user } = useAuth();
  const { profiles, getUserRole, assignRole, fetchProfiles, updateMyProfile } = useProfiles();
  const [search, setSearch] = useState('');

  const myRole = user ? getUserRole(user.id) : null;
  const isAdmin = myRole === 'admin';

  const departments = [
    { value: 'warehouse', label: t.magasin },
    { value: 'production', label: t.deptProduction },
    { value: 'maintenance', label: t.deptMaintenance },
    { value: 'administration', label: t.deptAdministration },
    { value: 'montage', label: t.deptMontage },
    { value: 'civil_engineering', label: t.deptCivilEngineering },
  ];

  const getDeptLabel = (d: string | null) => departments.find(dep => dep.value === d)?.label || d || '—';

  const handleRoleChange = async (userId: string, role: 'admin' | 'magasinier' | 'chef_chantier') => {
    try {
      await assignRole(userId, role);
      toast.success(t.editSuccess);
    } catch { toast.error(t.editFail); }
  };

  const handleDeleteUser = async (profileUserId: string) => {
    try {
      // Delete profile (cascading will handle user_roles via user_id)
      await supabase.from('user_roles').delete().eq('user_id', profileUserId);
      await supabase.from('profiles').delete().eq('user_id', profileUserId);
      await fetchProfiles();
      toast.success(t.productDeleted);
    } catch { toast.error(t.editFail); }
  };

  const handleUpdateProfile = async (profile: Profile, updates: { display_name?: string; department?: string; position?: string }) => {
    try {
      await supabase.from('profiles').update(updates as any).eq('id', profile.id);
      await fetchProfiles();
      toast.success(t.editSuccess);
    } catch { toast.error(t.editFail); }
  };

  const filtered = profiles.filter(p =>
    !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-5xl">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          {t.settings}
        </h2>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="users" className="rounded-lg gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              {t.settingsUsers}
            </TabsTrigger>
            <TabsTrigger value="general" className="rounded-lg gap-1.5 text-xs">
              <Globe className="h-3.5 w-3.5" />
              {t.settingsGeneral}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    {t.settingsUsers} ({profiles.length})
                  </CardTitle>
                  <Input
                    placeholder={t.searchEmployee}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs rounded-xl text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filtered.map(profile => {
                    const role = getUserRole(profile.user_id);
                    const isMe = profile.user_id === user?.id;
                    return (
                      <div key={profile.id} className={`rounded-xl border p-3 flex items-center gap-3 transition-shadow hover:shadow-sm ${isMe ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}>
                        <UserAvatar name={profile.display_name} avatarUrl={profile.avatar_url} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">{profile.display_name || '—'}</p>
                            {isMe && <span className="text-[10px] text-primary font-medium">({t.teamYou})</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getDeptLabel(profile.department)} {profile.position ? `• ${profile.position}` : ''}
                          </p>
                        {role && (
                            <Badge className={`mt-1 text-[10px] ${role === 'admin' ? 'bg-amber-100 text-amber-800' : role === 'magasinier' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              {role === 'admin' ? t.teamRoleAdmin : role === 'magasinier' ? t.teamRoleMagasinier : t.teamRoleChefChantier}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && !isMe && (
                            <>
                              <Select value={role || ''} onValueChange={(v) => handleRoleChange(profile.user_id, v as 'admin' | 'magasinier' | 'chef_chantier')}>
                                <SelectTrigger className="rounded-lg h-8 text-xs w-32">
                                  <SelectValue placeholder={t.teamAssignRole} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">{t.teamRoleAdmin}</SelectItem>
                                  <SelectItem value="magasinier">{t.teamRoleMagasinier}</SelectItem>
                                  <SelectItem value="chef_chantier">{t.teamRoleChefChantier}</SelectItem>
                                </SelectContent>
                              </Select>
                              <EditProfileDialog profile={profile} departments={departments} onSave={handleUpdateProfile} t={t} />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.deleteUserConfirm}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
                                    <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => handleDeleteUser(profile.user_id)}>
                                      {t.delete}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t.language}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={lang === 'ar' ? 'default' : 'outline'}
                    className="rounded-xl gap-2"
                    onClick={() => setLang('ar')}
                  >
                    🇸🇦 {t.arabic}
                  </Button>
                  <Button
                    variant={lang === 'fr' ? 'default' : 'outline'}
                    className="rounded-xl gap-2"
                    onClick={() => setLang('fr')}
                  >
                    🇫🇷 {t.french}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          {t.footer} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

// Edit Profile Dialog component
const EditProfileDialog = ({ profile, departments, onSave, t }: { 
  profile: Profile; 
  departments: { value: string; label: string }[];
  onSave: (profile: Profile, updates: any) => Promise<void>;
  t: any;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.display_name || '');
  const [dept, setDept] = useState(profile.department || '');
  const [pos, setPos] = useState(profile.position || '');

  const handleSave = async () => {
    await onSave(profile, { display_name: name, department: dept, position: pos });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setName(profile.display_name || ''); setDept(profile.department || ''); setPos(profile.position || ''); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <UserCog className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t.editUser}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t.fullName}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t.empDepartment}</Label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t.empPosition}</Label>
            <Input value={pos} onChange={e => setPos(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button size="sm" className="rounded-xl" onClick={handleSave}>{t.save}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
