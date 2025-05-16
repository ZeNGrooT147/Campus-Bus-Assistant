import React, { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote, Clock, Users, CheckCircle2, MapPin, AlertCircle, Bus, Loader2, TrendingUp, ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRealVotingTopics } from "@/hooks/useRealVotingTopics";
import { formatDistanceToNow, isFuture } from "date-fns";
import { RequestBusDialog } from "@/components/RequestBusDialog";
import { CreateVoteRequestDialog } from "@/components/CreateVoteRequestDialog";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const StudentVoting = () => {
  const { user } = useAuth();
  const { 
    votingTopics, 
    pastVotingTopics, 
    availableBuses,
    castVote, 
    requestNewBus,
    isLoading,
    isSubmitting,
    error
  } = useRealVotingTopics();
  
  const [activeTab, setActiveTab] = useState<string>("active");
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);
  
  const userRegion = user?.region || "Hubli";
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const getVoteWeight = (voteRegion: string) => {
    // If user's region matches the vote's region, weight is 1.0, otherwise 0.5
    return voteRegion === userRegion ? 1.0 : 0.5;
  };
  
  const getTimeRemaining = (endDate: Date) => {
    if (isFuture(endDate)) {
      return formatDistanceToNow(endDate, { addSuffix: true });
    }
    return "Expired";
  };
  
  const getTimeSince = (createdAt: Date) => {
    return formatDistanceToNow(createdAt, { addSuffix: true });
  };

  // Memoize active voting topics by region
  const { userRegionVotes, otherRegionVotes } = useMemo(() => {
    const userVotes = votingTopics.filter(vote => vote.region === userRegion);
    const otherVotes = votingTopics.filter(vote => vote.region !== userRegion);
    
    return {
      userRegionVotes: userVotes,
      otherRegionVotes: otherVotes
    };
  }, [votingTopics, userRegion]);

  const handleCastVote = async (voteId: string) => {
    try {
      setVotingInProgress(voteId);
      const success = await castVote(voteId, 'approve');
      if (success) {
        toast.success("Your vote has been cast successfully!");
      }
    } finally {
      setVotingInProgress(null);
    }
  };

  const VoteCard = React.memo(({ vote }: { vote: typeof votingTopics[0] }) => {
    const voteWeight = getVoteWeight(vote.region || '');
    const isVotingThis = votingInProgress === vote.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={`overflow-hidden transition-all hover:shadow-md ${vote.hasVoted ? "border-primary/30" : ""}`}
        >
          <CardHeader className="pb-2 relative">
            <div className="flex justify-between">
              <div>
                <CardTitle>{vote.title}</CardTitle>
                <CardDescription>{vote.description}</CardDescription>
              </div>
              <Badge 
                variant={vote.region === userRegion ? "default" : "outline"}
                className={`${vote.region === userRegion ? "bg-primary text-primary-foreground" : ""}`}
              >
                {vote.region}
              </Badge>
            </div>
            {vote.region === userRegion && (
              <div className="absolute -right-8 -top-8 bg-primary/10 rotate-45 w-24 h-24"></div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Progress: {vote.votes.toFixed(1)}/{vote.requiredVotes} votes</span>
                  <span>{Math.round((vote.votes / vote.requiredVotes) * 100)}%</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={(vote.votes / vote.requiredVotes) * 100} 
                    className="h-2"
                  />
                  {vote.votes > 0 && vote.votes < vote.requiredVotes && (
                    <motion.div 
                      className="absolute top-0 h-2 bg-primary/30 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((vote.votes + voteWeight) / vote.requiredVotes) * 100)}%`,
                        opacity: vote.hasVoted ? 0 : 0.5
                      }}
                      animate={{ opacity: vote.hasVoted ? 0 : [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
              
              {vote.busId && vote.busNumber && (
                <div className="bg-primary/5 rounded-md p-2 flex items-center gap-2 text-sm">
                  <Bus className="h-4 w-4 text-primary" />
                  <span>Requested Bus: <strong>#{vote.busNumber}</strong></span>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>Created {getTimeSince(vote.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  <span>Expires {getTimeRemaining(vote.endDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 pt-3">
            {vote.hasVoted ? (
              <Button disabled className="w-full" variant="outline">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                You've Voted ({voteWeight} points)
              </Button>
            ) : (
              <Button 
                className="w-full relative overflow-hidden group" 
                onClick={() => handleCastVote(vote.id)}
                disabled={isSubmitting || isVotingThis}
              >
                {isVotingThis ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    <span>Vote Now ({voteWeight} points)</span>
                  </>
                )}
                <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    );
  });

  // Past vote card component to optimize rendering
  const PastVoteCard = React.memo(({ vote }: { vote: typeof pastVotingTopics[0] }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card key={vote.id} className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle>{vote.title}</CardTitle>
              <CardDescription>{vote.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant={vote.region === userRegion ? "default" : "outline"}
                className={`${vote.region === userRegion ? "bg-primary text-primary-foreground" : ""}`}
              >
                {vote.region}
              </Badge>
              <Badge 
                variant={vote.status === "approved" ? "default" : "destructive"}
                className={`capitalize ${vote.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                {vote.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Final Votes: {vote.votes}/{vote.requiredVotes}</span>
                <span>{Math.round((vote.votes / vote.requiredVotes) * 100)}%</span>
              </div>
              <Progress 
                value={100} 
                className={`h-2 ${vote.status === "approved" ? "bg-green-500" : "bg-muted-foreground"}`} 
              />
            </div>
            
            {vote.busId && vote.busNumber && (
              <div className="bg-muted/30 rounded-md p-2 flex items-center gap-2 text-sm">
                <Bus className="h-4 w-4" />
                <span>Requested Bus: <strong>#{vote.busNumber}</strong></span>
              </div>
            )}
            
            {vote.status === "rejected" && vote.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                <div>
                  <strong>Reason for rejection:</strong> {vote.rejectionReason}
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">{vote.region}</Badge>
              </div>
              <div>Completed {getTimeSince(vote.createdAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  ));

  return (
    <DashboardLayout pageTitle="Bus Voting">
      <div className="mb-6">
        {/* Redesigned Active Bus Requests Card */}
        <Card className="border-l-4 border-primary shadow-lg rounded-2xl bg-gradient-to-br from-primary/5 to-white mb-6 transition-all hover:shadow-xl">
          <CardContent className="flex flex-col gap-2 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="h-8 w-8 text-primary" />
              <h2 className="text-xl font-bold flex items-center gap-1">
                Bus Requests
                <span className="relative group">
                  <svg className="h-4 w-4 text-muted-foreground ml-1 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white text-xs text-muted-foreground rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    This shows the number of active bus voting requests from your region. Vote to help your request get approved!
                  </span>
                </span>
              </h2>
            </div>
            <p className="text-muted-foreground text-sm mb-2">Active bus voting requests</p>
            <div className="flex flex-col items-center justify-center my-2">
              <span className="text-5xl font-extrabold text-primary animate-pulse">{userRegionVotes.length}</span>
              {userRegionVotes.length > 0 && (
                <div className="w-full mt-2 mb-1">
                  <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, userRegionVotes.length * 10)}%` }} />
                  </div>
                </div>
              )}
              <span className="text-muted-foreground text-sm mt-2">↗ Buses pending approval from your region</span>
            </div>
            <button
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg shadow transition-all text-base"
              onClick={() => document.getElementById('active-votes-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Bus className="h-5 w-5" />
              Vote on Requests
            </button>
          </CardContent>
        </Card>
        {/* Existing Voting System Card */}
        <Card className="border-t-4 border-t-primary overflow-hidden shadow-md transition-all hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Vote className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">Bus Voting System</h2>
                <p className="text-muted-foreground">
                  Vote for additional buses when you need them. Once enough votes are received, a request
                  is sent to the coordinator for bus allocation.
                </p>
                <div className="flex items-center mt-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                  <span>Your region: <span className="text-primary">{userRegion}</span></span>
                  <Badge variant="outline" className="ml-2 px-2 py-0">
                    {userRegion === "Hubli" ? "1.0× for Hubli, 0.5× for Dharwad votes" : "1.0× for Dharwad, 0.5× for Hubli votes"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <CreateVoteRequestDialog />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="active" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="active" 
            className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Active Votes
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Past Requests
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="active" className="space-y-4 animate-fade-in">
            {isLoading ? (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="mt-4 text-muted-foreground">Loading voting topics...</p>
                </CardContent>
              </Card>
            ) : votingTopics.length > 0 ? (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Your Region Votes */}
                {userRegionVotes.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h2 className="text-lg font-medium">{userRegion} Requests</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userRegionVotes.map((vote) => (
                        <VoteCard key={vote.id} vote={vote} />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Other Region Votes */}
                {otherRegionVotes.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-2 mt-8">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h2 className="text-lg font-medium">Other Region Requests</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherRegionVotes.map((vote) => (
                        <VoteCard key={vote.id} vote={vote} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No active voting requests</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                    There are no active bus voting requests at the moment.
                    You can create a new request for additional buses.
                  </p>
                  <div className="mt-4">
                    <CreateVoteRequestDialog />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <TabsContent value="past" className="animate-fade-in">
            {isLoading ? (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="mt-4 text-muted-foreground">Loading past voting topics...</p>
                </CardContent>
              </Card>
            ) : pastVotingTopics.length > 0 ? (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {pastVotingTopics.map((vote) => (
                  <PastVoteCard key={vote.id} vote={vote} />
                ))}
              </motion.div>
            ) : (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No past voting requests</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                    There are no past bus voting requests at the moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentVoting;
