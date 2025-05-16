-- Add region column to routes table
ALTER TABLE routes ADD COLUMN region TEXT NOT NULL DEFAULT 'dharwad';

-- Update existing routes to have a default region
UPDATE routes SET region = 'dharwad' WHERE region IS NULL;

-- Add a check constraint to ensure region is one of the valid values
ALTER TABLE routes ADD CONSTRAINT valid_region CHECK (region IN ('dharwad', 'hubli', 'belgaum', 'gadag')); 