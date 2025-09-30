import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { getOptimalCardColumns, isMobile } from '@/utils/mobileUtils';

interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  totalOrders: number;
  totalRevenue: number;
  systemHealth: string;
  lastUpdated: string;
  recentActivities: Array<{
    id: string;
    type: 'order' | 'inventory' | 'alert' | 'user';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export default function RealTimeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastActivity, setLastActivity] = useState<string>('');
  const { toast } = useToast();

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isRealTimeEnabled) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setWs(websocket);

        // Send initial subscription
        websocket.send(JSON.stringify({
          type: 'subscribe',
          channel: 'dashboard'
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'dashboard_update':
              setData(message.data);
              setLastActivity(new Date().toLocaleTimeString());
              break;

            case 'inventory_alert':
              toast({
                title: "Inventory Alert",
                description: message.message,
                variant: message.severity === 'high' ? 'destructive' : 'default',
              });
              break;

            case 'order_notification':
              toast({
                title: "Order Update",
                description: message.message,
              });
              break;

            case 'system_notification':
              toast({
                title: "System Update",
                description: message.message,
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setWs(null);

        // Attempt to reconnect after 3 seconds
        if (isRealTimeEnabled) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, [isRealTimeEnabled, toast]);

  // Fallback polling for when WebSocket is not available
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/summary');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setLastActivity(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  // Initialize connection and polling
  useEffect(() => {
    if (isRealTimeEnabled) {
      connectWebSocket();
    } else {
      // Close WebSocket if real-time is disabled
      if (ws) {
        ws.close();
      }

      // Use polling as fallback
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isRealTimeEnabled, connectWebSocket, fetchDashboardData, refreshInterval, ws]);

  // Manual refresh
  const handleManualRefresh = () => {
    if (isConnected && ws) {
      ws.send(JSON.stringify({
        type: 'refresh',
        channel: 'dashboard'
      }));
    } else {
      fetchDashboardData();
    }
  };

  // Toggle real-time updates
  const toggleRealTime = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);

    if (!enabled && ws) {
      ws.close();
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const keyMetrics = (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{data.totalProducts}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{data.lowStockCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600">{data.expiringCount}</p>
            </div>
            <Clock className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${data.totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Live' : 'Offline'}
              </Badge>

              {lastActivity && (
                <span className="text-sm text-muted-foreground">
                  Last update: {lastActivity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="real-time">Real-time Updates</Label>
                <Switch
                  id="real-time"
                  checked={isRealTimeEnabled}
                  onCheckedChange={toggleRealTime}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className={`grid gap-4 ${
        isMobile() 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>{keyMetrics}</div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${
              data.systemHealth === 'healthy' ? 'bg-green-500' : 
              data.systemHealth === 'warning' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <span className="font-medium capitalize">{data.systemHealth}</span>
            <Badge variant={
              data.systemHealth === 'healthy' ? 'default' : 
              data.systemHealth === 'warning' ? 'secondary' : 
              'destructive'
            }>
              {data.systemHealth}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  activity.severity === 'high' ? 'bg-red-500' :
                  activity.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Issues Alert */}
      {!isConnected && isRealTimeEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Real-time connection lost. Attempting to reconnect... 
            Dashboard data may be delayed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}