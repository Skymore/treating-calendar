-- Enable Row Level Security for host_schedule table
ALTER TABLE public.host_schedule ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read host_schedule information
DROP POLICY IF EXISTS "Anyone can view host_schedule information" ON public.host_schedule;
CREATE POLICY "Anyone can view host_schedule information" 
  ON public.host_schedule 
  FOR SELECT 
  USING (true);

-- Allow team creators to insert host_schedule
DROP POLICY IF EXISTS "Only team creators can insert host_schedule" ON public.host_schedule;
CREATE POLICY "Only team creators can insert host_schedule" 
  ON public.host_schedule 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = host_schedule."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to update host_schedule
DROP POLICY IF EXISTS "Only team creators can update host_schedule" ON public.host_schedule;
CREATE POLICY "Only team creators can update host_schedule" 
  ON public.host_schedule 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = host_schedule."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to delete host_schedule
DROP POLICY IF EXISTS "Only team creators can delete host_schedule" ON public.host_schedule;
CREATE POLICY "Only team creators can delete host_schedule" 
  ON public.host_schedule 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = host_schedule."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  ); 