
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import AdminDashboardSummary from "@/components/admin/AdminDashboardSummary";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Bus, Users, Calendar, Bell, ArrowRight, LineChart, Settings, FileText, ShieldAlert, GraduationCap } from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useBuses } from "@/hooks/useBuses";

const AdminDashboard = () => {
  const { buses, isLoading: busesLoading } = useBuses();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Admin Dashboard">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          
          <Skeleton className="h-48 w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Admin Dashboard">
      <motion.div 
        className="space-y-8 animate-fade-in"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the Campus Bus Assistant admin dashboard. Here you can manage users, buses, routes, and monitor system performance.
            </p>
          </div>
          <div>
            <NotificationDropdown />
          </div>
        </div>
        
        <AdminDashboardSummary />
        
        <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          Management Console
        </h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <Card className="bg-gradient-to-br from-white to-blue-50 border border-primary/5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="mb-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Student Accounts</CardTitle>
                <CardDescription>
                  Manage student registrations and access
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Students:</span>
                    <span className="font-medium">250</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Active Today:</span>
                    <span className="font-medium">178</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>New This Week:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/admin/users?tab=students" className="w-full">
                  <Button variant="outline" className="w-full group">
                    <span>Manage Students</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <Card className="bg-gradient-to-br from-white to-green-50 border border-primary/5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="mb-3">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Bus className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Driver Accounts</CardTitle>
                <CardDescription>
                  Manage bus drivers and assignments
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Drivers:</span>
                    <span className="font-medium">{buses.filter(bus => bus.driver).length || 'Loading...'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Active Buses:</span>
                    <span className="font-medium">{buses.filter(bus => bus.status === 'on-time').length || 'Loading...'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>On Duty Now:</span>
                    <span className="font-medium">{buses.filter(bus => bus.status === 'on-time' && bus.driver).length || 'Loading...'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/admin/users?tab=drivers" className="w-full">
                  <Button variant="outline" className="w-full group">
                    <span>Manage Drivers</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <Card className="bg-gradient-to-br from-white to-purple-50 border border-primary/5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="mb-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Coordinator Accounts</CardTitle>
                <CardDescription>
                  Manage regional bus coordinators
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Coordinators:</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Regions Covered:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Activity Today:</span>
                    <span className="font-medium">High</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/admin/coordinators" className="w-full">
                  <Button variant="outline" className="w-full group">
                    <span>Manage Coordinators</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
        
        <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center">
          <LineChart className="h-5 w-5 mr-2 text-primary" />
          System Monitoring
        </h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="col-span-1"
          >
            <Card className="border border-primary/5 hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>System Status</CardTitle>
                  <ShieldAlert className="h-5 w-5 text-green-500" />
                </div>
                <CardDescription>Real-time system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Database</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Auth Service</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Messaging</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                      <span>GPS Tracking</span>
                    </div>
                    <span className="text-sm text-amber-600 font-medium">Partial Outage</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View Status Page</Button>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="col-span-2"
          >
            <Card className="border border-primary/5 hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-500 pl-3 py-1">
                    <p className="text-sm font-medium">New student registration</p>
                    <p className="text-xs text-muted-foreground">Today at 14:32</p>
                  </div>
                  
                  <div className="border-l-2 border-green-500 pl-3 py-1">
                    <p className="text-sm font-medium">Bus route #103 updated</p>
                    <p className="text-xs text-muted-foreground">Today at 12:15</p>
                  </div>
                  
                  <div className="border-l-2 border-amber-500 pl-3 py-1">
                    <p className="text-sm font-medium">Driver assignment changed</p>
                    <p className="text-xs text-muted-foreground">Today at 10:45</p>
                  </div>
                  
                  <div className="border-l-2 border-purple-500 pl-3 py-1">
                    <p className="text-sm font-medium">New coordinator added</p>
                    <p className="text-xs text-muted-foreground">Yesterday at 16:20</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View All Activity</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
