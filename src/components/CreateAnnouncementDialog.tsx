import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateAnnouncementDialogProps {
  onAnnouncementCreated: () => void;
  onAnnouncementsCleared?: () => void;
  trigger?: React.ReactNode;
  defaultTargetRole?: 'student' | 'driver' | 'coordinator' | 'admin';
  showClearOption?: boolean;
}

interface AnnouncementFormData {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  target_role: 'student' | 'driver' | 'coordinator' | 'admin';
  expires_at: string;
}

export function CreateAnnouncementDialog({ 
  onAnnouncementCreated, 
  onAnnouncementsCleared,
  trigger,
  defaultTargetRole = 'student',
  showClearOption = false
}: CreateAnnouncementDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<AnnouncementFormData>({
    title: "",
    message: "",
    severity: "info",
    target_role: defaultTargetRole,
    expires_at: ""
  });

  const handleCreateAnnouncement = async () => {
    try {
      setIsCreating(true);
      
      // Validate required fields
      if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
        toast.error("Title and message are required");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        toast.error("Authentication error. Please try again.");
        return;
      }
      
      if (!userData.user?.id) {
        toast.error("User not authenticated");
        return;
      }

      // Prepare the announcement data according to the schema
      const expiresAtValue = newAnnouncement.expires_at && newAnnouncement.expires_at.trim() !== ''
        ? newAnnouncement.expires_at
        : null;
      const announcementData = {
        title: newAnnouncement.title.trim(),
        message: newAnnouncement.message.trim(),
        severity: newAnnouncement.severity,
        target_role: newAnnouncement.target_role,
        created_by: userData.user.id,
        expires_at: expiresAtValue,
        created_at: new Date().toISOString(),
        is_read: false
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert([announcementData])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        toast.error(error.message || "Failed to create announcement");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Failed to create announcement");
        return;
      }

      toast.success("Announcement created successfully");

      // Close the dialog and reset the form
      setIsDialogOpen(false);
      setNewAnnouncement({
        title: "",
        message: "",
        severity: "info",
        target_role: defaultTargetRole,
        expires_at: ""
      });
      
      // Notify parent component
      onAnnouncementCreated();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || "Failed to create announcement");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClearAllAnnouncements = async () => {
    try {
      setIsClearing(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        toast.error("Authentication error. Please try again.");
        return;
      }
      
      if (!userData.user?.id) {
        toast.error("User not authenticated");
        return;
      }

      // Delete all announcements created by the current user
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('created_by', userData.user.id);

      if (error) {
        console.error('Supabase error details:', error);
        toast.error(error.message || "Failed to clear announcements");
        return;
      }

      toast.success("All announcements cleared successfully");
      
      // Notify parent component
      if (onAnnouncementsCleared) {
        onAnnouncementsCleared();
      }
    } catch (error: any) {
      console.error('Error clearing announcements:', error);
      toast.error(error.message || "Failed to clear announcements");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            Create a new announcement to be displayed to users
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleCreateAnnouncement();
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter announcement title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter announcement message"
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={newAnnouncement.severity}
              onValueChange={(value: "info" | "warning" | "error") => 
                setNewAnnouncement(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Normal</SelectItem>
                <SelectItem value="warning">Important</SelectItem>
                <SelectItem value="error">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_role">Target Role</Label>
            <Select
              value={newAnnouncement.target_role}
              onValueChange={(value: "student" | "driver" | "coordinator" | "admin") => 
                setNewAnnouncement(prev => ({ ...prev, target_role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={newAnnouncement.expires_at}
              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expires_at: e.target.value }))}
            />
          </div>
          <DialogFooter className="flex gap-2 justify-between">
            {showClearOption && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleClearAllAnnouncements}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </>
                )}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Announcement"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 