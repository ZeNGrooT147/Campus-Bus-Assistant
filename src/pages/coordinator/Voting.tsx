import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock, Users, Vote, X, Search, ThumbsUp, ThumbsDown, Bus, MapPin, Info, Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast.tsx";
import { useCoordinatorVoting } from "@/hooks/useCoordinatorVoting";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import RealTimeStatus from "@/components/RealTimeStatus";
import { format } from "date-fns"; // Import the format function from date-fns

const CoordinatorVoting = () => {
  const { 
    activeVotes, 
    completedVotes, 
    isLoading, 
    approveVotingRequest, 
    rejectVotingRequest,
    refreshVoting 
  } = useCoordinatorVoting();
  
  const { buses, drivers } = useCoordinatorBuses();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Form state for bus approval
  const [approvalData, setApprovalData] = useState({
    busId: "",
    driverId: "",
    departureTime: ""
  });
  
  const handleApprove = (id: string) => {
    setSelectedVoteId(id);
    setApprovalData({
      busId: "",
      driverId: "",
      departureTime: ""
    });
    setApproveDialogOpen(true);
  };
  
  const handleReject = (id: string) => {
    setSelectedVoteId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };
  
  const confirmApprove = async () => {
    if (!selectedVoteId) return;
    
    const success = await approveVotingRequest(
      selectedVoteId,
      approvalData.busId,
      approvalData.driverId,
      approvalData.departureTime
    );
    
    if (success) {
      setApproveDialogOpen(false);
      setSelectedVoteId(null);
    }
  };
  
  const confirmReject = async () => {
    if (!selectedVoteId || !rejectionReason.trim()) return;
    
    const success = await rejectVotingRequest(selectedVoteId, rejectionReason);
    
    if (success) {
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedVoteId(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const filteredActiveVotes = activeVotes.filter(vote => 
    vote.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    vote.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vote.region.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredCompletedVotes = completedVotes.filter(vote => 
    vote.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    vote.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vote.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateWeightedVotes = (vote: any) => {
    if (vote.voteBreakdown) {
      return vote.voteBreakdown.sameRegion * 1.0 + vote.voteBreakdown.otherRegion * 0.5;
    }
    return vote.votes;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  return (
    <DashboardLayout pageTitle="Voting Requests">
      <Card className="mb-6 border-t-4 border-t-primary overflow-hidden shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Vote className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">Bus Voting Management</h2>
              <p className="text-muted-foreground">
                Review and manage student requests for additional buses or special routes.
                When a vote reaches its target, you can approve or reject the request.
              </p>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-sm flex items-start">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-blue-700">
                  <span className="font-medium">Vote Weight System:</span> Students from the same region as the bus route 
                  get 1.0 weight, while students from other regions get 0.5 weight.
                </p>
              </div>
              <RealTimeStatus 
                lastUpdated={new Date()}
                resourceName="Voting data"
                onRefresh={refreshVoting}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search votes by title, description or region..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Active Votes
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Completed Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredActiveVotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActiveVotes.map((vote) => (
                <Card key={vote.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>{vote.title}</CardTitle>
                      <Badge 
                        variant="default"
                        className="bg-primary text-primary-foreground"
                      >{vote.region}</Badge>
                    </div>
                    <CardDescription>{vote.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Progress: {calculateWeightedVotes(vote).toFixed(1)}/{vote.target} votes</span>
                          <span>{Math.round((calculateWeightedVotes(vote) / vote.target) * 100)}%</span>
                        </div>
                        <Progress value={(calculateWeightedVotes(vote) / vote.target) * 100} className="h-2" />
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
                          Vote Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{vote.region} students:</span>
                            <span className="font-medium">{vote.voteBreakdown.sameRegion} × 1.0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Other students:</span>
                            <span className="font-medium">{vote.voteBreakdown.otherRegion} × 0.5</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Vote Weight</span>
                          <span className="font-medium">{vote.voteWeight.toFixed(2)} average</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Students</span>
                          <span className="font-medium">{vote.studentCount} voted</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Created</span>
                          <span className="font-medium">{vote.timeCreated}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Time Left</span>
                          <span className="font-medium">{vote.timeLeft}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2 bg-muted/20 pt-3">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleReject(vote.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="w-full" 
                      onClick={() => handleApprove(vote.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Vote className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No active voting requests</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  There are no active bus voting requests at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCompletedVotes.length > 0 ? (
            <div className="space-y-4">
              {filteredCompletedVotes.map((vote) => (
                <Card key={vote.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {vote.title}
                          {vote.outcome === 'approved' ? (
                            <ThumbsUp className="h-4 w-4 text-green-500 ml-2" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-500 ml-2" />
                          )}
                        </CardTitle>
                        <CardDescription>{vote.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="default"
                          className="bg-primary text-primary-foreground"
                        >{vote.region}</Badge>
                        {getStatusBadge(vote.outcome || '')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
                          Vote Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{vote.region} students:</span>
                            <span className="font-medium">{vote.voteBreakdown.sameRegion} × 1.0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Other students:</span>
                            <span className="font-medium">{vote.voteBreakdown.otherRegion} × 0.5</span>
                          </div>
                          <div className="col-span-2">
                            <div className="flex justify-between mt-1 text-sm font-medium">
                              <span>Total weighted votes:</span>
                              <span>{calculateWeightedVotes(vote).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm">{vote.studentCount} students voted</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-sm">Completed {formatDate(vote.completedAt)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Final votes: {calculateWeightedVotes(vote).toFixed(1)}/{vote.target}</span>
                          <span>{Math.round((calculateWeightedVotes(vote) / vote.target) * 100)}%</span>
                        </div>
                        <Progress 
                          value={100} 
                          className={`h-2 ${vote.outcome === "approved" ? "bg-green-500" : "bg-red-500"}`} 
                        />
                      </div>
                      
                      {vote.outcome === 'rejected' && vote.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm">
                          <strong className="text-red-700">Reason for rejection:</strong> 
                          <p className="text-red-600 mt-1">{vote.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Vote className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No completed requests found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  There are no completed voting requests matching your search.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Bus Request</DialogTitle>
            <DialogDescription>
              You are about to approve this bus request. Please assign a bus and driver for this route.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assign-bus" className="text-right">Assign Bus</Label>
              <Select
                onValueChange={(value) => setApprovalData({...approvalData, busId: value})}
                value={approvalData.busId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map(bus => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assign-driver" className="text-right">Assign Driver</Label>
              <Select
                onValueChange={(value) => setApprovalData({...approvalData, driverId: value})}
                value={approvalData.driverId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departure-time" className="text-right">Departure Time</Label>
              <Input 
                id="departure-time" 
                type="time" 
                className="col-span-3"
                value={approvalData.departureTime}
                onChange={(e) => setApprovalData({...approvalData, departureTime: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmApprove} 
              className="relative overflow-hidden group"
              disabled={!approvalData.busId || !approvalData.driverId || !approvalData.departureTime}
            >
              <span className="relative z-10">Approve Request</span>
              <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Bus Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this bus request. Students will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reject-reason" className="text-right">Reason</Label>
              <Textarea 
                id="reject-reason" 
                placeholder="Explain why this request is being rejected..." 
                className="col-span-3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
              className="relative overflow-hidden group"
            >
              <span className="relative z-10">Reject Request</span>
              <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CoordinatorVoting;
