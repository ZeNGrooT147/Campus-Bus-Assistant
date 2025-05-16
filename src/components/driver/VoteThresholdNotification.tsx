import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Clock, AlertTriangle, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { sendSMSNotification } from '@/services/voteThresholdService';

interface NotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    created_at: string;
    metadata: string;
  };
  onRespond: () => void;
}

export function VoteThresholdNotification({ notification, onRespond }: NotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Parse the metadata
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
  const topicId = metadata.topic_id;
  const busId = metadata.bus_id;
  const region = metadata.region || 'Unknown area';
  
  // Format creation time
  const createdAt = new Date(notification.created_at);
  const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = createdAt.toLocaleDateString();
  
  const handleAccept = async () => {
    if (!user?.id) return;
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
          driver_id: user.id 
        })
        .eq('id', topicId);
        
      if (topicError) throw topicError;
      
      // 3. Create student notifications that a driver accepted
      await notifyStudents(topicId);
      
      // 4. Notify the coordinator for tracking purposes
      await notifyCoordinator(topicId, region, false);
      
      // 5. Remove any pending response entry using RPC call
      await supabase.rpc('clear_driver_pending_responses', {
        topic_id_param: topicId
      });
      
      toast.success("You've accepted this route. Students have been notified.");
      onRespond();
    } catch (error) {
      console.error('Error accepting route:', error);
      toast.error('Failed to accept the route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDecline = async () => {
    setIsLoading(true);
    
    try {
      // 1. Mark the notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      // 2. Check if other drivers have responded by using RPC
      const { data: pendingResponse, error: pendingError } = await supabase.rpc(
        'get_pending_response',
        { topic_id_param: topicId }
      );
        
      if (pendingError && pendingError.code !== 'PGRST116') {
        throw pendingError;
      }
      
      // If this is the last driver or time has expired, escalate to coordinator
      const now = new Date();
      if (!pendingResponse || (pendingResponse.length > 0 && 
          pendingResponse[0].expires_at && 
          new Date(pendingResponse[0].expires_at) < now)) {
        await notifyCoordinator(topicId, region, true);
      }
      
      toast.info("You've declined this route. Thank you for responding.");
      onRespond();
    } catch (error) {
      console.error('Error declining route:', error);
      toast.error('Failed to decline the route. Please try again.');
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
      
      if (!topic) return;
      
      // Get student phone numbers for SMS
      const studentIds = votes.map(vote => vote.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, phone')
        .in('id', studentIds);
        
      if (studentsError) throw studentsError;
      
      // Create notifications for all students who voted
      const notifications = votes.map(vote => ({
        user_id: vote.student_id,
        title: 'Bus Request Approved!',
        message: `A bus has been allocated for ${topic.title}! The bus will depart at the requested time.`,
        type: 'request_approved',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'bus_allocated'
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
      // Send SMS to all students with phone numbers
      if (students && students.length > 0) {
        // Extract valid student IDs
        const studentsWithPhones = students
          .filter(student => student.phone)
          .map(student => student.id);
          
        if (studentsWithPhones.length > 0) {
          await sendSMSNotification(
            studentsWithPhones,
            `Your bus request for ${topic.title} has been approved! The bus will depart at the scheduled time. Check the app for details.`
          );
        }
      }
        
    } catch (error) {
      console.error('Error notifying students:', error);
    }
  };
  
  const notifyCoordinator = async (topicId: string, region: string, needsAction: boolean) => {
    try {
      // Get all coordinator IDs
      const { data: coordinators, error: coordError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'coordinator');
        
      if (coordError) throw coordError;
      
      if (!coordinators || coordinators.length === 0) return;
      
      let title, message, type;
      
      if (needsAction) {
        title = 'Driver Assignment Needed';
        message = `All available drivers declined the high-demand route in ${region}. Please assign a driver manually.`;
        type = 'coordinator_action_required';
      } else {
        title = 'Driver Accepted Route';
        message = `A driver has accepted the high-demand route in ${region}. No action needed.`;
        type = 'coordinator_info';
      }
      
      // Create notifications for all coordinators
      const notifications = coordinators.map(coord => ({
        user_id: coord.id,
        title,
        message,
        type,
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: needsAction ? 'manual_assignment_needed' : 'driver_assigned',
          region: region
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
      // Send SMS to coordinators if action is needed
      if (needsAction) {
        await sendSMSNotification(
          coordinators.map(c => c.id),
          `URGENT: High-demand route in ${region} needs driver assignment. All drivers declined.`
        );
      }
    } catch (error) {
      console.error('Error notifying coordinators:', error);
    }
  };

  return (
    <Card className="w-full border-l-4 border-l-yellow-500 shadow-md mb-4 animate-fadeIn">
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
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Bus className="h-3 w-3 mr-1" />
            High Demand
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
          {busId && (
            <div className="flex items-center">
              <span className="font-medium mr-2">Bus ID:</span>
              <span>{busId}</span>
            </div>
          )}
          <div className="mt-1 flex items-center">
            <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
            <span className="text-yellow-700">This request will expire in 10 minutes if no response</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-1/2 mr-2 border-red-200 hover:bg-red-50"
          onClick={handleDecline}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-1 text-red-500" />
          Decline
        </Button>
        <Button 
          size="sm" 
          className="w-1/2 bg-green-600 hover:bg-green-700"
          onClick={handleAccept}
          disabled={isLoading}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
