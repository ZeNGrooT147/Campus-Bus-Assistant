import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import axios from 'axios';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

// Type assertion for supabase client
const typedSupabase = supabase as SupabaseClient;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Telegram configuration
const TELEGRAM_BOT_TOKEN = "7742027749:AAENTZ012O5SiGto0M0QMJhm-xSbtiFZETY";
const TELEGRAM_CHAT_IDS = [
  "1146747265",  // Suhas (Bus Coordinator)
  // Add more chat IDs as needed
];

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation(operation, retries - 1, delay);
  }
}

// Function to send alerts via Telegram
async function sendTelegramEmergencyAlert(
  alertType: string,
  latitude: number | null,
  longitude: number | null,
  emergencyContact: string | null,
  additionalInfo?: Record<string, any>
) {
  try {
    // Validate location data
    if (!latitude || !longitude) {
      console.error("Missing location data for alert!");
      return false;
    }

    // Create different message formats based on alert type
    let message = '';
    if (alertType === 'Emergency') {
      message = `EMERGENCY ALERT\n\n` +
        `Type: ${additionalInfo?.emergency_type || 'Emergency'}\n` +
        `Bus: ${additionalInfo?.bus_number || 'Not Specified'}\n` +
        `Location: https://maps.google.com/?q=${latitude},${longitude}\n` +
        `Contact: ${emergencyContact || "Not Provided"}\n\n` +
        `Instructions:\n` +
        `1. Proceed to location immediately\n` +
        `2. Follow Google Maps link\n` +
        `3. Contact emergency number\n` +
        `4. Wait for coordinator\n\n` +
        `Info:\n` +
        `Time: ${new Date().toLocaleTimeString()}\n` +
        `Priority: ${additionalInfo?.priority || 'High'}\n` +
        `Route: ${additionalInfo?.route || 'Not Specified'}`;
    } else if (alertType === 'Overcrowding') {
      message = `BUS OVERCROWDING ALERT\n\n` +
        `Type: Overcrowding\n` +
        `Bus: ${additionalInfo?.bus_number || 'Not Specified'}\n` +
        `Location: https://maps.google.com/?q=${latitude},${longitude}\n` +
        `Passengers: ${additionalInfo?.current_passengers || 0}/${additionalInfo?.capacity || 0}\n\n` +
        `Instructions:\n` +
        `1. Proceed to next stop\n` +
        `2. No additional passengers\n` +
        `3. Inform about next bus\n` +
        `4. Contact coordinator if needed\n\n` +
        `Info:\n` +
        `Time: ${new Date().toLocaleTimeString()}\n` +
        `Route: ${additionalInfo?.route || 'Not Specified'}\n` +
        `Votes: ${additionalInfo?.votes_received || 0}/${additionalInfo?.required_votes || 0}`;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Send to all configured chat IDs
    const sendPromises = TELEGRAM_CHAT_IDS.map(async (chatId) => {
      try {
        const data = {
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true
        };

        console.log('Sending Telegram message:', {
          chat_id: chatId,
          message_length: message.length
        });

        const response = await axios.post(url, data);
        console.log('Telegram API Response:', response.data);
        return true;
      } catch (error: any) {
        console.error('Telegram API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const success = results.some(result => result === true);
    
    if (!success) {
      throw new Error('Failed to send alert to any recipient');
    }
    
    return true;
  } catch (error: any) {
    console.error('Error in sendTelegramEmergencyAlert:', {
      message: error.message,
      response: error.response?.data
    });
    return false;
  }
}

// Function to check if there are any driver requests that have expired
export async function checkExpiredDriverRequests() {
  try {
    // Get the current time in the format the function expects
    const currentTime = new Date().toISOString();

    // Call the database function to get expired driver requests with retry logic
    const { data, error } = await retryOperation(async () => {
      const result = await supabase
        .rpc('get_expired_driver_requests', { 
          p_current_time: currentTime 
        });
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      // Process expired requests with error handling for each
      await Promise.allSettled(
        data.map(async (request: any) => {
          try {
            await sendNotificationForExpiredRequest(request);
            
            // Send emergency alert for expired requests
            if (request.emergency_level === 'high') {
              await sendTelegramEmergencyAlert(
                'Expired Driver Request - High Priority',
                request.latitude,
                request.longitude,
                request.emergency_contact,
                {
                  bus_number: request.bus_number,
                  priority: 'High',
                  route: request.route,
                  request_id: request.id,
                  title: request.title,
                  expired_at: request.expired_at,
                  bus_details: request.bus_details
                }
              );
            }
          } catch (error) {
            console.error(`Error processing expired request ${request.id}:`, error);
            // Continue processing other requests even if one fails
          }
        })
      );
      return data;
    }

    return [];

  } catch (error) {
    console.error('Error checking expired requests:', error);
    toast.error('Failed to check expired driver requests. Please try again later.');
    return [];
  }
}

async function sendNotificationForExpiredRequest(request: any) {
  try {
    // Create a notification for the expired request
    toast.error(`Driver Request Expired: Request "${request.title}" has expired without response.`);

    // Create a notification in the database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: request.user_id,
        title: 'Driver Request Expired',
        message: `Your request "${request.title}" has expired without response.`,
        type: 'request_expired',
        metadata: {
          request_id: request.id,
          expired_at: new Date().toISOString()
        }
      });

    if (notificationError) {
      throw notificationError;
    }
  } catch (error) {
    console.error('Error sending notification for expired request:', error);
    throw error;
  }
}

// Export function for SMS notifications with retry logic
export async function sendSMSNotification(userIds: string[], message: string) {
  try {
    // Call Supabase edge function to send SMS with retry logic
    const { data, error } = await retryOperation(async () => {
      const result = await supabase.functions.invoke('send-sms', {
        body: { 
          user_ids: userIds,
          message: message
        }
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    });
    
    if (error) {
      throw error;
    }
    
    // Log the SMS sending for audit purposes
    try {
      await retryOperation(async () => {
        const { error: logError } = await supabase.from('notifications').insert(
          userIds.map(userId => ({
            user_id: userId,
            title: 'SMS Notification Sent',
            message: message,
            type: 'sms_log',
            metadata: {
              message_content: message,
              status: 'sent',
              sent_at: new Date().toISOString()
            }
          }))
        );
        
        if (logError) {
          throw logError;
        }
      });
    } catch (logError) {
      console.error('Error logging SMS activity:', logError);
      // Continue execution even if logging fails
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendSMSNotification:', error);
    toast.error('Failed to send SMS notification. Please try again later.');
    return false;
  }
}

// Define database types
interface Vote {
  id: string;
  bus_id: string;
  student_id: string;
  reason: string;
  created_at: string;
}

interface Bus {
  id: string;
  bus_number: string;
  name: string;
  route: string;
  route_id: string;
  status: string;
  current_location: string;
  current_passengers: number;
  capacity: number;
  assigned_driver: string;
  driver_contact: string;
  current_latitude: number;
  current_longitude: number;
  required_votes: number;
  created_at: string;
  updated_at: string;
}

// Function to check vote threshold and trigger alert
export async function checkVoteThresholdAndAlert(busId: string, requiredVotes: number) {
  try {
    // Get current votes for the bus
    const { data: votes, error: voteError } = await typedSupabase
      .from('votes')
      .select('*')
      .eq('bus_id', busId);

    if (voteError) {
      throw voteError;
    }

    const typedVotes = votes as Vote[];

    // Get bus details
    const { data: bus, error: busError } = await typedSupabase
      .from('buses')
      .select('*')
      .eq('id', busId)
      .single();

    if (busError || !bus) {
      throw busError || new Error('Bus not found');
    }

    const typedBus = bus as Bus;

    // Check if threshold is reached
    if (typedVotes && typedVotes.length >= requiredVotes) {
      console.log(`Vote threshold reached for bus ${busId}: ${typedVotes.length}/${requiredVotes} votes`);
      
      // Determine alert type based on vote reason
      const voteReason = typedVotes[0]?.reason || '';
      const isEmergency = voteReason.toLowerCase().includes('emergency');
      
      // Send appropriate alert
      await sendTelegramEmergencyAlert(
        isEmergency ? 'Emergency' : 'Overcrowding',
        typedBus.current_latitude,
        typedBus.current_longitude,
        typedBus.driver_contact,
        {
          bus_number: typedBus.bus_number,
          priority: isEmergency ? 'High' : 'Medium',
          route: typedBus.route,
          votes_received: typedVotes.length,
          required_votes: requiredVotes,
          current_passengers: typedBus.current_passengers,
          capacity: typedBus.capacity,
          emergency_type: isEmergency ? voteReason : undefined
        }
      );

      // Update bus status
      await typedSupabase
        .from('buses')
        .update({ 
          status: isEmergency ? 'emergency' : 'overcrowded',
          last_updated: new Date().toISOString()
        })
        .eq('id', busId);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking vote threshold:', error);
    return false;
  }
}

// Setup a vote threshold listener with error handling
export function setupVoteThresholdListener() {
  let isChecking = false;
  
  const checkInterval = setInterval(async () => {
    if (isChecking) return; // Prevent concurrent checks
    
    try {
      isChecking = true;
      // Check expired requests
      await checkExpiredDriverRequests();
      
      // Check vote thresholds for all buses
      const { data: buses, error } = await typedSupabase
        .from('buses')
        .select('id, required_votes');

      if (error) {
        throw error;
      }

      const typedBuses = buses as Pick<Bus, 'id' | 'required_votes'>[];
      
      if (typedBuses) {
        await Promise.all(
          typedBuses.map(bus => 
            checkVoteThresholdAndAlert(bus.id, bus.required_votes)
          )
        );
      }
    } catch (error) {
      console.error('Error in vote threshold check:', error);
    } finally {
      isChecking = false;
    }
  }, 60000); // Check every minute
  
  return () => {
    clearInterval(checkInterval);
  };
}

// Export the entire service as an object for importing in realTimeService
export const voteThresholdService = {
  checkExpiredDriverRequests,
  setupVoteThresholdListener,
  sendSMSNotification,
  sendTelegramEmergencyAlert
};
