-- Enable Row Level Security for personnel table
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read personnel information
DROP POLICY IF EXISTS "Anyone can view personnel information" ON public.personnel;
CREATE POLICY "Anyone can view personnel information" 
  ON public.personnel 
  FOR SELECT 
  USING (true);

-- Allow team creators to insert personnel
DROP POLICY IF EXISTS "Only team creators can insert personnel" ON public.personnel;
CREATE POLICY "Only team creators can insert personnel" 
  ON public.personnel 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = personnel."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to update personnel
DROP POLICY IF EXISTS "Only team creators can update personnel" ON public.personnel;
CREATE POLICY "Only team creators can update personnel" 
  ON public.personnel 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = personnel."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to delete personnel
DROP POLICY IF EXISTS "Only team creators can delete personnel" ON public.personnel;
CREATE POLICY "Only team creators can delete personnel" 
  ON public.personnel 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = personnel."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  ); 