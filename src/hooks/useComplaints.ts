import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast.tsx';
import { formatDistanceToNow } from 'date-fns';

export interface Complaint {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  createdAt: Date;
  busId?: string;
  busNumber?: string;
  responses?: {
    id: string;
    message: string;
    timestamp: string;
    timeAgo: string;
    responderName: string;
  }[];
}

export type ComplaintType = 'delay' | 'cleanliness' | 'behavior' | 'safety' | 'other';

interface SubmitComplaintData {
  type: ComplaintType;
  description: string;
  busId?: string;
}

export function useComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComplaints = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch user's complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          id,
          complaint_type,
          description,
          status,
          created_at,
          bus_id,
          buses:bus_id (
            bus_number
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
        
      if (complaintsError) throw complaintsError;

      // Fetch responses from complaint_responses table
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
        .in('complaint_id', complaintsData.map(c => c.id))
        .order('created_at', { ascending: true });
        
      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
      }
      
      // Format the complaints
      const formattedComplaints: Complaint[] = (complaintsData || []).map(complaint => {
        // Fix typing for buses property 
        const busNumber = complaint.buses ? (complaint.buses as any).bus_number : undefined;
        
        // Get responses for this complaint
        const responses = (responsesData || [])
          .filter(response => response.complaint_id === complaint.id)
          .map(response => ({
            id: response.id,
            message: response.message,
            timestamp: response.created_at,
            timeAgo: formatDistanceToNow(new Date(response.created_at), { addSuffix: true }),
            responderName: response.profiles?.name || 'Coordinator'
          }));
        
        return {
          id: complaint.id,
          type: complaint.complaint_type,
          description: complaint.description,
          status: complaint.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
          createdAt: new Date(complaint.created_at),
          busId: complaint.bus_id,
          busNumber: busNumber,
          responses
        };
      });
      
      setComplaints(formattedComplaints);
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err);
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchComplaints();

    // Set up real-time subscription
    const subscription = supabase
      .channel('complaints_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'complaints',
        filter: `student_id=eq.${user.id}`
      }, () => {
        fetchComplaints();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchComplaints]);

  const submitComplaint = async (data: SubmitComplaintData) => {
    if (!user) {
      toast.error('You must be logged in to submit a complaint');
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Submit complaint to Supabase
      const { data: newComplaint, error } = await supabase
        .from('complaints')
        .insert({
          student_id: user.id,
          complaint_type: data.type,
          description: data.description,
          bus_id: data.busId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Fetch bus number if a bus ID is provided
      let busNumber = '';
      if (data.busId) {
        const { data: busData } = await supabase
          .from('buses')
          .select('bus_number')
          .eq('id', data.busId)
          .single();
          
        if (busData) {
          busNumber = busData.bus_number;
        }
      }
      
      // Add the new complaint to local state
      const formattedComplaint: Complaint = {
        id: newComplaint.id,
        type: newComplaint.complaint_type,
        description: newComplaint.description,
        status: newComplaint.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
        createdAt: new Date(newComplaint.created_at),
        busId: newComplaint.bus_id,
        busNumber,
        responses: []
      };
      
      setComplaints(prev => [formattedComplaint, ...prev]);
      
      toast.success('Complaint submitted successfully');
      return true;
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      toast.error('Failed to submit complaint');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    complaints, 
    submitComplaint,
    isLoading,
    isSubmitting,
    error 
  };
}
