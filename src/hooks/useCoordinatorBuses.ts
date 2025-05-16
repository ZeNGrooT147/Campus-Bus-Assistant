import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface Driver {
  id: string;
  name: string;
  contact?: string;
  status: string;
  assigned_bus?: string;
  avatar_url?: string;
  profile_photo_url?: string;
}

export interface BusRoute {
  id: string;
  name: string;
  description?: string;
  start_location: string;
  end_location: string;
  region: string;
  stops: string[];
  busAssigned?: string;
}

export interface BusSchedule {
  id: string;
  busName: string;
  route: string;
  departureTime: string;
  departureLocation: string;
  arrivalTime: string;
  arrivalLocation: string;
  days: string[];
  type: string;
}

export interface Bus {
  id: string;
  name: string;
  bus_number: string;
  capacity: number;
  assigned_driver: string | null;
  status: string;
  route: string | null;
  route_id: string | null;
  current_location: string | null;
  current_passengers: number | null;
  created_at: string;
  updated_at: string;
  departure_time: string | null;
  arrival_time: string | null;
  next_departure: string | null;
  stops: string[] | null;
  bus_image: string | null;
  driver: {
    name: string;
    experience: string;
    phone: string;
    photo: string;
  } | null;
}

export function useCoordinatorBuses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchDrivers = useCallback(async () => {
    try {
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          phone,
          profile_photo_url,
          status,
          buses!buses_assigned_driver_fkey (
            name
          )
        `)
        .eq('role', 'driver');
          
      if (driversError) throw driversError;
      
      const formattedDrivers: Driver[] = (driversData || []).map((driver: any) => ({
        id: driver.id,
        name: driver.name,
        contact: driver.phone,
        status: driver.status || 'available',
        assigned_bus: driver.buses?.[0]?.name,
        avatar_url: driver.profile_photo_url,
        profile_photo_url: driver.profile_photo_url
      }));
      
      setDrivers(formattedDrivers);
      return formattedDrivers;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
      return [];
    }
  }, []);

  const fetchBuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include all required fields
      const transformedData: Bus[] = (data || []).map(bus => ({
        ...bus,
        departure_time: bus.departure_time || null,
        arrival_time: bus.arrival_time || null,
        next_departure: bus.next_departure || null,
        stops: bus.stops || null,
        bus_image: bus.bus_image || null,
        driver: bus.driver || null
      }));
      
      setBuses(transformedData);
    } catch (err) {
      console.error('Error fetching buses:', err);
      setError(err as Error);
      toast.error('Failed to fetch buses');
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select(`
          id,
          name,
          description,
          start_location,
          end_location,
          region,
          route_stops (
            stop_name,
            stop_order
          )
        `)
        .order('name');
      
      if (routesError) throw routesError;
      
      const formattedRoutes = (routesData || []).map((route: any) => ({
        id: route.id,
        name: route.name || '',
        description: route.description,
        start_location: route.start_location || '',
        end_location: route.end_location || '',
        region: route.region || 'dharwad',
        stops: route.route_stops 
          ? route.route_stops.map((stop: any) => stop.stop_name)
          : [route.start_location || '', route.end_location || ''],
        busAssigned: null
      }));
      
      setRoutes(formattedRoutes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          bus_id,
          route_id,
          departure_time,
          days_of_week,
          routes:route_id (
            name,
            start_location,
            end_location
          ),
          buses:bus_id (
            name
          )
        `);
      
      if (schedulesError) throw schedulesError;
      
      const formattedSchedules = (schedulesData || []).map(schedule => ({
        id: schedule.id,
        busName: schedule.buses?.name || 'No bus assigned',
        route: schedule.routes?.name || 'No route assigned',
        departureTime: schedule.departure_time,
        departureLocation: schedule.routes?.start_location || 'Unknown',
        arrivalTime: calculateArrivalTime(schedule.departure_time, 45),
        arrivalLocation: schedule.routes?.end_location || 'Unknown',
        days: schedule.days_of_week || [],
        type: 'Regular'
      }));
      
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    }
  }, []);

  // Add useEffect to fetch data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchBuses(),
          fetchRoutes(),
          fetchSchedules(),
          fetchDrivers()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchBuses, fetchRoutes, fetchSchedules, fetchDrivers]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase.channel('buses_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'buses' 
        }, () => {
          fetchBuses();
        }),
      supabase.channel('routes_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'routes' 
        }, () => {
          fetchRoutes();
        }),
      supabase.channel('schedules_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'schedules' 
        }, () => {
          fetchSchedules();
        }),
      supabase.channel('drivers_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `role=eq.driver`
        }, () => {
          fetchDrivers();
        })
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    // Cleanup subscriptions
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [user, fetchBuses, fetchDrivers, fetchRoutes, fetchSchedules]);

  const addDriver = async (driverData: any) => {
    try {
      console.log('Adding driver with data:', driverData);
      
      // 1. Create auth user and profile in a single transaction
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: driverData.email,
        password: driverData.password,
        options: {
          data: {
            name: driverData.fullName,
            phone: driverData.phoneNumber,
            role: 'driver',
            status: 'available'
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth completed successfully:', authData);

      // 2. Upload profile photo if exists
      if (driverData.profilePhoto && authData.user) {
        const fileExt = driverData.profilePhoto.name.split('.').pop();
        const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
        
        try {
          // Check if bucket exists first
          const { error: bucketCheckError } = await supabase.storage
            .getBucket('profile-photos');
            
          if (bucketCheckError && bucketCheckError.message.includes('The resource was not found')) {
            await supabase.storage.createBucket('profile-photos', {
              public: true,
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
              fileSizeLimit: 1024 * 1024 * 2 // 2MB
            });
          }
          
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(fileName, driverData.profilePhoto);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // 3. Update user profile with photo URL and status
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              profile_photo_url: fileName,
              name: driverData.fullName,
              phone: driverData.phoneNumber,
              role: 'driver',
              status: 'available'
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Update profile error:', updateError);
            throw updateError;
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Continue even if photo upload fails
          toast.warning('Driver created, but profile photo upload failed');
        }
      }

      // 4. Immediately refresh the drivers list to show the new driver
      await fetchDrivers();

      toast.success('Driver added successfully');
      return true;
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast.error(error.message || 'Failed to add driver');
      return false;
    }
  };

  const addBus = async (busData: Omit<Bus, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .insert([{
          ...busData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform the data to include all required fields
      const transformedBus: Bus = {
        ...data,
        departure_time: data.departure_time || null,
        arrival_time: data.arrival_time || null,
        next_departure: data.next_departure || null,
        stops: data.stops || null,
        bus_image: data.bus_image || null,
        driver: data.driver || null
      };

      setBuses(prev => [transformedBus, ...prev]);
      toast.success('Bus added successfully');
      return transformedBus;
    } catch (err) {
      console.error('Error adding bus:', err);
      toast.error('Failed to add bus');
      throw err;
    }
  };

  const addRoute = async (routeData: any) => {
    try {
      console.log('Starting route creation with data:', routeData);
      
      // First create the route
      const { data: routeResult, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: routeData.name,
          description: routeData.description,
          start_location: routeData.start_location,
          end_location: routeData.end_location,
          region: routeData.region,
        })
        .select();
      
      if (routeError) {
        console.error('Error creating route:', routeError);
        throw routeError;
      }
      
      console.log('Route created successfully:', routeResult);
      
      if (routeResult && routeResult.length > 0) {
        // Then create the stops for the route
        const routeId = routeResult[0].id;
        const stops = routeData.stops.map((stop: string, index: number) => ({
          route_id: routeId,
          stop_name: stop,
          stop_order: index,
        }));
        
        console.log('Creating stops:', stops);
        
        const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(stops);
        
        if (stopsError) {
          console.error('Error creating stops:', stopsError);
          throw stopsError;
        }
        
        console.log('Stops created successfully');
        
        // If a bus is assigned, update the bus with the route
        if (routeData.busId) {
          const { error: busError } = await supabase
            .from('buses')
            .update({ route: routeData.name })
            .eq('id', routeData.busId);
          
          if (busError) {
            console.error('Error updating bus:', busError);
            throw busError;
          }
        }
      }
      
      toast.success('Route added successfully');
      await fetchBuses(); // Refresh data
      await fetchRoutes(); // Also refresh routes
      return true;
    } catch (error) {
      console.error('Error in addRoute:', error);
      toast.error(`Failed to add route: ${error.message}`);
      return false;
    }
  };

  const addSchedule = async (scheduleData: any) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          bus_id: scheduleData.busId,
          route_id: scheduleData.routeId,
          departure_time: scheduleData.departureTime,
          days_of_week: scheduleData.days,
          is_active: true,
        })
        .select();
      
      if (error) throw error;
      
      toast.success('Schedule added successfully');
      fetchBuses(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
      return false;
    }
  };

  // Helper function to format time from database format to display format
  const formatTime = (time: string) => {
    if (!time) return "N/A";
    
    try {
      // Parse the time string (assuming it's in HH:MM:SS format)
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      
      // Format to 12-hour with AM/PM
      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    } catch (e) {
      return time; // In case of parsing error, return original
    }
  };

  // Helper function to calculate arrival time based on departure time and duration
  const calculateArrivalTime = (departureTime: string, durationMinutes: number) => {
    if (!departureTime) return "N/A";
    
    try {
      // Parse the time string
      const [hours, minutes] = departureTime.split(':').map(Number);
      
      // Add the duration
      let totalMinutes = hours * 60 + minutes + durationMinutes;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      
      // Format to 12-hour with AM/PM
      return `${newHours > 12 ? newHours - 12 : newHours}:${newMinutes.toString().padStart(2, '0')} ${newHours >= 12 ? 'PM' : 'AM'}`;
    } catch (e) {
      return "N/A"; // In case of parsing error
    }
  };

  // Helper function to format days of week from array to display format
  const formatDaysOfWeek = (daysArray: any[]) => {
    if (!daysArray || !Array.isArray(daysArray)) return [];
    
    const dayMap: { [key: string]: string } = {
      "0": "Sunday",
      "1": "Monday",
      "2": "Tuesday",
      "3": "Wednesday",
      "4": "Thursday",
      "5": "Friday",
      "6": "Saturday",
    };
    
    return daysArray.map(day => dayMap[day] || day);
  };

  const updateBus = async (id: string, updates: Partial<Bus>) => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to include all required fields
      const transformedBus: Bus = {
        ...data,
        departure_time: data.departure_time || null,
        arrival_time: data.arrival_time || null,
        next_departure: data.next_departure || null,
        stops: data.stops || null,
        bus_image: data.bus_image || null,
        driver: data.driver || null
      };

      setBuses(prev => prev.map(bus => bus.id === id ? transformedBus : bus));
      toast.success('Bus updated successfully');
      return transformedBus;
    } catch (err) {
      console.error('Error updating bus:', err);
      toast.error('Failed to update bus');
      throw err;
    }
  };

  const deleteBus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBuses(prev => prev.filter(bus => bus.id !== id));
      toast.success('Bus deleted successfully');
    } catch (err) {
      console.error('Error deleting bus:', err);
      toast.error('Failed to delete bus');
      throw err;
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      // First check if there are any schedules using this route
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('id')
        .eq('route_id', routeId);

      if (schedulesError) throw schedulesError;

      if (schedules && schedules.length > 0) {
        throw new Error('Cannot delete route: It is being used in existing schedules');
      }

      // Delete route stops first
      const { error: stopsError } = await supabase
        .from('route_stops')
        .delete()
        .eq('route_id', routeId);

      if (stopsError) {
        throw new Error('Failed to delete route stops');
      }

      // Delete route
      const { error: routeError } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (routeError) {
        throw new Error('Failed to delete route');
      }

      await fetchRoutes();
      return true;
    } catch (error: any) {
      console.error('Error deleting route:', error);
      throw error;
    }
  };

  return {
    buses,
    routes,
    schedules,
    drivers,
    loading,
    error,
    isLoading: loading,
    refreshData: async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBuses(),
          fetchRoutes(),
          fetchSchedules(),
          fetchDrivers()
        ]);
      } catch (error) {
        console.error('Error refreshing data:', error);
        toast.error('Failed to refresh data');
      } finally {
        setLoading(false);
      }
    },
    fetchBuses,
    fetchDrivers,
    addBus,
    updateBus,
    deleteBus,
    addRoute,
    addSchedule,
    addDriver,
    deleteRoute
  };
}
