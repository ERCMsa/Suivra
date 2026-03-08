import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/hooks/useLanguage';
import logo from '@/assets/logo.png';

const Auth = () => {
  const { user, isLoading, signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t.googleFail);
      setGoogleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.accountCreated);
    }
    setSubmitting(false);
  };

  const GoogleButton = ({ loading, label }: { loading: boolean; label: string }) => (
    <Button type="button" variant="outline" className="w-full rounded-xl h-11 font-medium border-border/60 hover:bg-secondary/50" onClick={handleGoogleSignIn} disabled={loading}>
      <svg className="h-4 w-4 ml-2" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? t.signingWithGoogle : label}
    </Button>
  );

  const DividerOr = () => (
    <div className="relative my-5">
      <Separator className="bg-border/50" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[11px] text-muted-foreground/60 uppercase tracking-wider">{t.or}</span>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <img src={logo} alt="ERCM SA" className="h-20 w-auto mx-auto drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.inventorySystem}</h1>
            <p className="text-xs text-muted-foreground mt-1">{t.authSubtitle}</p>
          </div>
        </div>
        <Card className="shadow-elevated border-0 rounded-2xl overflow-hidden">
          <Tabs defaultValue="login">
            <CardHeader className="pb-0 pt-5 px-5">
              <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-secondary/60 p-1">
                <TabsTrigger value="login" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">{t.login}</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">{t.newAccount}</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <TabsContent value="login" className="mt-0 space-y-0">
                <GoogleButton loading={googleLoading} label={t.loginWithGoogle} />
                <DividerOr />
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs">{t.email}</Label>
                    <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required dir="ltr" className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-xs">{t.password}</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required dir="ltr" className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl font-medium text-sm" disabled={submitting}>
                    {submitting ? t.loggingIn : t.login}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-0 space-y-0">
                <GoogleButton loading={googleLoading} label={t.signupWithGoogle} />
                <DividerOr />
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs">{t.fullName}</Label>
                    <Input id="signup-name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs">{t.email}</Label>
                    <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required dir="ltr" className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs">{t.password}</Label>
                    <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} dir="ltr" className="h-10 rounded-xl text-sm bg-secondary/30 border-0 focus-visible:ring-1" />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl font-medium text-sm" disabled={submitting}>
                    {submitting ? t.creatingAccount : t.createAccount}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
