import { useState, ChangeEvent, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Bell, Calendar, Megaphone, Info, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

const StudentAnnouncements = () => {
  const { announcements, isLoading } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Use useMemo to filter announcements only when dependencies change
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [announcements, searchTerm]);

  const getFilteredAnnouncements = () => {
    switch (activeTab) {
      case "urgent":
        return filteredAnnouncements.filter(a => a.isUrgent);
      case "regular":
        return filteredAnnouncements.filter(a => !a.isUrgent);
      default:
        return filteredAnnouncements;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-100 text-red-700',
          badge: 'bg-red-50 text-red-600 border-red-200',
          avatar: 'bg-red-100 text-red-700'
        };
      case 'important':
        return {
          bg: 'bg-amber-100 text-amber-700',
          badge: 'bg-amber-50 text-amber-600 border-amber-200',
          avatar: 'bg-amber-100 text-amber-700'
        };
      default:
        return {
          bg: 'bg-blue-100 text-blue-700',
          badge: 'bg-blue-50 text-blue-600 border-blue-200',
          avatar: 'bg-blue-100 text-blue-700'
        };
    }
  };

  return (
    <DashboardLayout pageTitle="Announcements">
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Campus Announcements</CardTitle>
                  <CardDescription>Stay updated with the latest campus news</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-md">
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-md"
                />
                <Info className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <Tabs 
              defaultValue="all" 
              className="w-full mt-4"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="urgent">Urgent</TabsTrigger>
                <TabsTrigger value="regular">Regular</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                <AnnouncementsList 
                  announcements={getFilteredAnnouncements()} 
                  isLoading={isLoading} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const AnnouncementsList = ({ 
  announcements, 
  isLoading 
}: { 
  announcements: any[], 
  isLoading: boolean 
}) => {
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

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-100 text-red-700',
          badge: 'bg-red-50 text-red-600 border-red-200',
          avatar: 'bg-red-100 text-red-700'
        };
      case 'important':
        return {
          bg: 'bg-amber-100 text-amber-700',
          badge: 'bg-amber-50 text-amber-600 border-amber-200',
          avatar: 'bg-amber-100 text-amber-700'
        };
      default:
        return {
          bg: 'bg-blue-100 text-blue-700',
          badge: 'bg-blue-50 text-blue-600 border-blue-200',
          avatar: 'bg-blue-100 text-blue-700'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-pulse space-y-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-36 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No announcements found</h3>
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">
          There are no announcements matching your criteria. Check back later for updates.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {announcements.map((announcement) => {
        const styles = getSeverityStyles(announcement.severity);
        return (
          <motion.div key={announcement.id} variants={item}>
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className={`pb-2 ${announcement.isUrgent ? 'bg-red-50' : 'bg-muted/20'}`}>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className={styles.avatar}>
                      <AvatarFallback>
                        {announcement.isUrgent ? '!' : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge variant="outline" className={styles.badge}>
                          {announcement.severity.charAt(0).toUpperCase() + announcement.severity.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(announcement.postedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-sm">{announcement.content}</div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(announcement.postedAt, 'MMM dd, yyyy')}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-primary h-8">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Mark as read
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StudentAnnouncements;
