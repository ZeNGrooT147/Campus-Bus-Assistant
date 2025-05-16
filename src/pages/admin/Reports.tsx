import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExportToExcel from "@/components/admin/ExportToExcel";

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState("usage");
  const [date, setDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
  const [isLoading, setIsLoading] = useState(false);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);
  const [busUtilizationData, setBusUtilizationData] = useState<any[]>([]);
  
  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]);
  
  const fetchReportData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === "usage") {
        // Fetch bus usage data
        const { data, error } = await supabase
          .from('bus_trips')
          .select(`
            id, 
            start_time, 
            end_time, 
            status, 
            cancellation_reason,
            schedules!inner(
              departure_time, 
              buses!inner(name, bus_number)
            ),
            profiles!inner(name)
          `)
          .gte('start_time', startDate ? startDate.toISOString() : '')
          .lte('start_time', endDate ? endDate.toISOString() : '')
          .order('start_time', { ascending: false });
          
        if (error) throw error;
        
        const formattedData = data?.map(trip => {
          // Handle nested objects properly with type assertions
          const schedules = trip.schedules as any;
          const buses = schedules?.buses as any;
          const profiles = trip.profiles as any;
          
          return {
            tripId: trip.id,
            busName: buses?.name,
            busNumber: buses?.bus_number,
            driverName: profiles?.name,
            startTime: format(new Date(trip.start_time), 'MMM dd, yyyy HH:mm'),
            endTime: trip.end_time ? format(new Date(trip.end_time), 'MMM dd, yyyy HH:mm') : 'In progress',
            duration: trip.end_time ? 
              formatDuration(new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime()) : 
              'In progress',
            status: trip.status,
            cancellationReason: trip.cancellation_reason || 'N/A'
          };
        });
        
        setUsageData(formattedData || []);
        
      } else if (activeTab === "complaints") {
        // Fetch complaints data
        const { data, error } = await supabase
          .from('complaints')
          .select(`
            id, 
            created_at,
            complaint_type,
            description,
            status,
            resolved_at,
            coordinator_notes,
            profiles!student_id(name),
            buses(name, bus_number)
          `)
          .gte('created_at', startDate ? startDate.toISOString() : '')
          .lte('created_at', endDate ? endDate.toISOString() : '')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const formattedData = data?.map(complaint => ({
          complaintId: complaint.id,
          studentName: complaint.profiles?.name || 'Unknown',
          busName: complaint.buses?.name || 'N/A',
          busNumber: complaint.buses?.bus_number || 'N/A',
          complaintType: complaint.complaint_type,
          description: complaint.description,
          submittedOn: format(new Date(complaint.created_at), 'MMM dd, yyyy HH:mm'),
          status: complaint.status,
          resolvedOn: complaint.resolved_at ? format(new Date(complaint.resolved_at), 'MMM dd, yyyy HH:mm') : 'N/A',
          notes: complaint.coordinator_notes || 'No notes'
        }));
        
        setComplaintsData(formattedData || []);
        
      } else if (activeTab === "utilization") {
        // Fetch bus utilization data
        const { data: busesData, error: busesError } = await supabase
          .from('buses')
          .select(`
            id,
            name,
            bus_number,
            capacity,
            bus_trips(status, start_time),
            profiles(name)
          `);
          
        if (busesError) throw busesError;
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
        
        const busUtilization = busesData?.map(bus => {
          const completedTrips = bus.bus_trips.filter(trip => 
            trip.status === 'completed' && 
            new Date(trip.start_time) >= thirtyDaysAgo
          ).length;
          
          const cancelledTrips = bus.bus_trips.filter(trip => 
            trip.status === 'cancelled' &&
            new Date(trip.start_time) >= thirtyDaysAgo
          ).length;
          
          const totalTrips = bus.bus_trips.filter(trip => 
            new Date(trip.start_time) >= thirtyDaysAgo
          ).length;
          
          const utilizationRate = totalTrips > 0 ? 
            ((completedTrips / totalTrips) * 100).toFixed(1) : 
            '0';
          
          return {
            busId: bus.id,
            busName: bus.name,
            busNumber: bus.bus_number,
            capacity: bus.capacity,
            driverName: bus.profiles?.name || 'Unassigned',
            totalTrips,
            completedTrips,
            cancelledTrips,
            utilizationRate: `${utilizationRate}%`
          };
        });
        
        setBusUtilizationData(busUtilization || []);
      }
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Generate and export system reports</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <ExportToExcel 
              data={
                activeTab === "usage" ? usageData :
                activeTab === "complaints" ? complaintsData :
                busUtilizationData
              }
              filename={`campus-bus-${activeTab}-report`}
              sheetName={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="usage">Bus Usage</TabsTrigger>
            <TabsTrigger value="complaints">Complaint Reports</TabsTrigger>
            <TabsTrigger value="utilization">Bus Utilization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bus Usage Report</CardTitle>
                <CardDescription>
                  Report showing all bus trips from {startDate ? format(startDate, "MMM dd, yyyy") : "start"} to {endDate ? format(endDate, "MMM dd, yyyy") : "now"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bus</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageData.length > 0 ? (
                          usageData.map((trip) => (
                            <TableRow key={trip.tripId}>
                              <TableCell>
                                <div className="font-medium">{trip.busName}</div>
                                <div className="text-xs text-muted-foreground">{trip.busNumber}</div>
                              </TableCell>
                              <TableCell>{trip.driverName}</TableCell>
                              <TableCell>{trip.startTime}</TableCell>
                              <TableCell>{trip.endTime}</TableCell>
                              <TableCell>{trip.duration}</TableCell>
                              <TableCell>
                                {trip.status === 'completed' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
                                )}
                                {trip.status === 'in_progress' && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>
                                )}
                                {trip.status === 'cancelled' && (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>
                                )}
                                {trip.status === 'scheduled' && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Scheduled</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No bus usage data found for the selected period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complaints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Report</CardTitle>
                <CardDescription>
                  Report showing all student complaints from {startDate ? format(startDate, "MMM dd, yyyy") : "start"} to {endDate ? format(endDate, "MMM dd, yyyy") : "now"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Bus</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Submitted On</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Resolved On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaintsData.length > 0 ? (
                          complaintsData.map((complaint) => (
                            <TableRow key={complaint.complaintId}>
                              <TableCell className="font-medium">{complaint.studentName}</TableCell>
                              <TableCell>
                                {complaint.busName !== 'N/A' ? (
                                  <>
                                    <div>{complaint.busName}</div>
                                    <div className="text-xs text-muted-foreground">{complaint.busNumber}</div>
                                  </>
                                ) : (
                                  'General'
                                )}
                              </TableCell>
                              <TableCell>{complaint.complaintType}</TableCell>
                              <TableCell>{complaint.submittedOn}</TableCell>
                              <TableCell>
                                {complaint.status === 'resolved' && (
                                  <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                                )}
                                {complaint.status === 'pending' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                )}
                                {complaint.status === 'in_progress' && (
                                  <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                                )}
                              </TableCell>
                              <TableCell>{complaint.resolvedOn}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No complaint data found for the selected period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="utilization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bus Utilization Report</CardTitle>
                <CardDescription>
                  Report showing bus utilization statistics for the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bus</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Total Trips</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Cancelled</TableHead>
                          <TableHead>Utilization Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {busUtilizationData.length > 0 ? (
                          busUtilizationData.map((bus) => (
                            <TableRow key={bus.busId}>
                              <TableCell>
                                <div className="font-medium">{bus.busName}</div>
                                <div className="text-xs text-muted-foreground">{bus.busNumber}</div>
                              </TableCell>
                              <TableCell>{bus.driverName}</TableCell>
                              <TableCell>{bus.capacity}</TableCell>
                              <TableCell>{bus.totalTrips}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">
                                  {bus.completedTrips}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-red-100 text-red-800">
                                  {bus.cancelledTrips}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                    <div
                                      className="bg-primary h-2.5 rounded-full"
                                      style={{ width: bus.utilizationRate }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">{bus.utilizationRate}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No utilization data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
