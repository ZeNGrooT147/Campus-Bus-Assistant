
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Bus, AlertCircle } from 'lucide-react';

interface NotificationProps {
  notification: {
    id: string;
    title: string;
    message: string;
    created_at: string;
    type: string;
    metadata: string;
  };
}

export function BusRequestStatusNotification({ notification }: NotificationProps) {
  // Parse the metadata
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
  const topicId = metadata.topic_id;
  const actionType = metadata.action_type;
  
  // Format creation time
  const createdAt = new Date(notification.created_at);
  const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = createdAt.toLocaleDateString();
  
  // Determine notification type
  const isApproved = notification.type === 'request_approved' || actionType === 'bus_allocated';
  const isRejected = notification.type === 'request_rejected' || actionType === 'bus_cancelled';
  
  // Set styling based on notification type
  const borderColor = isApproved 
    ? 'border-l-green-500' 
    : isRejected 
      ? 'border-l-red-500' 
      : 'border-l-blue-500';
      
  const icon = isApproved 
    ? <Check className="h-4 w-4 text-green-500" /> 
    : isRejected 
      ? <X className="h-4 w-4 text-red-500" /> 
      : <AlertCircle className="h-4 w-4 text-blue-500" />;
      
  const badgeVariant = isApproved 
    ? 'bg-green-100 text-green-800 border-green-300' 
    : isRejected 
      ? 'bg-red-100 text-red-800 border-red-300' 
      : 'bg-blue-100 text-blue-800 border-blue-300';
      
  const badgeText = isApproved 
    ? 'Approved' 
    : isRejected 
      ? 'Cancelled' 
      : 'Pending';

  return (
    <Card className={`w-full border-l-4 ${borderColor} shadow-md mb-4 animate-fadeIn`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold flex items-center">
              {icon}
              <span className="ml-2">{notification.title}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                <span>{timeString} · {dateString}</span>
              </div>
            </CardDescription>
          </div>
          <Badge variant="outline" className={badgeVariant}>
            <Bus className="h-3 w-3 mr-1" />
            {badgeText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{notification.message}</p>
      </CardContent>
    </Card>
  );
}
