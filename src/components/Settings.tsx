import { useState, useEffect } from 'react';
import { Personnel, HostSchedule } from '../types/types';
import { supabase } from '../lib/supabase';
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { useEmailTemplate } from '../hooks/useEmailTemplate';
import { getUserId } from '../lib/userIdUtils';
import { useTeamInfo } from '../hooks/useTeamInfo';

interface SettingsProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  personnel: Personnel[];
  schedule: HostSchedule[];
  fetchData: () => Promise<void>;
}

export default function Settings({ 
  showSettings, 
  // setShowSettings, 
  personnel, 
  schedule,
  fetchData
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('export');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailTemplate, setEmailTemplate] = useState<string>('');
  const [teamEmailSubject, setTeamEmailSubject] = useState<string>('');
  const [teamEmailTemplate, setTeamEmailTemplate] = useState<string>('');
  
  // Use the email template hook
  const { 
    hostTemplate, 
    teamTemplate, 
    loading: templateLoading, 
    error: templateError,
    updateHostTemplate,
    updateTeamTemplate,
    resetTemplates
  } = useEmailTemplate();

  // Use the team info hook for notification settings
  const {
    teamInfo,
    loading: teamLoading,
    error: teamError,
    toggleTeamNotifications,
    toggleHostNotifications
  } = useTeamInfo();

  // Load templates from database on component mount
  useEffect(() => {
    if (hostTemplate) {
      setEmailSubject(hostTemplate.subject);
      setEmailTemplate(hostTemplate.html_content);
    }
    
    if (teamTemplate) {
      setTeamEmailSubject(teamTemplate.subject);
      setTeamEmailTemplate(teamTemplate.html_content);
    }
  }, [hostTemplate, teamTemplate]);

  // Get the next Thursday date
  const getNextThursday = (): CalendarDate => {
    let nextThursday = today(getLocalTimeZone());
    while (nextThursday.toDate(getLocalTimeZone()).getDay() !== 4) { // 0 is Sunday, 4 is Thursday
      const nextDate = nextThursday.toDate(getLocalTimeZone());
      nextDate.setDate(nextDate.getDate() + 1);
      nextThursday = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    }
    return nextThursday;
  };

  // Export data functionality
  const exportData = () => {
    const data = {
      personnel,
      schedule
    };
    
    // Create a Blob object
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and simulate click
    const a = document.createElement('a');
    a.href = url;
    a.download = `treating-calendar-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();

    alert('Data exported successfully!');
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data functionality
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.personnel || !data.schedule) {
        throw new Error('Invalid data format');
      }

      const currentUserId = getUserId();

      // Clear existing data - ONLY for the current user
      await supabase.from('personnel').delete().eq('userId', currentUserId).neq('id', '0');
      await supabase.from('host_schedule').delete().eq('userId', currentUserId).neq('id', '0');
      
      // Import personnel data
      for (const person of data.personnel) {
        await supabase.from('personnel').insert({
          ...person,
          userId: currentUserId
        });
      }
      
      // Import schedule data
      for (const item of data.schedule) {
        await supabase.from('host_schedule').insert({
          ...item,
          userId: currentUserId
        });
      }
      
      // Refresh data
      await fetchData();
      
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed! Please ensure the JSON format is correct.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  // Save email template
  const saveEmailTemplate = async () => {
    try {
      // Update host template in database
      await updateHostTemplate(emailSubject, emailTemplate);
      
      // Update team template in database
      await updateTeamTemplate(teamEmailSubject, teamEmailTemplate);
      
      alert('Email templates saved successfully!');
    } catch (error) {
      console.error('Save template error:', error);
      alert('Failed to save templates!');
    }
  };

  // Reset email template
  const resetEmailTemplate = async () => {
    try {
      await resetTemplates();
      alert('Templates reset to default successfully!');
    } catch (error) {
      console.error('Reset template error:', error);
      alert('Failed to reset templates!');
    }
  };

  // Handle team notification toggle
  const handleTeamNotificationToggle = async (enabled: boolean) => {
    await toggleTeamNotifications(enabled);
  };

  // Handle host notification toggle
  const handleHostNotificationToggle = async (enabled: boolean) => {
    await toggleHostNotifications(enabled);
  };

  // If settings not shown, don't render anything
  if (!showSettings) return null;

  // Get next Thursday for template preview
  const nextThursday = getNextThursday();

  return (
    <div className="mt-4 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-wrap border-b">
        <button 
          className={`px-3 py-2 md:px-5 md:py-3 font-medium text-xs md:text-sm ${activeTab === 'export' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('export')}
        >
          Export/Import
        </button>
        <button 
          className={`px-3 py-2 md:px-5 md:py-3 font-medium text-xs md:text-sm ${activeTab === 'templates' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('templates')}
        >
          Email Templates
        </button>
        <button 
          className={`px-3 py-2 md:px-5 md:py-3 font-medium text-xs md:text-sm ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notification Settings
        </button>
      </div>
      
      <div className="p-3 md:p-5">
        {activeTab === 'export' && (
          <div>
            <h3 className="font-medium text-base md:text-lg mb-3">Export/Import Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Export Data</h4>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  Download all personnel and schedule data as a JSON file for backup.
                </p>
                <button 
                  className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium"
                  onClick={exportData}
                >
                  Export to JSON
                </button>
              </div>
              <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Import Data</h4>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  Restore data from a previously exported JSON file.
                </p>
                <label className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center cursor-pointer text-sm font-medium">
                  <span>Select JSON File</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".json"
                    onChange={importData}
                  />
                </label>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <strong>Note:</strong> Importing data will replace all current data. Please export a backup first.
            </div>
          </div>
        )}
        
        {activeTab === 'templates' && (
          <div>
            <h3 className="font-medium text-base md:text-lg mb-3">Email Templates</h3>
            
            {templateLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : templateError ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                Error loading templates: {templateError}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Host Notification Subject
                  </label>
                  <input 
                    type="text"
                    className="w-full border rounded-md p-2 text-sm"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject line"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Host Notification Template (HTML)
                  </label>
                  <textarea 
                    className="w-full border rounded-md p-2 h-32 md:h-40 text-sm"
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Team Notification Subject
                  </label>
                  <input 
                    type="text"
                    className="w-full border rounded-md p-2 text-sm"
                    value={teamEmailSubject}
                    onChange={(e) => setTeamEmailSubject(e.target.value)}
                    placeholder="Email subject line"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Team Notification Template (HTML)
                  </label>
                  <textarea 
                    className="w-full border rounded-md p-2 h-32 md:h-40 text-sm"
                    value={teamEmailTemplate}
                    onChange={(e) => setTeamEmailTemplate(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Available Variables
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <ul className="text-xs md:text-sm space-y-1">
                        <li><code>{'{name}'}</code> - Person's name</li>
                        <li><code>{'{date}'}</code> - Treating date</li>
                        <li><code>{'{email}'}</code> - Person's email</li>
                        <li><code>{'{team}'}</code> - Team name</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50 text-xs md:text-sm">
                      <p className="font-medium mb-2">Host Template:</p>
                      <p className="text-xs text-gray-500 mb-1">Subject: {emailSubject
                        .replace('{name}', 'John Doe')
                        .replace('{date}', nextThursday.toString())
                        .replace('{email}', 'john.doe@example.com')
                        .replace('{team}', 'Development Team')}</p>
                      <div className="border-t pt-2 mt-1" dangerouslySetInnerHTML={{
                        __html: emailTemplate
                          .replace('{name}', 'John Doe')
                          .replace('{date}', nextThursday.toString())
                          .replace('{email}', 'john.doe@example.com')
                          .replace('{team}', 'Development Team')
                      }} />
                      
                      <p className="font-medium mt-4 mb-2">Team Template:</p>
                      <p className="text-xs text-gray-500 mb-1">Subject: {teamEmailSubject
                        .replace('{name}', 'John Doe')
                        .replace('{date}', nextThursday.toString())
                        .replace('{email}', 'john.doe@example.com')
                        .replace('{team}', 'Development Team')}</p>
                      <div className="border-t pt-2 mt-1" dangerouslySetInnerHTML={{
                        __html: teamEmailTemplate
                          .replace('{name}', 'John Doe')
                          .replace('{date}', nextThursday.toString())
                          .replace('{email}', 'john.doe@example.com')
                          .replace('{team}', 'Development Team')
                      }} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button 
                    className="px-3 py-1 border rounded-md text-sm"
                    onClick={resetEmailTemplate}
                  >
                    Reset to Default
                  </button>
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium"
                    onClick={saveEmailTemplate}
                  >
                    Save Templates
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 className="font-medium text-base md:text-lg mb-3">Notification Settings</h3>
            
            {/* {teamLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) :  */}
            {teamError ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                Error loading team information: {teamError}
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">About Automatic Notifications</h4>
                  <p className="text-xs md:text-sm text-blue-700">
                    Our system sends automatic notifications every Wednesday at 9:00 AM to remind the treating person 
                    and all team members about the upcoming Thursday treating session.
                    You can control whether this feature is enabled below.
                  </p>
                </div>

                <div className="border rounded-lg p-3 md:p-4 bg-gray-50 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Team Notifications</h4>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        {teamInfo?.teamNotificationsEnabled 
                          ? 'Automatic team notifications are enabled. The system will send notifications to all team members every Wednesday.' 
                          : 'Automatic team notifications are disabled. The system will not send automatic notifications to team members.'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-xs md:text-sm text-gray-600">
                        {teamInfo?.teamNotificationsEnabled ? 'On' : 'Off'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={teamInfo?.teamNotificationsEnabled === true}
                          onChange={(e) => handleTeamNotificationToggle(e.target.checked)}
                        />
                        <div className="w-9 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-3 md:p-4 bg-gray-50 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Host Notifications</h4>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        {teamInfo?.hostNotificationsEnabled 
                          ? 'Automatic host notifications are enabled. The system will send notifications to the treating host every Wednesday.' 
                          : 'Automatic host notifications are disabled. The system will not send automatic notifications to the treating host.'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-xs md:text-sm text-gray-600">
                        {teamInfo?.hostNotificationsEnabled ? 'On' : 'Off'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={teamInfo?.hostNotificationsEnabled === true}
                          onChange={(e) => handleHostNotificationToggle(e.target.checked)}
                        />
                        <div className="w-9 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                  <strong>Note:</strong> Even with automatic notifications disabled, you can still manually send notifications from the calendar page.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 