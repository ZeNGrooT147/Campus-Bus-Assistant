import React, { useState, useEffect } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Use the alerts table which is already in the database types
interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  severity: string; // Using severity instead of type
}

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Fetch from alerts table instead of notifications
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        if (data) {
          // Map the alerts data to match our notification interface
          const mappedData = data.map(alert => ({
            id: alert.id,
            title: alert.title,
            message: alert.message,
            created_at: alert.created_at,
            is_read: alert.is_read || false,
            severity: alert.severity || 'info'
          }));
          setNotifications(mappedData);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Don't show error toast as notifications might not exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up realtime subscription for new alerts
    const subscription = supabase
      .channel('alerts_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        // Update notifications when there's a change
        fetchNotifications();
        
        // Show toast notification for new alerts
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as any;
          toast.info(`New notification: ${newAlert.title}`);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (notificationIds.length === 0) return;
      
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const clearAllNotifications = async () => {
    try {
      setClearing(true);
      let filter = {};
      if (user && user.id) {
        filter = { user_id: user.id };
      }
      const { error } = await supabase
        .from('alerts')
        .delete()
        .match(filter);
      if (error) throw error;
      // Fetch notifications again to update UI
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (fetchError) throw fetchError;
      setNotifications(data || []);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setClearing(false);
    }
  };

  // Helper function to determine badge color based on severity
  const getNotificationTypeColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500'; // info
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted/30 transition-all duration-200"
        >
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5 animate-pulse text-primary" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="sm" 
              className="text-xs h-7"
              onClick={clearAllNotifications}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`cursor-pointer flex flex-col items-start p-3 ${!notification.is_read ? 'bg-muted/50' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between w-full">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  {!notification.is_read && (
                    <Badge 
                      variant="outline" 
                      className={`mt-1 ${getNotificationTypeColor(notification.severity)} text-white`}
                    >
                      New
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
