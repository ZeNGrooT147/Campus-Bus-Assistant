import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import { Loader } from "lucide-react";
import { toast } from "sonner";

interface AddScheduleFormProps {
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const AddScheduleForm = ({ onSuccess }: AddScheduleFormProps) => {
  const { buses, routes, addSchedule, loading } = useCoordinatorBuses();
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBus) {
      toast.error("Please select a bus");
      return;
    }

    if (!selectedRoute) {
      toast.error("Please select a route");
      return;
    }

    if (!departureTime) {
      toast.error("Please set a departure time");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day of operation");
      return;
    }

    try {
      setIsSubmitting(true);
      const scheduleData = {
        busId: selectedBus,
        routeId: selectedRoute,
        departureTime,
        days: selectedDays,
      };

      const success = await addSchedule(scheduleData);
      if (success) {
        toast.success("Schedule created successfully");
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error("Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bus">Select Bus</Label>
        <Select value={selectedBus} onValueChange={setSelectedBus}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bus" />
          </SelectTrigger>
          <SelectContent>
            {buses.map((bus) => (
              <SelectItem key={bus.id} value={bus.id}>
                {bus.bus_number} - {bus.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="route">Select Route</Label>
        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
          <SelectTrigger>
            <SelectValue placeholder="Select a route" />
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
        <Label htmlFor="departureTime">Departure Time</Label>
        <Input
          id="departureTime"
          type="time"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Days of Operation</Label>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <Button
              key={day}
              type="button"
              variant={selectedDays.includes(day) ? "default" : "outline"}
              onClick={() => toggleDay(day)}
              className="w-full"
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || loading}
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Creating Schedule...
          </>
        ) : (
          "Create Schedule"
        )}
      </Button>
    </form>
  );
};

export default AddScheduleForm; 