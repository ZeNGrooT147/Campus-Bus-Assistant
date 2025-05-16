-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (minimal version for voting)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    region TEXT DEFAULT 'Dharwad Region',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create voting_topics table
CREATE TABLE IF NOT EXISTS voting_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    bus_id TEXT,
    route_id TEXT,
    schedule_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create voting_options table
CREATE TABLE IF NOT EXISTS voting_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES voting_topics(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES voting_topics(id) ON DELETE CASCADE,
    option_id UUID REFERENCES voting_options(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(topic_id, student_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Voting topics policies
CREATE POLICY "Voting topics are viewable by everyone"
    ON voting_topics FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create voting topics"
    ON voting_topics FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Voting options policies
CREATE POLICY "Voting options are viewable by everyone"
    ON voting_options FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create voting options"
    ON voting_options FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
    ON votes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create votes"
    ON votes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can only vote once per topic"
    ON votes FOR INSERT
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM votes
            WHERE topic_id = NEW.topic_id
            AND student_id = auth.uid()
        )
    );

-- Create function for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voting_topics_status ON voting_topics(status);
CREATE INDEX IF NOT EXISTS idx_votes_topic_id ON votes(topic_id);
CREATE INDEX IF NOT EXISTS idx_votes_student_id ON votes(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region); 