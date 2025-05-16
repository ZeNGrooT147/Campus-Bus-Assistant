
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Route, User, Phone } from 'lucide-react';
import { useAssignedBuses, AssignedBus } from '@/hooks/useAssignedBuses';
import { Skeleton } from '@/components/ui/skeleton';
import RealTimeStatus from './RealTimeStatus';

interface AssignedBusesDisplayProps {
  compact?: boolean;
  limit?: number;
}

const AssignedBusesDisplay = ({ compact = false, limit }: AssignedBusesDisplayProps) => {
  const { buses, isLoading, lastUpdated, refetchBuses } = useAssignedBuses();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  
  // Limit the number of buses to display if requested
  const displayBuses = limit ? buses.slice(0, limit) : buses;

  // Effect to handle highlighting newly updated buses
  useEffect(() => {
    const handleRealtimeUpdate = (e: Event) => {
      // In a real app, this would have more specific logic to determine 
      // which exact bus was updated based on data in the event
      const realtimeEvent = e as CustomEvent;
      if (realtimeEvent.detail?.busId) {
        setHighlighted(realtimeEvent.detail.busId);
        setTimeout(() => setHighlighted(null), 3000);
      }
    };
    
    window.addEventListener('realtime-data-updated', handleRealtimeUpdate);
    
    return () => {
      window.removeEventListener('realtime-data-updated', handleRealtimeUpdate);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!buses.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Campus Buses</CardTitle>
          <CardDescription>No buses available at the moment</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-4">
            No bus information is currently available. Check back later or contact transportation services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Campus Buses</CardTitle>
            <CardDescription>{buses.length} buses available</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live Data
          </Badge>
        </div>
        <RealTimeStatus 
          lastUpdated={lastUpdated}
          resourceName="Bus information"
          onRefresh={refetchBuses}
          className="mt-1"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayBuses.map((bus) => (
            <div 
              key={bus.id} 
              className={cn(
                "border rounded-lg p-4 transition-all",
                highlighted === bus.id ? "bg-blue-50 border-blue-200 shadow-md" : "hover:shadow-md"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-medium">{bus.name}</h3>
                </div>
                <Badge variant={
                  bus.status === 'active' ? 'default' : 
                  bus.status === 'maintenance' ? 'secondary' : 'outline'
                }>
                  {bus.status}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                Bus Number: {bus.bus_number}
              </div>
              
              {bus.route && (
                <div className="flex items-center gap-1 text-sm mb-2">
                  <Route className="w-4 h-4 text-muted-foreground" />
                  <span>{bus.route}</span>
                </div>
              )}
              
              {!compact && bus.driver && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium mb-1">Driver Information:</p>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{bus.driver.name}</span>
                  </div>
                  {bus.driver.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{bus.driver.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to conditionally join class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default AssignedBusesDisplay;
