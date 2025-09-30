import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ShoppingBag } from 'lucide-react';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileNav: React.FC = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useLanguage();

  const handleNewExpense = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="grid grid-cols-5 h-16 safe-area-inset-bottom">
          <Link href="/">
            <div className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/" ? "text-primary" : "text-slate-500"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard">
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
              <span className="text-xs mt-1">{t('dashboard')}</span>
            </div>
          </Link>
          
          <Link href="/inventory">
            <div className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/inventory" ? "text-primary" : "text-slate-500"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package">
                <path d="M16.5 9.4 7.55 4.24"></path>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.29 7 12 12 20.71 7"></polyline>
                <line x1="12" y1="22" x2="12" y2="12"></line>
              </svg>
              <span className="text-xs mt-1">{t('products')}</span>
            </div>
          </Link>
          
          <Link href="/procurement">
            <div className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/procurement" ? "text-primary" : "text-slate-500"
            )}>
              <ShoppingBag size={20} />
              <span className="text-xs mt-1">{t('procurement')}</span>
            </div>
          </Link>
          
          <Link href="/suppliers">
            <div className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/suppliers" ? "text-primary" : "text-slate-500"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck">
                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
                <circle cx="7" cy="18" r="2"></circle>
                <circle cx="17" cy="18" r="2"></circle>
              </svg>
              <span className="text-xs mt-1">{t('suppliers')}</span>
            </div>
          </Link>
          
          <Link href="/accounting">
            <div className={cn(
              "flex flex-col items-center justify-center cursor-pointer",
              location === "/accounting" ? "text-primary" : "text-slate-500"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-landmark">
                <line x1="3" x2="21" y1="22" y2="22"></line>
                <line x1="6" x2="6" y1="18" y2="11"></line>
                <line x1="10" x2="10" y1="18" y2="11"></line>
                <line x1="14" x2="14" y1="18" y2="11"></line>
                <line x1="18" x2="18" y1="18" y2="11"></line>
                <polygon points="12 2 20 7 4 7"></polygon>
              </svg>
              <span className="text-xs mt-1">{t('accounting')}</span>
            </div>
          </Link>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Expense Entry</DialogTitle>
          </DialogHeader>
          <ExpenseForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileNav;
