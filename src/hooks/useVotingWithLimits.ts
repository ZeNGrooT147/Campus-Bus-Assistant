import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRealVotingTopics } from './useRealVotingTopics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendSMSNotification } from '@/services/voteThresholdService';

interface Vote {
  id: string;
  topic_id: string;
  option_id: string;
  student_id: string;
  created_at: string;
}

interface VotingTopic {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  start_date: string;
  end_date: string;
  votes: number;
  requiredVotes: number;
  region?: string;
  created_at: string;
  endDate: Date; // Added to match the property from useRealVotingTopics
}

const VOTE_THRESHOLD = 25; // Vote threshold configuration

export function useVotingWithLimits() {
  const { user } = useAuth();
  const { votingTopics, isLoading, refreshData } = useRealVotingTopics();
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [lastVoteTime, setLastVoteTime] = useState<Date | null>(null);
  const [canVoteAgainAt, setCanVoteAgainAt] = useState<Date | null>(null);
  
  // Get current user votes
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setUserVotes(data);
          
          // Set last vote time
          const mostRecentVote = data[0];
          const voteTime = new Date(mostRecentVote.created_at);
          setLastVoteTime(voteTime);
          
          // Calculate when user can vote again (30 minutes from last vote)
          const nextVoteTime = new Date(voteTime.getTime() + 30 * 60000); // 30 minutes
          setCanVoteAgainAt(nextVoteTime);
        }
      } catch (error) {
        console.error('Error fetching user votes:', error);
      }
    };
    
    fetchUserVotes();
    
    // Set up subscription for vote changes
    const voteSubscription = supabase
      .channel('votes-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'votes',
          filter: `student_id=eq.${user?.id}` 
        }, 
        () => {
          fetchUserVotes();
        }
      )
      .subscribe();
      
    return () => {
      voteSubscription.unsubscribe();
    };
  }, [user?.id]);
  
  // Filter out expired voting topics (past the bus departure time)
  const activeVotingTopics = votingTopics.filter(topic => {
    // Ensure we're handling the expected property format from useRealVotingTopics
    // The useRealVotingTopics hook returns endDate in camelCase
    const topicEndDate = new Date(topic.endDate);
    return topicEndDate > new Date();
  });
  
  const canUserVote = () => {
    if (!lastVoteTime) return true;
    
    const now = new Date();
    const thirtyMinutesAfterLastVote = new Date(lastVoteTime.getTime() + 30 * 60000);
    
    return now >= thirtyMinutesAfterLastVote;
  };
  
  const getTimeUntilNextVote = () => {
    if (!canVoteAgainAt) return null;
    
    const now = new Date();
    if (now >= canVoteAgainAt) return null;
    
    const diffMs = canVoteAgainAt.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);
    
    return diffMins;
  };
  
  // Check if a topic has reached the voting threshold and handle the process
  const checkVoteThreshold = async (topicId: string, votes: number) => {
    // Only proceed if votes have reached or exceeded the threshold
    if (votes < VOTE_THRESHOLD) return;
    
    try {
      // Get the topic details to check status
      const { data: topicData, error: topicError } = await supabase
        .from('voting_topics')
        .select(`
          id,
          title,
          status,
          created_by,
          profiles:created_by(region)
        `)
        .eq('id', topicId)
        .single();
        
      if (topicError) {
        console.error("Error fetching topic:", topicError);
        return;
      }
      
      if (!topicData) return;
      
      // Only proceed if the topic is active and hasn't been processed yet
      if (topicData.status !== 'active') {
        return;
      }
      
      // Update topic status to processing
      const { error: updateError } = await supabase
        .from('voting_topics')
        .update({ status: 'processing' })
        .eq('id', topicId);
        
      if (updateError) {
        console.error("Error updating topic status:", updateError);
        return;
      }
        
      // Find available drivers in the region
      const creatorProfile = topicData.profiles as { region?: string } | null;
      const region = creatorProfile?.region || 'Hubli';
      const title = topicData.title || 'Bus request';
      
      // Get available drivers
      const { data: availableDrivers, error: driversError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('role', 'driver')
        .eq('region', region);
        
      if (driversError) {
        console.error("Error fetching drivers:", driversError);
        return;
      }
      
      if (!availableDrivers || availableDrivers.length === 0) {
        // No drivers available, escalate directly to coordinators
        await notifyCoordinators(topicId, title, region);
        return;
      }
      
      // Notify drivers with a 10-minute expiration
      for (const driver of availableDrivers) {
        await notifyDriver(driver.id, topicId, title, region);
      }
      
      // Store the pending driver response information using an RPC call
      await supabase.rpc('create_driver_response_pending', {
        topic_id_param: topicId,
        region_param: region,
        title_param: title,
        expires_at_param: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins from now
      });
      
      toast.success('Vote threshold reached! Notifying drivers in the area.');
      
      // Send SMS notifications to drivers with phone numbers
      const driversWithPhones = availableDrivers
        .filter(driver => driver.phone)
        .map(driver => driver.id);
        
      if (driversWithPhones.length > 0) {
        await sendSMSNotification(
          driversWithPhones,
          `URGENT: 25 students have requested a bus for ${title} in ${region}. Please check your app to accept or decline.`
        );
      }
    } catch (error) {
      console.error('Error in vote threshold handling:', error);
    }
  };
  
  // Notify available drivers about the request
  const notifyDriver = async (driverId: string, topicId: string, title: string, region: string) => {
    const notificationData = {
      user_id: driverId,
      title: 'High Demand Route Available',
      message: `25 students from ${region} have requested a bus for ${title}. Can you take this trip?`,
      type: 'driver_request',
      metadata: JSON.stringify({
        topic_id: topicId,
        action_type: 'driver_assignment',
        region: region,
        requires_response: true
      })
    };
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notificationData]);
        
      if (error) throw error;
      
      console.log(`Notification sent to driver ${driverId} for topic ${topicId}`);
      
      return true;
    } catch (error) {
      console.error('Error notifying driver:', error);
      return false;
    }
  };
  
  // Notify coordinators when no drivers are available or no response received
  const notifyCoordinators = async (topicId: string, title: string, region: string) => {
    try {
      // Get all coordinator IDs
      const { data: coordinators, error: coordError } = await supabase
        .from('profiles')
        .select('id, phone')
        .eq('role', 'coordinator');
        
      if (coordError) throw coordError;
      
      if (!coordinators || coordinators.length === 0) return;
      
      // Create notifications for all coordinators
      const notifications = coordinators.map(coord => ({
        user_id: coord.id,
        title: 'Driver Assignment Needed',
        message: `Driver unavailable. Please assign a driver for high-demand route ${title} in ${region}`,
        type: 'coordinator_alert',
        metadata: JSON.stringify({
          topic_id: topicId,
          action_type: 'driver_assignment_needed',
          region: region,
          urgency: 'high'
        })
      }));
      
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
        
      if (error) throw error;
      
      // Update topic status to indicate coordinator attention needed
      await supabase
        .from('voting_topics')
        .update({ status: 'pending_coordinator' })
        .eq('id', topicId);
        
      console.log(`Escalated to ${coordinators.length} coordinators for topic ${topicId}`);
      
      // Send SMS to coordinators with phone numbers
      const coordinatorsWithPhones = coordinators
        .filter(coord => coord.phone)
        .map(coord => coord.id);
        
      if (coordinatorsWithPhones.length > 0) {
        await sendSMSNotification(
          coordinatorsWithPhones,
          `URGENT: Driver assignment needed for high-demand route ${title} in ${region}. Please check your app.`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error notifying coordinators:', error);
      return false;
    }
  };
  
  const castVote = async (topicId: string, optionId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to vote');
      return false;
    }
    
    if (!canUserVote()) {
      const minsRemaining = getTimeUntilNextVote();
      toast.error(`You can vote again in ${minsRemaining} minutes`);
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .insert([
          {
            topic_id: topicId,
            option_id: optionId,
            student_id: user.id
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Update last vote time
      const now = new Date();
      setLastVoteTime(now);
      setCanVoteAgainAt(new Date(now.getTime() + 30 * 60000));
      
      // Get the current vote count for this topic
      const { data: voteCount, error: countError } = await supabase
        .from('votes')
        .select('id', { count: 'exact' })
        .eq('topic_id', topicId);
        
      if (!countError && voteCount !== null) {
        // Check if vote threshold reached
        if (voteCount.length >= VOTE_THRESHOLD) {
          await checkVoteThreshold(topicId, voteCount.length);
        }
      }
      
      toast.success('Vote recorded successfully');
      refreshData();
      return true;
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote. Please try again.');
      return false;
    }
  };
  
  return {
    votingTopics: activeVotingTopics,
    userVotes,
    isLoading,
    canUserVote,
    getTimeUntilNextVote,
    castVote,
    lastVoteTime,
    canVoteAgainAt
  };
}
