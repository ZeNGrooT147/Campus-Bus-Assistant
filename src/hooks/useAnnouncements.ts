import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  severity: 'normal' | 'important' | 'critical';
  target_role: 'student' | 'driver' | 'coordinator' | 'admin';
  isUrgent: boolean;
  postedAt: Date;
  expiresAt: Date | null;
  createdBy: string;
  is_read: boolean;
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!userData.user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.warn('No announcements data received');
        setAnnouncements([]);
        return;
      }

      const formattedAnnouncements = data.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        content: alert.message,
        severity: alert.severity || 'normal',
        target_role: alert.target_role || 'student',
        isUrgent: alert.severity === 'critical',
        postedAt: new Date(alert.created_at),
        expiresAt: alert.expires_at ? new Date(alert.expires_at) : null,
        createdBy: alert.created_by,
        is_read: alert.is_read || false
      }));

      setAnnouncements(formattedAnnouncements);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to fetch announcements');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch announcements',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === id 
            ? { ...announcement, is_read: true }
            : announcement
        )
      );

      toast({
        title: "Success",
        description: "Announcement marked as read",
      });
    } catch (err: any) {
      console.error('Error marking announcement as read:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to mark announcement as read',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('alerts_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        console.log('Real-time update received:', payload);
        fetchAnnouncements();
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    announcements,
    isLoading,
    error,
    refreshAnnouncements: fetchAnnouncements,
    markAsRead
  };
}
