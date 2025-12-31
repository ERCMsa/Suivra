import { Package, BarChart3 } from 'lucide-react';

const Header = () => {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
