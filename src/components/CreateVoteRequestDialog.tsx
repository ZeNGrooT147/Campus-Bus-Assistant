import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRealVotingTopics } from "@/hooks/useRealVotingTopics";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Bus, Plus, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

interface CreateVoteRequestDialogProps {
  className?: string;
}

interface Route {
  id: string;
  name: string;
  start_location: string;
  end_location: string;
}

interface Schedule {
  id: string;
  departure_time: string;
  route_id: string;
}

interface FormData {
  routeId: string;
  scheduleId: string;
  date: Date;
  description: string;
  busId: string;
}

export function CreateVoteRequestDialog({ className }: CreateVoteRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { availableBuses, requestNewBus, isSubmitting, refreshData, error } = useRealVotingTopics();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      routeId: '',
      scheduleId: '',
      date: new Date(),
      description: '',
      busId: '',
    }
  });

  useEffect(() => {
    if (open) {
      fetchRoutes();
      refreshData();
    }
  }, [open, refreshData]);

  useEffect(() => {
    if (selectedRoute) {
      fetchSchedules(selectedRoute);
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        setRoutes(data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async (routeId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('route_id', routeId)
        .eq('is_active', true);
        
      if (error) throw error;
      
      if (data) {
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!user) {
        toast.error('You must be logged in to submit a request');
        return;
      }

      const selectedRoute = routes.find(r => r.id === data.routeId);
      const selectedSchedule = schedules.find(s => s.id === data.scheduleId);
      
      if (!selectedRoute || !selectedSchedule) {
        toast.error('Please select a valid route and schedule');
        return;
      }

      const startDate = new Date(data.date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour

      const reason = `Request for additional bus on route ${selectedRoute.name} at ${selectedSchedule.departure_time} on ${format(data.date, 'PPP')}`;
      
      const success = await requestNewBus({
        routeId: data.routeId,
        scheduleId: data.scheduleId,
        date: startDate,
        description: data.description,
        busId: data.busId,
        reason: reason,
        endDate: endDate
      });
      
      if (success) {
        form.reset();
        setOpen(false);
        toast.success('Your bus request has been submitted for voting! It will expire in 1 hour.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit your request. Please try again.');
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className={cn("gap-2", className)}
        variant="default"
      >
        <Plus className="h-4 w-4" />
        Create Vote Request
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Request Additional Bus</DialogTitle>
            <DialogDescription>
              Create a voting request for an additional bus. Other students can vote on this request.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="routeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedRoute(value);
                      }} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a route" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            <div className="flex items-center gap-2">
                              <span>{route.name}</span>
                              <span className="text-sm text-muted-foreground">
                                ({route.start_location} → {route.end_location})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the route you need the bus for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRoute && (
                <FormField
                  control={form.control}
                  name="scheduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a schedule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schedules.map((schedule) => (
                            <SelectItem key={schedule.id} value={schedule.id}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{schedule.departure_time}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the departure time for your request
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="busId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a bus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBuses.map((bus) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            <div className="flex items-center gap-2">
                              <Bus className="h-4 w-4" />
                              <span>{bus.bus_number} - {bus.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the bus you want to request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 1))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the date for your request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you need this additional bus..."
                        className="resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about your request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
