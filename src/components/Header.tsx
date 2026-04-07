import { LogOut, Settings, Globe, Package, Users, UserCircle, Cog, Box, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfiles } from '@/hooks/useProfiles';
import UserAvatar from '@/components/UserAvatar';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo.png';

const Header = () => {
  const { signOut, user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { myProfile } = useProfiles();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="gradient-header shadow-elevated sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-auto rounded-xl bg-white/95 p-1.5 shadow-md">
              <img src={logo} alt="ERCM SA" className="h-full w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-foreground tracking-tight">
                {t.appTitle}
              </h1>
              <p className="text-xs text-primary-foreground/70">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl text-xs ${location.pathname === '/' ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
              onClick={() => navigate('/')}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t.navInventory}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl text-xs ${location.pathname === '/employees' ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
              onClick={() => navigate('/employees')}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t.navEmployees}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl text-xs ${location.pathname === '/caisses' ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
              onClick={() => navigate('/caisses')}
            >
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === 'fr' ? 'Caisses' : 'الصناديق'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl text-xs ${location.pathname === '/purchase-requests' ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
              onClick={() => navigate('/purchase-requests')}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === 'fr' ? 'Achats' : 'المشتريات'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 rounded-xl text-xs ${location.pathname === '/settings' ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
              onClick={() => navigate('/settings')}
            >
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">{t.navSettings}</span>
            </Button>
            <div className="cursor-pointer" onClick={() => navigate('/team')}>
              <UserAvatar name={myProfile?.display_name} avatarUrl={myProfile?.avatar_url} size="sm" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2 rounded-xl"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{t.logout}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
