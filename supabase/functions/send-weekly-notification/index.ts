// @ts-nocheck - Ignore all TS errors in this file

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// This function will be called automatically or via scheduler
serve(async (req) => {
  try {
    // Parse request body if coming from scheduler with authentication
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    // Simple authentication for increased security (you should set this as a secret in Supabase)
    const API_KEY = Deno.env.get('FUNCTION_SECRET_KEY') || '';
    if (authHeader !== `Bearer ${API_KEY}` && !body.isScheduledExecution) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if force resend is enabled
    const forceResend = body.forceResend === true;
    // Check if test mode is enabled
    const isTest = body.isTest === true;
    
    console.log(`Running mode: ${isTest ? 'Test' : 'Normal'}, Force resend: ${forceResend}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize Resend for email
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const resend = new Resend(resendApiKey);
    
    // App URL for email links
    const appUrl = Deno.env.get('APP_URL') || 'https://treating.ruit.me';

    // Get current date (UTC)
    const now = new Date();
    
    // Calculate next Thursday date
    let nextThursday = new Date();
    nextThursday.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
    
    // Format date as YYYY-MM-DD
    const dateStr = nextThursday.toISOString().split('T')[0];
    
    console.log(`Next Thursday date: ${dateStr}`);
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('userId, teamName, teamNotificationsEnabled, hostNotificationsEnabled');
    
    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`);
    }
    
    console.log(`Found ${teams.length} teams`);
    
    let teamNotificationsSent = 0;
    let hostNotificationsSent = 0;
    let errors = [];
    
    // Process each team
    for (const team of teams) {
      try {
        console.log(`Processing team: ${team.userId} (${team.teamName || 'Unknown'}) ${isTest ? '(Test)' : ''} ${forceResend ? '(Force Resend)' : ''}`);
        console.log(`Team notifications enabled: ${team.teamNotificationsEnabled}, Host notifications enabled: ${team.hostNotificationsEnabled}`);
        
        // Check if both notifications are disabled (unless force resend)
        if (team.teamNotificationsEnabled === false && team.hostNotificationsEnabled === false && !forceResend) {
          console.log(`Team ${team.userId} has disabled all notifications, skipping`);
          continue;
        }
        
        // Find treating person for the next Thursday
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('host_schedule')
          .select('*, personnel(name, email)')
          .eq('userId', team.userId)
          .eq('date', dateStr)
          .maybeSingle();
        
        if (scheduleError && scheduleError.code !== 'PGRST116') {
          throw new Error(`Error fetching schedule for team ${team.userId}: ${scheduleError.message}`);
        }
        
        if (!scheduleData) {
          console.log(`No schedule found for team ${team.userId} on ${dateStr}`);
          continue;
        }
        
        // Get treating person info
        const treatingPerson = scheduleData.personnel;
        if (!treatingPerson || !treatingPerson.email) {
          console.log(`No treating person or email found for team ${team.userId} on ${dateStr}`);
          continue;
        }

        console.log(`Treating person: ${treatingPerson.name} (${treatingPerson.email})`);
        console.log(`Team Notified: ${scheduleData.teamNotified}, Host Notified: ${scheduleData.hostNotified}`);
        console.log(`--------------------------------------------------------------------------------------------------------------------------`)

        
        // Format date for display
        const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // ------------------------------------------------------------------
        // Send host notification (to the treating person)
        // ------------------------------------------------------------------
        
        // Check if host notification needs to be sent and is enabled
        if ((team.hostNotificationsEnabled || forceResend) && 
            (!scheduleData.hostNotified || forceResend)) {
          console.log(`Sending host notification to ${treatingPerson.name}`);
          
          // Get host notification template
          const { data: hostTemplateData, error: hostTemplateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('userId', team.userId)
            .eq('template_type', 'host_notification')
            .maybeSingle();
            
          // If no template found, use generic content
          let hostSubject = 'Your Thursday Treating Reminder';
          let hostContent = `<p>This is a reminder that you will be treating this Thursday ({date}).</p>`;
          
          if (hostTemplateData && !hostTemplateError) {
            hostSubject = hostTemplateData.subject;
            hostContent = hostTemplateData.html_content;
          }
          
          // Replace template variables
          hostSubject = hostSubject
            .replace('{name}', treatingPerson.name)
            .replace('{date}', formattedDate)
            .replace('{email}', treatingPerson.email)
            .replace('{team}', team.teamName || 'Development Team');
            
          hostContent = hostContent
            .replace('{name}', treatingPerson.name)
            .replace('{date}', formattedDate)
            .replace('{email}', treatingPerson.email)
            .replace('{team}', team.teamName || 'Development Team');

          // Create HTML email for host
          const hostHtmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${hostSubject}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6;
                  color: #333333;
                  margin: 0;
                  padding: 0;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px;
                }
                .header { 
                  background-color: #f8f9fa;
                  padding: 20px;
                  text-align: center;
                  border-bottom: 1px solid #eeeeee;
                }
                .content { 
                  padding: 20px; 
                  background-color: #ffffff;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  margin: 20px 0;
                  background-color: #4a76a8;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                }
                .footer { 
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #999999;
                  background-color: #f8f9fa;
                  border-top: 1px solid #eeeeee;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>${hostSubject}</h2>
                </div>
                <div class="content">
                  ${hostContent}
                  <div style="text-align: center;">
                    <a href="${appUrl}?teamId=${team.userId}" class="button">View Calendar</a>
                  </div>
                </div>
                <div class="footer">
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          // Create plain text version for host
          const hostTextContent = `
  ${hostSubject}

  ${hostContent.replace(/<[^>]*>/g, '')}

  View Calendar: ${appUrl}?teamId=${team.userId}

  This is an automated notification. Please do not reply to this email.
          `;
          
          try {
            // Send email to host
            const hostEmailResult = await resend.emails.send({
              from: 'Thursday Treating <noreply@email.ruit.me>',
              to: treatingPerson.email,
              subject: hostSubject,
              html: hostHtmlContent,
              text: hostTextContent,
            });
            
            if (hostEmailResult.error) {
              throw new Error(`Failed to send host email: ${hostEmailResult.error.message}`);
            }
            
            console.log(`Host notification sent successfully`);
            
            // Update host notification status (only in non-test mode)
            if (!isTest) {
              const { error: hostUpdateError } = await supabase
                .from('host_schedule')
                .update({ hostNotified: true })
                .eq('id', scheduleData.id);
                
              if (hostUpdateError) {
                throw new Error(`Error updating host notification status: ${hostUpdateError.message}`);
              }
            }
            
            hostNotificationsSent++;
          } catch (hostEmailError) {
            console.error(`Failed to send host email: ${hostEmailError.message}`);
            errors.push({
              teamId: team.userId,
              error: hostEmailError.message
            });
          }
        } else {
          if (team.hostNotificationsEnabled === false && !forceResend) {
            console.log(`Host notifications disabled for team ${team.userId}, skipping`);
          } else {
            console.log(`Host ${treatingPerson.name} already notified`);
          }
        }

        // ------------------------------------------------------------------
        // Send team notification (to all team members)
        // ------------------------------------------------------------------
        
        // Check if team notification needs to be sent and is enabled
        if ((team.teamNotificationsEnabled || forceResend) && 
            (!scheduleData.teamNotified || forceResend)) {
          console.log(`Preparing to send team notification`);
          
          // Get team notification template
          const { data: teamTemplateData, error: teamTemplateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('userId', team.userId)
            .eq('template_type', 'team_notification')
            .maybeSingle();
            
          // If no template found, use generic content
          let teamSubject = 'Thursday Treating Reminder';
          let teamContent = `<p>This is a reminder that {name} will be treating this Thursday ({date}).</p>`;
          
          if (teamTemplateData && !teamTemplateError) {
            teamSubject = teamTemplateData.subject;
            teamContent = teamTemplateData.html_content;
          }
          
          // Replace template variables
          teamSubject = teamSubject
            .replace('{name}', treatingPerson.name)
            .replace('{date}', formattedDate)
            .replace('{email}', treatingPerson.email)
            .replace('{team}', team.teamName || 'Development Team');
            
          teamContent = teamContent
            .replace('{name}', treatingPerson.name)
            .replace('{date}', formattedDate)
            .replace('{email}', treatingPerson.email)
            .replace('{team}', team.teamName || 'Development Team');
        
          // Get all team members' emails
          const { data: teamMembers, error: membersError } = await supabase
            .from('personnel')
            .select('id, name, email')
            .eq('userId', team.userId);
            
          if (membersError) {
            throw new Error(`Error fetching team members for team ${team.userId}: ${membersError.message}`);
          }
          
          if (!teamMembers || teamMembers.length === 0) {
            console.log(`No team members found, skipping team notification`);
            continue;
          }
          
          const teamEmails = teamMembers.map(member => member.email).filter(Boolean);
          console.log(`Team members: ${teamMembers.length}, Valid emails: ${teamEmails.length}`);
          
          // If the team has no members with email, skip
          if (teamEmails.length === 0) {
            console.log(`No valid team member emails found, skipping team notification`);
            continue;
          }
          
          // Create HTML email for team
          const teamHtmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${teamSubject}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6;
                  color: #333333;
                  margin: 0;
                  padding: 0;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px;
                }
                .header { 
                  background-color: #f8f9fa;
                  padding: 20px;
                  text-align: center;
                  border-bottom: 1px solid #eeeeee;
                }
                .content { 
                  padding: 20px; 
                  background-color: #ffffff;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  margin: 20px 0;
                  background-color: #4a76a8;
                  color: #ffffff !important;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                }
                .footer { 
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #999999;
                  background-color: #f8f9fa;
                  border-top: 1px solid #eeeeee;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>${teamSubject}</h2>
                </div>
                <div class="content">
                  ${teamContent}
                  <div style="text-align: center;">
                    <a href="${appUrl}?teamId=${team.userId}" class="button">View Calendar</a>
                  </div>
                </div>
                <div class="footer">
                  <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          // Create plain text version for team
          const teamTextContent = `
  ${teamSubject}

  ${teamContent.replace(/<[^>]*>/g, '')}

  View Calendar: ${appUrl}?teamId=${team.userId}

  This is an automated notification. Please do not reply to this email.
          `;
          
          try {
            // Send email to team
            const teamEmailResult = await resend.emails.send({
              from: 'Thursday Treating <noreply@email.ruit.me>',
              to: teamEmails,
              subject: teamSubject,
              html: teamHtmlContent,
              text: teamTextContent,
            });
            
            if (teamEmailResult.error) {
              throw new Error(`Failed to send team email: ${teamEmailResult.error.message}`);
            }
            
            console.log(`Team notification sent successfully`);
            
            // Update team notification status (only in non-test mode)
            if (!isTest) {
              const { error: teamUpdateError } = await supabase
                .from('host_schedule')
                .update({ teamNotified: true })
                .eq('id', scheduleData.id);
                
              if (teamUpdateError) {
                throw new Error(`Error updating team notification status: ${teamUpdateError.message}`);
              }
            }
            
            teamNotificationsSent++;
          } catch (teamEmailError) {
            console.error(`Failed to send team email: ${teamEmailError.message}`);
            errors.push({
              teamId: team.userId,
              error: teamEmailError.message
            });
          }
        } else {
          if (team.teamNotificationsEnabled === false && !forceResend) {
            console.log(`Team notifications disabled for team ${team.userId}, skipping`);
          } else {
            console.log(`Team already notified`);
          }
        }
        
      } catch (teamError) {
        console.error(`Error processing team ${team.userId}:`, teamError);
        errors.push({
          teamId: team.userId,
          error: teamError.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        hostNotificationsSent,
        teamNotificationsSent,
        errors,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in weekly notification function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 