import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const { userIds, message, smsProvider = 'console' } = await req.json();

    if (!userIds || !Array.isArray(userIds) || !message) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the phone numbers for the specified users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, phone')
      .in('id', userIds)
      .not('phone', 'is', null);

    if (usersError) {
      console.error('Error fetching user phone numbers:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user phone numbers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phoneNumbers = users
      .filter(user => user.phone)
      .map(user => user.phone);

    if (phoneNumbers.length === 0) {
      console.log('No valid phone numbers found for the specified users');
      return new Response(
        JSON.stringify({ success: false, message: 'No valid phone numbers found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    
    // Choose SMS provider based on the parameter or env variable
    switch (smsProvider) {
      case 'twilio':
        // This would be a real implementation with Twilio
        result = await sendTwilioSMS(phoneNumbers, message);
        break;
      
      case 'custom':
        // Custom SMS provider implementation
        result = await sendCustomSMS(phoneNumbers, message);
        break;
      
      case 'console':
      default:
        // For development, just log the SMS
        console.log(`[SMS] Would send to ${phoneNumbers.join(', ')}: ${message}`);
        result = { success: true, provider: 'console', recipients: phoneNumbers.length };
        break;
    }

    // Log the SMS attempt to the database for record-keeping
    await supabase.from('sms_logs').insert({
      recipients: phoneNumbers.length,
      message: message,
      success: result.success,
      provider: smsProvider,
      metadata: JSON.stringify(result)
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Implementation for Twilio SMS (would need Twilio API keys in a real setup)
async function sendTwilioSMS(phoneNumbers: string[], message: string) {
  try {
    console.log(`[Twilio] Would send to ${phoneNumbers.join(', ')}: ${message}`);
    // In a real implementation, this would call the Twilio API
    return { success: true, provider: 'twilio', recipients: phoneNumbers.length };
  } catch (error) {
    console.error('Error sending Twilio SMS:', error);
    return { success: false, provider: 'twilio', error: error.message };
  }
}

// Implementation for a custom SMS provider
async function sendCustomSMS(phoneNumbers: string[], message: string) {
  try {
    console.log(`[Custom] Would send to ${phoneNumbers.join(', ')}: ${message}`);
    // In a real implementation, this would call a custom SMS API
    return { success: true, provider: 'custom', recipients: phoneNumbers.length };
  } catch (error) {
    console.error('Error sending custom SMS:', error);
    return { success: false, provider: 'custom', error: error.message };
  }
}
