import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  User,
  Package,
  FileText,
  DollarSign,
  Settings,
  Filter,
  Mail,
  Eye,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  category: 'system' | 'user' | 'inventory' | 'financial' | 'orders';
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const Notifications = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Panadol Advance is running low (only 15 units remaining)',
      timestamp: '2 minutes ago',
      isRead: false,
      category: 'inventory',
      priority: 'high',
      actionUrl: '/products'
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Received',
      message: 'Payment of EGP 15,240 received from Cairo Medical Center',
      timestamp: '15 minutes ago',
      isRead: false,
      category: 'financial',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'info',
      title: 'New User Registration',
      message: 'Ahmed Hassan has registered as a new Sales Representative',
      timestamp: '1 hour ago',
      isRead: true,
      category: 'user',
      priority: 'low'
    },
    {
      id: '4',
      type: 'error',
      title: 'Product Expired',
      message: 'Cataflam 500mg batch #CTF-456 has expired (expired 3 days ago)',
      timestamp: '2 hours ago',
      isRead: false,
      category: 'inventory',
      priority: 'high'
    },
    {
      id: '5',
      type: 'success',
      title: 'Order Completed',
      message: 'Production order #PO-2024-158 has been completed successfully',
      timestamp: '3 hours ago',
      isRead: true,
      category: 'orders',
      priority: 'medium'
    },
    {
      id: '6',
      type: 'info',
      title: 'System Backup',
      message: 'Automated system backup completed successfully',
      timestamp: '6 hours ago',
      isRead: true,
      category: 'system',
      priority: 'low'
    },
    {
      id: '7',
      type: 'warning',
      title: 'Invoice Overdue',
      message: 'Invoice #INV-2024-342 from Alexandria Pharma is 5 days overdue',
      timestamp: '8 hours ago',
      isRead: false,
      category: 'financial',
      priority: 'high'
    },
    {
      id: '8',
      type: 'info',
      title: 'User Login',
      message: 'Dr. Sarah Johnson logged in from new device (Cairo office)',
      timestamp: '1 day ago',
      isRead: true,
      category: 'user',
      priority: 'low'
    },
    {
      id: '9',
      type: 'success',
      title: 'New Customer Added',
      message: 'Delta Medical has been added as a new customer',
      timestamp: '1 day ago',
      isRead: true,
      category: 'user',
      priority: 'medium'
    },
    {
      id: '10',
      type: 'warning',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance will begin in 2 hours',
      timestamp: '1 day ago',
      isRead: false,
      category: 'system',
      priority: 'medium'
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'orders':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !notification.isRead;
    return notification.category === selectedFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with system activities and user actions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: Bell },
              { key: 'unread', label: 'Unread', icon: Mail },
              { key: 'system', label: 'System', icon: Settings },
              { key: 'user', label: 'Users', icon: User },
              { key: 'inventory', label: 'Inventory', icon: Package },
              { key: 'financial', label: 'Financial', icon: DollarSign },
              { key: 'orders', label: 'Orders', icon: FileText }
            ].map(filter => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "outline"}
                  onClick={() => setSelectedFilter(filter.key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">There are no notifications matching your current filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <Badge className={getBadgeColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(notification.category)}
                          {notification.category}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {notification.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {notifications.filter(n => n.priority === 'medium').length}
            </div>
            <div className="text-sm text-gray-600">Medium Priority</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.priority === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Low Priority</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;