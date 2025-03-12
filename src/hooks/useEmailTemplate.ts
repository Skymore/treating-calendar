import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../lib/userIdUtils';

// 跟踪模板创建操作的Promise
let templateCreatePromise: Record<string, Promise<void>> = {};

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
      const userId = getUserId();
      console.log('Fetching email templates for userId:', userId);
      
      // 一次性获取所有模板
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('userId', userId);
      
      if (templatesError) {
        throw templatesError;
      }
      
      // 处理结果
      if (templates && templates.length > 0) {
        // 找到对应类型的模板
        const hostTpl = templates.find(t => t.template_type === 'host_notification');
        const teamTpl = templates.find(t => t.template_type === 'team_notification');
        
        if (hostTpl) setHostTemplate(hostTpl as EmailTemplate);
        if (teamTpl) setTeamTemplate(teamTpl as EmailTemplate);
        
        // 如果缺少任一模板，创建默认模板
        if (!hostTpl || !teamTpl) {
          await createDefaultTemplates();
        }
      } else {
        // 没有找到任何模板，创建默认模板
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
    const userId = getUserId();
    const cacheKey = `templates_${userId}`;
    
    // 如果已经有一个正在进行的创建操作，等待它完成
    if (cacheKey in templateCreatePromise) {
      console.log('Already creating email templates for userId:', userId, 'waiting for completion');
      return templateCreatePromise[cacheKey];
    }
    
    // 创建新的Promise并保存到缓存
    templateCreatePromise[cacheKey] = (async () => {
      try {
        console.log('Creating default email templates for userId:', userId);
        
        // 检查模板是否已存在
        const { data: existingTemplates, error: checkError } = await supabase
          .from('email_templates')
          .select('template_type')
          .eq('userId', userId);
          
        if (checkError) throw checkError;
        
        const existingTypes = new Set(existingTemplates?.map(t => t.template_type) || []);
        
        // Default host template
        if (!existingTypes.has('host_notification')) {
          const { data: hostData, error: hostError } = await supabase
            .from('email_templates')
            .insert({
              template_type: 'host_notification',
              template_name: 'Default Host Notification',
              subject: 'Reminder: You are scheduled to bring breakfast for the team on {date}',
              html_content: `<p>Dear {name},</p>
<p>This is a friendly reminder that you are scheduled to bring breakfast for the team on <strong>{date}</strong> (Thursday morning).</p>
<p>Please make necessary preparations. If you have any questions or cannot fulfill this duty on the scheduled date, please contact the team lead as soon as possible to arrange an alternative.</p>
<p>Thank you for your cooperation!</p>`,
              text_content: `Dear {name},

This is a friendly reminder that you are scheduled to bring breakfast for the team on {date} (Thursday morning).

Please make necessary preparations. If you have any questions or cannot fulfill this duty on the scheduled date, please contact the team lead as soon as possible to arrange an alternative.

Thank you for your cooperation!`,
              userId,
            })
            .select()
            .maybeSingle();
          
          if (hostError) throw hostError;
          if (hostData) setHostTemplate(hostData as EmailTemplate);
          console.log('Host template created');
        }
        
        // Default team template
        if (!existingTypes.has('team_notification')) {
          const { data: teamData, error: teamError } = await supabase
            .from('email_templates')
            .insert({
              template_type: 'team_notification',
              template_name: 'Default Team Notification',
              subject: 'Team Notification: Breakfast Schedule for {date}',
              html_content: `<p>Dear Team Members,</p>
<p>This is a friendly reminder that <strong>{name}</strong> is scheduled to bring breakfast for the team on <strong>{date}</strong> (Thursday morning).</p>
<p>Please remember to join!</p>
<p>Have a great day!</p>`,
              text_content: `Dear Team Members,

This is a friendly reminder that {name} is scheduled to bring breakfast for the team on {date} (Thursday morning).

Please remember to join!

Have a great day!`,
              userId,
            })
            .select()
            .maybeSingle();
          
          if (teamError) throw teamError;
          if (teamData) setTeamTemplate(teamData as EmailTemplate);
          console.log('Team template created');
        }
      } catch (err) {
        console.error('Error creating default templates:', err);
        setError('Failed to create default templates');
      } finally {
        // 完成后移除Promise缓存
        delete templateCreatePromise[cacheKey];
      }
    })();
    
    return templateCreatePromise[cacheKey];
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
            userId: getUserId(),
          })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        if (data) setHostTemplate(data as EmailTemplate);
        console.log('Host template created:', data);
      } else {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
            updated_at: new Date().toISOString(),
            userId: getUserId(),
          })
          .eq('id', hostTemplate.id)
          .select()
          .maybeSingle();
        
        if (error) throw error;
        if (data) setHostTemplate(data as EmailTemplate);
        console.log('Host template updated:', data);
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
            userId: getUserId(),
          })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        if (data) setTeamTemplate(data as EmailTemplate);
        console.log('Team template created:', data);
      } else {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            subject,
            html_content: htmlContent,
            text_content: textContent || null,
            updated_at: new Date().toISOString(),
            userId: getUserId(),
          })
          .eq('id', teamTemplate.id)
          .select()
          .maybeSingle();
        
        if (error) throw error;
        if (data) setTeamTemplate(data as EmailTemplate);
        console.log('Team template updated:', data);
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