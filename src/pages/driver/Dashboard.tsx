import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, Clock, MapPin, Users, AlertTriangle, Bell, ThumbsUp, 
  CheckCircle2, Menu, Fuel, Phone, ChevronRight, Calendar,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useAssignedBuses } from '@/hooks/useAssignedBuses';
import { useEmergencyAlerts } from '@/hooks/useEmergencyAlerts';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BusAssignment {
  id: string;
  busNumber: string;
  busName: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'en-route' | 'completed' | 'cancelled';
  stops: {
    name: string;
    time: string;
    completed: boolean;
  }[];
}

interface VoteRequest {
  id: string;
  votes: number;
  requiredVotes: number;
  studentCount: number;
  destination: string;
  time: string;
  responded: boolean;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'normal' | 'important' | 'critical';
  target_role: string | null;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_read: boolean;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const { buses, isLoading: busesLoading } = useAssignedBuses();
  const { alerts: emergencyAlerts, isLoading: alertsLoading } = useEmergencyAlerts();
  
  const [todayAssignment, setTodayAssignment] = useState<BusAssignment>({
    id: 'assignment1',
    busNumber: 'KA-25-B-1234',
    busName: 'Varada Express',
    route: 'Campus → Hubli Central → Railway Station',
    departureTime: '4:30 PM',
    arrivalTime: '6:30 PM',
    status: 'scheduled',
    stops: [
      { name: 'Campus Main Gate', time: '4:30 PM', completed: false },
      { name: 'Hubli Market', time: '5:00 PM', completed: false },
      { name: 'Hubli Central', time: '5:30 PM', completed: false },
      { name: 'Railway Station', time: '6:00 PM', completed: false }
    ]
  });
  
  const [voteRequests, setVoteRequests] = useState<VoteRequest[]>([
    {
      id: 'vote1',
      votes: 18,
      requiredVotes: 25,
      studentCount: 22,
      destination: 'Dharwad Bus Stand',
      time: '7:30 PM',
      responded: false
    }
  ]);
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Update assigned bus information based on Supabase data
  useEffect(() => {
    if (!busesLoading && buses.length > 0) {
      // Find the bus assigned to this driver
      const assignedBus = buses.find(bus => 
        bus.driver?.id === user?.id
      );
      
      if (assignedBus) {
        setTodayAssignment(prev => ({
          ...prev,
          busNumber: assignedBus.bus_number,
          busName: assignedBus.name,
          route: assignedBus.route || prev.route
        }));
      }
    }
  }, [buses, busesLoading, user]);
  
  // Update emergency alerts based on Supabase data
  useEffect(() => {
    if (!alertsLoading && emergencyAlerts.length > 0) {
      setAlerts(emergencyAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        target_role: alert.target_role,
        created_at: alert.created_at,
        created_by: alert.created_by,
        expires_at: alert.expires_at,
        is_read: alert.is_read
      })));
    }
  }, [emergencyAlerts, alertsLoading]);
  
  const startTrip = () => {
    setTodayAssignment({
      ...todayAssignment,
      status: 'en-route'
    });
    
    toast.success('Trip started! Drive safely.', {
      duration: 3000
    });
  };
  
  const completeStop = (stopIndex: number) => {
    const updatedStops = [...todayAssignment.stops];
    updatedStops[stopIndex].completed = true;
    
    setTodayAssignment({
      ...todayAssignment,
      stops: updatedStops
    });
    
    toast.success(`Arrived at ${updatedStops[stopIndex].name}`, {
      duration: 3000
    });
    
    // If all stops are completed
    if (updatedStops.every(stop => stop.completed)) {
      setTodayAssignment({
        ...todayAssignment,
        status: 'completed',
        stops: updatedStops
      });
      
      toast.success('Trip completed! Thank you for your service.', {
        duration: 5000
      });
    }
  };
  
  const acknowledgeAlert = (alertId: string) => {
    // Update local state
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_read: true } 
        : alert
    ));
    
    // Update in database
    supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update alert status:', error);
          toast.error('Failed to acknowledge alert');
        } else {
          toast.success('Alert acknowledged. Coordinator has been notified.');
        }
      });
  };
  
  const resolveAlert = (alertId: string) => {
    // Update local state
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, is_read: true } 
        : alert
    ));
    
    // Update in database
    supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to resolve alert:', error);
          toast.error('Failed to resolve alert');
        } else {
          toast.success('Alert marked as resolved.');
        }
      });
  };
  
  const respondToVoteRequest = (voteId: string, available: boolean) => {
    setVoteRequests(voteRequests.map(vote => 
      vote.id === voteId 
        ? { ...vote, responded: true } 
        : vote
    ));
    
    if (available) {
      toast.success('You have confirmed availability. The coordinator will assign you shortly.', {
        duration: 5000
      });
    } else {
      toast.info('Response recorded. Another driver will be assigned.', {
        duration: 3000
      });
    }
  };
  
  return (
    <DashboardLayout pageTitle="Driver Dashboard">
      {/* Today's Assignment */}
      <section className="mb-8">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-0 shadow-subtle">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Bus className="h-6 w-6 text-green-600" />
                  Today's Bus Assignment
                </h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="bg-white/50 text-green-700 border-green-200">
                    {todayAssignment.busName}
                  </Badge>
                  <Badge variant="outline" className="bg-white/50 text-green-700 border-green-200">
                    {todayAssignment.busNumber}
                  </Badge>
                  <Badge variant={
                    todayAssignment.status === 'scheduled' ? 'outline' :
                    todayAssignment.status === 'en-route' ? 'secondary' :
                    todayAssignment.status === 'completed' ? 'default' : 'destructive'
                  } className="capitalize">
                    {todayAssignment.status}
                  </Badge>
                </div>
                <p className="text-green-700/80 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {todayAssignment.route}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>Departure: {todayAssignment.departureTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>Arrival: {todayAssignment.arrivalTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {todayAssignment.status === 'scheduled' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={startTrip}
                  >
                    Start Trip
                  </Button>
                )}
                <Link to="/driver/schedule">
                  <Button variant="outline" className="border-green-200 bg-white/50 hover:bg-white text-green-700">
                    <Calendar className="h-4 w-4 mr-1" />
                    View Schedule
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Route Progress */}
      {todayAssignment.status === 'en-route' && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Progress
          </h2>
          
          <Card className="shadow-subtle">
            <CardContent className="p-6 space-y-6">
              {/* Progress indicator */}
              <div className="relative">
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
                
                {todayAssignment.stops.map((stop, index) => (
                  <div key={index} className="relative z-10 flex items-start mb-6 last:mb-0">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 z-10 mt-0.5 ${
                      stop.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {stop.completed && (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="ml-4 flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${stop.completed ? 'text-green-600' : ''}`}>
                          {stop.name}
                        </h3>
                        <span className="text-sm text-muted-foreground">{stop.time}</span>
                      </div>
                      
                      {!stop.completed && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mt-2"
                          onClick={() => completeStop(index)}
                          disabled={index > 0 && !todayAssignment.stops[index - 1].completed}
                        >
                          Mark as Arrived
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Overall progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Trip Progress</span>
                  <span>
                    {todayAssignment.stops.filter(s => s.completed).length}/{todayAssignment.stops.length} stops
                  </span>
                </div>
                <Progress 
                  value={
                    (todayAssignment.stops.filter(s => s.completed).length / 
                    todayAssignment.stops.length) * 100
                  } 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}
      
      {/* Alerts and Notifications */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Notifications
          </h2>
          <Link to="/driver/alerts">
            <Button variant="outline" size="sm" className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {alerts.length === 0 ? (
          <Card className="shadow-subtle">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No alerts or notifications at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`shadow-subtle overflow-hidden ${
                  !alert.is_read ? 'border-l-4 border-l-amber-500' : ''
                } ${
                  alert.severity === 'critical' ? 'bg-red-50' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : alert.severity === 'important' ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Bell className="h-5 w-5 text-blue-500" />
                        )}
                        
                        <h3 className="font-semibold">
                          {alert.title}
                        </h3>
                        
                        <Badge 
                          variant={
                            !alert.is_read ? 'outline' :
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'important' ? 'secondary' : 'default'
                          }
                          className="capitalize"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-3">{alert.message}</p>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!alert.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      
                      {!alert.is_read && alert.severity === 'critical' && (
                        <Button 
                          size="sm" 
                          variant="default"
                        >
                          Contact Coordinator
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Vote Requests */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ThumbsUp className="h-5 w-5" />
          Vote Requests
        </h2>
        
        {voteRequests.length === 0 ? (
          <Card className="shadow-subtle">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No active vote requests at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voteRequests.map((vote) => (
              <Card key={vote.id} className="shadow-subtle">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      Bus Request: {vote.destination}
                    </CardTitle>
                    <Badge variant="outline">
                      {vote.time}
                    </Badge>
                  </div>
                  <CardDescription>
                    {vote.studentCount} students waiting
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Votes: {vote.votes}/{vote.requiredVotes}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((vote.votes / vote.requiredVotes) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(vote.votes / vote.requiredVotes) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  {!vote.responded ? (
                    <div className="flex w-full gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => respondToVoteRequest(vote.id, false)}
                      >
                        Not Available
                      </Button>
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => respondToVoteRequest(vote.id, true)}
                      >
                        I'm Available
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full text-center text-muted-foreground text-sm">
                      Response submitted. Coordinator will follow up.
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/driver/schedule">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 justify-start flex-col items-start gap-2 shadow-subtle hover-lift"
            >
              <Calendar className="h-5 w-5 text-indigo-500" />
              <div className="text-left">
                <div className="font-medium">Weekly Schedule</div>
                <div className="text-xs text-muted-foreground">View upcoming assignments</div>
              </div>
            </Button>
          </Link>
          
          <Link to="/driver/alerts">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 justify-start flex-col items-start gap-2 shadow-subtle hover-lift"
            >
              <Bell className="h-5 w-5 text-amber-500" />
              <div className="text-left">
                <div className="font-medium">Alerts</div>
                <div className="text-xs text-muted-foreground">View all notifications</div>
              </div>
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 justify-start flex-col items-start gap-2 shadow-subtle hover-lift"
          >
            <Fuel className="h-5 w-5 text-red-500" />
            <div className="text-left">
              <div className="font-medium">Report Issue</div>
              <div className="text-xs text-muted-foreground">Maintenance or fueling</div>
            </div>
          </Button>
          
          <Link to="/driver/profile">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 justify-start flex-col items-start gap-2 shadow-subtle hover-lift"
            >
              <User className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">My Profile</div>
                <div className="text-xs text-muted-foreground">Update personal information</div>
              </div>
            </Button>
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DriverDashboard;
