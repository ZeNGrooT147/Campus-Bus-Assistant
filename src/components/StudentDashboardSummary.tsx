import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, Calendar, Clock, MapPin, AlertCircle, Vote, TrendingUp, Bell, BookOpen, ExternalLink, User, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { BusCard } from '@/types/busCard';
import { toast } from 'sonner';

interface StudentStats {
  activeBusRequests: number;
  region: string;
  announcements: number;
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  severity: 'normal' | 'important' | 'critical';
  isUrgent: boolean;
  postedAt: Date;
}

const StudentDashboardSummary = ({ stats }: { stats: StudentStats }) => {
  const navigate = useNavigate();
  const [busCards, setBusCards] = useState<BusCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    fetchBusCards();
    fetchAnnouncements();
  }, []);

  const fetchBusCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buses')
        .select(`
          *,
          driver:profiles!assigned_driver(
            name,
            phone,
            profile_photo_url
          )
        `)
        .limit(3);
        
      if (error) throw error;
      
      if (data) {
        // Ensure the data matches our BusCard type
        const typedBusCards: BusCard[] = data.map(bus => ({
          id: bus.id,
          name: bus.name,
          number: bus.bus_number,
          route: bus.route || '',
          stops: bus.stops || [],
          departureTime: bus.departure_time || '',
          arrivalTime: bus.arrival_time || '',
          capacity: bus.capacity,
          currentOccupancy: bus.current_passengers || 0,
          busImage: bus.bus_image || '',
          status: bus.status,
          driver: bus.driver ? {
            name: bus.driver.name || '',
            phone: bus.driver.phone || '',
            photo: bus.driver.profile_photo_url || '',
            experience: '' // Experience field removed as it doesn't exist in profiles
          } : { name: '', phone: '', photo: '', experience: '' },
          created_at: bus.created_at,
          updated_at: bus.updated_at
        }));
        setBusCards(typedBusCards);
      }
    } catch (err) {
      console.error('Error fetching bus cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .or('target_role.is.null,target_role.eq.student')
        .order('created_at', { ascending: false })
        .limit(10);
      if (alertsError) throw alertsError;
      const formattedAnnouncements: Announcement[] = (alertsData || []).map(alert => ({
        id: alert.id,
        title: alert.title,
        content: alert.message,
        severity: alert.severity as 'normal' | 'important' | 'critical',
        isUrgent: alert.severity === 'critical',
        postedAt: new Date(alert.created_at)
      }));
      setAnnouncements(formattedAnnouncements);
      setLoadingAnnouncements(false);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  useEffect(() => {
    // Real-time subscription for new announcements
    const subscription = supabase
      .channel('student_announcements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        fetchAnnouncements();
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as any;
          toast.info(`New announcement: ${newAlert.title}`);
        }
      })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-100 text-red-600',
          badge: 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
        };
      case 'important':
        return {
          bg: 'bg-amber-100 text-amber-600',
          badge: 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200'
        };
      default:
        return {
          bg: 'bg-green-100 text-green-600',
          badge: 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
        };
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary overflow-hidden h-full bg-gradient-to-br from-white to-primary/5">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Available Buses</h2>
                <CardDescription className="text-sm mt-1">Browse bus information for your region</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3 text-muted-foreground">Loading bus information...</span>
              </div>
            ) : busCards && busCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {busCards.map((bus) => (
                  <div key={bus.id} className="rounded-xl border bg-card hover:shadow-md transition-all duration-300 overflow-hidden group">
                    {bus.busImage ? (
                      <div className="h-36 overflow-hidden">
                        <img 
                          src={bus.busImage} 
                          alt={bus.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-24 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                        <Bus className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{bus.name}</h4>
                          <p className="text-sm text-muted-foreground">{bus.number}</p>
                        </div>
                        <Badge variant={bus.status === 'on-time' ? 'outline' : 'secondary'} className="px-2 py-1">
                          {bus.status || 'On Time'}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Departs {(bus as any).departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Driver: {bus.driver?.name || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-primary/5 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bus className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-lg font-medium mb-1">No bus information available</p>
                <p className="text-sm text-muted-foreground">Check back later for updates</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              variant="outline" 
              className="w-full bg-white hover:bg-primary/5 border-primary/20 hover:border-primary/30 transition-colors" 
              onClick={() => navigate('/student/buses')}
            >
              <Bus className="mr-2 h-4 w-4" />
              View All Buses
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/5 to-transparent">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <Vote className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Bus Requests</h2>
                <CardDescription className="text-sm mt-1">Active bus voting requests</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-5xl font-extrabold text-blue-600 mb-2 drop-shadow-sm">{stats.activeBusRequests}</div>
              <div className="w-full max-w-md h-2 bg-blue-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(stats.activeBusRequests * 10, 100)}%` }} />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <TrendingUp className="h-4 w-4" />
                <span>Buses pending approval from your region</span>
              </div>
              <Button 
                variant="default" 
                className="w-full max-w-md bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow transition-all duration-300"
                onClick={() => navigate('/student/voting')}
              >
                <Vote className="mr-2 h-4 w-4" />
                Vote on Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 border-t-green-500 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
                  <BookOpen className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Campus Updates</CardTitle>
                  <CardDescription className="text-sm mt-1">Latest announcements and important updates</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="ml-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200 px-3 py-1">
                {announcements.length} Updates
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-0 divide-y divide-green-100">
            {loadingAnnouncements ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-3 border-green-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-muted-foreground">Loading announcements...</span>
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => {
                const styles = getSeverityStyles(announcement.severity);
                return (
                  <div key={announcement.id} className="flex items-center justify-between p-4 transition-colors hover:bg-green-50/50 group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${styles.bg} group-hover:scale-110 transition-transform`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-base">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(announcement.postedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${styles.badge} px-3 py-1`}>
                      {announcement.severity.charAt(0).toUpperCase() + announcement.severity.slice(1)}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="bg-green-500/5 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-green-500/50" />
                </div>
                <p className="text-lg font-medium mb-1">No announcements available</p>
                <p className="text-sm text-muted-foreground">Check back later for updates</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="py-4 bg-green-50/30">
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-auto text-green-600 hover:text-green-700 hover:bg-green-100/50 flex items-center gap-2 px-4"
              onClick={() => navigate('/student/announcements')}
            >
              View all announcements
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboardSummary;
