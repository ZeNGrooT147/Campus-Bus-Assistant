import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import StudentDashboardSummary from "@/components/StudentDashboardSummary";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BusCard } from "@/types/busCard";
import { Bus, Clock, Users, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [busCards, setBusCards] = useState<BusCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Format the region name properly
  const formatRegionName = (region: string | undefined) => {
    if (!region) return "Unknown Region";
    if (region.toLowerCase() === "dharwad") return "Dharwad Region";
    return region.charAt(0).toUpperCase() + region.slice(1);
  };

  const userRegion = formatRegionName(user?.region);

  // Provide minimal stats for the summary (can be expanded if needed)
  const studentStats = {
    region: userRegion,
    activeBusRequests: 0,
    announcements: 0
  };

  useEffect(() => {
    const fetchBusCards = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('buses')
          .select(`
            *,
            driver:profiles!assigned_driver(
              name,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Convert the database format to match our BusCard type
          const formattedBusCards: BusCard[] = data.map(bus => ({
            id: bus.id,
            name: bus.name,
            number: bus.bus_number,
            route: bus.route || '',
            stops: bus.stops || [],
            departureTime: bus.departure_time || '',
            arrivalTime: bus.arrival_time || '',
            capacity: bus.capacity,
            currentOccupancy: bus.current_passengers || 0,
            busImage: bus.bus_image || '',
            status: bus.status,
            driver: bus.driver ? {
              name: bus.driver.name || '',
              phone: bus.driver.phone || '',
              photo: '',
              experience: ''
            } : { name: '', phone: '', photo: '', experience: '' },
            created_at: bus.created_at,
            updated_at: bus.updated_at
          }));
          
          setBusCards(formattedBusCards);
        }
      } catch (err) {
        console.error('Error fetching bus cards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusCards();

    // Set up real-time subscription for buses
    const subscription = supabase
      .channel('buses_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'buses' 
      }, () => {
        fetchBusCards();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="animate-fade-in space-y-6">
        <StudentDashboardSummary stats={studentStats} />
        <div className="mb-6">
          {/* Removed Bus Requests Card */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
