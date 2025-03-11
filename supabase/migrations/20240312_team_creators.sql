-- Create a table to link Supabase auth users with teams
CREATE TABLE IF NOT EXISTS public.team_creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id TEXT NOT NULL,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure each team can only have one creator
  CONSTRAINT unique_team_creator UNIQUE (team_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.team_creators ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own team creator records
CREATE POLICY "Users can view their own team creator records" 
  ON public.team_creators 
  FOR SELECT 
  USING (auth.uid() = auth_user_id);

-- Allow users to insert their own team creator records
CREATE POLICY "Users can insert their own team creator records" 
  ON public.team_creators 
  FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow users to update their own team creator records
CREATE POLICY "Users can update their own team creator records" 
  ON public.team_creators 
  FOR UPDATE 
  USING (auth.uid() = auth_user_id);

-- Allow users to delete their own team creator records
CREATE POLICY "Users can delete their own team creator records" 
  ON public.team_creators 
  FOR DELETE 
  USING (auth.uid() = auth_user_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS team_creators_team_id_idx ON public.team_creators (team_id);
CREATE INDEX IF NOT EXISTS team_creators_auth_user_id_idx ON public.team_creators (auth_user_id); 