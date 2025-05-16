import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Loader, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { CreateAnnouncementDialog } from "@/components/CreateAnnouncementDialog";

const CoordinatorAnnouncements = () => {
  const { announcements, isLoading, refreshAnnouncements, markAsRead } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout pageTitle="Announcements">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Create and manage campus-wide announcements
            </p>
          </div>
          <CreateAnnouncementDialog 
            onAnnouncementCreated={refreshAnnouncements}
            onAnnouncementsCleared={refreshAnnouncements}
            defaultTargetRole="student"
            showClearOption={true}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Announcements</CardTitle>
                <CardDescription>View and manage all announcements</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading announcements...</span>
              </div>
            ) : filteredAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className={`overflow-hidden ${!announcement.is_read ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardHeader className={`pb-2 ${announcement.isUrgent ? 'bg-red-50' : 'bg-muted/20'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Posted on {format(announcement.postedAt, 'MMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!announcement.is_read && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              New
                            </span>
                          )}
                          {announcement.isUrgent && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(announcement.postedAt, 'MMM dd, yyyy')}</span>
                      </div>
                      {!announcement.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary h-8"
                          onClick={() => markAsRead(announcement.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark as read
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p>No announcements found</p>
                <p className="text-sm text-muted-foreground">Create a new announcement to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorAnnouncements; 