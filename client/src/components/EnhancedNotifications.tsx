import React from "react";
import { Bell, AlertTriangle, Clock, CheckCircle, Shield, Activity, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationContext";
import { Link } from "wouter";

const EnhancedNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Get recent unread notifications for preview with safe defaults
  const recentNotifications = React.useMemo(() => {
    try {
      return (notifications || [])
        .filter(n => n && !n.isRead)
        .slice(0, 6);
    } catch (error) {
      console.error('Error filtering notifications:', error);
      return [];
    }
  }, [notifications]);

  const getIcon = (type: string, category: string) => {
    if (type === 'error' || category === 'inventory') return AlertTriangle;
    if (type === 'warning') return Clock;
    if (type === 'success') return CheckCircle;
    if (category === 'user') return User;
    if (category === 'financial') return ShoppingCart;
    if (category === 'system') return Shield;
    return Activity;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-3 hover:bg-gray-100 transition-all duration-200">
          <Bell className={`h-6 w-6 transition-colors duration-200 ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-7 w-7 flex items-center justify-center text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-white shadow-xl rounded-full animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
            )}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Dynamic Notifications */}
        {unreadCount === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">All caught up!</p>
            <p className="text-xs">No new notifications</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.map((notification) => {
              if (!notification || !notification.id) return null;
              const IconComponent = getIcon(notification.type || 'info', notification.category || 'system');
              return (
                <div 
                  key={notification.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${getPriorityColor(notification.priority)}`}
                  onClick={() => {
                    try {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    } catch (error) {
                      console.error('Error handling notification click:', error);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className={`h-4 w-4 mt-0.5 ${
                      notification.priority === 'high' ? 'text-red-500' :
                      notification.priority === 'medium' ? 'text-orange-500' :
                      'text-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {notification.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityBadge(notification.priority)}`}
                        >
                          {notification.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">
                          {notification.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Last updated: Just now</span>
            <Button variant="outline" size="sm" className="text-xs">
              Mark All Read
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNotifications;