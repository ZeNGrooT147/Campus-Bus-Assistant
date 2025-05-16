import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast.tsx';

interface VotingRequest {
  id: string;
  title: string;
  description: string;
  region: string;
  studentCount: number;
  votes: number;
  voteWeight: number;
  target: number;
  status: string;
  timeCreated: string;
  timeLeft: string;
  dateCreated: Date;
  completedAt?: string;
  voteBreakdown: {
    sameRegion: number;
    otherRegion: number;
  };
  outcome?: string;
  rejectionReason?: string;
  isExpired: boolean;
}

const formatDateRelative = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'just now';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} minutes ago`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} hours ago`;
  } else {
    return `${Math.floor(diff / day)} days ago`;
  }
};

export function useCoordinatorVoting() {
  const [activeVotes, setActiveVotes] = useState<VotingRequest[]>([]);
  const [completedVotes, setCompletedVotes] = useState<VotingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveVotes = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('voting_topics')
        .select(`
          *,
          profiles!created_by(region),
          votes(id, student_id, profiles!student_id(region))
        `)
        .in('status', ['active', 'processing']);
        
      if (error) throw error;
      
      if (data) {
        const formattedVotes = data.map(vote => {
          const createdAt = new Date(vote.created_at);
          const endDate = new Date(vote.end_date);
          const now = new Date();
          
          // Check if vote has expired
          const isExpired = now > endDate;
          
          // Get vote breakdown by region
          const studentVotes = vote.votes || [];
          let sameRegionCount = 0;
          let otherRegionCount = 0;
          let studentIds = new Set();
          
          const creatorProfile = vote.profiles as unknown as { region?: string } | null;
          const voteRegion = creatorProfile?.region || 'Unknown';
          
          studentVotes.forEach(studentVote => {
            const studentId = studentVote.student_id;
            studentIds.add(studentId);
            
            const studentProfile = studentVote.profiles as unknown as { region?: string } | null;
            const studentRegion = studentProfile?.region || 'Unknown';
            
            if (studentRegion === voteRegion) {
              sameRegionCount++;
            } else {
              otherRegionCount++;
            }
          });
          
          // Calculate weighted votes
          const totalWeightedVotes = sameRegionCount * 1.0 + otherRegionCount * 0.5;
          const averageWeight = studentIds.size > 0 ? totalWeightedVotes / studentIds.size : 0;
          
          // Calculate time remaining
          const timeRemaining = endDate.getTime() - now.getTime();
          const minutesRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60)));
          
          // If expired, update status
          if (isExpired) {
            supabase
              .from('voting_topics')
              .update({ status: 'rejected', rejection_reason: 'Voting period expired' })
              .eq('id', vote.id);
          }
          
          return {
            id: vote.id,
            title: vote.title,
            description: vote.description,
            region: voteRegion,
            studentCount: studentIds.size,
            votes: totalWeightedVotes,
            voteWeight: averageWeight,
            target: 25, // Threshold
            status: isExpired ? 'expired' : vote.status,
            timeCreated: formatDateRelative(createdAt),
            timeLeft: `${minutesRemaining} minutes remaining`,
            dateCreated: createdAt,
            voteBreakdown: {
              sameRegion: sameRegionCount,
              otherRegion: otherRegionCount
            },
            isExpired
          };
        });
        
        setActiveVotes(formattedVotes);
      }
    } catch (error) {
      console.error('Error fetching active votes:', error);
      toast.error('Failed to load active voting requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompletedVotes = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('voting_topics')
        .select(`
          *,
          profiles!created_by(region),
          votes(id, student_id, profiles!student_id(region))
        `)
        .in('status', ['approved', 'rejected']);
        
      if (error) throw error;
      
      if (data) {
        const formattedVotes = data.map(vote => {
          const createdAt = new Date(vote.created_at);
          const endDate = new Date(vote.end_date);
          const now = new Date();
          
          // Get vote breakdown by region
          const studentVotes = vote.votes || [];
          let sameRegionCount = 0;
          let otherRegionCount = 0;
          let studentIds = new Set();
          
          const creatorProfile = vote.profiles as unknown as { region?: string } | null;
          const voteRegion = creatorProfile?.region || 'Unknown';
          
          studentVotes.forEach(studentVote => {
            const studentId = studentVote.student_id;
            studentIds.add(studentId);
            
            const studentProfile = studentVote.profiles as unknown as { region?: string } | null;
            const studentRegion = studentProfile?.region || 'Unknown';
            
            if (studentRegion === voteRegion) {
              sameRegionCount++;
            } else {
              otherRegionCount++;
            }
          });
          
          // Calculate weighted votes
          const totalWeightedVotes = sameRegionCount * 1.0 + otherRegionCount * 0.5;
          const averageWeight = studentIds.size > 0 ? totalWeightedVotes / studentIds.size : 0;
          
          return {
            id: vote.id,
            title: vote.title,
            description: vote.description,
            region: voteRegion,
            studentCount: studentIds.size,
            votes: totalWeightedVotes,
            voteWeight: averageWeight,
            target: 25, // Threshold
            status: vote.status,
            timeCreated: formatDateRelative(createdAt),
            timeLeft: formatDateRelative(endDate),
            dateCreated: createdAt,
            dateCompleted: formatDateRelative(endDate),
            completedAt: vote.end_date,
            voteBreakdown: {
              sameRegion: sameRegionCount,
              otherRegion: otherRegionCount
            },
            outcome: vote.status,
            rejectionReason: vote.rejection_reason,
            isExpired: now > endDate
          };
        });
        
        setCompletedVotes(formattedVotes);
      }
    } catch (error) {
      console.error('Error fetching completed votes:', error);
      toast.error('Failed to load completed voting requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVotes();
    fetchCompletedVotes();

    // Real-time subscription for votes and voting_topics
    const votesChannel = supabase
      .channel('votes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchActiveVotes();
        fetchCompletedVotes();
      })
      .subscribe();

    const topicsChannel = supabase
      .channel('voting_topics_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_topics' }, () => {
        fetchActiveVotes();
        fetchCompletedVotes();
      })
      .subscribe();

    return () => {
      votesChannel.unsubscribe();
      topicsChannel.unsubscribe();
    };
  }, []);

  const approveVotingRequest = async (
    voteId: string,
    busId: string,
    driverId: string,
    departureTime: string
  ): Promise<boolean> => {
    try {
      // Check if vote has expired
      const { data: vote, error: checkError } = await supabase
        .from('voting_topics')
        .select('end_date')
        .eq('id', voteId)
        .single();

      if (checkError) throw checkError;

      if (new Date() > new Date(vote.end_date)) {
        toast.error('Cannot approve expired voting request');
        return false;
      }

      const { error } = await supabase
        .from('voting_topics')
        .update({ 
          status: 'approved',
          bus_id: busId,
          driver_id: driverId,
          departure_time: departureTime
        })
        .eq('id', voteId);

      if (error) throw error;
      
      // Notify students
      await notifyStudents(voteId);
      
      toast.success('Voting request approved successfully!');
      fetchActiveVotes();
      fetchCompletedVotes();
      return true;
    } catch (error) {
      console.error('Error approving voting request:', error);
      toast.error('Failed to approve voting request');
      return false;
    }
  };

  const rejectVotingRequest = async (voteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('voting_topics')
        .update({ 
          status: 'rejected',
          rejection_reason: 'Request rejected by coordinator'
        })
        .eq('id', voteId);

      if (error) throw error;
      
      // Notify students
      await notifyStudentsRejection(voteId, 'Request rejected by coordinator');
      
      toast.success('Voting request rejected successfully!');
      fetchActiveVotes();
      fetchCompletedVotes();
      return true;
    } catch (error) {
      console.error('Error rejecting voting request:', error);
      toast.error('Failed to reject voting request');
      return false;
    }
  };

  const notifyStudents = async (topicId: string) => {
    try {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('student_id')
        .eq('topic_id', topicId);
        
      if (votesError) throw votesError;
      
      if (!votes || votes.length === 0) return;
      
      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('title, schedules(departure_time)')
        .eq('id', topicId)
        .single();
        
      if (topicError) throw topicError;
      
      const notifications = votes.map(vote => ({
        user_id: vote.student_id,
        title: 'Bus Request Approved!',
        message: `Your request for ${topic.title} has been approved! The bus will depart at ${topic.schedules?.departure_time || 'the scheduled time'}.`,
        type: 'request_approved',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'bus_allocated'
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
    } catch (error) {
      console.error('Error notifying students:', error);
    }
  };

  const notifyStudentsRejection = async (topicId: string, reason: string) => {
    try {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('student_id')
        .eq('topic_id', topicId);
        
      if (votesError) throw votesError;
      
      if (!votes || votes.length === 0) return;
      
      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('title')
        .eq('id', topicId)
        .single();
        
      if (topicError) throw topicError;
      
      const notifications = votes.map(vote => ({
        user_id: vote.student_id,
        title: 'Bus Request Rejected',
        message: `Your request for ${topic.title} has been rejected.`,
        type: 'request_rejected',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'request_rejected'
        })
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
        
    } catch (error) {
      console.error('Error notifying students of rejection:', error);
    }
  };
  
  const refreshVoting = useCallback(() => {
    fetchActiveVotes();
    fetchCompletedVotes();
  }, []);

  return {
    activeVotes,
    completedVotes,
    isLoading,
    approveVotingRequest,
    rejectVotingRequest,
    refreshVoting
  };
}
