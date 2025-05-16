import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditRouteFormProps {
  routeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditRouteForm = ({ routeId, onSuccess, onCancel }: EditRouteFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRouteData();
  }, [routeId]);

  const fetchRouteData = async () => {
    try {
      setIsLoading(true);
      // Fetch route details
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;

      // Fetch route stops
      const { data: stopsData, error: stopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order');

      if (stopsError) throw stopsError;

      // Set form data
      setName(routeData.name);
      setDescription(routeData.description || '');
      setStartLocation(routeData.start_location);
      setEndLocation(routeData.end_location);
      setStops(stopsData.map(stop => stop.stop_name));
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast.error('Failed to load route data');
    } finally {
      setIsLoading(false);
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
      // Update route details
      const { error: routeError } = await supabase
        .from('routes')
        .update({
          name: name.trim(),
          description: description.trim(),
          start_location: startLocation.trim(),
          end_location: endLocation.trim(),
        })
        .eq('id', routeId);

      if (routeError) throw routeError;

      // Delete existing stops
      const { error: deleteError } = await supabase
        .from('route_stops')
        .delete()
        .eq('route_id', routeId);

      if (deleteError) throw deleteError;

      // Create new stops
      const stopsData = stops
        .filter(stop => stop.trim() !== '')
        .map((stop, index) => ({
          route_id: routeId,
          stop_name: stop.trim(),
          stop_order: index,
        }));

      if (stopsData.length > 0) {
        const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(stopsData);

        if (stopsError) throw stopsError;
      }

      toast.success('Route updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Route Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter route name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter route description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Start Location</label>
        <Input
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          placeholder="Enter start location"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">End Location</label>
        <Input
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          placeholder="Enter end location"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stops</label>
        <div className="space-y-2">
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
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addStop}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stop
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Route'}
        </Button>
      </div>
    </form>
  );
};

export default EditRouteForm; 