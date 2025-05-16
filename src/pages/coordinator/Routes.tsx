import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Edit2, Trash2, Clock, Loader } from "lucide-react";
import { toast } from "sonner";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import RealTimeStatus from "@/components/RealTimeStatus";
import AddRouteForm from "@/components/coordinator/AddRouteForm";

const CoordinatorRoutes = () => {
  const { routes, loading, addRoute } = useCoordinatorBuses();
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Since we don't have a direct refresh function, we'll just wait a bit
    // and let the component re-render with the latest data
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <DashboardLayout pageTitle="Route Management">
      <Card className="mb-6 border-t-4 border-t-primary overflow-hidden shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">Route Management</h2>
              <p className="text-muted-foreground">
                Create and manage bus routes, including stops and schedules.
              </p>
              <RealTimeStatus 
                lastUpdated={new Date()}
                resourceName="Route data"
                onRefresh={handleRefresh}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">All Routes</h2>
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
                  <Badge variant="outline">
                    {route.busAssigned ? 'Assigned' : 'Unassigned'}
                  </Badge>
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
            // The route will be automatically refreshed by the hook
          }} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CoordinatorRoutes; 