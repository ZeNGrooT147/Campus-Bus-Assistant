-- Add telegram_id column to profiles table
ALTER TABLE profiles
ADD COLUMN telegram_id TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.telegram_id IS 'Telegram chat ID for notifications';

-- Create index for faster lookups
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);

-- Add RLS policy for telegram_id
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram_id"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own telegram_id"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); 