-- Enable Row Level Security for teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read team information
CREATE POLICY "Anyone can view team information" 
  ON public.teams 
  FOR SELECT 
  USING (true);

-- Allow team creators to update their team
CREATE POLICY "Only team creators can update team settings" 
  ON public.teams 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = teams."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to delete their team
CREATE POLICY "Only team creators can delete team" 
  ON public.teams 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = teams."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert teams (they become creators after)
CREATE POLICY "Authenticated users can create teams" 
  ON public.teams 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated'); 