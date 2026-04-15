import { useState, useRef } from 'react';
import { Search, Upload, Shield, UserCheck, Users } from 'lucide-react';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Team = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profiles, myProfile, isLoading, getUserRole, updateMyProfile, uploadAvatar, assignRole } = useProfiles();
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPos, setEditPos] = useState('');
  const [editing, setEditing] = useState(false);

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

  const startEdit = () => {
    setEditName(myProfile?.display_name || '');
    setEditDept(myProfile?.department || '');
    setEditPos(myProfile?.position || '');
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      await updateMyProfile({ display_name: editName, department: editDept, position: editPos });
      setEditing(false);
      toast.success(t.editSuccess);
    } catch { toast.error(t.editFail); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success(t.editSuccess);
    } catch { toast.error(t.editFail); }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'magasinier' | 'chef_chantier') => {
    try {
      await assignRole(userId, role);
      toast.success(t.editSuccess);
    } catch { toast.error(t.editFail); }
  };

  const filtered = profiles.filter(p =>
    !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        {/* My Profile Card */}
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {t.teamMyProfile}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <UserAvatar name={myProfile?.display_name} avatarUrl={myProfile?.avatar_url} size="lg" showTooltip={false} />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="h-4 w-4 text-white" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              {editing ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">{t.fullName}</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">{t.empDepartment}</Label>
                      <Select value={editDept} onValueChange={setEditDept}>
                        <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{t.empPosition}</Label>
                      <Input value={editPos} onChange={e => setEditPos(e.target.value)} className="rounded-xl mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl" onClick={saveProfile}>{t.save}</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditing(false)}>{t.cancel}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{myProfile?.display_name || '—'}</h3>
                    {myRole && (
                      <Badge className={myRole === 'admin' ? 'bg-amber-100 text-amber-800' : myRole === 'magasinier' ? 'bg-blue-100 text-blue-800' : myRole === 'viewer' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                        <Shield className="h-3 w-3 mr-1" />
                        {myRole === 'admin' ? t.teamRoleAdmin : myRole === 'magasinier' ? t.teamRoleMagasinier : myRole === 'viewer' ? t.teamRoleViewer : t.teamRoleChefChantier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{getDeptLabel(myProfile?.department)} {myProfile?.position ? `• ${myProfile.position}` : ''}</p>
                  <Button size="sm" variant="ghost" className="mt-2 rounded-xl text-xs" onClick={startEdit}>{t.editProduct}</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team List */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t.teamSection} ({profiles.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t.searchEmployee} value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl pe-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(profile => {
                const role = getUserRole(profile.user_id);
                const isMe = profile.user_id === user?.id;
                return (
                  <div key={profile.id} className={`rounded-xl border p-4 flex items-start gap-3 transition-shadow hover:shadow-sm ${isMe ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}>
                    <UserAvatar name={profile.display_name} avatarUrl={profile.avatar_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{profile.display_name || '—'}</p>
                        {isMe && <span className="text-[10px] text-primary font-medium">({t.teamYou})</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{getDeptLabel(profile.department)} {profile.position ? `• ${profile.position}` : ''}</p>
                      {isAdmin && !isMe ? (
                        <Select value={role || ''} onValueChange={(v) => handleRoleChange(profile.user_id, v as 'admin' | 'magasinier' | 'chef_chantier')}>
                          <SelectTrigger className="rounded-lg mt-2 h-7 text-xs w-36">
                            <SelectValue placeholder={t.teamAssignRole} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t.teamRoleAdmin}</SelectItem>
                            <SelectItem value="magasinier">{t.teamRoleMagasinier}</SelectItem>
                            <SelectItem value="chef_chantier">{t.teamRoleChefChantier}</SelectItem>
                            <SelectItem value="viewer">{t.teamRoleViewer}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : role ? (
                        <Badge className={`mt-2 text-[10px] ${role === 'admin' ? 'bg-amber-100 text-amber-800' : role === 'magasinier' ? 'bg-blue-100 text-blue-800' : role === 'viewer' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                          <Shield className="h-2.5 w-2.5 mr-0.5" />
                          {role === 'admin' ? t.teamRoleAdmin : role === 'magasinier' ? t.teamRoleMagasinier : role === 'viewer' ? t.teamRoleViewer : t.teamRoleChefChantier}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t border-border/50 py-5 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground/60">
          {t.footer} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Team;
