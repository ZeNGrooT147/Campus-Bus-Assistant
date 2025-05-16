
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast.tsx';
import { useAuth } from '@/context/AuthContext';

export interface AssignedBus {
  id: string;
  name: string;
  bus_number: string;
  route?: string;
  status: 'active' | 'maintenance' | 'inactive';
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export function useAssignedBuses() {
  const [buses, setBuses] = useState<AssignedBus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchBuses = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // For drivers: get buses assigned to them
      // For students & coordinators: get all active buses
      const { data: busesData, error } = await supabase
        .from('buses')
        .select(`
          id, 
          name, 
          bus_number, 
          route, 
          status,
          assigned_driver
        `)
        .order('name');
      
      if (error) throw error;
      
      // Fetch driver profiles for all buses that have an assigned driver
      const driverIds = busesData
        .filter(bus => bus.assigned_driver)
        .map(bus => bus.assigned_driver);

      let driversData: any[] = [];
      if (driverIds.length > 0) {
        const { data: drivers, error: driversError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', driverIds);
          
        if (driversError) throw driversError;
        if (drivers) driversData = drivers;
      }

      // Format the bus data
      const formattedBuses: AssignedBus[] = busesData.map(bus => {
        const driver = driversData.find(d => d.id === bus.assigned_driver);
        
        return {
          id: bus.id,
          name: bus.name,
          bus_number: bus.bus_number,
          route: bus.route,
          // Fixed: Ensure status is one of the allowed types in the AssignedBus interface
          status: (bus.status as 'active' | 'maintenance' | 'inactive') || 'inactive',
          driver: driver ? {
            id: driver.id,
            name: driver.name,
            phone: driver.phone
          } : undefined,
        };
      });

      setBuses(formattedBuses);
      setLastUpdated(new Date());
      
      // Broadcast an event that data has been updated
      window.dispatchEvent(new CustomEvent('realtime-data-updated'));
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to load bus information');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBuses();

    // Set up realtime subscription for bus updates
    const subscription = supabase
      .channel('buses_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'buses' 
      }, (payload) => {
        console.log('Bus data changed:', payload);
        fetchBuses();
        
        // Show toast for specific changes
        if (payload.eventType === 'UPDATE') {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          if (oldData.assigned_driver !== newData.assigned_driver) {
            toast.info(`Driver assignment changed for bus ${newData.name}`);
          }
          
          if (oldData.status !== newData.status) {
            toast.info(`Bus ${newData.name} status changed to ${newData.status}`);
          }
          
          if (oldData.route !== newData.route) {
            toast.info(`Route updated for bus ${newData.name}`);
          }
        }
      })
      .subscribe();
    
    // Also subscribe to driver profile changes that might affect assigned buses
    const driverSubscription = supabase
      .channel('driver_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `role=eq.driver`
      }, () => {
        // When driver profile changes, refresh buses to get updated driver info
        fetchBuses();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
      driverSubscription.unsubscribe();
    };
  }, [fetchBuses]);

  return { 
    buses, 
    isLoading, 
    lastUpdated,
    refetchBuses: fetchBuses 
  };
}
