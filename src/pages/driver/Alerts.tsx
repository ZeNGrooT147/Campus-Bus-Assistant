import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Bell, CheckCircle, MapPin, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// Mock alerts data
const alerts: Alert[] = [
  {
    id: "alert1",
    title: "Emergency SOS from Student",
    message: "Student John Doe (USN123456) has triggered an emergency alert. Their last known location is College Campus.",
    severity: "critical",
    target_role: "driver",
    created_at: new Date().toISOString(),
    created_by: "system",
    expires_at: null,
    is_read: false
  },
  {
    id: "alert2",
    title: "Schedule Change Notice",
    message: "Your afternoon trip (Varada Express) has been rescheduled from 5:15 PM to 5:30 PM due to faculty meeting.",
    severity: "important",
    target_role: "driver",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    created_by: "coordinator",
    expires_at: null,
    is_read: false
  },
  {
    id: "alert3",
    title: "Bus Maintenance Required",
    message: "Varada Express (KA-01-F-1234) is due for maintenance check tomorrow. Please report to the workshop at 10 AM.",
    severity: "normal",
    target_role: "driver",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: "system",
    expires_at: null,
    is_read: true
  },
  {
    id: "alert4",
    title: "New Announcement",
    message: "All drivers must attend the safety briefing this Saturday at 9 AM in the college auditorium.",
    severity: "important",
    target_role: "driver",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    created_by: "coordinator",
    expires_at: null,
    is_read: true
  }
];

const DriverAlerts = () => {
  const [activeAlerts, setActiveAlerts] = useState(alerts);
  
  const getAlertIcon = (severity: string) => {
    switch(severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'important':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getAlertBadge = (severity: string) => {
    switch(severity) {
      case 'critical':
        return <Badge variant="destructive">Emergency</Badge>;
      case 'important':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Important</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Normal</Badge>;
    }
  };

  const markAsRead = (id: string) => {
    setActiveAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === id ? { ...alert, is_read: true } : alert
      )
    );
  };
  
  const resolveAlert = (id: string) => {
    setActiveAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === id ? { ...alert, is_read: true } : alert
      )
    );
    toast.success("Alert marked as resolved");
  };
  
  const acknowledgeEmergency = (id: string) => {
    resolveAlert(id);
    toast.success("Emergency acknowledged. Coordinator has been notified.");
  };

  return (
    <DashboardLayout pageTitle="Alerts & Notifications">
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-destructive border-2">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Emergency Response Center
            </CardTitle>
            <CardDescription>
              Quickly respond to emergency alerts from students
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activeAlerts.some(alert => alert.severity === 'critical' && !alert.is_read) ? (
              activeAlerts
                .filter(alert => alert.severity === 'critical' && !alert.is_read)
                .map(alert => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "border rounded-md p-4 mb-4",
                      !alert.is_read ? "bg-red-50 border-red-200" : "bg-white"
                    )}
                  >
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-3" />
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-destructive">
                          {alert.title}
                          {!alert.is_read && (
                            <span className="inline-block w-2 h-2 bg-destructive rounded-full ml-2"></span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm">{alert.message}</p>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={() => acknowledgeEmergency(alert.id)}>
                            Acknowledge Emergency
                          </Button>
                          <Button variant="outline">
                            Contact Coordinator
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6">
                <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">No active emergencies</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  There are no emergency alerts at the moment. If a student triggers an SOS alert, it will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  Alerts, schedule changes, and announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAlerts
                    .filter(alert => !alert.is_read)
                    .map(alert => (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "border rounded-md p-4",
                          !alert.is_read ? "bg-muted/30" : ""
                        )}
                      >
                        <div className="flex items-start">
                          <div className="mt-0.5 mr-3">
                            {getAlertIcon(alert.severity)}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-base font-medium mr-2">
                                {alert.title}
                              </h3>
                              {!alert.is_read && (
                                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            <p className="mt-1 text-sm">{alert.message}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString()}
                              </span>
                              {getAlertBadge(alert.severity)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                          >
                            {!alert.is_read ? 'Mark as Read' : 'Mark as Unread'}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Mark All as Read
                </Button>
                <Button variant="link" size="sm">
                  View Archived Alerts
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <CardTitle>Unread Alerts</CardTitle>
                <CardDescription>
                  Alerts that need your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAlerts.filter(alert => !alert.is_read).length > 0 ? (
                    activeAlerts
                      .filter(alert => !alert.is_read)
                      .map(alert => (
                        <div 
                          key={alert.id} 
                          className="border rounded-md p-4 bg-muted/30"
                        >
                          <div className="flex items-start">
                            <div className="mt-0.5 mr-3">
                              {getAlertIcon(alert.severity)}
                            </div>
                            <div>
                              <h3 className="text-base font-medium">{alert.title}</h3>
                              <p className="mt-1 text-sm">{alert.message}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                                {getAlertBadge(alert.severity)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsRead(alert.id)}
                            >
                              Mark as Read
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium">All caught up!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                        You have no unread alerts at this moment.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                  Important updates from coordinators and administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAlerts
                    .filter(alert => alert.severity === 'important')
                    .map(alert => (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "border rounded-md p-4",
                          !alert.is_read ? "bg-muted/30" : ""
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            <div className="mt-0.5 mr-3">
                              <MessageSquare className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <h3 className="text-base font-medium">{alert.title}</h3>
                              <p className="mt-1 text-sm">{alert.message}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Announcement
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DriverAlerts;
