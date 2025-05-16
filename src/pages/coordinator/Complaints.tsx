import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast.tsx";
import { AlertTriangle, Check, Clock, Search, MessageSquare, XCircle, User, Bus, Calendar, Loader } from "lucide-react";
import { useCoordinatorComplaints } from "@/hooks/useCoordinatorComplaints";
import RealTimeStatus from "@/components/RealTimeStatus";
import { useNavigate } from "react-router-dom";

const CoordinatorComplaints = () => {
  const navigate = useNavigate();
  const { 
    complaints, 
    isLoading, 
    addResponse, 
    updateComplaintStatus,
    fetchComplaints
  } = useCoordinatorComplaints();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [viewComplaintDialogOpen, setViewComplaintDialogOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  
  const handleViewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
    setViewComplaintDialogOpen(true);
  };
  
  const handleOpenResponseDialog = (complaint: any) => {
    if (complaint.status === 'resolved' || complaint.status === 'rejected') {
      toast.error('Cannot respond to a resolved or rejected complaint');
      return;
    }
    setSelectedComplaint(complaint);
    setResponseDialogOpen(true);
    setResponseText("");
  };
  
  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedComplaint) {
      toast.error('Please enter a response');
      return;
    }
    
    setIsResponding(true);
    try {
      const success = await addResponse(selectedComplaint.id, responseText);
      if (success) {
        toast.success('Response sent successfully');
        setResponseText("");
        setResponseDialogOpen(false);
        setViewComplaintDialogOpen(false);
        await fetchComplaints();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };
  
  const handleRejectComplaint = async (complaintId: string) => {
    setIsRejecting(true);
    setViewComplaintDialogOpen(false);
    try {
      const success = await updateComplaintStatus(complaintId, 'rejected', 'Complaint rejected by coordinator');
      if (success) {
        toast.success('Complaint rejected successfully');
        await fetchComplaints();
      }
    } catch (error) {
      console.error('Error rejecting complaint:', error);
      toast.error('Failed to reject complaint');
    } finally {
      setIsRejecting(false);
    }
  };
  
  const handleResolveComplaint = async (complaintId: string) => {
    setIsResolving(true);
    setViewComplaintDialogOpen(false);
    try {
      const success = await updateComplaintStatus(complaintId, 'resolved', 'Complaint resolved by coordinator');
      if (success) {
        toast.success('Complaint resolved successfully');
        await fetchComplaints();
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint');
    } finally {
      setIsResolving(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> In Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> Resolved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  const filteredComplaints = complaints.filter(complaint => 
    complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complaint.busName && complaint.busName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    complaint.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const pendingComplaints = filteredComplaints.filter(complaint => complaint.status === "pending" || complaint.status === "in_progress");
  const resolvedComplaints = filteredComplaints.filter(complaint => complaint.status === "resolved" || complaint.status === "rejected");

  return (
    <DashboardLayout pageTitle="Complaint Management">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
              Complaint Management
            </CardTitle>
            <CardDescription>
              Review and respond to complaints submitted by students
            </CardDescription>
            <RealTimeStatus 
              lastUpdated={new Date()}
              resourceName="Complaints data" 
              onRefresh={fetchComplaints}
              className="mt-2" 
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search complaints..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Total Complaints</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{complaints.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Pending</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{complaints.filter(c => c.status === "pending").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">In Review</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{complaints.filter(c => c.status === "in_progress").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Resolved</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl font-bold">{complaints.filter(c => c.status === "resolved" || c.status === "rejected").length}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="pending">Pending Complaints</TabsTrigger>
            <TabsTrigger value="resolved">Resolved Complaints</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending & In Review Complaints</CardTitle>
                <CardDescription>
                  Complaints requiring your attention and action
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingComplaints.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingComplaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="font-medium">{complaint.title}</TableCell>
                          <TableCell>{complaint.busName || "N/A"}</TableCell>
                          <TableCell>{complaint.studentName.split(" ")[0]}</TableCell>
                          <TableCell>{complaint.dateCreated}</TableCell>
                          <TableCell>{getPriorityBadge(complaint.priority || 'low')}</TableCell>
                          <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewComplaint(complaint)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-3">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">No pending complaints</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      All complaints have been addressed. Great job!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved">
            <Card>
              <CardHeader>
                <CardTitle>Resolved Complaints</CardTitle>
                <CardDescription>
                  Previously addressed and resolved complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : resolvedComplaints.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead>Date Resolved</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedComplaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="font-medium">{complaint.title}</TableCell>
                          <TableCell>{complaint.busName || "N/A"}</TableCell>
                          <TableCell>{complaint.studentName.split(" ")[0]}</TableCell>
                          <TableCell>{complaint.dateCreated}</TableCell>
                          <TableCell>{complaint.dateResolved || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewComplaint(complaint)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No resolved complaints</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      There are no resolved complaints matching your search criteria.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedComplaint && (
          <Dialog open={viewComplaintDialogOpen} onOpenChange={setViewComplaintDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {selectedComplaint.title}
                  <span className="ml-2">
                    {getStatusBadge(selectedComplaint.status)}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Submitted {selectedComplaint.dateCreated}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Student</Label>
                    <div className="flex items-center text-sm mt-1 border rounded-md p-2">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedComplaint.studentName}</span>
                    </div>
                  </div>
                  
                  {selectedComplaint.busName && (
                    <div>
                      <Label className="text-sm">Bus</Label>
                      <div className="flex items-center text-sm mt-1 border rounded-md p-2">
                        <Bus className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedComplaint.busName} ({selectedComplaint.busNumber})</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm">Priority</Label>
                    <div className="flex items-center text-sm mt-1 border rounded-md p-2">
                      {getPriorityBadge(selectedComplaint.priority || 'low')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm">Description</Label>
                  <div className="mt-1 text-sm border rounded-md p-3 whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </div>
                </div>
                
                {selectedComplaint.responses && selectedComplaint.responses.length > 0 && (
                  <div>
                    <Label className="text-sm">Responses</Label>
                    <div className="mt-1 space-y-3">
                      {selectedComplaint.responses.map((response: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{response.responderName}</span>
                            <span className="text-muted-foreground">{response.timeAgo}</span>
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-between mt-4">
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
                
                {(selectedComplaint.status === 'pending' || selectedComplaint.status === 'in_progress') && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectComplaint(selectedComplaint.id)}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      disabled={isRejecting}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isRejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleOpenResponseDialog(selectedComplaint)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      disabled={isResponding}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {isResponding ? 'Responding...' : 'Respond'}
                    </Button>
                    <Button 
                      onClick={() => handleResolveComplaint(selectedComplaint.id)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isResolving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isResolving ? 'Resolving...' : 'Resolve'}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={responseDialogOpen} onOpenChange={(open) => {
          setResponseDialogOpen(open);
          if (!open) {
            setResponseText("");
            setSelectedComplaint(null);
            setIsResponding(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Complaint</DialogTitle>
              <DialogDescription>
                Your response will be visible to the student who submitted the complaint.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="text-sm font-medium">Complaint Details</h4>
                <p className="text-sm mt-1">{selectedComplaint?.description}</p>
              </div>
              <Textarea 
                placeholder="Type your response here..." 
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[120px]"
                disabled={isResponding}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setResponseDialogOpen(false)}
                disabled={isResponding}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitResponse} 
                disabled={!responseText.trim() || isResponding}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {isResponding ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Response'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorComplaints;
