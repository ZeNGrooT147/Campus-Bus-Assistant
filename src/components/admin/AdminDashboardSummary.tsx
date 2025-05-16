
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, ChevronUpIcon, Users, Bus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';

const AdminDashboardSummary = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDrivers: 0,
    totalCoordinators: 0,
    totalBuses: 0,
    activeBuses: 0,
    inactiveBuses: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0
  });
  const [chartData, setChartData] = useState({
    userStats: [],
    complaintsData: [],
    busUsageData: [],
    regionData: []
  });
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch user counts
      const [
        { count: studentCount }, 
        { count: driverCount }, 
        { count: coordinatorCount },
        { data: busesData },
        { data: complaintsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coordinator'),
        supabase.from('buses').select('*'),
        supabase.from('complaints').select('*')
      ]);
      
      const activeBuses = busesData?.filter(bus => bus.status === 'active').length || 0;
      const inactiveBuses = (busesData?.length || 0) - activeBuses;
      
      const resolvedComplaints = complaintsData?.filter(complaint => complaint.status === 'resolved').length || 0;
      const pendingComplaints = (complaintsData?.length || 0) - resolvedComplaints;
      
      setStats({
        totalStudents: studentCount || 0,
        totalDrivers: driverCount || 0,
        totalCoordinators: coordinatorCount || 0,
        totalBuses: busesData?.length || 0,
        activeBuses,
        inactiveBuses,
        totalComplaints: complaintsData?.length || 0,
        resolvedComplaints,
        pendingComplaints
      });
      
      // Prepare chart data
      const userStatData = [
        { name: 'Students', count: studentCount || 0 },
        { name: 'Drivers', count: driverCount || 0 },
        { name: 'Coordinators', count: coordinatorCount || 0 }
      ];
      
      const complaintChartData = [
        { name: 'Resolved', value: resolvedComplaints },
        { name: 'Pending', value: pendingComplaints }
      ];
      
      const busData = [
        { name: 'Active', value: activeBuses },
        { name: 'Inactive', value: inactiveBuses }
      ];
      
      // Get region distribution
      const { data: regionData } = await supabase
        .from('profiles')
        .select('region')
        .eq('role', 'student')
        .not('region', 'is', null);
        
      const regionCounts: Record<string, number> = {};
      regionData?.forEach(profile => {
        const region = profile.region as string;
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      
      const regionChartData = Object.entries(regionCounts).map(([name, value]) => ({ name, value }));
      
      setChartData({
        userStats: userStatData,
        complaintsData: complaintChartData,
        busUsageData: busData,
        regionData: regionChartData
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {isLoading ? '...' : stats.totalStudents + stats.totalDrivers + stats.totalCoordinators}
                </span>
                <span className="text-xs text-muted-foreground">Active accounts</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                <ChevronUpIcon className="h-3 w-3 mr-1" />
                <span>{isLoading ? '...' : stats.totalStudents}</span>
              </Badge>
              <span className="ml-2 text-muted-foreground">Students</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {isLoading ? '...' : stats.totalBuses}
                </span>
                <span className="text-xs text-muted-foreground">Total vehicles</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center">
                <Bus className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs">
              <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                <span>{isLoading ? '...' : stats.activeBuses}</span>
              </Badge>
              <span className="text-muted-foreground">Active</span>
              <Badge variant="outline" className="text-gray-600 bg-gray-100 border-gray-200">
                <span>{isLoading ? '...' : stats.inactiveBuses}</span>
              </Badge>
              <span className="text-muted-foreground">Inactive</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {isLoading ? '...' : stats.totalComplaints}
                </span>
                <span className="text-xs text-muted-foreground">Total complaints</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs">
              <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span>{isLoading ? '...' : stats.resolvedComplaints}</span>
              </Badge>
              <span className="text-muted-foreground">Resolved</span>
              <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">
                <span>{isLoading ? '...' : stats.pendingComplaints}</span>
              </Badge>
              <span className="text-muted-foreground">Pending</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {format(new Date(), 'dd MMM yyyy')}
                </span>
                <span className="text-xs text-muted-foreground">{format(new Date(), 'EEEE')}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Badge variant="outline" className="text-purple-600 bg-purple-100 border-purple-200">
                <span>{format(new Date(), 'HH:mm:ss')}</span>
              </Badge>
              <span className="ml-2 text-muted-foreground">Current time</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown of system users by role</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="bar">
              <div className="px-6">
                <TabsList className="w-36">
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="pie">Pie</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="bar" className="pt-0 px-2">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.userStats} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Users" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pie" className="pt-0">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.userStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {chartData.userStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Complaints Status</CardTitle>
            <CardDescription>Overview of resolved vs. pending complaints</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="pie">
              <div className="px-6">
                <TabsList className="w-36">
                  <TabsTrigger value="pie">Pie</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pie" className="pt-0">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.complaintsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#f97316" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="bar" className="pt-0 px-2">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.complaintsData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Count" fill="#8884d8">
                          <Cell fill="#4ade80" />
                          <Cell fill="#f97316" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Bus Status</CardTitle>
            <CardDescription>Current status of all buses</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="pie">
              <div className="px-6">
                <TabsList className="w-36">
                  <TabsTrigger value="pie">Pie</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pie" className="pt-0">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.busUsageData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#94a3b8" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="bar" className="pt-0 px-2">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.busUsageData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Buses" fill="#8884d8">
                          <Cell fill="#3b82f6" />
                          <Cell fill="#94a3b8" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Student Region Distribution</CardTitle>
            <CardDescription>Students by geographic region</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="bar">
              <div className="px-6">
                <TabsList className="w-36">
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="pie">Pie</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="bar" className="pt-0 px-2">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.regionData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Students" fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pie" className="pt-0">
                <div className="h-80">
                  {!isLoading && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.regionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardSummary;
