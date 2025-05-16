import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast.tsx';
import { format, formatDistanceToNow } from 'date-fns';

export interface Complaint {
  id: string;
  studentName: string;
  studentId: string;
  studentContact?: string;
  busName?: string;
  busNumber?: string;
  complaintType: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  submittedDate: string;
  timeAgo: string;
  responses: ComplaintResponse[];
  coordinatorNotes?: string;
  // Fields needed for the Coordinator Complaints page
  title?: string;
  dateCreated?: string;
  dateResolved?: string;
  priority?: string;
}

interface ComplaintResponse {
  id: string;
  message: string;
  responderName?: string;
  timestamp: Date;
  timeAgo: string;
}

export function useCoordinatorComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const { user } = useAuth();

  const fetchComplaints = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch all complaints
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          profiles!student_id(
            id,
            name,
            email,
            phone
          ),
          buses(
            id,
            bus_number,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaints:', error);
        setIsLoading(false);
        return;
      }

      // Fetch all responses for these complaints
      const { data: responsesData, error: responsesError } = await supabase
        .from('complaint_responses')
        .select(`
          id,
          message,
          created_at,
          complaint_id,
          profiles!responder_id(
            id,
            name
          )
        `)
        .in('complaint_id', data.map(c => c.id))
        .order('created_at', { ascending: true });

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      }

      // Format the complaints with additional data
      const formattedComplaints = (data || []).map(complaint => {
        // Find bus details if there's a bus ID
        const bus = complaint.buses;

        // Find responses for this complaint
        const complaintResponses = (responsesData || [])
          .filter(response => response.complaint_id === complaint.id)
          .map(response => ({
            id: response.id,
            message: response.message,
            responderName: response.profiles?.name || 'Coordinator',
            timestamp: new Date(response.created_at),
            timeAgo: formatDistanceToNow(new Date(response.created_at), { addSuffix: true })
          }));
        
        // Map status values to match the expected values in the interface
        let mappedStatus: 'pending' | 'in_progress' | 'resolved' | 'rejected' = 'pending';
        if (complaint.status === 'in-review' || complaint.status === 'in_review' || complaint.status === 'in_progress') {
          mappedStatus = 'in_progress';
        } else if (complaint.status === 'resolved') {
          mappedStatus = 'resolved';
        } else if (complaint.status === 'rejected') {
          mappedStatus = 'rejected';
        }

        return {
          id: complaint.id,
          studentId: complaint.student_id,
          studentName: complaint.profiles?.name || 'Unknown Student',
          studentContact: complaint.profiles?.phone || complaint.profiles?.email,
          busId: complaint.bus_id,
          busName: bus?.name,
          busNumber: bus?.bus_number,
          complaintType: complaint.complaint_type,
          description: complaint.description,
          status: mappedStatus,
          submittedDate: format(new Date(complaint.created_at), 'PPP'),
          timeAgo: formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true }),
          responses: complaintResponses,
          coordinatorNotes: complaint.coordinator_notes,
          title: `${complaint.complaint_type} Issue`,
          dateCreated: format(new Date(complaint.created_at), 'PPP'),
          dateResolved: complaint.resolved_at ? format(new Date(complaint.resolved_at), 'PPP') : undefined
        };
      });

      setComplaints(formattedComplaints);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchComplaints:', error);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchComplaints();

    // Set up real-time subscription
    const subscription = supabase
      .channel('coordinator_complaints_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'complaints'
      }, () => {
        fetchComplaints();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `type=in.(complaint_response,complaint_feedback)`
      }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchComplaints]);

  const addResponse = useCallback(async (complaintId: string, responseText: string) => {
    if (!user) {
      toast.error('You must be logged in to respond to complaints');
      return false;
    }
    
    try {
      // Get the complaint details to get the student ID
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select(`
          id,
          student_id,
          status,
          complaint_type,
          description,
          profiles!student_id(id, name)
        `)
        .eq('id', complaintId)
        .single();
        
      if (complaintError) {
        console.error('Error fetching complaint:', complaintError);
        toast.error('Failed to fetch complaint details');
        return false;
      }

      if (!complaintData.student_id) {
        toast.error('Could not find student information');
        return false;
      }

      // Check if complaint is already resolved or rejected
      if (complaintData.status === 'resolved' || complaintData.status === 'rejected') {
        toast.error('Cannot respond to a resolved or rejected complaint');
        return false;
      }

      // First, store the response in complaint_responses table
      const { error: responseError } = await supabase
        .from('complaint_responses')
        .insert({
          complaint_id: complaintId,
          message: responseText,
          responder_id: user.id,
          created_at: new Date().toISOString()
        });

      if (responseError) {
        console.error('Error storing response:', responseError);
        toast.error('Failed to store response');
        return false;
      }

      // Then, create the notification for the student
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: complaintData.student_id,
          title: complaintId,
          message: responseText,
          type: 'complaint_response',
          read: false,
          created_at: new Date().toISOString()
        });
      
      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        toast.error('Failed to send response to student');
        return false;
      }

      // Then update the complaint status to in_progress if it was pending
      if (complaintData.status === 'pending') {
        const { error: updateError } = await supabase
          .from('complaints')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', complaintId);
        
        if (updateError) {
          console.error('Error updating complaint status:', updateError);
          toast.error('Failed to update complaint status');
          return false;
        }
      }

      // Refresh the complaints list
      await fetchComplaints();
      
      toast.success('Response sent successfully to student');
      return true;
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
      return false;
    }
  }, [user, fetchComplaints]);

  const updateComplaintStatus = useCallback(async (
    complaintId: string, 
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected',
    notes?: string
  ) => {
    if (!user) {
      toast.error('You must be logged in to update complaint status');
      return false;
    }
    
    try {
      // Get the complaint details to get the student ID
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select(`
          id,
          student_id,
          status,
          complaint_type,
          profiles!student_id(id, name)
        `)
        .eq('id', complaintId)
        .single();
        
      if (complaintError) {
        console.error('Error fetching complaint:', complaintError);
        toast.error('Failed to fetch complaint details');
        return false;
      }

      if (!complaintData.student_id) {
        toast.error('Could not find student information');
        return false;
      }

      // Don't allow status changes if already resolved or rejected
      if (complaintData.status === 'resolved' || complaintData.status === 'rejected') {
        toast.error('Cannot update status of a resolved or rejected complaint');
        return false;
      }

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (notes) {
        updateData.coordinator_notes = notes;
      }
      
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }
      
      // Update the complaint status
      const { error: updateError } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);
      
      if (updateError) {
        console.error('Error updating complaint:', updateError);
        toast.error('Failed to update complaint status');
        return false;
      }
      
      // Send notification to student about status update
      const statusMessage = status === 'resolved' 
        ? 'Your complaint has been resolved'
        : status === 'rejected'
        ? 'Your complaint has been rejected'
        : 'Your complaint status has been updated';

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: complaintData.student_id,
          title: complaintId,
          message: notes || statusMessage,
          type: status === 'resolved' ? 'complaint_resolved' : 
                status === 'rejected' ? 'complaint_rejected' : 'complaint_update',
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't return false here as the status was updated successfully
      }

      // Refresh the complaints list
      await fetchComplaints();
      
      toast.success(`Complaint ${status} successfully`);
      return true;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
      return false;
    }
  }, [user, fetchComplaints]);

  return {
    complaints: complaints.filter(c => 
      activeTab === 'pending' ? c.status === 'pending' : 
      activeTab === 'in_progress' ? c.status === 'in_progress' : 
      ['resolved', 'rejected'].includes(c.status)
    ),
    isLoading,
    activeTab,
    setActiveTab,
    fetchComplaints,
    addResponse,
    updateComplaintStatus,
    respondToComplaint: addResponse, // Alias for compatibility
    refreshComplaints: fetchComplaints // Alias for compatibility
  };
}
