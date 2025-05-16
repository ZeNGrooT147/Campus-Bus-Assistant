import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AddRouteFormProps {
  onSuccess: () => void;
}

const regions = [
  { value: 'dharwad', label: 'Dharwad Region' },
  { value: 'hubli', label: 'Hubli Region' }
];

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [region, setRegion] = useState('dharwad');
  const [stops, setStops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a route name');
      return;
    }
    
    if (!startLocation.trim()) {
      toast.error('Please enter a start location');
      return;
    }
    
    if (!endLocation.trim()) {
      toast.error('Please enter an end location');
      return;
    }
    
    if (startLocation === endLocation) {
      toast.error('Start and end locations cannot be the same');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: name.trim(),
          description: description.trim(),
          start_location: startLocation.trim(),
          end_location: endLocation.trim(),
          region: region
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Create stops
      const stopsData = [
        { route_id: routeData.id, stop_name: startLocation.trim(), stop_order: 0 },
        ...stops
          .filter(stop => stop.trim() !== '')
          .map((stop, index) => ({
            route_id: routeData.id,
            stop_name: stop.trim(),
            stop_order: index + 1,
          })),
        { route_id: routeData.id, stop_name: endLocation.trim(), stop_order: stops.length + 1 }
      ];

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(stopsData);

      if (stopsError) throw stopsError;

      toast.success('Route created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Route Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter route name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter route description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Region</Label>
        <Select value={region} onValueChange={setRegion} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startLocation">Start Location</Label>
        <Input
          id="startLocation"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          placeholder="Enter start location"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endLocation">End Location</Label>
        <Input
          id="endLocation"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          placeholder="Enter end location"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Intermediate Stops</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStop}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Stop
          </Button>
        </div>
        {stops.map((stop, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={stop}
              onChange={(e) => updateStop(index, e.target.value)}
              placeholder={`Stop ${index + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeStop(index)}
              className="h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Route...' : 'Create Route'}
      </Button>
    </form>
  );
};

export default AddRouteForm; 