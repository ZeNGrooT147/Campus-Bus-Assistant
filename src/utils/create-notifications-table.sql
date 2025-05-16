
-- Since we're using the alerts table instead of creating a notifications table,
-- we can simplify this SQL script for alerts setup. 
-- This is kept for reference but we'll use the alerts table which already exists.

/*
-- Notifications table for system-wide notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IS NULL
  );

-- Policy to allow users to mark their notifications as read
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Create updated_at trigger for notifications
CREATE TRIGGER set_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Insert some example notifications
INSERT INTO public.notifications (title, message, type)
VALUES 
  ('System Update', 'The Campus Bus Assistant system will be undergoing maintenance tonight at 10 PM.', 'info'),
  ('New Feature', 'Bus tracking is now available on the student dashboard!', 'success'),
  ('Important Announcement', 'All buses will be delayed by 30 minutes tomorrow due to road work.', 'warning');
*/

-- If we need to ensure the alerts table has the necessary fields for our notification system,
-- we can run the following command to insert sample alerts

INSERT INTO public.alerts (title, message, severity)
VALUES 
  ('System Update', 'The Campus Bus Assistant system will be undergoing maintenance tonight at 10 PM.', 'info'),
  ('New Feature', 'Bus tracking is now available on the student dashboard!', 'success'),
  ('Important Announcement', 'All buses will be delayed by 30 minutes tomorrow due to road work.', 'warning');
