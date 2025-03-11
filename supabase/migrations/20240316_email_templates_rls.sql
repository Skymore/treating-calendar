-- Enable Row Level Security for email_templates table
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read email_templates information
DROP POLICY IF EXISTS "Anyone can view email_templates information" ON public.email_templates;
CREATE POLICY "Anyone can view email_templates information" 
  ON public.email_templates 
  FOR SELECT 
  USING (true);

-- Allow team creators to insert email_templates
DROP POLICY IF EXISTS "Only team creators can insert email_templates" ON public.email_templates;
CREATE POLICY "Only team creators can insert email_templates" 
  ON public.email_templates 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = email_templates."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to update email_templates
DROP POLICY IF EXISTS "Only team creators can update email_templates" ON public.email_templates;
CREATE POLICY "Only team creators can update email_templates" 
  ON public.email_templates 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = email_templates."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  );

-- Allow team creators to delete email_templates
DROP POLICY IF EXISTS "Only team creators can delete email_templates" ON public.email_templates;
CREATE POLICY "Only team creators can delete email_templates" 
  ON public.email_templates 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.team_creators 
      WHERE team_creators.team_id = email_templates."userId" 
      AND team_creators.auth_user_id = auth.uid()
    )
  ); 