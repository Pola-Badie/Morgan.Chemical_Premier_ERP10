import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, XCircle, Calendar, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpiringProduct {
  id: number;
  name: string;
  drugName: string;
  expiryDate: string;
  currentStock: number;
  unitOfMeasure: string;
  categoryName: string;
  manufacturer: string;
  daysUntilExpiry: number;
  expiryStatus: 'no_expiry' | 'expired' | 'critical' | 'warning' | 'normal';
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

const ExpiringProductsCard = () => {
  const [, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);
  const { t } = useLanguage();

  // Function to navigate to inventory with highlight
  const navigateToProduct = (productId: number, productName: string) => {
    setLocation(`/inventory?highlight=${productId}&product=${encodeURIComponent(productName)}`);
  };

  const { data: expiringProducts = [], isLoading, error } = useQuery<ExpiringProduct[]>({
    queryKey: ['expiring-products'],
    queryFn: async () => {
      console.log('Fetching expiring products from real API for real-time inventory tracking');
      const response = await fetch('/api/inventory/expiring');
      if (!response.ok) {
        throw new Error('Failed to fetch expiring products');
      }
      const data = await response.json();
      console.log('Expiring products API response:', data);
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  const { data: summary } = useQuery<InventorySummary>({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/summary');
      const data = await response.json();
      console.log('Inventory summary API response:', data);
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  const getExpiryStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExpiryIcon = (status: string) => {
    switch (status) {
      case 'expired': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDaysUntilExpiry = (days: number) => {
    if (days < 0) return t('expired');
    if (days === 0) return t('expiresToday');
    if (days === 1) return t('expiresTomorrow');
    return t('daysLeft').replace('{days}', days.toString());
  };

  const formatExpiryDate = (dateString: string) => {
    if (!dateString) return t('noExpiry');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('expiringProducts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            {t('errorLoadingExpiryData')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('unableToLoadExpiry')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          {t('expiringProducts')}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-xs">
            {expiringProducts.filter(p => p.expiryStatus === 'expired').length} {t('expired')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {expiringProducts.filter(p => p.expiryStatus !== 'expired' && p.daysUntilExpiry <= 30).length} {t('expiring')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!expiringProducts || expiringProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>{t('noProductsExpiringSoon')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAll ? expiringProducts : Array.isArray(expiringProducts) ? expiringProducts.slice(0, 5) : []).map((product) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md alert-card-item"
                onClick={() => navigateToProduct(product.id, product.name)}
              >
                <div className="flex items-center gap-3">
                  {getExpiryIcon(product.expiryStatus)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 truncate">{product.drugName}</p>
                    <p className="text-xs text-gray-400">
                      {product.manufacturer || product.categoryName}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge 
                    className={`${getExpiryStatusColor(product.expiryStatus)} text-xs mb-1`}
                  >
                    {formatDaysUntilExpiry(product.daysUntilExpiry)}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {formatExpiryDate(product.expiryDate)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('stock')}: {product.currentStock} {product.unitOfMeasure}
                  </p>
                </div>
              </div>
            ))}

            {expiringProducts.length > 5 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      {t('showLess')}
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {t('showAllItems').replace('{count}', expiringProducts.length.toString())}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation('/inventory?tab=expiring')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiringProductsCard;