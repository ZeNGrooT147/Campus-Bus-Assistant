import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bus, Edit2, Trash2, Plus, Users, Loader, MessageSquare, MapPin, Clock, Wrench, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import RealTimeStatus from "@/components/RealTimeStatus";
import AddBusForm from "@/components/coordinator/AddBusForm";
import AddRouteForm from "@/components/coordinator/AddRouteForm";
import AddScheduleForm from "@/components/coordinator/AddScheduleForm";
import BusCardManager from "@/components/coordinator/BusCardManager";
import { supabase } from "@/integrations/supabase/client";

const CoordinatorManageBuses = () => {
  const { 
    buses, 
    routes, 
    schedules,
    loading, 
    error,
    fetchBuses
  } = useCoordinatorBuses();
  
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'on-leave':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'available':
        return 'bg-green-500';
      case 'on-leave':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <Users className="h-4 w-4 text-gray-500" />;
      case 'available':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'on-leave':
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      return;
    }

    try {
      // First check if there are any schedules using this route
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('id')
        .eq('route_id', routeId);

      if (schedulesError) throw schedulesError;

      if (schedules && schedules.length > 0) {
        toast.error('Cannot delete route: It is being used in existing schedules');
        return;
      }

      // Check if any buses are assigned to this route
      const { data: buses, error: busesError } = await supabase
        .from('buses')
        .select('id')
        .eq('route_id', routeId);

      if (busesError) throw busesError;

      if (buses && buses.length > 0) {
        toast.error('Cannot delete route: It is assigned to one or more buses');
        return;
      }

      // Delete route stops first
      const { error: stopsError } = await supabase
        .from('route_stops')
        .delete()
        .eq('route_id', routeId);

      if (stopsError) {
        console.error('Error deleting route stops:', stopsError);
        throw new Error('Failed to delete route stops');
      }

      // Delete route
      const { error: routeError } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (routeError) {
        console.error('Error deleting route:', routeError);
        throw new Error('Failed to delete route');
      }

      toast.success('Route deleted successfully');
      fetchBuses();
    } catch (error: any) {
      console.error('Error deleting route:', error);
      toast.error(error.message || 'Failed to delete route. Please try again.');
    }
  };

  return (
    <DashboardLayout pageTitle="Manage Buses">
      <Card className="mb-6 border-t-4 border-t-primary overflow-hidden shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Bus className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">Bus Fleet Management</h2>
              <p className="text-muted-foreground">
                Manage your buses, routes, schedules, driver assignments, and timings. All changes are synchronized in real-time across the system, ensuring students have up-to-date information about bus locations, arrivals, and departures.
              </p>
              <RealTimeStatus 
                lastUpdated={new Date()}
                resourceName="Fleet management"
                onRefresh={fetchBuses}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="buses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-3xl mb-6">
          <TabsTrigger value="buses">Buses</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="buses">
          <BusCardManager />
        </TabsContent>

        <TabsContent value="routes">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Route Management</h2>
            <Button onClick={() => setRouteDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : routes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route) => (
                <Card key={route.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <CardDescription>{route.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {route.busAssigned ? 'Assigned' : 'Unassigned'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(route.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>From: {route.stops[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>To: {route.stops[route.stops.length - 1]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Stops: {route.stops.length}</span>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No routes available</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  There are no routes in the system yet. Click "Add Route" to get started.
                </p>
                <Button onClick={() => setRouteDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Route
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
                <DialogDescription>
                  Create a new route with stops and assign it to a bus.
                </DialogDescription>
              </DialogHeader>
              <AddRouteForm onSuccess={() => {
                setRouteDialogOpen(false);
                fetchBuses();
              }} />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="schedules">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Schedule Management</h2>
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{schedule.busName}</CardTitle>
                        <CardDescription>{schedule.route}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {schedule.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Departure: {schedule.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Arrival: {schedule.arrivalTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Days: {schedule.days.join(', ')}</span>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No schedules available</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  There are no schedules in the system yet. Click "Add Schedule" to get started.
                </p>
                <Button onClick={() => setScheduleDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Schedule
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Schedule</DialogTitle>
                <DialogDescription>
                  Create a new schedule for a bus on a specific route.
                </DialogDescription>
              </DialogHeader>
              <AddScheduleForm onSuccess={() => {
                setScheduleDialogOpen(false);
                fetchBuses();
              }} />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CoordinatorManageBuses;
