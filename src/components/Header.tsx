import { Package, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { signOut } = useAuth();

  return (
    <header className="gradient-primary shadow-elevated">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <Package className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                نظام إدارة المخزون
              </h1>
              <p className="text-sm text-primary-foreground/80">
                تتبع الطلبات والكميات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
