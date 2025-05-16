
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Bus, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleItem {
  id: string;
  busName: string;
  busNumber: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  stops: string[];
  students: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

// Mock schedule data
const todaySchedule: ScheduleItem[] = [
  {
    id: "trip1",
    busName: "Varada Express",
    busNumber: "KA-01-F-1234",
    route: "Campus to Hubli Central",
    departureTime: "5:15 PM",
    arrivalTime: "6:00 PM",
    stops: ["College Campus", "Vidyanagar", "Keshwapur", "Hubli Central"],
    students: 35,
    status: "scheduled"
  },
  {
    id: "trip2",
    busName: "Varada Express",
    busNumber: "KA-01-F-1234",
    route: "Hubli Central to Campus",
    departureTime: "8:15 AM",
    arrivalTime: "9:00 AM",
    stops: ["Hubli Central", "Keshwapur", "Vidyanagar", "College Campus"],
    students: 42,
    status: "completed"
  }
];

const upcomingSchedule: ScheduleItem[] = [
  {
    id: "trip3",
    busName: "Varada Express",
    busNumber: "KA-01-F-1234",
    route: "Campus to Hubli Central",
    departureTime: "5:15 PM",
    arrivalTime: "6:00 PM",
    stops: ["College Campus", "Vidyanagar", "Keshwapur", "Hubli Central"],
    students: 0,
    status: "scheduled",
  },
  {
    id: "trip4",
    busName: "Varada Express",
    busNumber: "KA-01-F-1234",
    route: "Hubli Central to Campus",
    departureTime: "8:15 AM",
    arrivalTime: "9:00 AM",
    stops: ["Hubli Central", "Keshwapur", "Vidyanagar", "College Campus"],
    students: 0,
    status: "scheduled"
  }
];

const DriverSchedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <Badge variant="outline" className="ml-2">Scheduled</Badge>;
      case 'in-progress':
        return <Badge className="ml-2 bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="ml-2">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="ml-2">Cancelled</Badge>;
      default:
        return null;
    }
  };
  
  const startTrip = (tripId: string) => {
    toast.success("Trip started successfully");
    // In a real app, you would update the trip status via API
  };
  
  const reportIssue = (tripId: string) => {
    toast.info("Issue reported to coordinator");
    // In a real app, you would send the report via API
  };

  return (
    <DashboardLayout pageTitle="My Schedule">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your assigned bus trips for today</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {todaySchedule.length > 0 ? (
              <div className="divide-y">
                {todaySchedule.map((trip) => (
                  <div key={trip.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg flex items-center">
                          {trip.route}
                          {renderStatusBadge(trip.status)}
                        </h3>
                        <p className="text-muted-foreground text-sm flex items-center mt-1">
                          <Bus className="h-4 w-4 mr-1" />
                          {trip.busName} ({trip.busNumber})
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-sm font-medium">Time</p>
                          <p className="text-sm text-muted-foreground">
                            {trip.departureTime} - {trip.arrivalTime}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-sm font-medium">Students</p>
                          <p className="text-sm text-muted-foreground">
                            {trip.students} expected
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Stops
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {trip.stops.map((stop, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <Badge variant="outline" className="font-normal">
                              {stop}
                            </Badge>
                            {index < trip.stops.length - 1 && (
                              <span className="mx-1">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {trip.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => startTrip(trip.id)}>
                          Start Trip
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reportIssue(trip.id)}>
                          Report Issue
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="rounded-full bg-primary/10 p-3 mx-auto w-fit mb-3">
                  <Bus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No trips scheduled</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  You don't have any trips scheduled for today.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View your schedule by date</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border mx-auto"
            />
          </CardContent>
          <CardFooter className="flex justify-center pt-0">
            <div className="text-sm text-center mt-2">
              {date && (
                <p>
                  <span className="font-medium">{format(date, 'MMMM d, yyyy')}</span>: {' '}
                  <span className="text-muted-foreground">
                    {date.toDateString() === new Date().toDateString() 
                      ? `${todaySchedule.length} trips` 
                      : "No trips"}
                  </span>
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Trips</TabsTrigger>
            <TabsTrigger value="special">Special Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Upcoming Schedule
                </CardTitle>
                <CardDescription>Your trips for tomorrow and beyond</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSchedule.length > 0 ? (
                  <div className="divide-y">
                    {upcomingSchedule.map((trip) => (
                      <div key={trip.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{trip.route}</h3>
                          <Badge variant="outline">Tomorrow</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center">
                          <Bus className="h-4 w-4 mr-1" />
                          {trip.busName} ({trip.busNumber})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {trip.departureTime} - {trip.arrivalTime}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No upcoming trips</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      You don't have any upcoming trips scheduled.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Past Trips
                </CardTitle>
                <CardDescription>Your completed trips from the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-6 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium">Trip history coming soon</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    We're working on implementing trip history tracking.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Special Requests
                </CardTitle>
                <CardDescription>Additional bus requests from students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Student Vote in Progress
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Students are currently voting for an additional bus to Dharwad at 6:30 PM.
                          Current votes: 18/25.
                        </p>
                      </div>
                      <div className="mt-3">
                        <div className="-mx-2 -my-1.5 flex gap-2">
                          <Button variant="outline" size="sm" className="bg-white">
                            View Details
                          </Button>
                          <Button variant="default" size="sm">
                            I'm Available
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    When students request additional buses, they will appear here for you to accept.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DriverSchedule;
