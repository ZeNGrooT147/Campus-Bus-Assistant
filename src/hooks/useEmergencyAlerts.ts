import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast.tsx';
import { useAuth } from '@/context/AuthContext';

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  severity: 'normal' | 'important' | 'critical';
  target_role: string | null;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_read: boolean;
}

export function useEmergencyAlerts() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch alerts data
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (alertsError) throw alertsError;
      
      // Cast the severity field to the correct type
      const typedAlerts: EmergencyAlert[] = (alertsData || []).map(alert => ({
        ...alert,
        severity: alert.severity as 'normal' | 'important' | 'critical'
      }));

      setAlerts(typedAlerts);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      toast.error('Failed to load emergency information');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    
    // Set up realtime subscription for alert updates
    const subscription = supabase
      .channel('emergency_alerts_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Immediately fetch all alerts to get the latest data
          fetchAlerts();
          
          // Show toast notification for new emergency alerts
          toast.warning('New emergency alert received!');
        } else {
          // For updates and deletions, just refresh the data
          fetchAlerts();
        }
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAlerts]);

  return { alerts, isLoading, refetchAlerts: fetchAlerts };
}
