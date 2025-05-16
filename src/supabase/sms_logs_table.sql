
-- Create a table to log SMS notifications
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipients INTEGER NOT NULL,
  message TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
