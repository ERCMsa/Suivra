import { LogOut, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
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
  const { signOut } = useAuth();
  const { t, lang, setLang } = useLanguage();

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-xl h-9 w-9"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={lang === 'ar' ? 'start' : 'end'} className="w-48 rounded-xl">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  {t.language}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLang('ar')}
                  className={`rounded-lg cursor-pointer ${lang === 'ar' ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                  <span className="ml-2">🇸🇦</span>
                  {t.arabic}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLang('fr')}
                  className={`rounded-lg cursor-pointer ${lang === 'fr' ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                  <span className="ml-2">🇫🇷</span>
                  {t.french}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
