import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface EmailTemplate {
  id: string;
  template_type: 'host_notification' | 'team_notification';
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  created_at: string;
  updated_at: string;
}

interface UseEmailTemplateReturn {
  /**
   * Host notification template
   */
  hostTemplate: EmailTemplate | null;
  
  /**
   * Team notification template
   */
  teamTemplate: EmailTemplate | null;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error message if any
   */
  error: string | null;
  
  /**
   * Update host notification template
   */
  updateHostTemplate: (subject: string, htmlContent: string, textContent?: string) => Promise<void>;
  
  /**
   * Update team notification template
   */
  updateTeamTemplate: (subject: string, htmlContent: string, textContent?: string) => Promise<void>;
  
  /**
   * Reset templates to default
   */
  resetTemplates: () => Promise<void>;
}

/**
 * Hook for managing email templates
 */
export function useEmailTemplate(): UseEmailTemplateReturn {
  const [hostTemplate, setHostTemplate] = useState<EmailTemplate | null>(null);
  const [teamTemplate, setTeamTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch templates from database
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch host notification template
      const { data: hostData, error: hostError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', 'host_notification')
        .single();
      
      if (hostError && hostError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw hostError;
      }
      
      // Fetch team notification template
      const { data: teamData, error: teamError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', 'team_notification')
        .single();
      
      if (teamError && teamError.code !== 'PGRST116') {
        throw teamError;
      }
      
      // Set templates
      if (hostData) {
        setHostTemplate(hostData as EmailTemplate);
      }
      
      if (teamData) {
        setTeamTemplate(teamData as EmailTemplate);
      }
      
      // If templates don't exist in database, create default ones
      if (!hostData || !teamData) {
        await createDefaultTemplates();
      }
    } catch (err) {
      console.error('Error fetching email templates:', err);
      setError('Failed to fetch email templates');
    } finally {
      setLoading(false);
    }
  };
  
  // Create default templates if they don't exist
  const createDefaultTemplates = async () => {
    try {
      // Default host template
      if (!hostTemplate) {
        const { data: hostData, error: hostError } = await supabase
          .from('email_templates')
          .insert({
            template_type: 'host_notification',
            template_name: 'Default Host Notification',
            subject: 'Reminder: You are scheduled to treat the team on {date}',
            html_content: `<p>Dear {name},</p>
<p>This is a friendly reminder that you are scheduled to treat the team on <strong>{date}</strong> (Thursday).</p>
<p>Please make necessary preparations. If you have any questions or cannot fulfill this duty on the scheduled date, please contact the team lead as soon as possible to arrange an alternative.</p>
<p>Thank you for your cooperation!</p>`,
            text_content: `Dear {name},

This is a friendly reminder that you are scheduled to treat the team on {date} (Thursday).

Please make necessary preparations. If you have any questions or cannot fulfill this duty on the scheduled date, please contact the team lead as soon as possible to arrange an alternative.

Thank you for your cooperation!`
          })
          .select()
          .single();
        
        if (hostError) throw hostError;
        if (hostData) setHostTemplate(hostData as EmailTemplate);
      }
      
      // Default team template
      if (!teamTemplate) {
        const { data: teamData, error: teamError } = await supabase
          .from('email_templates')
          .insert({
            template_type: 'team_notification',
            template_name: 'Default Team Notification',
            subject: 'Team Notification: Treating Schedule for {date}',
            html_content: `<p>Dear Team Members,</p>
<p>This is a friendly reminder that <strong>{name}</strong> is scheduled to treat the team on <strong>{date}</strong> (Thursday).</p>
<p>Please remember to join!</p>
<p>Have a great day!</p>`,
            text_content: `Dear Team Members,

This is a friendly reminder that {name} is scheduled to treat the team on {date} (Thursday).

Please remember to join!

Have a great day!`
          })
          .select()
          .single();
        
        if (teamError) throw teamError;
        if (teamData) setTeamTemplate(teamData as EmailTemplate);
      }
    } catch (err) {
      console.error('Error creating default templates:', err);
      setError('Failed to create default templates');
    }
  };
  
  // Update host template
  const updateHostTemplate = async (subject: string, htmlContent: string, textContent?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!hostTemplate) {
        // Create new template if it doesn't exist
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            template_type: 'host_notification',
            template_name: 'Host Notification',
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) setHostTemplate(data as EmailTemplate);
      } else {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', hostTemplate.id)
          .select()
          .single();
        
        if (error) throw error;
        if (data) setHostTemplate(data as EmailTemplate);
      }
    } catch (err) {
      console.error('Error updating host template:', err);
      setError('Failed to update host template');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update team template
  const updateTeamTemplate = async (subject: string, htmlContent: string, textContent?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!teamTemplate) {
        // Create new template if it doesn't exist
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            template_type: 'team_notification',
            template_name: 'Team Notification',
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) setTeamTemplate(data as EmailTemplate);
      } else {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', teamTemplate.id)
          .select()
          .single();
        
        if (error) throw error;
        if (data) setTeamTemplate(data as EmailTemplate);
      }
    } catch (err) {
      console.error('Error updating team template:', err);
      setError('Failed to update team template');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset templates to default
  const resetTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Delete existing templates
      if (hostTemplate) {
        await supabase
          .from('email_templates')
          .delete()
          .eq('id', hostTemplate.id);
      }
      
      if (teamTemplate) {
        await supabase
          .from('email_templates')
          .delete()
          .eq('id', teamTemplate.id);
      }
      
      // Set templates to null to trigger creation of default templates
      setHostTemplate(null);
      setTeamTemplate(null);
      
      // Create default templates
      await createDefaultTemplates();
    } catch (err) {
      console.error('Error resetting templates:', err);
      setError('Failed to reset templates');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  return {
    hostTemplate,
    teamTemplate,
    loading,
    error,
    updateHostTemplate,
    updateTeamTemplate,
    resetTemplates,
  };
} 