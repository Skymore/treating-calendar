import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamInfo } from '../types/types';
import { getUserId, setUserIdToUrl } from '../lib/userIdUtils';
import { useAuth } from '../contexts/AuthContext';
import { showNotification } from '../utils/notification';

export function useTeamInfo() {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch team information from database
  const fetchTeamInfo = async (userId: string) => {
    setLoading(true);
    try {
      // Query teams table
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) {
        // If error is due to no record found, don't treat as error
        if (error.code === 'PGRST116') {
          setTeamInfo(null);
        } else {
          console.error('Failed to get team information:', error);
          setError(error.message);
        }
      } else {
        setTeamInfo(data);
        // Save team name to localStorage for display
        localStorage.setItem('treating_calendar_team_name', data.teamName);
      }
    } catch (err) {
      console.error('Error while fetching team information:', err);
      setError('Failed to get team information, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Check if the current user is the creator of the team
  const isTeamCreator = async (teamId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('team_creators')
        .select('*')
        .eq('team_id', teamId)
        .eq('auth_user_id', user.id)
        .single();
      
      if (error || !data) return false;
      return true;
    } catch (err) {
      console.error('Error checking team creator status:', err);
      return false;
    }
  };

  // Link the current authenticated user with a team
  const linkUserToTeam = async (teamId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if link already exists
      const { data: existingLink } = await supabase
        .from('team_creators')
        .select('*')
        .eq('team_id', teamId)
        .single();
      
      // If no creator is linked yet, link the current user
      if (!existingLink) {
        const { error } = await supabase
          .from('team_creators')
          .insert([{
            team_id: teamId,
            auth_user_id: user.id,
            created_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error('Failed to link user to team:', error);
          return false;
        }
        
        return true;
      } else {
        // Team already has a creator
        return existingLink.auth_user_id === user.id;
      }
    } catch (err) {
      console.error('Error linking user to team:', err);
      return false;
    }
  };

  // Toggle team notifications setting
  const toggleTeamNotifications = async (enabled: boolean) => {
    const userId = getUserId();
    setLoading(true);
    try {
      // Check if user is the team creator
      if (user) {
        const isCreator = await isTeamCreator(userId);
        if (!isCreator) {
          showNotification('Only the team creator can modify notification settings', 'error');
          return;
        }
      } else {
        showNotification('You need to sign in to modify settings', 'error');
        return;
      }

      const { error } = await supabase
        .from('teams')
        .update({ teamNotificationsEnabled: enabled })
        .eq('userId', userId);

      if (error) throw error;

      // Update local state
      setTeamInfo(prev => prev ? { ...prev, teamNotificationsEnabled: enabled } : null);
      showNotification(`Automatic team notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
      console.log(`Automatic team notifications ${enabled ? 'enabled' : 'disabled'} for team: ${userId}`);
    } catch (err) {
      console.error('Failed to update team notification settings:', err);
      setError('Failed to update team notification settings, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Toggle host notifications setting
  const toggleHostNotifications = async (enabled: boolean) => {
    const userId = getUserId();
    setLoading(true);
    try {
      // Check if user is the team creator
      if (user) {
        const isCreator = await isTeamCreator(userId);
        if (!isCreator) {
          showNotification('Only the team creator can modify notification settings', 'error');
          return;
        }
      } else {
        showNotification('You need to sign in to modify settings', 'error');
        return;
      }

      const { error } = await supabase
        .from('teams')
        .update({ hostNotificationsEnabled: enabled })
        .eq('userId', userId);

      if (error) throw error;

      // Update local state
      setTeamInfo(prev => prev ? { ...prev, hostNotificationsEnabled: enabled } : null);
      showNotification(`Automatic host notifications ${enabled ? 'enabled' : 'disabled'}`, 'success');
      console.log(`Automatic host notifications ${enabled ? 'enabled' : 'disabled'} for team: ${userId}`);
    } catch (err) {
      console.error('Failed to update host notification settings:', err);
      setError('Failed to update host notification settings, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Create or update team information
  const saveTeamInfo = async (teamName: string) => {
    const userId = getUserId();
    setLoading(true);
    try {
      // Check if team info already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('userId', userId)
        .single();

      if (existingTeam) {
        // Check if user is the team creator before updating
        if (user) {
          const isCreator = await isTeamCreator(userId);
          if (!isCreator) {
            showNotification('Only the team creator can modify team information', 'error');
            setLoading(false);
            return;
          }
        } else {
          showNotification('You need to sign in to modify team information', 'error');
          setLoading(false);
          return;
        }

        // Update existing team info
        console.log('Updating existing team:', userId, teamName);
        const { error } = await supabase
          .from('teams')
          .update({ teamName })
          .eq('userId', userId);

        if (error) throw error;
      } else {
        // Create new team info
        console.log('Creating new team:', userId, teamName);
        const newTeam: TeamInfo = {
          userId,
          teamName,
          createdAt: new Date().toISOString(),
          teamNotificationsEnabled: false, // Default to disabled for new teams
          hostNotificationsEnabled: false  // Default to disabled for new teams
        };

        const { error } = await supabase
          .from('teams')
          .insert([newTeam]);

        if (error) throw error;
      }

      // If user is authenticated, link them as the team creator
      if (user) {
        await linkUserToTeam(userId);
      }

      // Update local state
      localStorage.setItem('treating_calendar_team_name', teamName);
      setTeamInfo(prev => {
        return {
          userId,
          teamName,
          createdAt: prev?.createdAt || new Date().toISOString(),
          teamNotificationsEnabled: prev?.teamNotificationsEnabled !== undefined ? prev.teamNotificationsEnabled : false,
          hostNotificationsEnabled: prev?.hostNotificationsEnabled !== undefined ? prev.hostNotificationsEnabled : false
        };
      });
      
      showNotification('Team information saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save team information:', err);
      setError('Failed to save team information, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Initialize - get team info when component mounts
  useEffect(() => {
    const userId = getUserId();
    console.log('useTeamInfo userId:', userId);
    
    // Ensure URL contains correct team ID
    setUserIdToUrl(userId);
    
    // Fetch team info from database
    fetchTeamInfo(userId);
  }, []);

  return {
    teamInfo,
    loading,
    error,
    saveTeamInfo,
    fetchTeamInfo,
    toggleTeamNotifications,
    toggleHostNotifications,
    isTeamCreator,
    linkUserToTeam
  };
} 