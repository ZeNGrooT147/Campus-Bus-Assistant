
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Clock, AlertTriangle, UserCheck, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    created_at: string;
    metadata: string;
  };
  availableDrivers: Array<{
    id: string;
    name: string;
  }>;
  onRespond: () => void;
}

export function VoteThresholdActionRequired({ notification, availableDrivers, onRespond }: NotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  
  // Parse the metadata
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
  const topicId = metadata.topic_id;
  const region = metadata.region || 'Unknown area';
  
  // Format creation time
  const createdAt = new Date(notification.created_at);
  const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = createdAt.toLocaleDateString();
  
  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      toast.error("Please select a driver to assign");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Mark the notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      // 2. Update the voting topic status
      const { error: topicError } = await supabase
        .from('voting_topics')
        .update({ 
          status: 'driver_assigned',
          driver_id: selectedDriverId 
        })
        .eq('id', topicId);
        
      if (topicError) throw topicError;
      
      // 3. Create student notifications that a driver was assigned
      await notifyStudents(topicId);
      
      // 4. Notify the assigned driver
      await notifyDriver(selectedDriverId, topicId, region);
      
      toast.success("Driver assigned successfully. Students have been notified.");
      setIsAssigningDriver(false);
      onRespond();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelBus = async () => {
    setIsLoading(true);
    
    try {
      // 1. Mark the notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      // 2. Update the voting topic status
      const { error: topicError } = await supabase
        .from('voting_topics')
        .update({ 
          status: 'rejected',
          rejection_reason: 'No drivers available for this route at the requested time'
        })
        .eq('id', topicId);
        
      if (topicError) throw topicError;
      
      // 3. Notify students that the request was declined
      await notifyStudentsCancellation(topicId);
      
      toast.success("Bus request has been cancelled. Students have been notified.");
      setIsCancelling(false);
      onRespond();
    } catch (error) {
      console.error('Error cancelling bus:', error);
      toast.error('Failed to cancel bus request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const notifyStudents = async (topicId: string) => {
    try {
      // Get students who voted on this topic
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('student_id')
        .eq('topic_id', topicId);
        
      if (votesError) throw votesError;
      
      if (!votes || votes.length === 0) return;
      
      // Get topic details
      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('title')
        .eq('id', topicId)
        .single();
        
      if (topicError) throw topicError;
      
      // Create notifications for all students who voted
      const notifications = votes.map(vote => ({
        user_id: vote.student_id,
        title: 'Bus Request Approved!',
        message: `A coordinator has assigned a driver for ${topic.title}! The bus will depart at the requested time.`,
        type: 'request_approved',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'bus_allocated',
          assigned_by: 'coordinator'
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
    } catch (error) {
      console.error('Error notifying students:', error);
    }
  };
  
  const notifyStudentsCancellation = async (topicId: string) => {
    try {
      // Get students who voted on this topic
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('student_id')
        .eq('topic_id', topicId);
        
      if (votesError) throw votesError;
      
      if (!votes || votes.length === 0) return;
      
      // Get topic details
      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('title')
        .eq('id', topicId)
        .single();
        
      if (topicError) throw topicError;
      
      // Create notifications for all students who voted
      const notifications = votes.map(vote => ({
        user_id: vote.student_id,
        title: 'Bus Request Cancelled',
        message: `We're sorry, but your request for ${topic.title} could not be fulfilled due to unavailable drivers.`,
        type: 'request_rejected',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'bus_cancelled',
          reason: 'No drivers available'
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
    } catch (error) {
      console.error('Error notifying students of cancellation:', error);
    }
  };
  
  const notifyDriver = async (driverId: string, topicId: string, region: string) => {
    try {
      // Get topic details
      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('title')
        .eq('id', topicId)
        .single();
        
      if (topicError) throw topicError;
      
      const notification = {
        user_id: driverId,
        title: 'You Have Been Assigned to a Route',
        message: `A coordinator has assigned you to drive the requested route: ${topic.title} in ${region}.`,
        type: 'driver_assignment',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'driver_assigned_by_coordinator',
          region: region
        })
      };
      
      await supabase
        .from('notifications')
        .insert([notification]);
        
    } catch (error) {
      console.error('Error notifying driver:', error);
    }
  };

  return (
    <>
      <Card className="w-full border-l-4 border-l-red-500 shadow-md mb-4 animate-fadeIn">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">{notification.title}</CardTitle>
              <CardDescription className="text-xs">
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{timeString} · {dateString}</span>
                </div>
              </CardDescription>
            </div>
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Action Required
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">{notification.message}</p>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <span className="font-medium mr-2">Region:</span>
              <span>{region}</span>
            </div>
            <div className="mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-700">Students are waiting for a response</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-1/2 mr-2 border-red-200 hover:bg-red-50"
            onClick={() => setIsCancelling(true)}
          >
            <X className="h-4 w-4 mr-1 text-red-500" />
            Cancel Bus
          </Button>
          <Button 
            size="sm" 
            className="w-1/2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAssigningDriver(true)}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Assign Driver
          </Button>
        </CardFooter>
      </Card>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssigningDriver} onOpenChange={setIsAssigningDriver}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Select a driver to assign to this high-demand route.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Select Driver</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssigningDriver(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignDriver} disabled={isLoading || !selectedDriverId}>
              {isLoading ? "Assigning..." : "Assign Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Bus Dialog */}
      <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Bus Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this bus request? 
              This will notify all students who voted that their request can't be fulfilled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelling(false)}>
              Go Back
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBus} 
              disabled={isLoading}
            >
              {isLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
