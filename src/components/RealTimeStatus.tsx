
import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeStatusProps {
  lastUpdated?: Date | null;
  resourceName?: string;
  className?: string;
  onRefresh?: () => void;
}

const RealTimeStatus = ({ 
  lastUpdated, 
  resourceName = 'Data', 
  className,
  onRefresh 
}: RealTimeStatusProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Update the time ago string every minute
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      
      if (diff < 60000) { // Less than a minute
        setTimeAgo('just now');
      } else if (diff < 3600000) { // Less than an hour
        const minutes = Math.floor(diff / 60000);
        setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else if (diff < 86400000) { // Less than a day
        const hours = Math.floor(diff / 3600000);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      } else {
        const days = Math.floor(diff / 86400000);
        setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      
      // Reset the refreshing state after animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
      
      // Trigger a realtime event for UI indication
      window.dispatchEvent(new CustomEvent('realtime-data-updated'));
    }
  };
  
  if (!lastUpdated) return null;
  
  return (
    <div className={cn("flex items-center text-xs text-muted-foreground", className)}>
      <Clock className="h-3 w-3 mr-1" />
      <span>{resourceName} updated {timeAgo}</span>
      
      {onRefresh && (
        <button 
          onClick={handleRefresh}
          className="ml-2 p-1 rounded-full hover:bg-muted transition-colors"
          disabled={isRefreshing}
          aria-label="Refresh data"
        >
          <RefreshCw 
            className={cn(
              "h-3 w-3", 
              isRefreshing && "animate-spin text-primary"
            )} 
          />
        </button>
      )}
    </div>
  );
};

export default RealTimeStatus;
