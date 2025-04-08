import { useState } from 'react';
import { sendEmail, createNotificationEmail, EmailParams } from '../lib/emailService';

interface UseEmailNotificationReturn {
  /**
   * Send a notification email
   * @param to Email recipient(s)
   * @param subject Email subject
   * @param content Email content (can be HTML)
   * @param buttonText Optional call-to-action button text
   * @param buttonUrl Optional call-to-action button URL
   * @returns Promise with the result of the email sending operation
   */
  sendNotification: (
    to: string | string[],
    subject: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string
  ) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  /**
   * Send a custom email with full control over the email parameters
   * @param params Email parameters object
   * @returns Promise with the result of the email sending operation
   */
  sendCustomEmail: (
    params: EmailParams
  ) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  /**
   * Loading state while sending email
   */
  loading: boolean;
  
  /**
   * Last error message if email sending failed
   */
  error: string | null;
  
  /**
   * Reset the error state
   */
  resetError: () => void;
}

/**
 * Hook for sending email notifications
 * @returns Object with functions and state for sending emails
 */
export function useEmailNotification(): UseEmailNotificationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a notification email with template
   */
  const sendNotification = async (
    to: string | string[],
    subject: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create email with template
      const emailParams = createNotificationEmail(
        to,
        subject,
        content,
        buttonText,
        buttonUrl
      );
      
      // Send the email
      const result = await sendEmail(emailParams);
      
      if (!result.success) {
        setError(result.error || '发送邮件失败');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送邮件时发生未知错误';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a custom email with full control over parameters
   */
  const sendCustomEmail = async (params: EmailParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sendEmail(params);
      
      if (!result.success) {
        setError(result.error || '发送邮件失败');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送邮件时发生未知错误';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset error state
   */
  const resetError = () => {
    setError(null);
  };

  return {
    sendNotification,
    sendCustomEmail,
    loading,
    error,
    resetError
  };
} 