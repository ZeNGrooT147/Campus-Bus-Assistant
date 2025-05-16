import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bus, 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Percent, 
  Vote, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { useEffect, useState, useMemo } from "react";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Memoized chart components
const MemoizedPieChart = memo(PieChart);
const MemoizedBarChart = memo(BarChart);
const MemoizedLineChart = memo(LineChart);

// Mock data for charts
const busUsageData = [
  { name: "Varada Express", value: 42 },
  { name: "Shalmala Express", value: 38 },
  { name: "Malaprabha Express", value: 25 },
];

const monthlyRidesData = [
  { name: "Jan", rides: 320 },
  { name: "Feb", rides: 340 },
  { name: "Mar", rides: 360 },
  { name: "Apr", rides: 280 },
  { name: "May", rides: 250 },
  { name: "Jun", rides: 310 },
  { name: "Jul", rides: 350 },
  { name: "Aug", rides: 380 },
  { name: "Sep", rides: 400 },
  { name: "Oct", rides: 420 },
  { name: "Nov", rides: 450 },
  { name: "Dec", rides: 380 },
];

const weekdayRidesData = [
  { name: "Mon", hubli: 150, dharwad: 130 },
  { name: "Tue", hubli: 145, dharwad: 125 },
  { name: "Wed", hubli: 140, dharwad: 128 },
  { name: "Thu", hubli: 135, dharwad: 120 },
  { name: "Fri", hubli: 160, dharwad: 140 },
  { name: "Sat", hubli: 80, dharwad: 60 },
  { name: "Sun", hubli: 40, dharwad: 30 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Memoized stat card component
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  status 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  subtitle: string; 
  status: 'live' | 'updated' 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-gradient-to-br from-white to-secondary/10 border border-primary/5 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">{subtitle}</p>
          <span className={`flex items-center ${status === 'live' ? 'text-green-600' : 'text-amber-600'} font-medium`}>
            {status === 'live' ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {status === 'live' ? 'Live data' : 'Updated daily'}
          </span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
));

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const { 
    buses, 
    routes, 
    schedules, 
    drivers, 
    isLoading, 
    refreshData 
  } = useCoordinatorBuses();
  
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Memoize computed values
  const stats = useMemo(() => ({
    totalBuses: buses.length,
    activeBuses: buses.filter(bus => bus.status === 'active').length,
    activeDrivers: drivers.filter(driver => driver.status === 'available').length,
    unassignedBuses: buses.filter(bus => !bus.assigned_driver).length,
    totalRoutes: routes.length,
    activeSchedules: schedules.length
  }), [buses, drivers, routes, schedules]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDataLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (!dataLoaded || isLoading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-8 w-full max-w-md mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coordinator Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage campus buses, routes, and schedules.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/coordinator/buses')}
            >
              Manage Buses
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Buses"
            value={stats.totalBuses}
            icon={Bus}
            subtitle={`${stats.activeBuses} active`}
            status="live"
          />
          
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            icon={Users}
            subtitle={`${stats.unassignedBuses} unassigned buses`}
            status="live"
          />
          
          <StatCard
            title="Total Routes"
            value={stats.totalRoutes}
            icon={MapPin}
            subtitle={`${stats.activeSchedules} active schedules`}
            status="live"
          />
          
          <StatCard
            title="Daily Rides"
            value="145"
            icon={Calendar}
            subtitle="+12.5% from last week"
            status="updated"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Active Buses</CardTitle>
              <CardDescription>Currently running buses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buses.filter(bus => bus.status === 'active').map(bus => (
                  <div key={bus.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{bus.name}</p>
                        <p className="text-sm text-muted-foreground">{bus.route}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{bus.driver?.name || "Unassigned"}</p>
                      </div>
                      {getStatusBadge(bus.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Upcoming bus departures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.slice(0, 5).map(schedule => (
                  <div key={schedule.id} className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{schedule.busName}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.departureLocation} → {schedule.arrivalLocation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{schedule.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{schedule.days.join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 w-full sm:w-auto">
            <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2 overflow-hidden border border-primary/5 hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/20">
                  <CardTitle>Monthly Rides</CardTitle>
                  <CardDescription>Number of student rides per month</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pt-6">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRidesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                            border: 'none' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="rides" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-primary/5 hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/20">
                  <CardTitle>Bus Usage</CardTitle>
                  <CardDescription>Current occupancy by bus</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={busUsageData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {busUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                            border: 'none' 
                          }}  
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader className="bg-muted/20">
                <CardTitle>Weekly Usage Patterns</CardTitle>
                <CardDescription>Comparing Hubli and Dharwad routes</CardDescription>
              </CardHeader>
              <CardContent className="px-2 pt-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayRidesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                          border: 'none' 
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="hubli" name="Hubli Route" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dharwad" name="Dharwad Route" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader className="bg-muted/20">
                <CardTitle>Annual Reports</CardTitle>
                <CardDescription>Download comprehensive reports</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-white border rounded-md p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium flex items-center">
                      <span className="p-1.5 bg-blue-100 rounded-md mr-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9L13 2z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13 2v7h7M16 13H8M16 17H8M10 9H8" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      2023 Yearly Usage Report
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Complete analysis of bus usage, patterns, and recommendations.
                    </p>
                    <button className="mt-3 text-sm text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md flex items-center justify-center w-full">
                      Download PDF
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default memo(CoordinatorDashboard);
