import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Route {
  id: string;
  name: string;
  start_location: string;
  end_location: string;
}

interface Schedule {
  id: string;
  departure_time: string;
  route_id: string;
  days_of_week: string[];
}

interface Bus {
  id: string;
  bus_number: string;
  name: string;
  capacity: number;
  route: string;
  status: string;
}

interface VotingTopic {
  id: string;
  title: string;
  description: string;
  routeId: string;
  scheduleId: string;
  votes: number;
  requiredVotes: number;
  hasVoted: boolean;
  status: 'active' | 'completed' | 'upcoming' | 'approved' | 'rejected';
  createdAt: Date;
  endDate: Date;
  region: string;
  busId: string;
  busNumber?: string;
  voteWeight?: number;
  rejectionReason?: string;
}

interface Coordinator {
  telegram_id: string;
}

interface NewBusRequestData {
  routeId: string;
  scheduleId: string;
  description: string;
  date: Date;
  busId: string;
  reason: string;
  endDate: Date;
}

const TELEGRAM_BOT_TOKEN = '7742027749:AAENTZ012O5SiGto0M0QMJhm-xSbtiFZETY';
const DRIVER_CHAT_ID = '7545143019'; // Your Telegram ID
const VOTE_THRESHOLD = 1;
const NOTIFICATION_SENT_KEY = 'notification_sent_';
const NOTIFICATION_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export function useRealVotingTopics() {
  const { user } = useAuth();
  const [votingTopics, setVotingTopics] = useState<VotingTopic[]>([]);
  const [pastVotingTopics, setPastVotingTopics] = useState<VotingTopic[]>([]);
  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch buses
      const { data: busesData, error: busesError } = await supabase
        .from('buses')
        .select('*')
        .order('bus_number');

      if (busesError) throw busesError;
      if (busesData) setAvailableBuses(busesData);

      // Fetch active topics
      const { data: activeTopics, error: activeError } = await supabase
        .from('voting_topics')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          status,
          created_by,
          bus_id,
          route_id,
          schedule_id,
          profiles!created_by(region)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch votes separately
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(`
          topic_id,
          student_id,
          profiles!student_id(region)
        `);

      if (votesError) throw votesError;

      // Fetch user's votes
      const { data: userVotes, error: userVotesError } = await supabase
        .from('votes')
        .select('topic_id')
        .eq('student_id', user.id);

      if (userVotesError) throw userVotesError;

      const votedTopicIds = new Set(userVotes?.map(vote => vote.topic_id) || []);

      // Process vote counts
      const voteCountMap = new Map<string, { sameRegion: number; otherRegion: number }>();
      votesData?.forEach(vote => {
        const topicId = vote.topic_id;
        const voterRegion = vote.profiles?.region || 'Unknown';
        const current = voteCountMap.get(topicId) || { sameRegion: 0, otherRegion: 0 };
        
        if (voterRegion === user?.region) {
          current.sameRegion++;
        } else {
          current.otherRegion++;
        }
        
        voteCountMap.set(topicId, current);
      });

      // Transform active topics
      const transformedActiveTopics = activeTopics?.map(topic => {
        const hasVoted = votedTopicIds.has(topic.id);
        const voteCount = voteCountMap.get(topic.id) || { sameRegion: 0, otherRegion: 0 };
        const totalVotes = voteCount.sameRegion + (voteCount.otherRegion * 0.5);
        const busNumber = busesData?.find(bus => bus.id === topic.bus_id)?.bus_number;
        const region = topic.profiles?.region || 'Dharwad Region';

        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          routeId: topic.route_id || '',
          scheduleId: topic.schedule_id || '',
          votes: totalVotes,
          requiredVotes: VOTE_THRESHOLD,
          hasVoted,
          status: topic.status as VotingTopic['status'],
          createdAt: new Date(topic.start_date),
          endDate: new Date(topic.end_date),
          region,
          busId: topic.bus_id,
          busNumber,
          voteWeight: 1.0
        };
      }) || [];

      // Fetch past voting topics
      const { data: pastTopics, error: pastError } = await supabase
        .from('voting_topics')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          status,
          created_by,
          bus_id,
          route_id,
          schedule_id,
          profiles!created_by(region)
        `)
        .in('status', ['completed', 'rejected'])
        .order('created_at', { ascending: false });

      if (pastError) throw pastError;

      // Transform past topics
      const transformedPastTopics = pastTopics?.map(topic => {
        const hasVoted = votedTopicIds.has(topic.id);
        const voteCount = voteCountMap.get(topic.id) || { sameRegion: 0, otherRegion: 0 };
        const totalVotes = voteCount.sameRegion + (voteCount.otherRegion * 0.5);
        const busNumber = busesData?.find(bus => bus.id === topic.bus_id)?.bus_number;
        const region = topic.profiles?.region || 'Dharwad Region';

        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          routeId: topic.route_id || '',
          scheduleId: topic.schedule_id || '',
          votes: totalVotes,
          requiredVotes: VOTE_THRESHOLD,
          hasVoted,
          status: topic.status as VotingTopic['status'],
          createdAt: new Date(topic.start_date),
          endDate: new Date(topic.end_date),
          region,
          busId: topic.bus_id,
          busNumber,
          voteWeight: 1.0,
          rejectionReason: topic.status === 'rejected' ? 'Insufficient driver availability' : undefined
        };
      }) || [];

      setVotingTopics(transformedActiveTopics);
      setPastVotingTopics(transformedPastTopics);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!user) return;
    
    fetchData();
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000); // Poll every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user, fetchData]);

  const notifyDriverViaTelegram = async (topic: VotingTopic, event: 'threshold' | 'rejected' | 'approved') => {
    try {
      let message = '';
      switch (event) {
        case 'threshold':
          message = `🚨 URGENT: LEAVE THE BUS!\n\nA new bus request has reached the voting threshold.\n\nDetails:\nTitle: ${topic.title}\nDescription: ${topic.description}\nRegion: ${topic.region}\n\nPlease check your coordinator dashboard for more information.`;
          break;
        case 'rejected':
          message = `❌ REQUEST REJECTED\n\nTitle: ${topic.title}\nDescription: ${topic.description}\nFinal Votes: ${topic.votes}\nRegion: ${topic.region}\n\nRequest has been rejected.`;
          break;
        case 'approved':
          message = `✅ REQUEST APPROVED\n\nTitle: ${topic.title}\nDescription: ${topic.description}\nFinal Votes: ${topic.votes}\nRegion: ${topic.region}\nBus: ${topic.busNumber || 'Not assigned'}\n\nRequest has been approved and bus allocated.`;
          break;
      }

      console.log('Sending Telegram message to driver:', message);
      
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: DRIVER_CHAT_ID,
          text: message
        })
      });

      const data = await response.json();
      console.log('Telegram API Response:', data);
      
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      toast.error('Failed to send notification to driver');
    }
  };

  const castVote = useCallback(async (topicId: string, optionId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to vote');
        return false;
      }

      const { data: topic, error: topicError } = await supabase
        .from('voting_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError) throw topicError;
      if (!topic) {
        toast.error('Voting topic not found');
        return false;
      }

      // Check if voting period has ended
      if (new Date() > new Date(topic.end_date)) {
        toast.error('Voting period has ended');
        return false;
      }

      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          topic_id: topicId,
          option_id: optionId,
          student_id: user.id
        });

      if (voteError) {
        if (voteError.code === '23505') { // Unique violation
          toast.error('You have already voted on this topic');
        } else {
          throw voteError;
        }
        return false;
      }

      // Refresh the data
      await fetchData();
      
      // Fetch the latest votes for this topic directly from Supabase
      const { data: topicVotes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('topic_id', topicId);

      if (votesError) {
        console.error('Error fetching votes:', votesError);
      } else if (topicVotes && topicVotes.length >= VOTE_THRESHOLD) {
        // Fetch the topic details
        const { data: topicData, error: topicError } = await supabase
          .from('voting_topics')
          .select(`
            *,
            profiles:profiles!created_by(region)
          `)
          .eq('id', topicId)
          .single();

        if (topicError) {
          console.error('Error fetching topic:', topicError);
        } else {
          // Transform topicData to VotingTopic
          const transformedTopic = {
            id: topicData.id,
            title: topicData.title,
            description: topicData.description,
            routeId: topicData.route_id || '',
            scheduleId: topicData.schedule_id || '',
            votes: topicVotes.length,
            requiredVotes: VOTE_THRESHOLD,
            hasVoted: true, // The user just voted
            status: topicData.status as VotingTopic['status'],
            createdAt: new Date(topicData.start_date),
            endDate: new Date(topicData.end_date),
            region: topicData.profiles?.region || 'Dharwad Region',
            busId: topicData.bus_id,
            busNumber: '', // Not available here
            voteWeight: 1.0
          };
          await notifyDriverViaTelegram(transformedTopic, 'threshold');
          toast.success('Voting threshold reached! Driver has been notified.');
        }
      }

      toast.success('Vote cast successfully!');
      return true;
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote');
      return false;
    }
  }, [votingTopics, fetchData]);

  // Request new bus function
  const requestNewBus = useCallback(async (data: NewBusRequestData) => {
    if (!user) {
      setError('You must be logged in to request a bus');
      return false;
    }

    try {
      setIsSubmitting(true);

      if (!data.busId) {
        setError('Please select a bus for your request');
        return false;
      }

      const selectedBus = availableBuses.find(bus => bus.id === data.busId);
      if (!selectedBus) {
        setError('Selected bus not found');
        return false;
      }

      // Create new topic
      const { data: newTopic, error: topicError } = await supabase
        .from('voting_topics')
        .insert({
          title: `Additional Bus Request - ${selectedBus.bus_number}`,
          description: data.description || data.reason,
          start_date: data.date.toISOString(),
          end_date: data.endDate.toISOString(),
          status: 'active',
          created_by: user.id,
          bus_id: data.busId,
          route_id: data.routeId,
          schedule_id: data.scheduleId
        })
        .select('id')
        .single();

      if (topicError) throw topicError;

      // Create voting option
      const { error: optionError } = await supabase
        .from('voting_options')
        .insert({
          topic_id: newTopic.id,
          option_text: 'Approve'
        });

      if (optionError) throw optionError;

      // Refresh data
      await fetchData();
      return true;

    } catch (err) {
      console.error('Error requesting bus:', err);
      setError(err instanceof Error ? err.message : 'Failed to request bus');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, availableBuses, fetchData]);

  // Add notifications for rejection and approval
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
      
      // Get the topic details for notification
      const topic = votingTopics.find(t => t.id === voteId);
      if (topic) {
        await notifyDriverViaTelegram(topic, 'rejected');
      }
      
      toast.success('Voting request rejected successfully!');
      fetchData();
      return true;
    } catch (error) {
      console.error('Error rejecting voting request:', error);
      toast.error('Failed to reject voting request');
      return false;
    }
  };

  const approveVotingRequest = async (voteId: string, busId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('voting_topics')
        .update({ 
          status: 'approved',
          bus_id: busId
        })
        .eq('id', voteId);

      if (error) throw error;
      
      // Get the topic details for notification
      const topic = votingTopics.find(t => t.id === voteId);
      if (topic) {
        await notifyDriverViaTelegram(topic, 'approved');
      }
      
      toast.success('Voting request approved successfully!');
      fetchData();
      return true;
    } catch (error) {
      console.error('Error approving voting request:', error);
      toast.error('Failed to approve voting request');
      return false;
    }
  };

  return {
    votingTopics,
    pastVotingTopics,
    availableBuses,
    castVote,
    requestNewBus,
    isLoading,
    isSubmitting,
    error,
    refreshData: fetchData
  };
}
