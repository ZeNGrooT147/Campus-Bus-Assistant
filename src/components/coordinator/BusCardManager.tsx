import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bus, Clock, Users, Image as ImageIcon, Plus, Save, X, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

interface BusCardManagerProps {
  onSave?: (busData: any) => void;
}

interface Driver {
  id: string;
  name: string;
  contact?: string;
  status: string;
  assigned_bus?: string;
  avatar_url?: string;
}

export default function BusCardManager({ onSave }: BusCardManagerProps) {
  const { buses, routes, drivers, loading, error, fetchBuses, updateBus } = useCoordinatorBuses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    bus_number: '',
    capacity: 45,
    status: 'active',
    route_id: '',
    current_passengers: 0,
    bus_image: '',
    assigned_driver: ''
  });

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedRoute = routes.find(r => r.id === formData.route_id);
      const selectedDriver = drivers.find(d => d.id === formData.assigned_driver);

      const busData = {
        name: formData.name,
        bus_number: formData.bus_number,
        capacity: formData.capacity,
        status: formData.status,
        route: selectedRoute?.name || null,
        route_id: formData.route_id || null,
        current_passengers: formData.current_passengers || 0,
        current_location: null,
        bus_image: formData.bus_image || null,
        assigned_driver: formData.assigned_driver || null,
        driver: selectedDriver ? {
          name: selectedDriver.name,
          experience: '5 years',
          phone: selectedDriver.contact || '',
          photo: selectedDriver.avatar_url || ''
        } : null
      };

      console.log('Submitting bus data:', busData);

      if (selectedBus) {
        // Update existing bus
        await updateBus(selectedBus.id, busData);
        console.log('Bus updated successfully');
        toast.success('Bus updated successfully');
      } else {
        // Add new bus
        const { data, error: insertError } = await supabase
          .from('buses')
          .insert([busData])
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting bus:', insertError);
          throw insertError;
        }

        console.log('Bus added successfully:', data);
        toast.success('Bus added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchBuses(); // Make sure to await the fetch
      if (onSave) onSave(busData);
    } catch (error: any) {
      console.error('Error saving bus:', error);
      toast.error(error.message || 'Failed to save bus');
    }
  };

  const handleEdit = (bus: any) => {
    setSelectedBus(bus);
    setFormData({
      name: bus.name,
      bus_number: bus.bus_number,
      capacity: bus.capacity,
      status: bus.status,
      route_id: bus.route_id || '',
      current_passengers: bus.current_passengers || 0,
      bus_image: bus.bus_image || '',
      assigned_driver: bus.assigned_driver || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (busId: string) => {
    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', busId);

      if (error) throw error;
      toast.success('Bus deleted successfully');
      fetchBuses();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus');
    }
  };

  const resetForm = () => {
    setSelectedBus(null);
    setFormData({
      name: '',
      bus_number: '',
      capacity: 45,
      status: 'active',
      route_id: '',
      current_passengers: 0,
      bus_image: '',
      assigned_driver: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading buses: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bus Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Bus
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((bus) => (
          <Card key={bus.id} className="overflow-hidden">
            <div className="h-48 w-full overflow-hidden bg-gray-100">
              <img 
                src={bus.bus_image || "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=500"} 
                alt={bus.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader className="bg-primary/5 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Bus className="h-5 w-5 mr-2 text-primary" />
                    {bus.name}
                  </CardTitle>
                  <CardDescription className="font-mono">{bus.bus_number}</CardDescription>
                </div>
                <Badge variant={bus.status === "active" ? "outline" : "destructive"} className="capitalize">
                  {bus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {bus.current_passengers || 0}/{bus.capacity} seats
                    </p>
                  </div>
                </div>
                
                {bus.driver && (
                  <div className="flex items-start">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Driver</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Avatar className="h-8 w-8">
                          <img src={bus.driver.photo} alt={bus.driver.name} />
                        </Avatar>
                        <div>
                          <p className="text-sm">{bus.driver.name}</p>
                          <p className="text-xs text-muted-foreground">{bus.driver.experience} experience</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <Bus className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Route</p>
                    <p className="text-sm text-muted-foreground">
                      {bus.route || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(bus)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(bus.id)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
            <DialogDescription>
              {selectedBus ? 'Update bus information' : 'Enter the details of the new bus'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bus Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter bus name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bus_number">Bus Number</Label>
                <Input
                  id="bus_number"
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  placeholder="Enter bus number"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  placeholder="Enter bus capacity"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <Select
                value={formData.route_id}
                onValueChange={(value) => setFormData({ ...formData, route_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={formData.assigned_driver}
                onValueChange={(value) => setFormData({ ...formData, assigned_driver: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus_image">Bus Image URL</Label>
              <Input
                id="bus_image"
                value={formData.bus_image}
                onChange={(e) => setFormData({ ...formData, bus_image: e.target.value })}
                placeholder="Enter bus image URL"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedBus ? 'Update Bus' : 'Add Bus'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

