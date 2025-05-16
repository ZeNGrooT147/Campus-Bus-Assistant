
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast.tsx';

export interface VotingTopic {
  id: string;
  title: string;
  description: string;
  destination: string;
  time: string;
  votes: number;
  requiredVotes: number;
  hasVoted: boolean;
  status: 'active' | 'completed' | 'upcoming';
}

export function useVotingTopics() {
  const { user } = useAuth();
  const [votingTopics, setVotingTopics] = useState<VotingTopic[]>([]);
  const [activeVotingTopic, setActiveVotingTopic] = useState<VotingTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    
    async function fetchVotingTopics() {
      try {
        setIsLoading(true);
        
        // Fetch active voting topics
        const { data: topicsData, error: topicsError } = await supabase
          .from('voting_topics')
          .select(`
            id,
            title,
            description,
            status,
            start_date,
            end_date
          `)
          .eq('status', 'active');
          
        if (topicsError) throw topicsError;
        
        if (topicsData && topicsData.length > 0) {
          // Get vote counts for each topic
          const topicVoteCounts = await Promise.all(
            topicsData.map(async (topic) => {
              const { count, error } = await supabase
                .from('votes')
                .select('id', { count: 'exact', head: true })
                .eq('topic_id', topic.id);
                
              if (error) throw error;
              
              // Check if user has voted
              const { data: userVote, error: userVoteError } = await supabase
                .from('votes')
                .select('id')
                .eq('topic_id', topic.id)
                .eq('student_id', user.id)
                .maybeSingle();
                
              if (userVoteError) throw userVoteError;
              
              return {
                ...topic,
                votes: count || 0,
                hasVoted: !!userVote
              };
            })
          );
          
          // Format for the UI
          const formattedTopics: VotingTopic[] = topicVoteCounts.map(topic => ({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            destination: topic.title.includes('to') ? topic.title.split('to')[1].trim() : 'Campus',
            time: new Date(topic.end_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            votes: topic.votes,
            requiredVotes: 25, // This would be configured in the topic in a real implementation
            hasVoted: topic.hasVoted,
            status: topic.status as 'active' | 'completed' | 'upcoming'
          }));
          
          setVotingTopics(formattedTopics);
          setActiveVotingTopic(formattedTopics[0] || null);
        }
      } catch (err: any) {
        console.error('Error fetching voting topics:', err);
        setError(err);
        toast.error('Failed to load voting topics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVotingTopics();
  }, [user]);

  const castVote = async (topicId: string) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      return false;
    }
    
    try {
      // Check if user has already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('topic_id', topicId)
        .eq('student_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingVote) {
        toast.error('You have already voted on this topic');
        return false;
      }
      
      // Get the first option for the topic (in a real app, user would select an option)
      const { data: options, error: optionsError } = await supabase
        .from('voting_options')
        .select('id')
        .eq('topic_id', topicId)
        .limit(1);
        
      if (optionsError) throw optionsError;
      if (!options || options.length === 0) {
        toast.error('No voting options available');
        return false;
      }
      
      // Cast the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          topic_id: topicId,
          option_id: options[0].id,
          student_id: user.id
        });
        
      if (voteError) throw voteError;
      
      // Update local state
      setVotingTopics(prev => 
        prev.map(topic => 
          topic.id === topicId 
            ? { ...topic, votes: topic.votes + 1, hasVoted: true } 
            : topic
        )
      );
      
      setActiveVotingTopic(prev => 
        prev && prev.id === topicId 
          ? { ...prev, votes: prev.votes + 1, hasVoted: true }
          : prev
      );
      
      toast.success('Vote registered! Thank you for your input.');
      return true;
    } catch (err: any) {
      console.error('Error casting vote:', err);
      toast.error('Failed to cast vote. Please try again.');
      return false;
    }
  };

  return { 
    votingTopics, 
    activeVotingTopic, 
    setActiveVotingTopic,
    castVote,
    isLoading, 
    error 
  };
}
