import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { voteThresholdService } from './voteThresholdService';

/**
 * Sets up real-time listeners for various tables in the database.
 * This service centralizes real-time subscriptions and ensures 
 * that important changes are reported to the user immediately.
 */
export const setupRealtimeSubscriptions = () => {
  const debounceMap = new Map();
  const subscriptions = new Set();
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 5000; // 5 seconds

  const debounce = (key, fn, delay = 500) => {
    if (debounceMap.has(key)) {
      clearTimeout(debounceMap.get(key));
    }
    debounceMap.set(key, setTimeout(() => {
      fn();
      debounceMap.delete(key);
    }, delay));
  };

  const handleSubscriptionError = (channel: string, error: any) => {
    console.error(`Error in ${channel} subscription:`, error);
    toast.error(`Connection error in ${channel}. Attempting to reconnect...`);
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => {
        setupRealtimeSubscriptions();
      }, RECONNECT_DELAY);
    } else {
      toast.error('Failed to maintain real-time connection. Please refresh the page.');
    }
  };

  // Set up realtime subscription for bus changes
  const busSubscription = supabase
    .channel('bus_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'buses' 
    }, (payload) => {
      try {
        if (payload.eventType === 'UPDATE') {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Notify about driver assignments
          if (oldData?.assigned_driver !== newData.assigned_driver) {
            debounce(`bus-driver-${newData.id}`, () => {
              toast.info('A driver has been assigned to bus ' + newData.name);
            });
          }
          
          // Notify about status changes
          if (oldData?.status !== newData.status) {
            debounce(`bus-status-${newData.id}`, () => {
              const statusMessage = newData.status === 'active' 
                ? 'Bus ' + newData.name + ' is now active'
                : 'Bus ' + newData.name + ' is now ' + newData.status;
              
              toast.info(statusMessage);
            });
          }
          
          // Notify about route changes
          if (oldData?.route !== newData.route) {
            debounce(`bus-route-${newData.id}`, () => {
              toast.info('Route updated for bus ' + newData.name);
            });
          }

          // Trigger data refresh via custom event
          window.dispatchEvent(new CustomEvent('realtime-data-updated', { 
            detail: { type: 'bus', action: 'updated' } 
          }));
        }
        
        // New bus added
        if (payload.eventType === 'INSERT') {
          const newBus = payload.new as any;
          debounce(`bus-new-${newBus.id}`, () => {
            toast.success('New bus added: ' + newBus.name);
          });

          // Trigger data refresh
          window.dispatchEvent(new CustomEvent('realtime-data-updated', { 
            detail: { type: 'bus', action: 'created' } 
          }));
        }
      } catch (error) {
        handleSubscriptionError('bus_changes', error);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        subscriptions.add('bus_changes');
        reconnectAttempts = 0; // Reset reconnect attempts on successful subscription
      }
    });
  
  // Set up realtime subscription for profile changes
  const profileSubscription = supabase
    .channel('profile_changes')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'profiles' 
    }, (payload) => {
      const newProfile = payload.new as any;
      
      debounce(`profile-new-${newProfile.id}`, () => {
        if (newProfile.role === 'driver') {
          toast.success('New driver has been added to the system');
        } else if (newProfile.role === 'coordinator') {
          toast.success('New coordinator has been added to the system');
        } else if (newProfile.role === 'admin') {
          toast.success('New admin has been added to the system');
        }
      });

      // Trigger data refresh
      window.dispatchEvent(new CustomEvent('realtime-data-updated', { detail: { type: 'profile', action: 'created' } }));
    })
    .subscribe();
  
  // Set up realtime subscription for schedule changes
  const scheduleSubscription = supabase
    .channel('schedule_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'schedules' 
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        debounce('schedule-new', () => {
          toast.info('New bus schedule has been added');
        });
      } else if (payload.eventType === 'UPDATE') {
        debounce('schedule-updated', () => {
          toast.info('A bus schedule has been updated');
        });
      }

      // Trigger data refresh
      window.dispatchEvent(new CustomEvent('realtime-data-updated', { detail: { type: 'schedule', action: payload.eventType.toLowerCase() } }));
    })
    .subscribe();
  
  // Set up realtime subscription for complaint changes with faster response
  const complaintsSubscription = supabase
    .channel('complaints_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'complaints' 
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        debounce(`complaint-new-${(payload.new as any).id}`, () => {
          toast.info('New complaint has been submitted');
        }, 100); // Faster response for complaints
      } else if (payload.eventType === 'UPDATE' && 
                 payload.old && (payload.old as any).status !== (payload.new as any).status) {
        debounce(`complaint-status-${(payload.new as any).id}`, () => {
          toast.info(`Complaint status updated to ${(payload.new as any).status}`);
        }, 100);
      }

      // Immediate data refresh for complaints
      window.dispatchEvent(new CustomEvent('realtime-data-updated', { 
        detail: { type: 'complaint', action: payload.eventType.toLowerCase(), urgent: true } 
      }));
    })
    .subscribe();
    
  // Set up realtime subscription for notifications (used for complaint responses)
  const notificationsSubscription = supabase
    .channel('notifications_changes')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications' 
    }, (payload) => {
      const notification = payload.new as any;
      if (notification.type === 'complaint_response') {
        debounce(`notification-${notification.id}`, () => {
          toast.info('New response added to a complaint');
        }, 100);
      }

      // Fast refresh for new notifications
      window.dispatchEvent(new CustomEvent('realtime-data-updated', { 
        detail: { type: 'notification', action: 'created', urgent: true } 
      }));
    })
    .subscribe();

  // Set up realtime subscription for voting topics with faster updates
  const votingSubscription = supabase
    .channel('voting_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'voting_topics' 
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        debounce(`voting-new-${(payload.new as any).id}`, () => {
          toast.info('New bus voting request has been created');
        }, 200);
      } else if (payload.eventType === 'UPDATE') {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        
        if (oldData && oldData.status !== newData.status) {
          debounce(`voting-status-${newData.id}`, () => {
            if (newData.status === 'approved') {
              toast.success('A bus voting request has been approved');
            } else if (newData.status === 'rejected') {
              toast.error('A bus voting request has been rejected');
            } else if (newData.status === 'processing') {
              toast.info('Vote threshold reached! Processing driver assignment...');
            } else if (newData.status === 'driver_assigned') {
              toast.success('A driver has been assigned to the requested bus!');
            } else if (newData.status === 'pending_coordinator') {
              toast.info('Bus request escalated to coordinators for review');
            }
          }, 200);
        }
      }

      // Trigger voting data refresh
      window.dispatchEvent(new CustomEvent('realtime-data-updated', { 
        detail: { type: 'voting', action: payload.eventType.toLowerCase() } 
      }));
    })
    .subscribe();
  
  // Set up listener for vote threshold checks
  const thresholdCleanupHandler = voteThresholdService.setupVoteThresholdListener();
  
  return () => {
    // Cleanup all subscriptions
    subscriptions.forEach(channel => {
      supabase.channel(channel).unsubscribe();
    });
    subscriptions.clear();
    
    // Clear all debounced functions
    debounceMap.forEach((timeout) => clearTimeout(timeout));
    debounceMap.clear();
    
    thresholdCleanupHandler();
  };
};

/**
 * Enhances the application with real-time indicators.
 * This adds visual cues to the UI for immediate feedback on changes.
 */
export const enableRealtimeIndicators = () => {
  // Add a small indicator element to show when data is being refreshed
  const indicator = document.createElement('div');
  indicator.id = 'realtime-indicator';
  indicator.style.position = 'fixed';
  indicator.style.bottom = '20px';
  indicator.style.right = '20px';
  indicator.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
  indicator.style.color = 'white';
  indicator.style.padding = '8px 12px';
  indicator.style.borderRadius = '4px';
  indicator.style.fontSize = '12px';
  indicator.style.fontWeight = 'bold';
  indicator.style.zIndex = '9999';
  indicator.style.display = 'none';
  indicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  indicator.textContent = 'New data available!';
  
  document.body.appendChild(indicator);
  
  // Event handler for showing/hiding the indicator
  const showUpdateIndicator = (event) => {
    // Check if urgent flag is set
    const isUrgent = event.detail?.urgent || false;
    
    indicator.style.display = 'block';
    
    // Shorter display time for urgent updates
    setTimeout(() => {
      indicator.style.display = 'none';
    }, isUrgent ? 1500 : 3000);
  };
  
  // Create a custom event that components can trigger
  window.addEventListener('realtime-data-updated', showUpdateIndicator);
  
  return () => {
    if (document.body.contains(indicator)) {
      document.body.removeChild(indicator);
    }
    window.removeEventListener('realtime-data-updated', showUpdateIndicator);
  };
};
