import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bus, Edit2, Route, Plus, Loader, AlertTriangle, MapPin, Trash2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Bus {
  id: string;
  name: string;
  bus_number: string;
  capacity: number;
  status: string;
  route: string | null;
  route_id: string | null;
  current_passengers: number;
  current_location: string | null;
  bus_image: string | null;
  assigned_driver: string | null;
  driver: {
    name: string;
    experience: string;
    phone: string;
    photo: string;
  } | null;
}

interface Route {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  profile_photo_url: string | null;
  status: string | null;
}

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bus_number: '',
    capacity: 0,
    assigned_driver: '',
    status: 'active',
    route: '',
    route_id: '',
    current_passengers: 0,
    bus_image: '',
  });

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
    fetchDrivers();
  }, []);

  const fetchBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          phone,
          profile_photo_url,
          status
        `)
        .eq('role', 'driver')
        .order('name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Basic validation
      if (!formData.name || !formData.bus_number) {
        toast.error('Bus name and number are required');
        return;
      }
      
      // Insert the bus data
      const { data: busData, error: busError } = await supabase
        .from('buses')
        .insert({
          name: formData.name,
          bus_number: formData.bus_number,
          capacity: formData.capacity,
          assigned_driver: formData.assigned_driver || null,
          status: formData.status,
          route: formData.route || null,
          current_passengers: 0
        })
        .select()
        .single();
        
      if (busError) throw busError;
      
      toast.success('Bus added successfully');
      fetchBuses();
      resetForm();
    } catch (error) {
      console.error('Error adding bus:', error);
      toast.error(`Failed to add bus: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;

    setSubmitting(true);
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
          phone: selectedDriver.phone || '',
          photo: selectedDriver.profile_photo_url || ''
        } : null
      };

      console.log('Updating bus with data:', busData);

      const { data, error } = await supabase
        .from('buses')
        .update(busData)
        .eq('id', editingBus.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bus:', error);
        throw error;
      }

      console.log('Bus updated successfully:', data);
      toast.success('Bus updated successfully');
      await fetchBuses();
      resetForm();
      setEditingBus(null);
    } catch (error: any) {
      console.error('Error updating bus:', error);
      toast.error(error.message || 'Failed to update bus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      name: bus.name,
      bus_number: bus.bus_number,
      capacity: bus.capacity,
      assigned_driver: bus.assigned_driver || '',
      status: bus.status,
      route: bus.route || '',
      route_id: bus.route_id || '',
      current_passengers: bus.current_passengers || 0,
      bus_image: bus.bus_image || '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bus_number: '',
      capacity: 0,
      assigned_driver: '',
      status: 'active',
      route: '',
      route_id: '',
      current_passengers: 0,
      bus_image: '',
    });
    setEditingBus(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingBus ? 'Edit Bus' : 'Add New Bus'}</CardTitle>
          <CardDescription>
            {editingBus ? 'Update bus information' : 'Register a new bus in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingBus ? handleUpdate : handleSubmit} className="space-y-4">
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
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : editingBus ? (
                  <Edit2 className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {editingBus ? 'Update Bus' : 'Add Bus'}
              </Button>
              {editingBus && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((bus) => (
          <Card key={bus.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{bus.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(bus)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bus.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Bus #{bus.bus_number}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Capacity: {bus.capacity}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Route: {bus.route || 'Not assigned'}</span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span>Status: {bus.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
