import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Plus } from 'lucide-react';
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";

interface AddBusFormProps {
  onSuccess?: () => void;
}

const AddBusForm = ({ onSuccess }: AddBusFormProps) => {
  const { drivers, addBus } = useCoordinatorBuses();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !number || !capacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (loading) return; // Prevent double submission
    setLoading(true);
    
    try {
      const selectedDriverData = drivers.find(d => d.id === selectedDriver);
      
      const busData = {
        name,
        bus_number: number,
        capacity: parseInt(capacity),
        status: 'active',
        assigned_driver: selectedDriver || null,
        route: null,
        route_id: null,
        current_location: null,
        current_passengers: 0,
        bus_image: null,
        driver: selectedDriver ? {
          name: selectedDriverData?.name || '',
          experience: '5 years',
          phone: selectedDriverData?.contact || '',
          photo: selectedDriverData?.profile_photo_url || ''
        } : null,
        stops: null,
        departure_time: null,
        arrival_time: null,
        next_departure: null
      };

      await addBus(busData);
      toast.success("Bus added successfully");
      setName("");
      setNumber("");
      setCapacity("");
      setSelectedDriver("");
      onSuccess?.();
    } catch (error) {
      console.error("Error adding bus:", error);
      toast.error("Failed to add bus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          Add New Bus
        </CardTitle>
        <CardDescription>
          Add a new bus to your fleet with custom details
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bus Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter bus name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Bus Number</Label>
          <Input
            id="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter bus number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Enter bus capacity"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Assign Driver</Label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger>
              <SelectValue placeholder="Select a driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Adding Bus...</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bus
            </span>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default AddBusForm;
