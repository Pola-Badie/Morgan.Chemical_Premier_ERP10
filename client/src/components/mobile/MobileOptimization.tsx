
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Settings,
  Eye,
  Touch,
  Zap
} from 'lucide-react';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  touchSupport: boolean;
  orientation: 'portrait' | 'landscape';
}

export default function MobileOptimization() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    width: window.innerWidth,
    height: window.innerHeight,
    touchSupport: 'ontouchstart' in window,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  });

  const [mobileSettings, setMobileSettings] = useState({
    enableTouchGestures: true,
    largerButtons: true,
    simplifiedNavigation: true,
    compactLayout: false,
    autoHideHeaders: true
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) type = 'mobile';
      else if (width < 1024) type = 'tablet';

      setDeviceInfo({
        type,
        width,
        height,
        touchSupport: 'ontouchstart' in window,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getOptimizationScore = () => {
    let score = 0;
    if (mobileSettings.enableTouchGestures) score += 20;
    if (mobileSettings.largerButtons) score += 20;
    if (mobileSettings.simplifiedNavigation) score += 20;
    if (mobileSettings.compactLayout) score += 20;
    if (mobileSettings.autoHideHeaders) score += 20;
    return score;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mobile Optimization</h1>
          <p className="text-muted-foreground">Optimize the experience for mobile devices</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          {getDeviceIcon()}
          {deviceInfo.type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Device Type</span>
                <Badge variant="secondary">{deviceInfo.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Screen Size</span>
                <span className="text-sm">{deviceInfo.width} × {deviceInfo.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Touch Support</span>
                <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                  {deviceInfo.touchSupport ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Orientation</span>
                <Badge variant="outline">{deviceInfo.orientation}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Optimization Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">
                {getOptimizationScore()}%
              </div>
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getOptimizationScore()}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {getOptimizationScore() >= 80 ? 'Excellent' :
                   getOptimizationScore() >= 60 ? 'Good' :
                   getOptimizationScore() >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Touch className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => setMobileSettings(prev => ({ ...prev, largerButtons: !prev.largerButtons }))}
            >
              {mobileSettings.largerButtons ? 'Disable' : 'Enable'} Large Buttons
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setMobileSettings(prev => ({ ...prev, simplifiedNavigation: !prev.simplifiedNavigation }))}
            >
              {mobileSettings.simplifiedNavigation ? 'Disable' : 'Enable'} Simple Navigation
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setMobileSettings(prev => ({ ...prev, compactLayout: !prev.compactLayout }))}
            >
              {mobileSettings.compactLayout ? 'Disable' : 'Enable'} Compact Layout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Touch Gestures</p>
                    <p className="text-sm text-muted-foreground">Enable swipe and pinch gestures</p>
                  </div>
                  <Button
                    variant={mobileSettings.enableTouchGestures ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMobileSettings(prev => ({ ...prev, enableTouchGestures: !prev.enableTouchGestures }))}
                  >
                    {mobileSettings.enableTouchGestures ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Larger Buttons</p>
                    <p className="text-sm text-muted-foreground">Increase button size for touch devices</p>
                  </div>
                  <Button
                    variant={mobileSettings.largerButtons ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMobileSettings(prev => ({ ...prev, largerButtons: !prev.largerButtons }))}
                  >
                    {mobileSettings.largerButtons ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Simplified Navigation</p>
                    <p className="text-sm text-muted-foreground">Use hamburger menu on mobile</p>
                  </div>
                  <Button
                    variant={mobileSettings.simplifiedNavigation ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMobileSettings(prev => ({ ...prev, simplifiedNavigation: !prev.simplifiedNavigation }))}
                  >
                    {mobileSettings.simplifiedNavigation ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact Layout</p>
                    <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                  </div>
                  <Button
                    variant={mobileSettings.compactLayout ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMobileSettings(prev => ({ ...prev, compactLayout: !prev.compactLayout }))}
                  >
                    {mobileSettings.compactLayout ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Hide Headers</p>
                    <p className="text-sm text-muted-foreground">Hide header on scroll for more space</p>
                  </div>
                  <Button
                    variant={mobileSettings.autoHideHeaders ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMobileSettings(prev => ({ ...prev, autoHideHeaders: !prev.autoHideHeaders }))}
                  >
                    {mobileSettings.autoHideHeaders ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <div className="bg-background border rounded p-4 max-w-sm mx-auto">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Dashboard</h3>
                      <Button size="sm">☰</Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm font-medium">Products</p>
                          <p className="text-lg font-bold">245</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-sm font-medium">Orders</p>
                          <p className="text-lg font-bold">12</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        size={mobileSettings.largerButtons ? "default" : "sm"}
                      >
                        Add Product
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        size={mobileSettings.largerButtons ? "default" : "sm"}
                      >
                        View Orders
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Design Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">✓ Best Practices</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Use minimum 44px touch targets</li>
                    <li>• Implement swipe gestures</li>
                    <li>• Optimize images for mobile</li>
                    <li>• Use responsive typography</li>
                    <li>• Minimize form fields</li>
                    <li>• Use native input types</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-red-600">✗ Avoid</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Small touch targets</li>
                    <li>• Horizontal scrolling</li>
                    <li>• Flash or heavy animations</li>
                    <li>• Tiny text (< 16px)</li>
                    <li>• Complex navigation</li>
                    <li>• Pop-ups and overlays</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
