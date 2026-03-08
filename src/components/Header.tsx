import { Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { signOut } = useAuth();

  return (
    <header className="gradient-header shadow-elevated sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Glassmorphism logo icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-md opacity-30 bg-white" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-lg">
                <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/25 to-transparent" />
                <Package className="h-5 w-5 text-white relative z-10 drop-shadow-sm" strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-foreground tracking-tight">
                نظام إدارة المخزون
              </h1>
              <p className="text-xs text-primary-foreground/70">
                تتبع الطلبات والكميات بسهولة
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2 rounded-xl"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">خروج</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
