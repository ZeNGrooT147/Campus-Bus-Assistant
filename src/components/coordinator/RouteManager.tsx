import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, X, ArrowUp, ArrowDown, Edit, Trash2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EditRouteForm from "./EditRouteForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCoordinatorBuses } from '@/hooks/useCoordinatorBuses';
import { Loader2 } from 'lucide-react';
import AddRouteForm from './AddRouteForm';

interface RouteStop {
  stop_name: string;
  stop_order: number;
}

interface RouteFromDB {
  id: string;
  name: string;
  description: string | null;
  start_location: string;
  end_location: string;
  region: string;
  created_at: string;
  updated_at: string;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
  start_location: string;
  end_location: string;
  region: string;
  stops: RouteStop[];
  created_at: string;
  updated_at: string;
}

const regions = [
  { value: 'dharwad', label: 'Dharwad Region' },
  { value: 'hubli', label: 'Hubli Region' }
];

const RouteManager = () => {
  const [selectedRegion, setSelectedRegion] = useState('dharwad');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { routes, loading, error, deleteRoute } = useCoordinatorBuses();
  const [routesData, setRoutesData] = useState<Route[]>([]);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      // Fetch routes
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('*')
        .order('name');

      if (routesError) throw routesError;
      if (!routesData) return;

      // Fetch stops for each route
      const routesWithStops = await Promise.all(
        routesData.map(async (route: any) => {
          const { data: stopsData, error: stopsError } = await supabase
            .from('route_stops')
            .select('stop_name, stop_order')
            .eq('route_id', route.id)
            .order('stop_order');

          if (stopsError) throw stopsError;

          const routeWithStops: Route = {
            id: route.id,
            name: route.name,
            description: route.description,
            start_location: route.start_location,
            end_location: route.end_location,
            region: route.region || 'dharwad',
            stops: stopsData || [],
            created_at: route.created_at,
            updated_at: route.updated_at
          };

          return routeWithStops;
        })
      );

      setRoutesData(routesWithStops);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      toast.error("Please enter a route name");
      return;
    }
    
    if (!startLocation.trim()) {
      toast.error("Please enter a start location");
      return;
    }
    
    if (!endLocation.trim()) {
      toast.error("Please enter an end location");
      return;
    }
    
    if (startLocation === endLocation) {
      toast.error("Start and end locations cannot be the same");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create route
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: name.trim(),
          description: description.trim(),
          start_location: startLocation.trim(),
          end_location: endLocation.trim(),
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create stops
      const stopsData = stops
        .filter(stop => stop.trim() !== '')
        .map((stop, index) => ({
          route_id: routeData.id,
          stop_name: stop.trim(),
          stop_order: index,
        }));

      if (stopsData.length > 0) {
        const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(stopsData);

        if (stopsError) throw stopsError;
      }

      toast.success('Route created successfully');
      resetForm();
      fetchRoutes();
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await deleteRoute(routeId);
        toast.success('Route deleted successfully');
      } catch (error) {
        console.error('Error deleting route:', error);
        toast.error('Failed to delete route');
      }
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartLocation("");
    setEndLocation("");
    setStops([]);
    setIsAddingRoute(false);
  };

  const addStop = () => {
    setStops([...stops, '']);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const filteredRoutes = routesData.filter(route => route.region === selectedRegion);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Error loading routes: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Route Management</h2>
        <div className="flex gap-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
              </DialogHeader>
              <AddRouteForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRoutes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No routes found for the selected region.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{route.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {route.region.charAt(0).toUpperCase() + route.region.slice(1)} Region
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Start:</span> {route.start_location}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">End:</span> {route.end_location}
                  </div>
                  {route.stops.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Stops:</span>
                      <ul className="list-disc list-inside mt-1">
                        {route.stops.map((stop, index) => (
                          <li key={index}>{stop.stop_name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {route.description && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">Description:</span>
                      <p className="mt-1">{route.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteManager; 