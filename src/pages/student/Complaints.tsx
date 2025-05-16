import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useComplaints } from "@/hooks/useComplaints";
import { useBuses } from "@/hooks/useBuses";
import { SubmitComplaintDialog } from "@/components/SubmitComplaintDialog";
import { MessageSquare, AlertCircle, CheckCircle, Clock, ClipboardList, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getComplaintTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'delay': 'Bus Delay',
    'cleanliness': 'Cleanliness Issue',
    'behavior': 'Staff Behavior',
    'safety': 'Safety Concern',
    'other': 'Other Issue'
  };
  return labels[type] || type;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case 'in_review':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Review</Badge>;
    case 'resolved':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'in_review':
      return <ClipboardList className="h-5 w-5 text-blue-500" />;
    case 'resolved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

const StudentComplaints = () => {
  const { complaints, submitComplaint, isLoading, isSubmitting } = useComplaints();
  const { buses } = useBuses();

  return (
    <DashboardLayout pageTitle="Complaints">
      <div className="mb-6">
        <Card className="border-t-4 border-t-primary overflow-hidden shadow-md transition-all hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">Bus Complaint System</h2>
                <p className="text-muted-foreground">
                  Submit complaints about any issues you've encountered with the bus service.
                  Our coordinators will review and address your concerns.
                </p>
              </div>
              <SubmitComplaintDialog
                onSubmit={async (data) => {
                  try {
                    const success = await submitComplaint(data);
                    if (success) {
                      return true; // This will trigger the dialog to close
                    }
                    return false;
                  } catch (error) {
                    console.error('Error submitting complaint:', error);
                    return false;
                  }
                }}
                isSubmitting={isSubmitting}
                buses={buses}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Complaints</h2>
          <Badge variant="outline" className="px-2 py-0">
            {complaints.length} {complaints.length === 1 ? 'complaint' : 'complaints'}
          </Badge>
        </div>
        
        {isLoading ? (
          <Card className="border border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading your complaints...</p>
            </CardContent>
          </Card>
        ) : complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(complaint.status)}
                      <div>
                        <CardTitle className="text-base">
                          {getComplaintTypeLabel(complaint.type)}
                          {complaint.busNumber && <span className="ml-2 text-sm font-normal text-muted-foreground">
                            Bus #{complaint.busNumber}
                          </span>}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {complaint.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(complaint.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(complaint.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{complaint.description}</p>
                  
                  {complaint.responses && complaint.responses.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium">Responses</h4>
                      {complaint.responses.map((response) => (
                        <div key={response.id} className="bg-muted/30 p-3 rounded-md">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{response.responderName}</span>
                            <span className="text-muted-foreground">{response.timeAgo}</span>
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                
                {complaint.status === 'resolved' && (
                  <CardFooter className="bg-green-50 border-t border-green-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">Resolved by coordinator</span>
                    </div>
                    <span className="text-xs text-green-600">
                      {formatDistanceToNow(complaint.createdAt, { addSuffix: true })}
                    </span>
                  </CardFooter>
                )}
                {complaint.status === 'rejected' && (
                  <CardFooter className="bg-red-50 border-t border-red-100">
                    <div className="flex items-start gap-2 w-full">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700">Your complaint was reviewed but could not be addressed.</p>
                        <p className="text-xs text-red-600 mt-1">
                          If you believe this was in error, please submit a new complaint with additional details.
                        </p>
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No complaints yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                You haven't submitted any complaints yet. If you encounter any issues with the bus service, 
                please submit a complaint and our team will address it.
              </p>
              <SubmitComplaintDialog
                onSubmit={async (data) => {
                  const success = await submitComplaint(data);
                  return success;
                }}
                isSubmitting={isSubmitting}
                buses={buses}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentComplaints;
